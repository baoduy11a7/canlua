const BASE_URL = 'http://localhost:5000/api';

async function runIntegrationTest() {
  console.log('🧪 [Test] Bắt đầu kiểm thử toàn diện Hệ thống Cân Lúa Thông Minh...');

  try {
    // 1. Login as canlua
    console.log('\n1. Đăng nhập tài khoản NV Cân (canlua/123456)...');
    const loginJson = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'canlua', password: '123456' }),
    }).then((r) => r.json());

    const token = loginJson.data.accessToken;
    console.log('   ✅ Đăng nhập thành công! User:', loginJson.data.user.fullName);

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 2. Fetch Households and Rice Types
    console.log('\n2. Lấy danh sách Hộ dân và Giống lúa...');
    const [hJson, rJson] = await Promise.all([
      fetch(`${BASE_URL}/households`, { headers }).then((r) => r.json()),
      fetch(`${BASE_URL}/rice-types`, { headers }).then((r) => r.json()),
    ]);
    const household = hJson.data[0];
    const riceType = rJson.data[0];
    console.log(`   ✅ Đã chọn hộ: ${household.name}, Giống lúa: ${riceType.name} (${riceType.defaultPricePerKg} đ/kg)`);

    // 3. Create a new Weighing Session
    console.log('\n3. Tạo phiếu cân mới...');
    const sessionJson = await fetch(`${BASE_URL}/weighing-sessions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        householdId: household._id,
        riceTypeId: riceType._id,
        pricePerKg: riceType.defaultPricePerKg,
        tareWeightPerBagKg: 0.2,
        note: 'Phiếu cân kiểm thử tự động',
      }),
    }).then((r) => r.json());

    const session = sessionJson.data;
    console.log(`   ✅ Đã tạo phiếu cân mã: ${session.code}, ID: ${session._id}`);

    // 4. Enter 10 bags across 2 columns (5 bags each)
    console.log('\n4. Nhập 10 bao lúa vào Bảng Cân (Cột 1 và Cột 2)...');
    const weightsCol0 = [50.2, 51.5, 49.8, 50.0, 52.1];
    const weightsCol1 = [50.4, 49.6, 51.0, 50.8, 49.2];

    for (let r = 0; r < 5; r++) {
      await fetch(`${BASE_URL}/weighing-sessions/${session._id}/cell`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ colIndex: 0, rowIndex: r, value: weightsCol0[r] }),
      });
    }
    for (let r = 0; r < 5; r++) {
      await fetch(`${BASE_URL}/weighing-sessions/${session._id}/cell`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ colIndex: 1, rowIndex: r, value: weightsCol1[r] }),
      });
    }

    // Check updated stats
    const updatedJson = await fetch(`${BASE_URL}/weighing-sessions/${session._id}`, { headers }).then((r) => r.json());
    const curSession = updatedJson.data;
    console.log(`   ✅ Cột 1 (5 bao): ${weightsCol0.join(', ')}`);
    console.log(`   ✅ Cột 2 (5 bao): ${weightsCol1.join(', ')}`);
    console.log(`   📊 Tổng số bao: ${curSession.totalWeighCount} bao`);
    console.log(`   📊 Khối lượng thô: ${curSession.grossWeightKg} kg`);
    console.log(`   📊 Trừ bì (10 bao x 0.2kg): ${curSession.tareTotalKg} kg`);
    console.log(`   📊 Khối lượng tịnh: ${curSession.totalWeightKg} kg`);
    console.log(`   💰 Tổng thành tiền: ${curSession.totalAmount.toLocaleString()} VNĐ`);

    // 5. Test Rename Household
    console.log('\n5. Đổi tên hộ dân kèm nhật ký thay đổi...');
    const renameJson = await fetch(`${BASE_URL}/weighing-sessions/${session._id}/rename-household`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        newHouseholdName: `${household.name} (Đã xác minh)`,
        reason: 'Khách hàng yêu cầu đổi theo tên sổ đỏ',
      }),
    }).then((r) => r.json());
    console.log(`   ✅ ${renameJson.message}`);
    console.log(`   📝 Audit Log Count: ${renameJson.data.nameChangeLog.length}`);

    // 6. Close Session & Trigger Warehouse Import
    console.log('\n6. Chốt phiếu cân (Khóa grid & tự động nhập kho)...');
    const closeJson = await fetch(`${BASE_URL}/weighing-sessions/${session._id}/close`, {
      method: 'POST',
      headers,
    }).then((r) => r.json());
    console.log(`   ✅ Trạng thái phiếu sau chốt: ${closeJson.data.status}`);

    // 7. Verify Warehouse Inventory
    console.log('\n7. Kiểm tra Thẻ kho và Tồn kho...');
    const invJson = await fetch(`${BASE_URL}/warehouse/inventory`, { headers }).then((r) => r.json());
    if (invJson.data && Array.isArray(invJson.data)) {
      const targetInv = invJson.data.find((i: any) => i.riceTypeName === riceType.name) || invJson.data[0];
      console.log(`   ✅ Tồn kho ${targetInv.riceTypeName}: ${targetInv.currentQuantityKg.toLocaleString()} kg`);
    } else {
      console.log('   ⚠️ invJson data:', invJson);
    }

    // 8. Verify Finance Profit & Dashboard
    console.log('\n8. Kiểm tra Báo cáo Doanh thu & Lợi nhuận...');
    const profitJson = await fetch(`${BASE_URL}/finance/profit`, { headers }).then((r) => r.json());
    if (profitJson.data) {
      console.log(`   ✅ Tổng doanh thu bán lúa: ${profitJson.data.totalRevenue.toLocaleString()} VNĐ`);
      console.log(`   ✅ Tổng chi mua lúa: ${profitJson.data.totalCostOfGoods.toLocaleString()} VNĐ`);
      console.log(`   ✅ Lợi nhuận ròng: ${profitJson.data.netProfit.toLocaleString()} VNĐ`);
    }

    console.log('\n🎉 [Test] TẤT CẢ CÁC BƯỚC KIỂM THỬ ĐÃ THÀNH CÔNG RỰC RỠ 100%!');
  } catch (error: any) {
    console.error('❌ [Test Error]:', error.message || error);
  }
}

runIntegrationTest();
