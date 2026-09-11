import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { WarehouseTransaction } from '../models/WarehouseTransaction';
import { Inventory } from '../models/Inventory';
import { RiceType } from '../models/RiceType';
import { WarehouseLocation } from '../models/WarehouseLocation';
import { AuthRequest } from '../middlewares/auth';
import { generateCode } from '../utils/codeGenerator';
import { ActivityLog } from '../models/ActivityLog';

export const getWarehouseTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, riceTypeId, warehouseId, search, from, to, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};
    if (type && type !== 'all') {
      query.type = type;
    }
    if (riceTypeId) {
      query.riceTypeId = riceTypeId;
    }
    if (warehouseId && warehouseId !== 'all') {
      query.warehouseId = warehouseId;
    }
    if (search && typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { code: regex },
        { partnerName: regex },
        { riceTypeName: regex },
        { warehouseName: regex },
      ];
    }
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from as string);
      if (to) {
        const toDate = new Date(to as string);
        toDate.setHours(23, 59, 59, 999);
        query.date.$lte = toDate;
      }
    }

    const [transactions, total] = await Promise.all([
      WarehouseTransaction.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      WarehouseTransaction.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi lấy lịch sử kho' });
  }
};

export const createWarehouseTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, riceTypeId, warehouseId, quantityKg, unitPrice, partnerName, partnerPhone, note, date } = req.body;

    if (!type || !riceTypeId || !quantityKg || !unitPrice || !partnerName) {
      res.status(400).json({
        success: false,
        message: 'Vui lòng điền đủ: Loại giao dịch, Giống lúa, Số lượng (kg), Đơn giá, và Đối tác',
      });
      return;
    }

    const riceType = await RiceType.findById(riceTypeId);
    if (!riceType) {
      res.status(404).json({ success: false, message: 'Không tìm thấy loại lúa đã chọn' });
      return;
    }

    let targetWarehouseId = warehouseId;
    let targetWarehouseName = 'Kho Chính';
    if (warehouseId) {
      const wh = await WarehouseLocation.findById(warehouseId);
      if (wh) {
        targetWarehouseName = wh.name;
        targetWarehouseId = wh._id;
      }
    } else {
      const defaultWh = await WarehouseLocation.findOne({ isDefault: true, isActive: true }) || await WarehouseLocation.findOne({ isActive: true });
      if (defaultWh) {
        targetWarehouseId = defaultWh._id;
        targetWarehouseName = defaultWh.name;
      }
    }

    const numQty = Math.max(0, Number(quantityKg));
    const numPrice = Math.max(0, Number(unitPrice));
    const totalAmount = Math.round(numQty * numPrice);

    // If export, check stock
    if (type === 'export') {
      const invFilter: any = { riceTypeId: riceType._id };
      if (targetWarehouseId) invFilter.warehouseId = targetWarehouseId;

      const currentStock = await Inventory.findOne(invFilter);
      const availableKg = currentStock?.currentQuantityKg || 0;
      if (availableKg < numQty) {
        res.status(400).json({
          success: false,
          message: `Tồn kho ${riceType.name} tại ${targetWarehouseName} hiện chỉ còn ${availableKg.toLocaleString()} kg, không đủ xuất ${numQty.toLocaleString()} kg`,
        });
        return;
      }
    }

    const code = generateCode(type === 'import' ? 'NK' : 'XK');
    const transaction = await WarehouseTransaction.create({
      code,
      type,
      warehouseId: targetWarehouseId,
      warehouseName: targetWarehouseName,
      riceTypeId: riceType._id,
      riceTypeName: riceType.name,
      quantityKg: numQty,
      unitPrice: numPrice,
      totalAmount,
      partnerName: partnerName.trim(),
      partnerPhone: partnerPhone?.trim(),
      note: note?.trim(),
      date: date ? new Date(date) : new Date(),
      createdBy: req.user ? new mongoose.Types.ObjectId(req.user.id) : riceType._id,
      createdByName: req.user?.fullName || 'Người dùng',
    });

    // Update inventory
    const quantityDelta = type === 'import' ? numQty : -numQty;
    const invQuery: any = { riceTypeId: riceType._id };
    if (targetWarehouseId) invQuery.warehouseId = targetWarehouseId;

    await Inventory.findOneAndUpdate(
      invQuery,
      {
        $inc: { currentQuantityKg: quantityDelta },
        $set: {
          riceTypeName: riceType.name,
          warehouseId: targetWarehouseId,
          warehouseName: targetWarehouseName,
          lastUpdated: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    if (req.user) {
      await ActivityLog.create({
        userId: req.user.id,
        userName: req.user.fullName,
        userRole: req.user.role,
        action: `create_${type}_transaction`,
        targetType: 'WarehouseTransaction',
        targetId: transaction._id,
        targetCode: transaction.code,
        detail: {
          warehouse: targetWarehouseName,
          riceType: riceType.name,
          quantityKg: numQty,
          partnerName,
          totalAmount,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: type === 'import' ? `Nhập kho ${targetWarehouseName} thành công` : `Xuất bán từ ${targetWarehouseName} thành công`,
      data: transaction,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi tạo giao dịch kho' });
  }
};

export const getInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { warehouseId } = req.query;
    const query: any = {};
    if (warehouseId && warehouseId !== 'all') {
      query.warehouseId = warehouseId;
    }

    const inventoryList = await Inventory.find(query).populate('riceTypeId').sort({ warehouseName: 1, riceTypeName: 1 }).lean();
    res.json({ success: true, data: inventoryList });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateInventoryWarning = async (req: Request, res: Response): Promise<void> => {
  try {
    const { minWarningKg, maxWarningKg } = req.body;
    const inv = await Inventory.findByIdAndUpdate(
      req.params.id,
      {
        ...(minWarningKg !== undefined && { minWarningKg }),
        ...(maxWarningKg !== undefined && { maxWarningKg }),
      },
      { new: true }
    );
    res.json({ success: true, message: 'Cập nhật ngưỡng cảnh báo kho thành công', data: inv });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
