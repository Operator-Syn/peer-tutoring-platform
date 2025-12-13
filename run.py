from app import create_app, socketio
from werkzeug.middleware.proxy_fix import ProxyFix # Import this!
import eventlet
import eventlet.wsgi

app = create_app()

# --- CLOUDFLARE TUNNEL CONFIGURATION ---
# 1. Trust the headers from Cloudflare (fixes the double IP issue)
# This tells Flask: "The request is actually HTTPS, even if it looks like HTTP locally."
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

# 2. Security Settings for HTTPS (Cloudflare)
# Since your domain is https://..., cookies MUST be Secure.
app.config['SESSION_COOKIE_SECURE'] = True 
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# 3. Ensure Flask generates links with 'https://'
app.config['PREFERRED_URL_SCHEME'] = 'https' 
# --------------------------------------

if __name__ == "__main__":
    socketio.run(app, use_reloader=True)