# Setup environment for Tauri development
Write-Host "Setting up environment for Tauri development..." -ForegroundColor Green

# Add Rust/Cargo to PATH first
$rustPath = "$env:USERPROFILE\.cargo\bin"
if (-not (Test-Path $rustPath)) {
    Write-Host "✗ Rust not found. Please install from https://www.rust-lang.org/tools/install" -ForegroundColor Red
    exit 1
}
$env:Path = "$rustPath;" + $env:Path

# Setup MSVC compiler environment
$vsPath = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\14.44.35207\bin\Hostx64\x64"
$vcLibPath = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\14.44.35207\lib\x64"
$includePath = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\14.44.35207\include"
$windowsKitPath = "C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64"
$windowsKitLibPath = "C:\Program Files (x86)\Windows Kits\10\Lib\10.0.22621.0\um\x64"

# Add MSVC paths
$env:Path = $vsPath + ";" + $windowsKitPath + ";" + $env:Path
$env:INCLUDE = $includePath + ";" + "C:\Program Files (x86)\Windows Kits\10\Include\10.0.22621.0\um"
$env:LIB = $vcLibPath + ";" + $windowsKitLibPath

# Verify setup
Write-Host "✓ Rust: $(rustc --version)" -ForegroundColor Green
Write-Host "✓ Cargo: $(cargo --version)" -ForegroundColor Green
Write-Host ""
Write-Host "Starting Tauri dev server..." -ForegroundColor Green
Write-Host "The game will open in a separate native window." -ForegroundColor Cyan
Write-Host "Dev server running at http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

# Run Tauri dev
npm run tauri dev
