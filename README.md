# 🚀 SHADOW DEFENDER - WEB GAME ARCADE

> **Tác giả:** NGUYỄN NGỌC HẢI  
> **Kho lưu trữ GitHub:** [https://github.com/hai123105-a11y/nguyen-ngoc-hai-game](https://github.com/hai123105-a11y/nguyen-ngoc-hai-game)  
> **Chơi trực tiếp (GitHub Pages):** [https://hai123105-a11y.github.io/nguyen-ngoc-hai-game/](https://hai123105-a11y.github.io/nguyen-ngoc-hai-game/)

---

## 🎮 Giới Thiệu Trò Chơi

**SHADOW DEFENDER** là tựa game arcade sinh tồn không gian phong cách vector tối giản đen & trắng (Monochrome Black & White) do **Nguyễn Ngọc Hải** phát triển. Trò chơi kết hợp giữa phong cách retro cổ điển và các cơ chế gameplay hiện đại: bắn đạn chùm, khiên năng lượng, bom EMP quét màn hình và làm chậm thời gian.

---

## 🕹️ Hướng Dẫn Điều Khiển

### Trên Máy Tính (PC / Laptop)
* **Di chuyển:** `W`, `A`, `S`, `D` hoặc các phím mũi tên `↑`, `←`, `↓`, `→`
* **Bắn đạn laser:** Nhấn `Space` hoặc nhấp `Chuột Trái`
* **Kích nổ Bom EMP:** Nhấn phím `B` hoặc `Enter`
* **Tạm dừng game:** Nhấn `P` hoặc `Esc`

### Trên Điện Thoại Di Động (Smartphone / Tablet)
* **Di chuyển:** Chạm và kéo ngón tay trực tiếp trên màn hình, chiến hạm sẽ lướt mượt mà theo ngón tay.
* **Tự động khai hỏa:** Tàu tự bắn liên thanh khi ngón tay đang chạm điều khiển.
* **Nút bấm cảm ứng:** Nút **BẮN** và **EMP BOMB** tích hợp ngay dưới màn hình game.

---

## ⚡ Các Vật Phẩm Rơi Ra Khi Bắn Quái

* ⚡ **Triple Shot:** Nâng cấp đạn chùm 3 tia cực mạnh.
* 🛡️ **Energy Shield:** Khiên năng lượng bảo vệ chống va chạm 1 lần.
* 💣 **EMP Bomb:** Quét sạch toàn bộ kẻ địch và đạn trên màn hình.
* ⏳ **Time Slow:** Làm chậm tốc độ bay của mọi kẻ địch trong 5 giây.

---

## 💻 Công Nghệ & Kỹ Thuật Sử Dụng

1. **HTML5 Canvas 2D Engine:** Xử lý kết xuất đồ họa vector mượt mà ở tần số quét 60 FPS bằng `requestAnimationFrame`.
2. **Vanilla JavaScript (ES6+):** Kiến trúc hướng đối tượng (OOP) quản lý các thực thể Player, Bullets, Enemies, Particles, PowerUps và hệ thống phát hiện va chạm hitbox chính xác.
3. **Web Audio API Synthesizer:** Tự động tổng hợp âm thanh 8-bit (laser, nổ, powerup, gameover) trực tiếp từ mã nguồn, không cần tải bất kỳ file MP3/WAV bên ngoài nào.
4. **CSS3 Monochrome Design:** Giao diện tối giản đen trắng với 2 chế độ Dark / Light Mode mượt mà.
5. **Python 3 Local Server Launcher:** Script `run.py` tự động kích hoạt web server và mở trình duyệt chỉ với 1 click.

---

## 🚀 Cách Chạy Game 1-Click Bằng Python

Tại thư mục dự án `nguyen-ngoc-hai-game`, mở terminal và chạy:
```bash
python3 run.py
# hoặc trên Windows:
python run.py
```
> Trình duyệt web sẽ tự động mở tại địa chỉ `http://localhost:8000` và sẵn sàng chiến đấu ngay!

*Người dùng Windows cũng có thể nhấp đúp file `run.bat`, người dùng Mac/Linux chạy `./run.sh`.*
