from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config.database  import engine, Base, get_db
from .models.user_models import User
from .api.auth import routes_register
from .api.auth import routes_login
from .api.user import routes_user
from app.config.config import get_settings
from .middleware.static_files import StaticFilesMiddleware  
from app.config.storage import ensure_storage_exists  
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os



load_dotenv()

#cek storage
ensure_storage_exists()

Base.metadata.create_all(bind=engine)

# Path penyimpanan dari .env
GLOBAL_STORAGE_DIR = os.getenv("STORAGE_PATH", "C:\\storage\\profile_pictures")
os.makedirs(GLOBAL_STORAGE_DIR, exist_ok=True)

# ✅ Mount folder ke `/images/profile/`


app = FastAPI(
    title="User Registration API",
    description="API for user registration with OTP verification",
    version="1.0.0"
)

app.mount("/images/profile", StaticFiles(directory=GLOBAL_STORAGE_DIR), name="profile_images")
# static files
# app.mount("/media", StaticFiles(directory="media"), name="media")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(routes_register.router)
app.include_router(routes_login.router)
app.include_router(routes_user.router)

@app.get("/")
def read_root():
    return {"message": "Api is work bro!"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)