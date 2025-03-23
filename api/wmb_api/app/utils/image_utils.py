import os
import shutil
from fastapi import UploadFile
from uuid import uuid4
import logging

logger = logging.getLogger(__name__)

# Direktori penyimpanan gambar
MEDIA_DIR = "media"

# Pastikan direktori media ada
os.makedirs(MEDIA_DIR, exist_ok=True)

async def save_upload_file(upload_file: UploadFile, user_id: int) -> str:
    """
    Menyimpan file yang diupload dan mengembalikan nama file
    """
    file_extension = os.path.splitext(upload_file.filename)[1]
    # Buat nama file unik menggunakan uuid dan user_id
    filename = f"profile_{user_id}_{uuid4().hex}{file_extension}"
    file_path = os.path.join(MEDIA_DIR, filename)
    
    # Simpan file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    
    return filename

def delete_profile_image(filename: str) -> bool:
    """
    Menghapus file gambar profil
    """
    file_path = os.path.join(MEDIA_DIR, filename)
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception as e:
        logger.error(f"Error menghapus file {file_path}: {str(e)}")
        return False