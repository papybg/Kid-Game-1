@echo off
echo Checking for processes using ports 8080 and 3005...

REM Kill processes on port 8080 (Vite client)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080') do (
    echo Killing process %%a on port 8080
    taskkill /PID %%a /F >nul 2>&1
)

REM Kill processes on port 3005 (Express server)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3005') do (
    echo Killing process %%a on port 3005
    taskkill /PID %%a /F >nul 2>&1
)

echo Waiting 3 seconds for ports to be freed...
timeout /t 3 /nobreak >nul

echo Starting development servers...
npm run dev