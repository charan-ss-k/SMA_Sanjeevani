"""
Database Configuration and Connection Setup
"""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger(__name__)

# Database URL configuration
# Using Azure PostgreSQL with sanjeevani_finaldb
# Azure PostgreSQL requires SSL connection
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://sma_admin:Sanjeevani%4026@sma-sanjeevani.postgres.database.azure.com:5432/sanjeevani_finaldb?sslmode=require"
)

# SQLAlchemy setup
if "sqlite" in DATABASE_URL:
    # SQLite specific configuration
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False  # Set to True for SQL debugging
    )
else:
    # PostgreSQL/MySQL configuration
    # Azure PostgreSQL requires SSL connection
    connect_args = {}
    if "azure.com" in DATABASE_URL or "postgres.database.azure.com" in DATABASE_URL:
        connect_args = {
            "sslmode": "require"
        }
    
    engine = create_engine(
        DATABASE_URL,
        echo=False,  # Set to True for SQL debugging
        pool_pre_ping=True,  # Enable connection health checks
        pool_recycle=3600,  # Recycle connections after 1 hour
        connect_args=connect_args
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for all models
Base = declarative_base()


# Dependency for FastAPI routes
def get_db():
    """Get database session for dependency injection"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Database initialization
def create_database_if_not_exists():
    """Create the database if it doesn't exist (for PostgreSQL)"""
    try:
        import psycopg2
        from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
        from urllib.parse import urlparse
        
        # Parse database URL to get components
        parsed = urlparse(DATABASE_URL)
        database_name = parsed.path.lstrip('/').split('?')[0]
        
        # Only for PostgreSQL (not SQLite)
        if "postgresql" in DATABASE_URL and "sqlite" not in DATABASE_URL:
            # Connect to default 'postgres' database
            admin_conn_string = (
                f"postgresql://{parsed.username}:{parsed.password}@"
                f"{parsed.hostname}:{parsed.port or 5432}/postgres?sslmode=require"
            )
            
            conn = psycopg2.connect(admin_conn_string)
            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            cursor = conn.cursor()
            
            # Check if database exists
            cursor.execute(
                "SELECT 1 FROM pg_database WHERE datname = %s",
                (database_name,)
            )
            exists = cursor.fetchone()
            
            if not exists:
                logger.info(f"Creating database '{database_name}'...")
                cursor.execute(f'CREATE DATABASE "{database_name}"')
                logger.info(f"✅ Database '{database_name}' created successfully!")
            else:
                logger.info(f"✅ Database '{database_name}' already exists")
            
            cursor.close()
            conn.close()
    except ImportError:
        logger.warning("psycopg2 not available, skipping database creation")
    except Exception as e:
        logger.warning(f"Could not auto-create database (this is OK if it already exists): {e}")


def init_db():
    """Create all tables in the database"""
    # Try to create database first (for PostgreSQL)
    if "postgresql" in DATABASE_URL and "sqlite" not in DATABASE_URL:
        create_database_if_not_exists()
    
    # Create all tables
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("Database initialized successfully!")
