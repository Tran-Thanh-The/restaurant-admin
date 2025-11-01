'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useLoading } from '@/contexts/LoadingContext';

interface ProfileData {
  _id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'manager' | 'staff';
  status?: 'probation' | 'active' | 'resigned';
  email?: string;
  phoneNumber?: string;
  defaultSchedule?: number[];
}

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ProfileData | null>(null);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '', // new password if change
  });

  useEffect(() => {
    if (!user) return;
    const fetchMe = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/${user._id}`);
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
          setForm({
            fullName: json.data.fullName || '',
            email: json.data.email || '',
            phoneNumber: json.data.phoneNumber || '',
            password: '',
          });
        } else {
          toast.error(json.error || 'Không tải được hồ sơ');
        }
      } catch (e) {
        console.error(e);
        toast.error('Có lỗi khi tải hồ sơ');
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !data) return;
    setSaving(true);
    startLoading('Đang lưu...');
    try {
      const payload: Partial<{
        fullName: string;
        role: 'admin' | 'manager' | 'staff';
        email: string;
        phoneNumber: string;
        password: string;
      }> = {
        fullName: form.fullName,
        role: data.role, // Preserve current role
        email: form.email || undefined,
        phoneNumber: form.phoneNumber || undefined,
      };
      
      // Add password if user entered a new one
      const trimmedPassword = form.password?.trim();
      if (trimmedPassword && trimmedPassword.length > 0) {
        payload.password = trimmedPassword;
        console.log('Sending password update'); // Debug log
      }
      
      console.log('Payload:', { ...payload, password: payload.password ? '***' : undefined }); // Debug log
      
      const res = await fetch(`/api/users/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Cập nhật hồ sơ thành công');
        setForm((f) => ({ ...f, password: '' }));
      } else {
        toast.error(json.error || 'Cập nhật thất bại');
      }
    } catch (e) {
      console.error(e);
      toast.error('Có lỗi khi lưu');
    } finally {
      setSaving(false);
      stopLoading();
    }
  };

  if (!user) return null;

  const days = ['T2','T3','T4','T5','T6','T7','CN'];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            <span className="font-medium">Quay về Dashboard</span>
          </button>

          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-4">Hồ sơ của tôi</h1>

            {loading ? (
              <div className="text-center text-gray-500 py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2">Đang tải...</p>
              </div>
            ) : !data ? (
              <div className="text-center text-gray-500">Không tìm thấy dữ liệu</div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
                    <input className="w-full border rounded px-3 py-2 bg-gray-50" value={data.username} disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                    <input className="w-full border rounded px-3 py-2 bg-gray-50 capitalize" value={data.role} disabled />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                    <input className="w-full border rounded px-3 py-2" value={form.fullName} onChange={(e)=>setForm({...form, fullName: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" className="w-full border rounded px-3 py-2" value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                    <input className="w-full border rounded px-3 py-2" value={form.phoneNumber} onChange={(e)=>setForm({...form, phoneNumber: e.target.value})} />
                  </div>
                  {data.role === 'staff' && (
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngày có thể đi làm</label>
                      <div className="flex flex-wrap gap-2">
                        {days.map((d, idx) => (
                          <span
                            key={idx}
                            className={`px-3 py-1.5 rounded border text-sm ${
                              data.defaultSchedule && data.defaultSchedule[idx] === 1
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-white text-gray-600 border-gray-300'
                            }`}
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới (để trống nếu không đổi)</label>
                    <input type="password" className="w-full border rounded px-3 py-2" value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={()=>router.push('/dashboard')} className="px-4 py-2 rounded border">Hủy</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">{saving? 'Đang lưu...' : 'Lưu'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
