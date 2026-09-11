import mongoose, { Document, Schema } from 'mongoose';

export type ExpenseCategory =
  | 'van_chuyen'
  | 'boc_xep'
  | 'dien_nuoc'
  | 'nhan_cong'
  | 'bao_bi'
  | 'khau_hao'
  | 'khac';

export interface IExpense extends Document {
  code: string;
  category: ExpenseCategory;
  categoryName: string;
  amount: number;
  note?: string;
  recipient?: string;
  date: Date;
  createdBy: mongoose.Types.ObjectId;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    code: { type: String, required: true, uppercase: true },
    category: {
      type: String,
      enum: ['van_chuyen', 'boc_xep', 'dien_nuoc', 'nhan_cong', 'bao_bi', 'khau_hao', 'khac'],
      required: true,
    },
    categoryName: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true },
    recipient: { type: String, trim: true },
    date: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdByName: { type: String },
  },
  { timestamps: true }
);

ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ category: 1 });

export const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);
