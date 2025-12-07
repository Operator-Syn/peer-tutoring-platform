from flask import Blueprint, jsonify, request
from utils.db import get_connection
from psycopg2.extras import RealDictCursor

admin_dashboard_bp = Blueprint("admin_dashboard", __name__)

@admin_dashboard_bp.route("/api/tutor-applications/admin/applications", methods=["GET"])
def get_all_tutor_applications():
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT 
                ta.application_id,
                ta.student_id,
                ta.status,
                ta.date_submitted,
                ta.cor_filename,
                t.first_name,
                t.middle_name,
                t.last_name,
                t.program_code AS program,
                ARRAY_AGG(ac.course_code) FILTER (WHERE ac.course_code IS NOT NULL) AS courses
            FROM tutor_application ta
            JOIN tutee t ON ta.student_id = t.id_number
            LEFT JOIN application_courses ac ON ta.application_id = ac.application_id
            GROUP BY ta.application_id, ta.student_id, ta.status, ta.date_submitted,
                     ta.cor_filename, t.first_name, t.middle_name, t.last_name, t.program_code
            ORDER BY ta.date_submitted DESC
        """)

        applications = []
        for row in cur.fetchall():
            applications.append({
                "application_id": row[0],
                "student_id": row[1],
                "status": row[2],
                "date_submitted": row[3].isoformat(),
                "cor_filename": row[4],
                "student_name": f"{row[5]} {row[6] or ''} {row[7]}".strip(),
                "program": row[8],
                "courses": row[9] or []
            })

        cur.close()
        conn.close()

        return jsonify({
            "success": True,
            "applications": applications
        }), 200

    except Exception as e:
        print("Error loading tutor applications:", e)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

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

        statistics = {
            "total_applications": total_applications,
            "pending": pending or 0,
            "approved": approved or 0,
            "rejected": rejected or 0,
            "total_tutors": total_tutors,
            "total_tutees": total_tutees,
            "total_courses": total_courses,
            "active_sessions": 0
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

        cursor.execute(
            "SELECT student_id FROM tutor_application WHERE application_id = %s",
            (application_id,)
        )
        row = cursor.fetchone()
        if not row:
            return jsonify({"success": False, "message": "Application not found"}), 404

        student_id = row['student_id']

        cursor.execute(
            "UPDATE tutor_application SET status = 'APPROVED' WHERE application_id = %s",
            (application_id,)
        )
        cursor.execute("""
            INSERT INTO tutor (tutor_id, status)
            VALUES (%s, 'ACTIVE')
            ON CONFLICT (tutor_id) DO UPDATE SET status = 'ACTIVE'
        """, (student_id,))

        cursor.execute(
            "SELECT course_code FROM application_courses WHERE application_id = %s",
            (application_id,)
        )
        courses = cursor.fetchall()

        for course in courses:
            course_code = course['course_code']
            cursor.execute(
                """
                INSERT INTO teaches (tutor_id, course_code)
                VALUES (%s, %s)
                ON CONFLICT DO NOTHING
                """,
                (student_id, course_code)
            )

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Tutor application approved successfully",
            "data": {"application_id": application_id, "status": "APPROVED"}
        }), 200

    except Exception as e:
        print("Error approving tutor:", e)
        return jsonify({"success": False, "message": str(e)}), 500

@admin_dashboard_bp.route("/api/tutor-applications/admin/applications/<int:application_id>/reject", methods=["POST"])
def reject_tutor_application(application_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE tutor_application
            SET status = 'REJECTED'
            WHERE application_id = %s
        """, (application_id,))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Tutor application rejected successfully",
            "data": {"application_id": application_id, "status": "REJECTED"}
        })
    except Exception as e:
        print("Error rejecting tutor:", e)
        return jsonify({"success": False, "message": str(e)}), 500

@admin_dashboard_bp.route("/api/tutor-applications/admin/users", methods=["GET"])
def get_all_users_for_admin():
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
            SELECT 
                ua.google_id,
                ua.email,
                ua.role,
                ua.status,
                ua.last_login,
                t.first_name,
                t.last_name,
                COUNT(r.report_id) FILTER (WHERE r.status = 'PENDING') as pending_reports
            FROM user_account ua
            LEFT JOIN tutee t ON ua.google_id = t.google_id
            LEFT JOIN report r ON t.id_number = r.reported_id
            GROUP BY ua.google_id, ua.email, ua.role, ua.status, ua.last_login, t.first_name, t.last_name
            ORDER BY pending_reports DESC, ua.last_login DESC
        """
        cur.execute(query)
        users = cur.fetchall()
        
        for user in users:
            if user['last_login']:
                user['last_login'] = user['last_login'].strftime("%Y-%m-%d")
            if not user['status']:
                user['status'] = 'ACTIVE'

        cur.close()
        conn.close()
        return jsonify({"success": True, "users": users}), 200
    except Exception as e:
        print("Error fetching users:", e)
        return jsonify({"success": False, "error": str(e)}), 500