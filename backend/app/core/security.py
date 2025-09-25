from datetime import datetime, timedelta
from typing import Any, Union
import hashlib

from jose import jwt

from .config import settings

# Temporary simple password hashing for development (replace with proper bcrypt in production)
def simple_hash(password: str) -> str:
    """Simple hash function for development - DO NOT use in production"""
    return hashlib.sha256(f"{password}salt".encode()).hexdigest()

def simple_verify(password: str, hashed: str) -> bool:
    """Simple verification for development - DO NOT use in production"""
    return simple_hash(password) == hashed


def create_access_token(subject: Union[str, Any], expires_delta: Union[timedelta, None] = None) -> str:
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.access_token_expire_minutes)
    expire = datetime.utcnow() + expires_delta
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return simple_verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return simple_hash(password)
