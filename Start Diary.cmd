@echo off
set "DIARY_PYTHON=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
if not exist "%DIARY_PYTHON%" (
  echo Python runtime was not found. Please ask to reconnect the local diary server.
  pause
  exit /b 1
)
"%DIARY_PYTHON%" "%~dp0start-diary.py"
if errorlevel 1 pause
