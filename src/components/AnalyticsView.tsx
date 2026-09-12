import React from 'react';
import { PieChart, TrendingUp, Users, DollarSign, Award, Layers } from 'lucide-react';
import { GroupSummary, CurrencyCode, Expense, Member } from '../types/index.ts';
import { formatMoney } from '../utils/currencies.ts';
import { getCategoryIcon } from './ExpenseList.tsx';

interface AnalyticsViewProps {
  summary: GroupSummary;
  expenses: Expense[];
  members: Member[];
  baseCurrency: CurrencyCode;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  summary,
  expenses,
  members,
  baseCurrency,
}) => {
  const total = summary.totalExpenseAmount || 0;
  const count = expenses.length;
  const avgExpense = count > 0 ? total / count : 0;

  // Find biggest expense
  let maxExpense: Expense | null = null;
  expenses.forEach((e) => {
    if (!maxExpense || e.baseAmount > maxExpense.baseAmount) {
      maxExpense = e;
    }
  });

  return (
    <div id="analytics-view-container" className="space-y-6">
      {/* High-level stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
            Total Group Spending
          </div>
          <div className="text-2xl font-black text-stone-900 tracking-tight">
            {formatMoney(total, baseCurrency)}
          </div>
          <div className="text-xs text-stone-400 mt-1">Across {count} total expenses</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
            Average Per Expense
          </div>
          <div className="text-2xl font-black text-stone-900 tracking-tight">
            {formatMoney(avgExpense, baseCurrency)}
          </div>
          <div className="text-xs text-stone-400 mt-1">Per transaction average</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
            Settled Payments
          </div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">
            {formatMoney(summary.totalSettlementAmount, baseCurrency)}
          </div>
          <div className="text-xs text-stone-400 mt-1">
            {summary.activeDebtAmount > 0
              ? `${formatMoney(summary.activeDebtAmount, baseCurrency)} still pending`
              : 'All cleared'}
          </div>
        </div>
      </div>

      {/* Two columns: Category Breakdown and Member Spending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs">
          <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-stone-100">
            <PieChart className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-bold text-stone-900">Spending by Category</h3>
          </div>

          {summary.categoryBreakdown.length === 0 ? (
            <div className="text-center py-8 text-stone-400 text-xs">
              No categorized expenses yet.
            </div>
          ) : (
            <div className="space-y-3.5">
              {summary.categoryBreakdown.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium text-stone-700">
                    <div className="flex items-center space-x-2">
                      <div className="p-1 rounded-md bg-stone-100">
                        {getCategoryIcon(cat.category)}
                      </div>
                      <span className="font-semibold text-stone-800">{cat.category}</span>
                      <span className="text-[10px] text-stone-400 font-normal">
                        ({cat.count} expense{cat.count > 1 ? 's' : ''})
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-stone-900">
                        {formatMoney(cat.totalAmount, baseCurrency)}
                      </span>
                      <span className="text-stone-400 ml-1.5 text-[11px]">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(2, cat.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Member Contributions Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs">
          <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-stone-100">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-stone-900">Member Contributions (Paid vs Share)</h3>
          </div>

          <div className="space-y-4">
            {summary.memberBalances.map((mb) => {
              const paidPct = total > 0 ? (mb.totalPaid / total) * 100 : 0;
              const sharePct = total > 0 ? (mb.totalShare / total) * 100 : 0;

              return (
                <div key={mb.memberId} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-semibold text-stone-800">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
                        style={{ backgroundColor: mb.avatarColor }}
                      >
                        {mb.memberName.slice(0, 1)}
                      </div>
                      <span>{mb.memberName}</span>
                    </div>
                    <div className="space-x-3 text-right">
                      <span className="text-teal-700">
                        Paid: <strong>{formatMoney(mb.totalPaid, baseCurrency)}</strong>
                      </span>
                      <span className="text-stone-400">|</span>
                      <span className="text-stone-600">
                        Share: <strong>{formatMoney(mb.totalShare, baseCurrency)}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Dual comparison bar */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-stone-400 w-10">Paid</span>
                      <div className="h-1.5 flex-1 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full"
                          style={{ width: `${Math.min(100, paidPct)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-stone-400 w-8 text-right">
                        {paidPct.toFixed(0)}%
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-stone-400 w-10">Share</span>
                      <div className="h-1.5 flex-1 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-400 rounded-full"
                          style={{ width: `${Math.min(100, sharePct)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-stone-400 w-8 text-right">
                        {sharePct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
