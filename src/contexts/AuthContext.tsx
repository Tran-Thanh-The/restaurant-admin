'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@/constants/auth';
import { useLoading } from '@/contexts/LoadingContext';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  username: string;
  role: UserRole;
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'restaurant_admin_auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { withLoading } = useLoading();

  useEffect(() => {
    // Check if user is already logged in from localStorage
    try {
      const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        setUser(authData.user);
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await withLoading(
        fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        })
      );

      const data = await response.json();

      if (data.success && data.data) {
        const userData: User = {
          _id: data.data._id,
          username: data.data.username,
          role: data.data.role,
          fullName: data.data.fullName,
        };

        setUser(userData);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
          user: userData,
          timestamp: Date.now(),
        }));
        
        toast.success(`Chào mừng ${userData.fullName}!`);
        return true;
      } else {
        toast.error(data.error || 'Đăng nhập thất bại');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Có lỗi xảy ra khi đăng nhập');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    toast.success('Đã đăng xuất thành công');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
