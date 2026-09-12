import React, { useState } from 'react';
import {
  Split,
  ChevronDown,
  Share2,
  Check,
  Plus,
} from 'lucide-react';
import { Group } from '../types/index.ts';

interface HeaderProps {
  currentGroup: Group | null;
  groups: Group[];
  onSelectGroup: (groupId: string) => void;
  onOpenNewGroup: () => void;
  onOpenShare: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentGroup,
  groups,
  onSelectGroup,
  onOpenNewGroup,
  onOpenShare,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleQuickCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentGroup) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?group=${currentGroup.shareCode}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
        {/* Brand & Group Selector Dropdown */}
        <div className="relative flex items-center min-w-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Split className="w-4 h-4 -rotate-45 stroke-[2.5]" />
            </div>

            {currentGroup && (
              <div className="relative">
                <button
                  id="header-group-dropdown-btn"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-left transition min-h-[40px]"
                >
                  <span className="text-sm font-black text-slate-900 truncate max-w-[130px] sm:max-w-[200px]">
                    {currentGroup.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Switch Group
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {groups.map((g) => (
                          <button
                            key={g.id}
                            onClick={() => {
                              onSelectGroup(g.id);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between hover:bg-slate-50 transition ${
                              g.id === currentGroup.id
                                ? 'text-emerald-700 bg-emerald-50/60 font-bold'
                                : 'text-slate-700'
                            }`}
                          >
                            <span className="truncate">{g.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {g.shareCode}
                            </span>
                          </button>
                        ))}
                      </div>
                      <div className="pt-1 mt-1 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            onOpenNewGroup();
                          }}
                          className="w-full px-3 py-2 text-left text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center space-x-2 transition"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Create New Group</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action: Share Link button with 1-tap copy toast feedback */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            id="header-share-btn"
            onClick={handleQuickCopy}
            title="Copy share link"
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold flex items-center space-x-1.5 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
