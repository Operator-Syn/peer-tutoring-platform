# api/tutee_api.py
from flask import Blueprint, jsonify
from utils.db import get_connection
from psycopg2.extras import RealDictCursor

tutee_bp = Blueprint('tutee', __name__)

@tutee_bp.route("/all")
def get_all_tutees():
    try:
        conn = get_connection()
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT * FROM tutee")  # fetch all tutees
                users = cursor.fetchall()
        return jsonify(users)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

tutor_bp = Blueprint('tutor', __name__)

@tutor_bp.route("/all")
def get_all_tutors():
    try:
        conn = get_connection()
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT * FROM tutor")  # fetch all tutors
                tutors = cursor.fetchall()
        return jsonify(tutors)
    except Exception as e:
        return jsonify({"error": str(e)}), 500