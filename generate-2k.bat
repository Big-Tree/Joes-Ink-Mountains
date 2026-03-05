@echo off
cd /d "%~dp0"
echo.
echo === Shan Shui Wallpaper Generator (2K) ===
echo.
echo Installing dependencies (first run only)...
call npm install
echo.
node generate-wallpapers.js 2560 1440
echo.
pause
