from flask import Blueprint, jsonify, session, request
from models.NotificationModel.NotificationModel import Notification
from utils.db import get_connection

bp_notifications = Blueprint("notifications", __name__, url_prefix="/api/notifications")

# Helper to get current user ID from session/DB (used in multiple places)
def get_current_user_id():
    user = session.get("user")
    if not user or not user.get("email"):
        return None
    email = user.get("email")
    
    try:
        conn = get_connection()
        cur = conn.cursor()
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
        
        # Ensure we return a string ID and strip it for consistency
        return str(row[0]).strip() if row and row[0] else None
    except Exception as e:
        print(f"Error resolving user ID in helper: {e}")
        return None

# --- Existing Endpoint: Used by ChatInterface to get initial notification count ---
@bp_notifications.route("/", methods=["GET"])
def get_notifications():
    # 1. Get Email from Session
    user = session.get("user")
    if not user or not user.get("email"):
        return jsonify({"error": "Unauthorized"}), 401

    # 2. Resolve Email -> ID_NUMBER using the helper
    user_id = get_current_user_id()

    if not user_id:
        return jsonify({"error": "User not found or ID not resolvable"}), 404

    # 3. Fetch Notifications
    data = Notification.get_user_notifications(user_id)
    return jsonify(data), 200

# --- NEW Endpoint: Used by NotificationPanel to fetch data with a URL parameter ---
@bp_notifications.route("/user/<string:user_id>", methods=["GET"])
def get_notifications_by_id(user_id):
    """
    Frontend calls: /api/notifications/user/<userId>
    Fetches notifications for a specific user ID.
    """
    session_user_id = get_current_user_id()
    
    # 1. Security Check: Ensure session user is the ID requested
    if not session_user_id or session_user_id != str(user_id).strip():
        print(f"SECURITY ALERT: Session user {session_user_id} tried to fetch notifications for {user_id}.")
        return jsonify({"error": "Unauthorized or Forbidden"}), 403

    # 2. Fetch Notifications
    data = Notification.get_user_notifications(session_user_id)
    return jsonify(data), 200


# --- Existing Endpoint: Used by ChatInterface for a specific type of read (now aliased) ---
@bp_notifications.route("/read/<int:notif_id>", methods=["POST"])
def mark_read(notif_id):
    """Marks a single notification as read (Legacy/Internal ChatInterface call)."""
    Notification.mark_as_read(notif_id)
    return jsonify({"success": True}), 200

# --- NEW Endpoint: Used by NotificationPanel for marking a single item read ---
@bp_notifications.route("/mark-read/<int:notif_id>", methods=["POST"])
def mark_read_frontend(notif_id):
    """
    Frontend calls: /api/notifications/mark-read/<notif_id>
    Marks a single notification as read.
    """
    Notification.mark_as_read(notif_id)
    return jsonify({"success": True}), 200
    
# 🟢 Existing Endpoint: to mark all chat notifications for an appointment as read
@bp_notifications.route("/mark_chat_read/<int:appointment_id>/<string:recipient_id>", methods=["POST"])
def mark_chat_read(appointment_id, recipient_id):
    """
    Marks all 'NEW_MESSAGE' notifications for a specific appointment and recipient as read.
    """
    
    # 1. Security Check: Get the ID of the user currently logged in
    session_user_id = get_current_user_id()
    
    if not session_user_id:
        return jsonify({"error": "Unauthorized: Session user ID not found."}), 401
    
    # 2. Consistency Check: Ensure the session user matches the recipient_id being marked
    # We strip both just in case the URL/session ID has padding.
    if session_user_id != str(recipient_id).strip():
        # This prevents a malicious user from clearing another user's notifications.
        print(f"SECURITY ALERT: User {session_user_id} tried to mark chat read for Recipient {recipient_id}.")
        return jsonify({"error": "Forbidden: You can only mark your own notifications as read."}), 403
    
    # 3. Call Model to Update
    try:
        # Pass the original recipient_id (which will be cleaned inside the model)
        rows_updated = Notification.mark_chat_notifications_as_read(appointment_id, recipient_id)
        
        if rows_updated is None:
            return jsonify({"success": False, "message": "Database update failed."}), 500
        
        return jsonify({"success": True, "updated_count": rows_updated}), 200
        
    except Exception as e:
        print(f"Error marking chat notifications as read via API: {e}")
        return jsonify({"success": False, "error": "Internal Server Error"}), 500