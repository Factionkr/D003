# PowerShell 원클릭 실행 스크립트
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Host "====================================================================" -ForegroundColor Magenta
Write-Host " ✨ StyleAI - D003 통합 AI 코디 & 가상 피팅 앱을 시작합니다..." -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Magenta
Write-Host "🚀 로컬 서버 주소: http://localhost:3000" -ForegroundColor Green
Write-Host "🌐 브라우저를 열고 있습니다..." -ForegroundColor Yellow

Start-Process "http://localhost:3000"
& "node" "$PSScriptRoot\server.js"

