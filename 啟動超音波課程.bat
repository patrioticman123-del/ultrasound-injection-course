@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在啟動「超音波導引注射課程」...
echo 請勿關閉此視窗；關閉後網站會停止。
start "" "http://localhost:4191/?v=20260814"
python -m http.server 4191 -d out
pause
