from flask import Blueprint, jsonify, request
from utils.db import get_connection
from psycopg2.extras import RealDictCursor

tutee_list = Blueprint('tutee_list', __name__)

@tutee_list.route("/all", methods=['GET'])
def get_tutee_list():
    try:
        # Pagination parameters
        page = int(request.args.get('page', 1))
        per_page = 10
        offset = (page - 1) * per_page

        # Sorting and searching parameters
        asc = request.args.get('asc', 'true').lower() == 'true'  # Convert to boolean
        sort_by = request.args.get('sortBy', 'last_name')  # Default sort column
        search = request.args.get('search', '').strip()  # Search query

        # Validate sort_by to prevent SQL injection
        valid_sort_columns = ['id_number', 'first_name', 'last_name', 'year_level', 'program_code']
        if sort_by not in valid_sort_columns:
            return jsonify({'error': f'Invalid sortBy value: {sort_by}'}), 400

        # Build the query
        conn = get_connection()
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                base_query = "SELECT t.* FROM tutee t"
                wheres = []
                params = []

                if search:
                    if sort_by in valid_sort_columns:
                        wheres.append(f"(t.{sort_by}::TEXT ILIKE %s)")
                        params.append(f"%{search}%")
                    else:
                        wheres.append("(t.first_name ILIKE %s OR t.last_name ILIKE %s)")
                        params.extend([f"%{search}%", f"%{search}%"])

                if wheres:
                    base_query += " WHERE " + " AND ".join(wheres)

                order_direction = "ASC" if asc else "DESC"
                base_query += f" ORDER BY t.{sort_by} {order_direction}"

                base_query += " LIMIT %s OFFSET %s"
                params.extend([per_page, offset])

                cursor.execute(base_query, params)
                tutees = cursor.fetchall()

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