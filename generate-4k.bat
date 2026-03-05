@echo off
cd /d "%~dp0"
echo.
echo === Shan Shui Wallpaper Generator (4K) ===
echo.
echo Installing dependencies (first run only)...
call npm install
echo.
node generate-wallpapers.js 3840 2160
echo.
pause
