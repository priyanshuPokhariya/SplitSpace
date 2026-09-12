import React from 'react';
import { ArrowRight, CheckCircle2, DollarSign } from 'lucide-react';
import { SimplifiedTransaction, CurrencyCode } from '../types/index.ts';
import { formatMoney } from '../utils/currencies.ts';

interface SimplifiedDebtsProps {
  transactions: SimplifiedTransaction[];
  baseCurrency: CurrencyCode;
  onSettle: (fromId: string, toId: string, amount: number) => void;
}

export const SimplifiedDebts: React.FC<SimplifiedDebtsProps> = ({
  transactions,
  baseCurrency,
  onSettle,
}) => {
  if (transactions.length === 0) {
    return (
      <div
        id="all-settled-card"
        className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-6 text-center"
      >
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-emerald-900">All Settled Up!</h3>
        <p className="text-xs text-emerald-700 mt-0.5">
          Nobody in the group owes anyone anything.
        </p>
      </div>
    );
  }

  return (
    <div id="simplified-debts-list" className="space-y-2.5">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          id={`simplified-tx-${tx.id}`}
          className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs flex items-center justify-between gap-3 hover:border-slate-300 transition"
        >
          {/* Members flow */}
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            {/* Debtor */}
            <div className="flex items-center space-x-2 min-w-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                style={{ backgroundColor: tx.fromAvatarColor || '#3B82F6' }}
              >
                {tx.fromMemberName.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-slate-900 truncate">
                {tx.fromMemberName}
              </span>
            </div>

            {/* Arrow */}
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

            {/* Creditor */}
            <div className="flex items-center space-x-2 min-w-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                style={{ backgroundColor: tx.toAvatarColor || '#10B981' }}
              >
                {tx.toMemberName.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-slate-900 truncate">
                {tx.toMemberName}
              </span>
            </div>
          </div>

          {/* Amount & Settle Button */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <span className="text-sm font-black text-slate-900">
              {formatMoney(tx.amount, baseCurrency)}
            </span>
            <button
              id={`settle-btn-${tx.id}`}
              onClick={() => onSettle(tx.fromMemberId, tx.toMemberId, tx.amount)}
              className="min-h-[40px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-2xs"
            >
              Settle
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
