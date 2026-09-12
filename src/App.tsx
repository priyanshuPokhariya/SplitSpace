import React, { useState, useEffect } from 'react';
import {
  fetchGroups,
  fetchGroup,
  createGroup,
  addMemberToGroup,
  addExpense,
  updateExpense,
  deleteExpense,
  recordSettlement,
  getSystemStatus,
} from './services/api.ts';
import { Group, GroupSummary, Expense } from './types/index.ts';
import { Header } from './components/Header.tsx';
import { BottomNav, ActiveTab } from './components/BottomNav.tsx';
import { MobileDashboard } from './components/MobileDashboard.tsx';
import { ExpenseList } from './components/ExpenseList.tsx';
import { BalanceCard } from './components/BalanceCard.tsx';
import { GroupSettingsView } from './components/GroupSettingsView.tsx';
import { AddExpenseModal } from './components/AddExpenseModal.tsx';
import { EditExpenseModal } from './components/EditExpenseModal.tsx';
import { SettleModal } from './components/SettleModal.tsx';
import { ShareModal } from './components/ShareModal.tsx';
import { CreateGroupModal } from './components/CreateGroupModal.tsx';
import { ArchitectureBlueprintModal } from './components/ArchitectureBlueprintModal.tsx';
import { RefreshCw, AlertCircle, Split } from 'lucide-react';

export default function App() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [summary, setSummary] = useState<GroupSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState<{ isMongo: boolean; engine: string } | null>(null);

  // Active view in sticky bottom navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);
  const [selectedExpenseForEdit, setSelectedExpenseForEdit] = useState<Expense | null>(null);
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [settlePrefill, setSettlePrefill] = useState<{
    fromId?: string;
    toId?: string;
    amount?: number;
  }>({});
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isBlueprintOpen, setIsBlueprintOpen] = useState(false);

  // Initial Data Load
  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      try {
        const sys = await getSystemStatus();
        setSystemStatus({ isMongo: sys.isMongo, engine: sys.engine });
      } catch (e) {
        // Silently default to local engine
      }

      const allGroups = await fetchGroups();
      setGroups(allGroups);

      const params = new URLSearchParams(window.location.search);
      const groupParam = params.get('group');
      const targetIdOrCode = groupParam || (allGroups[0]?.id ?? 'grp-goa-2026');

      const groupData = await fetchGroup(targetIdOrCode);
      setCurrentGroup(groupData.group);
      setSummary(groupData.summary);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSelectGroup = async (groupId: string) => {
    setLoading(true);
    try {
      const data = await fetchGroup(groupId);
      setCurrentGroup(data.group);
      setSummary(data.summary);
      const newUrl = `${window.location.pathname}?group=${data.group.shareCode}`;
      window.history.replaceState({}, '', newUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to switch group');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExpense = async (expenseData: any) => {
    if (!currentGroup) return;
    const res = await addExpense(currentGroup.id, expenseData);
    setCurrentGroup(res.group);
    setSummary(res.summary);
    const all = await fetchGroups();
    setGroups(all);
  };

  const handleSelectExpense = (expense: Expense) => {
    setSelectedExpenseForEdit(expense);
    setIsEditExpenseOpen(true);
  };

  const handleUpdateExpense = async (expenseId: string, updatedData: any) => {
    if (!currentGroup) return;
    const res = await updateExpense(currentGroup.id, expenseId, updatedData);
    setCurrentGroup(res.group);
    setSummary(res.summary);
    const all = await fetchGroups();
    setGroups(all);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!currentGroup) return;
    const res = await deleteExpense(currentGroup.id, expenseId);
    setCurrentGroup(res.group);
    setSummary(res.summary);
    const all = await fetchGroups();
    setGroups(all);
    if (selectedExpenseForEdit?.id === expenseId) {
      setIsEditExpenseOpen(false);
      setSelectedExpenseForEdit(null);
    }
  };

  const handleRecordSettlement = async (settlementData: any) => {
    if (!currentGroup) return;
    const res = await recordSettlement(currentGroup.id, settlementData);
    setCurrentGroup(res.group);
    setSummary(res.summary);
  };

  const handleCreateGroup = async (payload: any) => {
    const newGroup = await createGroup(payload);
    const data = await fetchGroup(newGroup.id);
    setGroups((prev) => [newGroup, ...prev]);
    setCurrentGroup(data.group);
    setSummary(data.summary);
    const newUrl = `${window.location.pathname}?group=${newGroup.shareCode}`;
    window.history.replaceState({}, '', newUrl);
    setActiveTab('dashboard');
  };

  const handleAddMember = async (name: string) => {
    if (!currentGroup) return;
    const updated = await addMemberToGroup(currentGroup.id, { name });
    const data = await fetchGroup(updated.id);
    setCurrentGroup(data.group);
    setSummary(data.summary);
  };

  const openSettleWithPrefill = (fromId?: string, toId?: string, amount?: number) => {
    setSettlePrefill({ fromId, toId, amount });
    setIsSettleOpen(true);
  };

  const handleSettleMember = (memberId: string) => {
    // Look up who this member owes in simplified transactions
    const tx = summary?.simplifiedTransactions.find((t) => t.fromMemberId === memberId);
    if (tx) {
      openSettleWithPrefill(tx.fromMemberId, tx.toMemberId, tx.amount);
    } else {
      openSettleWithPrefill(memberId, undefined, undefined);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <Header
        currentGroup={currentGroup}
        groups={groups}
        onSelectGroup={handleSelectGroup}
        onOpenNewGroup={() => setIsCreateGroupOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
      />

      {/* Main Content Area (Max width phone/tablet optimized with bottom clearance for sticky nav) */}
      <main className="flex-1 w-full max-w-md sm:max-w-xl lg:max-w-2xl mx-auto px-4 pt-4 pb-28">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-80 space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
            <span className="text-xs font-semibold text-slate-500">
              Loading expenses...
            </span>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center my-12 space-y-3 shadow-2xs">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="text-sm font-bold text-rose-900">Unable to load group</h3>
            <p className="text-xs text-rose-700">{error}</p>
            <button
              onClick={loadInitialData}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition"
            >
              Try Again
            </button>
          </div>
        ) : currentGroup && summary ? (
          <div>
            {/* View 1: Dashboard */}
            {activeTab === 'dashboard' && (
              <MobileDashboard
                group={currentGroup}
                summary={summary}
                onOpenAddExpense={() => setIsAddExpenseOpen(true)}
                onOpenSettle={openSettleWithPrefill}
                onViewAllExpenses={() => setActiveTab('expenses')}
                onViewAllBalances={() => setActiveTab('balances')}
                onSelectExpense={handleSelectExpense}
              />
            )}

            {/* View 2: Expenses */}
            {activeTab === 'expenses' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between px-1">
                  <h1 className="text-lg font-black text-slate-900">Expenses</h1>
                  <span className="text-xs font-bold text-slate-400">
                    {currentGroup.expenses.length} total
                  </span>
                </div>
                <ExpenseList
                  expenses={currentGroup.expenses}
                  members={currentGroup.members}
                  baseCurrency={currentGroup.defaultCurrency}
                  onDeleteExpense={handleDeleteExpense}
                  onOpenAddExpense={() => setIsAddExpenseOpen(true)}
                  onSelectExpense={handleSelectExpense}
                />
              </div>
            )}

            {/* View 3: Balances */}
            {activeTab === 'balances' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between px-1">
                  <h1 className="text-lg font-black text-slate-900">Member Balances</h1>
                  <span className="text-xs font-bold text-slate-400">
                    Net positions
                  </span>
                </div>
                <BalanceCard
                  balances={summary.memberBalances}
                  baseCurrency={currentGroup.defaultCurrency}
                  onSettleMember={handleSettleMember}
                />
              </div>
            )}

            {/* View 4: Settings / Group Info */}
            {activeTab === 'settings' && (
              <GroupSettingsView
                group={currentGroup}
                groups={groups}
                onSelectGroup={handleSelectGroup}
                onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
                onAddMember={handleAddMember}
                onOpenBlueprint={() => setIsBlueprintOpen(true)}
                isMongo={!!systemStatus?.isMongo}
              />
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 my-12 space-y-4 shadow-2xs">
            <Split className="w-10 h-10 text-emerald-600 mx-auto -rotate-45" />
            <h3 className="text-lg font-bold text-slate-900">Welcome to KittySplit</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Create a group to start splitting bills and settling debts easily on mobile.
            </p>
            <button
              onClick={() => setIsCreateGroupOpen(true)}
              className="min-h-[44px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              Create Your First Group
            </button>
          </div>
        )}
      </main>

      {/* Sticky Bottom Navigation Bar */}
      {currentGroup && (
        <BottomNav
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onOpenAddExpense={() => setIsAddExpenseOpen(true)}
          expenseCount={currentGroup.expenses.length}
        />
      )}

      {/* Modals */}
      {currentGroup && (
        <>
          <AddExpenseModal
            isOpen={isAddExpenseOpen}
            onClose={() => setIsAddExpenseOpen(false)}
            group={currentGroup}
            onSaveExpense={handleSaveExpense}
          />

          <EditExpenseModal
            isOpen={isEditExpenseOpen}
            onClose={() => {
              setIsEditExpenseOpen(false);
              setSelectedExpenseForEdit(null);
            }}
            group={currentGroup}
            expense={selectedExpenseForEdit}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
          />

          <SettleModal
            isOpen={isSettleOpen}
            onClose={() => setIsSettleOpen(false)}
            group={currentGroup}
            initialFromMemberId={settlePrefill.fromId}
            initialToMemberId={settlePrefill.toId}
            initialAmount={settlePrefill.amount}
            onRecordSettlement={handleRecordSettlement}
          />

          <ShareModal
            isOpen={isShareOpen}
            onClose={() => setIsShareOpen(false)}
            group={currentGroup}
          />
        </>
      )}

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreateGroup={handleCreateGroup}
      />

      <ArchitectureBlueprintModal
        isOpen={isBlueprintOpen}
        onClose={() => setIsBlueprintOpen(false)}
      />
    </div>
  );
}
