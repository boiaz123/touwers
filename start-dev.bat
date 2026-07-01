@echo off
cd /d "%~dp0"

REM Start the dev server in a separate window
start "Touwers Dev Server" cmd /k "npm run dev"

REM Give the server time to start
timeout /t 2 /nobreak

REM Start Tauri dev
call npm run tauri dev
