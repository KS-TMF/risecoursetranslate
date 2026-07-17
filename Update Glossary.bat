@echo off
setlocal

rem Always run from the folder this .bat file is in, no matter where it's
rem double-clicked from.
cd /d "%~dp0"

echo.
echo   Syncing Translation Glossary.csv into your course...
echo.

rem Try "python" first, fall back to the "py" launcher if that's not on PATH.
where python >nul 2>nul
if %errorlevel%==0 (
    python scripts\update-glossary.py %*
) else (
    py scripts\update-glossary.py %*
)

set STATUS=%errorlevel%
echo.

if %STATUS%==0 (
    echo   Glossary synced.
    echo   You can close this window.
) else (
    echo   Something went wrong.
    echo   Put Translation Glossary.csv in your scormcontent folder or Downloads.
    echo.
)

pause
endlocal
