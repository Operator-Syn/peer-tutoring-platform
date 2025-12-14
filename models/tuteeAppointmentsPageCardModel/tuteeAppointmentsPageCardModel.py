from dataclasses import dataclass, field, asdict
from typing import List, Optional
from datetime import datetime
from psycopg2.extras import RealDictCursor
from utils.db import get_connection

@dataclass
class ModalContentItem:
    text: str
    role: str  # "Tutor" or "Tutee"
    url: Optional[str] = None

@dataclass
class AppointmentCard:
    subject_code: str
    tutor_name: str
    tutee_name: str
    appointment_date: str       # formatted for display
    start_time: str             # formatted for display
    end_time: str               # formatted for display
    modal_content: List[ModalContentItem]
    status: str
    footer: Optional[str] = field(init=False)

    def __post_init__(self):
        # 1. Handle non-BOOKED statuses
        if self.status in ("PENDING", "CANCELLED", "COMPLETED"):
            self.footer = f"APPOINTMENT {self.status}"
            return

        # 2. BOOKED → Compute remaining time logic
        try:
            appointment_dt = datetime.strptime(
                f"{self.appointment_date} {self.start_time}",
                "%B %d, %Y %I:%M %p"
            )
            delta = appointment_dt - datetime.now()
            total_seconds = delta.total_seconds()

            if total_seconds <= 0:
                self.footer = "Appointment started"
            else:
                days = int(total_seconds // 86400)
                hours = int((total_seconds % 86400) // 3600)
                minutes = int((total_seconds % 3600) // 60)
                
                if days > 0:
                    self.footer = f"{days}d {hours}h {minutes}m left before the appointment"
                else:
                    self.footer = f"{hours}h {minutes}m left before the appointment"
        except ValueError:
            self.footer = "Date Error"

    @classmethod
    def fetch_for_user(cls, google_id: str):
        """
        Fetches all appointments for the tutee associated with the given google_id.
        Returns a list of dicts ready for JSON serialization.
        """
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        try:
            # 1. Get Tutee ID
            cur.execute("SELECT id_number FROM tutee WHERE google_id = %s LIMIT 1;", (google_id,))
            tutee_res = cur.fetchone()
            if not tutee_res:
                return None  # Or raise an exception based on preference
            
            tutee_id = tutee_res["id_number"]

            # 2. Fetch Appointments
            query = """
                SELECT
                    a.appointment_id,
                    a.appointment_date,
                    a.status,
                    t.id_number AS tutor_id,
                    t.first_name || ' ' || COALESCE(t.middle_name,'') || ' ' || t.last_name AS tutor_name,
                    tu.id_number AS tutee_id,
                    tu.first_name || ' ' || COALESCE(tu.middle_name,'') || ' ' || tu.last_name AS tutee_name,
                    av.start_time,
                    av.end_time,
                    c.course_code
                FROM appointment a
                JOIN availability av ON a.vacant_id = av.vacant_id
                JOIN tutor tr ON av.tutor_id = tr.tutor_id
                JOIN tutee t ON tr.tutor_id = t.id_number
                JOIN tutee tu ON a.tutee_id = tu.id_number
                JOIN course c ON a.course_code = c.course_code
                WHERE a.tutee_id = %s
                ORDER BY a.appointment_date ASC, av.start_time ASC;
            """
            cur.execute(query, (tutee_id,))
            results = cur.fetchall()

            # 3. Transform Rows into Objects
            cards = []
            for row in results:
                # Format Dates/Times
                date_str = row['appointment_date'].strftime("%B %d, %Y")
                start_str = row['start_time'].strftime("%I:%M %p")
                end_str = row['end_time'].strftime("%I:%M %p")

                # Build Nested Modal Content
                modal_content = [
                    ModalContentItem(text=row['tutor_name'], role="Tutor", url=f"/tutor/{row['tutor_id']}"),
                    ModalContentItem(text=row['tutee_name'], role="Tutee")
                ]

                # Create Card
                card = cls(
                    subject_code=row['course_code'],
                    tutor_name=row['tutor_name'],
                    tutee_name=row['tutee_name'],
                    appointment_date=date_str,
                    start_time=start_str,
                    end_time=end_str,
                    modal_content=modal_content,
                    status=row["status"]
                )
                cards.append(asdict(card)) # Return as dict for JSON

            return cards

        finally:
            cur.close()
            conn.close()