from flask import Blueprint, jsonify, session
from psycopg2.extras import RealDictCursor
from utils.db import get_connection
from models.createAppointmentFormModel.createAppointmentFormModel import Program, TuteeProfile, Course, FillOutData

bp_fillout = Blueprint("fillout", __name__, url_prefix="/api")


def fetch_fillout_data(tutee_result, programs_result, courses_result):
    """Convert DB rows into FillOutData dataclass"""
    tutee = TuteeProfile(
        id_number=tutee_result["id_number"],
        first_name=tutee_result["first_name"],
        middle_name=tutee_result.get("middle_name"),
        last_name=tutee_result["last_name"],
        year_level=tutee_result["year_level"],
        program_code=tutee_result["program_code"]
    )

    programs = [
        Program(program_code=row["program_code"], program_name=row["program_name"])
        for row in programs_result
    ]

    courses = [
        Course(course_code=row["course_code"], course_name=row["course_name"])
        for row in courses_result
    ]

    data = FillOutData(tutee=tutee, programs=programs, courses=courses)
    return {
        "tutee": data.tutee.__dict__,
        "programs": [p.__dict__ for p in data.programs],
        "courses": [c.__dict__ for c in data.courses]
    }


@bp_fillout.route("/fillout")
def get_fillout_data():
    # --- Check Google login session ---
    user = session.get("user")
    if not user:
        return jsonify({"error": "User not authenticated"}), 401

    google_id = user.get("sub")
    if not google_id:
        return jsonify({"error": "User not authenticated"}), 401

    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # --- Fetch the tutee profile matching the Google ID ---
        cur.execute("""
            SELECT id_number, first_name, middle_name, last_name, year_level, program_code
            FROM tutee
            WHERE google_id = %s
            LIMIT 1;
        """, (google_id,))
        tutee_result = cur.fetchone()
        if not tutee_result:
            return jsonify({"error": "No tutee found for this Google account"}), 404

        # --- Fetch all programs ---
        cur.execute("""
            SELECT program_code, program_name
            FROM program
            ORDER BY program_name;
        """)
        programs_result = cur.fetchall()

        # --- Fetch all courses offered by tutors ---
        cur.execute("""
            SELECT DISTINCT c.course_code, c.course_name
            FROM teaches th
            JOIN course c ON th.course_code = c.course_code
            ORDER BY c.course_name;
        """)
        courses_result = cur.fetchall()

        # --- Build dataclasses and return ---
        response_data = fetch_fillout_data(tutee_result, programs_result, courses_result)
        return jsonify(response_data)

    except Exception as e:
        print("Error in /api/fillout:", e)
        return jsonify({"error": "Internal server error"}), 500

    finally:
        cur.close()
        conn.close()
