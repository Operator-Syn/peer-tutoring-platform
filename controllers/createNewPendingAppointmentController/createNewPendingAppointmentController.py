from flask import Blueprint, jsonify, request, session
from models.createNewPendingAppointmentModel.createNewPendingAppointmentModel import PendingAppointment
import traceback

bp_create_pending = Blueprint("create_pending", __name__, url_prefix="/api")

@bp_create_pending.route("/create-pending-appointment", methods=["POST"])
def create_pending_appointment():
    # 1. Authentication Check
    user = session.get("user")
    if not user or not user.get("sub"):
        return jsonify({"error": "User not authenticated"}), 401

    google_id = user["sub"]
    data = request.get_json()

    # 2. Basic Input Validation
    required_fields = ["vacant_id", "course_code", "appointment_date"]
    for field in required_fields:
        if field not in data or data[field] in [None, ""]:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    try:
        # 3. Get Tutee ID (delegated to Model)
        tutee_id = PendingAppointment.get_tutee_id_by_google_id(google_id)
        if not tutee_id:
            return jsonify({"error": "No tutee found for this Google account"}), 404

        # 4. Create Appointment (delegated to Model)
        # The model handles the SQL checks for course, vacant_id, and duplicates
        new_id = PendingAppointment.create(
            vacant_id=data["vacant_id"],
            tutee_id=tutee_id,
            course_code=data["course_code"],
            appointment_date=data["appointment_date"]
        )

        return jsonify({
            "message": "Pending appointment created successfully", 
            "appointment_id": new_id
        }), 201

    except ValueError as ve:
        # Catch validation errors explicitly raised by the Model (e.g., "Invalid course code")
        return jsonify({"error": str(ve)}), 400

    except Exception as e:
        # Catch unexpected server errors
        traceback.print_exc()
        return jsonify({"error": "An internal error occurred"}), 500