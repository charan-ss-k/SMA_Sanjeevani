@echo off
REM Test script to validate API connectivity and login system
REM Run this after starting the backend

setlocal enabledelayedexpansion
set API_URL=http://localhost:8000
set USERNAME=testuser
set PASSWORD=password123

echo.
echo ============================================
echo SMA Sanjeevani API Connectivity Test
echo ============================================
echo.

REM Test 1: Health Check
echo [TEST 1] Checking if backend is alive...
echo Endpoint: %API_URL%/health
powershell -NoProfile -Command "try { $response = Invoke-WebRequest -Uri '%API_URL%/health' -Method GET -ErrorAction Stop; Write-Host '✅ Backend is running! Status:' $response.StatusCode; Write-Host $response.Content } catch { Write-Host '❌ Backend is NOT responding'; Write-Host 'Error:' $_.Exception.Message }" 2>&1
echo.

REM Test 2: Signup Test  
echo [TEST 2] Testing Signup endpoint...
echo Endpoint: POST %API_URL%/api/auth/signup
echo.

set SIGNUP_PAYLOAD={\"username\":\"testuser_%RANDOM%\",\"email\":\"test_%RANDOM%@example.com\",\"password\":\"password123\",\"first_name\":\"Test\",\"last_name\":\"User\",\"age\":30,\"gender\":\"Male\"}

powershell -NoProfile -Command "
try {
    `$payload = '{\"username\":\"testuser_%RANDOM%\",\"email\":\"test_%RANDOM%@example.com\",\"password\":\"password123\",\"first_name\":\"Test\",\"last_name\":\"User\",\"age\":30,\"gender\":\"Male\"}'
    `$response = Invoke-WebRequest -Uri '%API_URL%/api/auth/signup' -Method POST -ContentType 'application/json' -Body `$payload -ErrorAction Stop
    Write-Host '✅ Signup successful! Status:' `$response.StatusCode
    `$data = `$response.Content | ConvertFrom-Json
    Write-Host 'User ID:' `$data.user.id
    Write-Host 'Username:' `$data.user.username
    Write-Host 'Token received: Yes' 
} catch {
    Write-Host '⚠️ Signup returned error (may be duplicate user):'
    Write-Host 'Status:' `$_.Exception.Response.StatusCode.Value
    try {
        `$errorBody = `$_.Exception.Response.Content.ReadAsStream() | Out-String
        Write-Host 'Error:' `$errorBody
    } catch { }
}
" 2>&1

echo.

REM Test 3: Login Test
echo [TEST 3] Testing Login endpoint...
echo Endpoint: POST %API_URL%/api/auth/login
echo Username: %USERNAME%
echo.

powershell -NoProfile -Command "
try {
    `$payload = '{\"username\":\"%USERNAME%\",\"password\":\"%PASSWORD%\"}'
    `$response = Invoke-WebRequest -Uri '%API_URL%/api/auth/login' -Method POST -ContentType 'application/json' -Body `$payload -ErrorAction Stop
    Write-Host '✅ Login successful! Status:' `$response.StatusCode
    `$data = `$response.Content | ConvertFrom-Json
    Write-Host 'User:' `$data.user.username
    Write-Host 'Token length:' `$data.access_token.Length 'characters'
    Write-Host 'Token type:' `$data.token_type
    Write-Host 'Expires in:' `$data.expires_in 'seconds'
} catch {
    Write-Host '❌ Login failed! Status:' `$_.Exception.Response.StatusCode.Value
    try {
        `$errorBody = `$_.Exception.Response.Content.ReadAsStream() | Out-String
        `$errorJson = `$errorBody | ConvertFrom-Json
        Write-Host 'Error:' `$errorJson.detail
    } catch { 
        Write-Host 'Error: Could not parse error response'
    }
}
" 2>&1

echo.

REM Test 4: Invalid Login Test
echo [TEST 4] Testing invalid credentials (should fail)...
echo Username: invalid_user
echo Password: wrongpassword
echo.

powershell -NoProfile -Command "
try {
    `$payload = '{\"username\":\"invalid_user\",\"password\":\"wrongpassword\"}'
    `$response = Invoke-WebRequest -Uri '%API_URL%/api/auth/login' -Method POST -ContentType 'application/json' -Body `$payload -ErrorAction Stop
    Write-Host '❌ Expected error but got success (unexpected)'
} catch {
    if (`$_.Exception.Response.StatusCode.Value -eq 401) {
        Write-Host '✅ Correctly returned 401 Unauthorized'
        try {
            `$errorBody = `$_.Exception.Response.Content.ReadAsStream() | Out-String
            `$errorJson = `$errorBody | ConvertFrom-Json
            Write-Host 'Error message:' `$errorJson.detail
        } catch { }
    } else {
        Write-Host '❌ Wrong error code:' `$_.Exception.Response.StatusCode.Value
    }
}
" 2>&1

echo.
echo ============================================
echo Test Complete!
echo ============================================
echo.
echo Summary:
echo - If all tests passed (✅), your API is working correctly
echo - Open browser console (F12) and try logging in
echo - Check backend terminal for detailed logs starting with 🔐 and 📤
echo.
