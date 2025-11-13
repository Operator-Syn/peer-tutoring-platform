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
        course = request.args.get('course', '').strip()
        availability = request.args.get('availability', '').strip().upper()  # Accepts e.g. 'MONDAY'
        name = request.args.get('name', '').strip()

        conn = get_connection()
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # Build base query and params
                base_query = """
                    SELECT t.* FROM tutor t
                    JOIN tutee ON t.tutor_id = tutee.id_number
                """
                joins = []
                wheres = ["t.status = 'ACTIVE'"]
                params = []

                if course:
                    joins.append("JOIN teaches te ON t.tutor_id = te.tutor_id")
                    wheres.append("te.course_code = %s")
                    params.append(course)
                if availability:
                    joins.append("JOIN availability a ON t.tutor_id = a.tutor_id")
                    wheres.append("a.day_of_week = %s")
                    params.append(availability.upper())
                if name:
                    wheres.append("(tutee.first_name ILIKE %s OR tutee.last_name ILIKE %s)")
                    params.extend([f"%{name}%", f"%{name}%"])

                # Combine query
                if joins:
                    base_query += " " + " ".join(joins)
                if wheres:
                    base_query += " WHERE " + " AND ".join(wheres)
                # Avoid duplicate tutors
                base_query += " GROUP BY t.tutor_id, tutee.last_name, tutee.first_name"
                base_query += " ORDER BY tutee.last_name ASC, tutee.first_name ASC"
                base_query += " LIMIT %s OFFSET %s"
                params.extend([per_page, offset])

                cursor.execute(base_query, params)
                tutors = cursor.fetchall()

                # Count query for pagination
                count_query = "SELECT COUNT(DISTINCT t.tutor_id) FROM tutor t JOIN tutee ON t.tutor_id = tutee.id_number"
                if joins:
                    count_query += " " + " ".join(joins)
                if wheres:
                    count_query += " WHERE " + " AND ".join(wheres)
                cursor.execute(count_query, params[:-2])  # Exclude LIMIT/OFFSET
                total_tutors = cursor.fetchone()['count']

                tutor_details = []
                for t in tutors:
                    cursor.execute("SELECT * FROM teaches WHERE tutor_id = %s", (t['tutor_id'],))
                    courses = [row['course_code'] for row in cursor.fetchall()]
                    cursor.execute("SELECT * FROM tutee WHERE id_number = %s", (t['tutor_id'],))
                    tutee_info = cursor.fetchone()
                    tutor_details.append({'tutorName': tutee_info['first_name'] + ' ' + tutee_info['last_name'], 'courses': courses, 'tutorId': t['tutor_id']})

                max_pages = (total_tutors + per_page - 1) // per_page

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