from flask import Blueprint, jsonify, request
from utils.db import get_connection
from psycopg2.extras import RealDictCursor

tutee_list = Blueprint('tutee_list', __name__)
@tutee_list.route("/all", methods=['GET'])
def get_tutee_list():
    try:
        page = int(request.args.get('page', 1))
        per_page = 10
        offset = (page - 1) * per_page
        name = request.args.get('name', '').strip()

        conn = get_connection()
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # Build base query and params
                base_query = """
                    SELECT t.* FROM tutee t
                """
                wheres = []
                params = []

                if name:
                    wheres.append("(t.first_name ILIKE %s OR t.last_name ILIKE %s)")
                    params.extend([f"%{name}%", f"%{name}%"])

                # Combine query
                if wheres:
                    base_query += " WHERE " + " AND ".join(wheres)
                base_query += " ORDER BY t.last_name ASC, t.first_name ASC"
                base_query += " LIMIT %s OFFSET %s"
                params.extend([per_page, offset])

                cursor.execute(base_query, params)
                tutees = cursor.fetchall()

                # Count query for pagination
                count_query = "SELECT COUNT(*) FROM tutee t"
                if wheres:
                    count_query += " WHERE " + " AND ".join(wheres)

                cursor.execute(count_query, params[:-2])  # Exclude LIMIT and OFFSET
                total_count = cursor.fetchone()['count']
        return jsonify({
            'tutees': tutees,
            'total_count': total_count,
            'page': page,
            'per_page': per_page
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500