$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$cloudEnv = Join-Path $repoRoot '.env_cloud'
$frontendCloud = Join-Path $repoRoot 'frontend\.env.cloud'
$frontendProd = Join-Path $repoRoot 'frontend\.env.production'
$frontendLocal = Join-Path $repoRoot 'frontend\.env.local'
$frontendDev = Join-Path $repoRoot 'frontend\.env.development'
$mobileCloud = Join-Path $repoRoot 'mobile\.env.cloud'
$mobileEnv = Join-Path $repoRoot 'mobile\.env'
$mobileLocal = Join-Path $repoRoot 'mobile\.env.local'
$backendEnv = Join-Path $repoRoot 'backend\.env'

if (-not (Test-Path $cloudEnv)) {
  throw ".env_cloud not found at repo root"
}

$cloudText = Get-Content $cloudEnv -Raw
$backendBase = ($cloudText -split "`r?`n" | Where-Object { $_ -match '^BACKEND_BASE_URL=' } | Select-Object -First 1)
if (-not $backendBase) {
  throw "BACKEND_BASE_URL is missing in .env_cloud"
}
$backendBase = $backendBase.Split('=', 2)[1].Trim().TrimEnd('/')
if (-not $backendBase) {
  throw "BACKEND_BASE_URL is empty in .env_cloud"
}

Set-Content -Path $backendEnv -Value $cloudText -Encoding utf8
Set-Content -Path $frontendCloud -Value "VITE_API_BASE_URL=$backendBase`n" -Encoding utf8
Set-Content -Path $frontendProd -Value "VITE_API_BASE_URL=$backendBase`n" -Encoding utf8
Set-Content -Path $frontendLocal -Value "VITE_API_BASE_URL=$backendBase`n" -Encoding utf8
Set-Content -Path $frontendDev -Value "VITE_API_BASE_URL=$backendBase`n" -Encoding utf8
Set-Content -Path $mobileCloud -Value "EXPO_PUBLIC_API_BASE_URL=$backendBase/api`n" -Encoding utf8
Set-Content -Path $mobileEnv -Value "EXPO_PUBLIC_API_BASE_URL=$backendBase/api`n" -Encoding utf8
Set-Content -Path $mobileLocal -Value "EXPO_PUBLIC_API_BASE_URL=$backendBase/api`n" -Encoding utf8

Write-Host "Cloud env synced:"
Write-Host "- backend/.env"
Write-Host "- frontend/.env.cloud"
Write-Host "- frontend/.env.production"
Write-Host "- frontend/.env.local"
Write-Host "- frontend/.env.development"
Write-Host "- mobile/.env.cloud"
Write-Host "- mobile/.env"
Write-Host "- mobile/.env.local"