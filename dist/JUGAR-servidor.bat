@echo off
cd /d "%~dp0"
echo NO GROUND BELOW
echo.
echo Abriendo http://127.0.0.1:8787
echo Cerra esta ventana para cortar el servidor.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
