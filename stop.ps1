# stop.ps1 — Encerra o backend (porta 8000) e o frontend (porta 3000)

function Stop-Port {
    param([int]$Port)

    $lines = netstat -ano | Select-String ":$Port\s" | Select-String "LISTENING"
    if (-not $lines) {
        Write-Host "  Porta $Port já estava livre." -ForegroundColor DarkGray
        return
    }

    foreach ($line in $lines) {
        $procId = ($line.ToString().Trim() -split '\s+')[-1]
        if ($procId -match '^\d+$' -and $procId -ne '0') {
            try {
                Stop-Process -Id ([int]$procId) -Force -ErrorAction Stop
                Write-Host "  Processo $procId (porta $Port) encerrado." -ForegroundColor Green
            } catch {
                Write-Host "  Falha ao encerrar PID $pid`: $_" -ForegroundColor Red
            }
        }
    }
}

Write-Host ""
Write-Host "Encerrando NeuroGuia..." -ForegroundColor Yellow
Stop-Port 8000
Stop-Port 3000
Write-Host "Pronto." -ForegroundColor Green
Write-Host ""
