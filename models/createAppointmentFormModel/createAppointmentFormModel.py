from dataclasses import dataclass, asdict
from typing import List, Optional
from psycopg2.extras import RealDictCursor
from utils.db import get_connection

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

    @classmethod
    def fetch(cls, google_id: str):
        """
        Fetches tutee profile, available programs, and courses.
        Returns a FillOutData instance or None if tutee not found.
        """
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        try:
            # 1. Fetch Tutee Profile
            cur.execute("""
                SELECT id_number, first_name, middle_name, last_name, year_level, program_code
                FROM tutee
                WHERE google_id = %s
                LIMIT 1;
            """, (google_id,))
            tutee_res = cur.fetchone()

            if not tutee_res:
                return None

            # 2. Fetch Programs
            cur.execute("""
                SELECT program_code, program_name
                FROM program
                ORDER BY program_name;
            """)
            programs = [Program(**row) for row in cur.fetchall()]

            # 3. Fetch Courses (Only those offered by active tutors)
            cur.execute("""
                SELECT DISTINCT c.course_code, c.course_name
                FROM teaches th
                JOIN course c ON th.course_code = c.course_code
                ORDER BY c.course_name;
            """)
            courses = [Course(**row) for row in cur.fetchall()]

            # Return the populated dataclass
            return cls(
                tutee=TuteeProfile(**tutee_res), 
                programs=programs, 
                courses=courses
            )

        finally:
            cur.close()
            conn.close()

    def to_api_response(self):
        """Converts the dataclass tree into a JSON-serializable dictionary."""
        return asdict(self)