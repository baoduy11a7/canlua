import React, { useState } from 'react';
import { apiClient } from '../../api/client';
import { formatCurrency } from '../../utils/formatters';
import { X, Receipt, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { id: 'boc_xep', name: 'Bốc xếp' },
  { id: 'van_chuyen', name: 'Vận chuyển / Xăng dầu' },
  { id: 'nhan_cong', name: 'Nhân công' },
  { id: 'dien_nuoc', name: 'Điện / Nước sinh hoạt bãi' },
  { id: 'bao_bi', name: 'Bao bì & Chỉ may' },
  { id: 'khau_hao', name: 'Khấu hao cân / Thiết bị' },
  { id: 'khac', name: 'Chi phí khác' },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [category, setCategory] = useState('boc_xep');
  const [amount, setAmount] = useState<number | ''>('');
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/finance/expenses', {
        category,
        amount: Number(amount),
        recipient: recipient.trim(),
        note: note.trim(),
        date,
      });

      if (res.data.success) {
        toast.success('Đã thêm khoản chi phí!');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi lưu chi phí');
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
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Thêm Khoản Chi Phí Vận Hành
              </h2>
              <p className="text-xs text-slate-500">Ghi nhận chi phí phục vụ tính lợi nhuận</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Danh mục chi
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Số tiền chi (VNĐ)
            </label>
            <input
              type="number"
              min="1000"
              step="1000"
              required
              placeholder="VD: 500000"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2.5 font-mono text-base font-bold text-rose-600 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Người nhận tiền / Đơn vị cung cấp
            </label>
            <input
              type="text"
              placeholder="VD: Tổ bốc xếp anh Ba..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Ghi chú chi tiết
            </label>
            <input
              type="text"
              placeholder="Nội dung chi..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
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
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md shadow-rose-600/30"
            >
              {loading ? 'Đang lưu...' : 'Lưu Khoản Chi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
