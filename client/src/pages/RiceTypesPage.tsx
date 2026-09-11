import React, { useState, useEffect } from 'react';
import { RiceType } from '../types';
import { apiClient } from '../api/client';
import { formatCurrency } from '../utils/formatters';
import { Settings, Plus, Edit2, CheckCircle2, XCircle, X } from 'lucide-react';
import { toast } from 'sonner';

export const RiceTypesPage: React.FC = () => {
  const [riceTypes, setRiceTypes] = useState<RiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RiceType | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [defaultPrice, setDefaultPrice] = useState<number | ''>(7400);
  const [description, setDescription] = useState('');

  const fetchRiceTypes = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/rice-types');
      setRiceTypes(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi tải danh mục giống lúa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiceTypes();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setName('');
    setCode('');
    setDefaultPrice(7400);
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rt: RiceType) => {
    setEditingItem(rt);
    setName(rt.name);
    setCode(rt.code);
    setDefaultPrice(rt.defaultPricePerKg);
    setDescription(rt.description || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.error('Vui lòng nhập tên và mã loại lúa');
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        defaultPricePerKg: Number(defaultPrice) || 7000,
        description: description.trim(),
      };

      if (editingItem) {
        await apiClient.put(`/rice-types/${editingItem._id}`, payload);
        toast.success('Đã cập nhật giống lúa');
      } else {
        await apiClient.post('/rice-types', payload);
        toast.success('Đã thêm giống lúa mới');
      }

      setIsModalOpen(false);
      fetchRiceTypes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi lưu thông tin');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Danh Mục Các Giống Lúa & Giá Chuẩn
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu hình bảng giá mặc định cho từng giống lúa khi tạo phiếu cân mới
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-brand-600/20 flex items-center gap-2 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Giống Lúa Mới</span>
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {riceTypes.map((rt) => (
          <div
            key={rt._id}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-brand-500 transition-all"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-400">
                    {rt.code}
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 mt-1">
                    {rt.name}
                  </h3>
                </div>

                <button
                  onClick={() => handleOpenEdit(rt)}
                  className="p-2 text-slate-400 hover:text-brand-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {rt.description && (
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                  {rt.description}
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
              <span className="text-xs text-slate-400 font-medium">Giá thu mua chuẩn:</span>
              <span className="text-lg font-black font-mono text-brand-600 dark:text-brand-400">
                {formatCurrency(rt.defaultPricePerKg)} <span className="text-xs font-normal">/ kg</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingItem ? 'Chỉnh Sửa Giống Lúa' : 'Thêm Giống Lúa Mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Tên giống lúa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: ST25, OM5451, Đài Thơm 8..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Mã ký hiệu *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: ST25, DT8..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-mono uppercase bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Đơn giá gợi ý mặc định (VNĐ/kg)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="50"
                  required
                  value={defaultPrice}
                  onChange={(e) => setDefaultPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 font-mono text-base font-bold text-brand-600 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Mô tả đặc điểm giống lúa
                </label>
                <input
                  type="text"
                  placeholder="VD: Lúa thơm hạt dài dẻo..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  {editingItem ? 'Lưu Thay Đổi' : 'Thêm Giống Lúa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
