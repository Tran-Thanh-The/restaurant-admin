import { ObjectId } from 'mongodb';

// User types
export interface User {
  _id?: ObjectId;
  username: string;
  password: string;
  role: 'admin' | 'manager' | 'staff';
  fullName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse {
  _id: string;
  username: string;
  role: 'admin' | 'manager' | 'staff';
  fullName: string;
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

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
