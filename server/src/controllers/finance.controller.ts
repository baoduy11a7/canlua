import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Expense, ExpenseCategory } from '../models/Expense';
import { WarehouseTransaction } from '../models/WarehouseTransaction';
import { AuthRequest } from '../middlewares/auth';
import { generateCode } from '../utils/codeGenerator';
import { exportFinancialReportExcel } from '../services/excelExport';

const categoryMap: Record<ExpenseCategory, string> = {
  van_chuyen: 'Vận chuyển',
  boc_xep: 'Bốc xếp',
  dien_nuoc: 'Điện / Nước',
  nhan_cong: 'Nhân công',
  bao_bi: 'Bao bì',
  khau_hao: 'Khấu hao thiết bị',
  khac: 'Chi phí khác',
};

const resolveDateRange = (query: any) => {
  const { range, from, to, year, month } = query;
  const now = new Date();
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (range === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (range === 'week') {
    const day = now.getDay() || 7;
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (range === 'month') {
    const y = year ? parseInt(year as string, 10) : now.getFullYear();
    const m = month ? parseInt(month as string, 10) - 1 : now.getMonth();
    startDate = new Date(y, m, 1, 0, 0, 0);
    endDate = new Date(y, m + 1, 0, 23, 59, 59, 999);
  } else if (range === 'quarter') {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    startDate = new Date(now.getFullYear(), currentQuarter * 3, 1, 0, 0, 0);
    endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59, 999);
  } else if (range === 'year') {
    const y = year ? parseInt(year as string, 10) : now.getFullYear();
    startDate = new Date(y, 0, 1, 0, 0, 0);
    endDate = new Date(y, 11, 31, 23, 59, 59, 999);
  } else if (from || to) {
    if (from) startDate = new Date(from as string);
    if (to) {
      endDate = new Date(to as string);
      endDate.setHours(23, 59, 59, 999);
    }
  }

  const dateQuery: any = {};
  if (startDate) dateQuery.$gte = startDate;
  if (endDate) dateQuery.$lte = endDate;

  return {
    dateFilter: Object.keys(dateQuery).length ? { date: dateQuery } : {},
    startDate,
    endDate,
  };
};

export const getExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const { dateFilter } = resolveDateRange(req.query);
    const query: any = { ...dateFilter };

    if (category && category !== 'all') {
      query.category = category;
    }
    if (search && typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ code: regex }, { recipient: regex }, { note: regex }];
    }

    const [expenses, total] = await Promise.all([
      Expense.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Expense.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: expenses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, amount, note, recipient, date } = req.body;
    if (!category || !amount || Number(amount) <= 0) {
      res.status(400).json({ success: false, message: 'Vui lòng chọn danh mục và số tiền hợp lệ' });
      return;
    }

    const cat = category as ExpenseCategory;
    const categoryName = categoryMap[cat] || 'Chi phí khác';
    const code = generateCode('CP');

    const expense = await Expense.create({
      code,
      category: cat,
      categoryName,
      amount: Math.round(Number(amount)),
      note: note?.trim(),
      recipient: recipient?.trim(),
      date: date ? new Date(date) : new Date(),
      createdBy: req.user ? new mongoose.Types.ObjectId(req.user.id) : new mongoose.Types.ObjectId(),
      createdByName: req.user?.fullName || 'Người dùng',
    });

    res.status(201).json({ success: true, message: 'Thêm chi phí thành công', data: expense });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await Expense.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Không tìm thấy khoản chi phí' });
      return;
    }
    res.json({ success: true, message: 'Đã xóa khoản chi phí thành công' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProfitReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dateFilter, startDate, endDate } = resolveDateRange(req.query);

    const [exportTransactions, importTransactions, expenses] = await Promise.all([
      WarehouseTransaction.find({ type: 'export', ...dateFilter }).lean(),
      WarehouseTransaction.find({ type: 'import', ...dateFilter }).lean(),
      Expense.find(dateFilter).lean(),
    ]);

    const totalRevenue = exportTransactions.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalExportKg = exportTransactions.reduce((acc, curr) => acc + curr.quantityKg, 0);

    const totalCostOfGoods = importTransactions.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalImportKg = importTransactions.reduce((acc, curr) => acc + curr.quantityKg, 0);

    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    const expenseByCategory: Record<string, number> = {};
    expenses.forEach((e) => {
      expenseByCategory[e.categoryName] = (expenseByCategory[e.categoryName] || 0) + e.amount;
    });

    const grossProfit = totalRevenue - totalCostOfGoods;
    const netProfit = grossProfit - totalExpenses;

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalExportKg,
        totalCostOfGoods,
        totalImportKg,
        totalExpenses,
        grossProfit,
        netProfit,
        expenseByCategory,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const exportFinanceExcel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dateFilter, startDate, endDate } = resolveDateRange(req.query);

    const [exports, imports, expenses] = await Promise.all([
      WarehouseTransaction.find({ type: 'export', ...dateFilter }).sort({ date: -1 }).lean(),
      WarehouseTransaction.find({ type: 'import', ...dateFilter }).sort({ date: -1 }).lean(),
      Expense.find(dateFilter).sort({ date: -1 }).lean(),
    ]);

    const totalRevenue = exports.reduce((acc, c) => acc + c.totalAmount, 0);
    const totalCost = imports.reduce((acc, c) => acc + c.totalAmount, 0);
    const totalExpenses = expenses.reduce((acc, c) => acc + c.amount, 0);
    const netProfit = totalRevenue - totalCost - totalExpenses;

    await exportFinancialReportExcel(res, {
      startDate: startDate ? startDate.toLocaleDateString('vi-VN') : 'Tất cả',
      endDate: endDate ? endDate.toLocaleDateString('vi-VN') : 'Hiện tại',
      totalRevenue,
      totalCost,
      totalExpenses,
      netProfit,
      imports,
      exports,
      expenses,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
