from flask import Flask, send_from_directory, send_file, session, redirect, request, jsonify
from flask_cors import CORS
from werkzeug.utils import safe_join
import os
from config import Config
from api.tutor_application_api import tutor_application_bp
from authlib.integrations.flask_client import OAuth
from api.app_auth import auth_bp, oauth
from datetime import timedelta
from controllers.tuteeAppointmentsPageCardController.tuteeAppointmentsPageCardController import bp_appointments
from controllers.requestscontroller.requestscontroller import requests_bp  
from api.getuser import tutee_bp
from api.getuser import tutor_bp
from controllers.adminDashboardController import admin_dashboard_bp

# Existing controllers

# Authentication controller

# ---------- Flask app setup ----------
app = Flask(__name__, static_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), "views", "dist"))
CORS(app, supports_credentials=True)
app.secret_key = Config.SECRET_KEY  # required for session management
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=1)



oauth.init_app(app)
oauth.register(
    name='google',
    client_id=Config.GOOGLE_CLIENT_ID,
    client_secret=Config.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

# ---------- Register API routes ----------
app.register_blueprint(tutor_application_bp, url_prefix="/api/tutor-applications")
app.register_blueprint(bp_appointments)
app.register_blueprint(requests_bp) 
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(tutee_bp, url_prefix="/api/tutee")
app.register_blueprint(tutor_bp, url_prefix="/api/tutor")
app.register_blueprint(admin_dashboard_bp)
@app.route('/uploads/cor/<filename>')
def serve_cor_file(filename):
    return send_from_directory('uploads/cor', filename)
# ---------- Protect all API routes ----------

# @app.before_request
# def protect_api_routes():
#     # Skip login route
#     if request.path.startswith("/api/login"):
#         return

#     # Protect all other API routes
#     if request.path.startswith("/api/") and "username" not in session:
#         return jsonify({"success": False, "message": "Authentication required"}), 401


# ---------- React SPA serving ----------
INDEX_HTML = os.path.join(app.static_folder, "index.html")

# SPA routes that require login
PROTECTED_ROUTES = []

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    normalized_path = "/" + path.rstrip("/")

    # Redirect unauthenticated users to /login for protected SPA routes
    
    # if normalized_path in PROTECTED_ROUTES and "username" not in session:
    #     return redirect("/login")

    # Serve static files if they exist (JS, CSS, images)
    file_path = safe_join(app.static_folder, path)
    if path != "" and file_path and os.path.isfile(file_path):
        return send_from_directory(app.static_folder, path)

    # Fallback to React SPA for other routes (including 404)
    return send_file(INDEX_HTML)