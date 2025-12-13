from flask import Blueprint, jsonify, request
from utils.db import get_connection
from psycopg2.extras import RealDictCursor

notes_sharing = Blueprint('notes_sharing', __name__)

