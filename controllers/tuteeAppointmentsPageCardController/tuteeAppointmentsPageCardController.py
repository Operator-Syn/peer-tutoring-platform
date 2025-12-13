from flask import Blueprint, jsonify, session
from models.tuteeAppointmentsPageCardModel.tuteeAppointmentsPageCardModel import AppointmentCard
import traceback

bp_appointments = Blueprint("appointments", __name__, url_prefix="/api")

@bp_appointments.route("/appointments")
def get_user_appointments():
    # 1. Auth Check
    user = session.get("user")
    if not user or not user.get("sub"):
        return jsonify({"error": "User not authenticated"}), 401

    google_id = user["sub"]

    try:
        # 2. Fetch Data (Delegated to Model)
        cards = AppointmentCard.fetch_for_user(google_id)

        if cards is None:
            return jsonify({"error": "No tutee found for this account"}), 404

        # 3. Return JSON
        return jsonify(cards)

    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500