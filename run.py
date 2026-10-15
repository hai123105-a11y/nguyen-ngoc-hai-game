#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
NGUYỄN NGỌC HẢI - SHADOW DEFENDER WEB GAME LOCAL SERVER
=============================================================================
Tự động khởi động local web server và tự động mở trình duyệt web để chơi game.
Không cần cài đặt thư viện bên ngoài (sử dụng thư viện chuẩn của Python 3).

Cách chạy:
    python3 run.py
hoặc:
    python run.py
=============================================================================
"""

import http.server
import socketserver
import webbrowser
import threading
import socket
import time
import sys
import os

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(PROJECT_DIR)

DEFAULT_PORT = 8000
MAX_PORT_ATTEMPTS = 20

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def find_available_port(start_port):
    port = start_port
    for _ in range(MAX_PORT_ATTEMPTS):
        if not is_port_in_use(port):
            return port
        port += 1
    return start_port

def open_browser(url, delay=0.5):
    time.sleep(delay)
    print(f"\n[+] Đang tự động mở trình duyệt tới: {url} ...")
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"[-] Không thể tự động mở trình duyệt ({e}), vui lòng mở thủ công: {url}")

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        status_code = args[1] if len(args) > 1 else ""
        sys.stdout.write(f"\r  [⚡ Game Request] {args[0]} - Status: {status_code}\n")
        sys.stdout.flush()

def main():
    port = find_available_port(DEFAULT_PORT)
    url = f"http://localhost:{port}"

    banner = f"""
======================================================================
  🚀 NGUYỄN NGỌC HẢI - SHADOW DEFENDER GAME SERVER
======================================================================
  🎮 Tựa game: SHADOW DEFENDER (Web Game Arcade Sinh Tồn)
  👨‍💻 Tác giả: NGUYỄN NGỌC HẢI
  🌐 Địa chỉ Web: \033[92m{url}\033[0m
  📁 Thư mục game: {PROJECT_DIR}
----------------------------------------------------------------------
  ✓ Python 3 HTTP Server đã sẵn sàng!
  ✓ Trình duyệt sẽ tự động bật lên trong giây lát...
  ⌨️  Nhấn \033[91mCtrl + C\033[0m để tắt server. Chúc bạn chơi game vui vẻ!
======================================================================
"""
    print(banner)

    threading.Thread(target=open_browser, args=(url,), daemon=True).start()

    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("", port), QuietHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n[🛑] Đã dừng server game. Hẹn gặp lại!\n")
        sys.exit(0)
    except Exception as err:
        print(f"\n[-] Đã xảy ra lỗi: {err}")
        sys.exit(1)

if __name__ == "__main__":
    main()
