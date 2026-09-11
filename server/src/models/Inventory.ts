import mongoose, { Document, Schema } from 'mongoose';

export interface IInventory extends Document {
  riceTypeId: mongoose.Types.ObjectId;
  riceTypeName: string;
  warehouseId?: mongoose.Types.ObjectId;
  warehouseName?: string;
  currentQuantityKg: number;
  minWarningKg: number;
  maxWarningKg?: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema = new Schema<IInventory>(
  {
    riceTypeId: { type: Schema.Types.ObjectId, ref: 'RiceType', required: true },
    riceTypeName: { type: String, required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'WarehouseLocation' },
    warehouseName: { type: String, default: 'Kho Chính' },
    currentQuantityKg: { type: Number, default: 0, min: 0 },
    minWarningKg: { type: Number, default: 1000 },
    maxWarningKg: { type: Number, default: 100000 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

InventorySchema.index({ riceTypeId: 1, warehouseId: 1 });

export const Inventory = mongoose.model<IInventory>('Inventory', InventorySchema);
