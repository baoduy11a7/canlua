import React, { useState, useEffect } from 'react';
import { Household, WeighingSession } from '../../types';
import { apiClient } from '../../api/client';
import { X, UserCheck, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface RenameHouseholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: WeighingSession;
  onSessionUpdated: (session: WeighingSession) => void;
}

export const RenameHouseholdModal: React.FC<RenameHouseholdModalProps> = ({
  isOpen,
  onClose,
  session,
  onSessionUpdated,
}) => {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState('');
  const [isCustomName, setIsCustomName] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [reason, setReason] = useState('Đổi theo yêu cầu của hộ dân');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      apiClient.get('/households?limit=100').then((res) => {
        setHouseholds(res.data.data || []);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = { reason };
      if (isCustomName) {
        if (!customName.trim()) {
          toast.error('Vui lòng nhập tên hộ mới');
          setLoading(false);
          return;
        }
        payload.newHouseholdName = customName.trim();
        payload.newHouseholdPhone = customPhone.trim();
        payload.newHouseholdAddress = customAddress.trim();
      } else {
        if (!selectedHouseholdId) {
          toast.error('Vui lòng chọn hộ dân từ danh sách');
          setLoading(false);
          return;
        }
        payload.householdId = selectedHouseholdId;
      }

      const res = await apiClient.patch(`/weighing-sessions/${session._id}/rename-household`, payload);
      if (res.data.success) {
        toast.success(res.data.message);
        onSessionUpdated(res.data.data);
        onClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi đổi tên hộ dân');
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
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Đổi Tên Hộ Dân Cho Phiếu Cân
              </h2>
              <p className="text-xs text-slate-500">Mã phiếu: {session.code}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              Tên hiện tại: <strong>{session.householdNameSnapshot}</strong>. Thao tác này sẽ lưu vào lịch sử thay đổi (Audit Log).
            </span>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Chọn hộ dân mới
            </label>
            <button
              type="button"
              onClick={() => setIsCustomName(!isCustomName)}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            >
              {isCustomName ? 'Chọn hộ có sẵn' : '+ Nhập tên tự do'}
            </button>
          </div>

          {isCustomName ? (
            <div className="space-y-2">
              <input
                type="text"
                required
                placeholder="Tên hộ dân mới..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
              <input
                type="text"
                placeholder="Số điện thoại..."
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          ) : (
            <select
              value={selectedHouseholdId}
              onChange={(e) => setSelectedHouseholdId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            >
              <option value="">-- Chọn hộ nông dân --</option>
              {households.map((h) => (
                <option key={h._id} value={h._id}>
                  {h.name} {h.phone ? `(${h.phone})` : ''}
                </option>
              ))}
            </select>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Lý do thay đổi
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-md shadow-amber-500/20"
            >
              {loading ? 'Đang cập nhật...' : 'Xác Nhận Đổi Tên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
