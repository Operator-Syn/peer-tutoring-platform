from dataclasses import dataclass, field
from typing import Optional
from datetime import time

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
        # JSON-safe string versions
        self.start_time = self.start_time.strftime("%H:%M:%S")
        self.end_time = self.end_time.strftime("%H:%M:%S")

        # Display labels
        start = time.fromisoformat(self.start_time).strftime("%I:%M %p")
        end = time.fromisoformat(self.end_time).strftime("%I:%M %p")
        self.formatted_time = f"{start} – {end}"
        self.label = f"{self.day_of_week.title()} | {self.formatted_time}"
