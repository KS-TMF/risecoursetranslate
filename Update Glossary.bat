@echo off
cd /d "%~dp0"
echo.
echo   Syncing Translation Glossary.csv into your course...
echo.

where python >nul 2>nul
if %errorlevel%==0 (
    python scripts\update-glossary.py %*
) else (
    where py >nul 2>nul
    if %errorlevel%==0 (
        py scripts\update-glossary.py %*
    ) else (
        echo   ERROR: Python was not found on this computer.
        echo   Install it from https://www.python.org/downloads/
        echo   ^(tick "Add python.exe to PATH" during install^), then try again.
        echo.
        pause
        exit /b 1
    )
)

if %errorlevel%==0 (
    echo.
    echo   Translation Glossary.csv synced.
    echo   You can close this window.
) else (
    echo.
    echo   Put Translation Glossary.csv in your Downloads folder, then try again.
)
echo.
pause
