<#
.SYNOPSIS
  Stages a clean, Steam-ready copy of the Touwers build into steampipe\staging\.

.DESCRIPTION
  `cargo build --release` / `tauri build` leave a lot in target\release\ that
  Steam doesn't need (debug symbols, .rlib/.lib intermediates, the NSIS
  installer itself). This script copies out only what the depot should
  contain: the game exe, steam_api64.dll, and the WebView2 Evergreen
  bootstrapper (see installscript.vdf, which runs it silently on install).

  Run this AFTER `npm run build` (from apps\desktop\) has produced a release
  build. It does not build the game itself.
#>

$ErrorActionPreference = 'Stop'

$scriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$steampipe  = Split-Path -Parent $scriptDir
$desktopDir = Split-Path -Parent $steampipe
$releaseDir = Join-Path $desktopDir 'src-tauri\target\release'
$staging    = Join-Path $steampipe 'staging'

$exeSrc = Join-Path $releaseDir 'touwers-desktop.exe'
$dllSrc = Join-Path $releaseDir 'steam_api64.dll'

if (-not (Test-Path $exeSrc)) {
    throw "No release build found at $exeSrc. Run 'npm run build' in apps\desktop first."
}
if (-not (Test-Path $dllSrc)) {
    throw "steam_api64.dll missing at $dllSrc - Steamworks integration won't work without it."
}

if (Test-Path $staging) {
    Remove-Item $staging -Recurse -Force
}
New-Item -ItemType Directory -Path $staging | Out-Null

Copy-Item $exeSrc (Join-Path $staging 'touwers-desktop.exe')
Copy-Item $dllSrc (Join-Path $staging 'steam_api64.dll')
Write-Host "Staged game exe + steam_api64.dll -> $staging"

# WebView2 Evergreen Bootstrapper - Microsoft's stable redistribution
# permalink (see https://developer.microsoft.com/microsoft-edge/webview2/
# "Get the Evergreen Bootstrapper"). Small stub (~2MB); installscript.vdf
# runs it silently during Steam install/update.
$webview2Url  = 'https://go.microsoft.com/fwlink/p/?LinkId=2124703'
$webview2Dest = Join-Path $staging 'MicrosoftEdgeWebView2Setup.exe'

try {
    Invoke-WebRequest -Uri $webview2Url -OutFile $webview2Dest -UseBasicParsing
    Write-Host "Downloaded WebView2 bootstrapper -> $webview2Dest"
} catch {
    Write-Warning "Could not download the WebView2 bootstrapper automatically ($($_.Exception.Message))."
    Write-Warning "Download it manually from https://developer.microsoft.com/microsoft-edge/webview2/ (Evergreen Bootstrapper) and save it as:"
    Write-Warning "  $webview2Dest"
    throw "Staging incomplete - WebView2 bootstrapper missing."
}

Write-Host ""
Write-Host "Staging complete: $staging"
Get-ChildItem $staging | Format-Table Name, Length -AutoSize
