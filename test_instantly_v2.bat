@echo off
echo ====================================
echo   Instantly API V2 - Test Suite
echo ====================================
echo.
echo IMPORTANTE: Asegurate de tener tu API Key V2 configurada
echo Genera una nueva en: https://app.instantly.ai/app/settings/integrations
echo.
echo Selecciona el test a ejecutar:
echo.
echo 1. Test basico (instantly_test.js)
echo 2. Test detallado (test_instantly.js)
echo 3. Ver ejemplos (instantly_examples_v2.js)
echo 4. Ver documentacion de migracion
echo 5. Salir
echo.
set /p choice="Opcion (1-5): "

if "%choice%"=="1" (
    echo.
    echo Ejecutando test basico...
    node instantly_test.js
    pause
)

if "%choice%"=="2" (
    echo.
    echo Ejecutando test detallado...
    node test_instantly.js
    pause
)

if "%choice%"=="3" (
    echo.
    echo NOTA: Este archivo contiene ejemplos de codigo.
    echo Edita instant examples_v2.js y descomenta la linea 'examples()' para ejecutar.
    echo.
    type instantly_examples_v2.js
    pause
)

if "%choice%"=="4" (
    echo.
    type INSTANTLY_API_V2_MIGRATION.md
    pause
)

if "%choice%"=="5" (
    exit
)

echo.
echo Opcion invalida
pause
