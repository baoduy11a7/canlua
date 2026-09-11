import mongoose, { Document, Schema } from 'mongoose';

export type TransactionType = 'import' | 'export';

export interface IWarehouseTransaction extends Document {
  code: string;
  type: TransactionType;
  warehouseId?: mongoose.Types.ObjectId;
  warehouseName?: string;
  riceTypeId: mongoose.Types.ObjectId;
  riceTypeName: string;
  quantityKg: number;
  unitPrice: number;
  totalAmount: number;
  relatedSessionId?: mongoose.Types.ObjectId;
  partnerName: string; // Hộ dân khi nhập, khách sỉ/nhà máy khi xuất
  partnerPhone?: string;
  note?: string;
  date: Date;
  createdBy: mongoose.Types.ObjectId;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WarehouseTransactionSchema = new Schema<IWarehouseTransaction>(
  {
    code: { type: String, required: true, uppercase: true },
    type: { type: String, enum: ['import', 'export'], required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'WarehouseLocation' },
    warehouseName: { type: String, default: 'Kho Chính' },
    riceTypeId: { type: Schema.Types.ObjectId, ref: 'RiceType', required: true },
    riceTypeName: { type: String, required: true },
    quantityKg: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    relatedSessionId: { type: Schema.Types.ObjectId, ref: 'WeighingSession' },
    partnerName: { type: String, required: true, trim: true },
    partnerPhone: { type: String, trim: true },
    note: { type: String, trim: true },
    date: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdByName: { type: String },
  },
  { timestamps: true }
);

WarehouseTransactionSchema.index({ warehouseId: 1, date: -1 });
WarehouseTransactionSchema.index({ riceTypeId: 1, date: -1 });
WarehouseTransactionSchema.index({ type: 1, date: -1 });
WarehouseTransactionSchema.index({ relatedSessionId: 1 });

export const WarehouseTransaction = mongoose.model<IWarehouseTransaction>(
  'WarehouseTransaction',
  WarehouseTransactionSchema
);
