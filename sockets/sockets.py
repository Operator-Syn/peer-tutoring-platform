from app import socketio
from flask_socketio import join_room, leave_room, emit
from utils.db import get_connection
from flask import request
from models.messageModel.messageModel import MessageModel

@socketio.on("join_appointment")
def handle_join(data):
    appointment_id = data.get("appointment_id")
    user_id = data.get("user_id")
    if not appointment_id or not user_id:
        return

    room = f"appointment_{appointment_id}"
    join_room(room)

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
