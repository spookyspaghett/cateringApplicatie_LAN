@echo off
title LAN Party Catering
color 0A
cls

echo.
echo  ================================================
echo   LAN Party Catering -- Starting up...
echo  ================================================
echo.

:: ── 1. Check Node.js ─────────────────────────────────────────
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed.
    echo          Download it from: https://nodejs.org
    echo.
    pause & exit /b 1
)

:: ── 2. Ensure Docker Desktop is running ──────────────────────
docker info >nul 2>&1
if %errorlevel% == 0 goto DOCKER_OK

echo  [INFO] Docker Desktop is not running. Trying to start it...
if not exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" goto DOCKER_NOT_INSTALLED

start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
echo         Waiting for Docker to be ready, up to 90 seconds...
set WAITED=0

:WAIT_DOCKER
timeout /t 3 /nobreak >nul
docker info >nul 2>&1
if %errorlevel% == 0 goto DOCKER_OK
set /a WAITED+=3
echo         Still waiting... %WAITED%s
if %WAITED% lss 90 goto WAIT_DOCKER

echo.
echo  [ERROR] Docker took too long to start.
echo          Open Docker Desktop manually, wait for the whale icon
echo          in the taskbar to stop animating, then try again.
echo.
pause & exit /b 1

:DOCKER_NOT_INSTALLED
echo.
echo  [ERROR] Docker Desktop is not installed.
echo          Download it from: https://www.docker.com/products/docker-desktop
echo.
pause & exit /b 1

:DOCKER_OK
echo         Docker is ready!
echo.

:: ── 3. Detect docker compose command ─────────────────────────
docker compose version >nul 2>&1
if %errorlevel% == 0 set DC=docker compose & goto DC_FOUND
docker-compose version >nul 2>&1
if %errorlevel% == 0 set DC=docker-compose & goto DC_FOUND

echo  [ERROR] Docker Compose not found.
echo.
pause & exit /b 1

:DC_FOUND

:: ── 4. Install npm packages if needed ────────────────────────
if not exist "node_modules\express\" (
    echo  [INFO] Installing npm packages...
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo  [ERROR] npm install failed.
        echo.
        pause & exit /b 1
    )
    echo.
)

:: ── 5. Create logs folder ────────────────────────────────────
if not exist "logs\" mkdir logs

:: ── 6. Start MariaDB container ───────────────────────────────
echo  [1/3] Starting database...
call %DC% up -d
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Failed to start the database container.
    echo.
    pause & exit /b 1
)
echo         Database container started.
echo.

:: ── 7. Build the React frontend ──────────────────────────────
echo  [2/3] Building web app...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Build failed. Fix the errors above and try again.
    echo.
    pause & exit /b 1
)
echo.

:: ── 8. Start the API + web server ────────────────────────────
echo  [3/3] Starting server...
echo         Connecting to database, first launch may take ~30 seconds...
echo.
start "" /b node api-server/index.js > logs\server.log 2>&1

timeout /t 12 /nobreak >nul

echo.
echo  ---- Server log ---------------------------------
type logs\server.log
echo  -------------------------------------------------
echo.

start http://localhost:3001

echo  ================================================
echo   All systems go!
echo  ================================================
echo.
echo  Open on ANY device on your LAN:
echo.
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set IP=%%a
    setlocal enabledelayedexpansion
    set IP=!IP: =!
    echo    http://!IP!:3001
    endlocal
)
echo.
echo  Admin:  http://localhost:3001/admin   password: admin123
echo  Log:    logs\server.log
echo.
echo  ================================================
echo   Press any key to STOP everything and exit.
echo  ================================================
pause >nul

echo.
echo  Stopping server...
taskkill /f /fi "imagename eq node.exe" >nul 2>&1
echo  Stopping database...
call %DC% down >nul 2>&1
echo  Done. Goodbye!
timeout /t 1 /nobreak >nul
