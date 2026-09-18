@echo off
rem Removes the per-user zhumo-open:// protocol registration.
reg delete "HKCU\Software\Classes\zhumo-open" /f >nul 2>&1
echo Done. Unregistered zhumo-open:// for user %USERNAME%.
pause
