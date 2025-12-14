from flask import Blueprint, jsonify, session
from models.createAppointmentFormModel.createAppointmentFormModel import FillOutData
import traceback

bp_fillout = Blueprint("fillout", __name__, url_prefix="/api")

@bp_fillout.route("/fillout")
def get_fillout_data():
    # 1. Authentication Check
    user = session.get("user")
    if not user or not user.get("sub"):
        return jsonify({"error": "User not authenticated"}), 401

    google_id = user["sub"]

    try:
        # 2. Fetch Data (Delegated to Model)
        fillout_data = FillOutData.fetch(google_id)

        if not fillout_data:
            return jsonify({"error": "No tutee found for this Google account"}), 404

        # 3. Serialize and Return
        return jsonify(fillout_data.to_api_response())

    except Exception:
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500