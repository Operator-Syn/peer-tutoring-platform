from flask import Blueprint, jsonify, request
from utils.db import get_connection
from utils.supabase_client import upload_file
from psycopg2.extras import RealDictCursor

notes_sharing = Blueprint('notes_sharing', __name__)

@notes_sharing.route("/check-tutor/<tutor_id>", methods=['GET'])
def check_tutor(tutor_id):
    try:
        conn = get_connection()
        with conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM tutor WHERE tutor_id = %s AND status = 'ACTIVE'", (tutor_id,))
                tutor = cursor.fetchone()
                is_tutor = tutor is not None
        return jsonify({"is_tutor": is_tutor}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@notes_sharing.route("/all", methods=['POST'])
def post_notes():
    data = request.get_json()
    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    course_code = data.get('course_code', '').strip()
    file_urls = data.get('file_urls', [])  # Expecting a list of file metadata 
    tutor_id = data.get('tutor_id', '').strip()

    if not title or not course_code or not file_urls or not tutor_id:
        return jsonify({"error": "Title, course code, file_urls, and tutor ID are required."}), 400
    
    try:
        conn = get_connection()
        with conn:
            with conn.cursor() as cursor:
                insert_query = """
                    INSERT INTO posted_notes (title, description, course_code, file_urls, tutor_id)
                    VALUES (%s, %s, %s, %s, %s) RETURNING posted_note_id
                """
                cursor.execute(insert_query, (title, description, course_code, file_urls, tutor_id))
                note_id = cursor.fetchone()[0]

        return jsonify({"message": "Note shared successfully.", "note_id": note_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@notes_sharing.route("/upload-notes", methods=['POST'])
def upload_notes():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']
    tutor_id = request.form.get('tutor_id', '').strip()

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if not tutor_id:
        return jsonify({"error": "Tutor ID is required"}), 400

    try:
        public_url = upload_file("posted-notes", file, folder_name=tutor_id)
        return jsonify({"file_url": public_url}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@notes_sharing.route("/get-notes/<tutor_id>", methods=['GET'])
def get_notes(tutor_id):
    try:
        conn = get_connection()
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT * FROM posted_notes WHERE tutor_id = %s ORDER BY date_posted DESC", (tutor_id,))
                notes = cursor.fetchall()
        return jsonify(notes), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@notes_sharing.route("/courses/<tutor_id>")
def get_courses(tutor_id):
    try:
        conn = get_connection()
        with conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT course_code FROM teaches WHERE tutor_id = %s ORDER BY course_code",
                    (tutor_id,)
                )
                courses = [row[0] for row in cursor.fetchall()]
        return jsonify({"courses": courses})
    except Exception as e:
        return jsonify({"error": str(e)}), 500