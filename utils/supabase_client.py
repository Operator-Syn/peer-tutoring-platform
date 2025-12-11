import os
from supabase import create_client, Client
from werkzeug.utils import secure_filename
from datetime import datetime

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(url, key)

def upload_file(bucket_name, file_obj, folder_name=""):
    """
    Uploads a file to Supabase and returns the public URL.
    bucket_name: 'appeal_evidence', 'cor_documents', etc.
    file_obj: The file object from request.files
    folder_name: Optional subfolder (e.g., user_id)
    """
    try:
        timestamp = int(datetime.now().timestamp())
        filename = secure_filename(f"{timestamp}_{file_obj.filename}")
        
        path = f"{folder_name}/{filename}" if folder_name else filename
        
        file_content = file_obj.read()
        
        supabase.storage.from_(bucket_name).upload(
            file=file_content,
            path=path,
            file_options={"content-type": file_obj.content_type}
        )
        
        public_url = supabase.storage.from_(bucket_name).get_public_url(path)
        return public_url

    except Exception as e:
        print(f"Supabase Upload Error: {str(e)}")
        raise e