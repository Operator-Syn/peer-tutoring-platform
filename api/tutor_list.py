from flask import Blueprint, jsonify, request
from utils.db import get_connection
from psycopg2.extras import RealDictCursor

tutor_list = Blueprint('tutor_list', __name__)

@tutor_list.route("/all")
def get_tutor_list():
    try:
        page = int(request.args.get('page', 1))
        per_page = 9
        offset = (page - 1) * per_page
        course = request.args.get('course', '').strip().upper()

        conn = get_connection()
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:

                if course:  # <-- Added: filter by course if provided
                    cursor.execute(
                        """
                        SELECT t.* FROM tutor t
                        JOIN teaches te ON t.tutor_id = te.tutor_id
                        WHERE t.status = 'ACTIVE' AND te.course_code = %s
                        LIMIT %s OFFSET %s
                        """,
                        (course, per_page, offset)
                    )
                    tutors = cursor.fetchall()
                    print("DEBUG tutors with course filter:", tutors)  # Debugging line
                    cursor.execute(
                        """
                        SELECT COUNT(DISTINCT t.tutor_id) FROM tutor t
                        JOIN teaches te ON t.tutor_id = te.tutor_id
                        WHERE t.status = 'ACTIVE' AND te.course_code = %s
                        """,
                        (course,)
                    )
                else:

                    cursor.execute(
                        "SELECT * FROM tutor WHERE status = 'ACTIVE' LIMIT %s OFFSET %s",
                        (per_page, offset)
                    )
                    tutors = cursor.fetchall()
                    cursor.execute("SELECT COUNT(*) FROM tutor WHERE status = 'ACTIVE'")
                total_tutors = cursor.fetchone()['count']

                tutor_details = []
                for t in tutors:

                    cursor.execute("SELECT * FROM teaches WHERE tutor_id = %s", (t['tutor_id'],))
                    courses = [row['course_code'] for row in cursor.fetchall()]

                    cursor.execute("SELECT * FROM tutee WHERE id_number = %s", (t['tutor_id'],))
                    tutee_info = cursor.fetchone()
                    tutor_details.append({'tutorName': tutee_info['first_name'] + ' ' + tutee_info['last_name'], 'courses': courses})

                max_pages = (total_tutors + per_page - 1) // per_page  # ceiling division

            return jsonify({
                "tutors": tutor_details,
                "max_pages": max_pages
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@tutor_list.route("/courses")
def get_courses():
    try:
        search = request.args.get('search', '').strip()
        if not search:
            return jsonify({"courses": []})
        page = int(request.args.get('page', 1))
        per_page = 6
        offset = (page - 1) * per_page

        conn = get_connection()
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                if search:
                    cursor.execute(
                        "SELECT DISTINCT course_code FROM course WHERE course_code ILIKE %s ORDER BY course_code LIMIT %s OFFSET %s",
                        (f"%{search}%", per_page, offset)
                    )
                else:
                    cursor.execute(
                        "SELECT DISTINCT course_code FROM course ORDER BY course_code LIMIT %s OFFSET %s",
                        (per_page, offset)
                    )
                courses = [row['course_code'] for row in cursor.fetchall()]


        return jsonify({
            "courses": courses
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500