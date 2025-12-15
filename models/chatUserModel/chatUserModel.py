# models/chatUserModel/chatUserModel.py
from utils.db import get_connection

class UserModel:
    @staticmethod
    def get_chat_users_for_user(user_id):
        conn = get_connection()
        cur = conn.cursor()
        
        query = """
            SELECT 
                CASE WHEN a.tutee_id = %s THEN tutor_info.first_name ELSE student_info.first_name END as first_name,
                CASE WHEN a.tutee_id = %s THEN tutor_info.last_name ELSE student_info.last_name END as last_name,
                CASE WHEN a.tutee_id = %s THEN tutor_info.id_number ELSE student_info.id_number END as partner_id,
                a.appointment_id,
                c.course_code,
                c.course_name,
                a.appointment_date,
                av.start_time,
                av.end_time,
                a.status, 
                (SELECT COUNT(*) FROM message m 
                 WHERE m.appointment_id = a.appointment_id 
                 AND m.is_read = FALSE 
                 AND m.sender_id != %s) as unread_count

            FROM appointment a
            JOIN availability av ON a.vacant_id = av.vacant_id
            JOIN tutee tutor_info ON av.tutor_id = tutor_info.id_number
            JOIN tutee student_info ON a.tutee_id = student_info.id_number
            JOIN course c ON a.course_code = c.course_code

            WHERE a.status IN ('BOOKED', 'COMPLETED', 'CANCELLED', 'PENDING') AND (a.tutee_id = %s OR av.tutor_id = %s)
            
            ORDER BY 
                (SELECT MAX(timestamp) FROM message WHERE message.appointment_id = a.appointment_id) DESC NULLS LAST, 
                a.appointment_date DESC;
        """

        # 🔴 Pass user_id 6 times
        params = (user_id, user_id, user_id, user_id, user_id, user_id)

        try:
            cur.execute(query, params)
            results = cur.fetchall()
            
            users = []
            for row in results:
                users.append({
                    "first_name": row[0],
                    "last_name": row[1],
                    "partner_id": row[2],
                    "appointment_id": row[3],
                    "course_code": row[4],
                    "course_name": row[5],
                    "appointment_date": str(row[6]), 
                    "start_time": str(row[7]), 
                    "end_time": str(row[8]),
                    "status": row[9],       
                    "unread_count": row[10]
                })
            
            return users
        except Exception as e:
            print(f"Error in UserModel: {e}")
            return []
        finally:
            cur.close()
            conn.close()