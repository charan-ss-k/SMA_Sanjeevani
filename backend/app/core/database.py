"""
PostgreSQL Database Configuration - Azure PostgreSQL
Clean implementation without SQLite fallbacks
"""
import os
from pathlib import Path
from sqlalchemy import create_engine, text, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load .env from project root
root_env = Path(__file__).parent.parent.parent.parent / ".env"
load_dotenv(root_env, override=True)

# PostgreSQL connection string (Azure)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://sma_admin:Sanjeevani%4026@sma-sanjeevani.postgres.database.azure.com:5432/sanjeevani_finaldb?sslmode=require"
)

# Validate PostgreSQL URL
if not DATABASE_URL.startswith("postgresql://"):
    raise ValueError(f"❌ DATABASE_URL must be PostgreSQL! Got: {DATABASE_URL[:50]}...")

logger.info(f"✅ PostgreSQL connection configured: {DATABASE_URL[:70]}...")

# Create PostgreSQL engine
engine = create_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL query debugging
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=3600,  # Recycle connections every hour
    pool_size=10,  # Connection pool size
    max_overflow=20,  # Max connections beyond pool_size
    connect_args={
        "connect_timeout": 10,
        "options": "-c timezone=utc"
    }
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for all models
Base = declarative_base()


def get_db() -> Session:
    """
    FastAPI dependency for database sessions.
    Usage: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def verify_connection() -> bool:
    """Test PostgreSQL connection"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.scalar()
            logger.info(f"✅ PostgreSQL connected: {version[:100]}")
            return True
    except Exception as e:
        logger.error(f"❌ PostgreSQL connection failed: {e}")
        return False


def init_db():
    """
    Initialize database by creating all tables.
    Creates tables based on SQLAlchemy models.
    """
    try:
        logger.info("📊 Initializing PostgreSQL database...")
        
        # Verify connection first
        if not verify_connection():
            raise ConnectionError("Cannot connect to PostgreSQL database")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("✅ All database tables created/verified")
        
        return True
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        raise


# Test connection on module import
try:
    verify_connection()
except Exception as e:
    logger.warning(f"⚠️  Database connection not available yet: {e}")


if __name__ == "__main__":
    print("=" * 70)
    print("🔧 PostgreSQL Database Initialization")
    print("=" * 70)
    init_db()
    print("=" * 70)
    print("✅ Database initialization complete!")
    print("=" * 70)

