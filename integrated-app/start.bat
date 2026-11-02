@echo off
chcp 65001 > nul
echo ====================================================================
echo  ✨ StyleAI - D003 통합 AI 코디 & 가상 피팅 앱을 시작합니다...
echo ====================================================================
echo.
echo [1] 로컬 웹 서버 실행 중: http://localhost:3000
echo [2] 브라우저를 자동으로 엽니다...
echo.

start http://localhost:3000
node server.js

pause

