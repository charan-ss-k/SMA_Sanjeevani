# PostgreSQL 18 Database Setup - Complete Guide
**Date:** January 26, 2026

---

## Problem: Backup Restore Failed

### Root Causes:
1. **Password Authentication Failed** - PostgreSQL default user password issue
2. **Backup File Format** - Incompatible SQL syntax or format
3. **Database Already Exists** - Can't restore to existing database
4. **Permissions Issue** - User doesn't have restore privileges
5. **Encoding Mismatch** - UTF-8 encoding issues

---

## Solution: Complete Fresh Setup

### Step 1: Connect to PostgreSQL with Password Reset

**Option A: If you know the postgres password:**
```powershell
cd "C:\Program Files\PostgreSQL\18\bin"
.\psql.exe -U postgres -h localhost
```

**Option B: If you forgot the password (Windows auth):**
```powershell
# Stop PostgreSQL service
Stop-Service -Name postgresql-x64-18

# Modify pg_hba.conf to use trust authentication temporarily
$pg_hba = "C:\Program Files\PostgreSQL\18\data\pg_hba.conf"
(Get-Content $pg_hba) -replace 'md5|scram-sha-256', 'trust' | Set-Content $pg_hba

# Start PostgreSQL service
Start-Service -Name postgresql-x64-18

# Connect without password
cd "C:\Program Files\PostgreSQL\18\bin"
.\psql.exe -U postgres -h localhost
```

---

### Step 2: Create Fresh Database

**In PostgreSQL Command Line:**

```sql
-- Drop old database if exists (WARNING: This deletes all data)
DROP DATABASE IF EXISTS sanjeevani_db CASCADE;

-- Create fresh database
CREATE DATABASE sanjeevani_db WITH
  ENCODING 'UTF8'
  LOCALE 'en_US.UTF-8'
  TEMPLATE template0;

-- Connect to new database
\c sanjeevani_db

-- Verify connection
\conninfo
```

---

### Step 3: Import Fresh Schema

**Method A: Via psql Command Line**

```powershell
# Make sure you're in the database directory
cd "C:\Program Files\PostgreSQL\18\bin"

# Import the SQL file
.\psql.exe -U postgres -h localhost -d sanjeevani_db -f "d:\GitHub 2\SMA_Sanjeevani\backend\sanjeevani_fresh.sql"
```

**Method B: Via pgAdmin GUI**
1. Right-click on `sanjeevani_db`
2. Select **Restore**
3. Choose your backup file
4. Set restore options:
   - ✅ Clean before restore
   - ✅ If exists DO NOT error
   - ✅ Privileges
   - ✅ Data
5. Click **Restore**

---

### Step 4: Verify Schema Import

**Check if all tables were created:**

```sql
-- List all tables
\dt

-- Should show 13 tables:
-- - users
-- - health_profiles
-- - symptom_check_history
-- - medicine_recommendations
-- - prescriptions
-- - reminders
-- - medicine_taken_log
-- - chatbot_conversations
-- - chatbot_messages
-- - health_schedules
-- - health_schedule_log
-- - medical_checkups
-- - user_analytics

-- Check table count
SELECT COUNT(*) as table_count FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Should return: 13

-- Check if views exist
SELECT COUNT(*) as view_count FROM information_schema.views 
WHERE table_schema = 'public';
-- Should return: 4

-- Check if indexes exist
SELECT COUNT(*) as index_count FROM pg_indexes 
WHERE schemaname = 'public';
-- Should return: ~28
```

---

### Step 5: Restore Password Authentication

**After setup is complete, revert trust auth to password:**

```powershell
# Stop PostgreSQL service
Stop-Service -Name postgresql-x64-18

# Restore original pg_hba.conf setting
$pg_hba = "C:\Program Files\PostgreSQL\18\data\pg_hba.conf"
(Get-Content $pg_hba) -replace 'trust', 'scram-sha-256' | Set-Content $pg_hba

# Start PostgreSQL service
Start-Service -Name postgresql-x64-18
```

---

## Quick Setup Script (PowerShell)

Save as `setup_postgres.ps1`:

```powershell
# ============================================================
# PostgreSQL 18 Fresh Database Setup Script
# ============================================================

$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$sqlFile = "d:\GitHub 2\SMA_Sanjeevani\backend\sanjeevani_fresh.sql"
$dbName = "sanjeevani_db"
$user = "postgres"
$host = "localhost"

Write-Host "================================================"
Write-Host "PostgreSQL 18 - Fresh Database Setup"
Write-Host "================================================"

# Step 1: Drop existing database
Write-Host "`n[1/4] Dropping old database (if exists)..."
$dropScript = "DROP DATABASE IF EXISTS $dbName CASCADE;"
$dropScript | & $psqlPath -U $user -h $host -v ON_ERROR_STOP=1

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Warning: Could not drop database (might not exist)" -ForegroundColor Yellow
}

# Step 2: Create fresh database
Write-Host "[2/4] Creating fresh database..."
$createScript = "CREATE DATABASE $dbName WITH ENCODING 'UTF8' TEMPLATE template0;"
$createScript | & $psqlPath -U $user -h $host -v ON_ERROR_STOP=1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database created successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to create database" -ForegroundColor Red
    exit 1
}

# Step 3: Import schema
Write-Host "[3/4] Importing database schema..."
& $psqlPath -U $user -h $host -d $dbName -f $sqlFile -v ON_ERROR_STOP=1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Schema imported successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to import schema" -ForegroundColor Red
    exit 1
}

# Step 4: Verify
Write-Host "[4/4] Verifying database..."
$verifyScript = @"
SELECT 'Tables' as object_type, COUNT(*) as count 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 'Views', COUNT(*) 
FROM information_schema.views 
WHERE table_schema = 'public'
UNION ALL
SELECT 'Indexes', COUNT(*) 
FROM pg_indexes 
WHERE schemaname = 'public';
"@
$verifyScript | & $psqlPath -U $user -h $host -d $dbName

Write-Host "`n================================================"
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host "================================================"
Write-Host "Database: $dbName"
Write-Host "Host: $host"
Write-Host "Port: 5432"
Write-Host "User: $user"
Write-Host "`nYou can now connect using pgAdmin or psql"
```

---

## Troubleshooting

### Error: "FATAL: password authentication failed"
```powershell
# Use trust auth temporarily or change password
ALTER USER postgres WITH PASSWORD 'your_new_password';
```

### Error: "Database already exists"
```sql
DROP DATABASE sanjeevani_db;
-- Then recreate
```

### Error: "Could not create restore point"
```powershell
# Try with simpler options in pgAdmin:
# - Uncheck "Create restore point"
# - Uncheck "Privileges"
```

### Error: "Encoding UTF8 does not match locale"
```sql
-- Use C locale instead
CREATE DATABASE sanjeevani_db WITH
  ENCODING 'UTF8'
  LOCALE 'C';
```

---

## Files Required

✅ Location: `d:\GitHub 2\SMA_Sanjeevani\backend\`
- `sanjeevani_fresh.sql` - Complete fresh database schema
- `setup_postgres.ps1` - Automated setup script
- `POSTGRESQL_SETUP_GUIDE.md` - This file

---

## Next Steps After Setup

1. **Verify all tables exist** - Run verification queries above
2. **Test connectivity** - Connect via pgAdmin to sanjeevani_db
3. **Insert test data** - Use the sample INSERT statement in schema
4. **Configure backend** - Update connection strings in Python/Node.js
5. **Run migrations** - If using ORM, run any pending migrations

---

**Status:** Ready for implementation ✓
**Last Updated:** January 26, 2026
