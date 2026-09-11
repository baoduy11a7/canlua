import { Request, Response } from 'express';
import { RiceType } from '../models/RiceType';
import { Inventory } from '../models/Inventory';

export const getRiceTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { activeOnly } = req.query;
    const query: any = {};
    if (activeOnly === 'true') {
      query.isActive = true;
    }
    const riceTypes = await RiceType.find(query).sort({ name: 1 });
    res.json({ success: true, data: riceTypes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createRiceType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, defaultPricePerKg, description } = req.body;
    if (!name || !code) {
      res.status(400).json({ success: false, message: 'Tên loại lúa và mã lúa là bắt buộc' });
      return;
    }

    const existing = await RiceType.findOne({ name: name.trim() });
    if (existing) {
      res.status(400).json({ success: false, message: 'Loại lúa này đã tồn tại' });
      return;
    }

    const riceType = await RiceType.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      defaultPricePerKg: defaultPricePerKg || 7000,
      description: description?.trim(),
      isActive: true,
    });

    // Ensure inventory record exists
    await Inventory.findOneAndUpdate(
      { riceTypeId: riceType._id },
      {
        riceTypeId: riceType._id,
        riceTypeName: riceType.name,
        $setOnInsert: { currentQuantityKg: 0, minWarningKg: 1000 },
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, message: 'Thêm loại lúa thành công', data: riceType });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRiceType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, defaultPricePerKg, description, isActive } = req.body;
    const riceType = await RiceType.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name: name.trim() }),
        ...(code && { code: code.trim().toUpperCase() }),
        ...(defaultPricePerKg !== undefined && { defaultPricePerKg }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
      { new: true }
    );

    if (!riceType) {
      res.status(404).json({ success: false, message: 'Không tìm thấy loại lúa' });
      return;
    }

    if (name) {
      await Inventory.updateOne({ riceTypeId: riceType._id }, { riceTypeName: riceType.name });
    }

    res.json({ success: true, message: 'Cập nhật loại lúa thành công', data: riceType });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
