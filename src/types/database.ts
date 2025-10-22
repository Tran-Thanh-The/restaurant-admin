import { ObjectId } from 'mongodb';

// User types
export interface User {
  _id?: ObjectId;
  username: string;
  password: string;
  role: 'admin' | 'manager' | 'staff';
  fullName: string;
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

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
