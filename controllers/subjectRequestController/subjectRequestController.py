from flask import Blueprint, jsonify, request, session
from utils.db import get_connection

subject_request_bp = Blueprint("subject_request_bp", __name__)

@subject_request_bp.route("/api/request/subject", methods=["POST"])
def request_subject():
    user = session.get("user")
    if not user:
        return jsonify({"error": "You must be logged in to request a subject."}), 401

    data = request.get_json()
    subject_code = data.get("subject_code", "").strip()
    description = data.get("description", "").strip()

    if not subject_code:
        return jsonify({"error": "Subject code is required"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("SELECT id_number FROM tutee WHERE google_id = %s", (user['sub'],))
        row = cur.fetchone()
        
        if not row:
            return jsonify({"error": "User profile not found."}), 404
        
        requester_id = row[0]

        cur.execute("""
            INSERT INTO subject_request (requester_id, subject_code, description, status)
            VALUES (%s, %s, %s, 'PENDING')
        """, (requester_id, subject_code, description))
        
        conn.commit()
        return jsonify({"message": "Request submitted successfully"}), 201

    except Exception as e:
        conn.rollback()
        print("Error submitting subject request:", e)
        return jsonify({"error": "Internal server error"}), 500

    finally:
        cur.close()
        conn.close()