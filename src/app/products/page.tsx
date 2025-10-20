'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLoading } from '@/contexts/LoadingContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import { canCreate, canEdit, canDelete } from '@/lib/permissions';
import { ProductResponse } from '@/types/database';
import Image from 'next/image';

export default function ProductsPage() {
  const { user } = useAuth();
  const { withLoading } = useLoading();
  const router = useRouter();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    imageUrl: '',
  });

  // Redirect staff to dashboard
  useEffect(() => {
    if (user && user.role === 'staff') {
      toast.error('Bạn không có quyền truy cập trang này');
      router.push('/dashboard');
    }
  }, [user, router]);

  const userCanCreate = user ? canCreate(user.role) : false;
  const userCanEdit = user ? canEdit(user.role) : false;
  const userCanDelete = user ? canDelete(user.role) : false;

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
      } else {
        toast.error('Không thể tải danh sách sản phẩm');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Có lỗi xảy ra khi tải sản phẩm');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Open modal for create/edit
  const openModal = (product?: ProductResponse) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        imageUrl: product.imageUrl,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price: '',
        imageUrl: '',
      });
    }
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      imageUrl: '',
    });
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.imageUrl) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      const url = editingProduct
        ? `/api/products/${editingProduct._id}`
        : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await withLoading(
        fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            price: Number(formData.price),
            imageUrl: formData.imageUrl,
          }),
        })
      );

      const data = await response.json();

      if (data.success) {
        toast.success(
          editingProduct ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm thành công!'
        );
        closeModal();
        fetchProducts();
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Không thể lưu sản phẩm');
    }
  };

  // Handle delete
  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa sản phẩm "${productName}"?`)) {
      return;
    }

    try {
      const response = await withLoading(
        fetch(`/api/products/${productId}`, {
          method: 'DELETE',
        })
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Xóa sản phẩm thành công!');
        fetchProducts();
      } else {
        toast.error(data.error || 'Không thể xóa sản phẩm');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Có lỗi xảy ra khi xóa sản phẩm');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            {/* Back Button */}
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Quay về Dashboard</span>
            </button>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quản lý sản phẩm</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {products.length} sản phẩm
                </p>
              </div>
              {userCanCreate && (
                <button
                  onClick={() => openModal()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition duration-200 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Thêm sản phẩm</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có sản phẩm</h3>
              <p className="mt-1 text-sm text-gray-500">Bắt đầu bằng cách thêm sản phẩm mới.</p>
              {userCanCreate && (
                <div className="mt-6">
                  <button
                    onClick={() => openModal()}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Thêm sản phẩm đầu tiên
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width={400}
                      height={300}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                      {product.name}
                    </h3>
                    <p className="text-2xl font-bold text-blue-600 mb-4">
                      {product.price.toLocaleString('vi-VN')} ₫
                    </p>
                    
                    {(userCanEdit || userCanDelete) && (
                      <div className="flex gap-2">
                        {userCanEdit && (
                          <button
                            onClick={() => openModal(product)}
                            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition duration-200 flex items-center justify-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="hidden sm:inline">Sửa</span>
                          </button>
                        )}
                        {userCanDelete && (
                          <button
                            onClick={() => handleDelete(product._id, product.name)}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition duration-200 flex items-center justify-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="hidden sm:inline">Xóa</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end sm:items-center justify-center min-h-screen px-0 sm:px-4 pt-0 sm:pt-4 pb-0 sm:pb-20 text-center sm:block sm:p-0">
              {/* Backdrop */}
              <div
                className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                onClick={closeModal}
              ></div>

              {/* Modal Content */}
              <div className="inline-block align-bottom bg-white rounded-t-2xl sm:rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full max-h-screen sm:max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  {/* Mobile Header with Close Button */}
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 sm:hidden flex items-center justify-between z-10">
                    <h3 className="text-xl font-bold text-gray-900">
                      {editingProduct ? 'Chỉnh sửa' : 'Thêm mới'}
                    </h3>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="w-full mt-3 text-center sm:mt-0 sm:text-left">
                        {/* Desktop Title */}
                        <h3 className="hidden sm:block text-2xl leading-6 font-bold text-gray-900 mb-6">
                          {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                        </h3>
                        
                        <div className="space-y-4">
                          {/* Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Tên sản phẩm <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                              placeholder="Nhập tên sản phẩm"
                              required
                              autoFocus
                            />
                          </div>

                          {/* Price */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Giá (VNĐ) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              value={formData.price}
                              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                              placeholder="Nhập giá sản phẩm"
                              min="0"
                              step="1000"
                              required
                            />
                          </div>

                          {/* Image URL */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              URL hình ảnh <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="url"
                              value={formData.imageUrl}
                              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                              placeholder="https://example.com/image.jpg"
                              required
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Paste URL ảnh từ Unsplash, Pexels hoặc nguồn khác
                            </p>
                          </div>

                          {/* Image Preview */}
                          {formData.imageUrl && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Xem trước
                              </label>
                              <Image
                                src={formData.imageUrl}
                                alt="Preview"
                                width={400}
                                height={300}
                                className="w-full h-48 object-cover rounded-lg"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Invalid+URL';
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className="sticky bottom-0 bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2 border-t border-gray-200">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-3 sm:py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition duration-200"
                    >
                      {editingProduct ? 'Cập nhật' : 'Thêm mới'}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="mt-2 sm:mt-0 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-3 sm:py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm transition duration-200"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
