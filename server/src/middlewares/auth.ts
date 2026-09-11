import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../models/User';

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập để tiếp tục' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'canlua_super_secret_jwt_key_2026_modern_rice_weighing';

  try {
    const decoded = jwt.verify(token, secret) as AuthUser;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ' });
  }
};

export const authorize = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực người dùng' });
      return;
    }

    // 'chu_vua' or 'admin' has super-admin privileges
    if (req.user.role === 'chu_vua' || req.user.role === 'admin') {
      next();
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện thao tác này',
      });
      return;
    }

    next();
  };
};
