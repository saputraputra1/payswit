@echo off
echo ========================================
echo   Payswit Docker Setup
echo ========================================
echo.

echo [1/4] Copying environment files...
copy /Y server\.env.docker server\.env >nul 2>&1
copy /Y client\.env.docker client\.env >nul 2>&1
echo Done!
echo.

echo [2/4] Building Docker images...
docker-compose build
if %errorlevel% neq 0 (
    echo ERROR: Docker build failed!
    pause
    exit /b 1
)
echo Done!
echo.

echo [3/4] Starting containers...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ERROR: Failed to start containers!
    pause
    exit /b 1
)
echo Done!
echo.

echo [4/4] Waiting for services...
timeout /t 10 /nobreak >nul
echo.

echo ========================================
echo   Payswit is running!
echo ========================================
echo.
echo   Client:  http://localhost:3000
echo   Server:  http://localhost:5000
echo   Health:  http://localhost:5000/api/health
echo.
echo ========================================
echo.
pause
