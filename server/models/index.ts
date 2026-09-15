import mongoose, { Schema, Document } from 'mongoose';

/* =========================================================================
   1. MEMBER SCHEMA (Embedded or Referenced)
   ========================================================================= */
export interface IMember {
  id: string;
  name: string;
  email?: string;
  avatarColor: string;
  isCreator?: boolean;
  createdAt: Date;
}

export const MemberSchema = new Schema<IMember>(
  {
    id: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    avatarColor: { type: String, default: '#3B82F6' },
    isCreator: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

/* =========================================================================
   2. EXPENSE SCHEMA
   ========================================================================= */
export interface IPayerDetail {
  memberId: string;
  memberName: string;
  amount: number;
}

export interface ISplitParticipant {
  memberId: string;
  memberName: string;
  shareAmount: number;
  exactAmount?: number;
  percentage?: number;
  shares?: number;
}

export interface IExpense extends Document {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  exchangeRateToBase: number;
  baseAmount: number;
  category: string;
  date: Date;
  paidBy: IPayerDetail[];
  splitType: 'EQUAL' | 'EXACT' | 'PERCENTAGE' | 'SHARES';
  splits: ISplitParticipant[];
  notes?: string;
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ExpenseSchema = new Schema<IExpense>(
  {
    id: { type: String, required: true, unique: true, index: true },
    groupId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, required: true, default: 'USD' },
    exchangeRateToBase: { type: Number, required: true, default: 1.0 },
    baseAmount: { type: Number, required: true },
    category: {
      type: String,
      required: true,
      default: 'General',
      enum: [
        'Food & Dining',
        'Accommodation',
        'Transportation',
        'Activities',
        'Groceries',
        'Shopping',
        'Utilities',
        'General',
      ],
    },
    date: { type: Date, required: true, default: Date.now },
    paidBy: [
      {
        memberId: { type: String, required: true },
        memberName: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 },
      },
    ],
    splitType: {
      type: String,
      required: true,
      enum: ['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES'],
      default: 'EQUAL',
    },
    splits: [
      {
        memberId: { type: String, required: true },
        memberName: { type: String, required: true },
        shareAmount: { type: Number, required: true, min: 0 },
        exactAmount: { type: Number },
        percentage: { type: Number },
        shares: { type: Number },
      },
    ],
    notes: { type: String },
    receiptUrl: { type: String },
  },
  { timestamps: true }
);

ExpenseSchema.index({ groupId: 1, date: -1 });

/* =========================================================================
   3. SETTLEMENT SCHEMA
   ========================================================================= */
export interface ISettlement extends Document {
  id: string;
  groupId: string;
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  toMemberName: string;
  amount: number;
  currency: string;
  date: Date;
  notes?: string;
  paymentMethod?: string;
  completed: boolean;
  createdAt: Date;
}

export const SettlementSchema = new Schema<ISettlement>(
  {
    id: { type: String, required: true, unique: true, index: true },
    groupId: { type: String, required: true, index: true },
    fromMemberId: { type: String, required: true },
    fromMemberName: { type: String, required: true },
    toMemberId: { type: String, required: true },
    toMemberName: { type: String, required: true },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, required: true, default: 'USD' },
    date: { type: Date, default: Date.now },
    notes: { type: String },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'Venmo', 'UPI', 'PayPal', 'Other'],
      default: 'Cash',
    },
    completed: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SettlementSchema.index({ groupId: 1, date: -1 });

/* =========================================================================
   4. AUDIT LOG SCHEMA
   ========================================================================= */
export interface IAuditLog {
  id: string;
  groupId: string;
  action: string;
  description: string;
  timestamp: Date;
  actorName?: string;
}

export const AuditLogSchema = new Schema<IAuditLog>(
  {
    id: { type: String, required: true },
    groupId: { type: String, required: true, index: true },
    action: {
      type: String,
      required: true,
      enum: [
        'EXPENSE_ADDED',
        'EXPENSE_UPDATED',
        'EXPENSE_DELETED',
        'SETTLEMENT_RECORDED',
        'MEMBER_ADDED',
        'MEMBER_REMOVED',
        'GROUP_CREATED',
      ],
    },
    description: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    actorName: { type: String },
  },
  { _id: false }
);

/* =========================================================================
   5. GROUP SCHEMA
   ========================================================================= */
export interface IGroup extends Document {
  id: string;
  shareCode: string; // e.g. "GOA-7824" or secure slug
  slug: string;
  name: string;
  description?: string;
  defaultCurrency: string;
  createdBy: string; // Creator's name identifying group maker
  creatorName?: string;
  creatorMemberId?: string;
  members: IMember[];
  expenses: IExpense[];
  settlements: ISettlement[];
  auditLogs: IAuditLog[];
  createdAt: Date;
  updatedAt: Date;
}

export const GroupSchema = new Schema<IGroup>(
  {
    id: { type: String, required: true, unique: true, index: true },
    shareCode: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    defaultCurrency: { type: String, required: true, default: 'USD' },
    createdBy: { type: String, required: true, trim: true, default: 'Creator' },
    creatorName: { type: String, trim: true },
    creatorMemberId: { type: String, default: 'm1' },
    members: [MemberSchema],
    auditLogs: [AuditLogSchema],
  },
  { timestamps: true }
);

// Mongoose Models
export const ExpenseModel = ((mongoose.models && mongoose.models.Expense) ||
  mongoose.model<IExpense>('Expense', ExpenseSchema)) as mongoose.Model<IExpense>;

export const SettlementModel = ((mongoose.models && mongoose.models.Settlement) ||
  mongoose.model<ISettlement>('Settlement', SettlementSchema)) as mongoose.Model<ISettlement>;

export const GroupModel = ((mongoose.models && mongoose.models.Group) ||
  mongoose.model<IGroup>('Group', GroupSchema)) as mongoose.Model<IGroup>;
