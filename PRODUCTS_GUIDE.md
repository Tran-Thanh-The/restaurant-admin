# 📦 Hướng dẫn sử dụng Quản lý Sản phẩm

## 🎯 Tính năng

### ✅ Đã hoàn thành

1. **Xem danh sách sản phẩm** - Tất cả user role
2. **Thêm sản phẩm mới** - Chỉ Admin & Manager
3. **Chỉnh sửa sản phẩm** - Chỉ Admin & Manager
4. **Xóa sản phẩm** - Chỉ Admin & Manager

### 🔐 Phân quyền

| Role    | Xem | Thêm | Sửa | Xóa |
|---------|-----|------|-----|-----|
| Admin   | ✅  | ✅   | ✅  | ✅  |
| Manager | ✅  | ✅   | ✅  | ✅  |
| Staff   | ✅  | ❌   | ❌  | ❌  |

---

## 🚀 Cách sử dụng

### 1. Truy cập trang Quản lý sản phẩm

Từ Dashboard, click vào **"Quản lý sản phẩm"** hoặc truy cập:
```
http://localhost:3000/products
```

### 2. Thêm sản phẩm mới (Admin/Manager)

1. Click nút **"Thêm sản phẩm"** (góc trên bên phải)
2. Điền thông tin:
   - **Tên sản phẩm**: Tên món ăn
   - **Giá**: Giá bán (VNĐ)
   - **URL hình ảnh**: Link ảnh sản phẩm
3. Xem trước hình ảnh
4. Click **"Thêm mới"**

**Ví dụ:**
```
Tên: Phở Bò Đặc Biệt
Giá: 65000
URL: https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43
```

### 3. Chỉnh sửa sản phẩm (Admin/Manager)

1. Tìm sản phẩm cần sửa trong danh sách
2. Click nút **"Sửa"** (màu vàng)
3. Cập nhật thông tin
4. Click **"Cập nhật"**

### 4. Xóa sản phẩm (Admin/Manager)

1. Tìm sản phẩm cần xóa
2. Click nút **"Xóa"** (màu đỏ)
3. Xác nhận xóa

### 5. Xem sản phẩm (Tất cả roles)

- Staff chỉ có thể xem danh sách
- Không thấy nút "Thêm", "Sửa", "Xóa"

---

## 🎨 Giao diện

### Danh sách sản phẩm
- Grid layout responsive (1-4 cột tùy màn hình)
- Hiển thị: Hình ảnh, Tên, Giá
- Nút hành động (nếu có quyền)

### Modal Thêm/Sửa
- Form validation
- Preview hình ảnh real-time
- Responsive design

### Toast Notifications
- ✅ Thành công: Màu xanh
- ❌ Lỗi: Màu đỏ
- Auto dismiss sau 3-4 giây

---

## 🧪 Test với các role

### Test với Admin
```bash
# Login as admin
Username: admin
Password: admin123

# Có thể: Xem, Thêm, Sửa, Xóa
```

### Test với Manager
```bash
# Login as manager
Username: manager
Password: manager123

# Có thể: Xem, Thêm, Sửa, Xóa
```

### Test với Staff
```bash
# Login as staff
Username: staff
Password: staff123

# Chỉ có thể: Xem
# Không thấy nút "Thêm sản phẩm"
# Không thấy nút "Sửa" và "Xóa" trên từng sản phẩm
```

---

## 📝 Một số URL hình ảnh mẫu

### Món Việt
```
Phở Bò:
https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43

Bánh Mì:
https://images.unsplash.com/photo-1591047139829-d91aecb6caea

Bún Chả:
https://images.unsplash.com/photo-1559314809-0d155014e29e

Cơm Tấm:
https://images.unsplash.com/photo-1626074353765-517a65ead1c2

Gỏi Cuốn:
https://images.unsplash.com/photo-1563245372-f21724e3856d
```

### Đồ uống
```
Cà Phê:
https://images.unsplash.com/photo-1509042239860-f550ce710b93

Trà Sữa:
https://images.unsplash.com/photo-1525385133512-2f3bdd039054

Sinh Tố:
https://images.unsplash.com/photo-1505252585461-04db1eb84625
```

---

## 🔧 API Endpoints được sử dụng

```typescript
// Get all products
GET /api/products

// Create product
POST /api/products
Body: { name, price, imageUrl }

// Update product
PUT /api/products/[id]
Body: { name?, price?, imageUrl? }

// Delete product
DELETE /api/products/[id]
```

---

## 💡 Tips

1. **Upload ảnh**: Hiện tại dùng URL. Có thể tích hợp Cloudinary/Uploadcare sau
2. **Giá**: Nhập số nguyên (VNĐ), tự động format khi hiển thị
3. **Hình ảnh lỗi**: Tự động fallback về placeholder
4. **Permission**: Check ngay trên UI, không cần call API

---

## 🐛 Troubleshooting

### Không thấy nút "Thêm sản phẩm"
- Kiểm tra role của user (chỉ Admin/Manager mới thấy)
- Logout và login lại

### Hình ảnh không hiển thị
- Kiểm tra URL hợp lệ
- URL phải bắt đầu với http:// hoặc https://
- Sử dụng URL từ Unsplash, Pexels, hoặc upload lên Imgur

### Lỗi khi thêm/sửa
- Kiểm tra tất cả field đã điền
- Giá phải là số dương
- URL hợp lệ

---

## 🎉 Demo Flow

1. **Login as Admin**
2. **Vào trang Products**
3. **Thêm 3-5 sản phẩm mẫu**
4. **Thử sửa một sản phẩm**
5. **Thử xóa một sản phẩm**
6. **Logout**
7. **Login as Staff**
8. **Vào trang Products** → Chỉ xem được, không có nút action

---

## 📊 Next Steps (Tính năng mở rộng)

- [ ] Tìm kiếm sản phẩm
- [ ] Lọc theo giá
- [ ] Phân trang (pagination)
- [ ] Sắp xếp (sort)
- [ ] Upload ảnh trực tiếp
- [ ] Nhiều ảnh cho 1 sản phẩm
- [ ] Category/Danh mục
- [ ] Mô tả chi tiết sản phẩm
- [ ] Trạng thái (available/out of stock)
