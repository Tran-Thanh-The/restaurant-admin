# ⚠️ Lỗi MongoDB Connection

## 🔍 Lỗi hiện tại:
```
querySrv ENOTFOUND _mongodb._tcp.cluster0.mongodb.net
```

## 🛠️ Nguyên nhân:
MongoDB URI trong file `.env` không chính xác. URI hiện tại:
```
mongodb+srv://xientoide:password%402025@cluster0.mongodb.net/...
```

## ✅ Cách sửa:

### Bước 1: Lấy MongoDB URI chính xác từ MongoDB Atlas

1. Đăng nhập vào [MongoDB Atlas](https://cloud.mongodb.com/)
2. Chọn cluster của bạn
3. Click nút **"Connect"**
4. Chọn **"Connect your application"**
5. Copy connection string

### Bước 2: Format đúng

MongoDB Atlas connection string thường có dạng:
```
mongodb+srv://<username>:<password>@<cluster-name>.<random-id>.mongodb.net/<database>?retryWrites=true&w=majority
```

**Ví dụ:**
```
mongodb+srv://xientoide:password@2025@cluster0.abc123.mongodb.net/restaurant_db?retryWrites=true&w=majority
```

**Lưu ý quan trọng:**
- Nếu password có ký tự đặc biệt, cần encode:
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`
  - `%` → `%25`
  - `/` → `%2F`
  - `:` → `%3A`
  - `?` → `%3F`

Với password `password@2025`, cần viết thành `password%402025`

### Bước 3: Cập nhật file .env

Mở file `.env` và cập nhật:

```env
MONGODB_URI="mongodb+srv://xientoide:password%402025@cluster0.XXXXX.mongodb.net/restaurant_db?retryWrites=true&w=majority&appName=Cluster0"
MONGODB_DB="restaurant_db"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

**Thay `XXXXX` bằng random ID của cluster bạn** (ví dụ: `abc123`, `xyz789`, ...)

### Bước 4: Restart server

```bash
# Dừng server (Ctrl+C trong terminal đang chạy npm run dev)
# Sau đó chạy lại:
npm run dev
```

### Bước 5: Test lại

```bash
curl -X POST http://localhost:3000/api/seed
```

## 🔄 Hoặc dùng MongoDB Local (nếu muốn test local)

Nếu bạn muốn test với MongoDB chạy local thay vì Atlas:

1. Cài MongoDB Community Edition
2. Cập nhật `.env`:
```env
MONGODB_URI="mongodb://localhost:27017"
MONGODB_DB="restaurant_db"
```

3. Restart server và seed lại

## 📞 Cần trợ giúp?

Nếu vẫn gặp lỗi:
1. Kiểm tra Network Access trong MongoDB Atlas (có thể cần whitelist IP)
2. Kiểm tra Database User đã được tạo chưa
3. Kiểm tra password có đúng không (case-sensitive)
4. Thử test connection bằng MongoDB Compass với cùng connection string
