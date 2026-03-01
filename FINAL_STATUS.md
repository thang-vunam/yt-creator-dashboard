# Dự án: YouTube Creator Dashboard - Báo Cáo Trạng Thái

Cập nhật lần cuối: 26/02/2026

## 1. Thông tin API Key
*   **Gemini API Key:** `AIzaSyCv-pU6_C-hzG_QQUd8mYHjesAFun53T-s`
    - ⚠️ **TRẠNG THÁI: BỊ KHÓA** — Google đã đánh dấu key này là "leaked" (bị lộ) do hardcode trong source code.
    - ❌ Cần tạo API Key MỚI tại https://aistudio.google.com/apikey
*   **YouTube API Key:** `AIzaSyC2OT4SR8wYs6p02xxjcb1SkDTKIB663yc` (Dán tại `modules/analysis-engine.js`)

## 2. Cấu trúc thư mục
Dự án nằm tại: `C:\Users\thangvu\.gemini\antigravity\scratch\yt-creator-dashboard`

*   `index.html`: File chính của ứng dụng.
*   `app.js`: Logic điều khiển trung tâm.
*   `styles.css`: Giao diện ứng dụng.
*   `modules/`: Chứa các module chức năng.
    *   `analysis-engine.js` (đổi tên từ keyword-research.js)
    *   `gemini-api.js` — ĐÃ CẬP NHẬT Model ID lên gemini-2.5

## 3. Nhật ký lỗi (Issue Log)

### ✅ ĐÃ FIX: Lỗi "Model not found" (404)
*   **Nguyên nhân:** Dùng model `gemini-1.5-flash` / `gemini-1.5-pro` đã bị Google deprecated.
*   **Giải pháp:** Đổi sang `gemini-2.5-flash` / `gemini-2.5-pro` (02/2026).
*   **File đã sửa:** `modules/gemini-api.js`

### ❌ CẦN XỬ LÝ: API Key bị khóa (403)
*   **Lỗi:** `"Your API key was reported as leaked. Please use another API key."`
*   **Nguyên nhân:** Key bị hardcode trong source code → Google tự động khóa.
*   **Giải pháp:** Tạo key mới tại https://aistudio.google.com/apikey

