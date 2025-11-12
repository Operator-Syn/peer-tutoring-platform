from flask import Blueprint, jsonify, request
from utils.db import get_connection

admin_dashboard_bp = Blueprint("admin_dashboard", __name__)

@admin_dashboard_bp.route("/api/tutor-applications/admin/applications", methods=["GET"])
def get_all_tutor_applications():
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT 
                ta.application_id,
                ta.student_id,
                CONCAT(t.first_name, ' ', t.last_name) AS student_name,
                t.program_code AS college,
                ta.status,
                ta.date_submitted,
                ta.cor_filename,
                ARRAY_AGG(ac.course_code) FILTER (WHERE ac.course_code IS NOT NULL) AS courses
            FROM tutor_application ta
            JOIN tutee t ON ta.student_id = t.id_number
            LEFT JOIN application_courses ac ON ta.application_id = ac.application_id
            GROUP BY ta.application_id, ta.student_id, t.first_name, t.last_name, 
                     t.program_code, ta.status, ta.date_submitted, ta.cor_filename
            ORDER BY ta.date_submitted DESC
        """)

        applications = []
        for row in cursor.fetchall():
            applications.append({
                "application_id": row[0],
                "student_id": row[1],
                "student_name": row[2],
                "college": row[3],
                "status": row[4],
                "date_submitted": row[5],
                "cor_filename": row[6],
                "courses": row[7] if row[7] else []
            })

        cursor.close()
        conn.close()

        return jsonify({"applications": applications})
    except Exception as e:
        print("Error fetching tutor applications:", e)
        return jsonify({"error": str(e)}), 500

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
        cursor = conn.cursor()

        cursor.execute("SELECT student_id FROM tutor_application WHERE application_id = %s", (application_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"success": False, "message": "Application not found"}), 404

        student_id = row[0]

        cursor.execute("UPDATE tutor_application SET status = 'APPROVED' WHERE application_id = %s", (application_id,))
        cursor.execute("""
            INSERT INTO tutor (tutor_id, status)
            VALUES (%s, 'ACTIVE')
            ON CONFLICT (tutor_id) DO UPDATE SET status = 'ACTIVE'
        """, (student_id,))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "message": "Tutor application approved successfully",
            "data": {"application_id": application_id, "status": "APPROVED"}
        })
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
