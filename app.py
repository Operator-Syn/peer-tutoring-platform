from flask import Flask, send_from_directory, send_file, session, redirect, request, jsonify
from werkzeug.utils import safe_join
import os
from config import Config

# Existing controllers

# Authentication controller

# ---------- Flask app setup ----------
app = Flask(__name__, static_folder=Config.REACT_DIST)
app.secret_key = Config.SECRET_KEY  # required for session management

# ---------- Register API routes ----------

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