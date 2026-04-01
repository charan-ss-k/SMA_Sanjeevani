$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$frontendLocal = Join-Path $repoRoot 'frontend\.env.local'
$frontendProd = Join-Path $repoRoot 'frontend\.env.production'
$frontendDev = Join-Path $repoRoot 'frontend\.env.development'
$mobileLocal = Join-Path $repoRoot 'mobile\.env.local'
$mobileEnv = Join-Path $repoRoot 'mobile\.env'
$backendEnv = Join-Path $repoRoot 'backend\.env'

Set-Content -Path $frontendLocal -Value "VITE_API_BASE_URL=http://localhost:8000`n" -Encoding utf8
Set-Content -Path $frontendProd -Value "VITE_API_BASE_URL=http://localhost:8000`n" -Encoding utf8
Set-Content -Path $frontendDev -Value "VITE_API_BASE_URL=http://localhost:8000`n" -Encoding utf8
Set-Content -Path $mobileLocal -Value "EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/api`n" -Encoding utf8
Set-Content -Path $mobileEnv -Value "EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/api`n" -Encoding utf8

if (-not (Test-Path $backendEnv)) {
  Write-Host "backend/.env not found; leaving it unchanged"
} else {
  Write-Host "backend/.env left unchanged for local testing"
}

Write-Host "Local env applied:"
Write-Host "- frontend/.env.local"
Write-Host "- frontend/.env.production"
Write-Host "- frontend/.env.development"
Write-Host "- mobile/.env.local"
Write-Host "- mobile/.env"