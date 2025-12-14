from flask import Blueprint, jsonify, request,send_from_directory
from utils.db import get_connection
from psycopg2.extras import RealDictCursor ,Json
import traceback
import os
import base64
from psycopg2 import sql
from werkzeug.utils import secure_filename
from utils.supabase_client import upload_file
from werkzeug.utils import secure_filename


tutee_bp = Blueprint('tutee', __name__)
tutor_bp = Blueprint('tutor', __name__)
tutor_badges_bp = Blueprint('tutor_badges', __name__) 

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



@tutor_bp.route("/all")
def get_all_tutors():
    try:
        conn = get_connection()
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT * FROM tutor")  # fetch all tutors
                tutors = cursor.fetchall()

        # Convert profile_img BYTEA to base64 for each tutor
        for tutor in tutors:
            if "profile_img" in tutor and tutor["profile_img"]:
                tutor["profile_img"] = base64.b64encode(tutor["profile_img"]).decode("utf-8")
            else:
                tutor["profile_img"] = None

        return jsonify(tutors), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
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

                # Fetch availability only
                cursor.execute("""
                    SELECT 
                        vacant_id,
                        day_of_week,
                        start_time,
                        end_time
                    FROM availability
                    WHERE tutor_id = %s
                    ORDER BY day_of_week, start_time;
                """, (tutor_id,))
                availability = cursor.fetchall()

                # Format times as strings
                for slot in availability:
                    slot["start_time"] = slot["start_time"].strftime("%H:%M:%S")
                    slot["end_time"] = slot["end_time"].strftime("%H:%M:%S")

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
            "availability": availability,
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

# === GET TOTAL BADGES PER TUTOR ===
@tutor_bp.route("/badge_counts/<tutor_id>", methods=["GET"])
def get_badge_counts(tutor_id):
    try:
        conn = get_connection()
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT
                        COALESCE(SUM(CASE WHEN friendly THEN 1 ELSE 0 END), 0) AS friendly_count,
                        COALESCE(SUM(CASE WHEN punctual THEN 1 ELSE 0 END), 0) AS punctual_count,
                        COALESCE(SUM(CASE WHEN engaging THEN 1 ELSE 0 END), 0) AS engaging_count,
                        COALESCE(SUM(CASE WHEN proficient THEN 1 ELSE 0 END), 0) AS proficient_count
                    FROM tutor_badges
                    WHERE tutor_id = %s
                """, (tutor_id,))
                counts = cursor.fetchone()
        return jsonify(counts), 200
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
    

    

UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads", "reports")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)



@tutee_bp.route("/report", methods=["POST"])
def create_report():
    try:
        reporter_id = request.form.get("reporter_id")
        reported_id = request.form.get("reported_id")
        description = request.form.get("description", "")
        report_type = request.form.get("type", "TUTOR_REPORT")
        reasons = request.form.getlist("reasons")

        if not reporter_id or not reported_id:
            return jsonify({"error": "Missing reporter_id or reported_id"}), 400

        if reporter_id == reported_id:
            return jsonify({"error": "You cannot report yourself."}), 400

      
        conn = get_connection()
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    INSERT INTO report (reporter_id, reported_id, description, type, reasons, files, status)
                    VALUES (%s, %s, %s, %s, %s, %s, 'PENDING')
                    RETURNING report_id;
                """, (
                    reporter_id,
                    reported_id,
                    description,
                    report_type,
                    reasons or [],
                    []
                ))
                report_id = cursor.fetchone()["report_id"]

      
        uploaded_urls = []
        files = request.files.getlist("files")

     
        folder_name = secure_filename(str(reported_id))

        for file in files:
            if file and file.filename:
                public_url = upload_file(
                    bucket_name="reports",
                    file_obj=file,
                    folder_name=folder_name,
                    filename_prefix=f"{report_id}_",   
                )
                if public_url:
                    uploaded_urls.append(public_url)

     
        conn = get_connection()
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    UPDATE report
                    SET files = %s
                    WHERE report_id = %s;
                """, (uploaded_urls, report_id))

        return jsonify({
            "message": "Report submitted successfully",
            "report_id": report_id,
            "file_urls": uploaded_urls
        }), 201

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500




@tutee_bp.route("/reports/files/<filename>", methods=["GET"])
def get_report_file(filename):
    try:
        return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=False)
    except FileNotFoundError:
        return jsonify({"error": "File not found"}), 404
    

@tutor_bp.route("/update_profile_img", methods=["POST"])
def update_profile_img():
    try:
        tutor_id = request.form.get("tutor_id")
        if not tutor_id:
            return jsonify({"error": "Missing tutor_id"}), 400

        # Get uploaded file
        file = request.files.get("profile_img")
        if not file or file.filename == "":
            return jsonify({"error": "No file uploaded"}), 400

        # Read file as bytes
        profile_img_bytes = file.read()

        # Convert to base64 for immediate frontend use
        profile_img_base64 = base64.b64encode(profile_img_bytes).decode("utf-8")

        # Update DB
        conn = get_connection()
        with conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE tutor
                    SET profile_img = %s
                    WHERE tutor_id = %s
                """, (profile_img_bytes, tutor_id))

        
        return jsonify({
            "message": "Profile image updated successfully",
            "profile_img": profile_img_base64
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

