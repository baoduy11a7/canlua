import { Request, Response } from 'express';
import { WarehouseLocation } from '../models/WarehouseLocation';
import { AuthRequest } from '../middlewares/auth';
import { generateCode } from '../utils/codeGenerator';

export const getWarehouseLocations = async (req: Request, res: Response): Promise<void> => {
  try {
    const locations = await WarehouseLocation.find({ isActive: true }).sort({ isDefault: -1, name: 1 }).lean();
    res.json({ success: true, data: locations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi lấy danh sách kho' });
  }
};

export const createWarehouseLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, code, address, managerName, phone, capacityKg, note, isDefault } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: 'Tên kho là bắt buộc' });
      return;
    }

    const autoCode = code ? code.trim().toUpperCase() : generateCode('KHO');

    if (isDefault) {
      // Clear other defaults
      await WarehouseLocation.updateMany({}, { isDefault: false });
    }

    const location = await WarehouseLocation.create({
      name: name.trim(),
      code: autoCode,
      address: address?.trim(),
      managerName: managerName?.trim(),
      phone: phone?.trim(),
      capacityKg: Number(capacityKg) || 500000,
      note: note?.trim(),
      isDefault: Boolean(isDefault),
      isActive: true,
    });

    res.status(201).json({ success: true, message: 'Tạo kho mới thành công', data: location });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi tạo kho' });
  }
};

export const updateWarehouseLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, address, managerName, phone, capacityKg, note, isDefault, isActive } = req.body;

    if (isDefault) {
      await WarehouseLocation.updateMany({ _id: { $ne: req.params.id } }, { isDefault: false });
    }

    const location = await WarehouseLocation.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name: name.trim() }),
        ...(address !== undefined && { address: address.trim() }),
        ...(managerName !== undefined && { managerName: managerName.trim() }),
        ...(phone !== undefined && { phone: phone.trim() }),
        ...(capacityKg !== undefined && { capacityKg: Number(capacityKg) }),
        ...(note !== undefined && { note: note.trim() }),
        ...(isDefault !== undefined && { isDefault: Boolean(isDefault) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
      { new: true }
    );

    if (!location) {
      res.status(404).json({ success: false, message: 'Không tìm thấy kho' });
      return;
    }

    res.json({ success: true, message: 'Cập nhật kho thành công', data: location });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteWarehouseLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const location = await WarehouseLocation.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!location) {
      res.status(404).json({ success: false, message: 'Không tìm thấy kho' });
      return;
    }
    res.json({ success: true, message: 'Đã xóa kho khỏi hệ thống' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
