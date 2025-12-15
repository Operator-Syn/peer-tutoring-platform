# utils/supabase_client.py
import os
import uuid
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# ✅ Load .env from project root (peertutoring/.env)
ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # ✅ must match .env key exactly

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_KEY in environment variables.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def upload_file(
    bucket_name: str,
    file_obj,
    folder_name: str = "",
    filename_prefix: str = "",
    upsert: bool = True,
):
    """
    Upload a file to Supabase storage and return:
      { "public_url": "...", "path": "bucket/folder/file.ext" }
    """
    ext = ""
    if getattr(file_obj, "filename", None):
        _, ext = os.path.splitext(file_obj.filename)

    filename = f"{filename_prefix}{uuid.uuid4().hex}{ext}"
    folder = (folder_name or "").strip("/")

    # storage path inside bucket
    storage_path = f"{folder}/{filename}" if folder else filename

    file_bytes = file_obj.read()
    # important: reset stream so Flask/werkzeug doesn't break if reused
    try:
        file_obj.stream.seek(0)
    except Exception:
        pass

    # upload
    supabase.storage.from_(bucket_name).upload(
        storage_path,
        file_bytes,
        {
            "content-type": getattr(file_obj, "mimetype", None)
            or getattr(file_obj, "content_type", None)
            or "application/octet-stream",
            "upsert": "true" if upsert else "false",
        },
    )

    public_url = supabase.storage.from_(bucket_name).get_public_url(storage_path)

    return {
        "public_url": public_url,
        "path": storage_path,
    }
