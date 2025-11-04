from flask import Blueprint, request, jsonify
from utils.db import get_connection
from psycopg2.extras import RealDictCursor

admin_dashboard_bp = Blueprint("admin_dashboard", __name__)

@admin_dashboard_bp.route("api/admin/dashboard", methods=["GET"])
def get_admin_dashboard():
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    cursor.execute("SELECT COUNT(*) FROM tutor WHERE status = 'ACTIVE';")
    total_tutors = cursor.fetchone()

    cursor.execute("SELECT COUNT(*) FROM tutee;")
    total_tutees = cursor.fetchone()

    cursor.execute("SELECT COUNT(*) FROM tutor_application WHERE status = 'PENDING';")
    pending_applications = cursor.fetchone()

    cursor.execute("SELECT COUNT(*) FROM appointments WHERE status = 'BOOKED';")
    booked_appointments = cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify({
        "total_tutors": total_tutors,
        "pending_applications": pending_applications,
        "total_tutees": total_tutees,
        "booked_appointments": booked_appointments
    })