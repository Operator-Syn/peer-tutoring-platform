import os
from datetime import timedelta
from flask import Flask, send_from_directory, send_file
from flask_cors import CORS
from flask_socketio import SocketIO
from werkzeug.utils import safe_join
from werkzeug.middleware.proxy_fix import ProxyFix
from config import Config

# Expose socketio globally so run.py can import it
socketio = SocketIO(cors_allowed_origins="*")

def create_app():
    app = Flask(
        __name__,
        static_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), "views", "dist")
    )

    # ---------------------------------------------------------
    # 1. CONFIGURATION & SECURITY
    # ---------------------------------------------------------
    app.config.from_object(Config)  # Load general config from Config class
    
    # Cloudflare & HTTPS Security
    # Trust Cloudflare Headers (X-Forwarded-Proto) to ensure url_for() generates 'https://'
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)
    
    # Session Security
    app.config.update(
        SESSION_COOKIE_SECURE=True,      # Cookies only sent over HTTPS
        SESSION_COOKIE_SAMESITE='Lax',   # Prevents CSRF while allowing OAuth redirects
        PREFERRED_URL_SCHEME='https',
        PERMANENT_SESSION_LIFETIME=timedelta(days=1),
        SECRET_KEY=Config.SECRET_KEY
    )

    # ---------------------------------------------------------
    # 2. INITIALIZE EXTENSIONS
    # ---------------------------------------------------------
    CORS(app, supports_credentials=True)
    socketio.init_app(app)

    # OAuth Setup
    from api.app_auth import oauth
    oauth.init_app(app)
    oauth.register(
        name='google',
        client_id=Config.GOOGLE_CLIENT_ID,
        client_secret=Config.GOOGLE_CLIENT_SECRET,
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'}
    )

    # ---------------------------------------------------------
    # 3. IMPORT & REGISTER BLUEPRINTS
    # ---------------------------------------------------------
    # Imports are placed here to avoid circular dependency issues
    from api.app_auth import auth_bp
    from api.tutor_application_api import tutor_application_bp
    from api.getuser import tutee_bp, tutor_bp
    from api.tutor_list import tutor_list
    from api.tutee_list import tutee_list
    
    from controllers.tuteeAppointmentsPageCardController.tuteeAppointmentsPageCardController import bp_appointments
    from controllers.createAppointmentFormController.createAppointmentFormController import bp_fillout
    from controllers.getCreateAppointmentsFormScheduleController.getCreateAppointmentsFormScheduleController import bp_availability
    from controllers.createNewPendingAppointmentController.createNewPendingAppointmentController import bp_create_pending
    from controllers.requestscontroller.requestscontroller import requests_bp
    from controllers.loadConfig.loadConfig import load_config_bp
    from controllers.adminDashboardController import admin_dashboard_bp
    from controllers.appealsController import bp_appeals
    from controllers.chatUserController.chatUserController import chat_bp

    # -- Auth & Users --
    app.register_blueprint(auth_bp, url_prefix="/api/auth") # URI: https://<domain>/api/auth/callback
    app.register_blueprint(tutee_bp, url_prefix="/api/tutee")
    app.register_blueprint(tutor_bp, url_prefix="/api/tutor")
    app.register_blueprint(tutor_list, url_prefix="/api/tutor-list")
    # app.register_blueprint(tutee_list, url_prefix="/api/tutee-list") # Uncomment if needed

    # -- Core Features --
    app.register_blueprint(tutor_application_bp, url_prefix="/api/tutor-applications")
    app.register_blueprint(bp_appointments)
    app.register_blueprint(requests_bp)
    app.register_blueprint(bp_fillout)
    app.register_blueprint(bp_availability)
    app.register_blueprint(bp_create_pending)
    app.register_blueprint(chat_bp)

    # -- Admin & System --
    app.register_blueprint(admin_dashboard_bp)
    app.register_blueprint(load_config_bp)
    app.register_blueprint(bp_appeals) # Registered (was missing in original)

    # ---------------------------------------------------------
    # 4. ROUTES
    # ---------------------------------------------------------
    @app.route('/uploads/cor/<filename>')
    def serve_cor_file(filename):
        return send_from_directory('uploads/cor', filename)

    # React SPA Fallback
    INDEX_HTML = os.path.join(app.static_folder, "index.html")

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_react(path):
        file_path = safe_join(app.static_folder, path)
        if path and os.path.isfile(file_path):
            return send_from_directory(app.static_folder, path)
        return send_file(INDEX_HTML)
    
    return app