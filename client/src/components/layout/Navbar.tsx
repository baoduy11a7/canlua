import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { useConfigStore } from '../../store/configStore';
import {
  Moon,
  Sun,
  Volume2,
  VolumeX,
  LogOut,
  User,
  Scale,
  Shield,
  Menu,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  activeSessionCode?: string;
  onOpenNewSession?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  activeSessionCode,
  onOpenNewSession,
}) => {
  const { user, logout } = useAuthStore();
  const { darkMode, soundEnabled, toggleDarkMode, toggleSound } = useConfigStore();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'chu_vua':
        return { label: 'Chủ Vựa', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
      case 'admin':
        return { label: 'Quản Trị', bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' };
      case 'ke_toan':
        return { label: 'Kế Toán', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' };
      default:
        return { label: 'NV Cân', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  const handleLogout = () => {
    const confirm = window.confirm('Bạn có chắc muốn đăng xuất khỏi hệ thống Cân Lúa?');
    if (confirm) {
      logout();
    }
  };

  return (
    <header className="h-14 sm:h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between">
      {/* Left section: Hamburger on mobile + Title/Brand */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95"
            title="Mở menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 flex-shrink-0">
            <span className="text-base sm:text-xl">🌾</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
                CÂN LÚA
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                PRO
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 hidden md:block">
              Hệ thống Quản lý Vựa lúa & Lưới cân số hóa 25 bao
            </p>
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick New Session Button */}
        {onOpenNewSession && (
          <button
            onClick={onOpenNewSession}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm shadow-brand-600/20 active:scale-95 transition-all"
          >
            <Scale className="w-4 h-4" />
            <span>Tạo Phiếu Cân</span>
          </button>
        )}

        {/* Audio Beep Switch */}
        <button
          onClick={toggleSound}
          title={soundEnabled ? 'Tắt âm thanh gõ phím' : 'Bật âm thanh gõ phím'}
          className={`p-2 rounded-xl border transition-all ${
            soundEnabled
              ? 'bg-brand-50 text-brand-600 border-brand-200 dark:bg-brand-950/50 dark:text-brand-400 dark:border-brand-800'
              : 'text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Dark Mode Switch */}
        <button
          onClick={toggleDarkMode}
          title="Chuyển chế độ Sáng / Tối"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User profile & logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="text-right hidden md:block">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {user?.fullName || 'Người dùng'}
            </div>
            <div className="flex justify-end">
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${roleInfo.bg}`}>
                {roleInfo.label}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Đăng xuất khỏi hệ thống"
            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-bold text-slate-500 hover:text-red-600">Thoát</span>
          </button>
        </div>
      </div>
    </header>
  );
};
