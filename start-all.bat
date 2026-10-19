@echo off
title SPK-AG Launcher
echo ===================================================================
echo   Memulai Sistem Penjadwalan Kuliah Berbasis Algoritma Genetika (SPK-AG)
echo ===================================================================
echo.

echo [1/2] Menjalankan Backend FastAPI (Port 8000)...
start "SPK-AG Backend (FastAPI)" cmd /k "cd backend && call .\.venv\Scripts\activate.bat && python run.py"

echo [2/2] Menjalankan Frontend Next.js (Port 3000)...
start "SPK-AG Frontend (Next.js)" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================================
echo  Kedua server telah dijalankan di jendela terminal masing-masing:
echo  - Frontend Web UI : http://localhost:3000
echo  - Backend API Docs: http://127.0.0.1:8000/docs
echo ===================================================================
echo Tekan sembarang tombol untuk menutup launcher ini...
pause > nul
