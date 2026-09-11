import React, { useState, useEffect, useRef } from 'react';
import { WeighingSession } from '../types';
import { apiClient } from '../api/client';
import { WeighingGrid } from '../components/grid/WeighingGrid';
import { NewSessionModal } from '../components/modals/NewSessionModal';
import { RenameHouseholdModal } from '../components/modals/RenameHouseholdModal';
import { PrintableReceipt } from '../components/print/PrintableReceipt';
import { formatCurrency, formatKg, formatDate, getStatusBadge } from '../utils/formatters';
import { useReactToPrint } from 'react-to-print';
import confetti from 'canvas-confetti';
import {
  Scale,
  Plus,
  Printer,
  CheckCircle,
  Lock,
  Unlock,
  UserCheck,
  Calendar,
  Phone,
  MapPin,
  Sparkles,
  ChevronDown,
  DollarSign,
  AlertCircle,
  History,
} from 'lucide-react';
import { toast } from 'sonner';

interface WeighingStationPageProps {
  initialSessionId?: string;
}

export const WeighingStationPage: React.FC<WeighingStationPageProps> = ({ initialSessionId }) => {
  const [sessions, setSessions] = useState<WeighingSession[]>([]);
  const [currentSession, setCurrentSession] = useState<WeighingSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printFormat, setPrintFormat] = useState<'a5' | 'thermal80'>('a5');

  const printComponentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: currentSession ? `Phieu_Can_${currentSession.code}` : 'Phieu_Can',
  });

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/weighing-sessions?limit=30');
      const list: WeighingSession[] = res.data.data || [];
      setSessions(list);

      if (initialSessionId) {
        const found = list.find((s) => s._id === initialSessionId);
        if (found) setCurrentSession(found);
        else if (list.length > 0) setCurrentSession(list[0]);
      } else if (list.length > 0) {
        // Default to first open session or first in list
        const openSession = list.find((s) => s.status === 'open') || list[0];
        setCurrentSession(openSession);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi tải danh sách phiên cân');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [initialSessionId]);

  // Handle session close
  const handleCloseSession = async () => {
    if (!currentSession) return;
    if (currentSession.totalWeighCount === 0 || currentSession.totalWeightKg <= 0) {
      toast.error('Phiếu cân chưa có số liệu, không thể chốt!');
      return;
    }

    const confirm = window.confirm(
      `Xác nhận chốt phiếu ${currentSession.code}?\nTổng: ${formatKg(currentSession.totalWeightKg)} Kg (${currentSession.totalWeighCount} bao) — ${formatCurrency(currentSession.totalAmount)}.\n\nSau khi chốt, lúa sẽ tự động nhập vào kho!`
    );
    if (!confirm) return;

    try {
      const res = await apiClient.post(`/weighing-sessions/${currentSession._id}/close`);
      if (res.data.success) {
        toast.success('🎉 Đã chốt phiếu cân và tự động nhập kho thành công!');
        setCurrentSession(res.data.data);
        fetchSessions();

        // Confetti celebration
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          //
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi chốt phiếu cân');
    }
  };

  // Handle Mark Paid
  const handleMarkPaid = async () => {
    if (!currentSession) return;
    try {
      const res = await apiClient.post(`/weighing-sessions/${currentSession._id}/paid`);
      if (res.data.success) {
        toast.success('Đã xác nhận thanh toán tiền cho hộ dân!');
        setCurrentSession(res.data.data);
        fetchSessions();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật thanh toán');
    }
  };

  // Handle Reopen (Admin)
  const handleReopen = async () => {
    if (!currentSession) return;
    const confirm = window.confirm('Mở lại phiếu cân để cho phép sửa đổi số liệu?');
    if (!confirm) return;

    try {
      const res = await apiClient.post(`/weighing-sessions/${currentSession._id}/reopen`);
      if (res.data.success) {
        toast.success('Đã mở lại phiếu cân!');
        setCurrentSession(res.data.data);
        fetchSessions();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi mở lại phiếu');
    }
  };

  const statusBadge = currentSession ? getStatusBadge(currentSession.status) : null;
  const isReadOnly = currentSession?.status === 'closed' || currentSession?.status === 'paid';

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] gap-4">
      {/* Session Quick Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Left: Session Switcher & Info */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="relative">
            <select
              value={currentSession?._id || ''}
              onChange={(e) => {
                const found = sessions.find((s) => s._id === e.target.value);
                if (found) setCurrentSession(found);
              }}
              className="appearance-none pl-4 pr-10 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 cursor-pointer focus:border-brand-500"
            >
              {sessions.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.code} — {s.householdNameSnapshot} ({s.riceTypeNameSnapshot}) [{s.status}]
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3.5 pointer-events-none" />
          </div>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-brand-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Phiếu Mới</span>
          </button>

          {currentSession && statusBadge && (
            <div
              className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
            >
              <span className="w-2 h-2 rounded-full bg-current" />
              {statusBadge.label}
            </div>
          )}
        </div>

        {/* Right: Action Buttons */}
        {currentSession && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Rename Household */}
            <button
              onClick={() => setIsRenameModalOpen(true)}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Đổi tên hộ dân</span>
            </button>

            {/* Print Receipt */}
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In phiếu cân</span>
            </button>

            {/* Close Session (if open) */}
            {currentSession.status === 'open' && (
              <button
                onClick={handleCloseSession}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Chốt Phiếu & Nhập Kho</span>
              </button>
            )}

            {/* Mark Paid (if closed) */}
            {currentSession.status === 'closed' && (
              <button
                onClick={handleMarkPaid}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Xác Nhận Đã Thanh Toán</span>
              </button>
            )}

            {/* Reopen Session (if closed or paid) */}
            {(currentSession.status === 'closed' || currentSession.status === 'paid') && (
              <button
                onClick={handleReopen}
                className="px-3 py-2 border border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Mở lại phiếu</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {currentSession ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
          {/* Left Info Panel */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            {/* Household card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Thông Tin Hộ Dân
                </span>
                <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                  {currentSession.code}
                </span>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {currentSession.householdNameSnapshot}
                </h3>
                {currentSession.householdPhoneSnapshot && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{currentSession.householdPhoneSnapshot}</span>
                  </div>
                )}
                {currentSession.householdAddressSnapshot && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{currentSession.householdAddressSnapshot}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400">Giống lúa:</span>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">
                    {currentSession.riceTypeNameSnapshot}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Kho nhập lúa:</span>
                  <div className="font-bold text-teal-600 dark:text-teal-400 truncate" title={currentSession.warehouseNameSnapshot}>
                    {currentSession.warehouseNameSnapshot || 'Kho Chính'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Đơn giá / kg:</span>
                  <div className="font-bold font-mono text-slate-800 dark:text-slate-200">
                    {formatCurrency(currentSession.pricePerKg)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Trừ bì mỗi bao:</span>
                  <div className="font-bold font-mono text-slate-800 dark:text-slate-200">
                    {currentSession.tareWeightPerBagKg > 0
                      ? `${currentSession.tareWeightPerBagKg} kg/bao`
                      : 'Không trừ bì'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Ngày cân:</span>
                  <div className="font-semibold text-slate-700 dark:text-slate-300">
                    {formatDate(currentSession.weighDate)}
                  </div>
                </div>
              </div>

              {/* Name change audit history preview */}
              {currentSession.nameChangeLog && currentSession.nameChangeLog.length > 0 && (
                <div className="mt-2 p-2.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-xl text-[11px] space-y-1">
                  <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                    <History className="w-3 h-3" />
                    <span>Lịch sử đổi tên:</span>
                  </div>
                  {currentSession.nameChangeLog.map((log, idx) => (
                    <div key={idx} className="text-amber-700 dark:text-amber-400">
                      "{log.from}" ➔ "{log.to}" ({log.reason || 'Đổi tên'})
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick stats snapshot card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-850 rounded-2xl p-5 text-white shadow-sm space-y-3">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Thống Kê Nhanh
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-400">Số bao:</span>
                <span className="text-lg font-bold font-mono">{currentSession.totalWeighCount} bao</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-400">Khối lượng thô:</span>
                <span className="text-base font-bold font-mono">{formatKg(currentSession.grossWeightKg)} kg</span>
              </div>
              {currentSession.tareWeightPerBagKg > 0 && (
                <div className="flex items-baseline justify-between text-amber-400">
                  <span className="text-xs">Trừ bì:</span>
                  <span className="text-sm font-bold font-mono">- {formatKg(currentSession.tareTotalKg)} kg</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-700 flex items-baseline justify-between text-emerald-400">
                <span className="text-xs font-bold uppercase">Khối lượng tịnh:</span>
                <span className="text-xl font-extrabold font-mono">{formatKg(currentSession.totalWeightKg)} Kg</span>
              </div>
              <div className="flex items-baseline justify-between text-amber-400">
                <span className="text-xs font-bold uppercase">Thành tiền:</span>
                <span className="text-xl font-extrabold font-mono">{formatCurrency(currentSession.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Center/Right 5xN Weighing Grid */}
          <div className="lg:col-span-3 h-full min-h-[500px]">
            <WeighingGrid
              session={currentSession}
              isReadOnly={isReadOnly}
              onSessionUpdated={(updated) => {
                setCurrentSession(updated);
                // Also update in list
                setSessions((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center">
          <div className="w-16 h-16 rounded-3xl bg-brand-500/10 text-brand-600 flex items-center justify-center text-3xl mb-4">
            🌾
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Chưa có phiên cân nào đang chọn
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
            Bấm nút dưới đây để tạo phiếu cân mới cho hộ dân hoặc chọn từ danh sách
          </p>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-600/30 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Tạo Phiếu Cân Mới</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <NewSessionModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSessionCreated={(newSession) => {
          setSessions((prev) => [newSession, ...prev]);
          setCurrentSession(newSession);
        }}
      />

      {currentSession && (
        <RenameHouseholdModal
          isOpen={isRenameModalOpen}
          onClose={() => setIsRenameModalOpen(false)}
          session={currentSession}
          onSessionUpdated={(updated) => {
            setCurrentSession(updated);
            setSessions((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
          }}
        />
      )}

      {/* Print Preview & Printer Trigger Modal */}
      {isPrintModalOpen && currentSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Xem Trước & In Phiếu Cân Lúa
                  </h3>
                  <p className="text-xs text-slate-500">Mã: {currentSession.code}</p>
                </div>
              </div>

              {/* Format Switcher */}
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setPrintFormat('a5')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      printFormat === 'a5'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    Khổ A5 / A4 (Bảng đầy đủ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintFormat('thermal80')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      printFormat === 'thermal80'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    Máy in nhiệt 80mm
                  </button>
                </div>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Preview container */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
              <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                <PrintableReceipt
                  ref={printComponentRef}
                  session={currentSession}
                  printFormat={printFormat}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-950/40">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  handlePrint();
                }}
                className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md shadow-brand-600/30 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Gửi Lệnh In Máy In</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
