import mongoose, { Document, Schema } from 'mongoose';

export interface IHousehold extends Document {
  name: string;
  phone?: string;
  address?: string;
  note?: string;
  idCardNumber?: string;
  totalWeighedKg: number;
  totalPaidAmount: number;
  sessionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const HouseholdSchema = new Schema<IHousehold>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    note: { type: String, trim: true },
    idCardNumber: { type: String, trim: true },
    totalWeighedKg: { type: Number, default: 0 },
    totalPaidAmount: { type: Number, default: 0 },
    sessionCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

HouseholdSchema.index({ name: 'text', phone: 'text', address: 'text' });
HouseholdSchema.index({ name: 1 });
HouseholdSchema.index({ phone: 1 });

export const Household = mongoose.model<IHousehold>('Household', HouseholdSchema);
