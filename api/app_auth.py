from authlib.integrations.flask_client import OAuth
from flask import url_for, session, redirect, request, Blueprint, jsonify, current_app
from config import Config
from utils.db import get_connection
from psycopg2.extras import RealDictCursor
from datetime import datetime

oauth = OAuth()
auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login')
def login():
    """
    Redirects the user to Google's authentication page.
    """
    # The redirect URI must match one of the authorized URIs in your Google Cloud project.
    redirect_uri = url_for('auth.auth', _external=True)
    # The 'hd' parameter is crucial for directing to your university's login portal.
    return oauth.google.authorize_redirect(redirect_uri, hd='g.msuiit.edu.ph')

@auth_bp.route('/callback')
def auth():
    """
    Handles the callback from Google after successful authentication.
    """
    # Exchange the authorization code for an access token.
    token = oauth.google.authorize_access_token()

    # The user's information is included in the 'userinfo' part of the token.
    # Authlib automatically fetches this when using OpenID Connect scopes.
    user_info = token.get('userinfo')
    # Enforce domain check
    if not user_info['email'].endswith('@g.msuiit.edu.ph'):
        return "Unauthorized: Please use your university email.", 403
    # print("DEBUG USER_INFO:", user_info) 
    # Store user information in the session.
    session.permanent = True
    session['user'] = user_info

    # DATABASE
    try:
        conn = get_connection()
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:

                cursor.execute("SELECT user_id FROM user_account WHERE google_id = %s", (user_info['sub'],))
                existing_user = cursor.fetchone()
                if existing_user:
                    # print("DEBUG :Google ID in user_account table already exists")
                    # User exists: update info or just proceed
                    pass
                else:
                    # cursor.execute("""
                    #     INSERT INTO tutee(first_name, last_name, year_level, program_code)
                    #     VALUES (%s, %s, %s, %s)
                    # """, (user_info['given_name'], user_info['family_name'], 1, 'BSCS'))


                    cursor.execute("""
                        INSERT INTO user_account (google_id, email, role, last_login)
                        VALUES (%s, %s, %s, %s)
                    """, (user_info['sub'], user_info['email'], 'TUTEE', datetime.now()))


    except Exception as e:
        if conn:
            conn.close()
        return jsonify({'error': str(e)}), 500


    # Redirect the user back to the frontend application.
    return redirect(Config.FRONTEND_URL) # Your React app's URL

@auth_bp.route('/get_user')
def get_user():
    """
    An API endpoint to get the currently logged-in user's data.
    """
    user = session.get('user')
    if not user:
        return jsonify({'error': 'User not logged in'}), 401
    return jsonify(user)

@auth_bp.route('/logout')
def logout():
    """
    Logs the user out by clearing the session.
    """
    session.pop('user', None)
    # Redirect back to the frontend after logout.
    response = redirect(Config.FRONTEND_URL)
    response.delete_cookie(current_app.config.get("SESSION_COOKIE_NAME", "session"))

    return response