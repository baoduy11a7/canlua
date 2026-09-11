import React, { forwardRef } from 'react';
import { WeighingSession, GridColumn } from '../../types';
import { formatCurrency, formatKg, formatDateTime } from '../../utils/formatters';

interface PrintableReceiptProps {
  session: WeighingSession;
  printFormat?: 'thermal80' | 'a5';
}

export const PrintableReceipt = forwardRef<HTMLDivElement, PrintableReceiptProps>(
  ({ session, printFormat = 'a5' }, ref) => {
    // Group columns into zones of 5 columns (25 bags each)
    const rawCols = session.columns || [];
    const totalZones = Math.max(1, Math.ceil(rawCols.length / 5));

    const zones = Array.from({ length: totalZones }, (_, zIdx) => {
      const startCol = zIdx * 5;
      const endCol = Math.min(startCol + 5, rawCols.length);
      const cols = rawCols.slice(startCol, endCol);

      const startBag = zIdx * 25 + 1;
      const endBag = (zIdx + 1) * 25;

      let filledCount = 0;
      let zoneSum = 0;

      cols.forEach((col) => {
        col.rows.forEach((v) => {
          if (typeof v === 'number' && !isNaN(v) && v > 0) {
            filledCount += 1;
            zoneSum += v;
          }
        });
      });

      return {
        zoneNumber: zIdx + 1,
        bagRangeText: `Bao ${startBag} - ${endBag}`,
        cols,
        startCol,
        filledCount,
        zoneSum,
      };
    });

    if (printFormat === 'thermal80') {
      return (
        <div
          ref={ref}
          className="p-4 bg-white text-black font-mono text-xs max-w-[80mm] mx-auto print:max-w-none print:w-[80mm] print:p-2"
        >
          {/* Header */}
          <div className="text-center pb-2 border-b border-dashed border-black">
            <h1 className="text-base font-bold uppercase tracking-wider">VỰA LÚA MIỀN TÂY</h1>
            <p className="text-[10px]">ĐC: Tháp Mười, Đồng Tháp — Hotline: 0918.234.567</p>
            <h2 className="text-sm font-bold mt-1 uppercase">PHIẾU CÂN LÚA</h2>
            <p className="text-[11px] font-bold">Số: {session.code}</p>
          </div>

          {/* Info */}
          <div className="py-2 space-y-1 border-b border-dashed border-black text-[11px]">
            <div className="flex justify-between">
              <span>Hộ dân:</span>
              <strong className="text-right">{session.householdNameSnapshot}</strong>
            </div>
            {session.householdPhoneSnapshot && (
              <div className="flex justify-between">
                <span>SĐT:</span>
                <span>{session.householdPhoneSnapshot}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Giống lúa:</span>
              <strong>{session.riceTypeNameSnapshot}</strong>
            </div>
            <div className="flex justify-between">
              <span>Ngày cân:</span>
              <span>{formatDateTime(session.weighDate)}</span>
            </div>
            <div className="flex justify-between">
              <span>Đơn giá:</span>
              <strong>{formatCurrency(session.pricePerKg)}/kg</strong>
            </div>
          </div>

          {/* Detail by Zones */}
          <div className="py-2 border-b border-dashed border-black space-y-2">
            <div className="text-[10px] font-bold uppercase">CHI TIẾT THEO TỪNG KHU (25 BAO):</div>
            {zones.map((z) => {
              if (z.filledCount === 0) return null;
              return (
                <div key={z.zoneNumber} className="border border-black p-1.5 rounded space-y-1">
                  <div className="flex justify-between font-bold text-[10px] border-b border-dashed border-black pb-0.5">
                    <span>KHU {z.zoneNumber} ({z.bagRangeText}):</span>
                    <span>{formatKg(z.zoneSum)} kg ({z.filledCount}b)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[9px]">
                    {z.cols.map((col, cIdx) => {
                      const filled = col.rows.filter((r) => r !== null && r !== undefined && r > 0);
                      const cSum = filled.reduce<number>(
                        (s, v) => s + (typeof v === 'number' && !isNaN(v) ? v : 0),
                        0
                      );
                      return (
                        <div key={cIdx} className="bg-slate-100 p-1 rounded">
                          <div className="font-bold">Cột {z.startCol + cIdx + 1}:</div>
                          <div className="text-slate-700">{filled.join(' - ')}</div>
                          <div className="text-right font-bold">={formatKg(cSum)} kg</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="py-2 space-y-1.5 text-xs font-bold border-b-2 border-black">
            <div className="flex justify-between">
              <span>Tổng số bao:</span>
              <span>{session.totalWeighCount} bao ({totalZones} khu)</span>
            </div>
            <div className="flex justify-between">
              <span>Tổng khối lượng thô:</span>
              <span>{formatKg(session.grossWeightKg)} kg</span>
            </div>
            {session.tareWeightPerBagKg > 0 && (
              <div className="flex justify-between text-[11px] font-normal">
                <span>Trừ bì ({session.tareWeightPerBagKg} kg/bao):</span>
                <span>- {formatKg(session.tareTotalKg)} kg</span>
              </div>
            )}
            <div className="flex justify-between text-sm pt-1 border-t border-black">
              <span>TỔNG KHỐI LƯỢNG:</span>
              <span className="text-base">{formatKg(session.totalWeightKg)} KG</span>
            </div>
            <div className="flex justify-between text-sm text-black">
              <span>TỔNG THÀNH TIỀN:</span>
              <span className="text-base">{formatCurrency(session.totalAmount)}</span>
            </div>
          </div>

          {/* Signature */}
          <div className="grid grid-cols-2 text-center text-[10px] mt-4 pt-2">
            <div>
              <strong>NGƯỜI CÂN</strong>
              <div className="h-10"></div>
              <p>{session.createdByName || 'Nguyễn Văn Cân'}</p>
            </div>
            <div>
              <strong>CHỦ LÚA</strong>
              <div className="h-10"></div>
              <p>{session.householdNameSnapshot}</p>
            </div>
          </div>

          <div className="text-center text-[9px] mt-4 text-slate-500">
            Cảm ơn quý bà con nông dân đã tin tưởng hợp tác!
          </div>
        </div>
      );
    }

    // Default: Standard A5 / A4 Landscape Form
    return (
      <div
        ref={ref}
        className="p-8 bg-white text-slate-900 font-sans max-w-[210mm] mx-auto print:max-w-none print:w-full print:p-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-emerald-800">
              VỰA LÚA ĐỒNG THÁP MƯỜI
            </h1>
            <p className="text-xs text-slate-600">
              Chuyên thu mua, sấy và gia công lúa gạo chất lượng cao
            </p>
            <p className="text-xs text-slate-500">
              Địa chỉ: QL30, TT. Mỹ Thọ, Cao Lãnh, Đồng Tháp — Hotline: 0918 234 567
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900">
              PHIẾU CÂN LÚA
            </h2>
            <p className="font-mono text-sm font-bold text-emerald-700">Số: {session.code}</p>
            <p className="text-xs text-slate-500">Ngày: {formatDateTime(session.weighDate)}</p>
          </div>
        </div>

        {/* Customer info */}
        <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-sm">
          <div className="space-y-1">
            <div>
              <span className="text-slate-500">Hộ dân / Người bán:</span>{' '}
              <strong className="text-base text-slate-900">{session.householdNameSnapshot}</strong>
            </div>
            {session.householdPhoneSnapshot && (
              <div>
                <span className="text-slate-500">Số điện thoại:</span>{' '}
                <span className="font-mono font-semibold">{session.householdPhoneSnapshot}</span>
              </div>
            )}
            {session.householdAddressSnapshot && (
              <div>
                <span className="text-slate-500">Địa chỉ:</span>{' '}
                <span>{session.householdAddressSnapshot}</span>
              </div>
            )}
          </div>
          <div className="space-y-1 text-right">
            <div>
              <span className="text-slate-500">Loại lúa:</span>{' '}
              <strong className="text-base text-emerald-800">{session.riceTypeNameSnapshot}</strong>
            </div>
            <div>
              <span className="text-slate-500">Đơn giá thu mua:</span>{' '}
              <span className="text-base font-bold font-mono text-slate-900">
                {formatCurrency(session.pricePerKg)} / kg
              </span>
            </div>
            <div>
              <span className="text-slate-500">Người lập phiếu:</span>{' '}
              <span>{session.createdByName || 'NV Cân'}</span>
            </div>
          </div>
        </div>

        {/* 5-Row Weighing Grid Tables grouped by 25-Bag Zones */}
        <div className="py-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Bảng Kê Chi Tiết Cân Từng Khu (Mỗi Khu 25 Bao Đều Nhau - 5 Dòng x 5 Cột):
            </div>
            <div className="text-xs font-mono font-semibold text-emerald-700">
              Tổng {totalZones} Khu
            </div>
          </div>

          {zones.map((zone) => {
            return (
              <div key={zone.zoneNumber} className="border border-slate-800 rounded-lg overflow-hidden">
                {/* Zone Header */}
                <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-900 font-mono">
                    KHU {zone.zoneNumber} ({zone.bagRangeText})
                  </span>
                  <span className="font-mono text-slate-800">
                    Tổng Khu: <strong className="text-emerald-700 text-sm">{formatKg(zone.zoneSum)} kg</strong> ({zone.filledCount}/25 bao)
                  </span>
                </div>

                <table className="w-full text-center border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-800 font-bold">
                      <th className="p-1 border-r border-slate-800 w-12 text-slate-500">Hàng</th>
                      {zone.cols.map((col, cOffset) => (
                        <th key={cOffset} className="p-1 border-r border-slate-800 font-mono">
                          Cột {zone.startCol + cOffset + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[0, 1, 2, 3, 4].map((rowIdx) => (
                      <tr key={rowIdx} className="border-b border-slate-200">
                        <td className="p-1 bg-slate-50 font-bold border-r border-slate-800 text-slate-500">
                          H{rowIdx + 1}
                        </td>
                        {zone.cols.map((col, cOffset) => {
                          const val = col.rows[rowIdx];
                          return (
                            <td
                              key={cOffset}
                              className="p-1 border-r border-slate-200 font-mono font-medium"
                            >
                              {val !== null && val !== undefined && val > 0 ? formatKg(val) : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {/* Column Totals for this zone */}
                    <tr className="bg-slate-50 font-bold border-t border-slate-800">
                      <td className="p-1 border-r border-slate-800 uppercase text-[9px] text-slate-500">Tổng Cột</td>
                      {zone.cols.map((col, cOffset) => {
                        const colSum = col.rows.reduce<number>(
                          (s, v) => s + (typeof v === 'number' && !isNaN(v) ? v : 0),
                          0
                        );
                        return (
                          <td key={cOffset} className="p-1 border-r border-slate-200 font-mono">
                            {formatKg(colSum)}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        {/* Quick Cross-check Summary Table for Zones */}
        <div className="my-2 border border-slate-300 rounded-lg p-3 bg-slate-50">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Bảng Đối Chiếu Đọ Sổ Tổng Hợp:
          </div>
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-300 font-bold text-slate-600">
                <th className="p-1 text-left">Khu</th>
                <th className="p-1">Phạm vi</th>
                <th className="p-1">Số bao</th>
                <th className="p-1 text-right">Tổng ký</th>
                <th className="p-1 text-right">TB ký/bao</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {zones.map((z) => (
                <tr key={z.zoneNumber}>
                  <td className="p-1 text-left font-bold">Khu {z.zoneNumber}</td>
                  <td className="p-1 text-slate-600">{z.bagRangeText}</td>
                  <td className="p-1">{z.filledCount}/25 bao</td>
                  <td className="p-1 text-right font-bold text-emerald-700">{formatKg(z.zoneSum)} kg</td>
                  <td className="p-1 text-right text-slate-500">
                    {z.filledCount > 0 ? `${(z.zoneSum / z.filledCount).toFixed(1)} kg` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Grand Summary box */}
        <div className="p-4 bg-slate-900 text-white rounded-xl grid grid-cols-3 gap-4 text-center my-4">
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Tổng số bao</div>
            <div className="text-xl font-bold font-mono text-white">
              {session.totalWeighCount} <span className="text-xs font-normal text-slate-400">bao ({totalZones} khu)</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Khối lượng tịnh</div>
            <div className="text-2xl font-black font-mono text-emerald-400">
              {formatKg(session.totalWeightKg)} <span className="text-sm text-emerald-300">KG</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Tổng thành tiền</div>
            <div className="text-2xl font-black font-mono text-amber-400">
              {formatCurrency(session.totalAmount)}
            </div>
          </div>
        </div>

        {/* Note */}
        {session.note && (
          <div className="text-xs text-slate-600 italic mb-4">Ghi chú: {session.note}</div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-2 text-center text-sm pt-4 mt-2">
          <div>
            <div className="font-bold uppercase">Đại Diện Vựa Lúa / Người Cân</div>
            <div className="text-xs text-slate-400 italic">(Ký và ghi rõ họ tên)</div>
            <div className="h-16"></div>
            <div className="font-bold">{session.createdByName || 'Nguyễn Văn Cân'}</div>
          </div>
          <div>
            <div className="font-bold uppercase">Hộ Dân / Chủ Lúa</div>
            <div className="text-xs text-slate-400 italic">(Ký và ghi rõ họ tên)</div>
            <div className="h-16"></div>
            <div className="font-bold">{session.householdNameSnapshot}</div>
          </div>
        </div>
      </div>
    );
  }
);
