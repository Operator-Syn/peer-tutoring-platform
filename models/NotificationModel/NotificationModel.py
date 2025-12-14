# models/NotificationModel.py

# NOTE: This import assumes your Flask-SocketIO object is imported as 'socketio'
# from your main application file (e.g., 'from app import socketio'). Adjust if needed.
from app import socketio 
from dataclasses import dataclass
from utils.db import get_connection
from psycopg2.extras import RealDictCursor

@dataclass
class Notification:
    notification_id: int
    recipient_id: str
    sender_id: str
    type: str
    reference_id: int
    message_text: str
    is_read: bool
    created_at: str
    sender_name: str = None  # Populated via join

    @staticmethod
    def create_booking_notification(appointment_id, recipient_id, sender_id, status_type):
        """
        Creates a notification for Booking events (Request, Approve, Reject).
        status_type: 'REQUEST', 'APPROVED', 'REJECTED'
        """
        messages = {
            'REQUEST': "sent you a session request.",
            'APPROVED': "accepted your session request!",
            'REJECTED': "declined your session request."
        }
        
        full_type = f"BOOKING_{status_type}"
        text = messages.get(status_type, "updated a booking.")

        Notification._insert(recipient_id, sender_id, full_type, appointment_id, text)

    @staticmethod
    def create_chat_notification(appointment_id, recipient_id, sender_id):
        """
        Creates a notification for a new message or updates an existing one
        to mark it as unread and update its timestamp.
        """
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor) 
        
        # 1. Check for ANY existing chat notification for this recipient and reference_id,
        #    regardless of its is_read status.
        check_query = """
            SELECT notification_id FROM notifications 
            WHERE recipient_id = %s AND reference_id = %s AND type = 'NEW_MESSAGE'
        """
        cur.execute(check_query, (recipient_id, appointment_id))
        existing = cur.fetchone()
        
        if existing:
            try:
                # 2. If it exists, update timestamp AND set is_read back to FALSE
                update_query = """
                    UPDATE notifications 
                    SET created_at = now(), is_read = FALSE 
                    WHERE notification_id = %s
                    RETURNING *
                """
                cur.execute(update_query, (existing['notification_id'],))
                updated_row = cur.fetchone()
                conn.commit() 

                # 3. Emit the socket event with the updated, unread notification
                if updated_row:
                    # Get sender name
                    cur.execute("SELECT first_name, last_name FROM tutee WHERE id_number = %s", (updated_row['sender_id'],))
                    sender_name_row = cur.fetchone()
                    sender_name = f"{sender_name_row['first_name']} {sender_name_row['last_name']}" if sender_name_row else "Someone"

                    updated_row_payload = {
                        **updated_row,
                        "created_at": updated_row['created_at'].isoformat(),
                        "sender_name": sender_name
                    }

                    personal_room = str(recipient_id)
                    socketio.emit("new_global_notification", updated_row_payload, room=personal_room)
                    print(f"🔔 Emitted UPDATED new_global_notification (marked unread) to room: {personal_room}")

            except Exception as e:
                print(f"Error updating notification timestamp and unread status: {e}")
                conn.rollback()

        else:
            # 4. If it does not exist (first message ever), insert a new one.
            Notification._insert(recipient_id, sender_id, 'NEW_MESSAGE', appointment_id, "sent you a message.")
            
        cur.close()
        conn.close()

    @staticmethod
    def _insert(recipient_id, sender_id, type, ref_id, msg_suffix):
        conn = get_connection()
        # Use RealDictCursor here too for consistency
        cur = conn.cursor(cursor_factory=RealDictCursor) 
        new_notification_data = None
        try:
            
            # Get sender name for the message text
            cur.execute("SELECT first_name, last_name FROM tutee WHERE id_number = %s", (sender_id,))
            sender = cur.fetchone()
            # Handle potential None if tutee not found, though FK should prevent this
            sender_name = f"{sender['first_name']} {sender['last_name']}" if sender else "Someone"
            
            full_message = f"{sender_name} {msg_suffix}"
            
            # MODIFIED QUERY: Use RETURNING * to get the full row for socket emission
            query = """
                INSERT INTO notifications (recipient_id, sender_id, type, reference_id, message_text)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING *
            """
            cur.execute(query, (recipient_id, sender_id, type, ref_id, full_message))
            
            inserted_row = cur.fetchone()
            conn.commit()
            
            # 🟢 SOCKET EMIT LOGIC (Real-Time Global Notification)
            if inserted_row:
                new_notification_data = {
                    **inserted_row,
                    "created_at": inserted_row['created_at'].isoformat(), # Convert datetime to string
                    "sender_name": sender_name # Add sender name
                }
                
                personal_room = str(recipient_id)
                socketio.emit("new_global_notification", new_notification_data, room=personal_room)
                print(f"🔔 Emitted new_global_notification (type: {type}) to room: {personal_room}")

        except Exception as e:
            print(f"Error creating notification: {e}")
            conn.rollback()
        finally:
            cur.close()
            conn.close()

    @staticmethod
    def get_user_notifications(user_id):
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        query = """
            SELECT n.*, t.first_name || ' ' || t.last_name as sender_name
            FROM notifications n
            LEFT JOIN tutee t ON n.sender_id = t.id_number
            WHERE n.recipient_id = %s
            ORDER BY n.created_at DESC
            LIMIT 20
        """
        cur.execute(query, (user_id,))
        rows = cur.fetchall()
        conn.close()
        return rows
        
    @staticmethod
    def mark_chat_notifications_as_read(appointment_id, recipient_id):
        conn = get_connection()
        cur = conn.cursor()
        rows_updated = 0
        
        try:
            # 1. Ensure IDs are clean and the correct type before query
            appt_id_int = int(appointment_id)
            # 💥 CRITICAL FIX: Ensure recipient_id is explicitly a stripped string
            clean_recipient_id = str(recipient_id).strip() 
        except (TypeError, ValueError) as e:
            print(f"Error: Invalid ID passed to read marker: {e}")
            return 0
            
        try:
            # 2. Use TRIM() in SQL for robustness against database storage issues
            query = """
                UPDATE notifications 
                SET is_read = TRUE 
                -- We use TRIM() on the column AND pass the cleaned ID
                WHERE TRIM(recipient_id) = %s 
                AND reference_id = %s
                AND type = 'NEW_MESSAGE'; 
            """
            # Arguments: (clean_recipient_id (str), appt_id_int (int))
            cur.execute(query, (clean_recipient_id, appt_id_int))
            rows_updated = cur.rowcount
            conn.commit()
            
            print(f"DB Action: Marked {rows_updated} chat notification(s) read for Appt: {appt_id_int}, Recipient: {clean_recipient_id}")
            
            return rows_updated 
        except Exception as e:
            print(f"Error marking chat notifications as read: {e}")
            conn.rollback()
            return 0 
        finally:
            cur.close()
            conn.close()

    @staticmethod
    def mark_as_read(notification_id):
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("UPDATE notifications SET is_read = TRUE WHERE notification_id = %s", (notification_id,))
        conn.commit()
        conn.close()