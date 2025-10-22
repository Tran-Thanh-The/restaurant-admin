"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLoading } from "@/contexts/LoadingContext";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";
import { useEffect, useState } from "react";

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { withLoading } = useLoading();
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
        const res = await fetch("/api/dashboard/stats");
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [withLoading]);

  const handleLogout = () => {
    logout();
    router.push("/auth");
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
                  Bảng Điều Khiển
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

          {user?.role === "admin" || user?.role === "manager" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Tổng đơn hàng</p>
                    {loading ? (
                      <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalOrders}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Hôm nay</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
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
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalRevenue.toLocaleString()} ₫
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Hôm nay</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
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
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalProducts}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Trong menu</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <svg
                      className="w-6 h-6 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
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
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* App Launcher */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-5">
              Ứng dụng
            </h2>

            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6"
              role="list"
              aria-label="Danh sách ứng dụng"
            >
              {/* Products app */}
              {user?.role === "staff" ? (
                <div
                  className="group relative select-none"
                  aria-disabled
                  title="Chỉ Admin/Manager được truy cập"
                >
                  <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-200 opacity-60 cursor-not-allowed">
                    <div className="h-14 w-14 rounded-2xl grid place-items-center bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-sm">
                      <svg
                        className="w-7 h-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 10H6L5 9z"
                        />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-600">
                        Sản phẩm
                      </p>
                      <p className="text-xs text-gray-400">Chỉ Admin/Manager</p>
                    </div>
                    <div className="absolute top-2 right-2 text-gray-400">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6a2 2 0 114 0v2a2 2 0 11-4 0V6zM6 10v4a4 4 0 004 4h4a4 4 0 004-4v-4"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  href="/products"
                  className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl"
                >
                  <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition">
                    <div className="h-14 w-14 rounded-2xl grid place-items-center bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-sm group-hover:scale-105 transition">
                      <svg
                        className="w-7 h-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 10H6L5 9z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      Sản phẩm
                    </p>
                  </div>
                </Link>
              )}

              {/* Orders app - available for all */}
              <Link
                href="/orders"
                className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-2xl"
              >
                <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white border border-gray-200 hover:border-emerald-300 hover:shadow-md transition">
                  <div className="h-14 w-14 rounded-2xl grid place-items-center bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-sm group-hover:scale-105 transition">
                    <svg
                      className="w-7 h-7"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7h18M5 11h14M7 15h10M9 19h6"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    Đơn hàng
                  </p>
                </div>
              </Link>

              {/* Users app */}
              {user?.role === "staff" ? (
                <div
                  className="group relative select-none"
                  aria-disabled
                  title="Chỉ Admin/Manager được truy cập"
                >
                  <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-200 opacity-60 cursor-not-allowed">
                    <div className="h-14 w-14 rounded-2xl grid place-items-center bg-gradient-to-br from-slate-400 to-slate-600 text-white shadow-sm">
                      <svg
                        className="w-7 h-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-600">
                        Người dùng
                      </p>
                      <p className="text-xs text-gray-400">Chỉ Admin/Manager</p>
                    </div>
                    <div className="absolute top-2 right-2 text-gray-400">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6a2 2 0 114 0v2a2 2 0 11-4 0V6zM6 10v4a4 4 0 004 4h4a4 4 0 004-4v-4"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  href="/users"
                  className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 rounded-2xl"
                >
                  <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white border border-gray-200 hover:border-slate-300 hover:shadow-md transition">
                    <div className="h-14 w-14 rounded-2xl grid place-items-center bg-gradient-to-br from-slate-400 to-slate-600 text-white shadow-sm group-hover:scale-105 transition">
                      <svg
                        className="w-7 h-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      Người dùng
                    </p>
                  </div>
                </Link>
              )}

              {/* Reports app */}
              {user?.role === "staff" ? (
                <div
                  className="group relative select-none"
                  aria-disabled
                  title="Chỉ Admin/Manager được truy cập"
                >
                  <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-200 opacity-60 cursor-not-allowed">
                    <div className="h-14 w-14 rounded-2xl grid place-items-center bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-sm">
                      <svg
                        className="w-7 h-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 19V6m4 13V10M7 19v-4"
                        />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-600">
                        Báo cáo
                      </p>
                      <p className="text-xs text-gray-400">Chỉ Admin/Manager</p>
                    </div>
                    <div className="absolute top-2 right-2 text-gray-400">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6a2 2 0 114 0v2a2 2 0 11-4 0V6zM6 10v4a4 4 0 004 4h4a4 4 0 004-4v-4"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  href="/reports"
                  className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-2xl"
                >
                  <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white border border-gray-200 hover:border-purple-300 hover:shadow-md transition">
                    <div className="h-14 w-14 rounded-2xl grid place-items-center bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-sm group-hover:scale-105 transition">
                      <svg
                        className="w-7 h-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 19V6m4 13V10M7 19v-4"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      Báo cáo
                    </p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
