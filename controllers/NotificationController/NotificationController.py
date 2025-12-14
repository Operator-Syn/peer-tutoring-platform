from flask import Blueprint, jsonify, session, request
from models.NotificationModel.NotificationModel import Notification # Check your import path
from utils.db import get_connection

bp_notifications = Blueprint("notifications", __name__, url_prefix="/api/notifications")

@bp_notifications.route("/", methods=["GET"])
def get_notifications():
    # 1. Get Email from Session
    user = session.get("user")
    if not user or not user.get("email"):
        return jsonify({"error": "Unauthorized"}), 401

    email = user.get("email")
    user_id = None

    # 2. Resolve Email -> ID_NUMBER (Fixing the missing ID issue)
    try:
        conn = get_connection()
        cur = conn.cursor()
        # Join user_account and tutee to find the ID based on email
        query = """
            SELECT t.id_number 
            FROM user_account ua
            JOIN tutee t ON ua.google_id = t.google_id
            WHERE ua.email = %s
        """
        cur.execute(query, (email,))
        row = cur.fetchone()
        cur.close()
        conn.close()

        if row:
            user_id = row[0]
        else:
            return jsonify({"error": "User not found"}), 404

    except Exception as e:
        print(f"Error resolving user ID: {e}")
        return jsonify({"error": "Internal Error"}), 500

    # 3. Fetch Notifications
    data = Notification.get_user_notifications(user_id)
    return jsonify(data), 200

@bp_notifications.route("/read/<int:notif_id>", methods=["POST"])
def mark_read(notif_id):
    Notification.mark_as_read(notif_id)
    return jsonify({"success": True}), 200