@echo off
rem ============================================
rem  Life Calculator - Windows preview launcher
rem  Opens the app in a phone-sized Microsoft Edge window.
rem ============================================
set "APP=%~dp0www\index.html"
set "URL=file:///%APP:\=/%"
set "PROFILE=%LOCALAPPDATA%\LifeCalculatorPreview"
start "" msedge --app="%URL%" --window-size=430,900 --user-data-dir="%PROFILE%" --no-first-run
if errorlevel 1 start "" "%APP%"
