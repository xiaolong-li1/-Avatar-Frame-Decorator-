@echo off
echo 启动WeFrame微信头像智能处理系统(前后端)...
echo.

echo 启动后端服务...
start cmd /k "cd /d %~dp0\backend && call start.bat"

echo 启动前端服务...
start cmd /k "cd /d %~dp0\frontend && call start.bat"

echo.
echo 前后端服务已在新窗口中启动，请查看相应窗口获取详细信息。
echo.
pause 