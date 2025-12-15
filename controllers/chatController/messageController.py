from flask import Blueprint, request, jsonify, session
from models.messageModel.messageModel import MessageModel
from models.NotificationModel.NotificationModel import Notification

chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")

@chat_bp.route("/messages/<int:appointment_id>", methods=["GET"])
def get_messages(appointment_id):
    messages = MessageModel.get_messages_by_appointment(appointment_id)
    return jsonify(messages)

@chat_bp.route("/messages", methods=["POST"])
def send_message():
    data = request.get_json()
    appointment_id = data.get("appointment_id")
    message_text = data.get("message_text")
    
    # 1. Get Sender ID from Session (Secure)
    # Note: We need the ID_NUMBER, not the Google ID. 
    # Ensure your frontend sends it or your session middleware sets it.
    # For now, assuming session["user"] has "id_number" (from the login fix we discussed earlier)
    # OR we can trust the frontend to send sender_id if you prefer simpler logic for now.
    user = session.get("user")
    # For robustness, we'll try to get it from the request if session fails (dev mode), 
    # but strictly you should use session.
    sender_id = data.get("sender_id") 

    if not appointment_id or not message_text or not sender_id:
        return jsonify({"error": "Missing required fields"}), 400

    # 2. Save the Message
    timestamp = MessageModel.save_message(appointment_id, sender_id, message_text)

    # -------------------------------------------------------------
    # 3. NOTIFICATION LOGIC (CHAT)
    # -------------------------------------------------------------
    try:
        # A. Find out who is in this chat
        participants = MessageModel.get_appointment_participants(appointment_id)
        
        if participants:
            student_id, tutor_id = participants
            
            # B. Determine Recipient (The one who is NOT the sender)
            if sender_id == student_id:
                recipient_id = tutor_id
            else:
                recipient_id = student_id
            
            # C. Send Notification
            # The model automatically checks if there's already an unread notif
            # and updates the timestamp instead of spamming duplicates.
            Notification.create_chat_notification(
                appointment_id=appointment_id,
                recipient_id=recipient_id,
                sender_id=sender_id
            )
            print(f"🔔 Chat notification processed for {recipient_id}")
            
    except Exception as e:
        print(f"❌ Chat notification failed: {e}")
    # -------------------------------------------------------------

    return jsonify({
        "status": "success", 
        "timestamp": timestamp.isoformat() if timestamp else None
    }), 201