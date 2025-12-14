from dataclasses import dataclass
from psycopg2.extras import RealDictCursor
from utils.db import get_connection

@dataclass
class PendingAppointment:
    vacant_id: int
    tutee_id: str
    course_code: str
    appointment_date: str
    status: str = "PENDING"

    @staticmethod
    def get_tutee_id_by_google_id(google_id):
        """Fetches the tutee's ID number using their Google ID."""
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        try:
            cur.execute("SELECT id_number FROM tutee WHERE google_id = %s LIMIT 1;", (google_id,))
            result = cur.fetchone()
            return result["id_number"] if result else None
        finally:
            cur.close()
            conn.close()

    @classmethod
    def create(cls, vacant_id, tutee_id, course_code, appointment_date):
        """
        Validates data against the DB and inserts a new appointment.
        Raises ValueError if validation fails.
        Returns the new appointment_id.
        """
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        try:
            # 1. Validate Vacant Slot Exists
            cur.execute("SELECT 1 FROM availability WHERE vacant_id = %s;", (vacant_id,))
            if not cur.fetchone():
                raise ValueError("Vacant slot not found")

            # 2. Validate Course Exists
            cur.execute("SELECT 1 FROM course WHERE course_code = %s;", (course_code,))
            if not cur.fetchone():
                raise ValueError("Invalid course code")

            # 3. Check for Duplicates (Double Booking prevention)
            cur.execute("""
                SELECT 1 FROM appointment 
                WHERE vacant_id = %s AND appointment_date = %s AND status IN ('BOOKED', 'PENDING');
            """, (vacant_id, appointment_date))
            
            if cur.fetchone():
                raise ValueError("This slot is already booked or pending for the selected date")

            # 4. Insert Record
            cur.execute("""
                INSERT INTO appointment (
                    vacant_id, tutee_id, course_code, appointment_date, status
                ) VALUES (%s, %s, %s, %s, 'PENDING')
                RETURNING appointment_id;
            """, (vacant_id, tutee_id, course_code, appointment_date))

            new_id = cur.fetchone()["appointment_id"]
            conn.commit()
            return new_id

        except Exception as e:
            conn.rollback()
            raise e  # Re-raise to be caught by controller
        finally:
            cur.close()
            conn.close()