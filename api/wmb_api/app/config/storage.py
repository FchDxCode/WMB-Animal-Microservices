import os
from pathlib import Path
from app.config.config import get_settings

settings = get_settings()

STORAGE_PATH = os.getenv("STORAGE_PATH", "C:\\storage\\")

# Pastikan folder storage ada
def ensure_storage_exists():
    """Memastikan folder storage ada, jika tidak maka akan dibuat"""
    storage_path = Path(STORAGE_PATH)
    
    if not storage_path.exists():
        os.makedirs(storage_path, exist_ok=True)
    
    profile_path = storage_path / "profile_images"
    if not profile_path.exists():
        os.makedirs(profile_path, exist_ok=True)
    
    return storage_path

def get_profile_path():
    """Mendapatkan path untuk folder gambar profil"""
    return Path(STORAGE_PATH) / "profile_images"

# Fungsi untuk mendapatkan URL gambar dari path fisik
def get_image_url(filename, request=None):
    """
    Mengkonversi nama file menjadi URL yang bisa diakses
    Parameter request digunakan untuk mendapatkan base URL
    """
    if not filename:
        return None
    
    if request:
        base_url = f"{request.url.scheme}://{request.url.netloc}"
        return f"{base_url}/images/profile/{filename}"
    
    return f"/images/profile/{filename}"