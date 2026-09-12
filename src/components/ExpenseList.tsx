import React, { useState } from 'react';
import {
  Search,
  Receipt,
  Edit2,
  ChevronRight,
} from 'lucide-react';
import { Expense, Member, CurrencyCode } from '../types/index.ts';
import { formatMoney } from '../utils/currencies.ts';

interface ExpenseListProps {
  expenses: Expense[];
  members: Member[];
  baseCurrency: CurrencyCode;
  onDeleteExpense: (expenseId: string) => Promise<void>;
  onOpenAddExpense: () => void;
  onSelectExpense: (expense: Expense) => void;
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

export const getCategoryIcon = (category: string) => {
  return <span>{CATEGORY_ICONS[category] || '💳'}</span>;
};

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  members,
  baseCurrency,
  onDeleteExpense,
  onOpenAddExpense,
  onSelectExpense,
}) => {
  const [search, setSearch] = useState('');

  const filtered = expenses.filter((exp) => {
    const matchSearch =
      exp.title.toLowerCase().includes(search.toLowerCase()) ||
      exp.paidBy.some((p) => p.memberName.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  if (expenses.length === 0) {
    return (
      <div
        id="empty-expenses-state"
        className="bg-white rounded-3xl border border-slate-200/90 p-8 text-center space-y-3 shadow-2xs"
      >
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Receipt className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No Expenses Yet</h3>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Add your first expense to see who owes what in this group.
        </p>
        <button
          onClick={onOpenAddExpense}
          className="min-h-[44px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
        >
          Add First Expense
        </button>
      </div>
    );
  }

  return (
    <div id="expenses-feed" className="space-y-3">
      {/* Quick Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id="expense-search-input"
          type="text"
          placeholder="Search expenses or who paid..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 min-h-[44px] shadow-2xs"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-xs text-slate-400">
          No expenses match "{search}"
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((exp) => {
            const payer = exp.paidBy[0];
            const icon = CATEGORY_ICONS[exp.category] || '💳';
            const dateStr = new Date(exp.date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={exp.id}
                id={`expense-item-${exp.id}`}
                onClick={() => onSelectExpense(exp)}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-400 p-3.5 shadow-2xs cursor-pointer active:scale-99 transition flex items-center justify-between gap-3 group"
              >
                {/* Category icon & Info */}
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-lg shrink-0 group-hover:bg-emerald-50 transition-colors">
                    {icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                      <span>{exp.title}</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      Paid by <strong className="text-slate-700 font-semibold">{payer?.memberName || 'Someone'}</strong> • {dateStr}
                    </p>
                  </div>
                </div>

                {/* Amount & Edit prompt */}
                <div className="flex items-center space-x-2 shrink-0">
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 block">
                      {formatMoney(exp.amount, exp.currency || baseCurrency)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {exp.splits.length} {exp.splits.length === 1 ? 'person' : 'people'}
                    </span>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-slate-50 group-hover:bg-emerald-100/70 flex items-center justify-center text-slate-400 group-hover:text-emerald-700 transition">
                    <Edit2 className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
