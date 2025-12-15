from dataclasses import dataclass, field
from datetime import datetime, time
from psycopg2.extras import RealDictCursor
from utils.db import get_connection

@dataclass
class AvailabilityCard:
    vacant_id: int
    tutor_id: str
    tutor_name: str
    course_code: str
    day_of_week: str
    start_time: time
    end_time: time
    formatted_time: str = field(init=False)
    label: str = field(init=False)

    def __post_init__(self):
        start_str = self.start_time.strftime("%I:%M %p")
        end_str = self.end_time.strftime("%I:%M %p")
        self.formatted_time = f"{start_str} – {end_str}"
        self.label = f"{self.day_of_week.title()} | {self.formatted_time}"
        self.start_time = self.start_time.strftime("%H:%M:%S")
        self.end_time = self.end_time.strftime("%H:%M:%S")

    @classmethod
    def _resolve_viewer_id(cls, email: str) -> str:
        """
        Internal Helper: Resolves an email to an ID by joining user_account + tutee.
        Only returns ID if the user is an ACTIVE TUTOR.
        """
        if not email:
            return None

        conn = get_connection()
        try:
            with conn.cursor() as cur:
                # 🚨 FIXED QUERY: Join user_account to get email, then link to tutee
                query = """
                    SELECT t.id_number, tr.status
                    FROM user_account ua
                    JOIN tutee t ON ua.google_id = t.google_id
                    LEFT JOIN tutor tr ON t.id_number = tr.tutor_id
                    WHERE ua.email = %s
                """
                cur.execute(query, (email,))
                row = cur.fetchone()

                if row:
                    db_id, tutor_status = row
                    # BUSINESS RULE: Only prevent self-booking if they are an ACTIVE TUTOR
                    if tutor_status == 'ACTIVE':
                        print(f"✅ [Model] User is Active Tutor. Hiding slots for ID: {db_id}")
                        return db_id
                    else:
                        print(f"ℹ️ [Model] User is {tutor_status}. Showing all slots.")
                else:
                    print(f"⚠️ [Model] Email {email} not found in user_account/tutee tables.")
                
                return None
        except Exception as e:
            print(f"❌ [Model] Error resolving user: {e}")
            return None
        finally:
            conn.close()

    @classmethod
    def fetch_available_slots(cls, course_code: str, date_str: str, user_email: str = None):
        """
        Main Business Logic:
        1. Resolve who the viewer is (via email).
        2. Fetch slots, excluding the viewer's own slots if applicable.
        """
        
        # 1. Resolve Viewer Identity
        viewer_id = cls._resolve_viewer_id(user_email)

        # 2. Parse Date
        try:
            appointment_dt = datetime.strptime(date_str, "%Y-%m-%d")
            day_of_week_name = appointment_dt.strftime("%A") 
        except ValueError:
            raise ValueError("Invalid date format, expected YYYY-MM-DD")

        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # 3. Main Query
        query = """
            SELECT
                av.vacant_id,
                tr.tutor_id,
                tt.first_name || ' ' || COALESCE(tt.middle_name || ' ', '') || tt.last_name AS tutor_name,
                th.course_code,
                av.day_of_week,
                av.start_time,
                av.end_time
            FROM teaches th
            JOIN tutor tr ON th.tutor_id = tr.tutor_id
            JOIN tutee tt ON tr.tutor_id = tt.id_number
            JOIN availability av ON tr.tutor_id = av.tutor_id
            WHERE th.course_code = %s
              AND tr.status = 'ACTIVE'
              AND UPPER(av.day_of_week) = UPPER(%s)
              
              -- 🛡️ SELF-BOOKING PROTECTION
              AND (
                  COALESCE(%s, '') = '' 
                  OR 
                  TRIM(tr.tutor_id) != TRIM(%s)
              )

              AND av.vacant_id NOT IN (
                  SELECT a.vacant_id
                  FROM appointment a
                  WHERE a.status = 'BOOKED'
                    AND a.appointment_date = %s
              )
            ORDER BY av.start_time;
        """

        try:
            cur.execute(query, [
                course_code, 
                day_of_week_name, 
                viewer_id, 
                viewer_id, 
                date_str
            ])
            rows = cur.fetchall()
            return [cls(**row).__dict__ for row in rows]
        
        finally:
            cur.close()
            conn.close()