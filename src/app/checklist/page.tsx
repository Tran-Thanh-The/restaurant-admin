'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useMemo, useState, memo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

type ChecklistType = 'checkbox' | 'money' | 'report' | 'info';
type SectionKey = 'opening' | 'during' | 'closing';

interface ChecklistItemDef {
  key: string;
  label: string;
  type: ChecklistType;
  section: SectionKey;
  hint?: string;
  details?: string[];
}

// Frontend-defined checklist items (can add more keys later)
const CHECKLIST_ITEMS: ChecklistItemDef[] = [
  // Thời điểm mở cửa (17h - 17h30)
  {
    key: 'open_supplies_check_report',
    label: 'Kiểm tra nguyên vật liệu, vật tư (cần báo cáo)',
    type: 'report',
    section: 'opening',
    details: [
      'Kiểm tra xem các vật tư có đủ để phục vụ khách ngày hôm nay hay không? => Vật tư nào thiếu cần nhắn báo vào nhóm',
      'Danh sách vật tư cần kiểm tra: Thông tin vật tư (https://docs.google.com/spreadsheets/d/1v3_gz7fwwMYnqS_NqYlC8u2cJLwgo49dkiWD2Nhw29c/edit?gid=2144989111#gid=2144989111)'
    ],
    hint: ''
  },
  {
    key: 'open_setup',
    label: 'Chuẩn đồ mở quán',
    type: 'checkbox',
    section: 'opening',
    details: [
      '1. Sắp xếp bàn ghế',
      '2. Mang đèn vẫy ra vỉa hè',
      '3. Chuẩn bị sẵn bếp, xe đẩy đèn điện',
      '4. Bọc túi rác vào các thùng'
    ]
  },
  {
    key: 'open_food_prep',
    label: 'Chuẩn bị đồ ăn',
    type: 'checkbox',
    section: 'opening',
    details: [
      '1. Lấy các món ăn từ ngăn đông ra xếp vào khay (khoảng 21-24 món, có thể mix món hoặc trùng món)',
      '2. Dùng tem đánh dấu hộp đựng món ăn cũ',
      '3. Bày ra bàn và chụp lại hình ảnh gửi vào nhóm'
    ]
  },
  {
    key: 'open_condiments_prep',
    label: 'Đổ thêm nước chấm vào các chai nếu hết',
    type: 'checkbox',
    section: 'opening',
    details: [
      '1. Pha nước ngọt dạng hộp',
      '2. Mang nước ngọt dạng chai ra bàn',
      '3. Mang đá ra thùng',
      '4. Mang cốc, đĩa, giấy thêm dầu, bát nước chấm ra bàn'
    ]
  },
  {
    key: 'open_cash_count',
    label: 'Kiểm tra tiền mặt tại quán (VND)',
    type: 'money',
    section: 'opening',
    hint: ''
  },
  {
    key: 'open_other_receive_shipper',
    label: 'Nhận đồ từ shipper',
    type: 'checkbox',
    section: 'opening'
  },
  {
    key: 'open_other_check_inbound',
    label: 'Kiểm hàng (nếu là món ăn/gói xiên thì kiểm số lượng và báo lại)',
    type: 'checkbox',
    section: 'opening'
  },

  // Thời điểm trong thời gian bán
  {
    key: 'during_guide_customers',
    label: 'Hướng dẫn khách hàng chọn món',
    type: 'checkbox',
    section: 'during',
    hint: 'Xếp chỗ, hướng dẫn khách chọn món/buffet/nước chấm'
  },
  { key: 'during_cook', label: 'Đứng bếp', type: 'checkbox', section: 'during', hint: '' },
  { key: 'during_wash_dishes', label: 'Rửa bát', type: 'checkbox', section: 'during', hint: '' },
  { key: 'during_cashier', label: 'Thu ngân', type: 'checkbox', section: 'during', hint: '' },
  { key: 'during_serve_food', label: 'Mang đồ ăn ra cho khách hàng', type: 'checkbox', section: 'during', hint: 'Ưu tiên nhờ KH tự lấy; nếu không thì NV mang ra' },
  { key: 'during_refill', label: 'Fill đồ vào khay, nước chấm, buffet nước', type: 'checkbox', section: 'during', hint: '' },
  { key: 'during_parking_guide', label: 'Hướng dẫn khách để xe', type: 'checkbox', section: 'during', hint: '' },

  // Thời điểm dọn hàng đóng cửa (22h - 22h30)
  { key: 'closing_after_22_policy', label: 'Nhận khách sau 22h: Chỉ nhận khách mua mang về', type: 'info', section: 'closing' },
  { key: 'closing_notify_customers', label: 'Thông báo chuẩn bị đóng cửa', type: 'checkbox', section: 'closing' },
  { key: 'closing_wash_dishes', label: 'Rửa bát', type: 'checkbox', section: 'closing', hint: '' },
  { key: 'close_cash_count', label: 'Kiểm kê lại tiền mặt (VND)', type: 'money', section: 'closing', hint: '' },
  { key: 'closing_clean_tables', label: 'Quét dọn, xếp lại bàn ghế ngay ngắn', type: 'checkbox', section: 'closing' },
  { key: 'closing_handle_leftovers', label: 'Xử lý dầu mỡ thừa, đồ ăn thừa,...', type: 'checkbox', section: 'closing', hint: '' },
  { key: 'closing_take_out_trash', label: 'Đổ rác', type: 'checkbox', section: 'closing' },
  {
    key: 'closing_audit_report',
    label: 'Kiểm kê, rà soát (cần báo cáo)',
    type: 'report',
    section: 'closing',
    details: [
      'Quản lý kiểm tra danh sách vật tư: Thông tin vật tư (https://docs.google.com/spreadsheets/d/1v3_gz7fwwMYnqS_NqYlC8u2cJLwgo49dkiWD2Nhw29c/edit?gid=2144989111#gid=2144989111)',
      'Rà soát các công việc (đổ rác, rửa bát, kiểm kê, ...) đã hoàn thành',
      'Thực hiện báo lại team theo hướng dẫn'
    ],
    hint: 'Chọn “Đã báo cáo” nếu đã rà soát và báo cáo'
  },
  { key: 'closing_lockup', label: 'Đóng quán', type: 'checkbox', section: 'closing', hint: 'Đóng quán, kiểm tra khóa cửa, ổ điện' },
];

function getDateKeyLocal(date = new Date()): string {
  // Build YYYY-MM-DD in local timezone
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

type ChecklistData = Record<string, unknown>;
type ValuesMap = Record<string, boolean | string>;

interface ChecklistDoc {
  _id: string;
  dateKey: string;
  data: ChecklistData;
}

export default function ChecklistPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doc, setDoc] = useState<ChecklistDoc | null>(null);

  // React Hook Form
  const { control, handleSubmit, reset } = useForm<ValuesMap>({
    defaultValues: {}
  });

  const grouped = useMemo(() => {
    const map: Record<SectionKey, ChecklistItemDef[]> = {
      opening: [],
      during: [],
      closing: [],
    };
    for (const item of CHECKLIST_ITEMS) {
      map[item.section].push(item);
    }
    return map;
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const dateKey = getDateKeyLocal();
        const res = await fetch(`/api/checklists?date=${dateKey}`);
        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error || 'Không tải được dữ liệu');
        }
        const data = json.data as { _id: string; dateKey: string; data: ChecklistData };
        setDoc({ _id: data._id, dateKey: data.dateKey, data: data.data || {} });
        // Initialize form values with defaults if missing
        const init: ValuesMap = {};
        for (const item of CHECKLIST_ITEMS) {
          const cur = (data.data || {})[item.key];
          if (item.type === 'checkbox') init[item.key] = typeof cur === 'boolean' ? cur : false;
          else if (item.type === 'money') init[item.key] = typeof cur === 'number' ? String(cur) : '';
          else if (item.type === 'report') init[item.key] = cur === 'reported' ? 'reported' : 'none';
          // info has no persisted value
        }
        reset(init);
      } catch (e) {
        console.error(e);
        toast.error('Có lỗi khi tải dữ liệu công việc hôm nay');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [reset]);

  const handleSave = async (formData: ValuesMap) => {
    if (!doc) return;
    setSaving(true);
    try {
      // Build payload converting fields appropriately
      const payload: Record<string, unknown> = {};
      for (const item of CHECKLIST_ITEMS) {
        const v = formData[item.key];
        if (item.type === 'checkbox') payload[item.key] = !!v;
        else if (item.type === 'money') payload[item.key] = v === '' || v === null || v === undefined ? null : Number(v);
        else if (item.type === 'report') payload[item.key] = v === 'reported' ? 'reported' : 'none';
      }
      const res = await fetch(`/api/checklists/${doc._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Đã lưu công việc hôm nay');
      } else {
        toast.error(json.error || 'Lưu thất bại');
      }
    } catch (e) {
      console.error(e);
      toast.error('Có lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  };

  const renderDetail = (line: string, idx: number) => {
    const urlMatch = line.match(/https?:\/\/\S+/);
    if (urlMatch) {
      const url = urlMatch[0];
      const before = line.slice(0, urlMatch.index);
      const after = line.slice((urlMatch.index || 0) + url.length);
      return (
        <li key={idx} className="text-base text-gray-600">
          {before}
          <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">{url}</a>
          {after}
        </li>
      );
    }
    return <li key={idx} className="text-base text-gray-600">{line}</li>;
  };

  // Memoized individual checklist item component
  const ChecklistItem = memo(({ item, name }: { item: ChecklistItemDef; name: string }) => {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div>
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex-shrink-0 flex items-center pt-0.5">
                {item.type === 'checkbox' && (
                  <input
                    type="checkbox"
                    className="h-5 w-5"
                    checked={!!field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800 text-lg">{item.label}</div>
                {item.hint && <div className="text-base text-gray-500 mt-0.5">{item.hint}</div>}
                {item.details && item.details.length > 0 && (
                  <ul className="list-disc pl-5 mt-1 space-y-0.5 break-words">
                    {item.details.map((line, idx) => renderDetail(line, idx))}
                  </ul>
                )}
              </div>
              {item.type !== 'report' && (
                <div className="flex-shrink-0 sm:min-w-[140px] flex items-center justify-start sm:justify-end">
                  {item.type === 'info' && (
                    <div className="text-sm text-gray-500">(Thông tin)</div>
                  )}
                  {item.type === 'money' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={1000}
                        className="w-40 sm:w-44 border rounded px-3 py-2 text-right text-lg"
                        placeholder="0"
                        value={(field.value as string) ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                      <span className="text-gray-600 text-base">VND</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            {item.type === 'report' && (
              <div className="mt-2 ml-8 flex items-center gap-2 sm:ml-0 sm:justify-end">
                <button
                  type="button"
                  className={`px-4 py-2 rounded border text-base ${field.value !== 'reported' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-gray-600 border-gray-300'}`}
                  onClick={() => field.onChange('none')}
                >
                  Không có
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 rounded border text-base ${field.value === 'reported' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white text-gray-600 border-gray-300'}`}
                  onClick={() => field.onChange('reported')}
                >
                  Đã báo cáo
                </button>
              </div>
            )}
          </div>
        )}
      />
    );
  });

  ChecklistItem.displayName = 'ChecklistItem';

  const Section = memo(function Section({ title, items }: { 
    title: string; 
    items: ChecklistItemDef[];
  }) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">{title}</h2>
        <div className="space-y-4">
          {items.map((it) => (
            <ChecklistItem key={it.key} item={it} name={it.key} />
          ))}
        </div>
      </div>
    );
  });


  if (!user) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            <span className="font-medium">Quay về Dashboard</span>
          </button>

          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold">Công việc hôm nay</h1>
            <div className="text-gray-600 text-lg">Ngày: <span className="font-medium">{getDateKeyLocal()}</span></div>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2">Đang tải...</p>
            </div>
          ) : !doc ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">Không có dữ liệu</div>
          ) : (
            <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
              <Section title="Thời điểm mở cửa (17h - 17h30)" items={grouped.opening} />
              <Section title="Thời điểm trong thời gian bán" items={grouped.during} />
              <Section title="Thời điểm dọn hàng đóng cửa (22h - 22h30)" items={grouped.closing} />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 rounded bg-blue-600 text-white disabled:opacity-50 text-lg font-medium"
                >
                  {saving ? 'Đang lưu...' : 'Lưu' }
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
