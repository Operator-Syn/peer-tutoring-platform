from flask import Blueprint, jsonify, request, session
from utils.db import get_connection
from psycopg2.extras import RealDictCursor
from math import ceil

admin_dashboard_bp = Blueprint("admin_dashboard", __name__)

def build_pagination_metadata(total_items, page, limit):
    return {
        "total_items": total_items,
        "total_pages": ceil(total_items / limit) if limit > 0 else 1,
        "current_page": page,
        "items_per_page": limit
    }

@admin_dashboard_bp.route("/api/tutor-applications/admin/applications", methods=["GET"])
def get_all_tutor_applications():
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 5))
        search = request.args.get("search", "").strip()
        status = request.args.get("status", "all")
        college = request.args.get("college", "all")
        year = request.args.get("year", "all")
        sort_by = request.args.get("sort_by", "date_desc")

        offset = (page - 1) * limit

        base_query = """
            FROM tutor_application ta
            JOIN tutee t ON ta.student_id = t.id_number
            LEFT JOIN application_courses ac ON ta.application_id = ac.application_id
        """
        
        where_clauses = []
        params = []

        if status != "all":
            where_clauses.append("ta.status = %s")
            params.append(status)
        
        if college != "all":
            where_clauses.append("t.program_code = %s")
            params.append(college)
            
        if year != "all":
            where_clauses.append("t.year_level = %s")
            params.append(int(year))

        if search:
            where_clauses.append("(t.first_name ILIKE %s OR t.last_name ILIKE %s OR t.id_number ILIKE %s)")
            wildcard = f"%{search}%"
            params.extend([wildcard, wildcard, wildcard])

        where_stmt = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""

        sort_mapping = {
            "date_desc": "ta.date_submitted DESC",
            "date_asc": "ta.date_submitted ASC",
            "name_asc": "t.last_name ASC",
            "name_desc": "t.last_name DESC",
            "college_asc": "t.program_code ASC",
            "college_desc": "t.program_code DESC",
            "year_asc": "t.year_level ASC",
            "year_desc": "t.year_level DESC",
        }
        order_by = sort_mapping.get(sort_by, "ta.date_submitted DESC")

        conn = get_connection()
        cur = conn.cursor()

        count_query = f"SELECT COUNT(DISTINCT ta.application_id) {base_query} {where_stmt}"
        cur.execute(count_query, params)
        total_items = cur.fetchone()[0]

        data_query = f"""
            SELECT 
                ta.application_id, ta.student_id, ta.status, ta.date_submitted, ta.cor_filename,
                t.first_name, t.middle_name, t.last_name, t.program_code, t.year_level,
                ARRAY_AGG(ac.course_code) FILTER (WHERE ac.course_code IS NOT NULL)
            {base_query}
            {where_stmt}
            GROUP BY ta.application_id, ta.student_id, t.id_number
            ORDER BY {order_by}
            LIMIT %s OFFSET %s
        """
        cur.execute(data_query, params + [limit, offset])
        
        applications = []
        for row in cur.fetchall():
            applications.append({
                "application_id": row[0],
                "student_id": row[1],
                "status": row[2],
                "date_submitted": row[3].isoformat() if row[3] else None,
                "cor_filename": row[4],
                "student_name": f"{row[5]} {row[6] or ''} {row[7]}".strip(),
                "program": row[8],
                "school_year": row[9],
                "courses": row[10] or []
            })

        cur.close()
        conn.close()

        return jsonify({
            "success": True,
            "data": applications,
            "pagination": build_pagination_metadata(total_items, page, limit)
        }), 200

    except Exception as e:
        print("Error:", e)
        return jsonify({"success": False, "error": str(e)}), 500

@admin_dashboard_bp.route("/api/tutor-applications/admin/users", methods=["GET"])
def get_all_users_for_admin():
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 5))
        search = request.args.get("search", "").strip()
        role = request.args.get("role", "all")
        status = request.args.get("status", "all")
        reported = request.args.get("reported", "all")
        sort_by = request.args.get("sort_by", "name_asc")
        
        offset = (page - 1) * limit
        
        where_clauses = []
        params = []

        if role != "all":
            where_clauses.append("ua.role = %s")
            params.append(role)
        
        if status != "all":
            where_clauses.append("ua.status = %s")
            params.append(status)

        if reported == "yes":
            where_clauses.append("(SELECT COUNT(*) FROM report r WHERE r.reported_id = t.id_number AND r.status = 'PENDING') > 0")
        elif reported == "no":
            where_clauses.append("(SELECT COUNT(*) FROM report r WHERE r.reported_id = t.id_number AND r.status = 'PENDING') = 0")

        if search:
            where_clauses.append("(ua.email ILIKE %s OR t.first_name ILIKE %s OR t.last_name ILIKE %s)")
            wildcard = f"%{search}%"
            params.extend([wildcard, wildcard, wildcard])

        where_stmt = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""

        sort_mapping = {
            "name_asc": "t.last_name ASC",
            "name_desc": "t.last_name DESC",
            "role_asc": "ua.role ASC",
            "role_desc": "ua.role DESC",
            "date_asc": "ua.last_login ASC",
            "date_desc": "ua.last_login DESC"
        }
        order_by = sort_mapping.get(sort_by, "t.last_name ASC")

        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        count_sql = f"""
            SELECT COUNT(*) 
            FROM user_account ua 
            LEFT JOIN tutee t ON ua.google_id = t.google_id
            {where_stmt}
        """
        cur.execute(count_sql, params)
        total_items = cur.fetchone()['count']

        sql = f"""
            SELECT 
                ua.google_id, ua.email, ua.role, ua.status, ua.status_note, ua.last_login,
                t.first_name, t.last_name,
                (SELECT COUNT(*) FROM report r WHERE r.reported_id = t.id_number AND r.status = 'PENDING') as pending_reports
            FROM user_account ua
            LEFT JOIN tutee t ON ua.google_id = t.google_id
            {where_stmt}
            ORDER BY {order_by}
            LIMIT %s OFFSET %s
        """
        cur.execute(sql, params + [limit, offset])
        users = cur.fetchall()

        for user in users:
            if user['last_login']:
                user['last_login'] = user['last_login'].strftime("%Y-%m-%d")
            if not user['status']:
                user['status'] = 'ACTIVE'

        cur.close()
        conn.close()

        return jsonify({
            "success": True,
            "users": users,
            "pagination": build_pagination_metadata(total_items, page, limit)
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@admin_dashboard_bp.route("/api/tutor-applications/admin/statistics", methods=["GET"])
def get_admin_statistics():
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM tutor_application")
        total_applications = cursor.fetchone()[0]

        cursor.execute("""
            SELECT 
                SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END),
                SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END),
                SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END)
            FROM tutor_application
        """)
        pending, approved, rejected = cursor.fetchone()

        cursor.execute("SELECT COUNT(*) FROM tutor")
        total_tutors = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM tutee")
        total_tutees = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM course")
        total_courses = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM appointment WHERE status IN ('PENDING', 'BOOKED')")
        active_sessions = cursor.fetchone()[0]

        statistics = {
            "total_applications": total_applications,
            "pending": pending or 0,
            "approved": approved or 0,
            "rejected": rejected or 0,
            "total_tutors": total_tutors,
            "total_tutees": total_tutees,
            "total_courses": total_courses,
            "active_sessions": active_sessions
        }

        cursor.close()
        conn.close()
        return jsonify({"statistics": statistics})

    except Exception as e:
        print("Error fetching statistics:", e)
        return jsonify({"error": str(e)}), 500

@admin_dashboard_bp.route("/api/tutor-applications/admin/applications/<int:application_id>/approve", methods=["POST"])
def approve_tutor_application(application_id):
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
    
        cursor.execute("SELECT student_id FROM tutor_application WHERE application_id = %s", (application_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"success": False, "message": "Application not found"}), 404

        student_id = row['student_id']

        cursor.execute("UPDATE tutor_application SET status = 'APPROVED' WHERE application_id = %s", (application_id,))
        
        cursor.execute("INSERT INTO tutor (tutor_id, status) VALUES (%s, 'ACTIVE') ON CONFLICT (tutor_id) DO UPDATE SET status = 'ACTIVE'", (student_id,))

        cursor.execute("""
            UPDATE user_account 
            SET role = 'TUTOR' 
            FROM tutee 
            WHERE user_account.google_id = tutee.google_id 
            AND tutee.id_number = %s
        """, (student_id,))

        cursor.execute("SELECT course_code FROM application_courses WHERE application_id = %s", (application_id,))
        for course in cursor.fetchall():
            cursor.execute("INSERT INTO teaches (tutor_id, course_code) VALUES (%s, %s) ON CONFLICT DO NOTHING", (student_id, course['course_code']))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"success": True, "message": "Approved"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@admin_dashboard_bp.route("/api/tutor-applications/admin/applications/<int:application_id>/reject", methods=["POST"])
def reject_tutor_application(application_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE tutor_application SET status = 'REJECTED' WHERE application_id = %s", (application_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "Rejected"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@admin_dashboard_bp.route("/api/tutor-applications/admin/users/status", methods=["PUT"])
def update_user_status():
    current_user = session.get('user')
    data = request.get_json()
    google_id = data.get("google_id")
    
    if current_user and current_user.get('sub') == google_id:
        return jsonify({"success": False, "error": "You cannot ban your own account."}), 403

    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("UPDATE user_account SET status = %s, status_note = %s WHERE google_id = %s", (data.get("status"), data.get("note", ""), google_id))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    
@admin_dashboard_bp.route("/api/admin/subject-requests", methods=["GET"])
def get_subject_requests():
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 5))
        status = request.args.get("status", "all")
        offset = (page - 1) * limit
        params = []
        where_clause = ""

        if status != "all":
            where_clause = "WHERE sr.status = %s"
            params.append(status)

        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute(f"SELECT COUNT(*) FROM subject_request sr {where_clause}", params)
        total_items = cur.fetchone()['count']

        query = f"""
            SELECT 
                sr.request_id, sr.requester_id, sr.subject_code, sr.subject_name,
                sr.description, sr.status, sr.created_at,
                t.first_name, t.last_name, ua.role
            FROM subject_request sr
            JOIN tutee t ON sr.requester_id = t.id_number
            JOIN user_account ua ON t.google_id = ua.google_id
            {where_clause}
            ORDER BY sr.created_at DESC
            LIMIT %s OFFSET %s
        """
        cur.execute(query, params + [limit, offset])
        requests = cur.fetchall()

        cur.close()
        conn.close()

        for r in requests:
            if r['created_at']:
                r['created_at'] = r['created_at'].strftime("%Y-%m-%d")

        return jsonify({
            "success": True,
            "data": requests,
            "pagination": build_pagination_metadata(total_items, page, limit)
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@admin_dashboard_bp.route("/api/admin/subject-requests/<int:request_id>/resolve", methods=["PUT"])
def resolve_subject_request(request_id):
    data = request.get_json()
    action = data.get("action")
    final_code = data.get("final_code", "").strip()
    final_name = data.get("final_name", "").strip()
    
    if action not in ['APPROVE', 'REJECT']:
        return jsonify({"success": False, "error": "Invalid action"}), 400

    try:
        conn = get_connection()
        cur = conn.cursor()
        
        status = 'APPROVED' if action == 'APPROVE' else 'REJECTED'
        
        if status == 'APPROVED':
            if not final_code or not final_name:
                 return jsonify({"success": False, "error": "Code and Name are required for approval"}), 400

            cur.execute("""
                UPDATE subject_request 
                SET status = %s, subject_code = %s, subject_name = %s 
                WHERE request_id = %s
            """, (status, final_code, final_name, request_id))
            
            cur.execute("""
                INSERT INTO course (course_code, course_name) 
                VALUES (%s, %s) 
                ON CONFLICT (course_code) DO NOTHING
            """, (final_code, final_name))
            
        else:
            cur.execute("UPDATE subject_request SET status = %s WHERE request_id = %s", (status, request_id))

        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    
@admin_dashboard_bp.route("/api/admin/users/<user_id>/reports", methods=["GET"])
def get_user_reports(user_id):
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
            SELECT r.report_id, r.reporter_id, r.type, r.description, r.reasons, r.date_submitted, r.status
            FROM report r
            JOIN tutee t ON r.reported_id = t.id_number
            WHERE t.google_id = %s
            ORDER BY r.date_submitted DESC
        """
        cur.execute(query, (user_id,))
        reports = cur.fetchall()
        
        cur.close()
        conn.close()
        
        for r in reports:
            r['date_submitted'] = r['date_submitted'].strftime("%Y-%m-%d")
            
        return jsonify({"success": True, "reports": reports}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    
@admin_dashboard_bp.route("/api/admin/courses", methods=["GET"])
def get_all_courses():
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        search = request.args.get("search", "").strip()
        filter_type = request.args.get("filter", "all")
        
        offset = (page - 1) * limit
        params = []
        
        sql = """
            SELECT 
                c.course_code, 
                c.course_name, 
                c.college, 
                COUNT(t.tutor_id) as tutor_count
            FROM course c
            LEFT JOIN teaches te ON c.course_code = te.course_code
            LEFT JOIN tutor t ON te.tutor_id = t.tutor_id AND t.status = 'ACTIVE'
        """
        
        wheres = []
        if search:
            wheres.append("(c.course_code ILIKE %s OR c.course_name ILIKE %s)")
            params.extend([f"%{search}%", f"%{search}%"])
            
        if wheres:
            sql += " WHERE " + " AND ".join(wheres)
            
        sql += " GROUP BY c.course_code, c.course_name, c.college"
        
        if filter_type == 'no_tutors':
            sql += " HAVING COUNT(t.tutor_id) = 0"
        elif filter_type == 'with_tutors':
            sql += " HAVING COUNT(t.tutor_id) > 0"
            
        count_sql = f"SELECT COUNT(*) FROM ({sql}) as subquery"
        
        sql += " ORDER BY tutor_count ASC, c.course_code ASC LIMIT %s OFFSET %s"
        
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute(count_sql, params)
        total_items = cur.fetchone()['count']
        
        cur.execute(sql, params + [limit, offset])
        courses = cur.fetchall()
        
        cur.close()
        conn.close()

        return jsonify({
            "success": True, 
            "data": courses, 
            "pagination": build_pagination_metadata(total_items, page, limit)
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    
@admin_dashboard_bp.route("/api/admin/courses/<course_code>", methods=["DELETE"])
def delete_course(course_code):
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        cur.execute("DELETE FROM course WHERE course_code = %s", (course_code,))
        
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500