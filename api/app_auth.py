from authlib.integrations.flask_client import OAuth
from flask import url_for, session, redirect, request, Blueprint, jsonify, current_app
from config import Config
from utils.db import get_connection
from psycopg2.extras import RealDictCursor
from datetime import datetime
import requests

oauth = OAuth()
auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login')
def login():
    """
    Redirects the user to Google's authentication page.
    """
  
    redirect_uri = url_for('auth.auth', _external=True)
    return oauth.google.authorize_redirect(redirect_uri, hd='g.msuiit.edu.ph', prompt='login')

@auth_bp.route('/callback')
def auth():
    """
    Handles the callback from Google after successful authentication.
    """
    
    token = oauth.google.authorize_access_token()

  
    user_info = token.get('userinfo')

    try:
        conn = get_connection()
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # Check status
                cursor.execute("SELECT status FROM user_account WHERE google_id = %s", (user_info['sub'],))
                user_record = cursor.fetchone()

                if user_record and user_record.get('status') == 'BANNED':
                    return "Your account has been suspended. Please contact the administrator.", 403
    except Exception as e:
        print("Auth Error:", e)
        return "Internal Server Error", 500
 
    if not user_info['email'].endswith('@g.msuiit.edu.ph'):
        return "Unauthorized: Please use your university email.", 403
    print("DEBUG USER_INFO:", user_info) 
   
    session.permanent = True
    session['user'] = user_info

 
    try:
        conn = get_connection()
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:

                cursor.execute("SELECT user_id FROM user_account WHERE google_id = %s", (user_info['sub'],))
                existing_user = cursor.fetchone()
                if existing_user:
              

                    
                    cursor.execute("""
                        UPDATE user_account 
                        SET last_login = %s 
                        WHERE google_id = %s
                    """, (datetime.now(), user_info['sub']))
                    pass
                else:
                    cursor.execute("""
                        INSERT INTO user_account (google_id, email, role, last_login)
                        VALUES (%s, %s, %s, %s)
                    """, (user_info['sub'], user_info['email'], 'TUTEE', datetime.now()))

    except Exception as e:
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500


 
    return redirect(Config.FRONTEND_URL) 

@auth_bp.route('/get_user')
def get_user():
    """
    An API endpoint to get the currently logged-in user's data.
    """
    user = session.get('user')
    if not user:
        return jsonify({'error': 'User not logged in'}), 401

    registered = False
    try:
        conn = get_connection()
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT 1 FROM tutee WHERE google_id = %s", (user['sub'],))
                if cursor.fetchone():
                    registered = True
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500

  
    user_with_status = dict(user)
    user_with_status['registered_tutee'] = registered

    return jsonify(user_with_status)

@auth_bp.route('/register_tutee', methods=['POST'])
def register_tutee():
    """
    An API endpoint to register the logged-in user as a tutee.
    Expects JSON data with additional tutee information.
    """
    user = session.get('user')
    if not user:
        return jsonify({'error': 'User not logged in'}), 401

    data = request.json
    first_name = data.get('first_name')
    middle_name = data.get('middle_name')
    last_name = data.get('last_name')
    year_level = data.get('year_level')
    program_code = data.get('program_code')
    id_number = data.get('id_number')

    try:
        conn = get_connection()
        with conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO tutee (id_number, first_name, middle_name, last_name, year_level, program_code, google_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (id_number, first_name, middle_name, last_name, year_level, program_code, user['sub'],))
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500

    return jsonify({'message': 'Tutee registered successfully'})

@auth_bp.route('/logout')
def logout():
    """
    Logs the user out by clearing the session.
    """
    session.pop('user', None)
  
    response = redirect(Config.FRONTEND_URL)
    response.delete_cookie(current_app.config.get("SESSION_COOKIE_NAME", "session"), path='/', domain='localhost')

    return response