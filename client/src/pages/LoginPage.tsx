import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/client';
import {
  Lock,
  User,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  UserPlus,
  Phone,
  LogIn,
} from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const { setAuth } = useAuthStore();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Register form state (no role selection - automatically 'nhan_vien_can')
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', {
        username: username.trim(),
        password,
      });

      if (res.data.success) {
        const userData = res.data.data.user;
        toast.success(`Xin chào, ${userData.fullName}!`);
        setAuth(userData, res.data.data.accessToken, res.data.data.refreshToken);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Tài khoản hoặc mật khẩu không chính xác');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regFullName.trim() || !regUsername.trim() || !regPassword) {
      toast.error('Vui lòng điền đầy đủ họ tên, tên đăng nhập và mật khẩu');
      return;
    }

    if (regPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      toast.error('Mật khẩu xác nhận không trùng khớp');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/auth/register', {
        username: regUsername.trim().toLowerCase(),
        password: regPassword,
        fullName: regFullName.trim(),
        role: 'nhan_vien_can', // Automatically assigned as Rice Weighing Staff
        phone: regPhone.trim(),
      });

      if (res.data.success) {
        const userData = res.data.data.user;
        toast.success(`🎉 Đăng ký thành công! Xin chào người cân lúa ${userData.fullName}`);
        setAuth(userData, res.data.data.accessToken, res.data.data.refreshToken);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi đăng ký tài khoản');
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click select demo accounts for login
  const setQuickAccount = (u: string, p = '123456') => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center py-4 px-3 sm:px-4 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-slate-100 selection:bg-brand-500 selection:text-white relative overflow-x-hidden">
      {/* Ambient background decorative orbs */}
      <div className="absolute -top-32 -left-32 w-72 h-72 sm:w-96 sm:h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-72 h-72 sm:w-96 sm:h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[420px] bg-slate-900/95 border border-slate-800/90 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl backdrop-blur-xl relative z-10 mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-5 sm:mb-6">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 mx-auto flex items-center justify-center text-2xl sm:text-3xl shadow-md shadow-emerald-500/30 mb-2">
            🌾
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
            CÂN LÚA THÔNG MINH
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Sổ cân điện tử & Quản lý vựa lúa 25 bao
          </p>
        </div>

        {/* Mode Switcher Tabs (Đăng Nhập / Đăng Ký) */}
        <div className="flex bg-slate-800/90 p-1 rounded-xl sm:rounded-2xl border border-slate-700/80 mb-5">
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all ${
              authMode === 'login'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Đăng Nhập</span>
          </button>

          <button
            type="button"
            onClick={() => setAuthMode('register')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all ${
              authMode === 'register'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Đăng Ký</span>
          </button>
        </div>

        {/* 1. LOGIN FORM */}
        {authMode === 'login' && (
          <>
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin, canlua..."
                    autoCapitalize="none"
                    autoComplete="username"
                    className="w-full pl-9 pr-3 py-2.5 sm:py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-base sm:text-sm font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    autoComplete="current-password"
                    className="w-full pl-9 pr-10 py-2.5 sm:py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-base sm:text-sm font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 sm:py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white rounded-xl font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all mt-4 cursor-pointer"
              >
                {loading ? (
                  <span>Đang đăng nhập...</span>
                ) : (
                  <>
                    <span>Vào Bàn Cân Lúa</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Switch to Register link */}
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold hover:underline"
              >
                Chưa có tài khoản? Đăng ký tại đây →
              </button>
            </div>

            {/* Quick Account Switcher (Compact for Mobile) */}
            <div className="mt-5 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Chọn nhanh (Mật khẩu: 123456):</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Admin */}
                <button
                  type="button"
                  onClick={() => setQuickAccount('admin')}
                  className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all ${
                    username === 'admin'
                      ? 'bg-purple-950/60 border-purple-500 ring-1 ring-purple-500/40'
                      : 'bg-slate-800/70 hover:bg-slate-700/80 border-slate-700/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-400 text-xs">Quản Trị</span>
                    {username === 'admin' && <CheckCircle2 className="w-3 h-3 text-purple-400" />}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">admin (Toàn quyền)</div>
                </button>

                {/* NV Can Lua */}
                <button
                  type="button"
                  onClick={() => setQuickAccount('canlua')}
                  className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all ${
                    username === 'canlua'
                      ? 'bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-500/40'
                      : 'bg-slate-800/70 hover:bg-slate-700/80 border-slate-700/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 text-xs">NV Cân Lúa</span>
                    {username === 'canlua' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">canlua (Cân & In)</div>
                </button>

                {/* Chu Vua */}
                <button
                  type="button"
                  onClick={() => setQuickAccount('chuvua')}
                  className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all ${
                    username === 'chuvua'
                      ? 'bg-amber-950/60 border-amber-500 ring-1 ring-amber-500/40'
                      : 'bg-slate-800/70 hover:bg-slate-700/80 border-slate-700/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 text-xs">Chủ Vựa</span>
                    {username === 'chuvua' && <CheckCircle2 className="w-3 h-3 text-amber-400" />}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">chuvua (Kho bãi)</div>
                </button>

                {/* Ke Toan */}
                <button
                  type="button"
                  onClick={() => setQuickAccount('ketoan')}
                  className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all ${
                    username === 'ketoan'
                      ? 'bg-blue-950/60 border-blue-500 ring-1 ring-blue-500/40'
                      : 'bg-slate-800/70 hover:bg-slate-700/80 border-slate-700/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-400 text-xs">Kế Toán</span>
                    {username === 'ketoan' && <CheckCircle2 className="w-3 h-3 text-blue-400" />}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">ketoan (Thu chi)</div>
                </button>
              </div>
            </div>
          </>
        )}

        {/* 2. REGISTER FORM (NO ROLE SELECTION - AUTOMATIC 'nhan_vien_can') */}
        {authMode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Họ và tên người cân *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Nguyễn Văn Cân"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-base sm:text-sm font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Tên đăng nhập * (viết liền không dấu)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <span className="text-xs font-mono font-bold text-slate-500">@</span>
                </div>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="canlua_dongthap"
                  autoCapitalize="none"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-base sm:text-sm font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Số điện thoại liên lạc
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="0918..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-base sm:text-sm font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Mật khẩu * (tối thiểu 6 ký tự)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mật khẩu..."
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-base sm:text-sm font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                    title={showRegPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Xác nhận lại mật khẩu *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-base sm:text-sm font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white rounded-xl font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all mt-4 cursor-pointer"
            >
              {loading ? (
                <span>Đang xử lý đăng ký...</span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Hoàn Tất Đăng Ký & Vào Bàn Cân</span>
                </>
              )}
            </button>

            {/* Switch back to Login */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold hover:underline"
              >
                Đã có tài khoản? Quay lại Đăng nhập →
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
