@echo off
REM Build Touwers Tauri Release Executable
REM This script sets up the Visual Studio environment and builds the Tauri app

cd /d "%~dp0"

REM Find VS 2022 Build Tools path
set "VSPATH=C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools"

if not exist "%VSPATH%" (
    echo Error: Visual Studio Build Tools not found at %VSPATH%
    pause
    exit /b 1
)

REM Run the VS initialization script to set up the environment
call "%VSPATH%\VC\Auxiliary\Build\vcvars64.bat"

REM Verify we can find the Windows SDK
if not exist "C:\Program Files (x86)\Windows Kits\10" (
    echo Error: Windows SDK not found
    pause
    exit /b 1
)

REM Build Tauri in release mode
echo.
echo Building Tauri release executable...
echo.

call npm run build

if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Build complete! Executable created.
echo.
pause
