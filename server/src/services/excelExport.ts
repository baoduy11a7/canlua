import ExcelJS from 'exceljs';
import { Response } from 'express';

export async function exportFinancialReportExcel(
  res: Response,
  data: {
    startDate: string;
    endDate: string;
    totalRevenue: number;
    totalCost: number;
    totalExpenses: number;
    netProfit: number;
    imports: any[];
    exports: any[];
    expenses: any[];
  }
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Hệ Thống Cân Lúa Thông Minh';
  workbook.created = new Date();

  // 1. Tổng quan Sheet
  const summarySheet = workbook.addWorksheet('Tổng Quan');
  summarySheet.columns = [
    { header: 'Chỉ tiêu tài chính', key: 'metric', width: 35 },
    { header: 'Giá trị (VNĐ)', key: 'value', width: 25 },
  ];

  summarySheet.addRow({ metric: 'Kỳ báo cáo', value: `${data.startDate} đến ${data.endDate}` });
  summarySheet.addRow({ metric: 'Tổng doanh thu bán lúa (Xuất kho)', value: data.totalRevenue });
  summarySheet.addRow({ metric: 'Tổng chi phí mua lúa (Nhập kho)', value: data.totalCost });
  summarySheet.addRow({ metric: 'Tổng chi phí vận hành (Điện, bốc xếp...)', value: data.totalExpenses });
  summarySheet.addRow({ metric: 'Lợi nhuận ròng', value: data.netProfit });

  // Format header
  summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF16A34A' },
  };

  // 2. Xuất kho Sheet (Doanh thu)
  const exportSheet = workbook.addWorksheet('Xuất Kho (Bán Lúa)');
  exportSheet.columns = [
    { header: 'Mã GD', key: 'code', width: 18 },
    { header: 'Ngày xuất', key: 'date', width: 15 },
    { header: 'Giống lúa', key: 'riceType', width: 18 },
    { header: 'Khách mua', key: 'partner', width: 25 },
    { header: 'Khối lượng (Kg)', key: 'qty', width: 18 },
    { header: 'Đơn giá (đ/kg)', key: 'price', width: 15 },
    { header: 'Thành tiền (VNĐ)', key: 'total', width: 20 },
  ];

  exportSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  exportSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0D9488' },
  };

  data.exports.forEach((tx) => {
    exportSheet.addRow({
      code: tx.code,
      date: new Date(tx.date).toLocaleDateString('vi-VN'),
      riceType: tx.riceTypeName,
      partner: tx.partnerName,
      qty: tx.quantityKg,
      price: tx.unitPrice,
      total: tx.totalAmount,
    });
  });

  // 3. Nhập kho Sheet (Chi phí mua lúa)
  const importSheet = workbook.addWorksheet('Nhập Kho (Mua Lúa)');
  importSheet.columns = [
    { header: 'Mã GD', key: 'code', width: 18 },
    { header: 'Ngày cân', key: 'date', width: 15 },
    { header: 'Giống lúa', key: 'riceType', width: 18 },
    { header: 'Hộ dân / Nguồn', key: 'partner', width: 25 },
    { header: 'Khối lượng (Kg)', key: 'qty', width: 18 },
    { header: 'Đơn giá (đ/kg)', key: 'price', width: 15 },
    { header: 'Thành tiền (VNĐ)', key: 'total', width: 20 },
  ];

  importSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  importSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD97706' },
  };

  data.imports.forEach((tx) => {
    importSheet.addRow({
      code: tx.code,
      date: new Date(tx.date).toLocaleDateString('vi-VN'),
      riceType: tx.riceTypeName,
      partner: tx.partnerName,
      qty: tx.quantityKg,
      price: tx.unitPrice,
      total: tx.totalAmount,
    });
  });

  // 4. Chi phí vận hành Sheet
  const expenseSheet = workbook.addWorksheet('Chi Phí Vận Hành');
  expenseSheet.columns = [
    { header: 'Mã CP', key: 'code', width: 18 },
    { header: 'Ngày chi', key: 'date', width: 15 },
    { header: 'Khoản mục', key: 'category', width: 20 },
    { header: 'Số tiền (VNĐ)', key: 'amount', width: 18 },
    { header: 'Người nhận', key: 'recipient', width: 20 },
    { header: 'Ghi chú', key: 'note', width: 30 },
  ];

  expenseSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  expenseSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE11D48' },
  };

  data.expenses.forEach((exp) => {
    expenseSheet.addRow({
      code: exp.code,
      date: new Date(exp.date).toLocaleDateString('vi-VN'),
      category: exp.categoryName,
      amount: exp.amount,
      recipient: exp.recipient || '',
      note: exp.note || '',
    });
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=Bao_Cao_Tai_Chinh_Can_Lua_${Date.now()}.xlsx`
  );

  await workbook.xlsx.write(res);
  res.end();
}
