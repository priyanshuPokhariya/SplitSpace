import React, { useState } from 'react';
import { X, Plus, Users, Check, Trash2, AlertCircle } from 'lucide-react';
import { CurrencyCode } from '../types/index.ts';
import { SUPPORTED_CURRENCIES } from '../utils/currencies.ts';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (payload: {
    name: string;
    creatorName: string;
    description?: string;
    defaultCurrency: CurrencyCode;
    members: { name: string; email?: string }[];
  }) => Promise<void>;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
}) => {
  const [name, setName] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [memberInput, setMemberInput] = useState('');
  const [members, setMembers] = useState<string[]>(['Alex']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddMember = () => {
    const trimmed = memberInput.trim();
    if (trimmed && trimmed.toLowerCase() !== creatorName.trim().toLowerCase() && !members.includes(trimmed)) {
      setMembers([...members, trimmed]);
      setMemberInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMember();
    }
  };

  const handleRemoveMember = (idx: number) => {
    setMembers(members.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setError('Please enter a group name.');
      return;
    }

    const cleanCreator = creatorName.trim();
    if (!cleanCreator) {
      setError("Please enter your name as the group creator (Maker).");
      return;
    }

    // Full list of members: Creator + additional friends
    const fullMemberList = [cleanCreator, ...members.filter((m) => m.toLowerCase() !== cleanCreator.toLowerCase())];

    if (fullMemberList.length < 2) {
      setError('Please add at least 1 friend to split expenses with.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateGroup({
        name: cleanName,
        creatorName: cleanCreator,
        defaultCurrency: currency,
        members: fullMemberList.map((m, idx) => ({
          name: m,
        })),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="create-group-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="create-group-modal"
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom duration-200"
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">Create Group</h2>
              <p className="text-[11px] text-slate-500">You'll be the group creator with write permissions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Group Name */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Group Name
            </label>
            <input
              id="new-group-name-input"
              type="text"
              placeholder="e.g. Weekend Roadtrip, Apartment 4B..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden min-h-[44px] transition"
            />
          </div>

          {/* Maker's Name (Creator) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800">
                Your Name <span className="text-emerald-600 font-bold">(Group Creator)</span>
              </label>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                Maker Admin
              </span>
            </div>
            <input
              id="new-group-creator-input"
              type="text"
              placeholder="e.g. Sarah, David..."
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden min-h-[44px] transition"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              As creator, you will exclusively hold edit and delete permissions for expenses and members.
            </p>
          </div>

          {/* Currency */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Group Currency
            </label>
            <select
              id="new-group-currency-select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500 min-h-[44px]"
            >
              {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol}) - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Other Members */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Other Members (Friends to split with)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Friend's name..."
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 min-h-[44px]"
              />
              <button
                type="button"
                onClick={handleAddMember}
                className="min-h-[44px] px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1 transition shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            {/* Members chips list */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {creatorName.trim() && (
                <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 flex items-center space-x-1.5">
                  <span>{creatorName.trim()} (Creator)</span>
                </div>
              )}
              {members.map((m, idx) => (
                <div
                  key={idx}
                  className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-800 flex items-center space-x-1.5"
                >
                  <span>{m}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(idx)}
                    className="text-slate-400 hover:text-rose-500 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3">
            <button
              id="create-group-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center space-x-2"
            >
              <span>{isSubmitting ? 'Creating Group...' : 'Create Group'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
