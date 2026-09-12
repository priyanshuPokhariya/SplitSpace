import React from 'react';
import { ArrowRight, Plus, Users, Receipt, Sparkles } from 'lucide-react';
import { Group, GroupSummary, CurrencyCode, Expense } from '../types/index.ts';
import { formatMoney } from '../utils/currencies.ts';
import { SimplifiedDebts } from './SimplifiedDebts.tsx';

interface MobileDashboardProps {
  group: Group;
  summary: GroupSummary;
  onOpenAddExpense: () => void;
  onOpenSettle: (fromId?: string, toId?: string, amount?: number) => void;
  onViewAllExpenses: () => void;
  onViewAllBalances: () => void;
  onSelectExpense?: (expense: Expense) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  'Food & Dining': '🍕',
  'Groceries': '🛒',
  'Transportation': '🚗',
  'Activities': '🎉',
  'Accommodation': '🏠',
  'Utilities': '⚡',
  'Shopping': '🛍️',
  'General': '💳',
};

export const MobileDashboard: React.FC<MobileDashboardProps> = ({
  group,
  summary,
  onOpenAddExpense,
  onOpenSettle,
  onViewAllExpenses,
  onViewAllBalances,
  onSelectExpense,
}) => {
  const recentExpenses = group.expenses.slice(0, 4);

  return (
    <div id="mobile-dashboard-view" className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Hero Total Spent Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Group Spend
            </span>
            <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full">
              {group.members.length} members
            </span>
          </div>

          <div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
              {formatMoney(summary.totalExpenseAmount, group.defaultCurrency)}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {summary.activeDebtAmount > 0
                ? `${formatMoney(summary.activeDebtAmount, group.defaultCurrency)} in pending debts`
                : 'All accounts balanced'}
            </p>
          </div>

          <div className="pt-2 flex items-center gap-2.5">
            <button
              id="dashboard-add-expense-btn"
              onClick={onOpenAddExpense}
              className="flex-1 min-h-[44px] bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white text-xs font-bold rounded-xl py-2.5 px-4 flex items-center justify-center space-x-2 transition shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Expense</span>
            </button>
            <button
              id="dashboard-view-balances-btn"
              onClick={onViewAllBalances}
              className="min-h-[44px] bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 text-xs font-bold rounded-xl py-2.5 px-4 transition"
            >
              Balances
            </button>
          </div>
        </div>
      </div>

      {/* 2. Simplified Debts (Who Pays Whom) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-slate-900 tracking-tight">
            Who Pays Whom
          </h2>
          {summary.simplifiedTransactions.length > 0 && (
            <span className="text-[11px] font-bold text-slate-400">
              {summary.simplifiedTransactions.length} payment{summary.simplifiedTransactions.length > 1 ? 's' : ''} needed
            </span>
          )}
        </div>

        <SimplifiedDebts
          transactions={summary.simplifiedTransactions}
          baseCurrency={group.defaultCurrency}
          totalMembers={group.members.length}
          onSettle={onOpenSettle}
        />
      </div>

      {/* 3. Recent Expenses Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-slate-900 tracking-tight">
            Recent Expenses
          </h2>
          {group.expenses.length > 0 && (
            <button
              onClick={onViewAllExpenses}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-0.5"
            >
              <span>See all ({group.expenses.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentExpenses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 text-center text-xs text-slate-500 shadow-2xs">
            No expenses recorded yet. Tap "+ Add Expense" to start!
          </div>
        ) : (
          <div className="space-y-2">
            {recentExpenses.map((exp) => {
              const payer = exp.paidBy[0];
              const icon = CATEGORY_ICONS[exp.category] || '💳';
              const dateStr = new Date(exp.date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={exp.id}
                  onClick={() => (onSelectExpense ? onSelectExpense(exp) : onViewAllExpenses())}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 p-3.5 shadow-2xs flex items-center justify-between gap-3 cursor-pointer active:scale-99 transition"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-base shrink-0">
                      {icon}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {exp.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        Paid by {payer?.memberName || 'Someone'} • {dateStr}
                      </p>
                    </div>
                  </div>

                  <span className="text-sm font-black text-slate-900 shrink-0">
                    {formatMoney(exp.amount, exp.currency || group.defaultCurrency)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
