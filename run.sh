#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

if command -v python3 &>/dev/null; then
    python3 run.py
elif command -v python &>/dev/null; then
    python run.py
else
    echo "Lỗi: Không tìm thấy Python 3 trên hệ thống!"
    exit 1
fi
