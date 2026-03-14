# Configuration Setup Guide

## 🧱 Application Stack

This application is built using the following technologies:

- **Backend:** Flask  
- **Frontend:** React (bundled with Vite)  
- **Database:** PostgreSQL  
- **Object Storage:** Supabase Storage (used as a file bucket)

The backend exposes APIs using Flask, the frontend is a React application served via Vite during development, PostgreSQL stores application data, and Supabase Storage is used to store uploaded files and other static assets.

---

## 📁 Files Requiring Configuration

When you clone this repository for the first time, you will notice several files ending with the `.configure` extension.

These are **template configuration files** intended to help you set up the project environment.

| Template File | Target File | Purpose |
|---|---|---|
| `config.py.configure` | `config.py` | Defines Flask and PostgreSQL settings used by the backend. |
| `.env.configure` | `.env` | Provides environment variables used by the frontend (Vite/React). |

---

## ⚙️ Setup Instructions

### 1. Copy the configuration templates

Rename each `.configure` file by removing the extension.

```bash
cp config.py.configure config.py
cp .env.configure .env
```

---

### 2. Update the configuration values

Open the newly created files and replace the placeholder values with those that match your local environment.

Example `.env`:

```
# ===== Backend =====
DB_NAME=your-DB_NAME
DB_USER=your-DB_USER
DB_PASSWORD=your-DB_PASSWORD
DB_HOST=your-DB_HOST
DB_PORT=your-DB_PORT

FRONTEND_URL=http://localhost:5000
CORS_ALLOWED_ORIGINS=http://localhost:5000

# ===== Frontend DEV (Vite) =====
VITE_API_BASE_URL=http://localhost:5000
ALLOWED_HOSTS=localhost

# ===== Flask =====
FLASK_APP=run.py
FLASK_RUN_HOST=localhost
FLASK_RUN_PORT=5000
FLASK_DEBUG=1
```

---

# 🚀 Running the Application

## Option 1 — Manual Setup

### 1. Install frontend dependencies

Navigate to the `views` directory.

```bash
cd views
npm install
```

This installs all required packages listed in `package.json`.  
You only need to run this command once unless dependencies change.

---

### 2. Install backend dependencies

Install Pipenv if it is not already available:

```bash
pip install pipenv
```

Move to the project root directory (where the `Pipfile` is located) and create the virtual environment:

```bash
pipenv shell
```

Install the Python dependencies:

```bash
pipenv install
```

---

### 3. Run the Flask server

```bash
flask run
```

---

## Option 2 — Automated Setup

After configuring `.env`, `config.py`, and `client_secret.json` in the project root, run the automated setup script:

```bash
python3 setup.py
```

This script installs the required dependencies and prepares the development environment automatically, **given that `.env` and `config.py` are properly set up**.