from fastapi import Request, Response
from fastapi.responses import FileResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.config.storage import STORAGE_PATH
from pathlib import Path
import os

class StaticFilesMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Cek apakah request untuk gambar profil
        if request.url.path.startswith("/images/profile/"):
            # Ambil nama file dari URL
            file_name = request.url.path.split("/")[-1]
            
            # Buat path lengkap ke file
            file_path = Path(STORAGE_PATH) / "profile_images" / file_name
            
            # Cek apakah file ada
            if os.path.isfile(file_path):
                return FileResponse(file_path)
                
            # Jika file tidak ditemukan, kembalikan 404
            return Response(status_code=404)
        
        # Jika bukan request untuk file statis, lanjutkan ke endpoint berikutnya
        return await call_next(request)