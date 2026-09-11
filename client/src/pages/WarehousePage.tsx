import React, { useState, useEffect } from 'react';
import { InventoryItem, WarehouseLocation, WarehouseTransaction } from '../types';
import { apiClient } from '../api/client';
import { formatCurrency, formatKg, formatDateTime } from '../utils/formatters';
import { WarehouseExportModal } from '../components/modals/WarehouseExportModal';
import { WarehouseModal } from '../components/modals/WarehouseModal';
import {
  Warehouse,
  TrendingUp,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Package,
  MapPin,
  Phone,
  User,
  Edit2,
  Trash2,
  CheckCircle,
  Building2,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

export const WarehousePage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'locations' | 'history'>('inventory');

  const [warehouses, setWarehouses] = useState<WarehouseLocation[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<WarehouseTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseLocation | null>(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [whRes, invRes, txRes] = await Promise.all([
        apiClient.get('/warehouse/locations'),
        apiClient.get('/warehouse/inventory', {
          params: { warehouseId: selectedWarehouseFilter !== 'all' ? selectedWarehouseFilter : undefined },
        }),
        apiClient.get('/warehouse/transactions', {
          params: {
            warehouseId: selectedWarehouseFilter !== 'all' ? selectedWarehouseFilter : undefined,
            type: typeFilter !== 'all' ? typeFilter : undefined,
            search: search.trim() || undefined,
            limit: 50,
          },
        }),
      ]);
      setWarehouses(whRes.data.data || []);
      setInventoryList(invRes.data.data || []);
      setTransactions(txRes.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi tải dữ liệu kho lúa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [selectedWarehouseFilter, typeFilter]);

  const handleOpenCreateWarehouse = () => {
    setEditingWarehouse(null);
    setIsWarehouseModalOpen(true);
  };

  const handleOpenEditWarehouse = (wh: WarehouseLocation) => {
    setEditingWarehouse(wh);
    setIsWarehouseModalOpen(true);
  };

  const handleDeleteWarehouse = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa "${name}"?`)) return;
    try {
      await apiClient.delete(`/warehouse/locations/${id}`);
      toast.success('Đã xóa kho khỏi danh sách hoạt động');
      fetchAllData();
    } catch (err) {
      toast.error('Lỗi khi xóa kho');
    }
  };

  const totalStockKg = inventoryList.reduce((sum, item) => sum + item.currentQuantityKg, 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Quản Lý Hệ Thống Kho & Tồn Lúa
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý các điểm kho vựa lúa, theo dõi nhập/xuất/tồn theo từng giống lúa
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreateWarehouse}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-xs shadow-sm flex items-center gap-2 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Kho Mới</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-teal-600/20 flex items-center gap-2 active:scale-95 transition-all"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Xuất Kho Bán Lúa</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'inventory'
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/25'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Tồn Kho Theo Giống Lúa</span>
        </button>

        <button
          onClick={() => setActiveSubTab('locations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'locations'
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/25'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Danh Sách Các Điểm Kho ({warehouses.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'history'
              ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/25'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Lịch Sử Nhập / Xuất Kho</span>
        </button>
      </div>

      {/* TAB 1: INVENTORY CARDS */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-4">
          {/* Warehouse Filter Selector */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Warehouse className="w-4 h-4 text-teal-600" />
              <span>Lọc theo kho lúa:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedWarehouseFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedWarehouseFilter === 'all'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Tất cả các kho
              </button>
              {warehouses.map((wh) => (
                <button
                  key={wh._id}
                  onClick={() => setSelectedWarehouseFilter(wh._id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedWarehouseFilter === wh._id
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {wh.name} {wh.isDefault ? '⭐' : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tổng Tồn Kho: <strong className="text-teal-600 font-mono text-sm">{formatKg(totalStockKg / 1000, 2)} Tấn</strong> ({formatKg(totalStockKg)} kg)
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventoryList.map((item) => {
              const isLowStock = item.currentQuantityKg < item.minWarningKg;
              return (
                <div
                  key={item._id}
                  className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm transition-all ${
                    isLowStock
                      ? 'border-amber-400 dark:border-amber-700 bg-amber-50/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 font-bold flex items-center justify-center">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          {item.riceTypeName}
                        </h3>
                        <div className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                          {item.warehouseName || 'Kho Chính'}
                        </div>
                      </div>
                    </div>

                    {isLowStock && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                        <AlertTriangle className="w-3 h-3" /> Sắp hết
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                    <span className="text-xs text-slate-400">Số lượng tồn:</span>
                    <div className="text-xl font-black font-mono text-teal-600 dark:text-teal-400">
                      {formatKg(item.currentQuantityKg)} <span className="text-xs font-semibold">kg</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: WAREHOUSE LOCATIONS LIST */}
      {activeSubTab === 'locations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((wh) => (
            <div
              key={wh._id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                        {wh.code}
                      </span>
                      {wh.isDefault && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          ⭐ Kho Mặc Định
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 mt-1.5">
                      {wh.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditWarehouse(wh)}
                      className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!wh.isDefault && (
                      <button
                        onClick={() => handleDeleteWarehouse(wh._id, wh.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {wh.address && (
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-400 flex-shrink-0" />
                      <span>{wh.address}</span>
                    </div>
                  )}
                  {wh.managerName && (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Quản lý: <strong>{wh.managerName}</strong> {wh.phone ? `(${wh.phone})` : ''}</span>
                    </div>
                  )}
                  {wh.note && (
                    <div className="text-[11px] text-slate-400 italic pt-1">
                      "{wh.note}"
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                <span className="text-xs text-slate-400 font-medium">Sức chứa tối đa:</span>
                <span className="text-sm font-bold font-mono text-teal-600 dark:text-teal-400">
                  {formatKg(wh.capacityKg ? wh.capacityKg / 1000 : 500)} Tấn
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: TRANSACTION HISTORY */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchAllData();
              }}
              className="flex-1 min-w-[240px] relative"
            >
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Tìm theo mã GD, đối tác, kho, giống lúa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-teal-500"
              />
            </form>

            <div className="flex items-center gap-2">
              <select
                value={selectedWarehouseFilter}
                onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
              >
                <option value="all">-- Tất cả các kho --</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'import', label: 'Nhập kho' },
                  { id: 'export', label: 'Xuất kho' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTypeFilter(tab.id)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      typeFilter === tab.id
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 pl-6">Mã GD & Thời Gian</th>
                    <th className="py-3.5">Loại GD</th>
                    <th className="py-3.5">Kho Lúa</th>
                    <th className="py-3.5">Giống Lúa</th>
                    <th className="py-3.5">Đối Tác</th>
                    <th className="py-3.5 text-right">Số Lượng (Kg)</th>
                    <th className="py-3.5 text-right">Đơn Giá</th>
                    <th className="py-3.5 pr-6 text-right">Tổng Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Không có giao dịch kho nào
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const isImport = tx.type === 'import';
                      return (
                        <tr key={tx._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-4 pl-6">
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{tx.code}</span>
                            <div className="text-[10px] text-slate-400">{formatDateTime(tx.date)}</div>
                          </td>
                          <td className="py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${
                                isImport
                                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                                  : 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800'
                              }`}
                            >
                              {isImport ? 'Nhập kho' : 'Xuất bán'}
                            </span>
                          </td>
                          <td className="py-4 font-bold text-teal-700 dark:text-teal-400">{tx.warehouseName || 'Kho Chính'}</td>
                          <td className="py-4 font-semibold">{tx.riceTypeName}</td>
                          <td className="py-4">
                            <strong>{tx.partnerName}</strong>
                            {tx.note && <div className="text-[10px] text-slate-400 italic">{tx.note}</div>}
                          </td>
                          <td className="py-4 text-right font-mono font-black">{formatKg(tx.quantityKg)} kg</td>
                          <td className="py-4 text-right font-mono text-slate-500">{formatCurrency(tx.unitPrice)}</td>
                          <td className={`py-4 pr-6 text-right font-mono font-black ${isImport ? 'text-amber-600' : 'text-teal-600'}`}>
                            {formatCurrency(tx.totalAmount)}
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
      )}

      {/* Export Modal */}
      <WarehouseExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        inventoryList={inventoryList}
        onExportSuccess={fetchAllData}
      />

      {/* Warehouse CRUD Modal */}
      <WarehouseModal
        isOpen={isWarehouseModalOpen}
        onClose={() => setIsWarehouseModalOpen(false)}
        editingWarehouse={editingWarehouse}
        onSuccess={fetchAllData}
      />
    </div>
  );
};
