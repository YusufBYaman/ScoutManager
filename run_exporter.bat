@echo off
chcp 65001 >nul
echo ========================================================
echo   EA Sports FC - Career Mode Save to Excel Exporter
echo ========================================================
echo.

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

if "%~1"=="" (
    echo Varsayilan save dosyasi isleniyor...
    python fc_cm_parser.py
) else (
    echo Belirtilen save dosyasi isleniyor: %~1
    python -c "import fc_cm_parser; fc_cm_parser.export_save_to_excel(r'%~1', r'%SCRIPT_DIR%FC26_Kariyer_Verileri.xlsx', r'%SCRIPT_DIR%fifa_ng_db-meta.xml', r'%SCRIPT_DIR%playernames.csv')"
)

echo.
echo ========================================================
echo   Islem Tamamlandi! Cikis icin bir tusa basin...
echo ========================================================
pause >nul
