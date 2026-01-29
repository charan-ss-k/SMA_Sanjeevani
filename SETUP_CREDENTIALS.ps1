# Quick Setup for Google Cloud Credentials
# This script helps you set up Google Cloud Translation API

# Step 1: Create .env file from template
Write-Host "📋 Creating .env file from template..." -ForegroundColor Green
Copy-Item ".env.template" ".env" -Force
Write-Host "✅ Created .env file" -ForegroundColor Green

# Step 2: Instructions
Write-Host "`n" -ForegroundColor White
Write-Host ("=" * 70) -ForegroundColor Yellow
Write-Host "NEXT STEPS TO SET UP GOOGLE CLOUD CREDENTIALS" -ForegroundColor Yellow
Write-Host ("=" * 70) -ForegroundColor Yellow
Write-Host "`n"

Write-Host "1. Go to Google Cloud Console:" -ForegroundColor Cyan
Write-Host "   https://console.cloud.google.com/" -ForegroundColor White
Write-Host "`n"

Write-Host "2. Create a new project named 'SMA-Sanjeevani'" -ForegroundColor Cyan
Write-Host "`n"

Write-Host "3. Enable Cloud Translation API:" -ForegroundColor Cyan
Write-Host "   - Go to APIs and Services menu" -ForegroundColor White
Write-Host "   - Select Library" -ForegroundColor White
Write-Host "   - Search for Cloud Translation API" -ForegroundColor White
Write-Host "   - Click Enable" -ForegroundColor White
Write-Host "`n"

Write-Host "4. Create a service account:" -ForegroundColor Cyan
Write-Host "   - Go to APIs and Services" -ForegroundColor White
Write-Host "   - Select Credentials" -ForegroundColor White
Write-Host "   - Click Create Credentials option" -ForegroundColor White
Write-Host "   - Choose Service Account" -ForegroundColor White
Write-Host "   - Name: sma-sanjeevani-translator" -ForegroundColor White
Write-Host "   - Click Create and Continue" -ForegroundColor White
Write-Host "`n"

Write-Host "5. Create a JSON key:" -ForegroundColor Cyan
Write-Host "   - Go to Service Accounts" -ForegroundColor White
Write-Host "   - Click your service account" -ForegroundColor White
Write-Host "   - Go to Keys tab" -ForegroundColor White
Write-Host "   - Click Add Key" -ForegroundColor White
Write-Host "   - Create new key" -ForegroundColor White
Write-Host "   - Choose JSON" -ForegroundColor White
Write-Host "   - Download the JSON file" -ForegroundColor White
Write-Host "`n"

Write-Host "6. Copy the JSON file:" -ForegroundColor Cyan
Write-Host "   - Rename it to: google-cloud-credentials.json" -ForegroundColor White
Write-Host "   - Place it in: $PSScriptRoot" -ForegroundColor White
Write-Host "   - (Same folder as this script)" -ForegroundColor White
Write-Host "`n"

Write-Host "7. Verify setup:" -ForegroundColor Cyan
Write-Host "   Run: python -c 'import google.cloud.translate_v2; print(\"✅ Google Cloud OK\")'" -ForegroundColor White
Write-Host "`n"

Write-Host "8. Start backend:" -ForegroundColor Cyan
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   python start.py" -ForegroundColor White
Write-Host "`n"

Write-Host ("=" * 70) -ForegroundColor Yellow
Write-Host "For detailed instructions, see: SETUP_CREDENTIALS_AND_VERIFY.md" -ForegroundColor Yellow
Write-Host ("=" * 70) -ForegroundColor Yellow
Write-Host "`n"

# Check current status
Write-Host "📊 Current Status:" -ForegroundColor Green
Write-Host ""

# Check if credentials file exists
$credsPath = Join-Path $PSScriptRoot "google-cloud-credentials.json"
if (Test-Path $credsPath) {
    Write-Host "✅ google-cloud-credentials.json found" -ForegroundColor Green
} else {
    Write-Host "❌ google-cloud-credentials.json NOT found (needed)" -ForegroundColor Red
}

# Check if .env file exists
$envPath = Join-Path $PSScriptRoot ".env"
if (Test-Path $envPath) {
    Write-Host "✅ .env file created" -ForegroundColor Green
} else {
    Write-Host "❌ .env file NOT found" -ForegroundColor Red
}

# Check OpenCV
try {
    $opencv = python -c "import cv2; print(cv2.__version__)" 2>$null
    Write-Host "✅ OpenCV version: $opencv" -ForegroundColor Green
} catch {
    Write-Host "❌ OpenCV not available" -ForegroundColor Red
}

# Check if can import google.cloud
try {
    python -c "import google.cloud.translate_v2" 2>$null
    Write-Host "✅ google-cloud-translate library available" -ForegroundColor Green
} catch {
    Write-Host "⚠️  google-cloud-translate library not yet installed" -ForegroundColor Yellow
}

Write-Host "`n"
Write-Host "Ready to start the backend! 🚀" -ForegroundColor Green
Write-Host "`n"
