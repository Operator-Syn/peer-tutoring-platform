import subprocess
import threading
import sys

def stream_output(proc, prefix):
    """Read stdout of a process line by line and print with prefix."""
    try:
        for line in iter(proc.stdout.readline, ''):
            if line:
                print(f"[{prefix}] {line}", end="")
    except KeyboardInterrupt:
        proc.terminate()
        sys.exit(0)
    finally:
        proc.stdout.close()
        proc.wait()
        if proc.returncode != 0:
            raise RuntimeError(f"{prefix} process failed!")
        print(f"[{prefix}] Done!")

def run_frontend():
    proc = subprocess.Popen(
        "npm install && npm audit fix && npm run build",
        shell=True,
        cwd="views",
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        executable="/bin/bash"
    )
    stream_output(proc, "FRONTEND")

def run_backend_install():
    proc = subprocess.Popen(
        "pipenv install",
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        executable="/bin/bash"
    )
    stream_output(proc, "BACKEND")

def run_flask():
    proc = subprocess.Popen(
        "pipenv run flask run",
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        executable="/bin/bash"
    )
    stream_output(proc, "FLASK")

if __name__ == "__main__":
    try:
        # Start frontend and backend in parallel threads
        t_frontend = threading.Thread(target=run_frontend)
        t_backend = threading.Thread(target=run_backend_install)

        t_frontend.start()
        t_backend.start()

        # Wait for both to finish
        t_frontend.join()
        t_backend.join()

        # Then start Flask server in its own thread
        flask_thread = threading.Thread(target=run_flask)
        flask_thread.start()

        # Keep main thread alive to catch Ctrl+C
        while flask_thread.is_alive():
            flask_thread.join(timeout=1)

    except KeyboardInterrupt:
        print("\n[MAIN] Ctrl+C received, shutting down.")
        sys.exit(0)
