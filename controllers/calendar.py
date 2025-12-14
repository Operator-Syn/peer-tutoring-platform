from flask import Blueprint, jsonify, request
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
                t.first_name,
                t.last_name,
                av.start_time, 
                av.end_time
            FROM appointment a
            JOIN tutee t ON a.tutee_id = t.id_number
            JOIN availability av ON a.vacant_id = av.vacant_id
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
            events.append({
                'id': appt['appointment_id'],
                'title': f"{appt['course_code']} - {appt['first_name']}",
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