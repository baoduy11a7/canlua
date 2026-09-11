import React, { useState, useEffect } from 'react';
import { Expense } from '../types';
import { apiClient } from '../api/client';
import { formatCurrency, formatDate } from '../utils/formatters';
import { AddExpenseModal } from '../components/modals/AddExpenseModal';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  FileSpreadsheet,
  Plus,
  Trash2,
  Calendar,
  PieChart as PieIcon,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

export const FinancePage: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Date Filters
  const [rangePreset, setRangePreset] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const params: any = { range: rangePreset };
      if (rangePreset === 'month') {
        params.month = selectedMonth;
        params.year = selectedYear;
      } else if (rangePreset === 'year') {
        params.year = selectedYear;
      } else if (rangePreset === 'custom') {
        if (customFrom) params.from = customFrom;
        if (customTo) params.to = customTo;
      }

      const [profitRes, expRes] = await Promise.all([
        apiClient.get('/finance/profit', { params }),
        apiClient.get('/finance/expenses', { params: { ...params, limit: 50 } }),
      ]);
      setReport(profitRes.data.data || null);
      setExpenses(expRes.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi tải báo cáo tài chính');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, [rangePreset, selectedMonth, selectedYear]);

  const handleCustomFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFinanceData();
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const params: any = { range: rangePreset };
      if (rangePreset === 'month') {
        params.month = selectedMonth;
        params.year = selectedYear;
      } else if (rangePreset === 'year') {
        params.year = selectedYear;
      } else if (rangePreset === 'custom') {
        if (customFrom) params.from = customFrom;
        if (customTo) params.to = customTo;
      }

      const response = await apiClient.get('/finance/export-excel', {
        params,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bao_Cao_Tai_Chinh_Can_Lua_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Đã tải xuống file Excel báo cáo tài chính thành công!');
    } catch (err) {
      toast.error('Lỗi khi xuất file Excel');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Xác nhận xóa khoản chi phí này?')) return;
    try {
      await apiClient.delete(`/finance/expenses/${id}`);
      toast.success('Đã xóa khoản chi');
      fetchFinanceData();
    } catch (err) {
      toast.error('Lỗi khi xóa khoản chi');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Báo Cáo Doanh Thu & Lợi Nhuận
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp doanh thu xuất bán, chi phí thu mua lúa và chi phí vận hành
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            disabled={exportingExcel}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-xs shadow-md shadow-emerald-700/20 flex items-center gap-2 active:scale-95 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{exportingExcel ? 'Đang xuất...' : 'Xuất File Excel (.xlsx)'}</span>
          </button>

          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-brand-600/20 flex items-center gap-2 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Chi Phí Vận Hành</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>Thời Gian Thống Kê:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            {[
              { id: 'today', label: 'Hôm nay' },
              { id: 'week', label: 'Tuần này' },
              { id: 'month', label: 'Tháng' },
              { id: 'year', label: 'Năm' },
              { id: 'custom', label: 'Tùy chỉnh' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setRangePreset(p.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  rangePreset === p.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Month / Year Sub-pickers */}
          {rangePreset === 'month' && (
            <div className="flex items-center gap-1.5">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    Năm {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          {rangePreset === 'year' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  Năm {y}
                </option>
              ))}
            </select>
          )}

          {rangePreset === 'custom' && (
            <form onSubmit={handleCustomFilterSubmit} className="flex items-center gap-1.5">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
              <span className="text-xs text-slate-400">➔</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
              >
                Lọc
              </button>
            </form>
          )}

          <button
            onClick={fetchFinanceData}
            title="Làm mới số liệu"
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Profit Cards Formula */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Doanh Thu Xuất Bán
              </span>
              <div className="w-9 h-9 rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black font-mono text-teal-600 dark:text-teal-400">
                {formatCurrency(report.totalRevenue)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Xuất bán lúa thương phẩm</p>
            </div>
          </div>

          {/* Cost of Goods */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                2. Tiền Thu Mua Lúa
              </span>
              <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                {formatCurrency(report.totalCostOfGoods)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Tổng tiền trả cho hộ dân</p>
            </div>
          </div>

          {/* Expenses */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                3. Chi Phí Vận Hành
              </span>
              <div className="w-9 h-9 rounded-2xl bg-red-50 dark:bg-red-950 text-red-600 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black font-mono text-red-500 dark:text-red-400">
                {formatCurrency(report.totalExpenses)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Bốc xếp, xe tải, bao bì, điện...</p>
            </div>
          </div>

          {/* Net Profit */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-700/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                4. Lợi Nhuận Ròng
              </span>
              <div className="w-9 h-9 rounded-2xl bg-white/20 text-white flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black font-mono text-white">
                {formatCurrency(report.netProfit)}
              </div>
              <p className="text-xs text-emerald-100/80 mt-1">= (1) - (2) - (3)</p>
            </div>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Sổ Nhật Ký Chi Phí Vận Hành
              </h3>
              <p className="text-xs text-slate-500">Các khoản chi bốc vác, xe cộ, xăng dầu, nhân công</p>
            </div>
          </div>

          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="px-4 py-2 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 rounded-xl text-xs font-bold hover:bg-brand-100 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm khoản chi</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 pl-2">Mã & Ngày</th>
                <th className="pb-3">Danh Mục Chi</th>
                <th className="pb-3">Người Nhận / Đơn Vị</th>
                <th className="pb-3">Nội Dung Chi Tiết</th>
                <th className="pb-3 text-right">Số Tiền</th>
                <th className="pb-3 text-right pr-2">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Chưa có khoản chi nào được ghi nhận trong kỳ này
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 pl-2 font-mono font-bold">
                      <div>{exp.code}</div>
                      <div className="text-[10px] text-slate-400">{formatDate(exp.date)}</div>
                    </td>
                    <td className="py-3.5">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                        {exp.categoryName}
                      </span>
                    </td>
                    <td className="py-3.5 font-bold text-slate-800 dark:text-slate-200">
                      {exp.recipient || '—'}
                    </td>
                    <td className="py-3.5 text-slate-500 max-w-xs truncate">
                      {exp.note || '—'}
                    </td>
                    <td className="py-3.5 text-right font-mono font-black text-red-500 text-sm">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3.5 text-right pr-2">
                      <button
                        onClick={() => handleDeleteExpense(exp._id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSuccess={fetchFinanceData}
      />
    </div>
  );
};
