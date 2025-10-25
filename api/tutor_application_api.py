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