import os
from supabase import create_client, Client
from werkzeug.utils import secure_filename
from datetime import datetime

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(url, key)

def upload_file(bucket_name, file_obj, folder_name="", filename_prefix=""):
    """
    Uploads a file to Supabase and returns the public URL.

    bucket_name: e.g. "reports"
    file_obj: Werkzeug FileStorage from request.files
    folder_name: folder inside bucket (e.g. "2023-3984")
    filename_prefix: prefix for filename (e.g. "1_")
    """
    try:
        ts = int(datetime.now().timestamp())

        original_name = secure_filename(file_obj.filename or "file")
        # ✅ must start with report_id (example: "1_")
        filename = secure_filename(f"{filename_prefix}{ts}_{original_name}")

        path = f"{folder_name}/{filename}" if folder_name else filename

        file_content = file_obj.read()

        supabase.storage.from_(bucket_name).upload(
            path=path,
            file=file_content,
            file_options={"content-type": file_obj.content_type},
        )

        public_url = supabase.storage.from_(bucket_name).get_public_url(path)
        return public_url

    except Exception as e:
        print(f"Supabase Upload Error: {str(e)}")
        raise
