import React, { useState, useEffect } from 'react';
import { WarehouseLocation } from '../../types';
import { apiClient } from '../../api/client';
import { X, Warehouse, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface WarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingWarehouse?: WarehouseLocation | null;
  onSuccess: () => void;
}

export const WarehouseModal: React.FC<WarehouseModalProps> = ({
  isOpen,
  onClose,
  editingWarehouse,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [managerName, setManagerName] = useState('');
  const [phone, setPhone] = useState('');
  const [capacityKg, setCapacityKg] = useState<number | ''>(500000);
  const [note, setNote] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingWarehouse) {
      setName(editingWarehouse.name);
      setCode(editingWarehouse.code);
      setAddress(editingWarehouse.address || '');
      setManagerName(editingWarehouse.managerName || '');
      setPhone(editingWarehouse.phone || '');
      setCapacityKg(editingWarehouse.capacityKg || 500000);
      setNote(editingWarehouse.note || '');
      setIsDefault(editingWarehouse.isDefault || false);
    } else {
      setName('');
      setCode('');
      setAddress('');
      setManagerName('');
      setPhone('');
      setCapacityKg(500000);
      setNote('');
      setIsDefault(false);
    }
  }, [editingWarehouse, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên kho');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase() || undefined,
        address: address.trim(),
        managerName: managerName.trim(),
        phone: phone.trim(),
        capacityKg: Number(capacityKg) || 500000,
        note: note.trim(),
        isDefault,
      };

      if (editingWarehouse) {
        await apiClient.put(`/warehouse/locations/${editingWarehouse._id}`, payload);
        toast.success('Cập nhật kho lúa thành công!');
      } else {
        await apiClient.post('/warehouse/locations', payload);
        toast.success('Tạo kho lúa mới thành công!');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi lưu thông tin kho');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Warehouse className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingWarehouse ? 'Chỉnh Sửa Kho Lúa' : 'Tạo Kho Lúa Mới'}
              </h2>
              <p className="text-xs text-slate-500">Quản lý các điểm kho và vựa thu mua</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Tên kho lúa *
            </label>
            <input
              type="text"
              required
              placeholder="VD: Kho 1 — Sa Đéc..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Mã ký hiệu kho (Tự sinh nếu để trống)
            </label>
            <input
              type="text"
              placeholder="VD: KHO-SADEC..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-mono uppercase bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Địa chỉ kho / Vị trí bến bãi
            </label>
            <input
              type="text"
              placeholder="VD: Cảng Sa Đéc, Đồng Tháp..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Người quản lý kho
              </label>
              <input
                type="text"
                placeholder="VD: Anh Ba..."
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                SĐT liên hệ
              </label>
              <input
                type="text"
                placeholder="VD: 0918..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Sức chứa tối đa (Kg)
            </label>
            <input
              type="number"
              min="1000"
              step="10000"
              value={capacityKg}
              onChange={(e) => setCapacityKg(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2 font-mono text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Ghi chú (máy sấy, quy mô bến...)
            </label>
            <input
              type="text"
              placeholder="VD: Có lò sấy 40 tấn..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
            />
            <label htmlFor="isDefault" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Đặt làm Kho Mặc Định khi tạo phiếu cân mới
            </label>
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
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shadow-md shadow-teal-600/30"
            >
              {loading ? 'Đang lưu...' : editingWarehouse ? 'Lưu Thay Đổi' : 'Tạo Kho Mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
