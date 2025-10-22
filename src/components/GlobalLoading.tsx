'use client';

import { useLoading } from '@/contexts/LoadingContext';

export default function GlobalLoading() {
  const { isLoading, message } = useLoading();

  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="alert"
      aria-busy="true"
      aria-live="assertive"
    >
      <div className="bg-white rounded-xl p-6 shadow-2xl w-[90%] max-w-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">Đang xử lý</p>
            <p className="text-sm text-gray-600 mt-0.5">{message || 'Vui lòng đợi trong giây lát...'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
