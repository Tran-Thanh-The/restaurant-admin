'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TimeSeriesData {
  label: string;
  revenue: number;
  orders: number;
}

interface ProductBreakdown {
  productId: string;
  productName: string;
  quantity: number;
  percentage: number;
}

interface OrderData {
  _id: string;
  orderAt: string;
  createdBy: string;
  totalPrice: number;
  itemCount: number;
}

interface ReportData {
  timeSeries: TimeSeriesData[];
  productBreakdown: ProductBreakdown[];
  orders: OrderData[];
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
  };
}

type TimeRange = 'today' | 'week' | 'month' | 'quarter' | 'custom';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

// Format date consistently for client rendering
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

// Export to CSV
const exportToCSV = (orders: OrderData[]) => {
  if (!orders || orders.length === 0) {
    toast.error('Không có dữ liệu để xuất');
    return;
  }

  // Sort by orderAt (oldest to newest for accounting)
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(a.orderAt).getTime() - new Date(b.orderAt).getTime()
  );

  // Create CSV header
  const headers = ['STT', 'Ngày tạo đơn', 'Tổng tiền (VNĐ)', 'Người tạo đơn'];
  
  // Create CSV rows
  const rows = sortedOrders.map((order, index) => [
    index + 1,
    formatDate(order.orderAt),
    order.totalPrice,
    order.createdBy,
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  // Add BOM for UTF-8 encoding (Excel compatibility)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `bao-cao-don-hang-${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  toast.success('Đã xuất file CSV thành công');
};

export default function ReportsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect staff
  useEffect(() => {
    if (user && user.role === 'staff') {
      toast.error('Bạn không có quyền truy cập trang này');
      router.push('/dashboard');
    }
  }, [user, router]);

  // Calculate date range based on selection
  const getDateRange = (range: TimeRange): { start: Date; end: Date; timeUnit: string } => {
    const now = new Date();
    let start = new Date();
    let timeUnit = 'day';

    switch (range) {
      case 'today':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        timeUnit = 'hour';
        break;
      case 'week':
        start = new Date(now);
        start.setDate(now.getDate() - 7);
        timeUnit = 'day';
        break;
      case 'month':
        start = new Date(now);
        start.setMonth(now.getMonth() - 1);
        timeUnit = 'day';
        break;
      case 'quarter':
        start = new Date(now);
        start.setMonth(now.getMonth() - 3);
        timeUnit = 'month';
        break;
      case 'custom':
        start = new Date(startDate);
        const end = new Date(endDate);
        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        timeUnit = diffDays <= 1 ? 'hour' : diffDays <= 90 ? 'day' : 'month';
        return { start, end, timeUnit };
    }

    return { start, end: now, timeUnit };
  };

  // Fetch report data
  const fetchReport = async () => {
    setLoading(true);
    try {
      const { start, end, timeUnit } = getDateRange(timeRange);
      const params = new URLSearchParams({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        timeUnit,
      });

      const res = await fetch(`/api/reports?${params}`);
      const data = await res.json();

      if (data.success) {
        setReportData(data.data);
      } else {
        toast.error('Không thể tải báo cáo');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Lỗi khi tải báo cáo');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when time range changes
  useEffect(() => {
    if (mounted && timeRange !== 'custom') {
      fetchReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role === 'staff') return null;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Quay về Dashboard</span>
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Báo cáo & Thống kê</h1>
          {reportData && reportData.orders.length > 0 && (
            <button
              onClick={() => exportToCSV(reportData.orders)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Xuất CSV
            </button>
          )}
        </div>

        {/* Time Range Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Chọn khoảng thời gian</h2>
          <div className="flex flex-wrap gap-3 mb-4">
            {[
              { value: 'today', label: 'Hôm nay' },
              { value: 'week', label: '7 ngày qua' },
              { value: 'month', label: '30 ngày qua' },
              { value: 'quarter', label: '3 tháng qua' },
              { value: 'custom', label: 'Tùy chỉnh' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value as TimeRange)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeRange === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {timeRange === 'custom' && (
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                />
              </div>
              <button
                onClick={fetchReport}
                disabled={!startDate || !endDate}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Xem báo cáo
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Đang tải báo cáo...</p>
          </div>
        ) : reportData ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-blue-600">
                  {reportData.summary.totalRevenue.toLocaleString()} ₫
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Tổng đơn hàng</p>
                <p className="text-2xl font-bold text-green-600">{reportData.summary.totalOrders}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">Giá trị TB/đơn</p>
                <p className="text-2xl font-bold text-purple-600">
                  {reportData.summary.averageOrderValue.toLocaleString()} ₫
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Revenue Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Biểu đồ doanh thu</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#3B82F6" name="Doanh thu (₫)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Orders Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Biểu đồ đơn hàng</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="orders" stroke="#10B981" name="Số đơn" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Product Breakdown */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Tỷ lệ sản phẩm</h3>
              <div className="flex flex-col items-center justify-center gap-6">
                <div className="w-full">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Sản phẩm</th>
                        <th className="text-right py-2">Số lượng</th>
                        <th className="text-right py-2">Tỷ lệ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.productBreakdown.map((product, index) => (
                        <tr key={product.productId} className="border-b">
                          <td className="py-2 flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            ></span>
                            {product.productName}
                          </td>
                          <td className="text-right">{product.quantity}</td>
                          <td className="text-right font-semibold">{product.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Danh sách đơn hàng</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4">Mã đơn</th>
                      <th className="text-left py-3 px-4">Thời gian</th>
                      <th className="text-left py-3 px-4">Người tạo</th>
                      <th className="text-right py-3 px-4">Số món</th>
                      <th className="text-right py-3 px-4">Tổng tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.orders.map((order) => (
                      <tr key={order._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-sm">{order._id.slice(-8)}</td>
                        <td className="py-3 px-4">{formatDate(order.orderAt)}</td>
                        <td className="py-3 px-4">{order.createdBy}</td>
                        <td className="text-right py-3 px-4">{order.itemCount}</td>
                        <td className="text-right py-3 px-4 font-semibold">
                          {order.totalPrice?.toLocaleString()} ₫
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Chọn khoảng thời gian để xem báo cáo
          </div>
        )}
      </div>
    </div>
  );
}
