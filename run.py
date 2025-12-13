from app import create_app, socketio

# Create the app (Configurations are now applied inside create_app)
app = create_app()

if __name__ == "__main__":
    # use_reloader=True is fine for dev, but careful in production with Eventlet
    socketio.run(app, use_reloader=True, host='0.0.0.0', port=5000)