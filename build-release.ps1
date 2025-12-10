# Build Touwers Tauri Release Executable
# This script sets up the Visual Studio environment and builds the Tauri app

$VSPATH = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools"

if (-not (Test-Path $VSPATH)) {
    Write-Host "Error: Visual Studio Build Tools not found at $VSPATH" -ForegroundColor Red
    exit 1
}

# Find the vcvars batch file
$vcvarsPath = Join-Path $VSPATH "VC\Auxiliary\Build\vcvars64.bat"
if (-not (Test-Path $vcvarsPath)) {
    Write-Host "Error: vcvars64.bat not found at $vcvarsPath" -ForegroundColor Red
    exit 1
}

# Run vcvars64.bat and then our build command in the same process
Write-Host "Setting up Visual Studio environment..." -ForegroundColor Cyan
$output = cmd /c "`"$vcvarsPath`" && cd /d `"c:\Users\boiaz\AppDev\touwers`" && npm run build"

Write-Host $output

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nBuild successful!" -ForegroundColor Green
    Write-Host "The executable is in: src-tauri\target\release\bundle\msi\" -ForegroundColor Green
} else {
    Write-Host "`nBuild failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}
