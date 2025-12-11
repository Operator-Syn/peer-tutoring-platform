from flask import Blueprint, jsonify, request, session
from utils.db import get_connection
from psycopg2.extras import RealDictCursor
from math import ceil

bp_appeals = Blueprint("appeals", __name__, url_prefix="/api/appeals")

@bp_appeals.route("/all", methods=["GET"])
def get_appeals():
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 5))
        status = request.args.get("status", "all")
        search = request.args.get("search", "").strip()
        sort_by = request.args.get("sort_by", "date_desc")

        offset = (page - 1) * limit
        
        where_clauses = []
        params = []

        if status != 'all':
            where_clauses.append("a.status = %s")
            params.append(status)
        
        if search:
            where_clauses.append("(t.first_name ILIKE %s OR t.last_name ILIKE %s OR t.id_number ILIKE %s)")
            wildcard = f"%{search}%"
            params.extend([wildcard, wildcard, wildcard])

        where_stmt = " WHERE " + " AND ".join(where_clauses) if where_clauses else ""

        sort_map = {
            "date_desc": "a.date_submitted DESC",
            "date_asc": "a.date_submitted ASC",
            "name_asc": "t.last_name ASC"
        }
        order_by = sort_map.get(sort_by, "a.date_submitted DESC")

        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute(f"SELECT COUNT(*) FROM appeals a JOIN user_account ua ON a.google_id = ua.google_id LEFT JOIN tutee t ON ua.google_id = t.google_id {where_stmt}", params)
        total_items = cur.fetchone()['count']

        sql = f"""
            SELECT 
                a.appeal_id, a.appeal_text, a.status, a.date_submitted,
                t.first_name, t.last_name, t.id_number,
                ua.email, ua.google_id
            FROM appeals a
            JOIN user_account ua ON a.google_id = ua.google_id
            LEFT JOIN tutee t ON ua.google_id = t.google_id
            {where_stmt}
            ORDER BY {order_by}
            LIMIT %s OFFSET %s
        """
        cur.execute(sql, params + [limit, offset])
        appeals = cur.fetchall()
        
        for a in appeals:
            if a['date_submitted']:
                a['date_submitted'] = a['date_submitted'].strftime("%Y-%m-%d %H:%M")

        cur.close()
        conn.close()

        pagination = {
            "total_items": total_items,
            "total_pages": ceil(total_items / limit) if limit > 0 else 1,
            "current_page": page,
            "items_per_page": limit
        }

        return jsonify({"success": True, "appeals": appeals, "pagination": pagination}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        pass

@bp_appeals.route("/submit", methods=["POST"])
def submit_appeal():
    user = session.get("user")
    if not user: return jsonify({"error": "Not authenticated"}), 401
    data = request.get_json()
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("INSERT INTO appeals (google_id, appeal_text, status) VALUES (%s, %s, 'PENDING')", (user['sub'], data.get("appeal_text")))
        conn.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@bp_appeals.route("/resolve/<int:appeal_id>", methods=["PUT"])
def resolve_appeal(appeal_id):
    data = request.get_json()
    action = data.get("action")
    if action not in ['APPROVE', 'REJECT']: return jsonify({"error": "Invalid action"}), 400
    try:
        conn = get_connection()
        cur = conn.cursor()
        new_status = 'APPROVED' if action == 'APPROVE' else 'REJECTED'
        cur.execute("UPDATE appeals SET status = %s WHERE appeal_id = %s RETURNING google_id", (new_status, appeal_id))
        res = cur.fetchone()
        if res and action == 'APPROVE':
            cur.execute("UPDATE user_account SET status = 'ACTIVE' WHERE google_id = %s", (res[0],))
        conn.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()