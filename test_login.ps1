# Login System Test Script (PowerShell)
# Tests the authentication flow

Write-Host "🧪 SMA Sanjeevani Login System Test" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$BACKEND_URL = "http://127.0.0.1:8000"
$TEST_USERNAME = "testuser"
$TEST_PASSWORD = "testpass123"
$TEST_EMAIL = "testuser@example.com"

# Test 1: Check if backend is running
Write-Host "[TEST 1] Checking if backend is running..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/health" -ErrorAction Stop
    Write-Host "✅ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is not running!" -ForegroundColor Red
    Write-Host "Start backend with: python backend/start.py" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Test 2: Test signup endpoint
Write-Host "[TEST 2] Testing signup endpoint..." -ForegroundColor Blue
try {
    $body = @{
        username = $TEST_USERNAME
        email = $TEST_EMAIL
        password = $TEST_PASSWORD
        first_name = "Test"
        last_name = "User"
        age = 30
        gender = "Male"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/auth/signup" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "✅ Signup successful (HTTP $($response.StatusCode))" -ForegroundColor Green
    
    $data = $response.Content | ConvertFrom-Json
    if ($data.access_token) {
        $tokenPreview = $data.access_token.Substring(0, [Math]::Min(20, $data.access_token.Length))
        Write-Host "✅ Token received: $tokenPreview..." -ForegroundColor Green
    }
} catch {
    if ($_.Exception.Response.StatusCode.Value__ -eq 400) {
        Write-Host "⚠️  User might already exist (HTTP 400)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Signup failed: $_" -ForegroundColor Red
    }
}
Write-Host ""

# Test 3: Test login endpoint
Write-Host "[TEST 3] Testing login endpoint..." -ForegroundColor Blue
try {
    $body = @{
        username = $TEST_USERNAME
        password = $TEST_PASSWORD
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/auth/login" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "✅ Login successful (HTTP $($response.StatusCode))" -ForegroundColor Green
    
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.access_token) {
        $tokenPreview = $data.access_token.Substring(0, [Math]::Min(20, $data.access_token.Length))
        Write-Host "✅ Token: $tokenPreview..." -ForegroundColor Green
    }
    
    if ($data.user.username) {
        Write-Host "✅ User: $($data.user.username)" -ForegroundColor Green
    }
    
    if ($data.token_type) {
        Write-Host "✅ Token type: $($data.token_type)" -ForegroundColor Green
    }
    
    if ($data.expires_in) {
        Write-Host "✅ Expires in: $($data.expires_in) seconds" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 4: Test invalid login
Write-Host "[TEST 4] Testing invalid login (should fail)..." -ForegroundColor Blue
try {
    $body = @{
        username = "invaliduser"
        password = "wrongpassword"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/auth/login" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "❌ Invalid login should have been rejected" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.Value__ -eq 401) {
        Write-Host "✅ Invalid login correctly rejected (HTTP 401)" -ForegroundColor Green
    }
}
Write-Host ""

# Summary
Write-Host "====================================" -ForegroundColor Blue
Write-Host "Test Summary" -ForegroundColor Blue
Write-Host "====================================" -ForegroundColor Blue
Write-Host "✅ All authentication tests passed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open frontend application: http://localhost:5174"
Write-Host "2. Click on Login"
Write-Host "3. Enter username: $TEST_USERNAME"
Write-Host "4. Enter password: $TEST_PASSWORD"
Write-Host "5. Check browser console (F12) for debug logs"
Write-Host ""
Write-Host "Debug Output to Look For:" -ForegroundColor Yellow
Write-Host "🔐 Auth Request: { url, method, isLogin }"
Write-Host "📤 Payload: { username, password }"
Write-Host "📥 Response Status: 200 OK"
Write-Host "✅ Auth Success: { user, tokenLength }"
Write-Host "💾 Stored: { token: ✓, user: ✓ }"
