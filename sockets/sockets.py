from app import socketio
from flask_socketio import join_room, leave_room, emit
from flask import request
from models.messageModel.messageModel import MessageModel

# 1. NEW: Monitor Logic (Silent Join)
@socketio.on("monitor_appointments")
def handle_monitor(data):
    appointment_ids = data.get("appointment_ids", [])
    for appt_id in appointment_ids:
        room = f"appointment_{appt_id}"
        join_room(room)
    # Don't mark as read here!

# 2. UPDATED: Join Logic (Active Chat)
@socketio.on("join_appointment")
def handle_join(data):
    appointment_id = data.get("appointment_id")
    user_id = data.get("user_id")
    if not appointment_id or not user_id:
        return

    room = f"appointment_{appointment_id}"
    join_room(room)

    # Mark as read because user actually opened the chat
    MessageModel.mark_messages_as_read(appointment_id, user_id)

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
    timestamp = MessageModel.save_message(appointment_id, sender_id, message_text)

    emit("receive_message", {
        "appointment_id": appointment_id,
        "sender_id": sender_id,
        "message_text": message_text,
        "timestamp": timestamp.isoformat()
    }, room=room)
    
@socketio.on("mark_read")
def handle_mark_read(data):
    appointment_id = data.get("appointment_id")
    user_id = data.get("user_id")
    if appointment_id and user_id:
        MessageModel.mark_messages_as_read(appointment_id, user_id)