import React, { useState, useEffect } from 'react';
import { Household, WeighingSession } from '../types';
import { apiClient } from '../api/client';
import { formatCurrency, formatKg, formatDate, getStatusBadge } from '../utils/formatters';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  History,
  Edit2,
  Trash2,
  X,
  FileText,
  Scale,
} from 'lucide-react';
import { toast } from 'sonner';

interface HouseholdsPageProps {
  onSelectSessionToWeigh: (sessionId: string) => void;
}

export const HouseholdsPage: React.FC<HouseholdsPageProps> = ({ onSelectSessionToWeigh }) => {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // History Drawer
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
  const [historySessions, setHistorySessions] = useState<WeighingSession[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Edit / Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHousehold, setEditingHousehold] = useState<Household | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNote, setFormNote] = useState('');

  const fetchHouseholds = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/households', {
        params: { search: search.trim() || undefined, limit: 100 },
      });
      setHouseholds(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi tải danh sách hộ dân');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHouseholds();
  }, []);

  const handleOpenHistory = async (h: Household) => {
    setSelectedHousehold(h);
    setLoadingHistory(true);
    try {
      const res = await apiClient.get(`/households/${h._id}/history`);
      setHistorySessions(res.data.data.sessions || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi tải lịch sử');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingHousehold(null);
    setFormName('');
    setFormPhone('');
    setFormAddress('');
    setFormNote('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (h: Household) => {
    setEditingHousehold(h);
    setFormName(h.name);
    setFormPhone(h.phone || '');
    setFormAddress(h.address || '');
    setFormNote(h.note || '');
    setIsModalOpen(true);
  };

  const handleSaveHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Tên hộ dân là bắt buộc');
      return;
    }

    try {
      const payload = {
        name: formName.trim(),
        phone: formPhone.trim(),
        address: formAddress.trim(),
        note: formNote.trim(),
      };

      if (editingHousehold) {
        await apiClient.put(`/households/${editingHousehold._id}`, payload);
        toast.success('Đã cập nhật thông tin hộ dân');
      } else {
        await apiClient.post('/households', payload);
        toast.success('Đã thêm hộ dân mới');
      }

      setIsModalOpen(false);
      fetchHouseholds();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi lưu thông tin');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirm = window.confirm(`Bạn có chắc chắn muốn xóa hồ sơ hộ dân "${name}"?`);
    if (!confirm) return;

    try {
      const res = await apiClient.delete(`/households/${id}`);
      if (res.data.success) {
        toast.success('Đã xóa hộ dân');
        fetchHouseholds();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể xóa hộ dân');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Quản Lý Danh Bạ Hộ Dân
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Danh bạ bà con nông dân, theo dõi sản lượng lũy kế và lịch sử các đợt cân
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-brand-600/20 flex items-center gap-2 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Hộ Dân Mới</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchHouseholds();
          }}
          className="relative"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hộ dân, số điện thoại, ấp/xã..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-brand-500"
          />
        </form>
      </div>

      {/* Grid of Farmer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {households.map((h) => (
          <div
            key={h._id}
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-400 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-400 font-bold flex items-center justify-center text-sm">
                    {h.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                      {h.name}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Phone className="w-3 h-3" />
                      <span>{h.phone || 'Chưa có SĐT'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(h)}
                    className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(h._id, h.name)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {h.address && (
                <div className="flex items-start gap-1.5 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                  <span className="line-clamp-2">{h.address}</span>
                </div>
              )}

              {h.note && (
                <div className="text-[11px] text-slate-400 italic mt-1">
                  "{h.note}"
                </div>
              )}
            </div>

            {/* Cumulative stats */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Đã bán vựa:</span>
                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatKg(h.totalWeighedKg)} kg
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Đã thanh toán:</span>
                  <div className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {formatCurrency(h.totalPaidAmount)}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenHistory(h)}
                className="w-full mt-3 py-2 bg-slate-50 hover:bg-brand-50 dark:bg-slate-800 dark:hover:bg-brand-950/40 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <History className="w-3.5 h-3.5" />
                <span>Xem Lịch Sử Cân ({h.sessionCount || 0} phiếu)</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* History Drawer Modal */}
      {selectedHousehold && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Lịch Sử Cân Lúa: {selectedHousehold.name}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedHousehold.phone} — {selectedHousehold.address}</p>
                </div>
              </div>
              <button onClick={() => setSelectedHousehold(null)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {loadingHistory ? (
                <div className="text-center py-10 text-slate-400 text-xs">Đang tải lịch sử...</div>
              ) : historySessions.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">Hộ dân này chưa có phiếu cân nào</div>
              ) : (
                historySessions.map((s) => {
                  const badge = getStatusBadge(s.status);
                  return (
                    <div
                      key={s._id}
                      className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-brand-600">{s.code}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                          Giống lúa: {s.riceTypeNameSnapshot} ({formatCurrency(s.pricePerKg)}/kg)
                        </div>
                        <div className="text-[11px] text-slate-400">Ngày cân: {formatDate(s.weighDate)}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black font-mono text-emerald-600">
                          {formatKg(s.totalWeightKg)} kg
                        </div>
                        <div className="text-xs font-bold font-mono text-amber-600">
                          {formatCurrency(s.totalAmount)}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedHousehold(null);
                            onSelectSessionToWeigh(s._id);
                          }}
                          className="text-[11px] font-bold text-brand-600 hover:underline mt-1 inline-block"
                        >
                          Mở phiếu ➔
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Household Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingHousehold ? 'Chỉnh Sửa Hồ Sơ Hộ Dân' : 'Thêm Hộ Dân Mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHousehold} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Họ và tên hộ nông dân *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="VD: Bác Bảy Ruộng..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="VD: 0918 234 567..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Địa chỉ / Ấp / Xã / Tỉnh
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="VD: Ấp 2, Xã Phú Điền, Tháp Mười, Đồng Tháp..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Ghi chú (diện tích, giống canh tác...)
                </label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="VD: Canh tác 5 hecta ST25..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md"
                >
                  {editingHousehold ? 'Lưu Thay Đổi' : 'Thêm Hộ Dân'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
