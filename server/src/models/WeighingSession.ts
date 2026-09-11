import mongoose, { Document, Schema } from 'mongoose';

export type SessionStatus = 'open' | 'closed' | 'paid';

export interface IGridColumn {
  colIndex: number;
  colLabel: string;
  rows: (number | null)[];
}

export interface INameChangeLog {
  from: string;
  to: string;
  householdIdFrom?: mongoose.Types.ObjectId;
  householdIdTo?: mongoose.Types.ObjectId;
  changedBy: mongoose.Types.ObjectId;
  changedByName?: string;
  changedAt: Date;
  reason?: string;
}

export interface IWeighingSession extends Document {
  code: string;
  householdId: mongoose.Types.ObjectId;
  householdNameSnapshot: string;
  householdPhoneSnapshot?: string;
  householdAddressSnapshot?: string;
  riceTypeId: mongoose.Types.ObjectId;
  riceTypeNameSnapshot: string;
  warehouseId?: mongoose.Types.ObjectId;
  warehouseNameSnapshot?: string;
  pricePerKg: number;
  tareWeightPerBagKg: number; // Trừ bì bao (kg/bao), mặc định 0
  status: SessionStatus;
  columns: IGridColumn[];
  grossWeightKg: number;
  tareTotalKg: number;
  totalWeightKg: number;
  totalWeighCount: number;
  totalAmount: number;
  note?: string;
  createdBy: mongoose.Types.ObjectId;
  createdByName?: string;
  weighDate: Date;
  closedAt?: Date;
  paidAt?: Date;
  nameChangeLog: INameChangeLog[];
  createdAt: Date;
  updatedAt: Date;
}

const GridColumnSchema = new Schema<IGridColumn>(
  {
    colIndex: { type: Number, required: true },
    colLabel: { type: String, required: true },
    rows: {
      type: [Schema.Types.Mixed],
      default: [null, null, null, null, null],
      validate: (val: unknown[]) => val.length === 5,
    },
  },
  { _id: false }
);

const NameChangeLogSchema = new Schema<INameChangeLog>(
  {
    from: { type: String, required: true },
    to: { type: String, required: true },
    householdIdFrom: { type: Schema.Types.ObjectId, ref: 'Household' },
    householdIdTo: { type: Schema.Types.ObjectId, ref: 'Household' },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changedByName: { type: String },
    changedAt: { type: Date, default: Date.now },
    reason: { type: String },
  },
  { _id: false }
);

const WeighingSessionSchema = new Schema<IWeighingSession>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    householdId: { type: Schema.Types.ObjectId, ref: 'Household', required: true },
    householdNameSnapshot: { type: String, required: true },
    householdPhoneSnapshot: { type: String },
    householdAddressSnapshot: { type: String },
    riceTypeId: { type: Schema.Types.ObjectId, ref: 'RiceType', required: true },
    riceTypeNameSnapshot: { type: String, required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'WarehouseLocation' },
    warehouseNameSnapshot: { type: String, default: 'Kho Chính (Vựa Trung Tâm)' },
    pricePerKg: { type: Number, required: true, min: 0 },
    tareWeightPerBagKg: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['open', 'closed', 'paid'],
      default: 'open',
    },
    columns: {
      type: [GridColumnSchema],
      default: () => [{ colIndex: 0, colLabel: '1', rows: [null, null, null, null, null] }],
    },
    grossWeightKg: { type: Number, default: 0 },
    tareTotalKg: { type: Number, default: 0 },
    totalWeightKg: { type: Number, default: 0 },
    totalWeighCount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    note: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdByName: { type: String },
    weighDate: { type: Date, default: Date.now },
    closedAt: { type: Date },
    paidAt: { type: Date },
    nameChangeLog: [NameChangeLogSchema],
  },
  { timestamps: true }
);

WeighingSessionSchema.index({ householdId: 1, weighDate: -1 });
WeighingSessionSchema.index({ status: 1 });
WeighingSessionSchema.index({ weighDate: -1 });

export const WeighingSession = mongoose.model<IWeighingSession>('WeighingSession', WeighingSessionSchema);
