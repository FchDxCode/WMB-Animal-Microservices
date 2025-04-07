import secrets
import string
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
import logging
from jwt import PyJWTError
from app.config.config import get_settings
from ..config.database import get_db
from ..models.user_models import User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

security = HTTPBearer()

settings = get_settings()

# Email configuration 
email_conf = None
if settings.EMAIL_ENABLED and settings.MAIL_USERNAME and settings.MAIL_PASSWORD:
    email_conf = ConnectionConfig(
        MAIL_USERNAME=settings.MAIL_USERNAME,
        MAIL_PASSWORD=settings.MAIL_PASSWORD,
        MAIL_FROM=settings.MAIL_FROM,
        MAIL_PORT=settings.MAIL_PORT,
        MAIL_SERVER=settings.MAIL_SERVER,
        MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
        MAIL_STARTTLS=True,     
        MAIL_SSL_TLS=False,     
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True
    )

# Password functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# JWT token functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except (PyJWTError, AttributeError):
        raise credentials_exception
        
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    
    # Check if email is verified
    if not user.email_verified_at:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified"
        )
        
    return user

# OTP functions
def generate_otp():
    """Generate a 6-digit OTP code"""
    return ''.join(secrets.choice(string.digits) for i in range(6))

async def send_otp_email(email: EmailStr, otp: str):
    """Send OTP via email"""
    if not settings.EMAIL_ENABLED or not email_conf:
        logger.warning("Email functionality is disabled. OTP code: %s", otp)
        return
    
    try:
        message = MessageSchema(
            subject="Your OTP Code for Registration",
            recipients=[email],
            body=f"""
            <html>
                <body>
                    <h1>Your OTP Code</h1>
                    <p>Your OTP code for registration is: <strong>{otp}</strong></p>
                    <p>This code will expire in 10 minutes.</p>
                    <p>If you did not request this code, please ignore this email.</p>
                </body>
            </html>
            """,
            subtype="html"
        )

        fm = FastMail(email_conf)
        await fm.send_message(message)
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        logger.warning(f"OTP code for {email}: {otp}")
        
async def send_password_reset_email(email: EmailStr, otp: str):
    """Send OTP via email for password reset"""
    if not settings.EMAIL_ENABLED or not email_conf:
        logger.warning("Email functionality is disabled. Password reset OTP: %s", otp)
        return
    
    try:
        message = MessageSchema(
            subject="Password Reset Request",
            recipients=[email],
            body=f"""
            <html>
                <body>
                    <h1>Password Reset Request</h1>
                    <p>You have requested to reset your password. Your verification code is: <strong>{otp}</strong></p>
                    <p>This code will expire in 10 minutes.</p>
                    <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
                </body>
            </html>
            """,
            subtype="html"
        )

        fm = FastMail(email_conf)
        await fm.send_message(message)
    except Exception as e:
        logger.error(f"Failed to send password reset email: {str(e)}")
        logger.warning(f"Password reset OTP for {email}: {otp}")

async def send_password_changed_notification(email: EmailStr):
    """Send email notification that password was changed"""
    if not settings.EMAIL_ENABLED or not email_conf:
        logger.warning(f"Email functionality is disabled. Would send password change notification to {email}")
        return
    
    try:
        message = MessageSchema(
            subject="Password Changed Successfully",
            recipients=[email],
            body=f"""
            <html>
                <body>
                    <h1>Password Changed</h1>
                    <p>Your password has been successfully changed.</p>
                    <p>If you did not make this change, please contact support immediately.</p>
                </body>
            </html>
            """,
            subtype="html"
        )

        fm = FastMail(email_conf)
        await fm.send_message(message)
    except Exception as e:
        logger.error(f"Failed to send password change notification: {str(e)}")