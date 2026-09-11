import React, { useState, useEffect } from 'react';
import { Household, RiceType, WarehouseLocation, WeighingSession } from '../../types';
import { apiClient } from '../../api/client';
import { formatCurrency, formatKg } from '../../utils/formatters';
import { X, Plus, Scale, Sparkles, UserPlus, Phone, MapPin, Warehouse } from 'lucide-react';
import { toast } from 'sonner';

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionCreated: (session: WeighingSession) => void;
}

export const NewSessionModal: React.FC<NewSessionModalProps> = ({
  isOpen,
  onClose,
  onSessionCreated,
}) => {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [riceTypes, setRiceTypes] = useState<RiceType[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseLocation[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedHouseholdId, setSelectedHouseholdId] = useState('');
  const [isQuickCreateHousehold, setIsQuickCreateHousehold] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickAddress, setQuickAddress] = useState('');

  const [selectedRiceTypeId, setSelectedRiceTypeId] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [pricePerKg, setPricePerKg] = useState(7400);
  const [tareWeight, setTareWeight] = useState(0.2);
  const [weighDate, setWeighDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen]);

  const fetchInitialData = async () => {
    try {
      const [hRes, rRes, whRes] = await Promise.all([
        apiClient.get('/households?limit=100'),
        apiClient.get('/rice-types?activeOnly=true'),
        apiClient.get('/warehouse/locations'),
      ]);
      setHouseholds(hRes.data.data || []);
      const rList: RiceType[] = rRes.data.data || [];
      setRiceTypes(rList);
      if (rList.length > 0) {
        setSelectedRiceTypeId(rList[0]._id);
        setPricePerKg(rList[0].defaultPricePerKg);
      }
      if (hRes.data.data?.length > 0) {
        setSelectedHouseholdId(hRes.data.data[0]._id);
      }

      const whList: WarehouseLocation[] = whRes.data.data || [];
      setWarehouses(whList);
      const defaultWh = whList.find((w) => w.isDefault) || whList[0];
      if (defaultWh) {
        setSelectedWarehouseId(defaultWh._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRiceTypeChange = (rtId: string) => {
    setSelectedRiceTypeId(rtId);
    const rt = riceTypes.find((r) => r._id === rtId);
    if (rt) {
      setPricePerKg(rt.defaultPricePerKg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isQuickCreateHousehold && !selectedHouseholdId) {
      toast.error('Vui lòng chọn hộ dân');
      return;
    }

    if (isQuickCreateHousehold && !quickName.trim()) {
      toast.error('Vui lòng nhập tên hộ dân');
      return;
    }

    if (!selectedRiceTypeId) {
      toast.error('Vui lòng chọn loại lúa');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        riceTypeId: selectedRiceTypeId,
        warehouseId: selectedWarehouseId || undefined,
        pricePerKg: Number(pricePerKg),
        tareWeightPerBagKg: Number(tareWeight),
        weighDate,
        note,
      };

      if (isQuickCreateHousehold) {
        payload.newHousehold = {
          name: quickName.trim(),
          phone: quickPhone.trim(),
          address: quickAddress.trim(),
        };
      } else {
        payload.householdId = selectedHouseholdId;
      }

      const res = await apiClient.post('/weighing-sessions', payload);
      if (res.data.success) {
        toast.success('Đã tạo phiên cân mới!');
        onSessionCreated(res.data.data);
        onClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi tạo phiên cân');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Tạo Phiếu Cân Mới
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Khởi tạo phiên cân lúa cho hộ nông dân
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Household Selection or Quick Create */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Hộ dân / Người bán *
              </label>
              <button
                type="button"
                onClick={() => setIsQuickCreateHousehold(!isQuickCreateHousehold)}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                {isQuickCreateHousehold ? 'Chọn từ danh bạ' : '+ Thêm hộ mới nhanh'}
              </button>
            </div>

            {isQuickCreateHousehold ? (
              <div className="p-3.5 bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200/70 dark:border-brand-900/50 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-brand-600" />
                  <span className="text-xs font-bold text-brand-800 dark:text-brand-300">
                    Tạo nhanh hộ dân mới
                  </span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Họ và tên hộ dân (VD: Bác Bảy Ruộng)..."
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Số điện thoại..."
                      value={quickPhone}
                      onChange={(e) => setQuickPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Địa chỉ / Xã..."
                      value={quickAddress}
                      onChange={(e) => setQuickAddress(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <select
                value={selectedHouseholdId}
                onChange={(e) => setSelectedHouseholdId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-brand-500"
              >
                {households.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.name} {h.phone ? `(${h.phone})` : ''} - {h.address || 'Chưa có địa chỉ'}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Warehouse Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Warehouse className="w-4 h-4 text-teal-600" />
              <span>Kho Nhập Lúa *</span>
            </label>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:border-teal-500"
            >
              {warehouses.map((wh) => (
                <option key={wh._id} value={wh._id}>
                  {wh.name} {wh.isDefault ? ' (Mặc định)' : ''} — {wh.address || 'Vựa lúa'}
                </option>
              ))}
            </select>
          </div>

          {/* Rice Variety & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Giống lúa *
              </label>
              <select
                value={selectedRiceTypeId}
                onChange={(e) => handleRiceTypeChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100"
              >
                {riceTypes.map((rt) => (
                  <option key={rt._id} value={rt._id}>
                    {rt.name} ({formatCurrency(rt.defaultPricePerKg)}/kg)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Đơn giá mua (VNĐ/kg) *
              </label>
              <input
                type="number"
                min="0"
                step="50"
                required
                value={pricePerKg}
                onChange={(e) => setPricePerKg(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 font-mono text-base font-bold text-brand-600 dark:text-brand-400 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          {/* Tare Weight and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Trừ bì bao (kg/bao)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.05"
                value={tareWeight}
                onChange={(e) => setTareWeight(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 font-mono text-sm font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Mặc định: 0.2 kg/bao
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Ngày cân
              </label>
              <input
                type="date"
                value={weighDate}
                onChange={(e) => setWeighDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Ghi chú phiên cân (tùy chọn)
            </label>
            <input
              type="text"
              placeholder="VD: Cân tại đê bao số 3, lúa khô ráo..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-sm font-bold shadow-lg shadow-brand-600/30 flex items-center gap-2 transition-all"
            >
              {loading ? 'Đang tạo...' : 'Bắt Đầu Cân Ngay 🌾'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
