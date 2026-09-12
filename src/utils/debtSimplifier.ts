import {
  CurrencyCode,
  Expense,
  Member,
  MemberBalance,
  Settlement,
  SimplifiedTransaction,
  GroupSummary,
  CategorySummary,
  ExpenseCategory,
} from '../types/index.ts';
import { convertCurrency } from './currencies.ts';

const EPSILON = 0.009; // Float rounding tolerance

/**
 * Calculates net balances and optimal simplified transactions
 */
export function calculateGroupBalancesAndDebts(
  members: Member[],
  expenses: Expense[],
  settlements: Settlement[],
  baseCurrency: CurrencyCode
): GroupSummary {
  const memberMap = new Map<string, Member>();
  members.forEach((m) => memberMap.set(m.id, m));

  // Initialize tracking
  const totalPaidMap = new Map<string, number>();
  const totalShareMap = new Map<string, number>();
  const netBalanceMap = new Map<string, number>();

  members.forEach((m) => {
    totalPaidMap.set(m.id, 0);
    totalShareMap.set(m.id, 0);
    netBalanceMap.set(m.id, 0);
  });

  let totalExpenseAmount = 0;
  let totalSettlementAmount = 0;

  // Category accumulation in baseCurrency
  const categoryMap = new Map<ExpenseCategory, { total: number; count: number }>();

  // 1. Process Expenses
  for (const exp of expenses) {
    const expenseBaseAmount = convertCurrency(exp.amount, exp.currency, baseCurrency);
    totalExpenseAmount += expenseBaseAmount;

    // Track category
    const cat = exp.category || 'General';
    const existingCat = categoryMap.get(cat) || { total: 0, count: 0 };
    existingCat.total += expenseBaseAmount;
    existingCat.count += 1;
    categoryMap.set(cat, existingCat);

    // Sum of payers
    for (const payer of exp.paidBy) {
      const payerBaseAmount = convertCurrency(payer.amount, exp.currency, baseCurrency);
      totalPaidMap.set(payer.memberId, (totalPaidMap.get(payer.memberId) || 0) + payerBaseAmount);
      netBalanceMap.set(payer.memberId, (netBalanceMap.get(payer.memberId) || 0) + payerBaseAmount);
    }

    // Sum of consumers (splits)
    for (const split of exp.splits) {
      const splitBaseAmount = convertCurrency(split.shareAmount, exp.currency, baseCurrency);
      totalShareMap.set(split.memberId, (totalShareMap.get(split.memberId) || 0) + splitBaseAmount);
      netBalanceMap.set(split.memberId, (netBalanceMap.get(split.memberId) || 0) - splitBaseAmount);
    }
  }

  // 2. Process Completed Settlements
  for (const s of settlements) {
    if (!s.completed) continue;
    const settlementBaseAmount = convertCurrency(s.amount, s.currency, baseCurrency);
    totalSettlementAmount += settlementBaseAmount;

    // FromMember paid ToMember
    // FromMember paid out money to settle, so their net balance increases (less in debt)
    netBalanceMap.set(s.fromMemberId, (netBalanceMap.get(s.fromMemberId) || 0) + settlementBaseAmount);
    // ToMember received money, so their net balance decreases (they were repaid)
    netBalanceMap.set(s.toMemberId, (netBalanceMap.get(s.toMemberId) || 0) - settlementBaseAmount);
  }

  // Construct MemberBalances array
  const memberBalances: MemberBalance[] = members.map((m) => {
    const totalPaid = Math.round((totalPaidMap.get(m.id) || 0) * 100) / 100;
    const totalShare = Math.round((totalShareMap.get(m.id) || 0) * 100) / 100;
    const netBalance = Math.round((netBalanceMap.get(m.id) || 0) * 100) / 100;

    return {
      memberId: m.id,
      memberName: m.name,
      avatarColor: m.avatarColor,
      totalPaid,
      totalShare,
      netBalance,
    };
  });

  // 3. Smart Debt Simplification Algorithm
  // Partition members into debtors (negative balance) and creditors (positive balance)
  interface BalanceNode {
    memberId: string;
    memberName: string;
    avatarColor: string;
    balance: number;
  }

  const creditors: BalanceNode[] = [];
  const debtors: BalanceNode[] = [];

  for (const mb of memberBalances) {
    if (mb.netBalance > EPSILON) {
      creditors.push({
        memberId: mb.memberId,
        memberName: mb.memberName,
        avatarColor: mb.avatarColor,
        balance: mb.netBalance,
      });
    } else if (mb.netBalance < -EPSILON) {
      debtors.push({
        memberId: mb.memberId,
        memberName: mb.memberName,
        avatarColor: mb.avatarColor,
        balance: mb.netBalance, // negative number
      });
    }
  }

  const simplifiedTransactions: SimplifiedTransaction[] = [];
  let txIndex = 1;

  // Greedy Min-Max Matching:
  // Sort creditors descending, debtors ascending (most negative first)
  while (creditors.length > 0 && debtors.length > 0) {
    creditors.sort((a, b) => b.balance - a.balance);
    debtors.sort((a, b) => a.balance - b.balance); // e.g. -50 before -20

    const bestCreditor = creditors[0];
    const bestDebtor = debtors[0];

    const debtorAmountOwed = Math.abs(bestDebtor.balance);
    const creditorAmountOwed = bestCreditor.balance;

    const payment = Math.min(debtorAmountOwed, creditorAmountOwed);
    const roundedPayment = Math.round(payment * 100) / 100;

    if (roundedPayment > 0.01) {
      simplifiedTransactions.push({
        id: `simp-${txIndex++}-${Date.now()}`,
        fromMemberId: bestDebtor.memberId,
        fromMemberName: bestDebtor.memberName,
        fromAvatarColor: bestDebtor.avatarColor,
        toMemberId: bestCreditor.memberId,
        toMemberName: bestCreditor.memberName,
        toAvatarColor: bestCreditor.avatarColor,
        amount: roundedPayment,
        currency: baseCurrency,
      });
    }

    bestCreditor.balance -= payment;
    bestDebtor.balance += payment;

    if (bestCreditor.balance <= EPSILON) {
      creditors.shift();
    }
    if (Math.abs(bestDebtor.balance) <= EPSILON) {
      debtors.shift();
    }
  }

  // Active debt pending
  const activeDebtAmount = simplifiedTransactions.reduce((acc, curr) => acc + curr.amount, 0);

  // Category breakdown
  const categoryBreakdown: CategorySummary[] = Array.from(categoryMap.entries()).map(([cat, val]) => ({
    category: cat,
    totalAmount: Math.round(val.total * 100) / 100,
    count: val.count,
    percentage: totalExpenseAmount > 0 ? Math.round((val.total / totalExpenseAmount) * 1000) / 10 : 0,
  }));

  // Sort categories by total spending descending
  categoryBreakdown.sort((a, b) => b.totalAmount - a.totalAmount);

  return {
    totalExpenseAmount: Math.round(totalExpenseAmount * 100) / 100,
    totalSettlementAmount: Math.round(totalSettlementAmount * 100) / 100,
    activeDebtAmount: Math.round(activeDebtAmount * 100) / 100,
    memberBalances,
    simplifiedTransactions,
    categoryBreakdown,
  };
}
