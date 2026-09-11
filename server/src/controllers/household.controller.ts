import { Request, Response } from 'express';
import { Household } from '../models/Household';
import { WeighingSession } from '../models/WeighingSession';
import { AuthRequest } from '../middlewares/auth';
import { ActivityLog } from '../models/ActivityLog';

export const getHouseholds = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page = '1', limit = '50', sort = '-updatedAt' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};
    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { address: searchRegex },
      ];
    }

    const [households, total] = await Promise.all([
      Household.find(query).sort(sort as string).skip(skip).limit(limitNum),
      Household.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: households,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi lấy danh sách hộ dân' });
  }
};

export const getHouseholdById = async (req: Request, res: Response): Promise<void> => {
  try {
    const household = await Household.findById(req.params.id);
    if (!household) {
      res.status(404).json({ success: false, message: 'Không tìm thấy thông tin hộ dân' });
      return;
    }
    res.json({ success: true, data: household });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createHousehold = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone, address, note, idCardNumber } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: 'Tên hộ dân là bắt buộc' });
      return;
    }

    const household = await Household.create({
      name: name.trim(),
      phone: phone?.trim(),
      address: address?.trim(),
      note: note?.trim(),
      idCardNumber: idCardNumber?.trim(),
    });

    if (req.user) {
      await ActivityLog.create({
        userId: req.user.id,
        userName: req.user.fullName,
        userRole: req.user.role,
        action: 'create_household',
        targetType: 'Household',
        targetId: household._id,
        detail: { name: household.name, phone: household.phone },
      });
    }

    res.status(201).json({ success: true, message: 'Thêm hộ dân thành công', data: household });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi thêm hộ dân' });
  }
};

export const updateHousehold = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone, address, note, idCardNumber } = req.body;
    const household = await Household.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name: name.trim() }),
        phone: phone?.trim(),
        address: address?.trim(),
        note: note?.trim(),
        idCardNumber: idCardNumber?.trim(),
      },
      { new: true }
    );

    if (!household) {
      res.status(404).json({ success: false, message: 'Không tìm thấy hộ dân' });
      return;
    }

    res.json({ success: true, message: 'Cập nhật hộ dân thành công', data: household });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteHousehold = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sessionCount = await WeighingSession.countDocuments({ householdId: req.params.id });
    if (sessionCount > 0) {
      res.status(400).json({
        success: false,
        message: `Không thể xóa hộ dân này vì đã có ${sessionCount} phiếu cân liên kết`,
      });
      return;
    }

    const deleted = await Household.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Không tìm thấy hộ dân' });
      return;
    }

    res.json({ success: true, message: 'Đã xóa hộ dân thành công' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHouseholdHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const sessions = await WeighingSession.find({ householdId: req.params.id })
      .sort({ weighDate: -1, createdAt: -1 });

    const totalStats = sessions.reduce(
      (acc, curr) => ({
        totalWeightKg: acc.totalWeightKg + curr.totalWeightKg,
        totalAmount: acc.totalAmount + curr.totalAmount,
        sessionCount: acc.sessionCount + 1,
      }),
      { totalWeightKg: 0, totalAmount: 0, sessionCount: 0 }
    );

    res.json({
      success: true,
      data: {
        sessions,
        stats: totalStats,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
