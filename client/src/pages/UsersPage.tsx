import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/client';
import { User, UserRole } from '../types';
import { formatDate } from '../utils/formatters';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  KeyRound,
  Lock,
  Unlock,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Phone,
  Scale,
  DollarSign,
  Crown,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('nhan_vien_can');
  const [formPhone, setFormPhone] = useState('');
  const [formNewPassword, setFormNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/users');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Quản Trị Viên',
          bg: 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          icon: Crown,
        };
      case 'chu_vua':
        return {
          label: 'Chủ Vựa Lúa',
          bg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          icon: Shield,
        };
      case 'ke_toan':
        return {
          label: 'Kế Toán Vựa',
          bg: 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          icon: DollarSign,
        };
      default:
        return {
          label: 'NV Cân Lúa',
          bg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          icon: Scale,
        };
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormUsername('');
    setFormPassword('');
    setFormFullName('');
    setFormRole('nhan_vien_can');
    setFormPhone('');
    setIsCreateModalOpen(true);
  };

  // Submit Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername.trim() || !formPassword || !formFullName.trim()) {
      toast.error('Vui lòng điền đầy đủ tên đăng nhập, mật khẩu và họ tên');
      return;
    }

    if (formPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post('/users', {
        username: formUsername.trim().toLowerCase(),
        password: formPassword,
        fullName: formFullName.trim(),
        role: formRole,
        phone: formPhone.trim(),
      });

      if (res.data.success) {
        toast.success(`Đã tạo tài khoản "${res.data.data.username}" thành công!`);
        setIsCreateModalOpen(false);
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi tạo tài khoản');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (target: User) => {
    setSelectedUser(target);
    setFormFullName(target.fullName);
    setFormRole(target.role);
    setFormPhone(target.phone || '');
    setIsEditModalOpen(true);
  };

  // Submit Edit User
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      const targetId = selectedUser._id || selectedUser.id;
      const res = await apiClient.put(`/users/${targetId}`, {
        fullName: formFullName.trim(),
        role: formRole,
        phone: formPhone.trim(),
      });

      if (res.data.success) {
        toast.success('Cập nhật tài khoản thành công!');
        setIsEditModalOpen(false);
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật tài khoản');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Reset Password Modal
  const handleOpenResetPasswordModal = (target: User) => {
    setSelectedUser(target);
    setFormNewPassword('');
    setIsResetPasswordModalOpen(true);
  };

  // Submit Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!formNewPassword || formNewPassword.length < 6) {
      toast.error('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }

    setSubmitting(true);
    try {
      const targetId = selectedUser._id || selectedUser.id;
      const res = await apiClient.patch(`/users/${targetId}/reset-password`, {
        newPassword: formNewPassword,
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setIsResetPasswordModalOpen(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi đặt lại mật khẩu');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active/Inactive status
  const handleToggleStatus = async (target: User) => {
    const targetId = target._id || target.id;
    const confirm = window.confirm(
      target.isActive
        ? `Bạn có chắc muốn TẠM KHÓA tài khoản "${target.username}"? Người dùng này sẽ không thể đăng nhập vào hệ thống!`
        : `MỞ KHÓA tài khoản "${target.username}" để người dùng có thể đăng nhập?`
    );
    if (!confirm) return;

    try {
      const res = await apiClient.patch(`/users/${targetId}/toggle-status`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi thay đổi trạng thái');
    }
  };

  // Delete User
  const handleDeleteUser = async (target: User) => {
    const targetId = target._id || target.id;
    const confirm = window.confirm(
      `CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản "${target.username}" (${target.fullName}) khỏi hệ thống?`
    );
    if (!confirm) return;

    try {
      const res = await apiClient.delete(`/users/${targetId}`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi xóa tài khoản');
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery));
    return matchesRole && matchesSearch;
  });

  // KPI calculations
  const totalUsers = users.length;
  const canLuaCount = users.filter((u) => u.role === 'nhan_vien_can').length;
  const adminAndChuVuaCount = users.filter((u) => u.role === 'admin' || u.role === 'chu_vua').length;
  const activeCount = users.filter((u) => u.isActive).length;

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & ACTION */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                  Quản Lý Tài Khoản Người Dùng
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {totalUsers} Tài khoản
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Chức năng dành riêng cho Quản Trị Viên (Admin) để tạo, cấp quyền và quản lý nhân sự cân lúa
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-purple-600/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tạo Tài Khoản Mới</span>
          </button>
        </div>
      </div>

      {/* 2. STATS KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Tổng Tài Khoản
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
            {totalUsers}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Tất cả vai trò</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            NV Cân Lúa
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {canLuaCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Tài khoản trực tiếp cân</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Quản Trị / Chủ Vựa
          </div>
          <div className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400 mt-1">
            {adminAndChuVuaCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Quản lý & Giám sát</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Đang Hoạt Động
          </div>
          <div className="text-2xl font-black font-mono text-teal-600 dark:text-teal-400 mt-1">
            {activeCount} / {totalUsers}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Tài khoản khả dụng</div>
        </div>
      </div>

      {/* 3. SEARCH & ROLE FILTERS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo họ tên, tên đăng nhập, số điện thoại..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
          />
        </div>

        {/* Role Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Tất Cả' },
            { id: 'nhan_vien_can', label: 'NV Cân Lúa' },
            { id: 'ke_toan', label: 'Kế Toán' },
            { id: 'chu_vua', label: 'Chủ Vựa' },
            { id: 'admin', label: 'Quản Trị Viên' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedRoleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedRoleFilter === tab.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. USERS TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <th className="p-4">Người dùng</th>
                <th className="p-4">Tên đăng nhập</th>
                <th className="p-4">Vai trò</th>
                <th className="p-4">Số điện thoại</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Không tìm thấy tài khoản người dùng nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const role = getRoleBadge(u.role);
                  const RoleIcon = role.icon;
                  const isCurrent = currentUser?.id === (u._id || u.id);

                  return (
                    <tr
                      key={u._id || u.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & Avatar */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                            {u.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <span>{u.fullName}</span>
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold border border-purple-200">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">
                              Tạo ngày: {u.createdAt ? formatDate(u.createdAt) : 'Mặc định'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {u.username}
                      </td>

                      {/* Role Badge */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${role.bg}`}
                        >
                          <RoleIcon className="w-3.5 h-3.5" />
                          <span>{role.label}</span>
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="p-4 text-slate-600 dark:text-slate-400 font-mono">
                        {u.phone || '—'}
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Hoạt động</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                            <XCircle className="w-3 h-3" />
                            <span>Tạm khóa</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Reset Password */}
                          <button
                            type="button"
                            onClick={() => handleOpenResetPasswordModal(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                            title="Đặt lại mật khẩu"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Toggle Lock / Unlock (not for self) */}
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                u.isActive
                                  ? 'text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                                  : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              }`}
                              title={u.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            >
                              {u.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </button>
                          )}

                          {/* Delete (not for self, not for root admin) */}
                          {!isCurrent && u.username !== 'admin' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              title="Xóa tài khoản"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: TẠO TÀI KHOẢN MỚI */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <UserPlus className="w-5 h-5 text-purple-600" />
                <span>Tạo Tài Khoản Người Dùng Mới</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Tên đăng nhập *
                </label>
                <input
                  type="text"
                  required
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="ví dụ: canlua2, ketoan2..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Mật khẩu khởi tạo * (tối thiểu 6 ký tự)
                </label>
                <input
                  type="password"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Mật khẩu..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Họ và tên đầy đủ *
                </label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="ví dụ: Nguyễn Văn Cân..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Vai trò hệ thống *
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="nhan_vien_can">NV Cân Lúa</option>
                    <option value="ke_toan">Kế Toán Vựa</option>
                    <option value="chu_vua">Chủ Vựa Lúa</option>
                    <option value="admin">Quản Trị Viên</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="09xx..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all"
                >
                  {submitting ? 'Đang tạo...' : 'Tạo Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CHỈNH SỬA TÀI KHOẢN */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Edit2 className="w-5 h-5 text-purple-600" />
                <span>Chỉnh Sửa Tài Khoản ({selectedUser.username})</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Vai trò hệ thống
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200"
                >
                  <option value="nhan_vien_can">NV Cân Lúa</option>
                  <option value="ke_toan">Kế Toán Vựa</option>
                  <option value="chu_vua">Chủ Vựa Lúa</option>
                  <option value="admin">Quản Trị Viên</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ĐẶT LẠI MẬT KHẨU */}
      {isResetPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <span>Đặt Lại Mật Khẩu ({selectedUser.username})</span>
              </div>
              <button
                type="button"
                onClick={() => setIsResetPasswordModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Nhập mật khẩu mới cho tài khoản{' '}
                <strong className="text-slate-800 dark:text-slate-200 font-mono">
                  {selectedUser.username}
                </strong>{' '}
                ({selectedUser.fullName}):
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Mật khẩu mới * (tối thiểu 6 ký tự)
                </label>
                <input
                  type="password"
                  required
                  value={formNewPassword}
                  onChange={(e) => setFormNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all"
                >
                  {submitting ? 'Đang cập nhật...' : 'Xác Nhận Đổi Mật Khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
