@echo off
REM Touwers - Tower Defense Game Launcher
REM This script starts the Touwers game

cd /d "%~dp0"

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

REM Start the Electron app
call npm start
pause
