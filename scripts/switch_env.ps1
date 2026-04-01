param(
  [ValidateSet('local', 'cloud')]
  [string]$Mode
)

$ErrorActionPreference = 'Stop'

if (-not $Mode) {
  Write-Host 'Choose environment: local or cloud'
  $Mode = Read-Host 'Enter mode'
}

$scriptDir = $PSScriptRoot
$localScript = Join-Path $scriptDir 'use_local_env.ps1'
$cloudScript = Join-Path $scriptDir 'use_cloud_env.ps1'

switch ($Mode.ToLower()) {
  'local' {
    & $localScript
  }
  'cloud' {
    & $cloudScript
  }
  default {
    throw "Invalid mode '$Mode'. Use local or cloud."
  }
}
