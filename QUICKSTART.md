# 🚀 Quick Start - Quản lý Sản phẩm

## ⚡ 3 Bước để bắt đầu

### 1️⃣ Khởi động server
```bash
npm run dev
```

### 2️⃣ Seed sản phẩm mẫu (PowerShell)
```powershell
.\seed-products.ps1
```

### 3️⃣ Test thử
```
1. Mở: http://localhost:3000/auth
2. Login: admin / admin123
3. Click: "Quản lý sản phẩm"
4. Thử: Thêm/Sửa/Xóa sản phẩm
```

---

## 🔐 Tài khoản test

| Username | Password    | Quyền                |
|----------|-------------|----------------------|
| admin    | admin123    | ✅ Xem/Thêm/Sửa/Xóa |
| manager  | manager123  | ✅ Xem/Thêm/Sửa/Xóa |
| staff    | staff123    | ✅ Xem (❌ Thêm/Sửa/Xóa) |

---

## 📋 Checklist test nhanh

- [ ] Login với admin
- [ ] Vào trang Products
- [ ] Thấy nút "Thêm sản phẩm"
- [ ] Click thêm sản phẩm mới
- [ ] Upload ảnh và điền form
- [ ] Submit - thấy toast success
- [ ] Sản phẩm hiện trong list
- [ ] Click "Sửa" - modal mở với data
- [ ] Sửa và save - toast success
- [ ] Click "Xóa" - confirm dialog
- [ ] Xác nhận - sản phẩm biến mất
- [ ] Logout và login với staff
- [ ] Kiểm tra: KHÔNG thấy nút action

---

## 🐛 Gặp lỗi?

**Không kết nối được database?**
```bash
# Kiểm tra MongoDB URI trong .env
# Restart server
```

**Không thấy nút Thêm/Sửa/Xóa?**
```bash
# Kiểm tra role của user (staff không có quyền)
# Login lại với admin hoặc manager
```

---

## 📚 Docs chi tiết

- **`PRODUCTS_COMPLETE.md`** - Full documentation
- **`PRODUCTS_GUIDE.md`** - User guide
- **`SUMMARY.md`** - Technical summary

---

Chúc bạn test vui vẻ! 🎉
