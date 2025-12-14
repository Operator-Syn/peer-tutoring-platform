from flask import Blueprint, jsonify, request
# Ensure you are importing the class where you put the new 'get_chat_partners' SQL logic
from models.chatUserModel.chatUserModel import UserModel 

chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")

@chat_bp.route("/partners", methods=["GET"])
def get_partners():
    # 1. We now expect the Database ID (e.g., '2023-0639'), not the Google ID
    user_id = request.args.get("user_id")
    
    if not user_id:
        return jsonify({"error": "Missing user_id parameter"}), 400

    # 2. Call the new SQL logic that filters for 'BOOKED' appointments
    try:
        partners = UserModel.get_chat_users_for_user(user_id)
        return jsonify(partners), 200
    except Exception as e:
        print(f"Error in get_partners: {e}")
        return jsonify({"error": "Internal Server Error"}), 500