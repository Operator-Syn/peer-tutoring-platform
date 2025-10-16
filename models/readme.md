### 🧩 Models

**Purpose**  
This folder defines the data layer of the application — representing database tables, entities, and relationships.

**Organization Rule**  
- Group **related models** into their own folders.  
  For example:

```
/models/
├── users/
│ ├── user_model.py
│ └── profile_model.py
├── tutoring/
│ ├── tutor_model.py
│ └── session_model.py
└── feedback/
└── feedback_model.py
```

- Each folder should represent a **feature domain** or **database schema**.  
- Keep database queries, table mappings, and data validation logic close to the model they belong to.  
- Avoid mixing controller logic or utility functions here.

**Tip**  
Define your table structures and relationships within each model file, and initialize them in a central database utility (e.g., `db_utils.py`).
