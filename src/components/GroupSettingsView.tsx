import React, { useState } from 'react';
import {
  Copy,
  Check,
  UserPlus,
  Users,
  Plus,
  Share2,
  Trash2,
  AlertTriangle,
  Crown,
  Shield,
  Eye,
  Info,
} from 'lucide-react';
import { Group, Member } from '../types/index.ts';

interface GroupSettingsViewProps {
  group: Group;
  groups: Group[];
  isCreator: boolean;
  currentMemberId: string | null;
  onSelectGroup: (groupId: string) => void;
  onOpenCreateGroup: () => void;
  onAddMember: (name: string) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onDeleteGroup: () => Promise<void>;
  onOpenBlueprint?: () => void;
  isMongo?: boolean;
}

export const GroupSettingsView: React.FC<GroupSettingsViewProps> = ({
  group,
  groups,
  isCreator,
  currentMemberId,
  onSelectGroup,
  onOpenCreateGroup,
  onAddMember,
  onRemoveMember,
  onDeleteGroup,
  onOpenBlueprint,
  isMongo,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Deletion modals state
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [removeMemberError, setRemoveMemberError] = useState<string | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [deleteGroupError, setDeleteGroupError] = useState<string | null>(null);

  const shareUrl = `${window.location.origin}${window.location.pathname}?group=${group.shareCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(group.shareCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newMemberName.trim();
    if (!cleanName) return;

    setIsAdding(true);
    try {
      await onAddMember(cleanName);
      setNewMemberName('');
    } finally {
      setIsAdding(false);
    }
  };

  const handleInitiateRemoveMember = (member: Member) => {
    setRemoveMemberError(null);
    // Check if member has expenses or splits
    const involvedExpenses = group.expenses.filter(
      (e) =>
        e.paidBy.some((p) => p.memberId === member.id) ||
        e.splits.some((s) => s.memberId === member.id)
    );

    if (involvedExpenses.length > 0) {
      setRemoveMemberError(
        `Cannot remove ${member.name}: They are part of ${involvedExpenses.length} expense(s) (e.g. "${involvedExpenses[0].title}"). Please delete or reassign those expenses before removing this member.`
      );
    }
    setMemberToRemove(member);
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;
    setIsRemovingMember(true);
    try {
      await onRemoveMember(memberToRemove.id);
      setMemberToRemove(null);
      setRemoveMemberError(null);
    } catch (err: any) {
      setRemoveMemberError(err.message || 'Failed to remove member');
    } finally {
      setIsRemovingMember(false);
    }
  };

  const handleConfirmDeleteGroup = async () => {
    setIsDeletingGroup(true);
    setDeleteGroupError(null);
    try {
      await onDeleteGroup();
      setShowDeleteGroupModal(false);
    } catch (err: any) {
      setDeleteGroupError(err.message || 'Failed to delete group');
      setIsDeletingGroup(false);
    }
  };

  return (
    <div id="group-settings-view" className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Group Identity & Creator Permissions Badge */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Group
            </span>
            {isCreator ? (
              <span className="inline-flex items-center space-x-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                <Crown className="w-3 h-3 text-emerald-600" />
                <span>You are Creator (Full Access)</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                <Eye className="w-3 h-3 text-amber-600" />
                <span>View-Only Member</span>
              </span>
            )}
          </div>
          <h2 className="text-xl font-black text-slate-900">{group.name}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Created by <strong className="text-slate-800 font-semibold">{group.creatorName || 'Maker'}</strong>
          </p>
          {group.description && (
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {group.description}
            </p>
          )}
        </div>

        {/* Share Link Row */}
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Invite Code</span>
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center space-x-1 font-mono text-xs font-bold text-slate-900 bg-white px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              <span>{group.shareCode}</span>
              {copiedCode ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400" />
              )}
            </button>
          </div>

          <button
            onClick={handleCopyLink}
            className="w-full min-h-[44px] bg-white hover:bg-slate-100 active:scale-98 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 flex items-center justify-center space-x-2 transition shadow-2xs"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Invite Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-slate-500" />
                <span>Copy Shareable Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Group Members List & Member Management */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">
            Members ({group.members.length})
          </h3>
          <span className="text-[11px] text-slate-400">
            {isCreator ? 'Admin access' : 'View access'}
          </span>
        </div>

        {/* Inline Add Member Form (Only creator or authorized) */}
        <form onSubmit={handleAddMemberSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Add new member..."
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            className="flex-1 px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-emerald-500 min-h-[44px]"
          />
          <button
            type="submit"
            disabled={!newMemberName.trim() || isAdding}
            className="min-h-[44px] px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center space-x-1 transition shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </form>

        {/* Members Roster */}
        <div className="divide-y divide-slate-100">
          {group.members.map((member) => {
            const creatorName = (group.createdBy || group.creatorName || '').trim().toLowerCase();
            const isMemberCreator =
              (creatorName && member.name.trim().toLowerCase() === creatorName) ||
              member.id === group.creatorMemberId ||
              member.isCreator;
            const isSelf = member.id === currentMemberId;

            return (
              <div key={member.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs"
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-slate-800">
                        {member.name}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] text-slate-400 font-medium">(You)</span>
                      )}
                    </div>
                    {isMemberCreator && (
                      <span className="inline-flex items-center text-[10px] font-bold text-amber-700">
                        <Crown className="w-2.5 h-2.5 mr-0.5" />
                        Creator
                      </span>
                    )}
                  </div>
                </div>

                {/* Remove Member option: visible to Creator, for non-creator members */}
                {isCreator && !isMemberCreator && (
                  <button
                    type="button"
                    onClick={() => handleInitiateRemoveMember(member)}
                    title={`Remove ${member.name}`}
                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Switch or Create Group */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-black text-slate-900">All Your Groups</h3>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {groups.map((g) => {
            const isCurrent = g.id === group.id;
            return (
              <button
                key={g.id}
                onClick={() => onSelectGroup(g.id)}
                className={`w-full min-h-[44px] px-3 py-2.5 rounded-xl text-left text-xs flex items-center justify-between transition ${
                  isCurrent
                    ? 'bg-emerald-50 border border-emerald-300 font-bold text-emerald-900'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium'
                }`}
              >
                <span className="truncate">{g.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {g.shareCode}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onOpenCreateGroup}
          className="w-full min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl py-2.5 px-4 flex items-center justify-center space-x-2 transition shadow-xs mt-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Another Group</span>
        </button>
      </div>

      {/* 4. Danger Zone (Delete Group - Creator Only) */}
      {isCreator ? (
        <div className="bg-rose-50/60 rounded-3xl border border-rose-200 p-5 space-y-3">
          <div className="flex items-center space-x-2 text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-black">Danger Zone</h3>
          </div>
          <p className="text-xs text-rose-700 leading-relaxed">
            Permanently delete <strong>"{group.name}"</strong>, cascading to all expenses, splits, and member records. This cannot be undone.
          </p>
          <button
            id="delete-group-open-modal-btn"
            type="button"
            onClick={() => setShowDeleteGroupModal(true)}
            className="w-full min-h-[44px] bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl py-2.5 px-4 flex items-center justify-center space-x-2 transition shadow-xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Entire Group</span>
          </button>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 text-center space-y-1">
          <div className="flex items-center justify-center space-x-1.5 text-slate-700 text-xs font-bold">
            <Shield className="w-3.5 h-3.5 text-slate-500" />
            <span>View-Only Member Permissions</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Only the group creator ({group.creatorName || 'Maker'}) can add/edit expenses, remove members, or delete this group.
          </p>
        </div>
      )}

      {/* Architecture Info Blueprint Link */}
      {onOpenBlueprint && (
        <div className="text-center pt-2 pb-6">
          <button
            onClick={onOpenBlueprint}
            className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition"
          >
            MERN Architecture ({isMongo ? 'MongoDB Atlas' : 'Local Storage Engine'})
          </button>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      {memberToRemove && (
        <div
          id="remove-member-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-2.5 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-black text-slate-900">
                Remove Member
              </h3>
            </div>

            {removeMemberError ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 leading-relaxed">
                {removeMemberError}
              </div>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to remove <strong>{memberToRemove.name}</strong> from <strong>{group.name}</strong>?
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMemberToRemove(null);
                  setRemoveMemberError(null);
                }}
                className="flex-1 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                {removeMemberError ? 'Got it' : 'Cancel'}
              </button>
              {!removeMemberError && (
                <button
                  type="button"
                  onClick={handleConfirmRemoveMember}
                  disabled={isRemovingMember}
                  className="flex-1 min-h-[44px] bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition"
                >
                  {isRemovingMember ? 'Removing...' : 'Yes, Remove'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Confirmation Modal */}
      {showDeleteGroupModal && (
        <div
          id="delete-group-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-2.5 text-rose-600">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-base font-black text-slate-900">
                Delete "{group.name}"?
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This action <strong>cannot be undone</strong>. All {group.expenses.length} expenses, member debts, and settlements will be permanently erased from the database.
            </p>

            {deleteGroupError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {deleteGroupError}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteGroupModal(false)}
                disabled={isDeletingGroup}
                className="flex-1 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-group-btn"
                type="button"
                onClick={handleConfirmDeleteGroup}
                disabled={isDeletingGroup}
                className="flex-1 min-h-[44px] bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition"
              >
                {isDeletingGroup ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
