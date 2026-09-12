import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Check, User } from 'lucide-react';
import { MemberBalance, CurrencyCode } from '../types/index.ts';
import { formatMoney } from '../utils/currencies.ts';

interface BalanceCardProps {
  balances: MemberBalance[];
  baseCurrency: CurrencyCode;
  onSettleMember?: (memberId: string) => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balances,
  baseCurrency,
  onSettleMember,
}) => {
  return (
    <div id="member-balances-container" className="space-y-3">
      {balances.map((mb) => {
        const isCreditor = mb.netBalance > 0.01;
        const isDebtor = mb.netBalance < -0.01;
        const isSettled = !isCreditor && !isDebtor;

        return (
          <div
            key={mb.memberId}
            id={`balance-card-${mb.memberId}`}
            className={`rounded-2xl p-4 border transition ${
              isCreditor
                ? 'bg-emerald-50/40 border-emerald-200/90'
                : isDebtor
                ? 'bg-rose-50/40 border-rose-200/90'
                : 'bg-white border-slate-200/80'
            }`}
          >
            {/* Top row: Avatar, Name & Net Balance */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs"
                  style={{ backgroundColor: mb.avatarColor }}
                >
                  {mb.memberName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {mb.memberName}
                  </h4>
                  <div className="flex items-center space-x-1 text-[11px] font-medium">
                    {isCreditor && (
                      <span className="text-emerald-700 flex items-center">
                        <ArrowDownLeft className="w-3 h-3 mr-0.5" /> Gets back
                      </span>
                    )}
                    {isDebtor && (
                      <span className="text-rose-700 flex items-center">
                        <ArrowUpRight className="w-3 h-3 mr-0.5" /> Owes money
                      </span>
                    )}
                    {isSettled && (
                      <span className="text-slate-500 flex items-center">
                        <Check className="w-3 h-3 mr-0.5" /> Settled up
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Net Balance Badge */}
              <div className="text-right shrink-0">
                <div
                  className={`text-base font-black tracking-tight ${
                    isCreditor
                      ? 'text-emerald-600'
                      : isDebtor
                      ? 'text-rose-600'
                      : 'text-slate-700'
                  }`}
                >
                  {isCreditor ? '+' : ''}
                  {formatMoney(mb.netBalance, baseCurrency)}
                </div>
              </div>
            </div>

            {/* Bottom Row: Breakdown stats & quick Settle action */}
            <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center space-x-3">
                <span>Paid: <strong className="text-slate-700 font-semibold">{formatMoney(mb.totalPaid, baseCurrency)}</strong></span>
                <span>•</span>
                <span>Share: <strong className="text-slate-700 font-semibold">{formatMoney(mb.totalShare, baseCurrency)}</strong></span>
              </div>

              {isDebtor && onSettleMember && (
                <button
                  id={`settle-member-btn-${mb.memberId}`}
                  onClick={() => onSettleMember(mb.memberId)}
                  className="min-h-[36px] px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs rounded-lg transition"
                >
                  Settle Up
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
