import React, { useState } from 'react';
import { UserCheck, Plus, Sparkles, Crown, X, Check, ArrowRight, UserPlus } from 'lucide-react';
import { Group, Member } from '../types/index.ts';

interface IdentifyMemberModalProps {
  isOpen: boolean;
  group: Group;
  currentMemberId: string | null;
  onSelectMember: (member: Member) => void;
  onAddNewMember: (name: string) => Promise<void>;
  onClose?: () => void;
  canDismiss?: boolean;
}

export const IdentifyMemberModal: React.FC<IdentifyMemberModalProps> = ({
  isOpen,
  group,
  currentMemberId,
  onSelectMember,
  onAddNewMember,
  onClose,
  canDismiss = false,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddNewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newMemberName.trim();
    if (!clean) {
      setError('Please enter your name.');
      return;
    }

    // Check if name already exists in group
    const existing = group.members.find(
      (m) => m.name.toLowerCase() === clean.toLowerCase()
    );
    if (existing) {
      onSelectMember(existing);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onAddNewMember(clean);
      setNewMemberName('');
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to join group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="identify-member-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="identify-member-modal"
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">Who are you?</h2>
              <p className="text-xs text-slate-500 font-medium">
                {group.name}
              </p>
            </div>
          </div>
          {canDismiss && onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Select your name to track your share, calculate your pending debts, and personalize who pays whom. No login required.
          </p>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Members List */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
            {group.members.map((member) => {
              const isSelected = member.id === currentMemberId;
              const creatorName = (group.createdBy || group.creatorName || '').trim().toLowerCase();
              const isCreator =
                (creatorName && member.name.trim().toLowerCase() === creatorName) ||
                member.id === group.creatorMemberId ||
                member.isCreator;

              return (
                <button
                  key={member.id}
                  id={`select-member-${member.id}`}
                  onClick={() => onSelectMember(member)}
                  className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-2xl text-left border flex items-center justify-between transition active:scale-98 ${
                    isSelected
                      ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs"
                      style={{ backgroundColor: member.avatarColor }}
                    >
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {member.name}
                        </span>
                        {isCreator && (
                          <span className="inline-flex items-center space-x-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md border border-amber-200">
                            <Crown className="w-2.5 h-2.5 mr-0.5" />
                            <span>Creator</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {isCreator ? 'Admin permissions' : 'View-only access'}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Add New Member Toggle / Form */}
          {!showAddForm ? (
            <button
              id="not-listed-add-name-btn"
              type="button"
              onClick={() => setShowAddForm(true)}
              className="w-full min-h-[44px] py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:scale-98 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center space-x-2 transition"
            >
              <UserPlus className="w-4 h-4 text-slate-500" />
              <span>I'm not listed (Add my name to group)</span>
            </button>
          ) : (
            <form onSubmit={handleAddNewSubmit} className="space-y-2 pt-1 animate-in fade-in duration-150">
              <label className="text-xs font-bold text-slate-700 block">
                Enter your name to join
              </label>
              <div className="flex gap-2">
                <input
                  id="new-join-member-name-input"
                  type="text"
                  placeholder="Your name..."
                  autoFocus
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 min-h-[44px]"
                />
                <button
                  type="submit"
                  disabled={!newMemberName.trim() || isSubmitting}
                  className="min-h-[44px] px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center space-x-1 transition shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Joining...' : 'Join'}</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-[11px] text-slate-400 hover:text-slate-600 transition"
              >
                Back to members list
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
