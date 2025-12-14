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
        """Compute display labels and JSON-safe time strings."""
        # Convert time objects to strings for formatting
        start_str = self.start_time.strftime("%I:%M %p")
        end_str = self.end_time.strftime("%I:%M %p")
        
        # Display labels
        self.formatted_time = f"{start_str} – {end_str}"
        self.label = f"{self.day_of_week.title()} | {self.formatted_time}"

        # Overwrite original fields with JSON-safe strings for the API response
        self.start_time = self.start_time.strftime("%H:%M:%S")
        self.end_time = self.end_time.strftime("%H:%M:%S")

    @classmethod
    def fetch_available_slots(cls, course_code: str, date_str: str):
        """
        Fetches available slots for a specific course on a specific date.
        Handles date parsing and SQL execution.
        """
        # 1. Parse Date & Get Day of Week
        try:
            appointment_dt = datetime.strptime(date_str, "%Y-%m-%d")
            day_of_week_name = appointment_dt.strftime("%A")  # e.g., 'Friday'
        except ValueError:
            raise ValueError("Invalid date format, expected YYYY-MM-DD")

        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

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
              AND av.vacant_id NOT IN (
                  SELECT a.vacant_id
                  FROM appointment a
                  WHERE a.status IN ('BOOKED')
                    AND a.appointment_date = %s
              )
            ORDER BY av.start_time;
        """

        try:
            cur.execute(query, [course_code, day_of_week_name, date_str])
            rows = cur.fetchall()
            
            # Convert rows to AvailabilityCard objects, then to dicts
            return [cls(**row).__dict__ for row in rows]
        
        finally:
            cur.close()
            conn.close()