# restart.ps1 — Para e reinicia o backend e o frontend

$root = $PSScriptRoot

Write-Host ""
Write-Host "Reiniciando NeuroGuia..." -ForegroundColor Magenta

& "$root\stop.ps1"

Write-Host "Aguardando processos encerrarem..." -ForegroundColor DarkGray
Start-Sleep -Seconds 2

& "$root\start.ps1"
