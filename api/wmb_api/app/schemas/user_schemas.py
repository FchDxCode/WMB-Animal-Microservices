from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    
    @validator('password')
    def password_strength(cls, v):
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        return v

class UserVerifyOTP(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)

class UserImageBase(BaseModel):
    gambar: str
    created_at: datetime
    updated_at: datetime

class UserImageResponse(UserImageBase):
    id: int 
    users_id: int 

    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: int  
    email_verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    user_images: List[UserImageResponse] = []

    class Config:
        from_attributes = True

class UserInToken(BaseModel):
    id: int  
    name: str
    email: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[UserInToken] = None
    
    class Config:
        from_attributes = True 

class TokenData(BaseModel):
    email: Optional[str] = None
    
    

#schema for profile    
class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    
    @validator('name')
    def name_must_not_be_empty(cls, v):
        if v is not None and v.strip() == "":
            raise ValueError('Nama tidak boleh kosong')
        return v

class ProfileUpdateResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    email_verified_at: Optional[datetime] = None
    updated_at: datetime
    profile_image: Optional[str] = None
    
    class Config:
        from_attributes = True
        
class ProfileUpdateRequestWithPassword(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None
    
    @validator('name')
    def name_must_not_be_empty(cls, v):
        if v is not None and v.strip() == "":
            raise ValueError('Nama tidak boleh kosong')
        return v
    
    @validator('new_password')
    def password_strength(cls, v, values):
        if v is None:
            return v
        if len(v) < 6:
            raise ValueError('Password harus minimal 6 karakter')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password harus mengandung minimal satu angka')
        if not any(char.isupper() for char in v):
            raise ValueError('Password harus mengandung minimal satu huruf kapital')
        if 'current_password' not in values or values['current_password'] is None:
            raise ValueError('Password saat ini diperlukan untuk mengubah password')
        return v

class ProfileWithPasswordResponse(ProfileUpdateResponse):
    has_password: bool = True  # Hanya menunjukkan bahwa user memiliki password, tanpa menampilkan nilai sebenarnya