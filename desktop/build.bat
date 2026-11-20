@echo off
rem Build the Windows executable (requires Go: https://go.dev/dl/)
cd /d "%~dp0"
if exist www rmdir /s /q www
xcopy /e /i /q ..\www www >nul
set GOOS=windows
set GOARCH=amd64
set CGO_ENABLED=0
go build -trimpath -ldflags "-H windowsgui -s -w" -o ..\dist\LifeCalculator.exe .
rmdir /s /q www
echo built: dist\LifeCalculator.exe
