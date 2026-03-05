@echo off
cd /d "%~dp0"
echo.
echo === Shan Shui Wallpaper Generator (1080p) ===
echo.
echo Installing dependencies (first run only)...
call npm install
echo.
node generate-wallpapers.js 1920 1080
echo.
pause
