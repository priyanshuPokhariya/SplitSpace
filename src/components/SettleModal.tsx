import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { Group, CurrencyCode } from '../types/index.ts';
import { formatMoney } from '../utils/currencies.ts';

interface SettleModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  initialFromMemberId?: string;
  initialToMemberId?: string;
  initialAmount?: number;
  onRecordSettlement: (data: any) => Promise<void>;
}

const PAYMENT_METHODS = ['Cash', 'UPI', 'Venmo', 'Bank Transfer', 'Other'] as const;

export const SettleModal: React.FC<SettleModalProps> = ({
  isOpen,
  onClose,
  group,
  initialFromMemberId,
  initialToMemberId,
  initialAmount,
  onRecordSettlement,
}) => {
  const [fromMemberId, setFromMemberId] = useState('');
  const [toMemberId, setToMemberId] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<typeof PAYMENT_METHODS[number]>('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFromMemberId(initialFromMemberId || group.members[0]?.id || '');
      setToMemberId(initialToMemberId || group.members[1]?.id || '');
      setAmountStr(initialAmount ? initialAmount.toFixed(2) : '');
      setPaymentMethod('Cash');
      setError(null);
    }
  }, [isOpen, initialFromMemberId, initialToMemberId, initialAmount, group]);

  if (!isOpen) return null;

  const amount = parseFloat(amountStr) || 0;
  const currency = group.defaultCurrency;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!amount || amount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    if (fromMemberId === toMemberId) {
      setError('Payer and recipient cannot be the same person.');
      return;
    }

    const fromMember = group.members.find((m) => m.id === fromMemberId);
    const toMember = group.members.find((m) => m.id === toMemberId);

    if (!fromMember || !toMember) {
      setError('Please select valid members.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRecordSettlement({
        fromMemberId,
        fromMemberName: fromMember.name,
        toMemberId,
        toMemberName: toMember.name,
        amount,
        currency,
        date: new Date().toISOString(),
        paymentMethod,
        completed: true,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record settlement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fromMember = group.members.find((m) => m.id === fromMemberId);
  const toMember = group.members.find((m) => m.id === toMemberId);

  return (
    <div
      id="settle-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="settle-modal"
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Settle Up</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Member transfer summary card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between gap-3">
            {/* Payer */}
            <div className="flex-1 text-center min-w-0">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Who Paid
              </label>
              <select
                id="settle-from-select"
                value={fromMemberId}
                onChange={(e) => setFromMemberId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-emerald-500"
              >
                {group.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mt-4" />

            {/* Recipient */}
            <div className="flex-1 text-center min-w-0">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                To Whom
              </label>
              <select
                id="settle-to-select"
                value={toMemberId}
                onChange={(e) => setToMemberId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-emerald-500"
              >
                {group.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount input */}
          <div className="text-center py-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Settlement Amount ({currency})
            </label>
            <input
              id="settle-amount-input"
              type="number"
              step="any"
              inputMode="decimal"
              autoFocus
              placeholder="0.00"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full text-center text-4xl font-black text-slate-900 placeholder:text-slate-300 focus:outline-hidden min-h-[48px]"
            />
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((method) => {
                const isSelected = paymentMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`min-h-[40px] px-2 py-2 rounded-xl text-xs font-semibold transition border ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {method}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              id="record-settlement-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center space-x-2"
            >
              <span>{isSubmitting ? 'Recording...' : 'Record Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
