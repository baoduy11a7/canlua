import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'admin' | 'nhan_vien_can' | 'ke_toan' | 'chu_vua';

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['admin', 'nhan_vien_can', 'ke_toan', 'chu_vua'],
      default: 'nhan_vien_can',
    },
    phone: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
