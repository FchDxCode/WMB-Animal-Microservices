from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
import logging
from pydantic import BaseModel, EmailStr, Field, validator

from ...schemas import user_schemas
from ...models import user_models
from ...utils import users_utils
from app.config.database import get_db
from app.config.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

class ResendOTPRequest(BaseModel):
    email: EmailStr

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)
    
    @validator('new_password')
    def password_strength(cls, v):
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        return v

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
    
    @validator('new_password')
    def password_strength(cls, v):
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        return v

@router.post("/register", response_model=user_schemas.UserResponse)
async def register_user(user: user_schemas.UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Register a new user and send OTP verification code to their email.
    """
    try:
        # Check if email already exists
        db_user = db.query(user_models.User).filter(user_models.User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        
        hashed_password = users_utils.get_password_hash(user.password)
        
        # Generate OTP
        otp = users_utils.generate_otp()
        otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
        
        db_user = user_models.User(
            name=user.name,
            email=user.email,
            id_google=None, 
            password=hashed_password,
            otp_code=otp,
            otp_expires_at=otp_expires_at
        )
        
        # Add user to database
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Send OTP to user's email (in background to speed up response)
        background_tasks.add_task(users_utils.send_otp_email, user.email, otp)
        logger.info(f"Registration successful and OTP sending initiated for {user.email}")
        
        if not settings.EMAIL_ENABLED:
            logger.info(f"Email sending is disabled. OTP for {user.email}: {otp}")
            return {**db_user.__dict__, "test_otp": otp}
        
        return db_user
        
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete registration process: {str(e)}"
        )

@router.post("/verify-otp", response_model=user_schemas.Token)
async def verify_otp(user_data: user_schemas.UserVerifyOTP, db: Session = Depends(get_db)):
    """
    Verifikasi kode OTP dan aktifkan akun pengguna.
    """
    try:
        db_user = None
        
        # Cari pengguna berdasarkan email jika disediakan
        if user_data.email:
            db_user = db.query(user_models.User).filter(user_models.User.email == user_data.email).first()
            if not db_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Email tidak ditemukan"
                )
        else:
            # Jika email tidak disediakan, cari pengguna berdasarkan kode OTP
            current_time = datetime.utcnow()
            matching_users = db.query(user_models.User).filter(
                user_models.User.otp_code == user_data.otp_code,
                user_models.User.otp_expires_at > current_time
            ).all()
            
            if not matching_users:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Kode OTP tidak valid atau sudah kedaluwarsa"
                )
                
            # Jika ada lebih dari satu pengguna dengan kode yang sama,
            # ambil yang paling baru
            db_user = sorted(matching_users, key=lambda u: u.otp_expires_at, reverse=True)[0]
        
        # Verifikasi OTP
        current_time = datetime.utcnow()
        
        if not db_user.otp_code or not db_user.otp_expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tidak ada kode OTP yang ditemukan untuk pengguna ini"
            )
        
        # Tambahkan perlindungan brute force - hitung percobaan gagal
        failed_attempts = getattr(db_user, "failed_otp_attempts", 0) or 0
        
        if db_user.otp_code != user_data.otp_code:
            failed_attempts += 1
            db_user.failed_otp_attempts = failed_attempts
            db.commit()
            
            if failed_attempts >= 5:
                db_user.otp_code = ''
                db_user.otp_expires_at = None
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Terlalu banyak percobaan gagal. Minta kode OTP baru."
                )
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Kode OTP tidak valid. {5-failed_attempts} percobaan tersisa."
            )
        
        if current_time > db_user.otp_expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Kode OTP telah kedaluwarsa. Minta kode baru."
            )
        
        # Reset penghitung percobaan gagal
        db_user.failed_otp_attempts = 0
        
        # Tandai email sebagai terverifikasi
        db_user.email_verified_at = current_time
        db_user.otp_code = ''
        db_user.otp_expires_at = None
        db.commit()
        
        # Buat token akses
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = users_utils.create_access_token(
            data={"sub": db_user.email}, expires_delta=access_token_expires
        )
        
        return {"access_token": access_token, "token_type": "bearer", "email": db_user.email}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"OTP verification error: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gagal memverifikasi OTP"
        )

@router.post("/resend-otp")
async def resend_otp(request: ResendOTPRequest, db: Session = Depends(get_db)):
    """
    Resend OTP verification code to user's email.
    """
    try:
        # Find user by email
        user = db.query(user_models.User).filter(user_models.User.email == request.email).first()
        if not user:
            return {"detail": "If your email is registered, you will receive an OTP code."}
        
        if user.email_verified_at:
            return {"detail": "Your email is already verified. You can log in."}
        
        # Add rate limiting - check last OTP request time
        if user.otp_expires_at and datetime.utcnow() < user.otp_expires_at - timedelta(minutes=9):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Please wait before requesting another OTP code."
            )
        
        # Generate new OTP
        otp = users_utils.generate_otp()
        user.otp_code = otp
        user.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
        user.failed_otp_attempts = 0 
        db.commit()
        
        # Send OTP to user's email
        await users_utils.send_otp_email(user.email, otp)
        
        if not settings.EMAIL_ENABLED:
            logger.info(f"Email sending is disabled. OTP for {user.email}: {otp}")
            return {"detail": "OTP sent successfully", "test_otp": otp}
        
        return {"detail": "OTP sent successfully"}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Resend OTP error: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to resend OTP"
        )

@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest, 
    current_user: user_models.User = Depends(users_utils.get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Verify if the requesting user has permission
        if current_user.email != request.email:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only request password reset for your own account"
            )

        # Find user by email
        user = db.query(user_models.User).filter(user_models.User.email == request.email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Generate new OTP for password reset
        otp = users_utils.generate_otp()
        user.otp_code = otp
        user.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
        user.failed_otp_attempts = 0
        db.commit()
        
        # Send OTP to user's email
        await users_utils.send_password_reset_email(user.email, otp)
        
        if not settings.EMAIL_ENABLED:
            logger.info(f"Email sending is disabled. Password reset OTP for {user.email}: {otp}")
            return {"detail": "Password reset instructions sent", "test_otp": otp}
        
        return {"detail": "Password reset instructions sent to your email"}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Forgot password error: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process password reset request"
        )

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset user password using OTP code sent to email.
    """
    try:
        # Find user by email
        user = db.query(user_models.User).filter(user_models.User.email == request.email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Verify OTP
        current_time = datetime.utcnow()
        
        if not user.otp_code or not user.otp_expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active password reset request found"
            )
        
        if user.otp_code != request.otp_code:
            # Track failed attempts
            failed_attempts = getattr(user, "failed_otp_attempts", 0) or 0
            failed_attempts += 1
            user.failed_otp_attempts = failed_attempts
            db.commit()
            
            if failed_attempts >= 5:
                user.otp_code = ''
                user.otp_expires_at = None
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Too many failed attempts. Request a new password reset."
                )
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset code"
            )
        
        if current_time > user.otp_expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset code has expired. Request a new one."
            )
        
        # Update password
        user.password = users_utils.get_password_hash(request.new_password)
        user.otp_expires_at = None
        user.failed_otp_attempts = 0
        user.updated_at = datetime.utcnow()
        db.commit()
        
        return {"detail": "Password has been successfully reset. You can now log in with your new password."}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Reset password error: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset password"
        )

@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest, 
    current_user: user_models.User = Depends(users_utils.get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Change user password (requires authentication).
    """
    try:
        # Verify current password
        if not users_utils.verify_password(request.current_password, current_user.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Check if new password is different from current one
        if users_utils.verify_password(request.new_password, current_user.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be different from current password"
            )
        
        # Update password
        current_user.password = users_utils.get_password_hash(request.new_password)
        current_user.updated_at = datetime.utcnow()
        db.commit()
        
        try:
            await users_utils.send_password_changed_notification(current_user.email)
        except Exception as e:
            logger.warning(f"Failed to send password change notification: {str(e)}")
        
        return {"detail": "Password has been successfully changed"}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Change password error: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password"
        )