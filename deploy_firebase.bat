@echo off
chcp 65001 > nul
echo ========================================================
echo   ScoutManager - Firebase Hosting Canlıya Alma Aracı
echo ========================================================
echo.

cd web
echo [1/2] Web uygulaması derleniyor (npm run build)...
call npm run build
if %errorlevel% neq 0 (
    echo [HATA] Derleme basarisiz oldu!
    pause
    exit /b %errorlevel%
)
cd ..

echo.
echo [2/2] Firebase Hosting'e yukleniyor (scoutmanager-c5a03)...
call npx firebase-tools deploy --only hosting --project scoutmanager-c5a03
if %errorlevel% neq 0 (
    echo.
    echo [BILGI] Eger kimlik dogrulama hatasi aldiysaniz, lutfen komut satirinda:
    echo        npx firebase-tools login
    echo komutunu calistirip Google hesabiniza giris yapin ve bu araci tekrar baslatin.
) else (
    echo.
    echo [BASARILI] Uygulamaniz yayinda!
    echo Adres: https://scoutmanager-c5a03.web.app
)

echo.
pause
