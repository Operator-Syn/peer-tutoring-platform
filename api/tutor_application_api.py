from flask import Blueprint, request, jsonify
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
from utils.db import get_connection

tutor_application_bp = Blueprint("tutor_application", __name__)

@tutor_application_bp.route('/api/tutor-applications', methods =['POST'])
def submit_tutor_application():
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        student_id = data.get('student_id', '').strip()
        courses = data.get('courses', [])

        errors = []

        if not student_id:
            errors.append('Student ID is required')
        
        if not courses or len(courses) == 0:
            errors.append('At least one course must be selected')

        if errors:
            return jsonify({'errors': errors}), 400
        
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute(
            "SELECT id_number, first_name, last_name FROM tutee WHERE id_number = %s",
            (student_id,)
        )
        tutee = cursor.fetchone()
        
        if not tutee:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Student ID not found in system'}), 404


        cursor.execute("""
                       INSERT INTO tutor_application
                       (student_id, status, date_submitted)
                       VALUES (%s, %s, %s)
                       RETURNING application_id, date_submitted
                       """, (student_id, 'PENDING', datetime.now())
                       )
        
        new_application = cursor.fetchone()
        application_id = new_application['application_id']
        date_submitted = new_application['date_submitted']

        for course_code in courses:
            cursor.execute("""
                INSERT INTO application_courses (application_id, course_code)
                VALUES (%s, %s)
            """, (application_id, course_code))

        conn.commit()
        cursor.close()
        conn.close()

        response_data = {
            'message': 'Application submitted successfully',
            'application_id': application_id,
            'student_id': student_id,
            'student_name': f"{tutee['first_name']} {tutee['last_name']}",
            'status': 'PENDING',
            'date_submitted': date_submitted.isoformat(),
            'courses': courses
        }

        return jsonify(response_data), 201

    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        return jsonify({
            'error': 'An unexpected error occurred',
            'details': str(e)
        }), 500
    
#get courses to display in form
@tutor_application_bp.route('/api/courses', methods=['GET'])
def get_courses():
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("""
            SELECT course_code, course_name 
            FROM course 
            ORDER BY course_code
        """)
        
        courses = cursor.fetchall()
        cursor.close()
        conn.close()
        
        courses_list = [dict(course) for course in courses]
        
        return jsonify({
            'courses': courses_list,
            'total': len(courses_list)
        }), 200
        
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({
            'error': 'Failed to fetch courses',
            'details': str(e)
        }), 500
    
