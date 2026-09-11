# 🚀 HƯỚNG DẪN ĐƯA ỨNG DỤNG CÂN LÚA LÊN MẠNG (CHẠY 24/7 MIỄN PHÍ)

Hướng dẫn này giúp bạn đưa trang web Cân Lúa lên mạng internet để **bất kỳ ai cũng có thể vào bằng điện thoại qua đường link riêng 24/7** mà:
- ❌ **Không cần mua tên miền** (Được cấp link miễn phí dạng `https://canlua.vercel.app`).
- ❌ **Không cần mở máy tính chạy server** (Máy tính tắt, web vẫn hoạt động bình thường).
- ❌ **Hoàn toàn MIỄN PHÍ 100%**.

---

## 🏗️ 3 BƯỚC TRIỂN KHAI CỰC KỲ ĐƠN GIẢN:

```mermaid
graph LR
    A[1. MongoDB Atlas<br/>Lưu trữ dữ liệu đám mây miễn phí] --> B[2. Render.com<br/>Chạy Server API 24/7]
    B --> C[3. Vercel.com<br/>Chạy Giao diện Web có Link điện thoại]
```

---

### BƯỚC 1: Tạo Cơ Sở Dữ Liệu Đám Mây Miễn Phí (MongoDB Atlas)
*(Thời gian: 3 phút)*

1. Truy cập: [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register) và bấm **Sign up with Google** (đăng nhập bằng Gmail).
2. Khi được hỏi chọn gói, chọn **M0 FREE** (Gói miễn phí vĩnh viễn 512MB).
3. Tạo tài khoản đăng nhập Database:
   - **Username**: `admin`
   - **Password**: Chọn mật khẩu dễ nhớ (ví dụ: `Canlua2026@`) -> Nhớ lưu lại mật khẩu này!
4. Ở mục **Network Access (Bảo mật mạng)**:
   - Chọn **Allow Access from Anywhere** (`0.0.0.0/0`) để Render có thể kết nối.
5. Bấm nút **Connect** -> Chọn **Drivers** -> Copy chuỗi kết nối (Connection String):
   ```text
   mongodb+srv://admin:Canlua2026@cluster0.xxxxx.mongodb.net/canlua?retryWrites=true&w=majority
   ```
   *(Thay `Canlua2026@` bằng mật khẩu bạn đã đặt ở bước 3).*

---

### BƯỚC 2: Đưa Máy Chủ Server Lên Đám Mây 24/7 (Render.com)
*(Thời gian: 3 phút)*

1. Truy cập: [https://render.com/](https://render.com/) -> Bấm **Get Started for Free** (đăng nhập bằng tài khoản GitHub hoặc Google).
2. Bấm nút **New +** ở góc trên -> Chọn **Web Service**.
3. Kết nối với kho lưu trữ mã nguồn (GitHub repository) của dự án này, hoặc upload thư mục `server`.
4. Điền các thông tin:
   - **Name**: `canlua-api` (hoặc tên tùy thích)
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Chọn **Free**
5. Ở mục **Environment Variables (Biến môi trường)**, bấm **Add Environment Variable** thêm 2 dòng:
   - `MONGODB_URI` = *(Dán chuỗi kết nối MongoDB Atlas đã lấy ở Bước 1)*
   - `JWT_SECRET` = `canlua_super_secret_jwt_key_2026_modern_rice_weighing`
6. Bấm **Create Web Service**.
   - Đợi khoảng 1-2 phút, Render sẽ cấp cho bạn một đường link server, ví dụ:
   ```text
   https://canlua-api.onrender.com
   ```
   *(Lưu lại đường link này để dùng cho Bước 3).*

---

### BƯỚC 3: Đưa Giao Diện Lên Mạng Để Lấy Link Điện Thoại (Vercel.com)
*(Thời gian: 2 phút)*

1. Truy cập: [https://vercel.com/](https://vercel.com/) -> Bấm **Sign Up** (đăng nhập bằng GitHub hoặc Google).
2. Bấm **Add New...** -> Chọn **Project**.
3. Import dự án của bạn:
   - **Root Directory**: Chọn thư mục `client` (Bấm Edit chọn `client`).
   - **Framework Preset**: Chọn **Vite**.
4. Ở mục **Environment Variables**:
   - Thêm biến:
     - **Key**: `VITE_API_URL`
     - **Value**: `https://canlua-api.onrender.com/api` *(Thay bằng link Render của bạn ở Bước 2 + `/api`)*
5. Bấm nút **Deploy**!
   - Sau 30 giây, Vercel sẽ cấp cho bạn một đường link web chính thức miễn phí, ví dụ:
   ```text
   https://canlua.vercel.app
   ```

🎉 **XONG!** Bây giờ bạn có thể gửi link `https://canlua.vercel.app` cho bất kỳ ai. Họ chỉ cần mở điện thoại lên là đăng nhập, đăng ký và sử dụng cân lúa 24/7 bình thường!
