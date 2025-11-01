'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLoading } from '@/contexts/LoadingContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import { PurchaseOrderResponse, PurchaseOrderItemResponse, SupplierResponse } from '@/types/database';
import Image from 'next/image';

interface PurchaseOrderDetail extends PurchaseOrderResponse {
  items: PurchaseOrderItemResponse[];
}

interface SupplierItem {
  itemId: string;
  supplierId: string;
  supplierName: string;
  supplierImage?: string;
  quantity: number;
  checkedQuantity?: number;
  price: number;
}

export default function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const { withLoading } = useLoading();
  const router = useRouter();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderDetail | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierResponse[]>([]);
  const [supplierItems, setSupplierItems] = useState<SupplierItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    totalAmount: '',
    status: '',
    notes: '',
  });

  // Permissions
  const canEdit = user && (user.role === 'admin' || user.role === 'manager');
  const canCheck = user && (user.role === 'admin' || user.role === 'manager' || user.role === 'staff');

  // Fetch purchase order details
  const fetchPurchaseOrder = async () => {
    try {
      const response = await fetch(`/api/purchase-orders/${resolvedParams.id}`);
      const data = await response.json();

      if (data.success) {
        setPurchaseOrder(data.data);
        setEditFormData({
          totalAmount: data.data.totalAmount.toString(),
          status: data.data.status,
          notes: data.data.notes || '',
        });
      } else {
        toast.error('Không thể tải thông tin phiếu nhập hàng');
        router.push('/purchase-orders');
      }
    } catch (error) {
      console.error('Error fetching purchase order:', error);
      toast.error('Có lỗi xảy ra khi tải phiếu nhập hàng');
    }
  };

  // Fetch suppliers
  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers');
      const data = await response.json();

      if (data.success) {
        setSuppliers(data.data);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  useEffect(() => {
    fetchPurchaseOrder();
    fetchSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.id]);

  // Map items with supplier info
  useEffect(() => {
    if (purchaseOrder && suppliers.length > 0) {
      const items = purchaseOrder.items.map((item) => {
        const supplier = suppliers.find((s) => s._id === item.supplierId);
        return {
          itemId: item._id,
          supplierId: item.supplierId,
          supplierName: supplier?.name || 'N/A',
          supplierImage: supplier?.imageUrl,
          quantity: item.quantity,
          checkedQuantity: item.checkedQuantity,
          price: item.price,
        };
      });
      setSupplierItems(items);
    }
  }, [purchaseOrder, suppliers]);

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-yellow-100 text-yellow-800',
      ordered: 'bg-blue-100 text-blue-800',
      received: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    const labels = {
      draft: 'Nháp',
      ordered: 'Đang đặt',
      received: 'Đã về',
      completed: 'Hoàn thành',
      cancelled: 'Hủy',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  // Handle update checked quantity
  const handleUpdateCheckedQuantity = async (itemId: string, checkedQuantity: number) => {
    try {
      const response = await withLoading(
        fetch(`/api/purchase-orders/${resolvedParams.id}/check`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: [{ itemId, checkedQuantity }],
          }),
        })
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Cập nhật số lượng kiểm thành công!');
        fetchPurchaseOrder();
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error updating checked quantity:', error);
      toast.error('Không thể cập nhật số lượng kiểm');
    }
  };

  // Handle update purchase order
  const handleUpdatePurchaseOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await withLoading(
        fetch(`/api/purchase-orders/${resolvedParams.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            totalAmount: Number(editFormData.totalAmount),
            status: editFormData.status,
            notes: editFormData.notes,
          }),
        })
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Cập nhật phiếu nhập hàng thành công!');
        setIsEditing(false);
        fetchPurchaseOrder();
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error updating purchase order:', error);
      toast.error('Không thể cập nhật phiếu nhập hàng');
    }
  };

  // Handle export PDF
  const handleExportPDF = () => {
    window.open(`/api/purchase-orders/${resolvedParams.id}/export`, '_blank');
  };

  if (!purchaseOrder) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

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

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Phiếu nhập hàng {purchaseOrder.orderNumber}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  {getStatusBadge(purchaseOrder.status)}
                  <span className="text-sm text-gray-600">
                    Tạo lúc: {new Date(purchaseOrder.createdAt).toLocaleString('vi-VN')}
                  </span>
                  <span className="text-sm text-gray-600">
                    Người tạo: <strong>{purchaseOrder.createdBy}</strong>
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExportPDF}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Xuất PDF
                </button>
                {canEdit && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition duration-200 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Chỉnh sửa
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Items List */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Danh sách mặt hàng</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {supplierItems.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      Chưa có mặt hàng nào
                    </div>
                  ) : (
                    supplierItems.map((item) => (
                      <div key={item.itemId} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start gap-4">
                          {item.supplierImage && (
                            <Image
                              src={item.supplierImage}
                              alt={item.supplierName}
                              width={80}
                              height={80}
                              className="w-20 h-20 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=No+Image';
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{item.supplierName}</h3>
                            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">Số lượng đặt:</span>
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
                              {canCheck && (
                                <div>
                                  <label className="text-gray-600 block mb-1">Số lượng kiểm:</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      defaultValue={item.checkedQuantity || ''}
                                      placeholder="Nhập SL"
                                      onBlur={(e) => {
                                        const value = e.target.value;
                                        if (value && Number(value) !== item.checkedQuantity) {
                                          handleUpdateCheckedQuantity(item.itemId, Number(value));
                                        }
                                      }}
                                      className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                                    />
                                    {item.checkedQuantity !== undefined && (
                                      <span className={`text-xs font-semibold ${
                                        item.checkedQuantity === item.quantity
                                          ? 'text-green-600'
                                          : 'text-red-600'
                                      }`}>
                                        {item.checkedQuantity === item.quantity ? '✓' : '⚠'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                              {!canCheck && item.checkedQuantity !== undefined && (
                                <div>
                                  <span className="text-gray-600">Số lượng kiểm:</span>
                                  <p className="font-semibold text-gray-900">{item.checkedQuantity}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Order Info */}
              {isEditing && canEdit ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Chỉnh sửa thông tin</h2>
                  <form onSubmit={handleUpdatePurchaseOrder} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tổng tiền (VNĐ)
                      </label>
                      <input
                        type="number"
                        value={editFormData.totalAmount}
                        onChange={(e) => setEditFormData({ ...editFormData, totalAmount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                        min="0"
                        step="1000"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trạng thái
                      </label>
                      <select
                        value={editFormData.status}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
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
                        value={editFormData.notes}
                        onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                        rows={4}
                        placeholder="Ghi chú..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
                      >
                        Lưu
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setEditFormData({
                            totalAmount: purchaseOrder.totalAmount.toString(),
                            status: purchaseOrder.status,
                            notes: purchaseOrder.notes || '',
                          });
                        }}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-medium transition duration-200"
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Thông tin phiếu</h2>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-600">Tổng tiền:</span>
                      <p className="text-2xl font-bold text-blue-600 mt-1">
                        {purchaseOrder.totalAmount.toLocaleString('vi-VN')} ₫
                      </p>
                    </div>
                    {purchaseOrder.notes && (
                      <div>
                        <span className="text-gray-600">Ghi chú:</span>
                        <p className="text-gray-900 mt-1 whitespace-pre-wrap">
                          {purchaseOrder.notes}
                        </p>
                      </div>
                    )}
                    <div className="pt-3 border-t border-gray-200">
                      <span className="text-gray-600">Cập nhật lần cuối:</span>
                      <p className="text-gray-900 mt-1">
                        {new Date(purchaseOrder.updatedAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
