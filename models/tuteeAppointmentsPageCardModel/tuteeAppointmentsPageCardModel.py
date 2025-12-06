from dataclasses import dataclass, field
from typing import List, Optional
from datetime import datetime

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
        # Handle non-BOOKED statuses directly
        if self.status in ("PENDING", "CANCELLED", "COMPLETED"):
            self.footer = f"APPOINTMENT {self.status}"
            return


        # BOOKED → compute remaining time
        appointment_dt = datetime.strptime(
            f"{self.appointment_date} {self.start_time}",
            "%B %d, %Y %I:%M %p"
        )
        delta = appointment_dt - datetime.now()
        total_seconds = delta.total_seconds()

        if total_seconds <= 0:
            self.footer = "Appointment started"
            return

        # Compute days / hours / minutes
        days = int(total_seconds // 86400)
        hours = int((total_seconds % 86400) // 3600)
        minutes = int((total_seconds % 3600) // 60)

        if days > 0:
            self.footer = f"{days}d {hours}h {minutes}m left before the appointment"
        else:
            self.footer = f"{hours}h {minutes}m left before the appointment"
