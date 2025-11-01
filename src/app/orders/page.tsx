"use client";

import { useEffect, useState } from "react";
import { useProducts } from "@/contexts/ProductsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLoading } from "@/contexts/LoadingContext";
import { useRouter } from "next/navigation";
import { OrderResponse } from "@/types/database";
import toast from "react-hot-toast";

interface ProductOrder {
  productId: string;
  quantity: number;
}

export default function OrdersPage() {
  const { products } = useProducts();
  const { user } = useAuth();
  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();

  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [quantities, setQuantities] = useState<ProductOrder[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const itemsPerPage = 10;

  // Fetch orders with pagination
  useEffect(() => {
    setLoading(true);
    fetch(`/api/orders?page=${currentPage}&limit=${itemsPerPage}`)
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.data || []);
        setTotalOrders(data.total || 0);
      })
      .finally(() => setLoading(false));
  }, [showCreate, currentPage]);

  // Init quantities when open create
  useEffect(() => {
    if (showCreate && products.length) {
      setQuantities(products.map((p) => ({ productId: p._id, quantity: 0 })));
    }
  }, [showCreate, products]);

  // Handle quantity change
  const setQty = (productId: string, qty: number) => {
    setQuantities((prev) =>
      prev.map((q) => (q.productId === productId ? { ...q, quantity: qty } : q))
    );
  };

  // Submit order
  const handleSubmit = async () => {
    const items = quantities.filter((q) => q.quantity > 0);
    if (!items.length) return toast.error("Chưa chọn sản phẩm nào!");
    // Tính tổng tiền
    let totalPrice = 0;
    items.forEach((item) => {
      const prod = products.find((p) => p._id === item.productId);
      if (prod) totalPrice += item.quantity * prod.price;
    });

    totalPrice = Math.round(totalPrice / 1000) * 1000;

    setTotal(Number(totalPrice));
    // Tạo order
    if (!user) return toast.error("Không xác định người dùng!");
    const startedAt = Date.now();
    startLoading();
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ createdBy: user.username, totalPrice: Number(totalPrice) }),
      });
      const order = await res.json();
      if (!order.success) {
        toast.error("Tạo đơn thất bại!");
        return;
      }
      // Tạo order_items (chờ hoàn tất để đảm bảo tạo đơn xong hoàn toàn)
      await Promise.all(
        items.map((item) =>
          fetch("/api/order-items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: order.data._id,
              productId: item.productId,
              quantity: item.quantity,
              price: products.find((p) => p._id === item.productId)?.price,
            }),
          })
        )
      );

      setShowResult(true);
      setShowCreate(false);
      toast.success("Tạo đơn thành công!");
    } catch (e) {
      console.error(e);
      toast.error("Có lỗi khi tạo đơn");
    } finally {
      // Đảm bảo loading hiển thị tối thiểu 400ms để người dùng cảm nhận
      const elapsed = Date.now() - startedAt;
      if (elapsed < 400) {
        await new Promise((r) => setTimeout(r, 400 - elapsed));
      }
      stopLoading();
    }
  };

  // UI
  if (showCreate) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-6">
        <h2 className="text-xl font-bold mb-4">Tạo đơn hàng mới</h2>
        <div className="w-full max-w-md bg-white rounded-lg shadow p-4">
          {products.map((p, idx) => (
            <div key={p._id} className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <div className="font-semibold">{p.name}</div>
                <div className="text-sm text-gray-500">
                  {p.price.toLocaleString()} ₫
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-2 py-1 bg-gray-200 rounded text-lg"
                  onClick={() =>
                    setQty(
                      p._id,
                      Math.max(0, Number(quantities[idx]?.quantity) - 1)
                    )
                  }
                >
                  -
                </button>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="w-16 px-2 py-1 border rounded text-center text-base"
                  value={quantities[idx]?.quantity}
                  onChange={(e) =>
                    setQty(p._id, Math.max(0, Number(e.target.value)))
                  }
                />
                <button
                  className="px-2 py-1 bg-gray-200 rounded text-lg"
                  onClick={() =>
                    setQty(p._id, Number(quantities[idx]?.quantity) + 1)
                  }
                >
                  +
                </button>
              </div>
            </div>
          ))}
          <button
            className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg font-semibold text-lg"
            onClick={handleSubmit}
          >
            Tạo đơn
          </button>
          <button
            className="w-full mt-2 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold text-lg"
            onClick={() => setShowCreate(false)}
          >
            Quay về danh sách đơn
          </button>
        </div>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-6">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-bold mb-4">Tạo đơn thành công!</h2>
          <div className="text-lg mb-2">
            Tổng tiền:{" "}
            <span className="font-bold text-blue-600">
              {total.toLocaleString()} ₫
            </span>
          </div>
          <div className="text-sm text-gray-500 mb-6">
            (Đã làm tròn 2 số thập phân)
          </div>
          <div className="flex flex-col gap-3">
            <button
              className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold text-lg"
              onClick={() => {
                setShowResult(false);
                setShowCreate(false);
              }}
            >
              Quay về danh sách đơn
            </button>
            <button
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold text-lg"
              onClick={() => {
                setShowResult(false);
                setShowCreate(true);
              }}
            >
              Order tiếp
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Xử lý xóa đơn hàng
  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa đơn hàng này?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.filter((o) => o._id !== id));
        setTotalOrders((prev) => prev - 1);
        toast.success('Đã xóa đơn hàng');
      } else {
        toast.error('Xóa đơn hàng thất bại');
      }
    } catch {
      toast.error('Lỗi khi xóa đơn hàng');
    } finally {
      setDeletingId(null);
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalOrders / itemsPerPage);

  // Handle page change
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Danh sách đơn hàng
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-2xl mx-auto">
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

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Danh sách đơn hàng</h1>
          <button
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            onClick={() => setShowCreate(true)}
          >
            Tạo đơn mới
          </button>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          {loading ? (
            <div className="text-center text-gray-500 py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2">Đang tải...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center text-gray-500">
              Chưa có đơn hàng nào.
            </div>
          ) : (
            <ul className="divide-y">
              {orders.map((order) => (
                <li
                  key={order._id}
                  className="py-3 flex justify-between items-center gap-3"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      Mã đơn: {order._id}
                    </div>
                    <div className="text-sm text-gray-500">
                      Thời gian: {new Date(order.orderAt).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      Người tạo: {order.createdBy}
                    </div>
                    <div className="text-sm text-gray-700 mt-1">
                      Tổng đơn giá: <span className="font-semibold text-blue-600">{typeof order.totalPrice === 'number' ? order.totalPrice.toLocaleString() : '-'} ₫</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
                      onClick={() => router.push(`/orders/${order._id}`)}
                    >
                      Xem
                    </button>
                    {(user?.role === 'admin' || user?.role === 'manager') && (
                      <button
                        className="px-3 py-2 bg-red-600 text-white rounded-lg font-semibold text-sm disabled:opacity-60 hover:bg-red-700 transition-colors"
                        onClick={() => handleDelete(order._id)}
                        disabled={deletingId === order._id}
                      >
                        {deletingId === order._id ? 'Đang xóa...' : 'Xóa'}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Pagination Controls */}
        {!loading && orders.length > 0 && totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-full sm:w-auto px-4 py-2 bg-white border rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              ← Trước
            </button>
            
            <div className="flex items-center gap-1 flex-wrap justify-center">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-2 sm:px-4 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return <span key={page} className="px-1 sm:px-2 text-gray-500">...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-full sm:w-auto px-4 py-2 bg-white border rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Sau →
            </button>
          </div>
        )}

        {/* Page info */}
        {!loading && orders.length > 0 && (
          <div className="mt-4 text-center text-xs sm:text-sm text-gray-600">
            Trang {currentPage} / {totalPages} • Tổng {totalOrders} đơn hàng
          </div>
        )}
      </div>
    </div>
  );
}
