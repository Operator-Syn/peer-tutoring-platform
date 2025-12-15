from flask import Blueprint, jsonify, request, session
from models.createNewPendingAppointmentModel.createNewPendingAppointmentModel import PendingAppointment
from models.NotificationModel.NotificationModel import Notification 
import traceback

# 🟢 1. IMPORT SOCKETIO (CRITICAL FOR REAL-TIME EMISSION FROM A REST ROUTE)
try:
    from app import socketio  
except ImportError:
    socketio = None
    print("⚠️ WARNING: Could not import socketio. Real-time updates disabled.")


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
    
    new_id = None # Ensure new_id is initialized for scope

    try:
        # 3. Get Tutee ID (delegated to Model)
        tutee_id = PendingAppointment.get_tutee_id_by_google_id(google_id)
        if not tutee_id:
            return jsonify({"error": "No tutee found for this Google account"}), 404

        # 4. Create Appointment (delegated to Model)
        new_id = PendingAppointment.create(
            vacant_id=data["vacant_id"],
            tutee_id=tutee_id,
            course_code=data["course_code"],
            appointment_date=data["appointment_date"]
        )

        # -------------------------------------------------------------
        # 5. NOTIFICATION LOGIC (NEW)
        # -------------------------------------------------------------
        try:
            # A. Find out who the tutor is for this slot
            tutor_id = PendingAppointment.get_tutor_from_vacant(data["vacant_id"])
            
            if tutor_id:
                # B. Send the database notification
                Notification.create_booking_notification(
                    appointment_id=new_id,
                    recipient_id=tutor_id,  # The Tutor receives it
                    sender_id=tutee_id,     # The Student sent it
                    status_type='REQUEST'   # Type: Request
                )
                print(f"🔔 Notification sent to tutor {tutor_id}")

                # C. 🟢 ADD SOCKET EMIT FOR REAL-TIME UPDATE
                if socketio:
                    tutor_room = str(tutor_id)
                    socketio.emit(
                        'new_notification', # Client listens for this event
                        {
                            'type': 'BOOKING_REQUEST',
                            'message': 'You have a new session request!',
                            'appointment_id': new_id
                        }, 
                        room=tutor_room, 
                        namespace='/'
                    )
                    print(f"🔔 Real-time notification emitted to tutor room: {tutor_room}")
                # ---------------------------------------------------

            else:
                print(f"⚠️ Could not find tutor for vacant_id {data['vacant_id']}")

        except Exception as notif_error:
            # Don't crash the whole request if notification fails; just log it
            print(f"❌ Notification failed: {notif_error}")
        # -------------------------------------------------------------

        return jsonify({
            "message": "Pending appointment created successfully", 
            "appointment_id": new_id
        }), 201

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "An internal error occurred"}), 500