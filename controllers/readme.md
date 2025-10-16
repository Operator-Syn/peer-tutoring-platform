### ⚙️ Controllers

**Purpose**  
This folder contains the backend logic that handles incoming requests, interacts with models, and returns responses.

**Organization Rule**  
- Group **related controllers** into their own folders.  
  For example:
  
```
/controllers/
├── users/
│ ├── create_user.py
│ ├── update_user.py
│ └── delete_user.py
├── sessions/
│ ├── login.py
│ └── logout.py
└── tutoring/
├── request_tutor.py
└── assign_tutor.py
```

- Each folder should handle a **single feature domain** (e.g., `users`, `sessions`, `tutoring`).  
- Keep controller functions small and focused — one per file if practical.  
- Avoid placing unrelated logic (like database utilities or route registration) here.

**Tip**  
If you use a web framework like Flask, import controllers in your route registration file (e.g., `app.py` or `routes.py`) to keep routing centralized.
