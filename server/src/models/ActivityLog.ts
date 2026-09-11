import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityLog extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userRole: string;
  action: string; // create_session, update_cell, close_session, rename_household, export_warehouse, etc.
  targetType: string; // WeighingSession, Household, WarehouseTransaction, Expense, etc.
  targetId?: mongoose.Types.ObjectId;
  targetCode?: string;
  detail?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userRole: { type: String, required: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: Schema.Types.ObjectId },
    targetCode: { type: String },
    detail: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ targetType: 1, targetId: 1 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
