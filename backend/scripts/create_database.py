"""
Script to create the database on Azure PostgreSQL if it doesn't exist
"""
import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv()

def create_database_if_not_exists():
    """Create the database if it doesn't exist"""
    # Get database URL from environment
    database_url = os.getenv(
        "DATABASE_URL",
        "postgresql://sma_admin:Sanjeevani%4026@sma-sanjeevani.postgres.database.azure.com:5432/sanjeevani_finaldb?sslmode=require"
    )
    
    # Parse the URL
    parsed = urlparse(database_url)
    
    # Extract components
    username = parsed.username
    password = parsed.password
    host = parsed.hostname
    port = parsed.port or 5432
    database_name = parsed.path.lstrip('/').split('?')[0]  # Remove leading / and query params
    
    # Connect to default 'postgres' database to create our database
    admin_conn_string = f"postgresql://{username}:{password}@{host}:{port}/postgres?sslmode=require"
    
    try:
        print(f"Connecting to Azure PostgreSQL server at {host}...")
        conn = psycopg2.connect(admin_conn_string)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s",
            (database_name,)
        )
        exists = cursor.fetchone()
        
        if exists:
            print(f"✅ Database '{database_name}' already exists")
        else:
            print(f"Creating database '{database_name}'...")
            cursor.execute(f'CREATE DATABASE "{database_name}"')
            print(f"✅ Database '{database_name}' created successfully!")
        
        cursor.close()
        conn.close()
        
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Error creating database: {e}")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("Azure PostgreSQL Database Creation Script")
    print("=" * 60)
    
    if create_database_if_not_exists():
        print("\n✅ Database setup complete!")
        print("You can now run your application.")
    else:
        print("\n❌ Database setup failed!")
        print("Please check your connection details and try again.")
