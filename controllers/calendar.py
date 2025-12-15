from flask import Blueprint, jsonify, request, session
from utils.db import get_connection
from psycopg2.extras import RealDictCursor

calendar_bp = Blueprint('calendar', __name__)

@calendar_bp.route('/my-calendar', methods=['GET'])
def get_calendar_appointments():
    user_id = request.args.get('user_id') 
    role = request.args.get('role', 'both')  # 'tutor', 'tutee', or 'both'

    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        base_query = """
            SELECT 
                a.appointment_id,
                a.appointment_date,
                a.status,
                a.course_code,
                tutee.first_name AS tutee_first_name,
                tutee.last_name AS tutee_last_name,
                tutor_tutee.first_name AS tutor_first_name,
                tutor_tutee.last_name AS tutor_last_name,
                av.start_time, 
                av.end_time
            FROM appointment a
            JOIN tutee tutee ON a.tutee_id = tutee.id_number
            JOIN availability av ON a.vacant_id = av.vacant_id
            JOIN tutor tutor ON av.tutor_id = tutor.tutor_id
            JOIN tutee tutor_tutee ON tutor.tutor_id = tutor_tutee.id_number
        """
        if role == 'tutee':
            base_query += " WHERE a.tutee_id = %s AND a.status IN ('PENDING', 'BOOKED', 'COMPLETED')"
            params = (user_id,)
        elif role == 'tutor':
            base_query += " WHERE av.tutor_id = %s AND a.status IN ('PENDING', 'BOOKED', 'COMPLETED')"
            params = (user_id,)
        else:
            base_query += " WHERE (a.tutee_id = %s OR av.tutor_id = %s) AND a.status IN ('PENDING', 'BOOKED', 'COMPLETED')"
            params = (user_id, user_id)

        base_query += " ORDER BY a.appointment_date DESC, av.start_time ASC"
        cursor.execute(base_query, params)
        appointments = cursor.fetchall()

        # Format for frontend
        events = []
        for appt in appointments:
            start_dt = f"{appt['appointment_date']} {appt['start_time']}"
            end_dt = f"{appt['appointment_date']} {appt['end_time']}"
            color_map = {
                'BOOKED': '#28a745',
                'PENDING': '#ffc107',
                'COMPLETED': '#6c757d'
            }
            if role == 'tutee':
                display_name = f"{appt['tutor_first_name']} {appt['tutor_last_name']}"
            else:
                display_name = f"{appt['tutee_first_name']} {appt['tutee_last_name']}"
            events.append({
                'id': appt['appointment_id'],
                'title': f"{appt['course_code']} - {display_name}",
                'start': start_dt,
                'end': end_dt,
                'status': appt['status'],
                'color': color_map.get(appt['status'], '#007bff')
            })

        return jsonify(events), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Failed to fetch calendar'}), 500
    finally:
        cursor.close()
        conn.close()

@calendar_bp.route('/check-if-tutor/<google_id>')
def check_if_tutor(google_id):

    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Get the user's tutee id_number using google_id
        cursor.execute("SELECT id_number FROM tutee WHERE google_id = %s", (google_id,))
        tutee_row = cursor.fetchone()
        if not tutee_row:
            return jsonify({'is_tutor': False, 'tutee_id': None}), 200

        tutee_id = tutee_row[0]

        # Check if this tutee_id exists in the tutor table
        cursor.execute("SELECT COUNT(*) FROM tutor WHERE tutor_id = %s", (tutee_id,))
        result = cursor.fetchone()
        is_tutor = result[0] > 0

        return jsonify({'is_tutor': is_tutor, 'tutee_id': tutee_id}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Failed to check tutor status'}), 500
    finally:
        cursor.close()
        conn.close()