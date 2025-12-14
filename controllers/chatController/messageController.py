from flask import Blueprint, request, jsonify
from models.messageModel.messageModel import MessageModel

chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")

@chat_bp.route("/messages/<int:appointment_id>", methods=["GET"])
def get_messages(appointment_id):
    messages = MessageModel.get_messages_by_appointment(appointment_id)
    return jsonify(messages)
