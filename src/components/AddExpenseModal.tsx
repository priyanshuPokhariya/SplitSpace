import React, { useState, useEffect } from 'react';
import { X, Check, Users, AlertCircle } from 'lucide-react';
import {
  CurrencyCode,
  ExpenseCategory,
  Group,
  SplitParticipant,
  PayerDetail,
} from '../types/index.ts';
import { formatMoney } from '../utils/currencies.ts';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  onSaveExpense: (expenseData: any) => Promise<void>;
}

const QUICK_CATEGORIES: { label: ExpenseCategory; icon: string }[] = [
  { label: 'Food & Dining', icon: '🍕' },
  { label: 'Groceries', icon: '🛒' },
  { label: 'Transportation', icon: '🚗' },
  { label: 'Activities', icon: '🎉' },
  { label: 'Accommodation', icon: '🏠' },
  { label: 'General', icon: '⚡' },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  group,
  onSaveExpense,
}) => {
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food & Dining');
  const [payerId, setPayerId] = useState<string>(group.members[0]?.id || '');
  const [splitMode, setSplitMode] = useState<'EQUAL' | 'CUSTOM'>('EQUAL');

  // Equal split: included members
  const [includedMembers, setIncludedMembers] = useState<Record<string, boolean>>({});

  // Custom amounts: amount per member
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize or reset when opened
  useEffect(() => {
    if (isOpen && group.members.length > 0) {
      setTitle('');
      setAmountStr('');
      setCategory('Food & Dining');
      setPayerId(group.members[0].id);
      setSplitMode('EQUAL');
      setError(null);

      const initialIncluded: Record<string, boolean> = {};
      const initialCustom: Record<string, string> = {};
      group.members.forEach((m) => {
        initialIncluded[m.id] = true;
        initialCustom[m.id] = '';
      });
      setIncludedMembers(initialIncluded);
      setCustomAmounts(initialCustom);
    }
  }, [isOpen, group]);

  if (!isOpen) return null;

  const totalAmount = parseFloat(amountStr) || 0;
  const currency = group.defaultCurrency;

  // Active members in Equal mode
  const activeEqualMembers = group.members.filter((m) => includedMembers[m.id]);
  const equalCount = activeEqualMembers.length;
  const perPersonAmount = equalCount > 0 && totalAmount > 0 ? (totalAmount / equalCount) : 0;

  // Custom split sum
  const customSum = Object.keys(customAmounts).reduce((acc, key) => {
    const val = customAmounts[key];
    const n = parseFloat(val);
    return acc + (isNaN(n) ? 0 : n);
  }, 0);
  const customRemaining = Math.round((totalAmount - customSum) * 100) / 100;

  const handleToggleMember = (memberId: string) => {
    // If only one is selected, don't allow deselecting the last one
    if (includedMembers[memberId] && equalCount <= 1) return;
    setIncludedMembers((prev) => ({
      ...prev,
      [memberId]: !prev[memberId],
    }));
  };

  const handleCustomAmountChange = (memberId: string, val: string) => {
    setCustomAmounts((prev) => ({
      ...prev,
      [memberId]: val,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Please give this expense a title.');
      return;
    }

    if (!totalAmount || totalAmount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }

    const payer = group.members.find((m) => m.id === payerId);
    if (!payer) {
      setError('Please select who paid.');
      return;
    }

    let splits: SplitParticipant[] = [];

    if (splitMode === 'EQUAL') {
      if (equalCount === 0) {
        setError('At least one member must be included in the split.');
        return;
      }

      const baseShare = Math.floor((totalAmount / equalCount) * 100) / 100;
      let remainder = Math.round((totalAmount - baseShare * equalCount) * 100) / 100;

      splits = activeEqualMembers.map((m, idx) => {
        const extra = idx === 0 ? remainder : 0;
        return {
          memberId: m.id,
          memberName: m.name,
          shareAmount: Math.round((baseShare + extra) * 100) / 100,
        };
      });
    } else {
      // Custom Split
      if (Math.abs(customRemaining) > 0.05) {
        setError(
          `Custom split does not match total. Difference is ${formatMoney(
            Math.abs(customRemaining),
            currency
          )} (${customRemaining > 0 ? 'under by' : 'over by'}).`
        );
        return;
      }

      splits = group.members
        .map((m) => {
          const share = parseFloat(customAmounts[m.id]) || 0;
          return {
            memberId: m.id,
            memberName: m.name,
            shareAmount: share,
            exactAmount: share,
          };
        })
        .filter((s) => s.shareAmount > 0);

      if (splits.length === 0) {
        setError('Please allocate amounts to at least one member.');
        return;
      }
    }

    const paidBy: PayerDetail[] = [
      {
        memberId: payer.id,
        memberName: payer.name,
        amount: totalAmount,
      },
    ];

    setIsSubmitting(true);
    try {
      await onSaveExpense({
        title: cleanTitle,
        amount: totalAmount,
        currency,
        category,
        date: new Date().toISOString(),
        paidBy,
        splitType: splitMode === 'EQUAL' ? 'EQUAL' : 'EXACT',
        splits,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="add-expense-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="add-expense-modal"
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Add Expense</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount Display Input (Large Thumb-friendly) */}
          <div className="text-center py-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Amount ({currency})
            </label>
            <div className="relative inline-flex items-center justify-center">
              <input
                id="expense-amount-input"
                type="number"
                step="any"
                inputMode="decimal"
                autoFocus
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full text-center text-4xl sm:text-5xl font-black text-slate-900 placeholder:text-slate-300 focus:outline-hidden py-1 min-h-[52px]"
              />
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              What was it for?
            </label>
            <input
              id="expense-title-input"
              type="text"
              placeholder="e.g. Dinner, Taxi, Groceries..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden min-h-[44px] transition"
            />
          </div>

          {/* Quick Category Chips */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Category</label>
            <div className="flex flex-wrap gap-2">
              {QUICK_CATEGORIES.map((cat) => {
                const isSelected = category === cat.label;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setCategory(cat.label)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition ${
                      isSelected
                        ? 'bg-slate-900 text-white font-bold shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Who Paid? (Horizontal 1-tap pills) */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Who paid?</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {group.members.map((m) => {
                const isPayer = payerId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    id={`payer-btn-${m.id}`}
                    onClick={() => setPayerId(m.id)}
                    className={`min-h-[44px] px-3 py-2 rounded-xl flex items-center space-x-2.5 transition border text-left ${
                      isPayer
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-500'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: m.avatarColor }}
                    >
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs truncate flex-1">{m.name}</span>
                    {isPayer && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Split Mode Toggle */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700">Split between</label>
              <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setSplitMode('EQUAL')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                    splitMode === 'EQUAL'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Equally
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode('CUSTOM')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                    splitMode === 'CUSTOM'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {/* Split Mode = EQUAL */}
            {splitMode === 'EQUAL' && (
              <div className="space-y-2">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-600">
                    Splitting between <strong>{equalCount} people</strong>
                  </span>
                  <span className="font-bold text-emerald-700">
                    {formatMoney(perPersonAmount, currency)} / person
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {group.members.map((m) => {
                    const isIncluded = !!includedMembers[m.id];
                    return (
                      <button
                        key={m.id}
                        type="button"
                        id={`split-member-btn-${m.id}`}
                        onClick={() => handleToggleMember(m.id)}
                        className={`min-h-[44px] px-3 py-2 rounded-xl flex items-center space-x-2 transition border text-left ${
                          isIncluded
                            ? 'bg-white border-slate-300 text-slate-900'
                            : 'bg-slate-100/60 border-slate-200/60 text-slate-400 opacity-60'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border text-white transition ${
                            isIncluded
                              ? 'bg-emerald-600 border-emerald-600'
                              : 'bg-white border-slate-300'
                          }`}
                        >
                          {isIncluded && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs truncate font-medium">{m.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Split Mode = CUSTOM */}
            {splitMode === 'CUSTOM' && (
              <div className="space-y-2">
                <div
                  className={`rounded-xl p-3 border text-xs flex items-center justify-between ${
                    Math.abs(customRemaining) < 0.01
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  <span>
                    Total allocated: <strong>{formatMoney(customSum, currency)}</strong>
                  </span>
                  <span>
                    {Math.abs(customRemaining) < 0.01
                      ? '✓ Exact match'
                      : `Remaining: ${formatMoney(customRemaining, currency)}`}
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {group.members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200/70"
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                          style={{ backgroundColor: m.avatarColor }}
                        >
                          {m.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {m.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0 w-28">
                        <span className="text-xs text-slate-400 font-semibold">{currency}</span>
                        <input
                          type="number"
                          step="any"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={customAmounts[m.id] || ''}
                          onChange={(e) => handleCustomAmountChange(m.id, e.target.value)}
                          className="w-full px-2 py-1.5 text-right text-xs font-bold bg-white border border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-hidden min-h-[38px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-2 pb-1">
            <button
              id="save-expense-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center space-x-2"
            >
              <span>{isSubmitting ? 'Saving...' : 'Save Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
