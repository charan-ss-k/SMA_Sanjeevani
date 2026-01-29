from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from app.core.security import verify_token
from app.core.database import SessionLocal
from app.models.models import User

security = HTTPBearer(auto_error=False)

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """
    Dependency to extract and verify JWT token from Authorization header.
    Returns User object if token is valid.
    For anonymous users, returns the anonymous user (user_id = 0).
    """
    db = SessionLocal()
    try:
        # If no credentials provided, return anonymous user
        if credentials is None:
            anonymous_user = db.query(User).filter(User.id == 0).first()
            if anonymous_user:
                return anonymous_user
            # Create anonymous user if doesn't exist
            anonymous_user = User(
                id=0,
                username="anonymous",
                email="anonymous@sanjeevani.local",
                password_hash="disabled",
                is_active=True
            )
            db.add(anonymous_user)
            db.commit()
            return anonymous_user
        
        token = credentials.credentials
        
        try:
            user_id = verify_token(token)
            # Fetch the actual User object from database
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                return user
            else:
                # If user not found, return anonymous user
                anonymous_user = db.query(User).filter(User.id == 0).first()
                if anonymous_user:
                    return anonymous_user
                # Create if doesn't exist
                anonymous_user = User(
                    id=0,
                    username="anonymous",
                    email="anonymous@sanjeevani.local",
                    password_hash="disabled",
                    is_active=True
                )
                db.add(anonymous_user)
                db.commit()
                return anonymous_user
        except HTTPException:
            # Return anonymous user on auth failure
            anonymous_user = db.query(User).filter(User.id == 0).first()
            if anonymous_user:
                return anonymous_user
            anonymous_user = User(
                id=0,
                username="anonymous",
                email="anonymous@sanjeevani.local",
                password_hash="disabled",
                is_active=True
            )
            db.add(anonymous_user)
            db.commit()
            return anonymous_user
        except Exception:
            # Return anonymous user on any error
            anonymous_user = db.query(User).filter(User.id == 0).first()
            if anonymous_user:
                return anonymous_user
            anonymous_user = User(
                id=0,
                username="anonymous",
                email="anonymous@sanjeevani.local",
                password_hash="disabled",
                is_active=True
            )
            db.add(anonymous_user)
            db.commit()
            return anonymous_user
    finally:
        db.close()

async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """
    Optional authentication - returns User object if token present and valid, None otherwise.
    """
    db = SessionLocal()
    try:
        if not credentials:
            return None
        
        try:
            token = credentials.credentials
            user_id = verify_token(token)
            # Fetch the actual User object from database
            user = db.query(User).filter(User.id == user_id).first()
            return user
        except:
            return None
    finally:
        db.close()
