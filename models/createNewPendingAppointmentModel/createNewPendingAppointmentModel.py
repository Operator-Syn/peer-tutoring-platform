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

    @staticmethod
    def get_tutor_from_vacant(vacant_id):
        """
        Helper: Finds the tutor_id associated with a specific vacant slot.
        Used to send notifications to the correct tutor.
        """
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                query = "SELECT tutor_id FROM availability WHERE vacant_id = %s"
                cur.execute(query, (vacant_id,))
                result = cur.fetchone()
                return result[0] if result else None
        except Exception as e:
            print(f"Error fetching tutor for vacant_id {vacant_id}: {e}")
            return None
        finally:
            conn.close()

    @classmethod
    def create(cls, vacant_id, tutee_id, course_code, appointment_date):
        """
        Validates data against the DB and inserts a new appointment.
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

            # 3. LOGIC CHECKS 
            
            # Check A: Is the slot already successfully BOOKED?
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

        except IntegrityError as e:
            conn.rollback()
            if "unique_request_per_student" in str(e):
                raise ValueError("You already have a pending request for this slot.")
            elif "unique_confirmed_booking" in str(e):
                raise ValueError("This slot was just booked by someone else.")
            else:
                raise e 

        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cur.close()
            conn.close()