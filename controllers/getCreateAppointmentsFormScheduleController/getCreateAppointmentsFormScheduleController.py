from flask import Blueprint, jsonify, request, session
from models.getCreateAppointmentsFormScheduleModel.getCreateAppointmentsFormScheduleModel import AvailabilityCard
import traceback

bp_availability = Blueprint("availability_by_subject", __name__, url_prefix="/api")

@bp_availability.route("/availability/by-subject", methods=["GET"])
def get_availability_by_subject():
    # 1. Extract Query Params
    course_code = request.args.get("course_code")
    appointment_date = request.args.get("appointment_date")

    # 2. Extract Context (Who is asking?)
    # We only grab the email. The Model will figure out who this person is.
    user_data = session.get("user", {})
    user_email = user_data.get("email") 

    if not course_code or not appointment_date:
        return jsonify({"error": "Missing course_code or appointment_date parameter"}), 400

    try:
        # 3. Delegate Logic to Model
        available_slots = AvailabilityCard.fetch_available_slots(
            course_code, 
            appointment_date, 
            user_email  # <--- Just pass the email
        )
        return jsonify(available_slots), 200

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "An internal error occurred"}), 500