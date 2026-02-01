"""
Row-Level Security (RLS) Context Manager
Automatically sets app.current_user_id for per-user data isolation
"""
from sqlalchemy import text
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)


class RLSContextManager:
    """
    Manages per-user database context by setting PostgreSQL session variable.
    Ensures all queries respect user isolation via RLS policies.
    """
    
    @staticmethod
    def set_user_context(db: Session, user_id: int) -> None:
        """
        Set the current user ID in the database session.
        This variable is used by RLS policies to isolate data per user.
        
        Args:
            db: SQLAlchemy session
            user_id: Authenticated user's ID from JWT/token
            
        Example:
            from app.core.rls_context import RLSContextManager
            
            RLSContextManager.set_user_context(db, current_user_id)
            # Now all queries will respect RLS policies for this user
        """
        try:
            # Set app.current_user_id for RLS policies
            db.execute(text(f"SET app.current_user_id = '{user_id}'"))
            logger.debug(f"✅ Set RLS context for user_id={user_id}")
        except Exception as e:
            logger.error(f"❌ Failed to set RLS context: {e}")
            raise
    
    @staticmethod
    def clear_user_context(db: Session) -> None:
        """
        Clear the user context (safety measure).
        
        Args:
            db: SQLAlchemy session
        """
        try:
            db.execute(text("SET app.current_user_id = NULL"))
            logger.debug("✅ Cleared RLS context")
        except Exception as e:
            logger.warning(f"⚠️ Failed to clear RLS context: {e}")


def get_db_with_rls(db: Session, user_id: int = None):
    """
    Wrapper to get DB session with RLS context set.
    Use this in your routes to automatically apply user isolation.
    
    Args:
        db: SQLAlchemy session (from dependency injection)
        user_id: User ID to set context for
        
    Returns:
        db: Session with RLS context set
        
    Example in FastAPI route:
        @router.get("/dashboard")
        def get_dashboard(
            db: Session = Depends(get_db),
            current_user: dict = Depends(get_current_user)
        ):
            db = get_db_with_rls(db, current_user["id"])
            # All queries now respect RLS for this user
            result = db.query(Prescriptions).all()
            return result
    """
    if user_id is not None:
        RLSContextManager.set_user_context(db, user_id)
    return db
