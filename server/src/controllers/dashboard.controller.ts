import { Request, Response } from 'express';
import { WeighingSession } from '../models/WeighingSession';
import { WarehouseTransaction } from '../models/WarehouseTransaction';
import { Inventory } from '../models/Inventory';
import { Household } from '../models/Household';
import { Expense } from '../models/Expense';

export const getDashboardSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { range = 'month', from, to, year, month } = req.query;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    let filterStart: Date;
    let filterEnd: Date = new Date();

    if (range === 'today') {
      filterStart = startOfToday;
      filterEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (range === 'week') {
      const day = now.getDay() || 7;
      filterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1, 0, 0, 0);
    } else if (range === 'year') {
      const y = year ? parseInt(year as string, 10) : now.getFullYear();
      filterStart = new Date(y, 0, 1, 0, 0, 0);
      filterEnd = new Date(y, 11, 31, 23, 59, 59, 999);
    } else if (from || to) {
      filterStart = from ? new Date(from as string) : new Date(now.getFullYear(), now.getMonth(), 1);
      if (to) {
        filterEnd = new Date(to as string);
        filterEnd.setHours(23, 59, 59, 999);
      }
    } else {
      // Default: this month
      const y = year ? parseInt(year as string, 10) : now.getFullYear();
      const m = month ? parseInt(month as string, 10) - 1 : now.getMonth();
      filterStart = new Date(y, m, 1, 0, 0, 0);
      filterEnd = new Date(y, m + 1, 0, 23, 59, 59, 999);
    }

    const periodFilter = { $gte: filterStart, $lte: filterEnd };

    // Parallel fetch with lean queries
    const [
      todaySessions,
      todayExports,
      periodSessions,
      periodExports,
      periodExpenses,
      inventoryItems,
      topHouseholds,
    ] = await Promise.all([
      WeighingSession.find({ weighDate: { $gte: startOfToday }, status: { $in: ['closed', 'paid'] } }).select('totalWeightKg totalAmount').lean(),
      WarehouseTransaction.find({ type: 'export', date: { $gte: startOfToday } }).select('totalAmount').lean(),
      WeighingSession.find({ weighDate: periodFilter, status: { $in: ['closed', 'paid'] } }).select('totalWeightKg totalAmount weighDate').lean(),
      WarehouseTransaction.find({ type: 'export', date: periodFilter }).select('totalAmount quantityKg date').lean(),
      Expense.find({ date: periodFilter }).select('amount').lean(),
      Inventory.find().sort({ currentQuantityKg: -1 }).lean(),
      Household.find().sort({ totalWeighedKg: -1 }).limit(6).lean(),
    ]);

    // Today stats
    const todayWeighedKg = todaySessions.reduce((sum, s) => sum + s.totalWeightKg, 0);
    const todayPurchaseCost = todaySessions.reduce((sum, s) => sum + s.totalAmount, 0);
    const todaySessionCount = todaySessions.length;
    const todayRevenue = todayExports.reduce((sum, s) => sum + s.totalAmount, 0);

    // Period stats
    const periodWeighedKg = periodSessions.reduce((sum, s) => sum + s.totalWeightKg, 0);
    const periodPurchaseCost = periodSessions.reduce((sum, s) => sum + s.totalAmount, 0);
    const periodSessionCount = periodSessions.length;
    const periodRevenue = periodExports.reduce((sum, s) => sum + s.totalAmount, 0);
    const periodExportKg = periodExports.reduce((sum, s) => sum + s.quantityKg, 0);
    const periodTotalExpenses = periodExpenses.reduce((sum, s) => sum + s.amount, 0);
    const periodNetProfit = periodRevenue - periodPurchaseCost - periodTotalExpenses;

    // Inventory sum
    const totalInventoryKg = inventoryItems.reduce((sum, i) => sum + i.currentQuantityKg, 0);

    // Trend chart (7 days or daily breakdown for the selected range)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [recentSessions, recentExports] = await Promise.all([
      WeighingSession.find({ weighDate: { $gte: sevenDaysAgo }, status: { $in: ['closed', 'paid'] } }).select('weighDate totalWeightKg totalAmount').lean(),
      WarehouseTransaction.find({ type: 'export', date: { $gte: sevenDaysAgo } }).select('date totalAmount').lean(),
    ]);

    const daysMap: Record<string, { date: string; weighedKg: number; cost: number; revenue: number }> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateKey = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      daysMap[dateKey] = { date: dateKey, weighedKg: 0, cost: 0, revenue: 0 };
    }

    recentSessions.forEach((s) => {
      const d = new Date(s.weighDate);
      const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (daysMap[key]) {
        daysMap[key].weighedKg += Math.round(s.totalWeightKg);
        daysMap[key].cost += s.totalAmount;
      }
    });

    recentExports.forEach((tx) => {
      const d = new Date(tx.date);
      const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (daysMap[key]) {
        daysMap[key].revenue += tx.totalAmount;
      }
    });

    res.json({
      success: true,
      data: {
        filterRange: range,
        startDate: filterStart.toISOString(),
        endDate: filterEnd.toISOString(),
        today: {
          weighedKg: todayWeighedKg,
          purchaseCost: todayPurchaseCost,
          sessionCount: todaySessionCount,
          revenue: todayRevenue,
        },
        period: {
          weighedKg: periodWeighedKg,
          purchaseCost: periodPurchaseCost,
          sessionCount: periodSessionCount,
          revenue: periodRevenue,
          exportKg: periodExportKg,
          expenses: periodTotalExpenses,
          netProfit: periodNetProfit,
        },
        // For backwards compatibility
        month: {
          weighedKg: periodWeighedKg,
          purchaseCost: periodPurchaseCost,
          revenue: periodRevenue,
          expenses: periodTotalExpenses,
          netProfit: periodNetProfit,
        },
        inventory: {
          totalKg: totalInventoryKg,
          items: inventoryItems,
        },
        topHouseholds,
        chartTrend: Object.values(daysMap),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
