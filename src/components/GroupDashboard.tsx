import React, { useState } from 'react';
import {
  Plus,
  ArrowRightLeft,
  Share2,
  Download,
  Receipt,
  Sparkles,
  PieChart,
  Users,
  History,
  Scale,
  UserPlus,
  DollarSign,
  Copy,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { Group, GroupSummary, Member, CurrencyCode } from '../types/index.ts';
import { formatMoney } from '../utils/currencies.ts';
import { SimplifiedDebts } from './SimplifiedDebts.tsx';
import { BalanceCard } from './BalanceCard.tsx';
import { ExpenseList } from './ExpenseList.tsx';
import { AnalyticsView } from './AnalyticsView.tsx';
import { AuditLogView } from './AuditLogView.tsx';

interface GroupDashboardProps {
  group: Group;
  summary: GroupSummary;
  onOpenAddExpense: () => void;
  onOpenSettleModal: (fromId?: string, toId?: string, amount?: number) => void;
  onOpenShareModal: () => void;
  onOpenExportModal: () => void;
  onDeleteExpense: (expenseId: string) => Promise<void>;
  onAddMember: (name: string) => Promise<void>;
}

type TabType = 'debts' | 'expenses' | 'balances' | 'analytics' | 'activity';

export const GroupDashboard: React.FC<GroupDashboardProps> = ({
  group,
  summary,
  onOpenAddExpense,
  onOpenSettleModal,
  onOpenShareModal,
  onOpenExportModal,
  onDeleteExpense,
  onAddMember,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('debts');
  const [newMemberName, setNewMemberName] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(group.shareCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMemberName.trim()) {
      await onAddMember(newMemberName.trim());
      setNewMemberName('');
      setShowAddMember(false);
    }
  };

  return (
    <div id="group-dashboard" className="space-y-6">
      {/* Group Header Hero Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Group Identity & Members */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight font-sans">
                {group.name}
              </h1>
              {/* Share Code badge */}
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-mono font-bold transition"
                title="Click to copy group code"
              >
                <span>{group.shareCode}</span>
                {copiedCode ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3 text-stone-400" />
                )}
              </button>
              {/* Currency badge */}
              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200/70">
                {group.defaultCurrency}
              </span>
            </div>

            {group.description && (
              <p className="text-sm text-stone-500 max-w-2xl leading-relaxed">
                {group.description}
              </p>
            )}

            {/* Members Avatars Row */}
            <div className="flex items-center space-x-2 pt-1">
              <div className="flex -space-x-2 overflow-hidden">
                {group.members.slice(0, 7).map((m) => (
                  <div
                    key={m.id}
                    title={m.name}
                    className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-2xs"
                    style={{ backgroundColor: m.avatarColor }}
                  >
                    {m.name.slice(0, 2).toUpperCase()}
                  </div>
                ))}
              </div>
              <span className="text-xs text-stone-500 font-medium pl-1">
                {group.members.length} members
              </span>

              {/* Add member button */}
              <button
                id="toggle-add-member-btn"
                onClick={() => setShowAddMember(!showAddMember)}
                className="inline-flex items-center space-x-1 text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded-lg transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </button>
            </div>

            {/* Inline Add Member Form */}
            {showAddMember && (
              <form onSubmit={handleAddMemberSubmit} className="flex items-center space-x-2 pt-2 animate-in fade-in duration-100">
                <input
                  type="text"
                  placeholder="Friend's name..."
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="px-3 py-1 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500 w-48"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="px-2 py-1 text-xs text-stone-400 hover:text-stone-600"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:self-start lg:self-center">
            <button
              id="add-expense-primary-btn"
              onClick={onOpenAddExpense}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-xs hover:shadow-md transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>

            <button
              id="settle-up-primary-btn"
              onClick={() => onOpenSettleModal()}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs hover:shadow-md transition active:scale-95"
            >
              <DollarSign className="w-4 h-4" />
              <span>Settle Up</span>
            </button>

            <button
              id="export-group-btn"
              onClick={onOpenExportModal}
              className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 transition"
              title="Export CSV / Print"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              id="share-group-banner-btn"
              onClick={onOpenShareModal}
              className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 transition"
              title="Share Group"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Overview Numbers Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-stone-100">
          <div>
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Total Spending
            </span>
            <div className="text-xl font-black text-stone-900 mt-0.5">
              {formatMoney(summary.totalExpenseAmount, group.defaultCurrency)}
            </div>
            <span className="text-[10px] text-stone-400">
              {group.expenses.length} total expenses
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Total Settled
            </span>
            <div className="text-xl font-black text-emerald-600 mt-0.5">
              {formatMoney(summary.totalSettlementAmount, group.defaultCurrency)}
            </div>
            <span className="text-[10px] text-stone-400">
              {group.settlements.length} settlement payments
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Active Debt
            </span>
            <div className={`text-xl font-black mt-0.5 ${summary.activeDebtAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatMoney(summary.activeDebtAmount, group.defaultCurrency)}
            </div>
            <span className="text-[10px] text-stone-400">
              {summary.simplifiedTransactions.length} simplified transfer{summary.simplifiedTransactions.length !== 1 ? 's' : ''} left
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              Group Status
            </span>
            <div className="flex items-center space-x-1.5 mt-1">
              {summary.activeDebtAmount <= 0.01 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-emerald-700">All Settled</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-xs font-bold text-amber-700">Settlements Pending</span>
                </>
              )}
            </div>
            <span className="text-[10px] text-stone-400">
              {group.members.length} members
            </span>
          </div>
        </div>
      </div>

      {/* Navigation View Tabs */}
      <div className="flex items-center border-b border-stone-200 space-x-1 sm:space-x-2 overflow-x-auto pb-px">
        <button
          id="tab-debts"
          onClick={() => setActiveTab('debts')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'debts'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span>Debt Simplification</span>
          {summary.simplifiedTransactions.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-teal-100 text-teal-800">
              {summary.simplifiedTransactions.length}
            </span>
          )}
        </button>

        <button
          id="tab-expenses"
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'expenses'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Expenses ({group.expenses.length})</span>
        </button>

        <button
          id="tab-balances"
          onClick={() => setActiveTab('balances')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'balances'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Member Ledgers</span>
        </button>

        <button
          id="tab-analytics"
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Analytics</span>
        </button>

        <button
          id="tab-activity"
          onClick={() => setActiveTab('activity')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'activity'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Log</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'debts' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <SimplifiedDebts
              transactions={summary.simplifiedTransactions}
              baseCurrency={group.defaultCurrency}
              totalMembers={group.members.length}
              onSettle={(fromId, toId, amount) => onOpenSettleModal(fromId, toId, amount)}
            />

            {/* Also show quick member balances grid below simplified debts for complete clarity */}
            <div className="pt-4 border-t border-stone-200">
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
                Member Net Balances
              </h3>
              <BalanceCard
                balances={summary.memberBalances}
                baseCurrency={group.defaultCurrency}
                onSettleMember={(id) => onOpenSettleModal(id)}
              />
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="animate-in fade-in duration-150">
            <ExpenseList
              expenses={group.expenses}
              members={group.members}
              baseCurrency={group.defaultCurrency}
              onDeleteExpense={onDeleteExpense}
              onOpenAddExpense={onOpenAddExpense}
            />
          </div>
        )}

        {activeTab === 'balances' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-xs text-stone-600">
              <strong className="text-stone-800">How balances work:</strong> Positive values (green) mean the person paid more than their fair share and is owed money. Negative values (red) mean they consumed more than they paid and need to send money to settle up.
            </div>
            <BalanceCard
              balances={summary.memberBalances}
              baseCurrency={group.defaultCurrency}
              onSettleMember={(id) => onOpenSettleModal(id)}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="animate-in fade-in duration-150">
            <AnalyticsView
              summary={summary}
              expenses={group.expenses}
              members={group.members}
              baseCurrency={group.defaultCurrency}
            />
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="animate-in fade-in duration-150">
            <AuditLogView logs={group.auditLogs} />
          </div>
        )}
      </div>
    </div>
  );
};
