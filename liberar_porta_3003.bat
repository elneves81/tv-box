@echo off
REM Script para liberar automaticamente a porta 3003 no Windows
set PORT=3003
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT%') do (
    echo Matando processo na porta %PORT% (PID: %%a)
    taskkill /PID %%a /F
)
echo Porta %PORT% liberada.
