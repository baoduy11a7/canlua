import React, { useState, useEffect } from 'react';
import { DashboardSummary } from '../types';
import { apiClient } from '../api/client';
import { formatCurrency, formatKg, formatDate } from '../utils/formatters';
import {
  Scale,
  DollarSign,
  Warehouse,
  Users,
  TrendingUp,
  FileCheck,
  Package,
  Award,
  ArrowUpRight,
  Calendar,
  Filter,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { toast } from 'sonner';

interface DashboardPageProps {
  onNavigateToWeighing: (sessionId?: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToWeighing,
  onNavigateToTab,
}) => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Date Range Filters
  const [rangePreset, setRangePreset] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const fetchSummary = async () => {
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

      const res = await apiClient.get('/dashboard/summary', { params });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi tải dữ liệu tổng quan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [rangePreset, selectedMonth, selectedYear]);

  const handleCustomFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSummary();
  };

  const periodStats = data?.period || data?.month || {
    weighedKg: 0,
    purchaseCost: 0,
    sessionCount: 0,
    revenue: 0,
    expenses: 0,
    netProfit: 0,
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner with Quick Action */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-brand-700 via-emerald-800 to-slate-900 text-white shadow-xl shadow-brand-900/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-200 text-xs font-bold uppercase tracking-wider">
            <span>🌾 Vụ Mùa 2026 — Đang Thu Hoạch Rộ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            Bảng Tin Điều Hành Vựa Lúa
          </h1>
          <p className="text-xs text-brand-100/80 max-w-xl mt-1">
            Cập nhật tức thời khối lượng cân, tình hình tồn kho các giống lúa và doanh thu
          </p>
        </div>

        <button
          onClick={() => onNavigateToWeighing()}
          className="px-6 py-3 bg-white hover:bg-brand-50 text-brand-800 rounded-2xl font-bold text-sm shadow-lg shadow-black/20 flex items-center gap-2 active:scale-95 transition-all"
        >
          <Scale className="w-5 h-5 text-brand-600" />
          <span>Vào Bàn Cân Lúa</span>
        </button>
      </div>

      {/* Date Range Selector Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Calendar className="w-4 h-4 text-brand-600" />
          <span>Kỳ Báo Cáo Thống Kê:</span>
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
                    ? 'bg-brand-600 text-white shadow-sm'
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
                className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold"
              >
                Lọc
              </button>
            </form>
          )}

          <button
            onClick={fetchSummary}
            title="Làm mới số liệu"
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* 4 Main KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Today Weighed */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Lúa Cân Hôm Nay
                </span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Scale className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-slate-100">
                  {formatKg(data.today.weighedKg)} <span className="text-sm font-semibold text-emerald-600">Kg</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>{data.today.sessionCount} phiếu cân</span>
                  <span>•</span>
                  <span className="font-mono text-emerald-600 font-semibold">{formatCurrency(data.today.purchaseCost)}</span>
                </div>
              </div>
            </div>

            {/* Selected Period Weighed */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Tổng Cân ({rangePreset === 'today' ? 'Hôm Nay' : rangePreset === 'week' ? 'Tuần Này' : rangePreset === 'year' ? `Năm ${selectedYear}` : `Tháng ${selectedMonth}/${selectedYear}`})
                </span>
                <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-slate-100">
                  {formatKg(periodStats.weighedKg / 1000, 2)} <span className="text-sm font-semibold text-brand-600">Tấn</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <span>Tiền mua:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {formatCurrency(periodStats.purchaseCost)}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Inventory Stock */}
            <div
              onClick={() => onNavigateToTab('warehouse')}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group cursor-pointer hover:border-brand-500 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Tồn Kho Hiện Tại
                </span>
                <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Warehouse className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black font-mono text-teal-600 dark:text-teal-400">
                  {formatKg(data.inventory.totalKg / 1000, 2)} <span className="text-sm font-semibold">Tấn</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                  <span>{data.inventory.items.length} mặt hàng trong kho</span>
                  <ArrowUpRight className="w-4 h-4 text-teal-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </div>

            {/* Net Profit */}
            <div
              onClick={() => onNavigateToTab('finance')}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group cursor-pointer hover:border-brand-500 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Lợi Nhuận Kỳ Này
                </span>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black font-mono text-amber-500 dark:text-amber-400">
                  {formatCurrency(periodStats.netProfit)}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                  <span>Doanh thu: {formatCurrency(periodStats.revenue)}</span>
                  <ArrowUpRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Middle Section: Trend Chart & Inventory Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Khối Lượng Lúa Cân 7 Ngày Qua
                </h3>
                <p className="text-xs text-slate-500">Biến động sản lượng thu mua hàng ngày (Kg)</p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.chartTrend}>
                    <defs>
                      <linearGradient id="weighedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => `${v}kg`}
                    />
                    <Tooltip
                      formatter={(val: any) => [`${formatKg(val)} kg`, 'Khối lượng']}
                      labelFormatter={(l) => `Ngày ${l}`}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="weighedKg"
                      stroke="#16a34a"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#weighedGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stock by Rice Variety */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Tồn Kho Theo Loại Lúa
                </h3>
                <p className="text-xs text-slate-500">Số lượng lúa thực tế trong các kho</p>
              </div>

              <div className="space-y-3">
                {data.inventory.items.map((item) => {
                  const pct = data.inventory.totalKg > 0
                    ? Math.round((item.currentQuantityKg / data.inventory.totalKg) * 100)
                    : 0;
                  return (
                    <div key={item._id} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-800 dark:text-slate-200">
                          {item.riceTypeName} {item.warehouseName ? `(${item.warehouseName})` : ''}
                        </span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400">
                          {formatKg(item.currentQuantityKg)} kg ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-500 to-emerald-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Section: Top Farmer Suppliers */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Top Hộ Dân Cung Cấp Lúa Nhiều Nhất
                  </h3>
                  <p className="text-xs text-slate-500">Nông dân thân thiết và sản lượng lũy kế</p>
                </div>
              </div>

              <button
                onClick={() => onNavigateToTab('households')}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
              >
                Xem tất cả hộ dân ➔
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 pl-2">Hạng</th>
                    <th className="pb-3">Họ và Tên Hộ Dân</th>
                    <th className="pb-3">SĐT & Địa Chỉ</th>
                    <th className="pb-3 text-right">Số Phiếu</th>
                    <th className="pb-3 text-right">Tổng Sản Lượng (Kg)</th>
                    <th className="pb-3 text-right pr-2">Tổng Tiền Đã Nhận</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.topHouseholds.map((h, idx) => (
                    <tr key={h._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 pl-2 font-bold font-mono">
                        <span
                          className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-800 font-black'
                              : idx === 1
                              ? 'bg-slate-200 text-slate-800'
                              : idx === 2
                              ? 'bg-orange-100 text-orange-800'
                              : 'text-slate-500'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-slate-900 dark:text-slate-100">
                        {h.name}
                      </td>
                      <td className="py-3 text-slate-500">
                        <div>{h.phone || '—'}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{h.address || '—'}</div>
                      </td>
                      <td className="py-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {h.sessionCount}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatKg(h.totalWeighedKg)} kg
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400 pr-2">
                        {formatCurrency(h.totalPaidAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
