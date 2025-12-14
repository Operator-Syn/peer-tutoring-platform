import os
from supabase import create_client
from werkzeug.utils import secure_filename
from datetime import datetime

SUPABASE_URL = os.getenv("SUPABASE_URL")

SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def upload_file(bucket_name, file_obj, folder_name="", filename_prefix="", upsert=True):
    """
    Uploads a file to Supabase Storage and returns:
      - public_url (if bucket is public)
      - path (always useful to store in DB even if bucket is private)
    """
    ts = int(datetime.utcnow().timestamp())
    original_name = secure_filename(file_obj.filename or "file")
    filename = secure_filename(f"{filename_prefix}{ts}_{original_name}")
    path = f"{folder_name}/{filename}" if folder_name else filename

    file_bytes = file_obj.read()  # FileStorage bytes

    # supabase-py expects bytes for "file"
    res = supabase.storage.from_(bucket_name).upload(
        path,
        file_bytes,
        {"content-type": file_obj.mimetype or file_obj.content_type, "upsert": str(upsert).lower()},
    )

    # if upload failed, supabase-py usually returns an error-ish dict
    if isinstance(res, dict) and res.get("error"):
        raise Exception(res["error"])

    public_url = supabase.storage.from_(bucket_name).get_public_url(path)

    return {"public_url": public_url, "path": path}
