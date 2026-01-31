# Configuration Setup Guide

When you clone this repository for the first time, you’ll notice a few files ending with the `.configure` extension.  
These are **template configuration files** meant to help you set up your environment correctly.

--- 

## 📁 Files Requiring Configuration

| Template File          | Target File  | Purpose                                                           |
| ---------------------- | ------------ | ----------------------------------------------------------------- |
| `config.py.configure`  | `config.py`  | Defines Flask and PostgreSQL settings used by the backend.        |
| `.env.configure` | `.env` | Provides environment variables used by the frontend (Vite/React). |

---

## ⚙️ Setup Instructions

1. **Copy and rename each `.configure` file** by removing the `.configure` extension.

   ```bash
   cp config.py.configure config.py
   cp .env.configure .env
   ```

2 **Open the new files** and replace placeholder values with those matching your local system.

Example: .env
```
# ===== Backend =====
DB_NAME=your-DB_NAME
DB_USER=your-DB_NAME
DB_PASSWORD=your-DB_PASSWORD
DB_HOST=your-DB_HOST
DB_PORT=your-DB_PORT

FRONTEND_URL=http://localhost:5000

CORS_ALLOWED_ORIGINS=http://localhost:5000

# ===== Frontend DEV (Vite) =====
VITE_API_BASE_URL=http://localhost:5000
ALLOWED_HOSTS=localhost

# ===== FLASK CONFIG =====
FLASK_APP=run.py
FLASK_RUN_HOST=localhost
FLASK_RUN_PORT=5000
FLASK_DEBUG=1
```

## ❓ How to get started?

1. Navigate to the `views` directory
   
   ```bash
   cd views
   ```
2. Install dependencies
   
   ```bash
   npm install
   ```
3. This will install all required packages based on the existing package.json. 💡 You only need to run npm install once, **unless dependencies change.**
   
4. **Install Pipenv** (if not already installed):

    ```bash
    pip install pipenv
    ```

5. Enter the project root (same directory as Pipfile)
6. Create and activate the virtual environment:
   ```bash
   pipenv shell
    ```
7. Install dependencies from the Pipfile:
   ```bash
   pipenv install
   ```
8. Run the Flask server:
   ```bash
   flask run
   ```

OR

## ❓ How to get started?

1. After setting your .env variables, config.py and client_secret.json at the project root.

2. Run the python script:
   ```bash
   python3 setup.py
   ```
