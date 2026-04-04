param(
  [ValidateSet('local', 'cloud')]
  [string]$Mode
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$rootSwitchScript = Join-Path $repoRoot 'scripts\switch_env.ps1'

if (-not (Test-Path $rootSwitchScript)) {
  throw "Root switch script not found at $rootSwitchScript"
}

& $rootSwitchScript $Mode