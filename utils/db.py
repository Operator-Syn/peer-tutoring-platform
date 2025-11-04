import psycopg2
from psycopg2.extras import RealDictCursor
import os
from config import Config

def get_connection():
    conn = psycopg2.connect(
        dbname=Config.DB_NAME,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        host=Config.DB_HOST,
        port=Config.DB_PORT
    )

    return conn