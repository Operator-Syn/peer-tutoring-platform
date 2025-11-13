from dataclasses import dataclass

@dataclass
class PendingAppointment:
    vacant_id: int
    tutee_id: str
    course_code: str
    appointment_date: str  # ISO format: 'YYYY-MM-DD'
    status: str            # 'PENDING'