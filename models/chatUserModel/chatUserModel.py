# models/chatUserModel/chatUserModel.py
from utils.db import get_connection

class UserModel:
    @staticmethod
    def get_chat_users_for_user(user_id):
        conn = get_connection()
        cur = conn.cursor()
        
        query = """
            SELECT 
                -- 0. Partner First Name
                CASE 
                    WHEN a.tutee_id = %s THEN tutor_info.first_name 
                    ELSE student_info.first_name 
                END as first_name,
                
                -- 1. Partner Last Name
                CASE 
                    WHEN a.tutee_id = %s THEN tutor_info.last_name 
                    ELSE student_info.last_name 
                END as last_name,
                
                -- 2. Partner ID (User ID)
                CASE 
                    WHEN a.tutee_id = %s THEN tutor_info.id_number 
                    ELSE student_info.id_number 
                END as partner_id,

                -- 3. Appointment ID
                a.appointment_id,
                
                -- 4. Course Info
                c.course_code,
                c.course_name,

                -- 5. Date & Time (New Fields)
                a.appointment_date,
                av.start_time,
                av.end_time

            FROM appointment a
            JOIN availability av ON a.vacant_id = av.vacant_id
            JOIN tutee tutor_info ON av.tutor_id = tutor_info.id_number
            JOIN tutee student_info ON a.tutee_id = student_info.id_number
            JOIN course c ON a.course_code = c.course_code

            WHERE 
                a.status = 'BOOKED' 
                AND 
                (a.tutee_id = %s OR av.tutor_id = %s)
            
            ORDER BY a.appointment_date DESC, av.start_time DESC;
        """

        # We pass user_id 5 times to fill the 5 %s placeholders
        params = (user_id, user_id, user_id, user_id, user_id)

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
                    # Convert date/time objects to strings for JSON
                    "appointment_date": str(row[6]), 
                    "start_time": str(row[7]), 
                    "end_time": str(row[8])
                })
            
            return users
        except Exception as e:
            print(f"Error in UserModel: {e}")
            return []
        finally:
            cur.close()
            conn.close()