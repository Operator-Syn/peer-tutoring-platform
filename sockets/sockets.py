# sockets.py (FIXED handle_message)

from app import socketio
from flask_socketio import join_room, leave_room, emit
from flask import request
from models.messageModel.messageModel import MessageModel
from models.NotificationModel.NotificationModel import Notification 

# 🟢 NEW: Connect Handler for Personal Notifications (Necessary for Real-Time Booking)
@socketio.on('connect')
def handle_connect():
    """
    On connect, join a personal room named after the user's ID_NUMBER.
    This room is used by the booking controller to send real-time notifications.
    """
    user_id = request.args.get('user_id') 

    if user_id:
        personal_room = str(user_id) 
        join_room(personal_room) 
        print(f"🔌 User {user_id} connected and joined personal notification room: {personal_room}")
# -------------------------------------------------------------

# 1. NEW: Monitor Logic (Silent Join)
@socketio.on("monitor_appointments")
def handle_monitor(data):
    appointment_ids = data.get("appointment_ids", [])
    for appt_id in appointment_ids:
        room = f"appointment_{appt_id}"
        join_room(room)

# 2. UPDATED: Join Logic (Active Chat)
@socketio.on("join_appointment")
def handle_join(data):
    appointment_id = data.get("appointment_id")
    user_id = data.get("user_id")
    if not appointment_id or not user_id:
        return

    try:
        appt_id_int = int(appointment_id)
    except ValueError:
        print(f"Error: Could not convert appointment_id '{appointment_id}' to integer.")
        return

    room = f"appointment_{appointment_id}"
    join_room(room)

    MessageModel.mark_messages_as_read(appt_id_int, user_id)
    Notification.mark_chat_notifications_as_read(appt_id_int, user_id)

    messages = MessageModel.get_messages_by_appointment(appointment_id)
    emit("load_messages", messages, room=request.sid)

@socketio.on("send_message")
def handle_message(data):
    appointment_id = data.get("appointment_id")
    sender_id = data.get("sender_id")
    message_text = data.get("message_text")
    
    if not appointment_id or not sender_id or not message_text:
        return

    room = f"appointment_{appointment_id}"
    
    # A. Save Message (existing logic)
    timestamp = MessageModel.save_message(appointment_id, sender_id, message_text)

    # B. Emit to Chat Room (existing logic for real-time display)
    emit("receive_message", {
        "appointment_id": appointment_id,
        "sender_id": sender_id,
        "message_text": message_text,
        "timestamp": timestamp.isoformat()
    }, room=room)
    
    # -----------------------------------------------------------
    # C. NOTIFICATION LOGIC (Refined for robustness)
    # -----------------------------------------------------------
    try:
        # 🟢 FIX: Convert ID to integer for database operations (reference_id is BIGINT)
        appt_id_int = int(appointment_id) 

        # 1. Find who is in this appointment (pass the integer ID)
        participants = MessageModel.get_appointment_participants(appt_id_int) 
        
        if not participants:
            print(f"❌ Error sending chat notification: Could not find participants for appt {appt_id_int}")
            return
            
        student_id, tutor_id = participants
        
        # 2. Determine Recipient (The one who is NOT the sender)
        if str(sender_id) == str(student_id):
            recipient_id = tutor_id
        else:
            recipient_id = student_id
        
        # 3. Validation: Ensure recipient_id is valid
        if not recipient_id:
            print(f"❌ Error sending chat notification: Recipient ID is None for appt {appt_id_int}")
            return

        # 4. Create Notification in DB
        Notification.create_chat_notification(
            appointment_id=appt_id_int, # Pass integer ID
            recipient_id=recipient_id,
            sender_id=sender_id
        )
        print(f"🔔 Chat Notification created/reset for {recipient_id}")
            
    except ValueError:
         print(f"❌ Error sending chat notification: Appointment ID '{appointment_id}' is not a valid integer.")
    except Exception as e:
        # The database error will be caught here if the INSERT/FK fails
        print(f"❌ Error sending chat notification: {e}")
    # -----------------------------------------------------------
    
@socketio.on("mark_read")
def handle_mark_read(data):
    appointment_id = data.get("appointment_id")
    user_id = data.get("user_id")
    if appointment_id and user_id:
        # Assuming MessageModel.mark_messages_as_read handles string conversion internally, 
        # but passing int is safer if possible. We leave it as is if the function signature requires a string.
        MessageModel.mark_messages_as_read(appointment_id, user_id)