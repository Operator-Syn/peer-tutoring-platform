import subprocess
import threading
import sys
import platform
import os

# --- 1. Detect OS and Set Constants ---
IS_WINDOWS = platform.system() == "Windows"

# Linux/Mac often needs 'python3', Windows uses 'python'
PYTHON_CMD = "python" if IS_WINDOWS else "python3"

# Linux/Mac prefers explicit bash for some npm scripts; Windows uses cmd.exe (default)
# We pack this into a dictionary to unpack into Popen later
POPEN_DEFAULTS = {
    "shell": True,
    "stdout": subprocess.PIPE,
    "stderr": subprocess.STDOUT,
    "text": True,
    "bufsize": 1,
}

if not IS_WINDOWS:
    # Only force /bin/bash on Linux/Mac
    POPEN_DEFAULTS["executable"] = "/bin/bash"

def stream_output(proc, prefix):
    """Read stdout of a process line by line and print with prefix."""
    try:
        for line in iter(proc.stdout.readline, ''):
            if line:
                print(f"[{prefix}] {line}", end="")
    except Exception as e:
        print(f"[{prefix}] Error: {e}")
    finally:
        proc.stdout.close()
        proc.wait()
        if proc.returncode != 0:
            print(f"[{prefix}] Process exited with error code {proc.returncode}")
        else:
            print(f"[{prefix}] Done!")

def run_frontend():
    print(f"[FRONTEND] Building on {platform.system()}...")
    proc = subprocess.Popen(
        "npm install && npm audit fix && npm run build",
        cwd="views",
        **POPEN_DEFAULTS  # Unpacks shell=True, executable, etc.
    )
    stream_output(proc, "FRONTEND")

def run_backend_install():
    print(f"[BACKEND] Installing dependencies...")
    proc = subprocess.Popen(
        "pipenv install",
        **POPEN_DEFAULTS
    )
    stream_output(proc, "BACKEND")

def run_flask():
    print(f"[FLASK] Starting server using {PYTHON_CMD}...")
    proc = subprocess.Popen(
        f"pipenv run {PYTHON_CMD} run.py",
        **POPEN_DEFAULTS
    )
    stream_output(proc, "FLASK")

if __name__ == "__main__":
    try:
        # 1. Run Installers/Builders in Parallel
        t_frontend = threading.Thread(target=run_frontend)
        t_backend = threading.Thread(target=run_backend_install)

        t_frontend.start()
        t_backend.start()

        t_frontend.join()
        t_backend.join()

        # 2. Start Server
        flask_thread = threading.Thread(target=run_flask)
        flask_thread.start()

        # 3. Keep Alive
        while flask_thread.is_alive():
            flask_thread.join(timeout=1)

    except KeyboardInterrupt:
        print("\n[MAIN] Stopping...")
        sys.exit(0)