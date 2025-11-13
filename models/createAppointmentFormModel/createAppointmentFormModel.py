from dataclasses import dataclass
from typing import List, Optional

@dataclass
class Program:
    program_code: str
    program_name: str

@dataclass
class Course:
    course_code: str
    course_name: str

@dataclass
class TuteeProfile:
    id_number: str
    first_name: str
    middle_name: Optional[str]
    last_name: str
    year_level: int
    program_code: str

@dataclass
class FillOutData:
    tutee: TuteeProfile
    programs: List[Program]
    courses: List[Course]
