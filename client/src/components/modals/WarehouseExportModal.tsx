import React, { useState, useEffect } from 'react';
import { InventoryItem, WarehouseLocation } from '../../types';
import { apiClient } from '../../api/client';
import { formatCurrency, formatKg } from '../../utils/formatters';
import { X, TrendingUp, AlertTriangle, Warehouse } from 'lucide-react';
import { toast } from 'sonner';

interface WarehouseExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryList: InventoryItem[];
  onExportSuccess: () => void;
}

export const WarehouseExportModal: React.FC<WarehouseExportModalProps> = ({
  isOpen,
  onClose,
  inventoryList,
  onExportSuccess,
}) => {
  const [warehouses, setWarehouses] = useState<WarehouseLocation[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [selectedRiceTypeId, setSelectedRiceTypeId] = useState('');
  const [quantityKg, setQuantityKg] = useState<number | ''>('');
  const [unitPrice, setUnitPrice] = useState<number | ''>(8500);
  const [partnerName, setPartnerName] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      apiClient.get('/warehouse/locations').then((res) => {
        const list: WarehouseLocation[] = res.data.data || [];
        setWarehouses(list);
        if (list.length > 0 && !selectedWarehouseId) {
          const def = list.find((w) => w.isDefault) || list[0];
          setSelectedWarehouseId(def._id);
        }
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (inventoryList.length > 0 && !selectedRiceTypeId) {
      const first = inventoryList[0];
      const rtId = typeof first.riceTypeId === 'object' ? (first.riceTypeId as any)._id : first.riceTypeId;
      setSelectedRiceTypeId(rtId);
    }
  }, [inventoryList, selectedRiceTypeId]);

  if (!isOpen) return null;

  const currentItem = inventoryList.find((i) => {
    const rtId = typeof i.riceTypeId === 'object' ? (i.riceTypeId as any)._id : i.riceTypeId;
    const whId = typeof i.warehouseId === 'object' ? (i.warehouseId as any)?._id : i.warehouseId;
    if (selectedWarehouseId && whId) {
      return rtId === selectedRiceTypeId && whId === selectedWarehouseId;
    }
    return rtId === selectedRiceTypeId;
  });

  const availableStockKg = currentItem?.currentQuantityKg || 0;
  const numQty = Number(quantityKg) || 0;
  const numPrice = Number(unitPrice) || 0;
  const totalAmount = numQty * numPrice;
  const isOutOfStock = numQty > availableStockKg;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRiceTypeId || !numQty || !numPrice || !partnerName.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (isOutOfStock) {
      toast.error(`Số lượng xuất (${formatKg(numQty)} kg) vượt quá tồn kho hiện có (${formatKg(availableStockKg)} kg)`);
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/warehouse/transactions', {
        type: 'export',
        riceTypeId: selectedRiceTypeId,
        warehouseId: selectedWarehouseId || undefined,
        quantityKg: numQty,
        unitPrice: numPrice,
        partnerName: partnerName.trim(),
        partnerPhone: partnerPhone.trim(),
        note: note.trim(),
        date,
      });

      if (res.data.success) {
        toast.success('Đã tạo phiếu xuất kho bán lúa thành công!');
        onExportSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi xuất kho');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Xuất Kho Bán Lúa (Ghi Nhận Doanh Thu)
              </h2>
              <p className="text-xs text-slate-500">Xuất bán cho khách sỉ, nhà máy xay xát</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Select Warehouse */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Warehouse className="w-3.5 h-3.5 text-teal-600" />
              <span>Xuất từ kho lúa *</span>
            </label>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
            >
              {warehouses.map((wh) => (
                <option key={wh._id} value={wh._id}>
                  {wh.name} — {wh.address || 'Vựa lúa'}
                </option>
              ))}
            </select>
          </div>

          {/* Select Rice Variety */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Giống lúa xuất bán *
              </label>
              <span className="text-xs font-medium text-slate-500">
                Tồn kho: <strong className="text-brand-600 font-mono">{formatKg(availableStockKg)} kg</strong>
              </span>
            </div>
            <select
              value={selectedRiceTypeId}
              onChange={(e) => setSelectedRiceTypeId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
            >
              {inventoryList.map((item) => {
                const rtId = typeof item.riceTypeId === 'object' ? (item.riceTypeId as any)._id : item.riceTypeId;
                return (
                  <option key={item._id} value={rtId}>
                    {item.riceTypeName} {item.warehouseName ? `(${item.warehouseName})` : ''} — Tồn: {formatKg(item.currentQuantityKg)} kg
                  </option>
                );
              })}
            </select>
          </div>

          {/* Quantity & Unit Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Số lượng xuất (Kg) *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                placeholder="VD: 15000"
                value={quantityKg}
                onChange={(e) => setQuantityKg(e.target.value === '' ? '' : Number(e.target.value))}
                className={`w-full px-3.5 py-2.5 font-mono text-base font-bold bg-slate-50 dark:bg-slate-800 border rounded-xl ${
                  isOutOfStock ? 'border-red-500 text-red-600' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {isOutOfStock && (
                <span className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Vượt quá tồn kho
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Đơn giá bán (đ/kg) *
              </label>
              <input
                type="number"
                min="0"
                step="50"
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 font-mono text-base font-bold text-teal-600 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          {/* Partner & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Khách mua / Nhà máy *
              </label>
              <input
                type="text"
                required
                placeholder="Tên đối tác mua..."
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                SĐT liên hệ
              </label>
              <input
                type="text"
                placeholder="Số điện thoại..."
                value={partnerPhone}
                onChange={(e) => setPartnerPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Ngày xuất kho
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Ghi chú xuất
              </label>
              <input
                type="text"
                placeholder="VD: Xe tải anh Ba..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          {/* Calculated Total Revenue preview */}
          <div className="p-4 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 rounded-2xl flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-teal-800 dark:text-teal-300">
              Tổng Doanh Thu Thu Về:
            </span>
            <span className="text-xl font-mono font-black text-teal-600 dark:text-teal-400">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || isOutOfStock}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-bold shadow-md shadow-teal-600/30"
            >
              {loading ? 'Đang xuất...' : 'Xác Nhận Xuất Kho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
