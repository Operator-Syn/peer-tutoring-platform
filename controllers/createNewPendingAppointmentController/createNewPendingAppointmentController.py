from flask import Blueprint, jsonify, request, session
from psycopg2.extras import RealDictCursor
from utils.db import get_connection
from models.createNewPendingAppointmentModel.createNewPendingAppointmentModel import PendingAppointment
import traceback

bp_create_pending = Blueprint("create_pending", __name__, url_prefix="/api")


@bp_create_pending.route("/create-pending-appointment", methods=["POST"])
def create_pending_appointment():
    # --- Check Google login session ---
    user = session.get("user")
    if not user or not user.get("sub"):
        return jsonify({"error": "User not authenticated"}), 401

    google_id = user["sub"]
    data = request.get_json()

    required_fields = ["vacant_id", "course_code", "appointment_date"]
    for field in required_fields:
        if field not in data or data[field] in [None, ""]:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # --- Fetch tutee ID using Google ID ---
        cur.execute("SELECT id_number FROM tutee WHERE google_id = %s LIMIT 1;", (google_id,))
        tutee_result = cur.fetchone()
        if not tutee_result:
            return jsonify({"error": "No tutee found for this Google account"}), 404
        tutee_id = tutee_result["id_number"]

        # --- Check if availability exists ---
        cur.execute("SELECT * FROM availability WHERE vacant_id = %s;", (data["vacant_id"],))
        if not cur.fetchone():
            return jsonify({"error": "Vacant slot not found"}), 400

        # --- Check if course exists ---
        cur.execute("SELECT * FROM course WHERE course_code = %s;", (data["course_code"],))
        if not cur.fetchone():
            return jsonify({"error": "Invalid course code"}), 400

        # --- Check unique constraint for this vacant_id and date ---
        cur.execute("""
            SELECT 1 FROM appointment 
            WHERE vacant_id = %s AND appointment_date = %s;
        """, (data["vacant_id"], data["appointment_date"]))
        if cur.fetchone():
            return jsonify({"error": "This slot is already booked for the selected date"}), 400

        # --- Build PendingAppointment dataclass ---
        appointment = PendingAppointment(
            vacant_id=data["vacant_id"],
            tutee_id=tutee_id,
            course_code=data["course_code"],
            appointment_date=data["appointment_date"],
            status="PENDING"
        )

        # --- Insert into appointment table ---
        cur.execute("""
            INSERT INTO appointment (
                vacant_id, tutee_id, course_code, appointment_date, status
            ) VALUES (%s, %s, %s, %s, %s)
            RETURNING appointment_id;
        """, (
            appointment.vacant_id,
            appointment.tutee_id,
            appointment.course_code,
            appointment.appointment_date,
            appointment.status
        ))
        new_id = cur.fetchone()["appointment_id"]
        conn.commit()

        return jsonify({"message": "Pending appointment created successfully", "appointment_id": new_id})

    except Exception as e:
        traceback.print_exc()
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cur.close()
        conn.close()