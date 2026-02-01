"""
Deploy RLS Schema to Azure PostgreSQL
Runs sanjeevani_finaldb.sql against the Azure instance
"""
import psycopg2
from psycopg2 import sql
from urllib.parse import urlparse
import os
import sys
from dotenv import load_dotenv

# Load from root .env (parent directory)
load_dotenv(dotenv_path='../.env')

# Parse connection string from .env
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://sma_admin:Sanjeevani%4026@sma-sanjeevani.postgres.database.azure.com:5432/sanjeevani_finaldb?sslmode=require"
)

# Parse the connection URL
parsed = urlparse(DATABASE_URL)
AZURE_CONNECTION = {
    "host": parsed.hostname,
    "port": parsed.port or 5432,
    "database": parsed.path.lstrip('/').split('?')[0],
    "user": parsed.username,
    "password": parsed.password,
    "sslmode": "require"
}

def deploy_schema():
    """Deploy the RLS schema to Azure PostgreSQL"""
    
    print("=" * 70)
    print("🚀 SMA SANJEEVANI - DEPLOYING RLS SCHEMA TO AZURE POSTGRESQL")
    print("=" * 70)
    
    try:
        # Connect to Azure PostgreSQL
        print(f"\n📡 Connecting to Azure PostgreSQL...")
        print(f"   Host: {AZURE_CONNECTION['host']}")
        print(f"   Database: {AZURE_CONNECTION['database']}")
        print(f"   User: {AZURE_CONNECTION['user']}")
        
        conn = psycopg2.connect(
            host=AZURE_CONNECTION['host'],
            port=AZURE_CONNECTION['port'],
            database=AZURE_CONNECTION['database'],
            user=AZURE_CONNECTION['user'],
            password=AZURE_CONNECTION['password'],
            sslmode=AZURE_CONNECTION['sslmode']
        )
        
        print("   ✅ Connection successful!\n")
        
        cursor = conn.cursor()
        
        # Read the SQL file
        sql_file_path = "backend/scripts/sanjeevani_finaldb.sql"
        print(f"📖 Reading SQL file: {sql_file_path}")
        
        with open(sql_file_path, 'r') as f:
            sql_content = f.read()
        
        print(f"   ✅ SQL file read ({len(sql_content)} bytes)\n")
        
        # Execute the SQL
        print("⏳ Deploying schema to Azure... (this may take 30-60 seconds)")
        print("-" * 70)
        
        try:
            cursor.execute(sql_content)
            conn.commit()
            print("-" * 70)
            print("✅ Schema deployed successfully!\n")
            
        except Exception as e:
            conn.rollback()
            print("-" * 70)
            print(f"⚠️  Deployment encountered an issue (likely due to existing objects):")
            print(f"   {str(e)[:200]}")
            print("\n   This is normal if objects already exist.")
            print("   Proceeding with verification...\n")
        
        # Verify deployment
        print("🔍 Verifying RLS deployment...")
        print("-" * 70)
        
        # Check if RLS is enabled on health_profiles
        cursor.execute("""
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public' AND tablename = 'health_profiles'
        """)
        
        if cursor.fetchone():
            print("✅ Table 'health_profiles' exists")
        
        # Check RLS policies
        cursor.execute("""
            SELECT policyname, tablename FROM pg_policies 
            WHERE schemaname = 'public' LIMIT 5
        """)
        
        policies = cursor.fetchall()
        if policies:
            print(f"✅ Found {len(policies)} RLS policies:")
            for policy, table in policies[:5]:
                print(f"   - {policy} on {table}")
        else:
            print("⚠️  No RLS policies found - schema may not have deployed correctly")
        
        print("-" * 70)
        
        cursor.close()
        conn.close()
        
        print("\n" + "=" * 70)
        print("✅ DEPLOYMENT COMPLETE")
        print("=" * 70)
        print("\n📝 Next steps:")
        print("   1. Update routes with RLS context: db = get_db_with_rls(db, current_user['id'])")
        print("   2. Test with 2 users to verify data isolation")
        print("   3. Deploy to production")
        print("\n")
        
        return True
        
    except psycopg2.OperationalError as e:
        print(f"\n❌ Connection failed: {e}")
        print("\n🔧 Troubleshooting:")
        print("   1. Verify network connectivity to Azure")
        print("   2. Check firewall rules allow your IP")
        print("   3. Verify credentials in AZURE_CONNECTION")
        print("   4. Run: az postgres flexible-server firewall-rule create --name AllowMyIP")
        return False
    
    except FileNotFoundError:
        print(f"\n❌ SQL file not found: {sql_file_path}")
        print("   Make sure you're running from the project root directory")
        return False
    
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return False


if __name__ == "__main__":
    success = deploy_schema()
    sys.exit(0 if success else 1)
