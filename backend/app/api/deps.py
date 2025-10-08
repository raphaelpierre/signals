from typing import Union, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.token import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.api_v1_prefix}/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        token_data = TokenPayload(**payload)
    except JWTError as exc:  # pragma: no cover - defensive
        raise credentials_exception from exc
    if token_data.sub is None:
        raise credentials_exception
    user = db.query(User).filter(User.id == int(token_data.sub)).first()
    if user is None:
        raise credentials_exception
    return user


def authenticate_user(db: Session, email: str, password: str) -> Union[User, None]:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def ensure_active_subscription(user: User) -> None:
    subscription = user.subscription
    if subscription is None or subscription.status not in {"active", "trialing"}:
        raise HTTPException(status_code=402, detail="Active subscription required")


async def get_current_user_ws(token: str, db: Session) -> Optional[User]:
    """Get current user for WebSocket connections."""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm]
        )
        token_data = TokenPayload(**payload)
        if token_data.sub is None:
            return None

        user = db.query(User).filter(User.id == int(token_data.sub)).first()
        return user
    except JWTError:
        return None
