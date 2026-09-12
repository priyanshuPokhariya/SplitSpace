import React, { useState, useEffect } from 'react';
import { X, Check, Users, AlertCircle, Trash2, Edit3, Eye, Shield } from 'lucide-react';
import {
  CurrencyCode,
  ExpenseCategory,
  Group,
  Expense,
  SplitParticipant,
  PayerDetail,
} from '../types/index.ts';
import { formatMoney } from '../utils/currencies.ts';

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  expense: Expense | null;
  isCreator?: boolean;
  onUpdateExpense: (expenseId: string, expenseData: any) => Promise<void>;
  onDeleteExpense: (expenseId: string) => Promise<void>;
}

const QUICK_CATEGORIES: { label: ExpenseCategory; icon: string }[] = [
  { label: 'Food & Dining', icon: '🍕' },
  { label: 'Groceries', icon: '🛒' },
  { label: 'Transportation', icon: '🚗' },
  { label: 'Activities', icon: '🎉' },
  { label: 'Accommodation', icon: '🏠' },
  { label: 'General', icon: '⚡' },
];

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  isOpen,
  onClose,
  group,
  expense,
  isCreator = true,
  onUpdateExpense,
  onDeleteExpense,
}) => {
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food & Dining');
  const [payerId, setPayerId] = useState<string>('');
  const [splitMode, setSplitMode] = useState<'EQUAL' | 'CUSTOM'>('EQUAL');
  const [notes, setNotes] = useState('');

  // Equal split: included members
  const [includedMembers, setIncludedMembers] = useState<Record<string, boolean>>({});

  // Custom amounts: amount per member
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill fields whenever the modal opens or the expense changes
  useEffect(() => {
    if (isOpen && expense && group.members.length > 0) {
      setTitle(expense.title || '');
      setAmountStr(expense.amount ? expense.amount.toString() : '');
      setCategory(expense.category || 'General');
      setPayerId(expense.paidBy[0]?.memberId || group.members[0].id);
      setNotes(expense.notes || '');
      setConfirmDelete(false);
      setError(null);

      const isCustom = expense.splitType !== 'EQUAL';
      setSplitMode(isCustom ? 'CUSTOM' : 'EQUAL');

      const initialIncluded: Record<string, boolean> = {};
      const initialCustom: Record<string, string> = {};

      group.members.forEach((m) => {
        const participant = expense.splits.find((s) => s.memberId === m.id);
        if (participant) {
          initialIncluded[m.id] = true;
          initialCustom[m.id] = participant.shareAmount > 0 ? participant.shareAmount.toString() : '';
        } else {
          initialIncluded[m.id] = !isCustom; // in equal split, default to all unless excluded
          initialCustom[m.id] = '';
        }
      });

      setIncludedMembers(initialIncluded);
      setCustomAmounts(initialCustom);
    }
  }, [isOpen, expense, group]);

  if (!isOpen || !expense) return null;

  const totalAmount = parseFloat(amountStr) || 0;
  const currency = expense.currency || group.defaultCurrency;

  // Active members in Equal mode
  const activeEqualMembers = group.members.filter((m) => includedMembers[m.id]);
  const equalCount = activeEqualMembers.length;
  const perPersonAmount = equalCount > 0 && totalAmount > 0 ? totalAmount / equalCount : 0;

  // Custom split sum
  const customSum: number = (Object.values(customAmounts) as string[]).reduce((sum: number, val: string): number => {
    const num = parseFloat(val);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
  const customRemaining = Math.round((totalAmount - customSum) * 100) / 100;

  const toggleMemberEqual = (mId: string) => {
    setIncludedMembers((prev) => ({
      ...prev,
      [mId]: !prev[mId],
    }));
  };

  const handleCustomAmountChange = (mId: string, val: string) => {
    setCustomAmounts((prev) => ({
      ...prev,
      [mId]: val,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Please enter what this expense was for.');
      return;
    }

    if (totalAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    const payer = group.members.find((m) => m.id === payerId);
    if (!payer) {
      setError('Please choose who paid for this expense.');
      return;
    }

    const payerDetails: PayerDetail[] = [
      {
        memberId: payer.id,
        memberName: payer.name,
        amount: totalAmount,
      },
    ];

    let splits: SplitParticipant[] = [];

    if (splitMode === 'EQUAL') {
      if (activeEqualMembers.length === 0) {
        setError('At least one member must be selected in the split.');
        return;
      }
      const roundedShare = Math.round((totalAmount / activeEqualMembers.length) * 100) / 100;
      splits = activeEqualMembers.map((m) => ({
        memberId: m.id,
        memberName: m.name,
        shareAmount: roundedShare,
      }));
    } else {
      // CUSTOM amounts
      if (Math.abs(customRemaining) > 0.05) {
        setError(
          `Custom split does not match total amount. Difference: ${formatMoney(Math.abs(customRemaining), currency)}`
        );
        return;
      }

      splits = group.members
        .map((m) => {
          const raw = parseFloat(customAmounts[m.id]);
          const share = isNaN(raw) ? 0 : Math.round(raw * 100) / 100;
          return {
            memberId: m.id,
            memberName: m.name,
            shareAmount: share,
            exactAmount: share,
          };
        })
        .filter((s) => s.shareAmount > 0);

      if (splits.length === 0) {
        setError('Please allocate amounts to at least one person.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onUpdateExpense(expense.id, {
        title: cleanTitle,
        amount: totalAmount,
        currency,
        category,
        date: expense.date || new Date().toISOString(),
        paidBy: payerDetails,
        splitType: splitMode === 'EQUAL' ? 'EQUAL' : 'EXACT',
        splits,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    try {
      await onDeleteExpense(expense.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete expense');
    } finally {
      setIsDeleting(false);
    }
  };

  // If viewing as non-creator, render clean View-Only modal
  if (!isCreator) {
    const payer = expense.paidBy[0];
    const dateFormatted = new Date(expense.date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <div
        id="view-expense-modal-backdrop"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      >
        <div
          id="view-expense-modal"
          className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                <Eye className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 leading-tight">Expense Details</h2>
                <span className="text-[10px] font-bold text-slate-400">View-Only</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-5 overflow-y-auto flex-1">
            {/* Amount & Title Hero */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-center space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {expense.category}
              </span>
              <h1 className="text-3xl font-black text-slate-900">
                {formatMoney(expense.amount, currency)}
              </h1>
              <p className="text-sm font-bold text-slate-700">{expense.title}</p>
            </div>

            {/* Payer & Date */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Paid by</span>
                <span className="text-xs font-bold text-slate-900 truncate block mt-0.5">
                  {payer?.memberName || 'Member'}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Date</span>
                <span className="text-xs font-bold text-slate-900 truncate block mt-0.5">
                  {dateFormatted}
                </span>
              </div>
            </div>

            {/* Split Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Split Breakdown ({expense.splits.length})
                </h3>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                  {expense.splitType}
                </span>
              </div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                {expense.splits.map((s) => (
                  <div key={s.memberId} className="px-3.5 py-2.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{s.memberName}</span>
                    <span className="text-xs font-black text-slate-900">
                      {formatMoney(s.shareAmount, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {expense.notes && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Notes</span>
                <p className="text-xs text-slate-700">{expense.notes}</p>
              </div>
            )}

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
              <Shield className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                Only the creator (<strong>{group.creatorName || 'Maker'}</strong>) has permission to edit or delete this expense.
              </span>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 shrink-0">
            <button
              onClick={onClose}
              className="w-full min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="edit-expense-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="edit-expense-modal"
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Edit3 className="w-4 h-4" />
            </div>
            <h2 className="text-base font-black text-slate-900">Edit Expense</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Large Amount Input */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Amount ({currency})
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-2xl font-black text-slate-400">
                {formatMoney(0, currency).replace(/[0-9.,]/g, '')}
              </span>
              <input
                id="edit-expense-amount-input"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-black text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden min-h-[52px] transition"
                autoFocus
              />
            </div>
          </div>

          {/* 2. Title Input */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Description / What was this for?
            </label>
            <input
              id="edit-expense-title-input"
              type="text"
              placeholder="e.g. Dinner, Groceries, Uber..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden min-h-[44px] transition"
            />
          </div>

          {/* 3. Category Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {QUICK_CATEGORIES.map((cat) => {
                const isSelected = category === cat.label;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setCategory(cat.label)}
                    className={`min-h-[44px] px-2 py-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center space-y-1 border transition ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span className="text-[10px] leading-tight truncate w-full text-center">
                      {cat.label.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Who Paid? */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Paid by
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {group.members.map((m) => {
                const isSelected = payerId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPayerId(m.id)}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 border transition shrink-0 ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center text-white"
                      style={{ backgroundColor: m.avatarColor || '#10B981' }}
                    >
                      {m.name.charAt(0)}
                    </div>
                    <span>{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Split Section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                How to split?
              </label>

              {/* Mode Toggle */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSplitMode('EQUAL')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    splitMode === 'EQUAL'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Equally
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode('CUSTOM')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    splitMode === 'CUSTOM'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {/* Split Mode: Equal */}
            {splitMode === 'EQUAL' ? (
              <div className="space-y-2">
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/70 flex items-center justify-between text-xs">
                  <span className="text-emerald-900 font-medium">
                    {equalCount} people • {formatMoney(perPersonAmount, currency)} / person
                  </span>
                  <span className="font-bold text-emerald-800 text-[11px]">
                    Total: {formatMoney(totalAmount, currency)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {group.members.map((m) => {
                    const isIncluded = !!includedMembers[m.id];
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleMemberEqual(m.id)}
                        className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between border transition ${
                          isIncluded
                            ? 'bg-white border-slate-300 text-slate-900 shadow-2xs'
                            : 'bg-slate-50 border-slate-200/80 text-slate-400 line-through'
                        }`}
                      >
                        <span className="truncate">{m.name}</span>
                        {isIncluded ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Split Mode: Custom Exact Amounts */
              <div className="space-y-2">
                <div
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                    Math.abs(customRemaining) <= 0.05
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <span>
                    Allocated:{' '}
                    <strong>{formatMoney(customSum, currency)}</strong> of{' '}
                    {formatMoney(totalAmount, currency)}
                  </span>
                  <span className="font-bold text-[11px]">
                    {Math.abs(customRemaining) <= 0.05
                      ? '✓ Exact match'
                      : customRemaining > 0
                      ? `${formatMoney(customRemaining, currency)} remaining`
                      : `${formatMoney(Math.abs(customRemaining), currency)} over`}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {group.members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200/80"
                    >
                      <span className="text-xs font-bold text-slate-800 truncate mr-2">
                        {m.name}
                      </span>
                      <div className="flex items-center space-x-1 shrink-0">
                        <span className="text-xs text-slate-400">
                          {formatMoney(0, currency).replace(/[0-9.,]/g, '')}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={customAmounts[m.id] || ''}
                          onChange={(e) => handleCustomAmountChange(m.id, e.target.value)}
                          className="w-24 px-2 py-1.5 text-right text-xs font-bold bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons: Update Expense & Delete Expense */}
          <div className="pt-3 border-t border-slate-100 space-y-2 shrink-0">
            <button
              id="update-expense-btn"
              type="submit"
              disabled={isSubmitting || isDeleting}
              className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center space-x-2"
            >
              <span>{isSubmitting ? 'Updating...' : 'Update Expense'}</span>
            </button>

            {confirmDelete ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <p className="text-xs font-bold text-rose-800 text-center">
                  Are you sure you want to delete this expense? Debts will be recalculated.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 min-h-[44px] bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    id="confirm-delete-expense-btn"
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 min-h-[44px] bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                id="delete-expense-trigger-btn"
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting || isDeleting}
                className="w-full min-h-[44px] bg-white hover:bg-rose-50 active:scale-98 border border-rose-200 text-rose-600 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete Expense</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
