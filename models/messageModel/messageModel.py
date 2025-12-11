from utils.db import get_connection

class MessageModel:
    @staticmethod
    def get_messages_by_appointment(appointment_id):
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT sender_id, message_text, timestamp FROM message WHERE appointment_id = %s ORDER BY timestamp ASC",
            (appointment_id,)
        )
        messages = [
            {"sender_id": r[0], "message_text": r[1], "timestamp": r[2].isoformat()}
            for r in cur.fetchall()
        ]
        cur.close()
        conn.close()
        return messages

    @staticmethod
    def save_message(appointment_id, sender_id, message_text):
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO message (appointment_id, sender_id, message_text) VALUES (%s, %s, %s) RETURNING timestamp",
            (appointment_id, sender_id, message_text)
        )
        timestamp = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return timestamp
