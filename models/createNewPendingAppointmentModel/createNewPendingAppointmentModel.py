from dataclasses import dataclass
from psycopg2.extras import RealDictCursor
from psycopg2 import IntegrityError
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
        Raises ValueError for logic issues (caught as 400).
        Raises IntegrityError for DB constraint issues (caught as 500 or 409).
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

            # 3. LOGIC CHECKS (Updated to match your Schema)
            
            # Check A: Is the slot already successfully BOOKED by anyone?
            cur.execute("""
                SELECT 1 FROM appointment 
                WHERE vacant_id = %s AND appointment_date = %s AND status = 'BOOKED';
            """, (vacant_id, appointment_date))
            if cur.fetchone():
                raise ValueError("This slot has already been booked by another student.")

            # Check B: Did *THIS* student already send a request?
            cur.execute("""
                SELECT 1 FROM appointment 
                WHERE vacant_id = %s AND appointment_date = %s 
                AND tutee_id = %s AND status = 'PENDING';
            """, (vacant_id, appointment_date, tutee_id))
            if cur.fetchone():
                raise ValueError("You already have a pending request for this slot.")

            # 4. Insert Record (Safe to insert now)
            cur.execute("""
                INSERT INTO appointment (
                    vacant_id, tutee_id, course_code, appointment_date, status
                ) VALUES (%s, %s, %s, %s, 'PENDING')
                RETURNING appointment_id;
            """, (vacant_id, tutee_id, course_code, appointment_date))

            new_id = cur.fetchone()["appointment_id"]
            conn.commit()
            return new_id

        except IntegrityError as e:
            # This is a fallback in case a Race Condition happens 
            # (two people clicked 'Submit' at the EXACT same millisecond)
            conn.rollback()
            if "unique_request_per_student" in str(e):
                raise ValueError("You already have a pending request for this slot.")
            elif "unique_confirmed_booking" in str(e):
                raise ValueError("This slot was just booked by someone else.")
            else:
                raise e # Raise unexpected DB errors to the controller

        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cur.close()
            conn.close()