'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLoading } from '@/contexts/LoadingContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import { SupplierResponse } from '@/types/database';
import Image from 'next/image';

interface ItemFormData {
  supplierId: string;
  quantity: number;
  price: number;
}

export default function NewPurchaseOrderPage() {
  const { user } = useAuth();
  const { withLoading } = useLoading();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<SupplierResponse[]>([]);
  const [formData, setFormData] = useState({
    totalAmount: '',
    status: 'draft' as 'draft' | 'ordered' | 'received' | 'completed' | 'cancelled',
    notes: '',
  });
  const [items, setItems] = useState<ItemFormData[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState<ItemFormData>({
    supplierId: '',
    quantity: 1,
    price: 0,
  });

  // Only admin and manager can create purchase orders
  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'manager') {
      toast.error('Bạn không có quyền tạo phiếu nhập hàng');
      router.push('/purchase-orders');
    }
  }, [user, router]);

  // Fetch suppliers
  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers');
      const data = await response.json();

      if (data.success) {
        setSuppliers(data.data);
      } else {
        toast.error('Không thể tải danh sách nguồn hàng');
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Có lỗi xảy ra khi tải nguồn hàng');
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Add item to list
  const handleAddItem = () => {
    if (!newItem.supplierId) {
      toast.error('Vui lòng chọn nguồn hàng');
      return;
    }

    if (newItem.quantity <= 0) {
      toast.error('Số lượng phải lớn hơn 0');
      return;
    }

    if (newItem.price < 0) {
      toast.error('Giá không được âm');
      return;
    }

    // Check if supplier already exists in items
    if (items.some(item => item.supplierId === newItem.supplierId)) {
      toast.error('Nguồn hàng này đã được thêm');
      return;
    }

    setItems([...items, { ...newItem }]);
    setNewItem({ supplierId: '', quantity: 1, price: 0 });
    setIsAddingItem(false);
    toast.success('Đã thêm mặt hàng');
  };

  // Remove item from list
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    toast.success('Đã xóa mặt hàng');
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Bạn chưa đăng nhập');
      return;
    }

    if (items.length === 0) {
      toast.error('Vui lòng thêm ít nhất một mặt hàng');
      return;
    }

    if (!formData.totalAmount || Number(formData.totalAmount) < 0) {
      toast.error('Vui lòng nhập tổng tiền hợp lệ');
      return;
    }

    try {
      const response = await withLoading(
        fetch('/api/purchase-orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            createdBy: user.username,
            totalAmount: Number(formData.totalAmount),
            status: formData.status,
            notes: formData.notes,
            items: items,
          }),
        })
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Tạo phiếu nhập hàng thành công!');
        router.push(`/purchase-orders/${data.data._id}`);
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast.error('Không thể tạo phiếu nhập hàng');
    }
  };

  // Calculate suggested total
  const suggestedTotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            {/* Back Button */}
            <button
              onClick={() => router.push('/purchase-orders')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Quay về danh sách</span>
            </button>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Tạo phiếu nhập hàng mới
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Items List */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Danh sách mặt hàng</h2>
                    <button
                      type="button"
                      onClick={() => setIsAddingItem(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Thêm mặt hàng
                    </button>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {items.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        Chưa có mặt hàng nào. Nhấn &quot;Thêm mặt hàng&quot; để bắt đầu.
                      </div>
                    ) : (
                      items.map((item, index) => {
                        const supplier = suppliers.find(s => s._id === item.supplierId);
                        return (
                          <div key={index} className="p-4 hover:bg-gray-50">
                            <div className="flex items-start gap-4">
                              {supplier?.imageUrl && (
                                <Image
                                  src={supplier.imageUrl}
                                  alt={supplier.name}
                                  width={80}
                                  height={80}
                                  className="w-20 h-20 object-cover rounded"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=No+Image';
                                  }}
                                />
                              )}
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{supplier?.name || 'N/A'}</h3>
                                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                                  <div>
                                    <span className="text-gray-600">Số lượng:</span>
                                    <p className="font-semibold text-gray-900">{item.quantity}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Đơn giá:</span>
                                    <p className="font-semibold text-blue-600">
                                      {item.price.toLocaleString('vi-VN')} ₫
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Thành tiền:</span>
                                    <p className="font-semibold text-gray-900">
                                      {(item.quantity * item.price).toLocaleString('vi-VN')} ₫
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Order Info Form */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Thông tin phiếu</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tổng tiền (VNĐ) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.totalAmount}
                        onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                        placeholder="Nhập tổng tiền"
                        min="0"
                        step="1000"
                        required
                      />
                      {suggestedTotal > 0 && (
                        <p className="mt-1 text-xs text-gray-500">
                          Tổng tính toán: {suggestedTotal.toLocaleString('vi-VN')} ₫
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trạng thái <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                        required
                      >
                        <option value="draft">Nháp</option>
                        <option value="ordered">Đang đặt</option>
                        <option value="received">Đã về</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="cancelled">Hủy</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ghi chú
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                        rows={4}
                        placeholder="Ghi chú về phiếu nhập..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition duration-200"
                    >
                      Tạo phiếu nhập hàng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Add Item Modal */}
        {isAddingItem && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end sm:items-center justify-center min-h-screen px-0 sm:px-4 pt-0 sm:pt-4 pb-0 sm:pb-20 text-center sm:block sm:p-0">
              {/* Backdrop */}
              <div
                className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                onClick={() => {
                  setIsAddingItem(false);
                  setNewItem({ supplierId: '', quantity: 1, price: 0 });
                }}
              ></div>

              {/* Modal Content */}
              <div className="inline-block align-bottom bg-white rounded-t-2xl sm:rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Thêm mặt hàng</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nguồn hàng <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newItem.supplierId}
                        onChange={(e) => {
                          const supplier = suppliers.find(s => s._id === e.target.value);
                          setNewItem({
                            ...newItem,
                            supplierId: e.target.value,
                            price: supplier?.price || 0,
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                        required
                      >
                        <option value="">-- Chọn nguồn hàng --</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier._id} value={supplier._id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số lượng <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                        min="1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Đơn giá (VNĐ) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={newItem.price}
                        onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                        min="0"
                        step="1000"
                        required
                      />
                    </div>

                    {newItem.quantity > 0 && newItem.price > 0 && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">Thành tiền:</p>
                        <p className="text-xl font-bold text-blue-600">
                          {(newItem.quantity * newItem.price).toLocaleString('vi-VN')} ₫
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-3 sm:py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Thêm
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingItem(false);
                      setNewItem({ supplierId: '', quantity: 1, price: 0 });
                    }}
                    className="mt-2 sm:mt-0 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-3 sm:py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:w-auto sm:text-sm"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
