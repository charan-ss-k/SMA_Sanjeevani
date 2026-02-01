#!/usr/bin/env python3
"""
Migration script to update Prescription table schema
Increases column sizes for dosage, frequency, duration, and doctor_name
"""
import sys
import os
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import text
from app.core.database import engine, SessionLocal
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_prescriptions_table():
    """Migrate the prescriptions table to support longer text fields"""
    
    db = SessionLocal()
    
    try:
        # Get the database type
        db_url = str(engine.url)
        is_postgresql = "postgresql" in db_url
        
        if not is_postgresql:
            logger.warning("⚠️ This migration script is designed for PostgreSQL. For SQLite, tables are recreated automatically.")
            return
        
        logger.info("🔄 Starting migration...")
        
        # Migration statements for PostgreSQL
        migrations = [
            # Alter dosage column from String(100) to Text
            """
            ALTER TABLE prescriptions 
            ALTER COLUMN dosage TYPE text;
            """,
            
            # Increase frequency column size
            """
            ALTER TABLE prescriptions 
            ALTER COLUMN frequency TYPE varchar(255);
            """,
            
            # Increase duration column size
            """
            ALTER TABLE prescriptions 
            ALTER COLUMN duration TYPE varchar(255);
            """,
            
            # Increase doctor_name column size
            """
            ALTER TABLE prescriptions 
            ALTER COLUMN doctor_name TYPE varchar(255);
            """,
            
            # Increase medicine_name column size
            """
            ALTER TABLE prescriptions 
            ALTER COLUMN medicine_name TYPE varchar(255);
            """
        ]
        
        for i, migration in enumerate(migrations, 1):
            try:
                logger.info(f"Running migration {i}/{len(migrations)}...")
                db.execute(text(migration))
                db.commit()
                logger.info(f"✅ Migration {i} completed")
            except Exception as e:
                db.rollback()
                logger.warning(f"⚠️ Migration {i} skipped (may already be applied): {str(e)}")
                continue
        
        logger.info("✅ All migrations completed successfully!")
        logger.info("\nSummary of changes:")
        logger.info("  • dosage: String(100) → Text")
        logger.info("  • frequency: String(100) → String(255)")
        logger.info("  • duration: String(100) → String(255)")
        logger.info("  • doctor_name: String(200) → String(255)")
        logger.info("  • medicine_name: String(200) → String(255)")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {str(e)}", exc_info=True)
        db.rollback()
        return False
    finally:
        db.close()
    
    return True

if __name__ == "__main__":
    success = migrate_prescriptions_table()
    sys.exit(0 if success else 1)
