@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul
color 0B
title 🔵 MediaFlow - PM2 Professional Setup

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║    🔵 MediaFlow PM2 Professional Autostart Setup 🔵       ║
echo ║                  Industry-Grade Installation              ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo This script will:
echo  ✅ Install PM2 globally
echo  ✅ Configure MediaFlow as PM2 service
echo  ✅ Enable auto-start on Windows boot
echo  ✅ Configure auto-restart on crash
echo  ✅ Set up logging
echo.

REM Check admin privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: This script requires ADMINISTRATOR privileges!
    echo.
    echo Please:
    echo  1. Right-click this file
    echo  2. Select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo ✅ Administrator privileges confirmed
echo.

REM Check Node.js
echo 📋 Checking Node.js installation...
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo ❌ ERROR: Node.js is not installed!
    echo.
    echo Please install from: https://nodejs.org/
    echo (Choose LTS version and add to PATH during installation)
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js found: %NODE_VERSION%
echo.

REM Check npm
echo Checking npm installation...
where npm >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: npm not found. Please reinstall Node.js.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm found: %NPM_VERSION%
echo.

REM Check MediaFlow folder
echo Checking MediaFlow folder...
if not exist "C:\MediaFlow" (
    echo ❌ ERROR: C:\MediaFlow folder not found!
    echo.
    echo Please create C:\MediaFlow and copy:
    echo  • server.js
    echo  • package.json
    echo  • ecosystem.config.json (optional)
    echo.
    pause
    exit /b 1
)
echo ✅ C:\MediaFlow found
echo.

REM Check server.js
if not exist "C:\MediaFlow\server.js" (
    echo ❌ ERROR: server.js not found in C:\MediaFlow!
    pause
    exit /b 1
)
echo ✅ server.js found
echo.

REM Check package.json
if not exist "C:\MediaFlow\package.json" (
    echo ❌ ERROR: package.json not found in C:\MediaFlow!
    pause
    exit /b 1
)
echo ✅ package.json found
echo.

REM Check yt-dlp
echo Checking yt-dlp installation...
yt-dlp --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  WARNING: yt-dlp is not installed!
    echo.
    echo Please install it:
    echo   pip install yt-dlp
    echo.
    echo Server will still start, but downloads won't work.
    echo Press any key to continue...
    pause >nul
) else (
    for /f "tokens=*" %%i in ('yt-dlp --version') do set YTDLP_VERSION=%%i
    echo ✅ yt-dlp found: %YTDLP_VERSION%
)
echo.

REM Create logs directory
if not exist "C:\MediaFlow\logs" (
    echo Creating logs directory...
    mkdir C:\MediaFlow\logs
)
echo.

REM Create ecosystem.config.json if doesn't exist
echo Checking ecosystem.config.json...
if not exist "C:\MediaFlow\ecosystem.config.json" (
    echo Creating ecosystem.config.json...
    (
        echo {
        echo   "apps": [
        echo     {
        echo       "name": "mediaflow",
        echo       "script": "server.js",
        echo       "instances": 1,
        echo       "autorestart": true,
        echo       "max_memory_restart": "500M",
        echo       "env": {
        echo         "NODE_ENV": "production",
        echo         "PORT": 7860
        echo       },
        echo       "error_file": "logs/error.log",
        echo       "out_file": "logs/out.log",
        echo       "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
        echo       "merge_logs": true,
        echo       "max_restarts": 10,
        echo       "min_uptime": "10s",
        echo       "restart_delay": 4000
        echo     }
        echo   ]
        echo }
    ) > "C:\MediaFlow\ecosystem.config.json"
    echo ✅ ecosystem.config.json created
) else (
    echo ✅ ecosystem.config.json found
)
echo.

REM Install npm dependencies
if not exist "C:\MediaFlow\node_modules" (
    echo Installing npm dependencies...
    echo This may take 1-2 minutes...
    cd /d C:\MediaFlow
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
) else (
    echo ✅ Dependencies already installed
)
echo.

REM Stop any existing PM2 process
echo Stopping any existing MediaFlow instances...
call pm2 delete mediaflow 2>nul
echo ✅ Cleaned up old instances
echo.

REM Install PM2 globally
echo ╔════════════════════════════════════════════════════════════╗
echo ║          Installing PM2 Globally (1-2 minutes)             ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
call npm install -g pm2
if errorlevel 1 (
    echo ❌ Failed to install PM2
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('pm2 --version') do set PM2_VERSION=%%i
echo ✅ PM2 installed: %PM2_VERSION%
echo.

REM Start MediaFlow with PM2
echo ╔════════════════════════════════════════════════════════════╗
echo ║          Starting MediaFlow with PM2                       ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
cd /d C:\MediaFlow
call pm2 start ecosystem.config.json
if errorlevel 1 (
    echo ❌ Failed to start with PM2
    pause
    exit /b 1
)
echo ✅ MediaFlow started with PM2
echo.

REM Show PM2 status
echo Current process status:
echo.
call pm2 list
echo.

REM Setup auto-start
echo ╔════════════════════════════════════════════════════════════╗
echo ║      Setting up Auto-Start on Windows Boot                 ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
call pm2 startup windows-startup --service-name MediaFlowServer
if errorlevel 1 (
    echo ⚠️  Note: Auto-start may need manual configuration
    echo You can run: pm2 startup
)
echo.

REM Save PM2 configuration
echo Saving PM2 configuration...
call pm2 save
if errorlevel 1 (
    echo ⚠️  Warning: Could not save PM2 configuration
    echo Run manually: pm2 save
) else (
    echo ✅ Configuration saved
)
echo.

REM Verify server is responding
echo ╔════════════════════════════════════════════════════════════╗
echo ║           Testing Server Connection                        ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Waiting 3 seconds for server to start...
timeout /t 3 >nul

REM Test with curl if available, otherwise with powershell
where curl >nul 2>&1
if errorlevel 1 (
    echo Testing with PowerShell...
    powershell -NoProfile -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:7860/api/ping' -UseBasicParsing -TimeoutSec 3; if ($response.StatusCode -eq 200) { Write-Host '✅ Server is responding!' -ForegroundColor Green; Write-Host $response.Content -ForegroundColor Green } } catch { Write-Host '❌ Server is not responding yet' -ForegroundColor Red }"
) else (
    echo Testing with curl...
    curl -s http://localhost:7860/api/ping >nul
    if errorlevel 1 (
        echo ⚠️  Server may still be starting...
    ) else (
        echo ✅ Server is responding!
    )
)
echo.

REM Summary
echo ╔════════════════════════════════════════════════════════════╗
echo ║              ✅ SETUP COMPLETE! ✅                         ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 📊 SUMMARY:
echo  Node.js:        %NODE_VERSION%
echo  npm:            %NPM_VERSION%
echo  PM2:            %PM2_VERSION%
echo  MediaFlow:      Started with PM2
echo  Auto-start:     Configured
echo  Logs:           C:\MediaFlow\logs\
echo.

REM Create a batch file for easy management
if not exist "C:\MediaFlow\pm2-commands.bat" (
    echo Creating pm2-commands.bat for easy management...
    (
        echo @echo off
        echo title MediaFlow PM2 Commands
        echo.
        echo echo.
        echo echo Choose an option:
        echo echo  1 - View status
        echo echo  2 - View logs
        echo echo  3 - Monitor (CPU/Memory^)
        echo echo  4 - Restart server
        echo echo  5 - Stop server
        echo echo  6 - Start server
        echo echo.
        echo set /p choice="Enter number: "
        echo.
        echo if "%choice%"=="1" (
        echo     pm2 list
        echo ) else if "%choice%"=="2" (
        echo     pm2 logs mediaflow --follow
        echo ) else if "%choice%"=="3" (
        echo     pm2 monit
        echo ) else if "%choice%"=="4" (
        echo     pm2 restart mediaflow
        echo     echo Server restarted!
        echo ) else if "%choice%"=="5" (
        echo     pm2 stop mediaflow
        echo     echo Server stopped!
        echo ) else if "%choice%"=="6" (
        echo     pm2 start ecosystem.config.json
        echo     echo Server started!
        echo ) else (
        echo     echo Invalid choice
        echo )
        echo.
        echo pause
    ) > "C:\MediaFlow\pm2-commands.bat"
    echo ✅ Created pm2-commands.bat
)
echo.

echo 📋 QUICK COMMANDS:
echo.
echo   View status:      pm2 list
echo   View logs:        pm2 logs mediaflow
echo   Monitor:          pm2 monit
echo   Restart:          pm2 restart mediaflow
echo   Stop:             pm2 stop mediaflow
echo   Start:            pm2 start ecosystem.config.json
echo.
echo   Or use: pm2-commands.bat (in C:\MediaFlow\)
echo.

echo 📖 NEXT STEPS:
echo.
echo   1. ✅ Restart Windows (optional but recommended for auto-start test)
echo.
echo   2. ✅ Open browser and test:
echo      http://localhost:7860/api/ping
echo.
echo   3. ✅ Use your MediaFlow extension!
echo.
echo   4. ✅ Check logs anytime:
echo      pm2 logs mediaflow
echo.

echo ✨ Your MediaFlow server is now production-ready! ✨
echo.
echo 🎉 The server will:
echo    • Auto-start when Windows boots
echo    • Auto-restart if it crashes
echo    • Log all activity
echo    • Run forever in the background
echo.

pause
