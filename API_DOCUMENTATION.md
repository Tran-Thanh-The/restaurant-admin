# Restaurant Admin API Documentation

## 🚀 Setup & Initialization

### 1. Seed Database
Sau khi khởi động server, chạy lệnh sau để tạo dữ liệu mặc định:

```bash
curl -X POST http://localhost:3000/api/seed
```

Hoặc truy cập trực tiếp: `http://localhost:3000/api/seed` (POST request)

Lệnh này sẽ tạo:
- 3 user mặc định (admin, manager, staff)
- Indexes cho các collections

---

## 📚 API Endpoints

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "username": "admin",
    "role": "admin",
    "fullName": "Administrator",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "message": "Login successful"
}
```

---

### Users

#### Get All Users
```http
GET /api/users
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "username": "admin",
      "role": "admin",
      "fullName": "Administrator",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

#### Create User
```http
POST /api/users
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "role": "staff",
  "fullName": "New User"
}
```

---

### Products

#### Get All Products
```http
GET /api/products
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Phở Bò",
      "price": 50000,
      "imageUrl": "https://example.com/image.jpg",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

#### Create Product
```http
POST /api/products
Content-Type: application/json

{
  "name": "Phở Bò",
  "price": 50000,
  "imageUrl": "https://example.com/image.jpg"
}
```

#### Get Single Product
```http
GET /api/products/[id]
```

#### Update Product
```http
PUT /api/products/[id]
Content-Type: application/json

{
  "name": "Phở Bò Đặc Biệt",
  "price": 60000
}
```

#### Delete Product
```http
DELETE /api/products/[id]
```

---

### Orders

#### Get All Orders
```http
GET /api/orders
```

**Query Parameters:**
- `createdBy` (optional): Filter by username

**Example:**
```http
GET /api/orders?createdBy=admin
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "orderAt": "...",
      "createdBy": "admin",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

#### Create Order
```http
POST /api/orders
Content-Type: application/json

{
  "createdBy": "admin",
  "orderAt": "2025-10-20T10:00:00Z"  // optional, defaults to now
}
```

---

### Order Items

#### Get Order Items
```http
GET /api/order-items
```

**Query Parameters:**
- `orderId` (optional): Filter by order ID

**Example:**
```http
GET /api/order-items?orderId=67123abc...
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "orderId": "...",
      "productId": "...",
      "quantity": 2,
      "price": 50000,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

#### Create Order Item
```http
POST /api/order-items
Content-Type: application/json

{
  "orderId": "67123abc...",
  "productId": "67123def...",
  "quantity": 2,
  "price": 50000
}
```

---

## 🗄️ Database Schema

### Collections

#### users
```typescript
{
  _id: ObjectId,
  username: string,
  password: string (hashed),
  role: 'admin' | 'manager' | 'staff',
  fullName: string,
  createdAt: Date,
  updatedAt: Date
}
```

#### products
```typescript
{
  _id: ObjectId,
  name: string,
  price: number,
  imageUrl: string,
  createdAt: Date,
  updatedAt: Date
}
```

#### orders
```typescript
{
  _id: ObjectId,
  orderAt: Date,
  createdBy: string (username),
  createdAt: Date,
  updatedAt: Date
}
```

#### order_items
```typescript
{
  _id: ObjectId,
  orderId: ObjectId,
  productId: ObjectId,
  quantity: number,
  price: number,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🧪 Testing with cURL

### Seed Database
```bash
curl -X POST http://localhost:3000/api/seed
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Create Product
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Phở Bò","price":50000,"imageUrl":"https://example.com/pho.jpg"}'
```

### Get All Products
```bash
curl http://localhost:3000/api/products
```

### Create Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"createdBy":"admin"}'
```

### Create Order Item
```bash
curl -X POST http://localhost:3000/api/order-items \
  -H "Content-Type: application/json" \
  -d '{"orderId":"ORDER_ID_HERE","productId":"PRODUCT_ID_HERE","quantity":2,"price":50000}'
```

---

## 🔐 Default Accounts

| Username | Password    | Role    |
|----------|-------------|---------|
| admin    | admin123    | admin   |
| manager  | manager123  | manager |
| staff    | staff123    | staff   |

---

## 💡 Frontend Usage Example

```typescript
import { useLoading } from '@/contexts/LoadingContext';
import toast from 'react-hot-toast';

// In your component
const { withLoading } = useLoading();

// Create product with loading and toast
const createProduct = async () => {
  try {
    const response = await withLoading(
      fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Phở Bò',
          price: 50000,
          imageUrl: 'https://example.com/pho.jpg'
        })
      })
    );
    
    const data = await response.json();
    
    if (data.success) {
      toast.success('Tạo sản phẩm thành công!');
    } else {
      toast.error(data.error || 'Có lỗi xảy ra');
    }
  } catch (error) {
    toast.error('Không thể kết nối đến server');
  }
};
```

---

## 🎯 Features

✅ **Global Loading**: Tự động hiển thị loading overlay khi call API  
✅ **Toast Notifications**: Thông báo thành công/lỗi tự động  
✅ **Authentication**: Login với MongoDB thay vì constants  
✅ **CRUD Operations**: Đầy đủ cho Users, Products, Orders, Order Items  
✅ **TypeScript**: Type-safe cho toàn bộ API  
✅ **Error Handling**: Xử lý lỗi chuẩn với status codes  

---

## 📝 Notes

- MongoDB URI được cấu hình trong file `.env`
- Password được hash bằng bcryptjs
- Tất cả dates được trả về dưới dạng ISO string
- ObjectIds được convert thành string trong responses
