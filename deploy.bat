@echo off
echo ========================================
echo   Desplegando Better Insurance a Firebase
echo ========================================
echo.

echo [1/3] Construyendo la aplicacion...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Fallo la construccion de la aplicacion
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Desplegando a Firebase Hosting...
call firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Fallo el despliegue a Firebase
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================
echo   Despliegue completado exitosamente!
echo   URLs disponibles:
echo   - https://bi-renov-2026-v2.web.app
echo   - https://bi-renov-2026-v2.firebaseapp.com
echo ========================================
echo.
echo.
pause
