from flask import Blueprint, jsonify, request
from utils.db import get_connection
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
    files = data.get('files', [])  # Expecting a list of file metadata 
    tutor_id = data.get('tutor_id', '').strip()

    if not title or not course_code or not files or not tutor_id:
        return jsonify({"error": "Title, course code, files, and tutor ID are required."}), 400
    
    try:
        conn = get_connection()
        with conn:
            with conn.cursor() as cursor:
                insert_query = """
                    INSERT INTO posted_notes (title, description, course_code, files, tutor_id)
                    VALUES (%s, %s, %s, %s, %s) RETURNING posted_note_id
                """
                cursor.execute(insert_query, (title, description, course_code, files, tutor_id))
                note_id = cursor.fetchone()[0]

        return jsonify({"message": "Note shared successfully.", "note_id": note_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

