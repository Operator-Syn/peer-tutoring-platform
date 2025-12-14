from utils.db import get_connection
from datetime import datetime

class MessageModel:
    @staticmethod
    def get_messages_by_appointment(appointment_id):
        conn = get_connection()
        cur = conn.cursor()
        query = """
            SELECT sender_id, message_text, timestamp 
            FROM message 
            WHERE appointment_id = %s 
            ORDER BY timestamp ASC
        """
        try:
            cur.execute(query, (appointment_id,))
            results = cur.fetchall()
            messages = []
            for row in results:
                messages.append({
                    "sender_id": row[0],
                    "message_text": row[1],
                    "timestamp": row[2].isoformat() if row[2] else None
                })
            return messages
        except Exception as e:
            print(f"Error getting messages: {e}")
            return []
        finally:
            cur.close()
            conn.close()

    @staticmethod
    def save_message(appointment_id, sender_id, message_text):
        conn = get_connection()
        cur = conn.cursor()
        query = """
            INSERT INTO message (appointment_id, sender_id, message_text)
            VALUES (%s, %s, %s)
            RETURNING timestamp
        """
        try:
            cur.execute(query, (appointment_id, sender_id, message_text))
            timestamp = cur.fetchone()[0]
            conn.commit()
            return timestamp
        except Exception as e:
            print(f"Error saving message: {e}")
            return datetime.now()
        finally:
            cur.close()
            conn.close()

    # 🟢 NEW METHOD
    @staticmethod
    def mark_messages_as_read(appointment_id, user_id):
        """Mark messages in this appointment as read if they were sent by the OTHER person."""
        conn = get_connection()
        cur = conn.cursor()
        try:
            query = """
                UPDATE message 
                SET is_read = TRUE 
                WHERE appointment_id = %s 
                AND sender_id != %s
            """
            cur.execute(query, (appointment_id, user_id))
            conn.commit()
        except Exception as e:
            print(f"Error marking messages read: {e}")
        finally:
            cur.close()
            conn.close()