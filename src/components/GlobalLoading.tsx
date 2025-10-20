'use client';

import { useLoading } from '@/contexts/LoadingContext';

export default function GlobalLoading() {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
          <span className="text-lg font-medium text-gray-900">Đang xử lý...</span>
        </div>
      </div>
    </div>
  );
}
