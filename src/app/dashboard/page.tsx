'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch dashboard stats (optimized - single API call)
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/dashboard/stats');
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/auth');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Restaurant Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Chào mừng trở lại, {user?.fullName}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* <Link
                  href="/products"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
                >
                  Quản lý sản phẩm
                </Link> */}
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition duration-200"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* User Info Card - Hidden on mobile */}
          <div className="hidden sm:block bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Thông tin người dùng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Tên đăng nhập</p>
                <p className="text-lg font-semibold text-gray-900">
                  {user?.username}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Họ và tên</p>
                <p className="text-lg font-semibold text-gray-900">
                  {user?.fullName}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Vai trò</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tổng đơn hàng</p>
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Hôm nay</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Doanh thu</p>
                  {loading ? (
                    <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stats.totalRevenue.toLocaleString()} ₫</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Hôm nay</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Món ăn</p>
                  {loading ? (
                    <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Trong menu</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Khách hàng</p>
                  <p className="text-2xl font-bold text-gray-900">-</p>
                  <p className="text-xs text-gray-500 mt-1">Chưa tính toán</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Chức năng nhanh
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Quản lý sản phẩm - Disabled for staff */}
              {user?.role === 'staff' ? (
                <div className="p-4 border-2 border-gray-200 rounded-lg bg-gray-100 opacity-60 cursor-not-allowed text-left">
                  <h3 className="font-semibold text-gray-500 mb-2">Quản lý sản phẩm</h3>
                  <p className="text-sm text-gray-400">Chỉ Admin/Manager được truy cập</p>
                </div>
              ) : (
                <Link
                  href="/products"
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition duration-200 text-left block"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">Quản lý sản phẩm</h3>
                  <p className="text-sm text-gray-600">Thêm, sửa, xóa sản phẩm</p>
                </Link>
              )}
              
              {/* Quản lý đơn hàng - Available for all */}
              <Link
                href="/orders"
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition duration-200 text-left block"
              >
                <h3 className="font-semibold text-gray-900 mb-2">Quản lý đơn hàng</h3>
                <p className="text-sm text-gray-600">Xem và quản lý đơn hàng</p>
              </Link>
              
              {/* Báo cáo - Disabled for staff */}
              {user?.role === 'staff' ? (
                <div className="p-4 border-2 border-gray-200 rounded-lg bg-gray-100 opacity-60 cursor-not-allowed text-left">
                  <h3 className="font-semibold text-gray-500 mb-2">Báo cáo</h3>
                  <p className="text-sm text-gray-400">Chỉ Admin/Manager được truy cập</p>
                </div>
              ) : (
                <Link
                  href="/reports"
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition duration-200 text-left block"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">Báo cáo</h3>
                  <p className="text-sm text-gray-600">Xem báo cáo & thống kê</p>
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
