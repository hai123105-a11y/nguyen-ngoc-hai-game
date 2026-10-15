@echo off
title NGUYEN NGOC HAI - SHADOW DEFENDER Game Launcher
echo ====================================================
echo  Khoi dong Web Game SHADOW DEFENDER...
echo ====================================================
python run.py
if %ERRORLEVEL% NEQ 0 (
    echo Python khong co san trong PATH, thu goi python3...
    python3 run.py
)
pause
