from app.utils.users_utils import get_current_user, get_password_hash, verify_password, generate_otp, send_otp_email
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request, Body
from fastapi.encoders import jsonable_encoder
from pydantic import EmailStr
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models import user_models
from app.schemas import user_schemas
from app.utils.image_utils import save_upload_file, delete_profile_image
from app.config.storage import get_image_url
from typing import Optional
import logging
from datetime import datetime, timedelta
import os

router = APIRouter(
    prefix="/api/users",
    tags=["User Profile"]
)

logger = logging.getLogger(__name__)

@router.get("/profile", response_model=user_schemas.ProfileWithPasswordResponse)
async def get_profile(
    request: Request,
    current_user: user_models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Ambil profil user yang sedang login
    """
    user = db.query(user_models.User).filter(user_models.User.id == current_user.id).first()
    
    profile_image = None
    if hasattr(user, 'user_images') and user.user_images:
        # Ambil gambar terbaru berdasarkan created_at
        latest_image = db.query(user_models.UserImage) \
            .filter(user_models.UserImage.users_id == user.id) \
            .order_by(user_models.UserImage.created_at.desc()) \
            .first()
        
        if latest_image:
            profile_image = get_image_url(latest_image.gambar, request)
    
    response = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "email_verified_at": user.email_verified_at,
        "updated_at": user.updated_at,
        "profile_image": profile_image,
        "has_password": user.password is not None
    }
    
    return response

@router.put("/profile", response_model=user_schemas.ProfileWithPasswordResponse)
async def update_profile_json(
    request: Request,
    profile_data: user_schemas.ProfileUpdateRequestWithPassword = Body(...),
    current_user: user_models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update profil user yang sedang login menggunakan JSON
    """
    try:
        # Ambil user
        user = db.query(user_models.User).filter(user_models.User.id == current_user.id).first()
        
        # Update nama jika disediakan
        if profile_data.name is not None and profile_data.name.strip():
            user.name = profile_data.name
            
        # Update email jika disediakan dan berbeda dari yang saat ini
        email_changed = False
        if profile_data.email is not None and profile_data.email != user.email:
            # Cek apakah email sudah digunakan
            existing_user = db.query(user_models.User).filter(
                user_models.User.email == profile_data.email, 
                user_models.User.id != user.id
            ).first()
            
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email sudah digunakan oleh pengguna lain"
                )
            
            # Simpan email lama untuk referensi
            old_email = user.email
            user.email = profile_data.email
            
            # Reset status verifikasi email
            user.email_verified_at = None
            email_changed = True
        
        # Update password jika disediakan
        if profile_data.new_password is not None:
            # Verifikasi password saat ini
            if not profile_data.current_password:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Password saat ini diperlukan untuk mengubah password"
                )
                
            if not verify_password(profile_data.current_password, user.password):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Password saat ini tidak valid"
                )
                
            # Hash dan simpan password baru
            user.password = get_password_hash(profile_data.new_password)
        
        # Update waktu
        user.updated_at = datetime.utcnow()
        
        # Simpan perubahan
        db.commit()
        db.refresh(user)
        
        # Jika email berubah, kirim OTP untuk verifikasi
        if email_changed:
            # Generate OTP
            otp = generate_otp()
            user.otp_code = otp
            user.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
            db.commit()
            
            # Kirim email verifikasi
            try:
                await send_otp_email(user.email, otp)
                logger.info(f"Email verifikasi dikirim ke {user.email}")
            except Exception as e:
                logger.error(f"Gagal mengirim email verifikasi: {str(e)}")
                # Tidak mengembalikan error ke client karena update profil berhasil
        
        # Ambil gambar profil terbaru jika ada
        profile_image = None
        latest_image = db.query(user_models.UserImage) \
            .filter(user_models.UserImage.users_id == user.id) \
            .order_by(user_models.UserImage.created_at.desc()) \
            .first()
                
        if latest_image:
            profile_image = get_image_url(latest_image.gambar, request)
        
        response = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "email_verified_at": user.email_verified_at,
            "updated_at": user.updated_at,
            "profile_image": profile_image,
            "has_password": user.password is not None
        }
        
        # Tambahkan pesan tentang verifikasi email jika email diubah
        if email_changed:
            response["message"] = "Profil berhasil diperbarui. Silakan verifikasi alamat email baru Anda."
        
        return response
        
    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        logger.error(f"Error update profil: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal memperbarui profil: {str(e)}"
        )
        
@router.put("/profile/image", response_model=user_schemas.ProfileWithPasswordResponse)
async def update_profile_image(
    request: Request,
    profile_image: UploadFile = File(...),
    current_user: user_models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update foto profil user
    """
    try:
        # Ambil user
        user = db.query(user_models.User).filter(user_models.User.id == current_user.id).first()
        
        # Cek apakah user sudah memiliki foto profil
        existing_image = db.query(user_models.UserImage) \
            .filter(user_models.UserImage.users_id == user.id) \
            .order_by(user_models.UserImage.created_at.desc()) \
            .first()
            
        if existing_image:
            # Hapus foto profil lama dari penyimpanan
            try:
                delete_profile_image(existing_image.gambar)
            except Exception as e:
                logger.warning(f"Gagal menghapus foto profil lama: {str(e)}")
            
            # Hapus record dari database
            db.delete(existing_image)
            db.commit()
        
        # Upload foto profil baru
        filename = await save_upload_file(profile_image, user.id)
        
        # Simpan info gambar di database
        new_image = user_models.UserImage(
            users_id=user.id,
            gambar=filename,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(new_image)
        db.commit()
        db.refresh(new_image)
        
        # Update waktu update user
        user.updated_at = datetime.utcnow()
        db.commit()
        
        # Ambil URL gambar
        profile_image_url = get_image_url(filename, request)
        
        response = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "email_verified_at": user.email_verified_at,
            "updated_at": user.updated_at,
            "profile_image": profile_image_url,
            "has_password": user.password is not None
        }
        
        return response
        
    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        logger.error(f"Error update foto profil: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal memperbarui foto profil: {str(e)}"
        )