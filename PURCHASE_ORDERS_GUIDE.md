# Hướng dẫn sử dụng chức năng Nhập hàng

## Tổng quan

Hệ thống quản lý nhập hàng bao gồm 2 phần chính:
1. **Quản lý nguồn hàng (Suppliers)**: Lưu trữ thông tin các nhà cung cấp
2. **Phiếu nhập hàng (Purchase Orders)**: Tạo và quản lý các phiếu nhập hàng từ nguồn hàng

## Phân quyền

### Quản lý nguồn hàng
- **Admin & Manager**: Có thể xem, tạo, sửa, xóa nguồn hàng
- **Staff**: Không có quyền truy cập

### Phiếu nhập hàng
- **Admin & Manager**: Có thể tạo, sửa, xóa phiếu nhập hàng
- **Staff**: Có thể xem phiếu nhập hàng và kiểm hàng (cập nhật số lượng kiểm)

## 1. Quản lý nguồn hàng

### Truy cập
- Từ Dashboard, nhấn vào **"Nguồn hàng"**
- Hoặc truy cập trực tiếp: `/suppliers`

### Thêm nguồn hàng mới
1. Nhấn nút **"Thêm nguồn hàng"**
2. Điền các thông tin:
   - **Tên nguồn hàng** (*): Tên nhà cung cấp
   - **Thông tin liên hệ** (*): Số điện thoại, email, địa chỉ... (free text)
   - **Giá tham khảo**: Giá chung (không bắt buộc)
   - **URL hình ảnh**: Link ảnh của nguồn hàng
   - **Ghi chú**: Thông tin bổ sung
3. Nhấn **"Thêm mới"**

### Chỉnh sửa nguồn hàng
1. Nhấn nút **"Sửa"** trên card nguồn hàng
2. Cập nhật thông tin
3. Nhấn **"Cập nhật"**

### Xóa nguồn hàng
1. Nhấn nút **"Xóa"** trên card nguồn hàng
2. Xác nhận xóa

## 2. Phiếu nhập hàng

### Truy cập
- Từ Dashboard, nhấn vào **"Nhập hàng"**
- Hoặc truy cập trực tiếp: `/purchase-orders`

### Tạo phiếu nhập hàng mới (Admin & Manager)

1. **Truy cập trang tạo mới**
   - Từ danh sách phiếu nhập, nhấn **"Tạo phiếu nhập"**
   - Hoặc truy cập: `/purchase-orders/new`

2. **Thêm mặt hàng**
   - Nhấn **"Thêm mặt hàng"**
   - Chọn nguồn hàng từ dropdown
   - Nhập số lượng
   - Nhập đơn giá (có thể tự động fill từ giá tham khảo của nguồn hàng)
   - Nhấn **"Thêm"**
   - Lặp lại để thêm nhiều mặt hàng

3. **Điền thông tin phiếu**
   - **Tổng tiền** (*): Tổng giá trị phiếu nhập (người tạo tự nhập)
     - Hệ thống sẽ hiển thị "Tổng tính toán" để tham khảo
   - **Trạng thái** (*): 
     - Nháp: Phiếu chưa hoàn chỉnh
     - Đang đặt: Đã gửi đơn cho nhà cung cấp
     - Đã về: Hàng đã về kho
     - Hoàn thành: Đã kiểm và nhập kho
     - Hủy: Hủy phiếu
   - **Ghi chú**: Thông tin bổ sung

4. **Tạo phiếu**
   - Nhấn **"Tạo phiếu nhập hàng"**

### Xem và chỉnh sửa phiếu nhập hàng

1. **Xem danh sách**
   - Truy cập `/purchase-orders`
   - Lọc theo trạng thái: Tất cả, Nháp, Đang đặt, Đã về, Hoàn thành, Hủy

2. **Xem chi tiết**
   - Nhấn icon "mắt" trên dòng phiếu nhập
   - Hoặc truy cập: `/purchase-orders/[id]`

3. **Chỉnh sửa (Admin & Manager)**
   - Tại trang chi tiết, nhấn **"Chỉnh sửa"**
   - Cập nhật:
     - Tổng tiền
     - Trạng thái
     - Ghi chú
   - Nhấn **"Lưu"**

### Kiểm hàng (Admin, Manager & Staff)

**Tại trang chi tiết phiếu nhập:**

1. Tìm cột **"Số lượng kiểm"** cho mỗi mặt hàng
2. Nhập số lượng thực tế kiểm được
3. Nhấn Tab hoặc click ra ngoài ô input
4. Hệ thống tự động lưu
5. Biểu tượng ✓ (xanh) hoặc ⚠ (đỏ) hiển thị:
   - ✓ (xanh): Số lượng kiểm khớp với số lượng đặt
   - ⚠ (đỏ): Số lượng kiểm khác số lượng đặt

### Xuất PDF

1. Tại trang chi tiết phiếu nhập, nhấn **"Xuất PDF"**
2. Trình duyệt sẽ mở trang mới với phiếu nhập định dạng để in
3. Hộp thoại in sẽ tự động hiện ra
4. Chọn **"Save as PDF"** hoặc **"In"** trực tiếp

## Cấu trúc Database

### Collection: `suppliers`
```javascript
{
  _id: ObjectId,
  name: String,          // Tên nguồn hàng
  imageUrl: String,      // URL ảnh (optional)
  price: Number,         // Giá tham khảo (optional)
  contact: String,       // Thông tin liên hệ
  notes: String,         // Ghi chú (optional)
  createdAt: Date,
  updatedAt: Date
}
```

### Collection: `purchase_orders`
```javascript
{
  _id: ObjectId,
  orderNumber: String,   // Mã phiếu (auto-generated: PO000001, PO000002...)
  createdBy: String,     // Username người tạo
  totalAmount: Number,   // Tổng tiền
  status: String,        // 'draft' | 'ordered' | 'received' | 'completed' | 'cancelled'
  notes: String,         // Ghi chú (optional)
  createdAt: Date,
  updatedAt: Date
}
```

### Collection: `purchase_order_items`
```javascript
{
  _id: ObjectId,
  purchaseOrderId: ObjectId,  // Tham chiếu đến purchase_orders
  supplierId: ObjectId,       // Tham chiếu đến suppliers
  quantity: Number,           // Số lượng đặt
  checkedQuantity: Number,    // Số lượng kiểm (optional)
  price: Number,              // Đơn giá
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Suppliers
- `GET /api/suppliers` - Lấy danh sách tất cả suppliers
- `POST /api/suppliers` - Tạo supplier mới
- `GET /api/suppliers/[id]` - Lấy chi tiết supplier
- `PUT /api/suppliers/[id]` - Cập nhật supplier
- `DELETE /api/suppliers/[id]` - Xóa supplier

### Purchase Orders
- `GET /api/purchase-orders` - Lấy danh sách phiếu nhập (có thể filter theo status)
- `POST /api/purchase-orders` - Tạo phiếu nhập mới
- `GET /api/purchase-orders/[id]` - Lấy chi tiết phiếu nhập (kèm items)
- `PUT /api/purchase-orders/[id]` - Cập nhật phiếu nhập
- `DELETE /api/purchase-orders/[id]` - Xóa phiếu nhập
- `PATCH /api/purchase-orders/[id]/check` - Cập nhật số lượng kiểm
- `GET /api/purchase-orders/[id]/export` - Xuất PDF phiếu nhập

## Lưu ý

1. **Mã phiếu nhập** được tự động tạo theo format: PO + 6 số (PO000001, PO000002...)

2. **Tổng tiền** do người tạo tự nhập, không tự động tính toán. Tuy nhiên hệ thống hiển thị "Tổng tính toán" để tham khảo.

3. **Số lượng kiểm** có thể được cập nhật nhiều lần, mỗi lần cập nhật sẽ ghi đè giá trị cũ.

4. **Xuất PDF**: 
   - Phiếu nhập sẽ hiển thị đầy đủ thông tin bao gồm danh sách mặt hàng, số lượng đặt, số lượng kiểm
   - Có phần chữ ký cho: Người tạo phiếu, Người kiểm hàng, Người duyệt

5. **Phân quyền kiểm hàng**:
   - Admin & Manager: Có thể tạo phiếu và kiểm hàng
   - Staff: Chỉ có thể kiểm hàng, không thể tạo hoặc sửa phiếu

## Workflow đề xuất

1. **Admin/Manager** tạo phiếu nhập hàng với trạng thái "Nháp"
2. Xác nhận và chuyển sang "Đang đặt" khi gửi đơn cho nhà cung cấp
3. Khi hàng về, chuyển sang "Đã về"
4. **Staff** hoặc người có quyền kiểm hàng nhập số lượng thực tế
5. Sau khi kiểm xong, chuyển sang "Hoàn thành"
6. Xuất PDF để lưu trữ hoặc in ra

## Hỗ trợ

Nếu có thắc mắc hoặc gặp vấn đề, vui lòng liên hệ quản trị viên hệ thống.
