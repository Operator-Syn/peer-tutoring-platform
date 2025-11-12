# api/tutee_api.py
from flask import Blueprint, jsonify,request
from utils.db import get_connection
from psycopg2.extras import RealDictCursor

tutee_bp = Blueprint('tutee', __name__)
tutor_bp = Blueprint('tutor', __name__)
tutor_badges_bp = Blueprint('tutor_badges', __name__) 

# === GET ALL TUTEES ===
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


# === GET ALL TUTORS ===
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
        import base64
        conn = get_connection()
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # Fetch tutor info
                cursor.execute("""
                    SELECT 
                        t.tutor_id,
                        tt.first_name,
                        tt.middle_name,
                        tt.last_name,
                        tt.year_level,
                        tt.program_code,
                        p.program_name,
                        t.status,
                        t.about,
                        t.profile_img,
                        tt.google_id
                    FROM tutor t
                    JOIN tutee tt ON t.tutor_id = tt.id_number
                    LEFT JOIN program p ON tt.program_code = p.program_code
                    WHERE t.tutor_id = %s
                """, (tutor_id,))
                
                tutor = cursor.fetchone()
                if not tutor:
                    return jsonify({"error": "Tutor not found"}), 404

                # Convert BYTEA to base64
                tutor["profile_img"] = (
                    base64.b64encode(tutor["profile_img"]).decode("utf-8")
                    if tutor["profile_img"] else None
                )

                # Availability + appointments
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

                for slot in schedule:
                    if slot["start_time"]:
                        slot["start_time"] = slot["start_time"].strftime("%H:%M:%S")
                    if slot["end_time"]:
                        slot["end_time"] = slot["end_time"].strftime("%H:%M:%S")
                    if slot["appointment_date"]:
                        slot["appointment_date"] = slot["appointment_date"].strftime("%Y-%m-%d")

                # Teaches courses
                cursor.execute("SELECT course_code FROM teaches WHERE tutor_id = %s", (tutor_id,))
                courses = [row["course_code"] for row in cursor.fetchall()]

        response = {
            "tutor_id": tutor["tutor_id"],
            "first_name": tutor["first_name"],
            "middle_name": tutor["middle_name"],
            "last_name": tutor["last_name"],
            "year_level": tutor["year_level"],
            "program_code": tutor["program_code"],
            "program_name": tutor["program_name"],
            "status": tutor["status"],
            "about": tutor["about"] or "",
            "profile_img": tutor["profile_img"],
            "google_id": tutor["google_id"],
            "schedule": schedule,
            "courses": courses
        }

        return jsonify(response), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500




# api/tutee_api.py


@tutee_bp.route("/by_google/<google_id>", methods=["GET"])
def get_tutee_by_google(google_id):
    try:
        conn = get_connection()
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(
                    "SELECT id_number FROM tutee WHERE google_id = %s",
                    (google_id,)
                )
                tutee = cursor.fetchone()

                if not tutee:
                    return jsonify({"error": "Tutee not found"}), 404

        return jsonify(tutee), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500



# === GIVE BADGES ===
# === POST badges to a tutor ===
@tutor_bp.route("/badges", methods=["POST"])
def give_badges():
    data = request.json
    tutee_id = data.get("tutee_id")
    tutor_id = data.get("tutor_id")
    friendly = data.get("friendly", False)
    punctual = data.get("punctual", False)
    engaging = data.get("engaging", False)
    proficient = data.get("proficient", False)

    if not tutee_id or not tutor_id:
        return jsonify({"error": "Missing tutee_id or tutor_id"}), 400

    try:
        conn = get_connection()
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    INSERT INTO tutor_badges (tutee_id, tutor_id, friendly, punctual, engaging, proficient)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (tutee_id, tutor_id) DO UPDATE
                    SET friendly = EXCLUDED.friendly,
                        punctual = EXCLUDED.punctual,
                        engaging = EXCLUDED.engaging,
                        proficient = EXCLUDED.proficient
                    RETURNING id;
                """, (tutee_id, tutor_id, friendly, punctual, engaging, proficient))
                badge_id = cursor.fetchone()["id"]
        return jsonify({"badge": badge_id}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@tutor_bp.route("/badges/<tutor_id>/<tutee_id>", methods=["GET"])
def get_badge_status(tutor_id, tutee_id):
    try:
        conn = get_connection()
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT friendly, punctual, engaging, proficient
                    FROM tutor_badges
                    WHERE tutor_id = %s AND tutee_id = %s
                """, (tutor_id, tutee_id))
                badge = cursor.fetchone()
                if not badge:
                    return jsonify({"message": "No badges yet"}), 404
        return jsonify(badge), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500




@tutor_bp.route("/update_about", methods=["POST"])
def update_about():
    data = request.json
    tutor_id = data.get("tutor_id")
    about = data.get("about")
    profile_img_base64 = data.get("profile_img")  # optional

    if not tutor_id:
        return jsonify({"error": "Missing tutor_id"}), 400

    try:
        conn = get_connection()
        with conn:
            with conn.cursor() as cursor:
                if profile_img_base64:
                    profile_img_bytes = base64.b64decode(profile_img_base64)
                    cursor.execute("""
                        UPDATE tutor
                        SET about = %s,
                            profile_img = %s
                        WHERE tutor_id = %s
                    """, (about, profile_img_bytes, tutor_id))
                else:
                    cursor.execute("""
                        UPDATE tutor
                        SET about = %s
                        WHERE tutor_id = %s
                    """, (about, tutor_id))

        return jsonify({"message": "Tutor info updated successfully"}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500