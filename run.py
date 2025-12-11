from app import create_app, socketio
from config import Config
import eventlet
import eventlet.wsgi

app = create_app()

if __name__ == "__main__":
    # Use eventlet server instead of the default Flask dev server
    socketio.run(app, use_reloader=True)