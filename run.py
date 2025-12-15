import os
from pathlib import Path
from dotenv import load_dotenv

# ✅ always load .env from the same folder as this run.py
ENV_PATH = Path(__file__).resolve().with_name(".env")
load_dotenv(dotenv_path=ENV_PATH, override=True)

from app import create_app, socketio
import sockets.sockets  # Ensure sockets are registered

app = create_app()

if __name__ == "__main__":
    socketio.run(
        app,
        use_reloader=True,
        host=os.getenv("FLASK_RUN_HOST", "0.0.0.0"),
        port=int(os.getenv("FLASK_RUN_PORT", "5000")),
    )
