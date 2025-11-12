# api/tutee_api.py
from flask import Blueprint, jsonify
from utils.db import get_connection
from psycopg2.extras import RealDictCursor

tutee_bp = Blueprint('tutee', __name__)

@tutee_bp.route("/all")
def get_all_tutees():
    try:
        conn = get_connection()
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT * FROM tutee")  # fetch all tutees
                users = cursor.fetchall()
        return jsonify(users)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

tutor_bp = Blueprint('tutor', __name__)

@tutor_bp.route("/all")
def get_all_tutors():
    try:
        conn = get_connection()
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT * FROM tutor")  # fetch all tutors
                tutors = cursor.fetchall()
        return jsonify(tutors)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@tutor_bp.route("/<tutor_id>")
def get_tutor(tutor_id):
    try:
        conn = get_connection()
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # --- 1️⃣ Fetch tutor info ---
                cursor.execute("""
                    SELECT 
                        t.tutor_id,
                        tt.first_name,
                        tt.middle_name,
                        tt.last_name,
                        tt.year_level,
                        tt.program_code,
                        p.program_name,
                        t.status
                    FROM tutor t
                    JOIN tutee tt ON t.tutor_id = tt.id_number
                    LEFT JOIN program p ON tt.program_code = p.program_code
                    WHERE t.tutor_id = %s
                """, (tutor_id,))
                
                tutor = cursor.fetchone()
                if not tutor:
                    return jsonify({"error": "Tutor not found"}), 404

                # --- 2️⃣ Fetch availability & appointments ---
                cursor.execute("""
                    SELECT 
                        a.vacant_id,
                        a.day_of_week,
                        a.start_time,
                        a.end_time,
                        ap.appointment_id,
                        ap.appointment_date,
                        ap.status AS appointment_status
                    FROM availability a
                    LEFT JOIN appointment ap ON a.vacant_id = ap.vacant_id
                    WHERE a.tutor_id = %s
                    ORDER BY a.day_of_week, a.start_time;
                """, (tutor_id,))
                
                schedule = cursor.fetchall()
                # Convert times/dates to strings
                for slot in schedule:
                    slot["start_time"] = slot["start_time"].strftime("%H:%M:%S") if slot["start_time"] else None
                    slot["end_time"] = slot["end_time"].strftime("%H:%M:%S") if slot["end_time"] else None
                    slot["appointment_date"] = slot["appointment_date"].strftime("%Y-%m-%d") if slot["appointment_date"] else None

                # --- 3️⃣ Fetch teaches / courses ---
                cursor.execute("""
                    SELECT course_code 
                    FROM teaches 
                    WHERE tutor_id = %s
                """, (tutor_id,))
                
                courses = [row["course_code"] for row in cursor.fetchall()]

        # --- 4️⃣ Structure the response ---
        response = {
            "tutor_id": tutor["tutor_id"],
            "first_name": tutor["first_name"],
            "middle_name": tutor["middle_name"] or "",
            "last_name": tutor["last_name"],
            "year_level": tutor["year_level"],
            "program_code": tutor["program_code"],
            "program_name": tutor["program_name"],
            "status": tutor["status"],
            "schedule": schedule,   # availability + appointments
            "courses": courses      # new field: list of course codes
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
