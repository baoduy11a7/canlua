import mongoose, { Document, Schema } from 'mongoose';

export interface IRiceType extends Document {
  name: string;
  code: string;
  defaultPricePerKg: number;
  unit: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RiceTypeSchema = new Schema<IRiceType>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    defaultPricePerKg: { type: Number, default: 7000 },
    unit: { type: String, default: 'kg' },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const RiceType = mongoose.model<IRiceType>('RiceType', RiceTypeSchema);
