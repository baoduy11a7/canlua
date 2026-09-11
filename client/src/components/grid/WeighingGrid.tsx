import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WeighingSession, GridColumn } from '../../types';
import { apiClient } from '../../api/client';
import { formatKg, formatCurrency } from '../../utils/formatters';
import { playBeep, playWarningTone } from '../../utils/audio';
import { useConfigStore } from '../../store/configStore';
import {
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Plus,
  Volume2,
  VolumeX,
  ShieldAlert,
  Layers,
  CheckSquare,
  Square,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface WeighingGridProps {
  session: WeighingSession;
  isReadOnly?: boolean;
  onSessionUpdated: (updatedSession: WeighingSession) => void;
}

export const WeighingGrid: React.FC<WeighingGridProps> = ({
  session,
  isReadOnly = false,
  onSessionUpdated,
}) => {
  const { soundEnabled, warningThresholdKg, toggleSound } = useConfigStore();
  const [columns, setColumns] = useState<GridColumn[]>(session.columns || []);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [activeCell, setActiveCell] = useState<{ col: number; row: number } | null>({ col: 0, row: 0 });
  const [rawInputs, setRawInputs] = useState<{ [key: string]: string }>({});

  // Zone states
  const [selectedZoneTab, setSelectedZoneTab] = useState<'all' | number>('all');
  const [checkedZones, setCheckedZones] = useState<number[]>([]);
  const [isCrossCheckModalOpen, setIsCrossCheckModalOpen] = useState(false);

  const debounceTimerRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Load checked zones from localStorage for persistence
  useEffect(() => {
    if (!session._id) return;
    try {
      const stored = localStorage.getItem(`canlua_checked_zones_${session._id}`);
      if (stored) {
        setCheckedZones(JSON.parse(stored));
      } else {
        setCheckedZones([]);
      }
    } catch {
      //
    }
  }, [session._id]);

  // Toggle zone checked status
  const toggleZoneChecked = (zoneIdx: number) => {
    setCheckedZones((prev) => {
      const next = prev.includes(zoneIdx) ? prev.filter((z) => z !== zoneIdx) : [...prev, zoneIdx];
      try {
        localStorage.setItem(`canlua_checked_zones_${session._id}`, JSON.stringify(next));
      } catch {
        //
      }
      return next;
    });
  };

  // Sync columns with prop when session changes & pad to multiples of 5 (1 khu = 5 columns = 25 bao)
  useEffect(() => {
    const rawCols = session.columns || [];
    const minCols = Math.max(5, Math.ceil(rawCols.length / 5) * 5);
    const padded: GridColumn[] = [];

    for (let i = 0; i < minCols; i++) {
      if (i < rawCols.length) {
        padded.push(rawCols[i]);
      } else {
        padded.push({
          colIndex: i,
          colLabel: `${i + 1}`,
          rows: [null, null, null, null, null],
        });
      }
    }

    setColumns(padded);

    const newRaw: { [key: string]: string } = {};
    rawCols.forEach((col, cIdx) => {
      col.rows.forEach((val, rIdx) => {
        if (val !== null && val !== undefined) {
          newRaw[`${cIdx}_${rIdx}`] = String(val);
        }
      });
    });
    setRawInputs(newRaw);
  }, [session._id, session.columns]);

  // Focus helper
  const focusCell = useCallback((colIdx: number, rowIdx: number) => {
    setActiveCell({ col: colIdx, row: rowIdx });
    setTimeout(() => {
      const key = `${colIdx}_${rowIdx}`;
      const input = inputRefs.current[key];
      if (input) {
        input.focus();
        input.select();
      }
    }, 20);
  }, []);

  // Add 1 Zone (5 columns = 25 bags)
  const addZone = useCallback(() => {
    setColumns((prev) => {
      const currentCount = prev.length;
      const targetCount = Math.ceil(currentCount / 5) * 5 + 5;
      const newCols = [...prev];
      for (let i = currentCount; i < targetCount; i++) {
        newCols.push({
          colIndex: i,
          colLabel: `${i + 1}`,
          rows: [null, null, null, null, null],
        });
      }
      return newCols;
    });
    const newZoneNumber = Math.ceil(columns.length / 5) + 1;
    toast.success(`Đã thêm Khu ${newZoneNumber} (+25 bao đều nhau)`);
  }, [columns.length]);

  // Add single column
  const addColumn = useCallback(() => {
    setColumns((prev) => {
      const nextIdx = prev.length;
      const newCol: GridColumn = {
        colIndex: nextIdx,
        colLabel: `${nextIdx + 1}`,
        rows: [null, null, null, null, null],
      };
      return [...prev, newCol];
    });
  }, []);

  // Save single cell to server
  const saveCellToServer = async (colIndex: number, rowIndex: number, value: number | null) => {
    setSaveStatus('saving');
    try {
      const res = await apiClient.patch(`/weighing-sessions/${session._id}/cell`, {
        colIndex,
        rowIndex,
        value,
      });
      if (res.data.success) {
        setSaveStatus('saved');
        onSessionUpdated(res.data.data.session);
      }
    } catch (err: any) {
      setSaveStatus('error');
      toast.error(err.response?.data?.message || 'Lỗi lưu ô cân');
    }
  };

  // Handle cell input value change
  const handleInputChange = (colIdx: number, rowIdx: number, rawVal: string) => {
    if (isReadOnly) return;

    const cellKey = `${colIdx}_${rowIdx}`;
    // Replace comma with dot
    const normalized = rawVal.replace(',', '.');

    // Validate characters (allow only numbers and single dot)
    if (normalized !== '' && !/^\d*\.?\d{0,2}$/.test(normalized)) {
      return;
    }

    setRawInputs((prev) => ({ ...prev, [cellKey]: normalized }));

    let numVal: number | null = null;
    if (normalized !== '' && !isNaN(parseFloat(normalized))) {
      numVal = parseFloat(normalized);
    }

    // Update local state immediately for instant feedback
    setColumns((prevCols) => {
      const newCols = prevCols.map((c) => ({ ...c, rows: [...c.rows] }));
      while (newCols.length <= colIdx) {
        newCols.push({
          colIndex: newCols.length,
          colLabel: `${newCols.length + 1}`,
          rows: [null, null, null, null, null],
        });
      }
      newCols[colIdx].rows[rowIdx] = numVal;
      return newCols;
    });

    // Check warning threshold
    if (numVal && numVal > warningThresholdKg) {
      if (soundEnabled) playWarningTone();
    }

    // Debounce save to server (800ms)
    if (debounceTimerRef.current[cellKey]) {
      clearTimeout(debounceTimerRef.current[cellKey]);
    }
    setSaveStatus('saving');
    debounceTimerRef.current[cellKey] = setTimeout(() => {
      saveCellToServer(colIdx, rowIdx, numVal);
    }, 800);
  };

  // Key navigation logic
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    colIdx: number,
    rowIdx: number
  ) => {
    if (isReadOnly) return;

    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (soundEnabled) playBeep(880, 0.05);

      if (rowIdx < 4) {
        // Jump to next row in same column (row 1 -> 2 -> 3 -> 4 -> 5)
        focusCell(colIdx, rowIdx + 1);
      } else {
        // At row 5: jump to row 1 of next column
        const nextColIdx = colIdx + 1;
        if (nextColIdx >= columns.length) {
          // Auto create next zone (5 columns = 25 bags)
          setColumns((prev) => {
            const currentCount = prev.length;
            const newCols = [...prev];
            for (let i = 0; i < 5; i++) {
              newCols.push({
                colIndex: currentCount + i,
                colLabel: `${currentCount + i + 1}`,
                rows: [null, null, null, null, null],
              });
            }
            return newCols;
          });
        }

        // If viewing a specific zone tab, auto-switch to next zone if moving past it
        const nextZoneIdx = Math.floor(nextColIdx / 5);
        if (selectedZoneTab !== 'all' && selectedZoneTab !== nextZoneIdx) {
          setSelectedZoneTab(nextZoneIdx);
        }

        setTimeout(() => {
          focusCell(nextColIdx, 0);
          const nextKey = `${nextColIdx}_0`;
          const el = inputRefs.current[nextKey];
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }
        }, 50);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (rowIdx < 4) {
        focusCell(colIdx, rowIdx + 1);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (rowIdx > 0) {
        focusCell(colIdx, rowIdx - 1);
      }
    } else if (e.key === 'ArrowRight') {
      const input = e.currentTarget;
      if (input.selectionStart === input.value.length || input.value === '') {
        e.preventDefault();
        const nextColIdx = colIdx + 1;
        if (nextColIdx < columns.length) {
          focusCell(nextColIdx, rowIdx);
        } else {
          // Pad next zone
          addZone();
          setTimeout(() => focusCell(nextColIdx, rowIdx), 50);
        }
      }
    } else if (e.key === 'ArrowLeft') {
      const input = e.currentTarget;
      if (input.selectionStart === 0 || input.value === '') {
        e.preventDefault();
        if (colIdx > 0) {
          focusCell(colIdx - 1, rowIdx);
        }
      }
    }
  };

  // Calculate local subtotal for a single column
  const getColSubtotal = (col: GridColumn) => {
    return col.rows.reduce<number>((sum, val) => {
      return sum + (typeof val === 'number' && !isNaN(val) ? val : 0);
    }, 0);
  };

  // Count non-empty bags in column
  const getColBagCount = (col: GridColumn) => {
    return col.rows.filter((v) => typeof v === 'number' && !isNaN(v) && v > 0).length;
  };

  // Zone Calculations: 5 columns = 25 bags per zone
  const totalZones = Math.max(1, Math.ceil(columns.length / 5));

  const zoneData = Array.from({ length: totalZones }, (_, zIdx) => {
    const startCol = zIdx * 5;
    const endCol = Math.min(startCol + 5, columns.length);
    const zoneCols = columns.slice(startCol, endCol);

    const startBag = zIdx * 25 + 1;
    const endBag = (zIdx + 1) * 25;

    let filledBags = 0;
    let zoneGross = 0;

    zoneCols.forEach((col) => {
      col.rows.forEach((val) => {
        if (typeof val === 'number' && !isNaN(val) && val > 0) {
          filledBags += 1;
          zoneGross += val;
        }
      });
    });

    const avgWeight = filledBags > 0 ? zoneGross / filledBags : 0;
    const isChecked = checkedZones.includes(zIdx);

    return {
      zoneIndex: zIdx,
      zoneNumber: zIdx + 1,
      label: `Khu ${zIdx + 1}`,
      bagRangeText: `Bao ${startBag} - ${endBag}`,
      startCol,
      endCol,
      columns: zoneCols,
      filledBags,
      totalBags: 25,
      isFull: filledBags === 25,
      grossWeight: zoneGross,
      avgWeight,
      isChecked,
    };
  });

  // Filtered zones based on tab
  const displayedZones =
    selectedZoneTab === 'all'
      ? zoneData
      : zoneData.filter((z) => z.zoneIndex === selectedZoneTab);

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* 1. TOP HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                Bàn Cân Lúa (Chia Khu 25 Bao)
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                {totalZones} Khu ({columns.length} Cột)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Mỗi khu đúng 25 bao đều nhau (5 cột x 5 hàng), tiện đối chiếu đọ sổ với sổ tay
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Cross-Check Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsCrossCheckModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all shadow-xs"
            title="Mở bảng tổng hợp đọ sổ các khu"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Bảng Đọ Sổ Nhanh</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            title={soundEnabled ? 'Tắt âm thanh beep' : 'Bật âm thanh beep khi gõ phím'}
            className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all ${
              soundEnabled
                ? 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-950/50 dark:border-brand-800 dark:text-brand-300'
                : 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">Âm thanh</span>
          </button>

          {/* Autosave Indicator */}
          <div className="flex items-center gap-1 text-xs font-medium">
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">Đã lưu ✓</span>
              </span>
            )}
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                <span className="hidden sm:inline">Đang lưu...</span>
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-800">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <span>Lỗi</span>
              </span>
            )}
          </div>

          {/* Add Zone Button (+25 bao) */}
          {!isReadOnly && (
            <button
              type="button"
              onClick={addZone}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
              title="Thêm một khu mới gồm 25 ô cân đều nhau"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm Khu (25 bao)</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. ZONE NAVIGATION TABS (Thanh chọn nhanh khu để đọ sổ) */}
      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap mr-1">
          Chọn Khu:
        </span>

        {/* Tab 'Tất cả các khu' */}
        <button
          type="button"
          onClick={() => setSelectedZoneTab('all')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            selectedZoneTab === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
          }`}
        >
          <span>Tất Cả ({totalZones} Khu)</span>
        </button>

        {/* Tab từng khu */}
        {zoneData.map((z) => (
          <button
            key={z.zoneIndex}
            type="button"
            onClick={() => setSelectedZoneTab(z.zoneIndex)}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap border ${
              selectedZoneTab === z.zoneIndex
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : z.isChecked
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
          >
            <span>{z.label} ({z.filledBags}/25)</span>
            <span className="font-mono text-[11px] font-semibold opacity-90">
              {formatKg(z.grossWeight)} kg
            </span>
            {z.isChecked && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
            )}
          </button>
        ))}
      </div>

      {/* 3. MAIN GRID CONTAINER WITH ZONES */}
      <div
        ref={gridContainerRef}
        className="flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-6"
      >
        <div className="inline-flex gap-6 min-w-full items-start">
          {displayedZones.map((zone) => {
            return (
              <div
                key={zone.zoneIndex}
                className={`flex flex-col bg-white dark:bg-slate-900 rounded-2xl border-2 transition-all shadow-sm overflow-hidden flex-shrink-0 ${
                  zone.isChecked
                    ? 'border-emerald-500 shadow-emerald-500/10 dark:shadow-emerald-950/20 ring-1 ring-emerald-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* ZONE CARD HEADER */}
                <div
                  className={`flex items-center justify-between px-4 py-3 border-b ${
                    zone.isChecked
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Left: Zone Name & Bag Range */}
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
                        zone.isChecked
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {zone.zoneNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                          {zone.label}
                        </span>
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          ({zone.bagRangeText})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-medium">
                        <span
                          className={`font-semibold ${
                            zone.isFull
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {zone.filledBags}/25 bao
                        </span>
                        {zone.avgWeight > 0 && (
                          <span className="text-slate-400">
                            • TB: ~{zone.avgWeight.toFixed(1)} kg/bao
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Subtotal of Zone & "Đã Đọ Sổ" Toggle */}
                  <div className="flex items-center gap-3">
                    {/* Zone Subtotal Pill */}
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Tổng Khu {zone.zoneNumber}
                      </div>
                      <div className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {formatKg(zone.grossWeight)}{' '}
                        <span className="text-xs font-normal text-slate-500">kg</span>
                      </div>
                    </div>

                    {/* Checkbox Đã Đọ Sổ */}
                    <button
                      type="button"
                      onClick={() => toggleZoneChecked(zone.zoneIndex)}
                      title={
                        zone.isChecked
                          ? 'Khu này đã khớp đọ sổ (bấm để huỷ)'
                          : 'Bấm để đánh dấu khu này đã đọ sổ khớp'
                      }
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                        zone.isChecked
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm active:scale-95'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600'
                      }`}
                    >
                      {zone.isChecked ? (
                        <>
                          <CheckSquare className="w-4 h-4" />
                          <span>Đã đọ sổ ✓</span>
                        </>
                      ) : (
                        <>
                          <Square className="w-4 h-4" />
                          <span>Chưa đọ</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* ZONE GRID TABLE: 5 Columns x 5 Rows */}
                <div className="p-2 sm:p-4 flex gap-1 sm:gap-3 overflow-x-auto">
                  {/* Sticky Row Index Labels (H1 to H5) */}
                  <div className="flex flex-col gap-1.5 sm:gap-2 pt-7 sm:pt-8 pr-0.5 sm:pr-1 flex-shrink-0">
                    {[1, 2, 3, 4, 5].map((rowNum) => (
                      <div
                        key={rowNum}
                        className="h-11 sm:h-12 w-6 sm:w-9 flex items-center justify-center text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 rounded-md sm:rounded-lg border border-slate-200/60 dark:border-slate-800 font-mono"
                      >
                        H{rowNum}
                      </div>
                    ))}
                    <div className="h-6 sm:h-8 w-6 sm:w-9 flex items-center justify-center text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Cột
                    </div>
                  </div>

                  {/* 5 Columns for this zone */}
                  {zone.columns.map((col, cOffset) => {
                    const actualColIdx = zone.startCol + cOffset;
                    const colSubtotal = getColSubtotal(col);
                    const colBagCount = getColBagCount(col);

                    return (
                      <div
                        key={actualColIdx}
                        className="flex flex-col gap-1.5 sm:gap-2 w-[54px] xs:w-16 sm:w-28 flex-shrink-0 bg-slate-50/70 dark:bg-slate-950/40 p-1 sm:p-2 rounded-xl border border-slate-200/70 dark:border-slate-800/80 transition-all hover:border-emerald-300 dark:hover:border-emerald-800"
                      >
                        {/* Column Header */}
                        <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-slate-800 text-center font-mono">
                          <span className="text-[9px] sm:text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-1 sm:px-2 py-0.5 rounded truncate">
                            C{actualColIdx + 1}
                          </span>
                          <span className="text-[8px] sm:text-[10px] text-slate-400 font-normal">
                            {colBagCount}/5
                          </span>
                        </div>

                        {/* 5 Row Cells */}
                        {[0, 1, 2, 3, 4].map((rowIdx) => {
                          const cellKey = `${actualColIdx}_${rowIdx}`;
                          const currentVal =
                            rawInputs[cellKey] ??
                            (col.rows[rowIdx] !== null ? String(col.rows[rowIdx]) : '');
                          const numVal = parseFloat(currentVal);
                          const isWarning = !isNaN(numVal) && numVal > warningThresholdKg;
                          const isActive =
                            activeCell?.col === actualColIdx && activeCell?.row === rowIdx;

                          // Global continuous bag number (#1, #2, ... #25, #26...)
                          const bagNumber = actualColIdx * 5 + rowIdx + 1;

                          return (
                            <div key={rowIdx} className="relative group">
                              {/* Small bag index tag in corner */}
                              <span className="absolute left-1 top-0.5 text-[8px] sm:text-[9px] font-mono font-medium text-slate-400 dark:text-slate-500 pointer-events-none z-10">
                                #{bagNumber}
                              </span>

                              <input
                                ref={(el) => (inputRefs.current[cellKey] = el)}
                                type="text"
                                inputMode="decimal"
                                disabled={isReadOnly}
                                value={currentVal}
                                placeholder="—"
                                onChange={(e) =>
                                  handleInputChange(actualColIdx, rowIdx, e.target.value)
                                }
                                onKeyDown={(e) => handleKeyDown(e, actualColIdx, rowIdx)}
                                onFocus={() =>
                                  setActiveCell({ col: actualColIdx, row: rowIdx })
                                }
                                className={`h-11 sm:h-12 w-full pt-2 sm:pt-3 text-center text-sm sm:text-lg font-mono font-bold rounded-lg border transition-all weigh-cell-input ${
                                  isWarning
                                    ? 'border-amber-400 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-sm'
                                    : isActive
                                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                                    : currentVal !== ''
                                    ? 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100'
                                    : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 text-slate-400'
                                } ${isReadOnly ? 'cursor-not-allowed opacity-90' : 'hover:border-emerald-400'}`}
                              />

                              {/* Over-weight Warning Badge */}
                              {isWarning && (
                                <div
                                  className="absolute right-0.5 top-0.5 text-amber-500 pointer-events-none"
                                  title={`Số ký vượt ngưỡng cảnh báo (> ${warningThresholdKg}kg)`}
                                >
                                  <ShieldAlert className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Column Subtotal Footer */}
                        <div className="mt-0.5 sm:mt-1 pt-1 sm:pt-1.5 border-t border-slate-200 dark:border-slate-800 text-center">
                          <div className="text-[10px] sm:text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                            {formatKg(colSubtotal)}{' '}
                            <span className="text-[8px] sm:text-[10px] font-normal text-slate-500">kg</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ZONE CARD FOOTER SUMMARY */}
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="text-slate-500 dark:text-slate-400 font-medium">
                    {zone.label} ({zone.bagRangeText})
                  </div>
                  <div className="font-mono font-bold text-slate-700 dark:text-slate-200">
                    Tổng: <span className="text-emerald-600 dark:text-emerald-400 text-sm font-black">{formatKg(zone.grossWeight)} kg</span> ({zone.filledBags}/25 bao)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. STICKY BOTTOM GRAND SUMMARY BAR */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-4 sm:px-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Bags & Zones count */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-mono text-base">
              {session.totalWeighCount}
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                Số bao đã cân ({totalZones} Khu)
              </div>
              <div className="text-base font-bold font-mono text-slate-100">
                {session.totalWeighCount} <span className="text-xs text-slate-400 font-normal">bao</span>
                <span className="text-xs text-emerald-400 font-semibold ml-2">
                  ({checkedZones.length}/{totalZones} khu đã đọ)
                </span>
              </div>
            </div>
          </div>

          {/* Tare total (if configured) */}
          {session.tareWeightPerBagKg > 0 && (
            <div className="hidden md:block">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                Trừ bì ({session.tareWeightPerBagKg} kg/bao)
              </div>
              <div className="text-base font-bold font-mono text-amber-400">
                - {formatKg(session.tareTotalKg)} <span className="text-xs font-normal">kg</span>
              </div>
            </div>
          )}

          {/* Total Net Weight */}
          <div>
            <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-medium">
              Tổng Khối Lượng Tịnh
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 tracking-tight">
              {formatKg(session.totalWeightKg)} <span className="text-sm font-semibold text-emerald-300">Kg</span>
            </div>
          </div>

          {/* Price per Kg */}
          <div className="hidden sm:block">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              Đơn giá / Kg
            </div>
            <div className="text-base font-bold font-mono text-slate-200">
              {formatCurrency(session.pricePerKg)}
            </div>
          </div>

          {/* Grand Total Amount */}
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider text-amber-400 font-medium">
              Tổng Thành Tiền
            </div>
            <div className="text-xl sm:text-3xl font-black font-mono text-amber-400 tracking-tight">
              {formatCurrency(session.totalAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* 5. MODAL: BẢNG ĐỐI CHIẾU ĐỌ SỔ NHANH TỪNG KHU (Cross-Check Summary Modal) */}
      {isCrossCheckModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">
                    Bảng Đối Chiếu Đọ Sổ Theo Khu (25 Bao/Khu)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Phiếu: <strong className="font-mono text-slate-700 dark:text-slate-200">{session.code}</strong> — Hộ dân:{' '}
                    <strong className="text-slate-800 dark:text-slate-200">{session.householdNameSnapshot}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCrossCheckModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content: Table */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <th className="p-3 text-center w-16">Khu</th>
                      <th className="p-3">Phạm vi bao</th>
                      <th className="p-3 text-center">Số bao</th>
                      <th className="p-3 text-right">Tổng ký (kg)</th>
                      <th className="p-3 text-right hidden sm:table-cell">Ký TB / bao</th>
                      <th className="p-3 text-center">Trạng thái đọ sổ</th>
                      <th className="p-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    {zoneData.map((z) => (
                      <tr
                        key={z.zoneIndex}
                        className={`transition-colors ${
                          z.isChecked
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="p-3 text-center font-bold">
                          <span
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center text-xs ${
                              z.isChecked
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {z.zoneNumber}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                          {z.bagRangeText}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-xs ${
                              z.isFull
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {z.filledBags}/25
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          {formatKg(z.grossWeight)} kg
                        </td>
                        <td className="p-3 text-right text-slate-500 hidden sm:table-cell">
                          {z.avgWeight > 0 ? `${z.avgWeight.toFixed(1)} kg` : '—'}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleZoneChecked(z.zoneIndex)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              z.isChecked
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            {z.isChecked ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Đã khớp ✓</span>
                              </>
                            ) : (
                              <span>Chưa khớp</span>
                            )}
                          </button>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedZoneTab(z.zoneIndex);
                              setIsCrossCheckModalOpen(false);
                            }}
                            className="text-xs text-brand-600 hover:underline font-semibold"
                          >
                            Xem khu →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Grand Totals in Cross Check Table */}
                  <tfoot>
                    <tr className="bg-slate-100 dark:bg-slate-850 font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                      <td colSpan={2} className="p-3 uppercase text-xs">
                        TỔNG TOÀN BỘ ({totalZones} KHU)
                      </td>
                      <td className="p-3 text-center font-mono">
                        {session.totalWeighCount} bao
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400 text-base">
                        {formatKg(session.grossWeightKg)} kg
                      </td>
                      <td className="p-3 text-right text-xs text-slate-500 hidden sm:table-cell">
                        {session.totalWeighCount > 0
                          ? `${(session.grossWeightKg / session.totalWeighCount).toFixed(1)} kg`
                          : '—'}
                      </td>
                      <td colSpan={2} className="p-3 text-center text-xs font-semibold text-emerald-600">
                        {checkedZones.length === totalZones
                          ? '✓ Tất cả các khu đã khớp'
                          : `Đã khớp ${checkedZones.length}/${totalZones} khu`}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
              <span className="text-xs text-slate-500">
                Tự động lưu trạng thái đọ sổ vào phiên cân hiện tại.
              </span>
              <button
                type="button"
                onClick={() => setIsCrossCheckModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
