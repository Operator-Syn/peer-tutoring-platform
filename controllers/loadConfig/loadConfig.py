from flask import Blueprint, jsonify
from dotenv import load_dotenv
import os

# Load .env from the project root
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

# Prefix all routes in this blueprint with /api
load_config_bp = Blueprint('load_config', __name__, url_prefix='/api')

@load_config_bp.route('/config', methods=['GET'])
def get_config():
    return jsonify({
        "VITE_API_BASE_URL": os.getenv("VITE_API_BASE_URL"),
        "FRONTEND_URL": os.getenv("FRONTEND_URL"),
        # add any other frontend vars you need
    })
