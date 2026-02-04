@echo off
echo ====================================
echo   Ver Leads - Menu
echo ====================================
echo.
echo Selecciona que quieres ver:
echo.
echo 1. Solo leads con correos enviados
echo 2. TODOS los leads
echo 3. Exportar leads enviados a CSV
echo 4. Salir
echo.
set /p choice="Opcion (1-4): "

if "%choice%"=="1" (
    echo.
    echo Consultando leads con correos enviados...
    node ver_leads_enviados.js
    pause
)

if "%choice%"=="2" (
    echo.
    echo Consultando TODOS los leads...
    node ver_todos_leads.js
    pause
)

if "%choice%"=="3" (
    echo.
    echo Exportando a CSV...
    node exportar_leads_csv.js
    pause
)

if "%choice%"=="4" (
    exit
)

echo.
echo Opcion invalida
pause
