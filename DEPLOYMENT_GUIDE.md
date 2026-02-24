# 🚀 YouTube Creator Dashboard — Hướng dẫn đưa lên GitHub

Ứng dụng này được xây dựng bằng HTML/JS thuần (Vanilla JS), nên việc đưa lên mạng để sử dụng trên điện thoại hoặc máy tính khác là **RẤT DỄ DÀNG** và **MIỄN PHÍ**.

## Cách 1: Sử dụng GitHub Pages (Khuyên dùng)

Đây là cách tốt nhất để biến project của bạn thành một trang web thật (ví dụ: `yourname.github.io/yt-creator-dashboard`).

### Bước 1: Chuẩn bị Code & Tải lên GitHub (Cách dễ nhất)

Vì máy bạn chưa cài phần mềm Git, hãy dùng cách kéo-thả trực tiếp trên trình duyệt:

1. **Tạo Repository mới**: Truy cập [github.com/new](https://github.com/new).
2. **Đặt tên**: Nhập tên `yt-creator-dashboard`, chọn **Public**, rồi nhấn **Create repository**.
3. **Tải file lên**: Ở trang mới hiện ra, tìm dòng chữ nhỏ: *"uploading an existing file"* (nằm ngay dưới tiêu đề Quick setup). Nhấn vào đó.
4. **Kéo và thả**: Mở thư mục `yt-creator-dashboard` trên máy tính của bạn:
   - Chọn toàn bộ các file (`index.html`, `styles.css`, `app.js`, `README.md`, `.gitignore`, `DEPLOYMENT_GUIDE.md`).
   - Chọn luôn cả thư mục `modules`.
   - Kéo tất cả vào ô trống trên trang web GitHub.
5. **Xác nhận**: Đợi thanh tiến trình chạy xong, kéo xuống dưới cùng nhấn nút xanh **Commit changes**.

### Bước 2: Kích hoạt GitHub Pages
1. Vào mục **Settings** của Repository trên GitHub.
2. Chọn mục **Pages** ở thanh bên trái.
3. Ở phần **Branch**, chọn `main` (hoặc `master`) và folder `/ (root)`.
4. Nhấn **Save**.
5. Đợi khoảng 1-2 phút, GitHub sẽ cung cấp cho bạn một đường Link công khai.

## Cách 2: Chạy trong mạng nội bộ (Dùng cho điện thoại cùng WiFi)

Nếu bạn chỉ muốn mở trên điện thoại khi đang ở nhà:
1. Trên máy tính, mở Terminal và chạy lệnh: `npx serve .`
2. Terminal sẽ hiện ra địa chỉ IP nội bộ (ví dụ: `http://192.168.1.15:3000`).
3. Dùng điện thoại kết nối cùng WiFi và truy cập vào địa chỉ đó.

---

## ⚠️ Lưu ý QUAN TRỌNG về bảo mật

1. **API Keys**: Ứng dụng này lưu API Key trong trình duyệt (localStorage) của người dùng, nên bạn **không nên** viết cứng API Key vào code trước khi đẩy lên GitHub. 
2. **Settings**: Khi mở trang web trên thiết bị mới, bạn cần vào mục **Cài đặt** trong ứng dụng để nhập lại Gemini API Key.
3. **Dữ liệu**: Vì dùng `localStorage`, dữ liệu Project giữa máy tính và điện thoại sẽ **không tự đồng bộ**. Bạn có thể dùng chức năng **Export Project** (Xuất file .json) từ máy tính và **Import** vào điện thoại để chuyển dữ liệu.

## Các file cần thiết cho GitHub
- `index.html`: File chính.
- `styles.css`: Giao diện.
- `app.js`: Logic điều khiển.
- `modules/`: Thư mục chứa các chức năng AI.
- `.gitignore`: Để chặn các file rác không cần thiết.
