# Alternative: Sử dụng MongoDB Atlas với URI chính xác

## 🎯 Vấn đề hiện tại

MongoDB URI thiếu phần random ID của cluster. Format đúng phải có dạng:
```
mongodb+srv://username:password@cluster0.XXXXX.mongodb.net/
```

Trong đó `XXXXX` là random ID duy nhất của cluster bạn (ví dụ: `abc123`, `wxyz12`, etc.)

## 🔍 Cách tìm MongoDB URI đúng

### Option 1: Từ MongoDB Atlas Dashboard

1. Truy cập https://cloud.mongodb.com/
2. Login với tài khoản của bạn
3. Chọn cluster (Cluster0)
4. Click nút **"Connect"**
5. Chọn **"Drivers"** (hoặc "Connect your application")
6. Copy connection string đầy đủ
7. Thay `<password>` bằng password thật (nhớ encode ký tự đặc biệt)
8. Thay `<database>` bằng `restaurant_db`

### Option 2: Tạo cluster mới (Free)

Nếu chưa có cluster hoặc muốn tạo mới:

1. Truy cập https://www.mongodb.com/cloud/atlas/register
2. Tạo tài khoản miễn phí
3. Tạo cluster free (M0)
4. Tạo Database User với username/password
5. Whitelist IP (chọn "Allow access from anywhere" cho dev: 0.0.0.0/0)
6. Lấy connection string như Option 1

### Option 3: Sử dụng MongoDB Local

Nếu muốn develop với MongoDB chạy local:

**Windows:**
```bash
# Download MongoDB Community từ: https://www.mongodb.com/try/download/community
# Sau khi cài đặt, chạy:
mongod --dbpath C:\data\db
```

**Cập nhật .env:**
```env
MONGODB_URI="mongodb://localhost:27017"
MONGODB_DB="restaurant_db"
```

## 🚀 Test Connection

Sau khi có URI đúng, test bằng MongoDB Compass:

1. Download MongoDB Compass: https://www.mongodb.com/try/download/compass
2. Paste connection string vào
3. Click "Connect"
4. Nếu connect thành công → URI đúng!

## 💡 URI Example

Một số ví dụ URI hợp lệ:

```bash
# MongoDB Atlas (các format khác nhau tùy region)
mongodb+srv://username:password@cluster0.abc12.mongodb.net/mydb?retryWrites=true&w=majority
mongodb+srv://username:password@cluster0.mongodb.net/mydb?retryWrites=true&w=majority

# MongoDB Local
mongodb://localhost:27017
mongodb://127.0.0.1:27017

# MongoDB với authentication local
mongodb://username:password@localhost:27017/mydb?authSource=admin
```

## ⚙️ Sau khi sửa .env

```bash
# 1. Restart server
# Dừng server hiện tại (Ctrl+C)
npm run dev

# 2. Seed database
curl -X POST http://localhost:3000/api/seed

# 3. Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Nếu bạn cần hỗ trợ thêm, hãy share:
1. Error message cụ thể
2. Region của MongoDB Atlas cluster (nếu dùng Atlas)
3. Hoặc thử với MongoDB local trước
