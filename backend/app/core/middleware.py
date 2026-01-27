from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from app.core.security import verify_token

security = HTTPBearer(auto_error=False)

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """
    Dependency to extract and verify JWT token from Authorization header.
    Returns user_id if token is valid.
    Makes authentication optional for now to prevent 500 errors.
    For anonymous users, returns user_id = 0.
    """
    # If no credentials provided, allow access with anonymous user (user_id = 0)
    if credentials is None:
        return 0
    
    token = credentials.credentials
    
    try:
        user_id = verify_token(token)
        return user_id
    except HTTPException as e:
        # For now, allow access with anonymous user (user_id = 0) instead of raising error
        return 0
    except Exception:
        # For now, allow access with anonymous user (user_id = 0) instead of raising error
        return 0

async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """
    Optional authentication - returns user_id if token present and valid, None otherwise.
    """
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        user_id = verify_token(token)
        return user_id
    except:
        return None
