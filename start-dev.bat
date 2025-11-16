@echo off
echo Starting development servers for Kid-Game-1...
echo.
echo This will start the Backend on port 3005 and the Frontend on port 8080.
echo It will first attempt to free up these ports if they are in use.
echo.

REM Navigate to the project root and run the main dev script
cd /d "c:\dev\Kid-Game-1"
npm run dev