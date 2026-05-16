@echo off
title LAN Party Catering
color 0A
cls

echo.
echo  ================================================
echo   LAN Party Catering — Starting up...
echo  ================================================
echo.

:: ── Check Python is installed ────────────────────────────────
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Python not found. Install it from python.org
    pause
    exit /b 1
)

:: ── Check Node is installed ──────────────────────────────────
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js not found. Install it from nodejs.org
    pause
    exit /b 1
)

:: ── Check node_modules exists ────────────────────────────────
if not exist "node_modules\" (
    echo  [INFO] First run — installing npm packages...
    echo.
    npm install
    echo.
)

:: ── Create logs folder ───────────────────────────────────────
if not exist "logs\" mkdir logs

:: ── Start email server silently in the background ────────────
echo  [1/2] Starting email server...
start /b python email-server/server.py > logs\email-server.log 2>&1

timeout /t 2 /nobreak >nul

:: ── Start Vite silently in the background ─────────────────────
echo  [2/2] Starting web app...
start /b npm run dev > logs\web-app.log 2>&1

:: ── Wait for Vite to be ready then open browser ──────────────
echo.
echo  Waiting for web app to be ready...
timeout /t 5 /nobreak >nul
start http://localhost:5173

:: ── Print LAN IP so you can share it ─────────────────────────
echo.
echo  ================================================
echo   All systems go!
echo  ================================================
echo.
echo  Web app:      http://localhost:5173
echo  Email server: http://localhost:5001
echo.
echo  Share this address with attendees on your LAN:
echo.
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set IP=%%a
    setlocal enabledelayedexpansion
    set IP=!IP: =!
    echo    http://!IP!:5173
    endlocal
)
echo.
echo  Admin panel:  http://localhost:5173/admin
echo  Password:     admin123
echo.
echo  Logs are saved to the logs\ folder if you need to debug.
echo.
echo  ================================================
echo   Press any key to stop everything and exit.
echo  ================================================
pause >nul

:: ── Shut down both background servers ────────────────────────
echo.
echo  Stopping servers...
taskkill /f /fi "imagename eq python.exe" >nul 2>&1
taskkill /f /fi "imagename eq node.exe"   >nul 2>&1
echo  Done. Goodbye!
timeout /t 1 /nobreak >nul
