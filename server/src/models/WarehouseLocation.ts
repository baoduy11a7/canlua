import mongoose, { Document, Schema } from 'mongoose';

export interface IWarehouseLocation extends Document {
  name: string;
  code: string;
  address?: string;
  managerName?: string;
  phone?: string;
  capacityKg?: number;
  note?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WarehouseLocationSchema = new Schema<IWarehouseLocation>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    address: { type: String, trim: true },
    managerName: { type: String, trim: true },
    phone: { type: String, trim: true },
    capacityKg: { type: Number, default: 500000 }, // Sức chứa (kg)
    note: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const WarehouseLocation = mongoose.model<IWarehouseLocation>(
  'WarehouseLocation',
  WarehouseLocationSchema
);
