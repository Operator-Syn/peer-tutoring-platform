import os
from datetime import timedelta
from flask import Flask, send_from_directory, send_file
from flask_cors import CORS
from flask_socketio import SocketIO
from werkzeug.utils import safe_join
from werkzeug.middleware.proxy_fix import ProxyFix # Moved here
from config import Config

# Expose socketio so run.py can import it
socketio = SocketIO(cors_allowed_origins="*")

def create_app():
    app = Flask(
        __name__,
        static_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), "views", "dist")
    )

    # --- CLOUDFLARE & SECURITY CONFIGURATION (Moved from run.py) ---
    # 1. Trust Cloudflare Headers (X-Forwarded-Proto)
    # This ensures url_for() generates 'https://' links
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

    # 2. Session Security (Critical for HTTPS/Cloudflare)
    app.config['SESSION_COOKIE_SECURE'] = True  # Cookies only sent over HTTPS
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax' # Prevents CSRF while allowing OAuth redirects
    app.config['PREFERRED_URL_SCHEME'] = 'https'
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=1)
    
    # 3. App Secrets
    CORS(app, supports_credentials=True)
    app.secret_key = Config.SECRET_KEY

    # Initialize SocketIO with this app instance
    socketio.init_app(app)

    # ───── OAuth setup ─────
    from api.app_auth import oauth
    oauth.init_app(app)
    oauth.register(
        name='google',
        client_id=Config.GOOGLE_CLIENT_ID,
        client_secret=Config.GOOGLE_CLIENT_SECRET,
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'}
    )

    # ───── Register Blueprints ─────
    from api.tutor_application_api import tutor_application_bp
    from controllers.tuteeAppointmentsPageCardController.tuteeAppointmentsPageCardController import bp_appointments
    from controllers.createAppointmentFormController.createAppointmentFormController import bp_fillout
    from controllers.getCreateAppointmentsFormScheduleController.getCreateAppointmentsFormScheduleController import bp_availability
    from controllers.createNewPendingAppointmentController.createNewPendingAppointmentController import bp_create_pending
    from controllers.requestscontroller.requestscontroller import requests_bp
    from controllers.loadConfig.loadConfig import load_config_bp
    from api.getuser import tutee_bp, tutor_bp
    from controllers.adminDashboardController import admin_dashboard_bp
    from api.tutor_list import tutor_list
    from api.app_auth import auth_bp
    from controllers.chatUserController.chatUserController import chat_bp

    app.register_blueprint(tutor_application_bp, url_prefix="/api/tutor-applications")
    app.register_blueprint(bp_appointments)
    app.register_blueprint(requests_bp)
    
    # IMPORTANT: Your Google Console Redirect URI must match this prefix!
    # URI: https://<your-domain>/api/auth/callback
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    
    app.register_blueprint(bp_fillout)
    app.register_blueprint(bp_availability)
    app.register_blueprint(bp_create_pending)
    app.register_blueprint(tutee_bp, url_prefix="/api/tutee")
    app.register_blueprint(tutor_bp, url_prefix="/api/tutor")
    app.register_blueprint(tutor_list, url_prefix="/api/tutor-list")
    app.register_blueprint(admin_dashboard_bp)
    app.register_blueprint(load_config_bp)
    app.register_blueprint(chat_bp)

    @app.route('/uploads/cor/<filename>')
    def serve_cor_file(filename):
        return send_from_directory('uploads/cor', filename)

    # ───── React SPA fallback ─────
    INDEX_HTML = os.path.join(app.static_folder, "index.html")

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_react(path):
        file_path = safe_join(app.static_folder, path)
        if path and os.path.isfile(file_path):
            return send_from_directory(app.static_folder, path)
        return send_file(INDEX_HTML)
    
    return app