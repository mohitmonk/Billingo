@echo off

:: Colors for output (using ANSI escape codes might not work in cmd, so using plain text)
set "GREEN=echo [INFO]"
set "RED=echo [ERROR]"
set "NC=echo."

:: Function to print messages
:print_message
echo [INFO] %1
goto :eof

:print_error
echo [ERROR] %1
goto :eof

:: Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    call :print_error "Node.js is not installed. Please install Node.js and npm first."
    call :print_message "You can download Node.js from https://nodejs.org/"
    exit /b 1
)

:: Check if npm is installed
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    call :print_error "npm is not installed. Please install npm first."
    exit /b 1
)

call :print_message "Node.js and npm are installed. Proceeding with setup..."

:: Install backend dependencies
call :print_message "Installing backend dependencies..."
cd backend || (
    call :print_error "Failed to navigate to backend directory. Ensure the 'backend' directory exists."
    exit /b 1
)
npm install || (
    call :print_error "Failed to install backend dependencies."
    exit /b 1
)
cd ..

:: Install frontend dependencies
call :print_message "Installing frontend dependencies..."
cd frontend || (
    call :print_error "Failed to navigate to frontend directory. Ensure the 'frontend' directory exists."
    exit /b 1
)
npm install || (
    call :print_error "Failed to install frontend dependencies."
    exit /b 1
)
cd ..

:: Start the backend server in a new window
call :print_message "Starting backend server..."
cd backend
start cmd /k node server.js
cd ..
timeout /t 5 /nobreak >nul

:: Start the frontend React app in a new window
call :print_message "Starting frontend React app..."
cd frontend
start cmd /k npm run dev
cd ..

call :print_message "Project setup and servers started successfully!"
call :print_message "Backend is running on http://localhost:5000"
call :print_message "Frontend is running on http://localhost:3000"
call :print_message "You can now access the app in your browser."