# PowerShell Test Script for Sanjeevani API Endpoints
# Usage: powershell -File test_api.ps1

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "SANJEEVANI SYSTEM API TESTING" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://127.0.0.1:8000"

# Test 1: Health Check
Write-Host "TEST 1: Health Check" -ForegroundColor Green
Write-Host "URL: GET $baseUrl/health"
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Yellow
    Write-Host "Response: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host "---" -ForegroundColor Gray
Write-Host ""

# Test 2: Status Check
Write-Host "TEST 2: LLM Status" -ForegroundColor Green
Write-Host "URL: GET $baseUrl/api/symptoms/status"
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/symptoms/status" -Method GET
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Yellow
    $json = $response.Content | ConvertFrom-Json
    Write-Host "LLM Provider: $($json.llm_provider)" -ForegroundColor White
    Write-Host "Ollama Model: $($json.ollama_model)" -ForegroundColor White
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host "---" -ForegroundColor Gray
Write-Host ""

# Test 3: Medical Q&A (CRITICAL TEST)
Write-Host "TEST 3: Medical Q&A - Chatbot ✅" -ForegroundColor Green
Write-Host "URL: POST $baseUrl/api/medical-qa" 
Write-Host "Question: What is a fever?"
try {
    $body = @{"question"="What is a fever?"} | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "$baseUrl/api/medical-qa" -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $body
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Yellow
    $json = $response.Content | ConvertFrom-Json
    if ($json.answer) {
        Write-Host "✅ Got Answer ($(($json.answer).Length) chars)" -ForegroundColor White
        Write-Host "First 200 chars:" -ForegroundColor White
        Write-Host "$($json.answer.Substring(0, [Math]::Min(200, $json.answer.Length)))..." -ForegroundColor White
    } else {
        Write-Host "❌ No answer field" -ForegroundColor Red
        Write-Host $response.Content -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host "---" -ForegroundColor Gray
Write-Host ""

# Test 4: Ollama Connectivity Test
Write-Host "TEST 4: Ollama Connectivity" -ForegroundColor Green
Write-Host "URL: GET $baseUrl/api/symptoms/test-ollama"
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/symptoms/test-ollama" -Method GET
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Yellow
    $json = $response.Content | ConvertFrom-Json
    Write-Host "Ollama Status: $($json.status)" -ForegroundColor White
    if ($json.ollama_running) {
        Write-Host "✅ Ollama is running" -ForegroundColor Green
    } else {
        Write-Host "❌ Ollama is NOT running" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host "---" -ForegroundColor Gray
Write-Host ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "TESTING COMPLETE" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
