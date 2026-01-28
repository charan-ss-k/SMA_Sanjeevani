#!/usr/bin/env python3
"""
Create default anonymous user for prescriptions
Allows saving prescriptions for unauthenticated users
"""
import sys
import os
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import text
from app.core.database import SessionLocal
from app.models.models import User
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_anonymous_user():
    """Create default anonymous user with id=0"""
    
    db = SessionLocal()
    
    try:
        # Check if anonymous user already exists
        existing_user = db.query(User).filter(User.id == 0).first()
        
        if existing_user:
            logger.info("✅ Anonymous user (id=0) already exists")
            return True
        
        logger.info("🔄 Creating anonymous user (id=0)...")
        
        # Create anonymous user with fixed id=0
        # Note: We need to use raw SQL to set id=0 since SQLAlchemy usually auto-generates IDs
        anonymous_user = User(
            id=0,
            username="anonymous",
            email="anonymous@sanjeevani.local",
            password_hash="disabled",  # This user cannot login
            is_active=True
        )
        
        db.add(anonymous_user)
        db.commit()
        
        logger.info("✅ Anonymous user created successfully!")
        logger.info("   User ID: 0")
        logger.info("   Username: anonymous")
        logger.info("   Email: anonymous@sanjeevani.local")
        logger.info("   Status: Active (for prescriptions only)")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error creating anonymous user: {str(e)}", exc_info=True)
        db.rollback()
        
        # If it's a constraint error, try again with raw SQL
        if "duplicate" in str(e).lower() or "already exists" in str(e).lower():
            logger.info("ℹ️ User may already exist, attempting verification...")
            try:
                # Try to get the user
                existing_user = db.query(User).filter(User.id == 0).first()
                if existing_user:
                    logger.info("✅ Anonymous user already exists")
                    return True
            except:
                pass
        
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = create_anonymous_user()
    sys.exit(0 if success else 1)
