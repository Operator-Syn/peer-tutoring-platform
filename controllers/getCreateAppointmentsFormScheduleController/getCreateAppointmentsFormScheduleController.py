from flask import Blueprint, jsonify, request
from models.getCreateAppointmentsFormScheduleModel.getCreateAppointmentsFormScheduleModel import AvailabilityCard
import traceback

bp_availability = Blueprint("availability_by_subject", __name__, url_prefix="/api")

@bp_availability.route("/availability/by-subject", methods=["GET"])
def get_availability_by_subject():
    # 1. Extract Parameters
    course_code = request.args.get("course_code")
    appointment_date = request.args.get("appointment_date")

    # 2. Basic Validation
    if not course_code or not appointment_date:
        return jsonify({"error": "Missing course_code or appointment_date parameter"}), 400

    try:
        # 3. Call Model Logic
        # The model handles the date parsing, SQL query, and data formatting
        available_slots = AvailabilityCard.fetch_available_slots(course_code, appointment_date)
        
        return jsonify(available_slots), 200

    except ValueError as ve:
        # Handle specific validation errors from the model (e.g., bad date format)
        return jsonify({"error": str(ve)}), 400

    except Exception as e:
        # Handle unexpected server errors
        traceback.print_exc()
        return jsonify({"error": "An internal error occurred"}), 500