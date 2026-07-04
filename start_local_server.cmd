@echo off
cd /d "%~dp0"
powershell.exe -WindowStyle Hidden -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve_local.ps1" -Port 8501 -FindAvailablePort -Open > "%~dp0server.out.log" 2> "%~dp0server.err.log"
