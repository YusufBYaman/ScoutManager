@echo off
title EA Sports FC 26 - CM Tracker
echo ========================================================
echo EA Sports FC 26 Career Mode Tracker Baslatiliyor...
echo ========================================================
echo.
cd /d "%~dp0web"
start http://localhost:5173/
npm run dev
pause
