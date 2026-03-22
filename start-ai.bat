@echo off
title Local AI Chat Launcher

echo [1/4] Starting Ollama...
start /min "" "C:\Users\deepa\AppData\Local\Programs\Ollama\ollama.exe" serve

timeout /t 3 /nobreak > nul

echo [2/4] Starting Backend...
start /min "Backend" cmd /k "cd /d C:\Users\deepa\OneDrive\Desktop\PROJECT\backend && venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --reload"

timeout /t 4 /nobreak > nul

echo [3/4] Starting Frontend...
start /min "Frontend" cmd /k "cd /d C:\Users\deepa\OneDrive\Desktop\PROJECT\frontend && npm run dev"

timeout /t 5 /nobreak > nul

echo [4/4] Starting App...
start /min "Electron" cmd /k "cd /d C:\Users\deepa\OneDrive\Desktop\PROJECT\electron && node_modules\.bin\electron ."

exit