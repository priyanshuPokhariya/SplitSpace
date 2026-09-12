import React, { useState } from 'react';
import {
  Copy,
  Check,
  UserPlus,
  Users,
  Plus,
  Share2,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Group, Member } from '../types/index.ts';

interface GroupSettingsViewProps {
  group: Group;
  groups: Group[];
  onSelectGroup: (groupId: string) => void;
  onOpenCreateGroup: () => void;
  onAddMember: (name: string) => Promise<void>;
  onOpenBlueprint?: () => void;
  isMongo?: boolean;
}

export const GroupSettingsView: React.FC<GroupSettingsViewProps> = ({
  group,
  groups,
  onSelectGroup,
  onOpenCreateGroup,
  onAddMember,
  onOpenBlueprint,
  isMongo,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

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

  return (
    <div id="group-settings-view" className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Group Identity & Invite Link */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
            Active Group
          </span>
          <h2 className="text-xl font-black text-slate-900">{group.name}</h2>
          {group.description && (
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
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

      {/* 2. Group Members List & Quick Add */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">
            Members ({group.members.length})
          </h3>
        </div>

        {/* Inline Add Member Form */}
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
          {group.members.map((member) => (
            <div key={member.id} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: member.avatarColor }}
                >
                  {member.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-slate-800">
                  {member.name}
                </span>
              </div>
            </div>
          ))}
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

      {/* 4. Subtle Architecture Info (Optional Blueprint link) */}
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
    </div>
  );
};
