# Configuration Setup Guide

When you clone this repository for the first time, you’ll notice a few files ending with the `.configure` extension.  
These are **template configuration files** meant to help you set up your environment correctly.

---

## 📁 Files Requiring Configuration

| Template File          | Target File  | Purpose                                                           |
| ---------------------- | ------------ | ----------------------------------------------------------------- |
| `config.py.configure`  | `config.py`  | Defines Flask and PostgreSQL settings used by the backend.        |
| `views/.env.configure` | `views/.env` | Provides environment variables used by the frontend (Vite/React). |

---

## ⚙️ Setup Instructions

1. **Copy and rename each `.configure` file** by removing the `.configure` extension.

   ```bash
   cp config.py.configure config.py
   cp views/.env.configure views/.env
   ```

2 **Open the new files** and replace placeholder values with those matching your local system.

Example: views/.env
```
VITE_API_BASE_URL=http://localhost:5000
ALLOWED_HOSTS=localhost
```

Example: config.py

```
DB_NAME = "your_database_name"
DB_USER = "your_username"
DB_PASSWORD = "your_password"
DB_HOST = "localhost"
DB_PORT = 5432
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