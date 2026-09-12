import React from 'react';
import { History, PlusCircle, Trash2, Edit3, DollarSign, UserPlus, FolderPlus } from 'lucide-react';
import { AuditLog } from '../types/index.ts';

interface AuditLogViewProps {
  logs: AuditLog[];
}

const getLogIcon = (action: string) => {
  switch (action) {
    case 'EXPENSE_ADDED':
      return <PlusCircle className="w-4 h-4 text-teal-600" />;
    case 'EXPENSE_DELETED':
      return <Trash2 className="w-4 h-4 text-rose-500" />;
    case 'EXPENSE_UPDATED':
      return <Edit3 className="w-4 h-4 text-amber-500" />;
    case 'SETTLEMENT_RECORDED':
      return <DollarSign className="w-4 h-4 text-emerald-600" />;
    case 'MEMBER_ADDED':
      return <UserPlus className="w-4 h-4 text-indigo-500" />;
    case 'GROUP_CREATED':
      return <FolderPlus className="w-4 h-4 text-blue-500" />;
    default:
      return <History className="w-4 h-4 text-stone-500" />;
  }
};

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center text-xs text-stone-400">
        No activity history recorded yet.
      </div>
    );
  }

  return (
    <div id="audit-log-container" className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs">
      <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-stone-100">
        <History className="w-5 h-5 text-stone-600" />
        <h3 className="text-sm font-bold text-stone-900">Activity &amp; Audit Trail</h3>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
        {logs.map((log) => {
          const dateStr = new Date(log.timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div key={log.id} className="relative group">
              {/* Dot Icon */}
              <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border border-stone-200 shadow-xs flex items-center justify-center">
                {getLogIcon(log.action)}
              </div>

              {/* Log details */}
              <div className="bg-stone-50/60 group-hover:bg-stone-50 p-3 rounded-xl border border-stone-200/70 transition">
                <p className="text-xs font-semibold text-stone-800">
                  {log.description}
                </p>
                <div className="flex items-center space-x-2 text-[10px] text-stone-400 mt-1">
                  <span>{dateStr}</span>
                  {log.actorName && (
                    <>
                      <span>•</span>
                      <span>by {log.actorName}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
