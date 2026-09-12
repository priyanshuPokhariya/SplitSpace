export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'INR'
  | 'CAD'
  | 'AUD'
  | 'JPY'
  | 'CHF'
  | 'SGD'
  | 'AED';

export type SplitType = 'EQUAL' | 'EXACT' | 'PERCENTAGE' | 'SHARES';

export type ExpenseCategory =
  | 'Food & Dining'
  | 'Accommodation'
  | 'Transportation'
  | 'Activities'
  | 'Groceries'
  | 'Shopping'
  | 'Utilities'
  | 'General';

export interface Member {
  id: string;
  name: string;
  email?: string;
  avatarColor: string;
  isCreator?: boolean;
  createdAt: string;
}

export interface SplitParticipant {
  memberId: string;
  memberName: string;
  shareAmount: number; // in expense currency
  exactAmount?: number;
  percentage?: number;
  shares?: number;
}

export interface PayerDetail {
  memberId: string;
  memberName: string;
  amount: number;
}

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  amount: number;
  currency: CurrencyCode;
  exchangeRateToBase: number; // e.g. 1 if same as base
  baseAmount: number; // amount in group's default currency
  category: ExpenseCategory;
  date: string;
  paidBy: PayerDetail[];
  splitType: SplitType;
  splits: SplitParticipant[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  toMemberName: string;
  amount: number;
  currency: CurrencyCode;
  date: string;
  notes?: string;
  paymentMethod?: 'Cash' | 'Bank Transfer' | 'Venmo' | 'UPI' | 'PayPal' | 'Other';
  completed: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  groupId: string;
  action:
    | 'EXPENSE_ADDED'
    | 'EXPENSE_UPDATED'
    | 'EXPENSE_DELETED'
    | 'SETTLEMENT_RECORDED'
    | 'MEMBER_ADDED'
    | 'MEMBER_REMOVED'
    | 'GROUP_CREATED';
  description: string;
  timestamp: string;
  actorName?: string;
}

export interface MemberBalance {
  memberId: string;
  memberName: string;
  avatarColor: string;
  totalPaid: number;
  totalShare: number;
  netBalance: number; // positive = is owed money, negative = owes money
}

export interface SimplifiedTransaction {
  id: string;
  fromMemberId: string;
  fromMemberName: string;
  fromAvatarColor: string;
  toMemberId: string;
  toMemberName: string;
  toAvatarColor: string;
  amount: number;
  currency: CurrencyCode;
}

export interface CategorySummary {
  category: ExpenseCategory;
  totalAmount: number;
  percentage: number;
  count: number;
}

export interface Group {
  id: string;
  shareCode: string; // e.g. "GOA-7824" or short id
  slug: string;
  name: string;
  description?: string;
  defaultCurrency: CurrencyCode;
  creatorName?: string;
  creatorMemberId?: string;
  creatorToken?: string;
  members: Member[];
  expenses: Expense[];
  settlements: Settlement[];
  auditLogs: AuditLog[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupSummary {
  totalExpenseAmount: number;
  totalSettlementAmount: number;
  activeDebtAmount: number;
  memberBalances: MemberBalance[];
  simplifiedTransactions: SimplifiedTransaction[];
  categoryBreakdown: CategorySummary[];
}
