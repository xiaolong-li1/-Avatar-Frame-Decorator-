@echo off
echo 启动WeFrame微信头像智能处理系统前端...
echo.
cd /d %~dp0
echo 正在安装依赖包...
call npm install
echo.
echo 启动开发服务器...
call npm run dev
pause 