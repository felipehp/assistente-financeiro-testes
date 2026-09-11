# start.ps1 — Sobe o backend (FastAPI) e o frontend (Next.js)

$root = $PSScriptRoot

# Verifica se as portas já estão em uso
function Test-Port($port) {
    $result = netstat -ano | Select-String ":$port\s" | Select-String "LISTENING"
    return $null -ne $result
}

if (Test-Port 8000) {
    Write-Host "AVISO: porta 8000 já em uso — backend pode já estar rodando." -ForegroundColor Yellow
}
if (Test-Port 3000) {
    Write-Host "AVISO: porta 3000 já em uso — frontend pode já estar rodando." -ForegroundColor Yellow
}

# Backend — FastAPI via uvicorn
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Set-Location '$root\backend'; python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000" `
    -WindowStyle Normal

Start-Sleep -Seconds 1

# Frontend — Next.js
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "Set-Location '$root'; npm run dev" `
    -WindowStyle Normal

Write-Host ""
Write-Host "NeuroGuia iniciando..." -ForegroundColor Green
Write-Host "  Backend  -> http://localhost:8000" -ForegroundColor Cyan
Write-Host "  Frontend -> http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Use stop.ps1 para encerrar ou restart.ps1 para reiniciar." -ForegroundColor DarkGray
