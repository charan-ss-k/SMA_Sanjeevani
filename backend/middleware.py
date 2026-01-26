from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from security import verify_token

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Dependency to extract and verify JWT token from Authorization header.
    Returns user_id if token is valid.
    """
    token = credentials.credentials
    
    try:
        user_id = verify_token(token)
        return user_id
    except HTTPException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user_optional(credentials: HTTPAuthorizationCredentials = None):
    """
    Optional authentication - returns user_id if token present, None otherwise.
    """
    if not credentials:
        return None
    
    try:
        user_id = verify_token(credentials.credentials)
        return user_id
    except:
        return None
