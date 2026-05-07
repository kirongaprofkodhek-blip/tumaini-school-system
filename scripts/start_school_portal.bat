@echo off
setlocal
cd /d "%~dp0..\frontend"

set "NODE_ROOT="
for /d %%D in ("%~dp0..\tools\nodejs\node-v*-win-x64") do (
  set "NODE_ROOT=%%~fD"
)

if not defined NODE_ROOT (
  where node >nul 2>nul
  if %errorlevel%==0 (
    npm run dev -- --host 127.0.0.1 --port 5173
    exit /b %errorlevel%
  )
  echo Could not find a local Node.js runtime in tools\nodejs or a system node installation.
  exit /b 1
)

set "PATH=%NODE_ROOT%;%PATH%"
"%NODE_ROOT%\npm.cmd" run dev -- --host 127.0.0.1 --port 5173
