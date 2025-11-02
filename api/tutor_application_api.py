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
tutor_application_bp = Blueprint("tutor_application", __name__)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

@tutor_application_bp.route('/api/tutor-applications', methods=['POST'])
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
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO tutor_application (student_id, status, date_submitted, cor_filename, cor_filepath)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING application_id
        """, (student_id, 'PENDING', datetime.now(), filename, filepath))
        app_id = cursor.fetchone()[0]

        for course_code in courses:
            cursor.execute("""
                INSERT INTO application_courses (application_id, course_code)
                VALUES (%s, %s)
            """, (app_id, course_code))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({'message': 'Application submitted successfully', 'application_id': app_id}), 201

    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        return jsonify({'error': str(e)}), 500
    
#get courses to display in form
@tutor_application_bp.route('/courses', methods=['GET'])
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
    
