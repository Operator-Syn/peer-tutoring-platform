from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from datetime import datetime
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from utils.db import get_connection

upload_folder = "uploads/cor"
allowed_extensions = {'pdf', 'jpg', 'jpeg', 'png'}
os.makedirs(upload_folder, exist_ok=True)
tutor_application_bp = Blueprint("tutor_applications", __name__)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

@tutor_application_bp.route('/student/<student_id>', methods=['GET'])
def get_student_info(student_id):
    try:
        conn = get_connection()
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT id_number AS student_id, first_name, last_name
                    FROM tutee
                    WHERE id_number = %s
                """, (student_id,))
                student = cursor.fetchone()

        if student:
            return jsonify({
                'success': True,
                'student': student
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Student not found'
            }), 404
        
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({
            'success': False,
            'error': 'Failed to fetch student information',
            'details': str(e)
        }), 500

@tutor_application_bp.route('/tutor-applications', methods=['POST'])
def submit_tutor_application():
    try:
        student_id = request.form.get('student_id')
        courses = request.form.getlist('courses')
        file = request.files.get('corFile')

        if not student_id:
            return jsonify({'error': 'Student ID is required'}), 400
        if not courses:
            return jsonify({'error': 'At least one course must be selected'}), 400
        if not file or not allowed_file(file.filename):
            return jsonify({'error': 'Valid COR file (PDF, JPG, PNG) is required'}), 400

        filename = secure_filename(f"{student_id}_{file.filename}")
        filepath = os.path.join(upload_folder, filename)
        file.save(filepath)

        conn = get_connection()
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    INSERT INTO tutor_application (student_id, status, date_submitted, cor_filename, cor_filepath)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING application_id
                """, (student_id, 'PENDING', datetime.now(), filename, filepath))
                app_id = cursor.fetchone()['application_id']

                course_list = []
                for course_code in courses:
                    cursor.execute("""
                        INSERT INTO application_courses (application_id, course_code)
                        VALUES (%s, %s)
                    """, (app_id, course_code))

                    cursor.execute("""
                        SELECT course_code, course_name 
                        FROM course 
                        WHERE course_code = %s
                    """, (course_code,))
                    course = cursor.fetchone()
                    if course:
                        course_list.append(course)

        return jsonify({
            'success': True,
            'message': 'Application submitted successfully',
            'application_id': app_id,
            'student_id': student_id,
            'status': 'PENDING',
            'courses': course_list,
            'cor_filename': filename
        }), 201

    except Exception as e:
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500
    
#get courses to display in form
@tutor_application_bp.route('/courses', methods=['GET'])
def get_courses():
    try:
        conn = get_connection()
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("""
                    SELECT course_code, course_name 
                    FROM course 
                    ORDER BY course_code
                """)
                courses = cursor.fetchall()

        return jsonify({
            'courses': courses,
            'total': len(courses)
        }), 200
        
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({
            'error': 'Failed to fetch courses',
            'details': str(e)
        }), 500
