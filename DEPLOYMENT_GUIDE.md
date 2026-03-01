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
5. **QUAN TRỌNG: Phải chờ 1-3 phút**. Link sẽ không hiện ra ngay lập tức.
   - Bạn có thể vào tab **Actions** ở thanh menu trên cùng Repo để thấy một tiến trình đang chạy (tên là *pages-build-deployment*).
   - Khi tiến trình này hiện nút xanh ✅, quay lại tab **Settings > Pages**, bạn sẽ thấy thông báo: *"Your site is live at [link của bạn]"*.
6. Copy link đó và mở trên điện thoại!

## Cách 2: Chạy trong mạng nội bộ (Dùng cho điện thoại cùng WiFi)

Nếu bạn chỉ muốn mở trên điện thoại khi đang ở nhà:
1. Trên máy tính, mở Terminal và chạy lệnh: `npx serve .`
2. Terminal sẽ hiện ra địa chỉ IP nội bộ (ví dụ: `http://192.168.1.15:3000`).
3. Dùng điện thoại kết nối cùng WiFi và truy cập vào địa chỉ đó.

---

## ⚠️ Lưu ý QUAN TRỌNG về bảo mật và API Key

### 1. Vấn đề bảo mật (CỰC KỲ QUAN TRỌNG)
Nếu bạn đưa ứng dụng lên một Repository **Public** (Công khai):
- **KHÔNG NÊN** viết cứng (hardcode) API Key vào code.
- GitHub có hệ thống tự động quét và sẽ **vô hiệu hóa** key của bạn ngay lập tức nếu phát hiện nó nằm công khai.
- Ngoài ra, người khác có thể lấy key của bạn để sử dụng, làm bạn bị tốn phí hoặc bị khóa tài khoản.

### 2. Cách add API cứng (Nếu bạn dùng Repo PRIVATE)
Nếu bạn tạo Repository ở chế độ **Private** (Riêng tư), bạn có thể làm theo cách sau để không phải nhập lại key trên iPad:

**Mở file `modules/gemini-api.js`:**
Tìm dòng số 12: `DEFAULT_KEY: '...'`, thay đoạn trong ngoặc bằng Gemini API Key của bạn.

**Mở file `modules/analysis-engine.js`:**
Tìm dòng số 9: `DEFAULT_KEY: '...'`, thay đoạn trong ngoặc bằng YouTube API Key của bạn.

**Sau đó:** Đẩy code (upload) lại lên GitHub. Ứng dụng sẽ tự dùng các key này khi bạn mở trên thiết bị mới.

### 3. Dữ liệu Project
Vì dùng `localStorage`, dữ liệu giữa máy tính và iPad sẽ không tự đồng bộ. Hãy dùng tính năng **Export/Import Project** để chuyển dữ liệu qua lại.

## Các file cần thiết cho GitHub
- `index.html`: File chính.
- `styles.css`: Giao diện.
- `app.js`: Logic điều khiển.
- `modules/`: Thư mục chứa các chức năng AI.
- `.gitignore`: Để chặn các file rác không cần thiết.
