import { ObjectId } from 'mongodb';

// User types
export interface User {
  _id?: ObjectId;
  username: string;
  password: string;
  role: 'admin' | 'manager' | 'staff';
  fullName: string;
  // Employment status
  status?: 'probation' | 'active' | 'resigned';
  // Optional extended fields
  salary?: number; // monthly salary in VND
  email?: string;
  phoneNumber?: string;
  // default work schedule for a week: Mon..Sun (1=work,0=off)
  defaultSchedule?: number[]; // length 7 expected, but not required
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse {
  _id: string;
  username: string;
  role: 'admin' | 'manager' | 'staff';
  fullName: string;
  status?: 'probation' | 'active' | 'resigned';
  salary?: number;
  email?: string;
  phoneNumber?: string;
  defaultSchedule?: number[];
  createdAt: string;
  updatedAt: string;
}

// Product types
export interface Product {
  _id?: ObjectId;
  name: string;
  price: number;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductResponse {
  _id: string;
  name: string;
  price: number;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

// Order types
export interface Order {
  _id?: ObjectId;
  orderAt: Date;
  createdBy: string; // username
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderResponse {
  _id: string;
  orderAt: string;
  createdBy: string;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

// Order Item types
export interface OrderItem {
  _id?: ObjectId;
  orderId: ObjectId | string;
  productId: ObjectId | string;
  quantity: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItemResponse {
  _id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}

// Supplier types
export interface Supplier {
  _id?: ObjectId;
  name: string;
  imageUrl?: string;
  price?: number; // giá tham khảo chung (nếu có)
  contact: string; // thông tin liên hệ (free text)
  notes?: string; // ghi chú
  unit?: string; // đơn vị (cái, kg, lít, etc.)
  weight?: string; // trọng lượng (1 cái, 5 lít, 500 gram, etc.)
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierResponse {
  _id: string;
  name: string;
  imageUrl?: string;
  price?: number;
  contact: string;
  notes?: string;
  unit?: string;
  weight?: string;
  createdAt: string;
  updatedAt: string;
}

// Purchase Order types
export interface PurchaseOrder {
  _id?: ObjectId;
  orderNumber: string; // mã phiếu nhập
  createdBy: string; // username người tạo
  totalAmount: number; // tổng tiền (người tạo tự nhập)
  status: 'draft' | 'ordered' | 'received' | 'completed' | 'cancelled'; // nháp, đang đặt, đã về, hoàn thành, hủy
  notes?: string; // ghi chú
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderResponse {
  _id: string;
  orderNumber: string;
  createdBy: string;
  totalAmount: number;
  status: 'draft' | 'ordered' | 'received' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Purchase Order Item types
export interface PurchaseOrderItem {
  _id?: ObjectId;
  purchaseOrderId: ObjectId | string;
  supplierId: ObjectId | string;
  quantity: number; // số lượng đặt
  checkedQuantity?: number; // số lượng kiểm được
  price: number; // giá của item này
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItemResponse {
  _id: string;
  purchaseOrderId: string;
  supplierId: string;
  quantity: number;
  checkedQuantity?: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  // Pagination fields
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

// Daily Checklist types
export interface DailyChecklist {
  _id?: ObjectId;
  // Normalized date key in format YYYY-MM-DD for the local timezone
  dateKey: string;
  // Flexible JSON blob keyed by frontend-defined checklist item keys
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyChecklistResponse {
  _id: string;
  dateKey: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
