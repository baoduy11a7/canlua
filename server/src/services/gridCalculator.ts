import { IGridColumn } from '../models/WeighingSession';

export interface GridCalculationResult {
  grossWeightKg: number;
  tareTotalKg: number;
  totalWeightKg: number;
  totalWeighCount: number;
  totalAmount: number;
  columnSubtotals: number[];
}

export function calculateGridStats(
  columns: IGridColumn[],
  pricePerKg: number,
  tareWeightPerBagKg: number = 0
): GridCalculationResult {
  let grossWeightKg = 0;
  let totalWeighCount = 0;
  const columnSubtotals: number[] = [];

  for (let colIdx = 0; colIdx < columns.length; colIdx++) {
    const col = columns[colIdx];
    let colSum = 0;

    for (let rowIdx = 0; rowIdx < 5; rowIdx++) {
      const val = col.rows[rowIdx];
      if (typeof val === 'number' && !isNaN(val) && val > 0) {
        // Round to 2 decimal places to prevent floating point inaccuracies
        const rounded = Math.round(val * 100) / 100;
        grossWeightKg += rounded;
        totalWeighCount += 1;
        colSum += rounded;
      }
    }

    columnSubtotals.push(Math.round(colSum * 100) / 100);
  }

  grossWeightKg = Math.round(grossWeightKg * 100) / 100;
  const tareTotalKg = Math.round(totalWeighCount * tareWeightPerBagKg * 100) / 100;
  const totalWeightKg = Math.max(0, Math.round((grossWeightKg - tareTotalKg) * 100) / 100);
  const totalAmount = Math.round(totalWeightKg * pricePerKg);

  return {
    grossWeightKg,
    tareTotalKg,
    totalWeightKg,
    totalWeighCount,
    totalAmount,
    columnSubtotals,
  };
}
