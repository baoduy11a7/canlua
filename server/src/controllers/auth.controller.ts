import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/User';
import { ActivityLog } from '../models/ActivityLog';
import { AuthRequest } from '../middlewares/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'canlua_super_secret_jwt_key_2026_modern_rice_weighing';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'canlua_super_secret_refresh_key_2026';

const generateTokens = (user: any) => {
  const payload = {
    id: user._id.toString(),
    username: user.username,
    fullName: user.fullName,
    role: user.role,
  };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '30d' });
  return { accessToken, refreshToken, user: payload };
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, fullName, role = 'nhan_vien_can', phone } = req.body;
    if (!username || !password || !fullName) {
      res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ tên đăng nhập, mật khẩu và họ tên' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' });
      return;
    }

    const normalizedUsername = username.trim().toLowerCase();
    const existing = await User.findOne({ username: normalizedUsername });
    if (existing) {
      res.status(400).json({ success: false, message: 'Tên đăng nhập đã tồn tại trong hệ thống, vui lòng chọn tên khác' });
      return;
    }

    // Public registration cannot claim 'admin' role directly
    const assignedRole: UserRole = role === 'admin' ? 'nhan_vien_can' : (role as UserRole) || 'nhan_vien_can';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username: normalizedUsername,
      passwordHash,
      fullName: fullName.trim(),
      role: assignedRole,
      phone: phone?.trim(),
      isActive: true,
    });

    const tokens = generateTokens(newUser);

    // Audit log
    await ActivityLog.create({
      userId: newUser._id,
      userName: newUser.fullName,
      userRole: newUser.role,
      action: 'register',
      targetType: 'User',
      targetId: newUser._id,
      detail: { username: newUser.username, role: newUser.role },
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, message: 'Đăng ký tài khoản thành công', data: tokens });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi đăng ký tài khoản' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
      return;
    }

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không chính xác' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, message: 'Tài khoản đã bị tạm khóa' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không chính xác' });
      return;
    }

    const tokens = generateTokens(user);

    // Audit log
    await ActivityLog.create({
      userId: user._id,
      userName: user.fullName,
      userRole: user.role,
      action: 'login',
      targetType: 'User',
      targetId: user._id,
      detail: { username: user.username },
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Đăng nhập thành công', data: tokens });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi đăng nhập' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select('-passwordHash');
    if (!user) {
      res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, message: 'Thiếu refresh token' });
      return;
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Người dùng không tồn tại hoặc đã bị khóa' });
      return;
    }

    const tokens = generateTokens(user);
    res.json({ success: true, data: tokens });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Refresh token không hợp lệ' });
  }
};
