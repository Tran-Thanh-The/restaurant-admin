'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';
import { useLoading } from '@/contexts/LoadingContext';

interface UserItem {
  _id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'manager' | 'staff';
  status?: 'probation' | 'active' | 'resigned';
  salary?: number;
  email?: string;
  phoneNumber?: string;
  defaultSchedule?: number[]; // length 7 Mon..Sun
}

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { withLoading, startLoading, stopLoading } = useLoading();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [form, setForm] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'staff' as 'admin' | 'manager' | 'staff',
    status: 'active' as 'probation' | 'active' | 'resigned',
    salary: '',
    email: '',
    phoneNumber: '',
    defaultSchedule: [1,1,1,1,1,0,0] as number[],
  });

  // Only admin/manager can access
  useEffect(() => {
    if (user && user.role === 'staff') {
      toast.error('Bạn không có quyền truy cập trang này');
      router.push('/dashboard');
    }
  }, [user, router]);

  const canCreate = user && (user.role === 'admin' || user.role === 'manager');
  const canDelete = useMemo(() => {
    if (!user) return () => false;
    return (targetRole: UserItem['role']) => {
      if (user.role === 'admin') return targetRole !== 'admin';
      if (user.role === 'manager') return targetRole === 'staff';
      return false;
    };
  }, [user]);
  const canEdit = useMemo(() => {
    if (!user) return () => false;
    return (target: UserItem) => {
      if (user.role === 'admin') return true; // admin can edit all users
      if (user.role === 'manager') return target.role === 'staff' || target._id === user._id; // manager can edit staff and self
      return false;
    };
  }, [user]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await withLoading(fetch('/api/users'));
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch (e) {
      console.error(e);
      toast.error('Không thể tải danh sách user');
    }
  }, [withLoading]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openModal = () => {
    setIsEdit(false);
    setEditingUser(null);
    setForm({ username: '', password: '', fullName: '', role: 'staff', status: 'active', salary: '', email: '', phoneNumber: '', defaultSchedule: [1,1,1,1,1,0,0] });
    setIsModalOpen(true);
  };
  const openEditModal = (item: UserItem) => {
    if (!canEdit(item)) {
      toast.error('Bạn không có quyền sửa user này');
      return;
    }
    setIsEdit(true);
    setEditingUser(item);
    setForm({
      username: item.username,
      password: '', // not editable here
      fullName: item.fullName || '',
      role: item.role, // Keep original role including 'admin'
      status: item.status ?? 'active',
      salary: typeof item.salary === 'number' ? String(item.salary) : '',
      email: item.email || '',
      phoneNumber: item.phoneNumber || '',
      defaultSchedule: Array.isArray(item.defaultSchedule) && item.defaultSchedule.length === 7 ? [...item.defaultSchedule] : [1,1,1,1,1,0,0],
    });
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const toggleDay = (idx: number) => {
    setForm((prev) => {
      const copy = [...prev.defaultSchedule];
      copy[idx] = copy[idx] === 1 ? 0 : 1;
      return { ...prev, defaultSchedule: copy };
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password || !form.fullName) {
      toast.error('Vui lòng điền Username, Password và Họ tên');
      return;
    }
    try {
      startLoading('Đang tạo user...');
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          fullName: form.fullName,
          role: form.role, // manager or staff (manager will be restricted in UI below)
          status: form.status,
          salary: form.salary ? Number(form.salary) : undefined,
          email: form.email || undefined,
          phoneNumber: form.phoneNumber || undefined,
          defaultSchedule: form.defaultSchedule,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Tạo user thành công');
        closeModal();
        fetchUsers();
      } else {
        toast.error(data.error || 'Tạo user thất bại');
      }
    } catch (e) {
      console.error(e);
      toast.error('Có lỗi khi tạo user');
    } finally {
      stopLoading();
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!form.fullName) {
      toast.error('Vui lòng nhập Họ tên');
      return;
    }
    try {
      startLoading('Đang cập nhật...');
      const payload: Partial<{
        fullName: string;
        role: 'admin' | 'manager' | 'staff';
        status: 'probation' | 'active' | 'resigned';
        salary: number;
        email: string;
        phoneNumber: string;
        defaultSchedule: number[];
        password: string;
      }> = {
        fullName: form.fullName,
        salary: form.salary ? Number(form.salary) : undefined,
        email: form.email || undefined,
        phoneNumber: form.phoneNumber || undefined,
        defaultSchedule: form.defaultSchedule,
      };
      // Preserve role - admin can change role, but must send current role if not changing
      if (user?.role === 'admin') {
        payload.role = form.role === 'manager' || form.role === 'staff' ? form.role : (editingUser.role === 'admin' ? 'admin' : 'staff');
      }
      // Both admin/manager can change status
      payload.status = form.status;
      
      // Add password if provided
      const trimmedPassword = form.password?.trim();
      if (trimmedPassword && trimmedPassword.length > 0) {
        payload.password = trimmedPassword;
        console.log('Sending password update for user:', editingUser.username);
      }
      
      console.log('Update payload:', { ...payload, password: payload.password ? '***' : undefined });

      const res = await fetch(`/api/users/${editingUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Cập nhật thành công');
        closeModal();
        fetchUsers();
      } else {
        toast.error(data.error || 'Cập nhật thất bại');
      }
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi khi cập nhật');
    } finally {
      stopLoading();
    }
  };

  const handleDelete = async (item: UserItem) => {
    if (!canDelete(item.role)) {
      toast.error('Bạn không có quyền xóa user này');
      return;
    }
    if (!confirm(`Xóa người dùng ${item.fullName} (${item.username})?`)) return;
    try {
      const res = await withLoading(fetch(`/api/users/${item._id}`, { method: 'DELETE' }));
      const data = await res.json();
      if (data.success) {
        toast.success('Đã xóa người dùng');
        setUsers((prev) => prev.filter((u) => u._id !== item._id));
      } else {
        toast.error(data.error || 'Xóa người dùng thất bại');
      }
    } catch (e) {
      console.error(e);
      toast.error('Có lỗi khi xóa user');
    }
  };

  if (!user || user.role === 'staff') return null;

  const days = ['T2','T3','T4','T5','T6','T7','CN'];
  const statusLabel: Record<'probation'|'active'|'resigned', string> = {
    probation: 'Thử việc',
    active: 'Đang làm',
    resigned: 'Đã nghỉ',
  };
  const statusClass: Record<'probation'|'active'|'resigned', string> = {
    probation: 'bg-amber-50 text-amber-700 border-amber-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    resigned: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              <span className="font-medium">Quay về Dashboard</span>
            </button>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quản lý người dùng</h1>
              {canCreate && (
                <button onClick={openModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition">Thêm người dùng</button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4">Tên đăng nhập</th>
                  <th className="text-left py-3 px-4">Họ tên</th>
                  <th className="text-left py-3 px-4">Vai trò</th>
                  <th className="text-left py-3 px-4">Trạng thái</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">SĐT</th>
                  <th className="text-right py-3 px-4">Lương</th>
                  <th className="text-left py-3 px-4">Lịch mặc định</th>
                  <th className="text-right py-3 px-4">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b">
                    <td className="py-3 px-4 font-mono">{u.username}</td>
                    <td className="py-3 px-4">{u.fullName}</td>
                    <td className="py-3 px-4 capitalize">{u.role}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${statusClass[(u.status ?? 'active')]}`}>
                        {statusLabel[(u.status ?? 'active')]}
                      </span>
                    </td>
                    <td className="py-3 px-4">{u.email || '-'}</td>
                    <td className="py-3 px-4">{u.phoneNumber || '-'}</td>
                    <td className="py-3 px-4 text-right">{typeof u.salary === 'number' ? u.salary.toLocaleString('vi-VN') : '-'}</td>
                    <td className="py-3 px-4">
                      {u.defaultSchedule ? (
                        <div className="flex gap-1 text-xs">
                          {u.defaultSchedule.map((v, idx) => (
                            <span key={idx} className={`px-1.5 py-0.5 rounded ${v===1?'bg-emerald-100 text-emerald-700':'bg-gray-100 text-gray-500'}`}>{days[idx]}</span>
                          ))}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit(u) && (
                          <button
                            onClick={() => openEditModal(u)}
                            className="px-3 py-1.5 bg-amber-500 text-white rounded hover:bg-amber-600"
                          >Sửa</button>
                        )}
                        {canDelete(u.role) && (
                          <button onClick={() => handleDelete(u)} className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700">Xóa</button>
                        )}
                        {!canEdit(u) && !canDelete(u.role) && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
            <div className="relative max-w-lg mx-auto mt-10 bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold mb-4">{isEdit ? 'Sửa người dùng' : 'Thêm người dùng'}</h3>
              <form onSubmit={isEdit ? handleUpdate : handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {!isEdit && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                        <input className="w-full border rounded px-3 py-2" value={form.username} onChange={(e)=>setForm({...form, username:e.target.value})} required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                        <input type="password" className="w-full border rounded px-3 py-2" value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})} required />
                      </div>
                    </>
                  )}
                  {isEdit && (
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới (để trống nếu không đổi)</label>
                      <input type="password" className="w-full border rounded px-3 py-2" value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})} placeholder="Nhập mật khẩu mới" />
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
                    <input className="w-full border rounded px-3 py-2" value={form.fullName} onChange={(e)=>setForm({...form, fullName:e.target.value})} required />
                  </div>
                  {/* Role selection: 
                      - Create: admin can pick manager/staff; manager can only create staff
                      - Edit: only admin can change role; manager cannot change */}
                  {(!isEdit && (user?.role === 'admin' || user?.role === 'manager')) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                      <select
                        className="w-full border rounded px-3 py-2"
                        value={form.role}
                        onChange={(e)=>setForm({...form, role:e.target.value as 'admin'|'manager'|'staff'})}
                      >
                        {user?.role === 'admin' && <option value="manager">Manager</option>}
                        <option value="staff">Staff</option>
                      </select>
                    </div>
                  )}
                  {(isEdit && user?.role === 'admin') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                      <select
                        className="w-full border rounded px-3 py-2"
                        value={form.role}
                        onChange={(e)=>setForm({...form, role:e.target.value as 'admin'|'manager'|'staff'})}
                      >
                        {editingUser?.role === 'admin' && <option value="admin">Admin</option>}
                        <option value="manager">Manager</option>
                        <option value="staff">Staff</option>
                      </select>
                    </div>
                  )}
                  {/* Status selection - visible in both create and edit (admin/manager) */}
                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                      <select
                        className="w-full border rounded px-3 py-2"
                        value={form.status}
                        onChange={(e)=>setForm({...form, status: e.target.value as 'probation'|'active'|'resigned'})}
                      >
                        <option value="probation">Thử việc</option>
                        <option value="active">Đang làm</option>
                        <option value="resigned">Đã nghỉ</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lương (VNĐ)</label>
                    <input type="number" className="w-full border rounded px-3 py-2" value={form.salary} onChange={(e)=>setForm({...form, salary:e.target.value})} min={0} step={1000} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" className="w-full border rounded px-3 py-2" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                    <input className="w-full border rounded px-3 py-2" value={form.phoneNumber} onChange={(e)=>setForm({...form, phoneNumber:e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lịch mặc định</label>
                  <div className="flex flex-wrap gap-2">
                    {days.map((d, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={()=>toggleDay(idx)}
                        className={`px-3 py-1.5 rounded border text-sm ${form.defaultSchedule[idx]===1? 'bg-emerald-50 text-emerald-700 border-emerald-300':'bg-white text-gray-600 border-gray-300'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={closeModal} className="px-4 py-2 rounded border">Hủy</button>
                  <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">{isEdit ? 'Cập nhật' : 'Lưu'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
