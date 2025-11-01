'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface OrderDetail {
  _id: string;
  orderAt: string;
  createdBy: string;
  totalPrice: number;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/orders/${id}`)
      .then(res => res.json())
      .then(data => setOrder(data.data))
      .catch(() => toast.error('Không thể tải chi tiết đơn hàng'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Bạn chắc chắn muốn xóa đơn hàng này?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã xóa đơn hàng');
        router.push('/orders');
      } else {
        toast.error('Xóa đơn hàng thất bại');
      }
    } catch {
      toast.error('Lỗi khi xóa đơn hàng');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return <div className="text-center py-12 text-gray-500">Không tìm thấy đơn hàng</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 flex flex-col items-center">
      <div className="w-full max-w-lg bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Chi tiết đơn hàng #{order._id.slice(-8)}</h1>
          <button
            onClick={() => router.push('/orders')}
            className="text-blue-600 hover:underline"
          >
            Quay về
          </button>
        </div>
        <div className="mb-2 text-gray-700">Thời gian: {new Date(order.orderAt).toLocaleString()}</div>
        <div className="mb-2 text-gray-700">Người tạo: {order.createdBy}</div>
        <div className="mb-2 text-gray-700 font-semibold">Tổng tiền: {typeof order.totalPrice === 'number' ? order.totalPrice.toLocaleString() : '-' } ₫</div>
        <div className="mb-4">
          <h2 className="font-semibold mb-2">Danh sách món</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Tên món</th>
                  <th className="text-right py-2">Số lượng</th>
                  <th className="text-right py-2">Đơn giá</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2">{item.productName}</td>
                    <td className="text-right py-2">{item.quantity}</td>
                    <td className="text-right py-2">{item.price.toLocaleString()} ₫</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold text-lg disabled:opacity-60"
          >
            {deleting ? 'Đang xóa...' : 'Xóa đơn hàng'}
          </button>
        )}
      </div>
    </div>
  );
}
