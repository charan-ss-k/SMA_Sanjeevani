"""
Database Configuration and Connection Setup
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Database URL configuration
# Using SQLite for development (easy, no setup needed)
# Change to PostgreSQL for production: postgresql://user:password@localhost/sanjeevani
# Change to MySQL for production: mysql+pymysql://user:password@localhost/sanjeevani

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./sanjeevani.db"  # SQLite database file
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
    engine = create_engine(
        DATABASE_URL,
        echo=False,  # Set to True for SQL debugging
        pool_pre_ping=True,  # Enable connection health checks
        pool_recycle=3600  # Recycle connections after 1 hour
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
def init_db():
    """Create all tables in the database"""
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("Database initialized successfully!")
