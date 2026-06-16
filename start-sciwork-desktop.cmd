@echo off
setlocal
title SciWork Desktop - Local Dev
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found in PATH. Please install Node.js or open this shortcut from a terminal with Node.js available.
  pause
  exit /b 1
)

npm run dev
if errorlevel 1 (
  echo.
  echo SciWork failed to start. See the error above.
  pause
  exit /b 1
)
