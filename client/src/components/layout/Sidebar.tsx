import React from 'react';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  Scale,
  FileText,
  Users,
  Warehouse,
  TrendingUp,
  Settings,
  Sparkles,
  ShieldCheck,
  LogOut,
  UserCheck,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'weighing'
  | 'sessions'
  | 'households'
  | 'warehouse'
  | 'finance'
  | 'rice-types'
  | 'users';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    const confirm = window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống Cân Lúa?');
    if (confirm) {
      logout();
    }
  };

  const getRoleInfo = (role?: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Quản Trị Viên', bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' };
      case 'chu_vua':
        return { label: 'Chủ Vựa Lúa', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
      case 'ke_toan':
        return { label: 'Kế Toán Vựa', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' };
      default:
        return { label: 'NV Cân Lúa', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' };
    }
  };

  const roleInfo = getRoleInfo(user?.role);

  // All menu items
  const menuItems: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    roles?: string[];
  }[] = [
    { id: 'weighing', label: 'Bàn Cân Lúa', icon: Scale, badge: 'Chính' },
    { id: 'dashboard', label: 'Tổng Quan (Dashboard)', icon: LayoutDashboard },
    { id: 'sessions', label: 'Danh Sách Phiếu Cân', icon: FileText },
    { id: 'households', label: 'Quản Lý Hộ Dân', icon: Users },
    { id: 'warehouse', label: 'Kho Lúa (Nhập/Xuất)', icon: Warehouse, roles: ['admin', 'chu_vua', 'ke_toan'] },
    { id: 'finance', label: 'Doanh Thu & Lợi Nhuận', icon: TrendingUp, roles: ['admin', 'chu_vua', 'ke_toan'] },
    { id: 'rice-types', label: 'Danh Mục Giống Lúa', icon: Settings, roles: ['admin', 'chu_vua'] },
    // Only Admin manages users
    { id: 'users', label: 'Quản Lý Tài Khoản', icon: ShieldCheck, badge: 'Admin', roles: ['admin'] },
  ];

  // Filter items by role (Admin sees everything)
  const allowedMenuItems = menuItems.filter((item) => {
    if (user?.role === 'admin') return true;
    if (!item.roles) return true;
    return user?.role && item.roles.includes(user.role);
  });

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-1.5 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Chức Năng Nghiệp Vụ
          </div>

          {allowedMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all group ${
                  isActive
                    ? item.id === 'users'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                      : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badge === 'Admin'
                        ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom: User Card & Logout Button */}
        <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          {/* User Info Bar */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  {user?.fullName || 'Người dùng'}
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md inline-block ${roleInfo.bg}`}>
                  {roleInfo.label}
                </span>
              </div>
            </div>
          </div>

          {/* Prominent Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/70 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/60 text-red-600 dark:text-red-400 text-xs font-bold transition-all active:scale-98 shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng Xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
};
