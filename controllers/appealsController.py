from flask import Blueprint, jsonify, request, session
from utils.db import get_connection
from psycopg2.extras import RealDictCursor

bp_appeals = Blueprint("appeals", __name__, url_prefix="/api/appeals")

@bp_appeals.route("/submit", methods=["POST"])
def submit_appeal():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not authenticated"}), 401

    data = request.get_json()
    appeal_text = data.get("appeal_text")

    if not appeal_text:
        return jsonify({"error": "Appeal text is required"}), 400

    try:
        conn = get_connection()
        cur = conn.cursor()
        
        # Insert Appeal
        cur.execute("""
            INSERT INTO appeals (google_id, appeal_text, status)
            VALUES (%s, %s, 'PENDING')
        """, (user['sub'], appeal_text))
        
        conn.commit()
        return jsonify({"success": True, "message": "Appeal submitted successfully."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@bp_appeals.route("/all", methods=["GET"])
def get_appeals():
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Fetch appeals with user details
        cur.execute("""
            SELECT 
                a.appeal_id, a.appeal_text, a.status, a.date_submitted,
                t.first_name, t.last_name, t.id_number,
                ua.email, ua.google_id
            FROM appeals a
            JOIN user_account ua ON a.google_id = ua.google_id
            LEFT JOIN tutee t ON ua.google_id = t.google_id
            ORDER BY a.status = 'PENDING' DESC, a.date_submitted DESC
        """)
        appeals = cur.fetchall()
        
        # Format dates
        for a in appeals:
            if a['date_submitted']:
                a['date_submitted'] = a['date_submitted'].strftime("%Y-%m-%d %H:%M")

        return jsonify({"success": True, "appeals": appeals}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@bp_appeals.route("/resolve/<int:appeal_id>", methods=["PUT"])
def resolve_appeal(appeal_id):
    data = request.get_json()
    action = data.get("action")
    
    if action not in ['APPROVE', 'REJECT']:
        return jsonify({"error": "Invalid action"}), 400

    try:
        conn = get_connection()
        cur = conn.cursor()
        
        new_appeal_status = 'APPROVED' if action == 'APPROVE' else 'REJECTED'
        cur.execute("UPDATE appeals SET status = %s WHERE appeal_id = %s RETURNING google_id", (new_appeal_status, appeal_id))
        result = cur.fetchone()
        
        if not result:
            return jsonify({"error": "Appeal not found"}), 404
            
        google_id = result[0]

        if action == 'APPROVE':
            cur.execute("UPDATE user_account SET status = 'ACTIVE' WHERE google_id = %s", (google_id,))
        
        conn.commit()
        return jsonify({"success": True, "message": f"Appeal {new_appeal_status}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()