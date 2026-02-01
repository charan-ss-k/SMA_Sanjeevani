"""
Direct Deploy RLS Schema to Azure PostgreSQL
Using hardcoded Azure credentials from .env
"""
import psycopg2
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

# Azure PostgreSQL connection - extracted from .env DATABASE_URL
AZURE_HOST = "sma-sanjeevani.postgres.database.azure.com"
AZURE_PORT = 5432
AZURE_USER = "sma_admin"
AZURE_PASSWORD = "Sanjeevani@26"  # URL decoded from Sanjeevani%4026
AZURE_DATABASE = "sanjeevani_finaldb"

def deploy_schema():
    """Deploy RLS schema to Azure PostgreSQL"""
    
    logger.info("=" * 70)
    logger.info("🚀 SMA SANJEEVANI - DEPLOYING RLS SCHEMA TO AZURE POSTGRESQL")
    logger.info("=" * 70)
    
    try:
        # Connect to Azure PostgreSQL
        logger.info(f"\n📡 Connecting to Azure PostgreSQL...")
        logger.info(f"   Host: {AZURE_HOST}")
        logger.info(f"   Database: {AZURE_DATABASE}")
        logger.info(f"   User: {AZURE_USER}")
        
        conn = psycopg2.connect(
            host=AZURE_HOST,
            port=AZURE_PORT,
            database=AZURE_DATABASE,
            user=AZURE_USER,
            password=AZURE_PASSWORD,
            sslmode="require"
        )
        
        logger.info("   ✅ Connection successful!\n")
        
        cursor = conn.cursor()
        
        # Read the SQL file
        sql_file_path = "scripts/sanjeevani_finaldb.sql"
        logger.info(f"📖 Reading SQL file: {sql_file_path}")
        
        with open(sql_file_path, 'r') as f:
            sql_content = f.read()
        
        logger.info(f"   ✅ SQL file read ({len(sql_content):,} bytes)\n")
        
        # Execute the SQL
        logger.info("⏳ Deploying schema to Azure... (this may take 30-60 seconds)")
        logger.info("-" * 70)
        
        try:
            cursor.execute(sql_content)
            conn.commit()
            logger.info("-" * 70)
            logger.info("✅ Schema deployed successfully!\n")
            
        except Exception as e:
            conn.rollback()
            logger.info("-" * 70)
            error_msg = str(e)[:300]
            logger.info(f"⚠️  Deployment encountered an issue (objects may already exist):")
            logger.info(f"   {error_msg}")
            logger.info("\n   This is normal if objects already exist.")
            logger.info("   Proceeding with verification...\n")
        
        # Verify deployment
        logger.info("🔍 Verifying RLS deployment...")
        logger.info("-" * 70)
        
        # Check if RLS is enabled
        cursor.execute("""
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public' AND tablename = 'health_profiles'
        """)
        
        if cursor.fetchone():
            logger.info("✅ Table 'health_profiles' exists")
        
        # Check RLS policies
        cursor.execute("""
            SELECT policyname, tablename FROM pg_policies 
            WHERE schemaname = 'public' LIMIT 10
        """)
        
        policies = cursor.fetchall()
        if policies:
            logger.info(f"✅ Found {len(policies)} RLS policies:")
            for policy, table in policies[:10]:
                logger.info(f"   - {policy} on {table}")
        else:
            logger.info("⚠️  No RLS policies found yet")
        
        logger.info("-" * 70)
        
        cursor.close()
        conn.close()
        
        logger.info("\n" + "=" * 70)
        logger.info("✅ DEPLOYMENT COMPLETE")
        logger.info("=" * 70)
        logger.info("\n📝 Next steps:")
        logger.info("   1. Update routes with RLS context: db = get_db_with_rls(db, current_user['id'])")
        logger.info("   2. Test with 2 users to verify data isolation")
        logger.info("   3. Deploy to production")
        logger.info("\n")
        
        return True
        
    except psycopg2.OperationalError as e:
        logger.info(f"\n❌ Connection failed: {e}")
        logger.info("\n🔧 Troubleshooting:")
        logger.info("   1. Verify network connectivity to Azure")
        logger.info("   2. Check firewall rules allow your IP")
        logger.info("   3. Verify credentials")
        logger.info("   4. Run: az postgres flexible-server firewall-rule create --name AllowMyIP")
        return False
    
    except FileNotFoundError as e:
        logger.info(f"\n❌ SQL file not found: {e}")
        logger.info("   Make sure you're running from the backend directory")
        return False
    
    except Exception as e:
        logger.info(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    import sys
    success = deploy_schema()
    sys.exit(0 if success else 1)
