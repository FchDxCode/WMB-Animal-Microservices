from sqlalchemy import Column, String, DateTime, ForeignKey, BigInteger
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..config.database import Base
from sqlalchemy.dialects.mysql import BIGINT


class User(Base):
    __tablename__ = "users"
    
    id = Column(BIGINT(unsigned=True), primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    id_google = Column(String(255), nullable=True)
    email_verified_at = Column(DateTime, nullable=True)
    password = Column(String(255), nullable=False)
    remember_token = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    otp_code = Column(String(6), nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    last_login = Column(DateTime, nullable=True)
    
    user_images = relationship("UserImage", back_populates="user", cascade="all, delete-orphan")

class UserImage(Base):
    __tablename__ = "user_images"
    
    id = Column(BIGINT(unsigned=True), primary_key=True, index=True, autoincrement=True)
    users_id = Column(BIGINT(unsigned=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    gambar = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="user_images")