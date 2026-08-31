<#
.SYNOPSIS
  Uploads the staged Touwers build to Steam via steamcmd.

.DESCRIPTION
  Thin wrapper around `steamcmd +login ... +run_app_build ... +quit`. Does
  NOT store or embed your Steam credentials anywhere - steamcmd will prompt
  for your password and, on first run from this machine, a Steam Guard code
  (cache the resulting `.steamguard`/sentry file when it asks, so you don't
  need the code every time).

.PARAMETER Username
  Your Steamworks-account-holding Steam login (must have SteamPipe publishing
  permission on app 5132600).

.PARAMETER SteamCmdPath
  Path to steamcmd.exe. Defaults to 'steamcmd' (PATH), falling back to
  %LOCALAPPDATA%\SteamCMD\steamcmd.exe if PATH doesn't have it.

.EXAMPLE
  .\upload.ps1 -Username yoursteamlogin
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$Username,

    [string]$SteamCmdPath
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$steampipe = Split-Path -Parent $scriptDir
$staging   = Join-Path $steampipe 'staging'

if (-not $SteamCmdPath) {
    $onPath = Get-Command 'steamcmd' -ErrorAction SilentlyContinue
    $localInstall = Join-Path $env:LOCALAPPDATA 'SteamCMD\steamcmd.exe'
    if ($onPath) {
        $SteamCmdPath = 'steamcmd'
    } elseif (Test-Path $localInstall) {
        $SteamCmdPath = $localInstall
    } else {
        throw "steamcmd not found on PATH or at $localInstall. Install it from https://developer.valvesoftware.com/wiki/SteamCMD or pass -SteamCmdPath explicitly."
    }
}

if (-not (Test-Path $staging) -or -not (Test-Path (Join-Path $staging 'touwers-desktop.exe'))) {
    throw "No staged build found in $staging. Run stage_build.ps1 first."
}

Push-Location $steampipe
try {
    & $SteamCmdPath +login $Username +run_app_build (Join-Path $steampipe 'app_build_5132600.vdf') +quit
    if ($LASTEXITCODE -ne 0) {
        throw "steamcmd exited with code $LASTEXITCODE - check the log above for the failure reason."
    }
    Write-Host ""
    Write-Host "Build uploaded. Check Steamworks -> App Admin -> Builds to confirm, then set it live on the branch you want from the dashboard (or via SetLive in app_build_5132600.vdf next time)."
} finally {
    Pop-Location
}
