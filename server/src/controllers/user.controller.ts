import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '../models/User';
import { ActivityLog } from '../models/ActivityLog';
import { AuthRequest } from '../middlewares/auth';

// GET /api/users
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, search, status } = req.query;

    const query: any = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    if (search) {
      const regex = new RegExp(String(search).trim(), 'i');
      query.$or = [{ fullName: regex }, { username: regex }, { phone: regex }];
    }

    const users = await User.find(query).select('-passwordHash').sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi lấy danh sách tài khoản' });
  }
};

// POST /api/users
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, password, fullName, role = 'nhan_vien_can', phone } = req.body;

    if (!username || !password || !fullName) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ tên đăng nhập, mật khẩu và họ tên',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự',
      });
      return;
    }

    const normalizedUsername = username.trim().toLowerCase();
    const existing = await User.findOne({ username: normalizedUsername });
    if (existing) {
      res.status(400).json({
        success: false,
        message: 'Tên đăng nhập này đã được sử dụng, vui lòng chọn tên khác',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username: normalizedUsername,
      passwordHash,
      fullName: fullName.trim(),
      role: role as UserRole,
      phone: phone?.trim(),
      isActive: true,
    });

    if (req.user) {
      await ActivityLog.create({
        userId: req.user.id,
        userName: req.user.fullName,
        userRole: req.user.role,
        action: 'create_user',
        targetType: 'User',
        targetId: newUser._id,
        detail: { username: newUser.username, role: newUser.role, fullName: newUser.fullName },
      });
    }

    const userObj = newUser.toObject();
    delete (userObj as any).passwordHash;

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản thành công',
      data: userObj,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi tạo tài khoản' });
  }
};

// PUT /api/users/:id
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { fullName, role, phone, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản người dùng' });
      return;
    }

    // Protect self from removing own admin role
    if (req.user?.id === id && role && role !== 'admin') {
      res.status(400).json({
        success: false,
        message: 'Bạn không thể tự hạ quyền Quản trị viên của chính mình',
      });
      return;
    }

    if (fullName) user.fullName = fullName.trim();
    if (role) user.role = role as UserRole;
    if (phone !== undefined) user.phone = phone.trim();
    if (isActive !== undefined) {
      if (req.user?.id === id && isActive === false) {
        res.status(400).json({
          success: false,
          message: 'Bạn không thể tự khóa tài khoản đang đăng nhập của mình',
        });
        return;
      }
      user.isActive = isActive;
    }

    await user.save();

    if (req.user) {
      await ActivityLog.create({
        userId: req.user.id,
        userName: req.user.fullName,
        userRole: req.user.role,
        action: 'update_user',
        targetType: 'User',
        targetId: user._id,
        detail: { username: user.username, role: user.role },
      });
    }

    const userObj = user.toObject();
    delete (userObj as any).passwordHash;

    res.json({
      success: true,
      message: 'Cập nhật tài khoản thành công',
      data: userObj,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi cập nhật tài khoản' });
  }
};

// PATCH /api/users/:id/reset-password
export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự',
      });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản người dùng' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    if (req.user) {
      await ActivityLog.create({
        userId: req.user.id,
        userName: req.user.fullName,
        userRole: req.user.role,
        action: 'reset_password',
        targetType: 'User',
        targetId: user._id,
        detail: { username: user.username },
      });
    }

    res.json({
      success: true,
      message: `Đã đặt lại mật khẩu cho tài khoản ${user.username} thành công`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi đặt lại mật khẩu' });
  }
};

// PATCH /api/users/:id/toggle-status
export const toggleUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.user?.id === id) {
      res.status(400).json({
        success: false,
        message: 'Bạn không thể tự khóa tài khoản của chính mình',
      });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản người dùng' });
      return;
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: user.isActive
        ? `Đã kích hoạt tài khoản ${user.username}`
        : `Đã tạm khóa tài khoản ${user.username}`,
      data: { id: user._id, isActive: user.isActive },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi đổi trạng thái tài khoản' });
  }
};

// DELETE /api/users/:id
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.user?.id === id) {
      res.status(400).json({
        success: false,
        message: 'Bạn không thể tự xóa tài khoản của chính mình',
      });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
      return;
    }

    // Do not allow deleting the main admin
    if (user.username === 'admin') {
      res.status(400).json({
        success: false,
        message: 'Không thể xóa tài khoản Quản trị viên gốc của hệ thống',
      });
      return;
    }

    await User.findByIdAndDelete(id);

    if (req.user) {
      await ActivityLog.create({
        userId: req.user.id,
        userName: req.user.fullName,
        userRole: req.user.role,
        action: 'delete_user',
        targetType: 'User',
        targetId: user._id,
        detail: { username: user.username },
      });
    }

    res.json({
      success: true,
      message: `Đã xóa tài khoản ${user.username} thành công`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi xóa tài khoản' });
  }
};
