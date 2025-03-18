from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.schemas import user_schemas
from app.models import user_models
from app.utils.utils_users import verify_password, create_access_token, send_otp_email, generate_otp
from app.config.config import get_settings
from datetime import datetime, timedelta
import logging
from pydantic import BaseModel, EmailStr

settings = get_settings()
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LogoutRequest(BaseModel):
    token: str

@router.post("/login", response_model=user_schemas.Token)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = None
):
    """
    Authenticate user with email and password using JSON body.
    Returns a JWT access token if successful.
    """
    try:
        # Find user by email
        user = db.query(user_models.User).filter(user_models.User.email == login_data.email).first()
        if not user:
            logger.warning(f"Login attempt for non-existent user: {login_data.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Verify password
        if not verify_password(login_data.password, user.password):
            logger.warning(f"Failed login attempt for user: {user.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Check if email is verified
        if not user.email_verified_at:
            # Generate new OTP for unverified users
            otp = generate_otp()
            user.otp_code = otp
            user.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
            db.commit()
            
            # Send OTP to user's
            if background_tasks:
                background_tasks.add_task(send_otp_email, user.email, otp)
            
            logger.info(f"Login attempt from unverified email: {user.email}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified. A verification code has been sent to your email."
            )
        
        # Update last login 
        user.last_login = datetime.utcnow()
        db.commit()
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        logger.info(f"Successful login for user: {user.email}")
        
        # Return token with user info
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email
            }
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )

@router.post("/logout")
async def logout(logout_data: LogoutRequest = None):
    """
    Simple logout endpoint. Client should delete the token.
    """
    return {"detail": "Successfully logged out", "status": "success"}