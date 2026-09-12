import React, { useState } from 'react';
import { X, Copy, Check, Share2, Link as LinkIcon, Users } from 'lucide-react';
import { Group } from '../types/index.ts';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, group }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareLink = `${currentUrl}/?group=${group.shareCode}`;

  const copyToClipboard = (text: string, type: 'link' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div
      id="share-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="share-group-modal"
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom duration-200"
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-black text-slate-900">Share Group</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Friends don't need to sign up or create passwords. Anyone with this link or code can immediately view and add expenses.
          </p>

          {/* Share Code */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Group Code
            </label>
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="font-mono text-xl font-black text-emerald-700">
                {group.shareCode}
              </span>
              <button
                id="copy-code-btn"
                onClick={() => copyToClipboard(group.shareCode, 'code')}
                className="min-h-[40px] px-3.5 py-1.5 bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl hover:bg-slate-50 transition shadow-2xs flex items-center space-x-1.5"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Share Direct Link */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Direct Link
            </label>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="text-xs font-mono text-slate-600 truncate">
                {shareLink}
              </div>
              <button
                id="copy-link-btn"
                onClick={() => copyToClipboard(shareLink, 'link')}
                className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition shadow-xs"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 text-white" />
                    <span>Copy Direct Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
