@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve_local.ps1" -Port 8501 -FindAvailablePort -Open
