@echo off
rem Registers the zhumo-open:// protocol for the CURRENT USER (HKCU, no admin needed).
rem Run this once on each machine where you want click-to-open to work.
rem Undo with: unregister-protocol.cmd
rem Keep this file ASCII: batch parsers mangle non-ASCII depending on codepage.

set "SCRIPT_DIR=%~dp0"

reg add "HKCU\Software\Classes\zhumo-open" /ve /d "URL:Zhumo Local File Opener" /f >nul
reg add "HKCU\Software\Classes\zhumo-open" /v "URL Protocol" /d "" /f >nul
reg add "HKCU\Software\Classes\zhumo-open\shell\open\command" /ve /d "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \"%SCRIPT_DIR%zhumo-open.ps1\" \"%%1\"" /f >nul

echo Done. Registered zhumo-open:// for user %USERNAME%.
echo Handler: %SCRIPT_DIR%zhumo-open.ps1
pause
