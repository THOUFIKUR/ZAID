# ZAID — Start Everything
# Starts backend (FastAPI) + frontend (Vite) in two windows
# Usage: Right-click → Run with PowerShell  OR  .\start-zaid.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "  ███████╗ █████╗ ██╗██████╗ " -ForegroundColor Red
Write-Host "     ███╔╝██╔══██╗██║██╔══██╗" -ForegroundColor DarkRed
Write-Host "    ███╔╝ ███████║██║██║  ██║" -ForegroundColor Red
Write-Host "   ███╔╝  ██╔══██║██║██║  ██║" -ForegroundColor DarkRed
Write-Host "  ███████╗██║  ██║██║██████╔╝" -ForegroundColor Red
Write-Host "  ╚══════╝╚═╝  ╚═╝╚═╝╚═════╝ " -ForegroundColor DarkRed
Write-Host ""
Write-Host "  PERSONAL AI SYSTEM" -ForegroundColor DarkGray
Write-Host ""

# ── Backend ───────────────────────────────────────────────────────────────────
$backendPath = Join-Path $root "backend"
$uvicorn     = Join-Path $backendPath ".venv\Scripts\uvicorn.exe"

if (-not (Test-Path $uvicorn)) {
    Write-Host "[ZAID] Installing backend dependencies..." -ForegroundColor Yellow
    Push-Location $backendPath
    python -m venv .venv
    .\.venv\Scripts\pip install -r requirements.txt --quiet
    Pop-Location
}

Write-Host "[ZAID] Starting backend on http://127.0.0.1:8000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$backendPath'; Write-Host 'ZAID Backend' -ForegroundColor Red; .\.venv\Scripts\uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
) -WindowStyle Normal

Start-Sleep -Seconds 2

# ── Frontend ──────────────────────────────────────────────────────────────────
$frontendPath = Join-Path $root "frontend"

Write-Host "[ZAID] Starting frontend on http://127.0.0.1:5173 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$frontendPath'; Write-Host 'ZAID Frontend' -ForegroundColor Red; npm run dev"
) -WindowStyle Normal

Start-Sleep -Seconds 3

# ── Open browser ──────────────────────────────────────────────────────────────
Write-Host "[ZAID] Opening browser at http://127.0.0.1:5173 ..." -ForegroundColor Green
Start-Process "http://127.0.0.1:5173"

Write-Host ""
Write-Host "  Backend:  http://127.0.0.1:8000" -ForegroundColor DarkGray
Write-Host "  Frontend: http://127.0.0.1:5173" -ForegroundColor DarkGray
Write-Host "  API Docs: http://127.0.0.1:8000/api/docs" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  To stop: close the two PowerShell windows." -ForegroundColor DarkGray
Write-Host ""
