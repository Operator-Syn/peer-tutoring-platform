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
    footer: Optional[str] = field(init=False)

    def __post_init__(self):
        """Compute footer dynamically from current time to appointment start"""
        appointment_dt = datetime.strptime(
            f"{self.appointment_date} {self.start_time}", "%B %d, %Y %I:%M %p"
        )
        delta = appointment_dt - datetime.now()

        if delta.total_seconds() <= 0:
            self.footer = "Appointment started"
        else:
            hours, remainder = divmod(delta.total_seconds(), 3600)
            minutes = remainder // 60
            self.footer = f"{int(hours)}h {int(minutes)}m left before the appointment"
