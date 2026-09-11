import React, { useState, useEffect } from 'react';
import { WeighingSession } from '../types';
import { apiClient } from '../api/client';
import { formatCurrency, formatKg, formatDateTime, getStatusBadge } from '../utils/formatters';
import {
  Search,
  Filter,
  FileText,
  Printer,
  Trash2,
  Unlock,
  Plus,
  Scale,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

interface SessionsListPageProps {
  onSelectSessionToWeigh: (sessionId: string) => void;
  onOpenNewSession: () => void;
}

export const SessionsListPage: React.FC<SessionsListPageProps> = ({
  onSelectSessionToWeigh,
  onOpenNewSession,
}) => {
  const [sessions, setSessions] = useState<WeighingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/weighing-sessions', {
        params: {
          search: search.trim() || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          limit: 50,
        },
      });
      setSessions(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi tải danh sách phiếu cân');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSessions();
  };

  const handleDelete = async (id: string, code: string) => {
    const confirm = window.confirm(`Bạn có chắc chắn muốn xóa phiếu cân ${code}?`);
    if (!confirm) return;

    try {
      const res = await apiClient.delete(`/weighing-sessions/${id}`);
      if (res.data.success) {
        toast.success('Đã xóa phiếu cân');
        fetchSessions();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa phiếu');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Danh Sách Phiếu Cân Lúa
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý toàn bộ lịch sử các phiên cân, tìm kiếm và in ấn
          </p>
        </div>

        <button
          onClick={onOpenNewSession}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-brand-600/20 flex items-center gap-2 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Phiếu Mới</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[260px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tìm theo mã phiếu, tên hộ dân, SĐT, loại lúa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-brand-500"
          />
        </form>

        {/* Status Tab Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'open', label: 'Đang cân' },
            { id: 'closed', label: 'Đã chốt' },
            { id: 'paid', label: 'Đã thanh toán' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === tab.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 pl-6">Mã Phiếu</th>
                <th className="py-3.5">Hộ Dân / Người Bán</th>
                <th className="py-3.5">Giống Lúa</th>
                <th className="py-3.5">Đơn Giá</th>
                <th className="py-3.5 text-center">Số Bao</th>
                <th className="py-3.5 text-right">Khối Lượng Tịnh</th>
                <th className="py-3.5 text-right">Thành Tiền</th>
                <th className="py-3.5 text-center">Trạng Thái</th>
                <th className="py-3.5 pr-6 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Không tìm thấy phiếu cân nào phù hợp
                  </td>
                </tr>
              ) : (
                sessions.map((s) => {
                  const badge = getStatusBadge(s.status);
                  return (
                    <tr
                      key={s._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Code & Date */}
                      <td className="py-4 pl-6">
                        <span className="font-mono font-bold text-brand-700 dark:text-brand-400 text-xs">
                          {s.code}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {formatDateTime(s.weighDate)}
                        </div>
                      </td>

                      {/* Household */}
                      <td className="py-4">
                        <strong className="text-slate-900 dark:text-slate-100 font-bold">
                          {s.householdNameSnapshot}
                        </strong>
                        {s.householdPhoneSnapshot && (
                          <div className="text-[11px] text-slate-400 font-mono">
                            {s.householdPhoneSnapshot}
                          </div>
                        )}
                      </td>

                      {/* Rice Variety */}
                      <td className="py-4 font-semibold text-emerald-700 dark:text-emerald-400">
                        {s.riceTypeNameSnapshot}
                      </td>

                      {/* Unit Price */}
                      <td className="py-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {formatCurrency(s.pricePerKg)}
                      </td>

                      {/* Bags */}
                      <td className="py-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        {s.totalWeighCount}
                      </td>

                      {/* Weight */}
                      <td className="py-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {formatKg(s.totalWeightKg)} kg
                      </td>

                      {/* Total Amount */}
                      <td className="py-4 text-right font-mono font-black text-amber-600 dark:text-amber-400">
                        {formatCurrency(s.totalAmount)}
                      </td>

                      {/* Status */}
                      <td className="py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 pr-6 text-right space-x-1">
                        <button
                          onClick={() => onSelectSessionToWeigh(s._id)}
                          title="Vào bàn cân nhập liệu"
                          className="p-1.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/60 rounded-lg transition-colors"
                        >
                          <Scale className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(s._id, s.code)}
                          title="Xóa phiếu"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
