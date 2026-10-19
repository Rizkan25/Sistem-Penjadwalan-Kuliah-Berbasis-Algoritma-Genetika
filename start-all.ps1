Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  Memulai Sistem Penjadwalan Kuliah Berbasis Algoritma Genetika (SPK-AG)" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] Menjalankan Backend FastAPI (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\.venv\Scripts\Activate.ps1; python run.py"

Write-Host "[2/2] Menjalankan Frontend Next.js (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Green
Write-Host "  Kedua server telah dijalankan di jendela terminal terpisah:" -ForegroundColor Green
Write-Host "  - Frontend Web UI : http://localhost:3000" -ForegroundColor White
Write-Host "  - Backend API Docs: http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "===================================================================" -ForegroundColor Green
