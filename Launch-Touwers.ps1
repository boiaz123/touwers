# Touwers - Tower Defense Game Launcher
# This PowerShell script launches the Electron app

$ErrorActionPreference = "SilentlyContinue"

# Get the script's directory
$scriptDir = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition

# Change to the project directory
Set-Location $scriptDir

# Check if node_modules exists, install if necessary
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies for first-time setup..."
    & npm install
}

# Launch the Electron app
Write-Host "Starting Touwers..."
& npm start
