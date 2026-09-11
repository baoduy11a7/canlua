import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Household } from '../models/Household';
import { RiceType } from '../models/RiceType';
import { WarehouseLocation } from '../models/WarehouseLocation';
import { Inventory } from '../models/Inventory';
import { WeighingSession } from '../models/WeighingSession';
import { WarehouseTransaction } from '../models/WarehouseTransaction';
import { Expense } from '../models/Expense';
import { calculateGridStats } from '../services/gridCalculator';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/canlua';

export const seedDatabase = async () => {
  try {
    await mongoose.connect(uri);
    console.log('[Seed] Connected to MongoDB...');

    // Drop old index on inventories if exists
    try {
      await mongoose.connection.collection('inventories').dropIndex('riceTypeId_1');
    } catch {
      // index may not exist
    }

    // 1. Seed Users
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('123456', salt);

    const usersData = [
      {
        username: 'admin',
        passwordHash: defaultPasswordHash,
        fullName: 'Quản Trị Viên Hệ Thống',
        role: 'admin',
        phone: '0901000001',
        isActive: true,
      },
      {
        username: 'chuvua',
        passwordHash: defaultPasswordHash,
        fullName: 'Anh Năm (Chủ Vựa Lúa)',
        role: 'chu_vua',
        phone: '0901000002',
        isActive: true,
      },
      {
        username: 'canlua',
        passwordHash: defaultPasswordHash,
        fullName: 'Nguyễn Văn Cân (NV Cân)',
        role: 'nhan_vien_can',
        phone: '0901000003',
        isActive: true,
      },
      {
        username: 'ketoan',
        passwordHash: defaultPasswordHash,
        fullName: 'Trần Thị Thu (Kế Toán)',
        role: 'ke_toan',
        phone: '0901000004',
        isActive: true,
      },
    ];

    for (const u of usersData) {
      await User.findOneAndUpdate({ username: u.username }, u, { upsert: true });
    }
    console.log('[Seed] Users seeded (admin/123456, chuvua/123456, canlua/123456, ketoan/123456)');

    const adminUser = await User.findOne({ username: 'admin' });

    // 2. Seed Warehouses
    const warehouseData = [
      {
        name: 'Kho 1 — Vựa Trung Tâm (Tháp Mười)',
        code: 'KHO-THAPMUOI',
        address: 'Ấp 2, Xã Phú Điền, Huyện Tháp Mười, Đồng Tháp',
        managerName: 'Anh Năm (Chủ Vựa)',
        phone: '0918234567',
        capacityKg: 1000000,
        isDefault: true,
        isActive: true,
        note: 'Kho chính có dàn máy sấy lúa 40 tấn/mẻ',
      },
      {
        name: 'Kho 2 — Bến Sông Sa Đéc',
        code: 'KHO-SADEC',
        address: 'Cảng Sa Đéc, Phường 2, TP. Sa Đéc, Đồng Tháp',
        managerName: 'Chú Tư Quản Kho',
        phone: '0903876543',
        capacityKg: 800000,
        isDefault: false,
        isActive: true,
        note: 'Kho ven sông thuận tiện bốc lúa lên sà lan',
      },
      {
        name: 'Kho 3 — Lò Sấy Cao Lãnh',
        code: 'KHO-CAOLANH',
        address: 'QL30, Xã Mỹ Tân, TP. Cao Lãnh, Đồng Tháp',
        managerName: 'Anh Ba Kỹ Thuật',
        phone: '0939112233',
        capacityKg: 500000,
        isDefault: false,
        isActive: true,
        note: 'Kho tập kết sấy lúa tươi vụ Hè Thu',
      },
    ];

    const savedWarehouses: any[] = [];
    for (const wh of warehouseData) {
      const saved = await WarehouseLocation.findOneAndUpdate({ code: wh.code }, wh, { upsert: true, new: true });
      savedWarehouses.push(saved);
    }
    console.log('[Seed] Warehouses initialized (Kho 1 Tháp Mười, Kho 2 Sa Đéc, Kho 3 Cao Lãnh)');

    // 3. Seed Rice Types
    const riceTypesData = [
      { name: 'Đài Thơm 8', code: 'DT8', defaultPricePerKg: 7800, unit: 'kg', description: 'Lúa thơm đặc sản, hạt dài bóng' },
      { name: 'OM 5451', code: 'OM5451', defaultPricePerKg: 7400, unit: 'kg', description: 'Lúa chất lượng cao, năng suất tốt' },
      { name: 'ST25 Thượng Hạng', code: 'ST25', defaultPricePerKg: 9200, unit: 'kg', description: 'Gạo ngon nhất thế giới' },
      { name: 'IR 50404', code: 'IR504', defaultPricePerKg: 6800, unit: 'kg', description: 'Lúa thuần nông phổ biến, làm bún bánh' },
      { name: 'Jasmine 85', code: 'JAS85', defaultPricePerKg: 7200, unit: 'kg', description: 'Lúa thơm dẻo mềm' },
      { name: 'OM 18', code: 'OM18', defaultPricePerKg: 7600, unit: 'kg', description: 'Lúa hạt dài trong, cơm mềm' },
    ];

    const savedRiceTypes: any[] = [];
    for (const rt of riceTypesData) {
      const saved = await RiceType.findOneAndUpdate({ name: rt.name }, rt, { upsert: true, new: true });
      savedRiceTypes.push(saved);

      // Seed inventory for default warehouse
      await Inventory.findOneAndUpdate(
        { riceTypeId: saved._id, warehouseId: savedWarehouses[0]._id },
        {
          riceTypeId: saved._id,
          riceTypeName: saved.name,
          warehouseId: savedWarehouses[0]._id,
          warehouseName: savedWarehouses[0].name,
          $setOnInsert: { currentQuantityKg: 5000 + Math.floor(Math.random() * 8000), minWarningKg: 2000 },
        },
        { upsert: true }
      );
    }
    console.log('[Seed] Rice types & inventory initialized');

    // 4. Seed Households
    const householdsData = [
      { name: 'Bác Bảy Ruộng (Nguyễn Văn Bảy)', phone: '0918234567', address: 'Ấp 2, Xã Phú Điền, Tháp Mười, Đồng Tháp', note: 'Canh tác 5 hecta ST25' },
      { name: 'Chú Tư Lúa (Trần Văn Tư)', phone: '0903876543', address: 'Ấp Mỹ Hòa, TT. Phú Mỹ, Phú Tân, An Giang', note: 'Canh tác 8 hecta Đài Thơm 8' },
      { name: 'Anh Ba Đất (Lê Văn Ba)', phone: '0939112233', address: 'Xã Trường Thắng, Thới Lai, TP. Cần Thơ', note: 'Canh tác 4 hecta OM5451' },
      { name: 'Chị Sáu Bông (Phạm Thị Sáu)', phone: '0978445566', address: 'Xã Vĩnh Châu B, Tân Hưng, Long An', note: 'Canh tác 6 hecta OM18' },
      { name: 'Chú Tám Cò (Huỳnh Văn Tám)', phone: '0982998877', address: 'Ấp 4, Xã Vị Trung, Vị Thủy, Hậu Giang', note: 'Khách quen vựa 10 năm' },
    ];

    const savedHouseholds: any[] = [];
    for (const h of householdsData) {
      const saved = await Household.findOneAndUpdate({ name: h.name }, h, { upsert: true, new: true });
      savedHouseholds.push(saved);
    }
    console.log('[Seed] Households initialized');

    // 5. Seed historical closed sessions
    const sampleCols = [
      { colIndex: 0, colLabel: '1', rows: [49.5, 50.2, 51.0, 48.8, 50.5] },
      { colIndex: 1, colLabel: '2', rows: [50.0, 49.8, 51.2, 50.4, 49.6] },
      { colIndex: 2, colLabel: '3', rows: [50.8, 51.5, 49.2, 50.1, 50.7] },
    ];
    const stats = calculateGridStats(sampleCols, 7800, 0.2);

    const existingSession = await WeighingSession.findOne({ code: 'PC-20260830-001' });
    if (!existingSession && adminUser && savedHouseholds.length && savedRiceTypes.length) {
      const dt8 = savedRiceTypes.find((r) => r.code === 'DT8') || savedRiceTypes[0];
      const bacBay = savedHouseholds[0];
      const defaultWh = savedWarehouses[0];

      const sampleSession = await WeighingSession.create({
        code: 'PC-20260830-001',
        householdId: bacBay._id,
        householdNameSnapshot: bacBay.name,
        householdPhoneSnapshot: bacBay.phone,
        householdAddressSnapshot: bacBay.address,
        riceTypeId: dt8._id,
        riceTypeNameSnapshot: dt8.name,
        warehouseId: defaultWh._id,
        warehouseNameSnapshot: defaultWh.name,
        pricePerKg: 7800,
        tareWeightPerBagKg: 0.2,
        status: 'closed',
        columns: sampleCols,
        grossWeightKg: stats.grossWeightKg,
        tareTotalKg: stats.tareTotalKg,
        totalWeightKg: stats.totalWeightKg,
        totalWeighCount: stats.totalWeighCount,
        totalAmount: stats.totalAmount,
        note: 'Cân vụ Hè Thu 2026, lúa hạt vàng đẹp độ ẩm chuẩn',
        createdBy: adminUser._id,
        createdByName: adminUser.fullName,
        weighDate: new Date(),
        closedAt: new Date(),
      });

      // Update household totals
      await Household.findByIdAndUpdate(bacBay._id, {
        $inc: {
          totalWeighedKg: stats.totalWeightKg,
          totalPaidAmount: stats.totalAmount,
          sessionCount: 1,
        },
      });

      // Import transaction
      await WarehouseTransaction.create({
        code: 'NK-20260830-001',
        type: 'import',
        warehouseId: defaultWh._id,
        warehouseName: defaultWh.name,
        riceTypeId: dt8._id,
        riceTypeName: dt8.name,
        quantityKg: stats.totalWeightKg,
        unitPrice: 7800,
        totalAmount: stats.totalAmount,
        relatedSessionId: sampleSession._id,
        partnerName: bacBay.name,
        date: new Date(),
        createdBy: adminUser._id,
        createdByName: adminUser.fullName,
      });

      // Sample Export transaction (bán lúa ra nhà máy)
      await WarehouseTransaction.create({
        code: 'XK-20260830-001',
        type: 'export',
        warehouseId: defaultWh._id,
        warehouseName: defaultWh.name,
        riceTypeId: dt8._id,
        riceTypeName: dt8.name,
        quantityKg: 25000,
        unitPrice: 8600,
        totalAmount: 215000000,
        partnerName: 'Công Ty Lương Thực Miền Tây (Nhà Máy Xay Xát Sa Đéc)',
        note: 'Xuất 1 xe tải 25 tấn Đài Thơm 8',
        date: new Date(),
        createdBy: adminUser._id,
        createdByName: adminUser.fullName,
      });

      // Sample Expenses
      await Expense.create([
        {
          code: 'CP-20260830-001',
          category: 'boc_xep',
          categoryName: 'Bốc xếp',
          amount: 1500000,
          recipient: 'Tổ bốc xếp Cầu Quay (6 người)',
          note: 'Bốc 25 tấn lúa lên xe tải xuất đi',
          date: new Date(),
          createdBy: adminUser._id,
          createdByName: adminUser.fullName,
        },
        {
          code: 'CP-20260830-002',
          category: 'van_chuyen',
          categoryName: 'Vận chuyển',
          amount: 3200000,
          recipient: 'Xe tải anh Chín (66C-12345)',
          note: 'Chở lúa từ ruộng về bãi cân trung tâm',
          date: new Date(),
          createdBy: adminUser._id,
          createdByName: adminUser.fullName,
        },
      ]);
    }

    console.log('[Seed] Database seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}
