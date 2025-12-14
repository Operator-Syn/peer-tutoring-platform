from authlib.integrations.flask_client import OAuth
# Added make_response to handle headers manually
from flask import url_for, session, redirect, request, Blueprint, jsonify, current_app, make_response
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
  
    # Ideally, ensure ProxyFix is enabled in your main app.py so _external=True 
    # generates https:// links correctly behind Cloudflare.
    redirect_uri = url_for('auth.auth', _external=True)
    return oauth.google.authorize_redirect(redirect_uri, prompt='login')

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
                cursor.execute("SELECT status FROM user_account WHERE google_id = %s", (user_info['sub'],))
                user_record = cursor.fetchone()

                if user_record and user_record.get('status') == 'BANNED':
                    pass
    except Exception as e:
        print("Auth Error:", e)
        return "Internal Server Error", 500
 
    # if not user_info['email'].endswith('@g.msuiit.edu.ph'):
    #     return "Unauthorized: Please use your university email.", 403
    # print("DEBUG USER_INFO:", user_info) 
   
    session.permanent = True
    session['user'] = user_info

 
    try:
        conn = get_connection()
        # Use try-finally to ensure connection closes even if errors occur
        try:
            with conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:

                    # CONCURRENCY FIX: Use ON CONFLICT (Upsert) instead of Check-then-Insert
                    # This prevents race conditions if the user double-clicks login
                    cursor.execute("""
                        INSERT INTO user_account (google_id, email, role, last_login)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (google_id) 
                        DO UPDATE SET 
                            last_login = EXCLUDED.last_login
                    """, (user_info['sub'], user_info['email'], 'TUTEE', datetime.now()))
        finally:
            if conn:
                conn.close()

    except Exception as e:
        # Connection is already closed in finally block if it existed
        return jsonify({'error': str(e)}), 500


    # CLOUDFLARE FIX: Prevent caching of the redirect response
    # This ensures User A's session cookie isn't cached and served to User B.
    response = make_response(redirect(Config.FRONTEND_URL))
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
 
    return response 

@auth_bp.route('/get_user')
def get_user():
    """
    An API endpoint to get the currently logged-in user's data,
    including their ID, Role, and Tutor Status.
    """
    user = session.get('user')
    if not user:
        return jsonify({'error': 'User not logged in'}), 401

    # Default values
    registered = False
    id_number = None
    role = "GUEST"
    tutor_status = None
    account_status = "ACTIVE"

    try:
        conn = get_connection()
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # Optimized Query: Get ID, Role, Account Status, and Tutor Status at once
                # Updated Query in get_user()
                query = """
                    SELECT 
                        te.id_number AS tutee_id,  -- Get ID from the Tutee table, not User Account
                        ua.role,
                        ua.status AS account_status,
                        t.status AS tutor_status
                    FROM user_account ua
                    -- 1. Join Tutee using Google ID (Reliable)
                    LEFT JOIN tutee te ON ua.google_id = te.google_id
                    -- 2. Join Tutor using the ID found in Tutee
                    LEFT JOIN tutor t ON te.id_number = t.tutor_id
                    WHERE ua.google_id = %s
                """
                cursor.execute(query, (user['sub'],))
                result = cursor.fetchone()

                if result:
                    registered = True
                    id_number = result['tutee_id']
                    role = result['role']
                    account_status = result['account_status']
                    tutor_status = result['tutor_status']  # Will be None if they aren't a tutor

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    # Combine Google session data with DB data
    user_with_status = dict(user)
    user_with_status['registered_tutee'] = registered
    user_with_status['id_number'] = id_number
    user_with_status['role'] = role
    user_with_status['status'] = account_status
    user_with_status['tutor_status'] = tutor_status

    # Return response with cache control
    response = make_response(jsonify(user_with_status))
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    return response

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
        try:
            with conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO tutee (id_number, first_name, middle_name, last_name, year_level, program_code, google_id)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (id_number, first_name, middle_name, last_name, year_level, program_code, user['sub'],))
        finally:
            if conn:
                conn.close()
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    return jsonify({'message': 'Tutee registered successfully'})

@auth_bp.route('/logout')
def logout():
    """
    Logs the user out by clearing the session.
    """
    session.pop('user', None)
  
    response = make_response(redirect(Config.FRONTEND_URL))
    
    # FIX: Use dynamic domain or None. 'localhost' is invalid for production domains.
    # If SESSION_COOKIE_DOMAIN is not set in Config, it defaults to None (standard behavior)
    cookie_domain = current_app.config.get("SESSION_COOKIE_DOMAIN", None)
    
    response.delete_cookie(current_app.config.get("SESSION_COOKIE_NAME", "session"), path='/', domain=cookie_domain)
    
    # Prevent caching of logout so back button doesn't show logged in state
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'

    return response