import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { WeighingSession, IGridColumn } from '../models/WeighingSession';
import { Household } from '../models/Household';
import { RiceType } from '../models/RiceType';
import { WarehouseTransaction } from '../models/WarehouseTransaction';
import { WarehouseLocation } from '../models/WarehouseLocation';
import { Inventory } from '../models/Inventory';
import { ActivityLog } from '../models/ActivityLog';
import { AuthRequest } from '../middlewares/auth';
import { generateCode, getExcelColumnLabel } from '../utils/codeGenerator';
import { calculateGridStats } from '../services/gridCalculator';

export const createSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      householdId,
      newHousehold,
      riceTypeId,
      warehouseId,
      pricePerKg,
      tareWeightPerBagKg = 0,
      weighDate,
      note,
    } = req.body;

    let targetHouseholdId = householdId;
    let targetHousehold: any;

    // Support quick-creating household on the fly
    if (!targetHouseholdId && newHousehold && newHousehold.name) {
      targetHousehold = await Household.create({
        name: newHousehold.name.trim(),
        phone: newHousehold.phone?.trim(),
        address: newHousehold.address?.trim(),
        note: newHousehold.note?.trim(),
      });
      targetHouseholdId = targetHousehold._id;
    } else if (targetHouseholdId) {
      targetHousehold = await Household.findById(targetHouseholdId);
      if (!targetHousehold) {
        res.status(404).json({ success: false, message: 'Không tìm thấy thông tin hộ dân đã chọn' });
        return;
      }
    } else {
      res.status(400).json({ success: false, message: 'Vui lòng chọn hoặc nhập tên hộ dân' });
      return;
    }

    const riceType = await RiceType.findById(riceTypeId);
    if (!riceType) {
      res.status(404).json({ success: false, message: 'Vui lòng chọn loại lúa hợp lệ' });
      return;
    }

    let targetWarehouseId = warehouseId;
    let warehouseName = 'Kho Chính';
    if (warehouseId) {
      const wh = await WarehouseLocation.findById(warehouseId);
      if (wh) {
        warehouseName = wh.name;
        targetWarehouseId = wh._id;
      }
    } else {
      const defaultWh = await WarehouseLocation.findOne({ isDefault: true, isActive: true }) || await WarehouseLocation.findOne({ isActive: true });
      if (defaultWh) {
        targetWarehouseId = defaultWh._id;
        warehouseName = defaultWh.name;
      }
    }

    const code = generateCode('PC');

    const initialColumns: IGridColumn[] = [
      { colIndex: 0, colLabel: '1', rows: [null, null, null, null, null] },
      { colIndex: 1, colLabel: '2', rows: [null, null, null, null, null] },
      { colIndex: 2, colLabel: '3', rows: [null, null, null, null, null] },
      { colIndex: 3, colLabel: '4', rows: [null, null, null, null, null] },
      { colIndex: 4, colLabel: '5', rows: [null, null, null, null, null] },
    ];

    const session = await WeighingSession.create({
      code,
      householdId: targetHousehold._id,
      householdNameSnapshot: targetHousehold.name,
      householdPhoneSnapshot: targetHousehold.phone,
      householdAddressSnapshot: targetHousehold.address,
      riceTypeId: riceType._id,
      riceTypeNameSnapshot: riceType.name,
      warehouseId: targetWarehouseId,
      warehouseNameSnapshot: warehouseName,
      pricePerKg: Number(pricePerKg) || riceType.defaultPricePerKg || 7000,
      tareWeightPerBagKg: Number(tareWeightPerBagKg) || 0,
      status: 'open',
      columns: initialColumns,
      grossWeightKg: 0,
      tareTotalKg: 0,
      totalWeightKg: 0,
      totalWeighCount: 0,
      totalAmount: 0,
      note,
      createdBy: req.user ? new mongoose.Types.ObjectId(req.user.id) : targetHousehold._id,
      createdByName: req.user?.fullName || 'Hệ thống',
      weighDate: weighDate ? new Date(weighDate) : new Date(),
    });

    if (req.user) {
      await ActivityLog.create({
        userId: req.user.id,
        userName: req.user.fullName,
        userRole: req.user.role,
        action: 'create_session',
        targetType: 'WeighingSession',
        targetId: session._id,
        targetCode: session.code,
        detail: {
          household: targetHousehold.name,
          riceType: riceType.name,
          pricePerKg: session.pricePerKg,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Tạo phiếu cân thành công',
      data: session,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi tạo phiếu cân' });
  }
};

export const getSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status,
      search,
      riceTypeId,
      householdId,
      from,
      to,
      page = '1',
      limit = '30',
      sort = '-weighDate',
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 30;
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (riceTypeId) {
      query.riceTypeId = riceTypeId;
    }

    if (householdId) {
      query.householdId = householdId;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { code: regex },
        { householdNameSnapshot: regex },
        { householdPhoneSnapshot: regex },
        { riceTypeNameSnapshot: regex },
      ];
    }

    if (from || to) {
      query.weighDate = {};
      if (from) {
        query.weighDate.$gte = new Date(from as string);
      }
      if (to) {
        const toDate = new Date(to as string);
        toDate.setHours(23, 59, 59, 999);
        query.weighDate.$lte = toDate;
      }
    }

    const [sessions, total] = await Promise.all([
      WeighingSession.find(query).sort(sort as string).skip(skip).limit(limitNum),
      WeighingSession.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: sessions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi lấy danh sách phiếu cân' });
  }
};

export const getSessionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await WeighingSession.findById(req.params.id);
    if (!session) {
      res.status(404).json({ success: false, message: 'Không tìm thấy phiếu cân' });
      return;
    }
    res.json({ success: true, data: session });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCell = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { colIndex, rowIndex, value } = req.body;

    if (colIndex === undefined || rowIndex === undefined || rowIndex < 0 || rowIndex > 4) {
      res.status(400).json({ success: false, message: 'Vị trí ô không hợp lệ (hàng 1-5)' });
      return;
    }

    const session = await WeighingSession.findById(id);
    if (!session) {
      res.status(404).json({ success: false, message: 'Không tìm thấy phiếu cân' });
      return;
    }

    if (session.status === 'closed' || session.status === 'paid') {
      // Only admin or chu_vua can modify closed session
      if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'chu_vua')) {
        res.status(403).json({
          success: false,
          message: 'Phiếu cân đã chốt/thanh toán, chỉ Quản trị viên mới có quyền chỉnh sửa',
        });
        return;
      }
    }

    // Normalize value
    let numVal: number | null = null;
    if (value !== null && value !== undefined && value !== '') {
      const parsed = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
      if (!isNaN(parsed) && parsed > 0) {
        numVal = Math.round(parsed * 100) / 100;
      }
    }

    // Expand columns if colIndex is beyond current columns
    const columns: IGridColumn[] = [...session.columns];
    while (columns.length <= colIndex) {
      const nextIdx = columns.length;
      columns.push({
        colIndex: nextIdx,
        colLabel: `${nextIdx + 1}`,
        rows: [null, null, null, null, null],
      });
    }

    // Update target cell
    columns[colIndex].rows[rowIndex] = numVal;

    // Recalculate stats
    const stats = calculateGridStats(columns, session.pricePerKg, session.tareWeightPerBagKg);

    session.columns = columns;
    session.grossWeightKg = stats.grossWeightKg;
    session.tareTotalKg = stats.tareTotalKg;
    session.totalWeightKg = stats.totalWeightKg;
    session.totalWeighCount = stats.totalWeighCount;
    session.totalAmount = stats.totalAmount;

    await session.save();

    res.json({
      success: true,
      message: 'Cập nhật ô thành công',
      data: {
        session,
        stats,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi cập nhật ô cân' });
  }
};

export const renameHousehold = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { householdId, newHouseholdName, newHouseholdPhone, newHouseholdAddress, reason } = req.body;

    const session = await WeighingSession.findById(id);
    if (!session) {
      res.status(404).json({ success: false, message: 'Không tìm thấy phiếu cân' });
      return;
    }

    let targetHouseholdId = householdId;
    let targetName = newHouseholdName;
    let targetPhone = newHouseholdPhone;
    let targetAddress = newHouseholdAddress;

    if (householdId) {
      const h = await Household.findById(householdId);
      if (h) {
        targetName = h.name;
        targetPhone = h.phone;
        targetAddress = h.address;
      }
    } else if (newHouseholdName) {
      // Create new quick household
      const created = await Household.create({
        name: newHouseholdName.trim(),
        phone: newHouseholdPhone?.trim(),
        address: newHouseholdAddress?.trim(),
      });
      targetHouseholdId = created._id;
      targetName = created.name;
    }

    const previousName = session.householdNameSnapshot;
    const logEntry = {
      from: previousName,
      to: targetName,
      householdIdFrom: session.householdId,
      householdIdTo: targetHouseholdId,
      changedBy: req.user ? new mongoose.Types.ObjectId(req.user.id) : session.createdBy,
      changedByName: req.user?.fullName || 'Người dùng',
      changedAt: new Date(),
      reason: reason || 'Đổi tên theo yêu cầu',
    };

    session.householdId = targetHouseholdId;
    session.householdNameSnapshot = targetName;
    if (targetPhone !== undefined) session.householdPhoneSnapshot = targetPhone;
    if (targetAddress !== undefined) session.householdAddressSnapshot = targetAddress;
    session.nameChangeLog.push(logEntry);

    await session.save();

    res.json({
      success: true,
      message: `Đã đổi tên hộ dân từ "${previousName}" sang "${targetName}"`,
      data: session,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const closeSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const session = await WeighingSession.findById(id);
    if (!session) {
      res.status(404).json({ success: false, message: 'Không tìm thấy phiếu cân' });
      return;
    }

    if (session.status === 'closed' || session.status === 'paid') {
      res.status(400).json({ success: false, message: 'Phiếu cân này đã được chốt trước đó' });
      return;
    }

    if (session.totalWeighCount === 0 || session.totalWeightKg <= 0) {
      res.status(400).json({ success: false, message: 'Không thể chốt phiếu cân trống hoặc có khối lượng bằng 0' });
      return;
    }

    // 1. Mark session as closed
    session.status = 'closed';
    session.closedAt = new Date();
    await session.save();

    // 2. Automatically create Warehouse Import transaction
    const warehouseTxCode = generateCode('NK');
    await WarehouseTransaction.create({
      code: warehouseTxCode,
      type: 'import',
      warehouseId: session.warehouseId,
      warehouseName: session.warehouseNameSnapshot || 'Kho Chính',
      riceTypeId: session.riceTypeId,
      riceTypeName: session.riceTypeNameSnapshot,
      quantityKg: session.totalWeightKg,
      unitPrice: session.pricePerKg,
      totalAmount: session.totalAmount,
      relatedSessionId: session._id,
      partnerName: session.householdNameSnapshot,
      partnerPhone: session.householdPhoneSnapshot,
      note: `Tự động nhập ${session.warehouseNameSnapshot || 'kho'} từ Phiếu cân ${session.code}`,
      date: session.weighDate || new Date(),
      createdBy: req.user ? new mongoose.Types.ObjectId(req.user.id) : session.createdBy,
      createdByName: req.user?.fullName || 'Hệ thống',
    });

    // 3. Update Inventory for this rice variety and warehouse
    const invQuery: any = { riceTypeId: session.riceTypeId };
    if (session.warehouseId) {
      invQuery.warehouseId = session.warehouseId;
    }

    await Inventory.findOneAndUpdate(
      invQuery,
      {
        $inc: { currentQuantityKg: session.totalWeightKg },
        $set: {
          riceTypeName: session.riceTypeNameSnapshot,
          warehouseId: session.warehouseId,
          warehouseName: session.warehouseNameSnapshot || 'Kho Chính',
          lastUpdated: new Date(),
        },
      },
      { upsert: true }
    );

    // 4. Update cumulative stats for Household
    await Household.findByIdAndUpdate(session.householdId, {
      $inc: {
        totalWeighedKg: session.totalWeightKg,
        totalPaidAmount: session.totalAmount,
        sessionCount: 1,
      },
    });

    // 5. Activity log
    if (req.user) {
      await ActivityLog.create({
        userId: req.user.id,
        userName: req.user.fullName,
        userRole: req.user.role,
        action: 'close_session',
        targetType: 'WeighingSession',
        targetId: session._id,
        targetCode: session.code,
        detail: {
          totalWeightKg: session.totalWeightKg,
          totalAmount: session.totalAmount,
          totalWeighCount: session.totalWeighCount,
        },
      });
    }

    res.json({
      success: true,
      message: 'Chốt phiếu cân thành công. Đã tự động nhập kho và cập nhật hồ sơ hộ dân.',
      data: session,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi chốt phiếu cân' });
  }
};

export const markSessionPaid = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const session = await WeighingSession.findById(id);
    if (!session) {
      res.status(404).json({ success: false, message: 'Không tìm thấy phiếu cân' });
      return;
    }

    session.status = 'paid';
    session.paidAt = new Date();
    await session.save();

    res.json({
      success: true,
      message: 'Đã xác nhận thanh toán phiếu cân',
      data: session,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reopenSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const session = await WeighingSession.findById(id);
    if (!session) {
      res.status(404).json({ success: false, message: 'Không tìm thấy phiếu cân' });
      return;
    }

    if (session.status === 'open') {
      res.status(400).json({ success: false, message: 'Phiếu cân đang mở' });
      return;
    }

    // Revert inventory and household stats
    await WarehouseTransaction.deleteMany({ relatedSessionId: session._id });
    await Inventory.findOneAndUpdate(
      { riceTypeId: session.riceTypeId },
      { $inc: { currentQuantityKg: -session.totalWeightKg }, $set: { lastUpdated: new Date() } }
    );
    await Household.findByIdAndUpdate(session.householdId, {
      $inc: {
        totalWeighedKg: -session.totalWeightKg,
        totalPaidAmount: -session.totalAmount,
        sessionCount: -1,
      },
    });

    session.status = 'open';
    session.closedAt = undefined;
    session.paidAt = undefined;
    await session.save();

    res.json({
      success: true,
      message: 'Đã mở lại phiếu cân cho phép chỉnh sửa',
      data: session,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const session = await WeighingSession.findById(id);
    if (!session) {
      res.status(404).json({ success: false, message: 'Không tìm thấy phiếu cân' });
      return;
    }

    if (session.status !== 'open') {
      if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'chu_vua')) {
        res.status(403).json({
          success: false,
          message: 'Không thể xóa phiếu đã chốt/thanh toán trừ khi là Quản trị viên',
        });
        return;
      }
      // Revert stats if closed
      await WarehouseTransaction.deleteMany({ relatedSessionId: session._id });
      await Inventory.findOneAndUpdate(
        { riceTypeId: session.riceTypeId },
        { $inc: { currentQuantityKg: -session.totalWeightKg } }
      );
      await Household.findByIdAndUpdate(session.householdId, {
        $inc: {
          totalWeighedKg: -session.totalWeightKg,
          totalPaidAmount: -session.totalAmount,
          sessionCount: -1,
        },
      });
    }

    await WeighingSession.findByIdAndDelete(id);
    res.json({ success: true, message: 'Đã xóa phiếu cân' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteZone = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, zoneIndex } = req.params;
    const zIdx = parseInt(String(zoneIndex), 10);
    if (isNaN(zIdx) || zIdx < 0) {
      res.status(400).json({ success: false, message: 'Chỉ số khu không hợp lệ' });
      return;
    }

    const session = await WeighingSession.findById(id);
    if (!session) {
      res.status(404).json({ success: false, message: 'Không tìm thấy phiếu cân' });
      return;
    }

    if (session.status === 'closed' || session.status === 'paid') {
      if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'chu_vua')) {
        res.status(403).json({
          success: false,
          message: 'Phiếu cân đã chốt/thanh toán, chỉ Quản trị viên mới có quyền chỉnh sửa',
        });
        return;
      }
    }

    let columns = [...session.columns];
    const totalZones = Math.max(1, Math.ceil(columns.length / 5));

    if (zIdx >= totalZones) {
      res.status(400).json({ success: false, message: 'Khu cần xóa không tồn tại' });
      return;
    }

    const startCol = zIdx * 5;

    if (totalZones <= 1) {
      // Nếu chỉ có 1 khu, làm sạch dữ liệu 5 cột thay vì xóa sạch không còn ô nào
      columns = columns.map((col, idx) => {
        if (idx < 5) {
          return {
            ...col,
            rows: [null, null, null, null, null],
          };
        }
        return col;
      });
      while (columns.length < 5) {
        columns.push({
          colIndex: columns.length,
          colLabel: `${columns.length + 1}`,
          rows: [null, null, null, null, null],
        });
      }
    } else {
      // Xóa 5 cột của khu này
      columns.splice(startCol, 5);
      // Đánh lại số thứ tự cột colIndex và colLabel
      columns = columns.map((col, idx) => ({
        ...col,
        colIndex: idx,
        colLabel: `${idx + 1}`,
      }));
    }

    // Tính lại toàn bộ thống kê tổng
    const stats = calculateGridStats(columns, session.pricePerKg, session.tareWeightPerBagKg);

    session.columns = columns;
    session.grossWeightKg = stats.grossWeightKg;
    session.tareTotalKg = stats.tareTotalKg;
    session.totalWeightKg = stats.totalWeightKg;
    session.totalWeighCount = stats.totalWeighCount;
    session.totalAmount = stats.totalAmount;

    await session.save();

    res.json({
      success: true,
      message: `Đã xóa Khu ${zIdx + 1}`,
      data: {
        session,
        stats,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi khi xóa khu' });
  }
};

