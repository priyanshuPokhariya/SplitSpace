import React, { useState, useEffect } from 'react';
import {
  fetchGroups,
  fetchGroup,
  createGroup,
  deleteGroup,
  addMemberToGroup,
  removeMemberFromGroup,
  addExpense,
  updateExpense,
  deleteExpense,
  recordSettlement,
  getSystemStatus,
  verifyCreator,
  getCurrentMemberId,
  setCurrentMemberId,
  getStoredUserName,
  setStoredUserName,
} from './services/api.ts';
import { Group, GroupSummary, Expense, Member } from './types/index.ts';
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
import { IdentifyMemberModal } from './components/IdentifyMemberModal.tsx';
import { ArchitectureBlueprintModal } from './components/ArchitectureBlueprintModal.tsx';
import { RefreshCw, AlertCircle, Split, ShieldAlert, X } from 'lucide-react';

export default function App() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [summary, setSummary] = useState<GroupSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState<{ isMongo: boolean; engine: string } | null>(null);

  // Creator & Member Identity State
  const [isCreator, setIsCreator] = useState(false);
  const [currentMemberId, setCurrentMemberIdState] = useState<string | null>(null);
  const [isIdentifyOpen, setIsIdentifyOpen] = useState(false);
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);

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

  // Helper to verify permissions and member identity for a loaded group
  const syncGroupPermissions = async (group: Group) => {
    // Check stored member identity and name for this group
    const storedMemberId =
      getCurrentMemberId(group.id) || getCurrentMemberId(group.shareCode);
    const storedName =
      getStoredUserName(group.id) || getStoredUserName(group.shareCode);

    let validMember = group.members.find((m) => m.id === storedMemberId);
    if (!validMember && storedName) {
      validMember = group.members.find(
        (m) => m.name.trim().toLowerCase() === storedName.trim().toLowerCase()
      );
    }

    const creatorName = (group.createdBy || group.creatorName || '').trim().toLowerCase();

    if (validMember) {
      setCurrentMemberIdState(validMember.id);
      setCurrentMemberId(group.id, validMember.id);
      setCurrentMemberId(group.shareCode, validMember.id);
      setStoredUserName(group.id, validMember.name);
      setStoredUserName(group.shareCode, validMember.name);

      const isMaker = Boolean(creatorName && validMember.name.trim().toLowerCase() === creatorName);
      setIsCreator(isMaker);
    } else if (storedName) {
      const isMaker = Boolean(creatorName && storedName.trim().toLowerCase() === creatorName);
      setIsCreator(isMaker);
      const matched = group.members.find(
        (m) => m.name.trim().toLowerCase() === storedName.trim().toLowerCase()
      );
      if (matched) {
        setCurrentMemberIdState(matched.id);
        setCurrentMemberId(group.id, matched.id);
      } else {
        setIsIdentifyOpen(true);
      }
    } else {
      setIsCreator(false);
      setCurrentMemberIdState(null);
      // If no valid member chosen yet on this device, prompt "Who are you?"
      setIsIdentifyOpen(true);
    }

    // Also confirm with server middleware verification
    try {
      const activeName = validMember?.name || storedName;
      if (activeName) {
        const check = await verifyCreator(group.id, activeName);
        setIsCreator(check.isCreator);
      }
    } catch {
      // Fallback relies on local name match
    }
  };

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
      await syncGroupPermissions(groupData.group);
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
      await syncGroupPermissions(data.group);
    } catch (err: any) {
      setError(err.message || 'Failed to switch group');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddExpense = () => {
    if (!isCreator) {
      setPermissionNotice(
        `View-only access: Only the group creator (${currentGroup?.creatorName || 'Maker'}) can add expenses.`
      );
      return;
    }
    setIsAddExpenseOpen(true);
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
    await syncGroupPermissions(data.group);
    setActiveTab('dashboard');
  };

  const handleAddMember = async (name: string) => {
    if (!currentGroup) return;
    const res = await addMemberToGroup(currentGroup.id, { name });
    const data = await fetchGroup(res.group.id);
    setCurrentGroup(data.group);
    setSummary(data.summary);
    if (res.addedMember?.id && !currentMemberId) {
      setStoredUserName(data.group.id, res.addedMember.name);
      setStoredUserName(data.group.shareCode, res.addedMember.name);
      setCurrentMemberId(data.group.id, res.addedMember.id);
      setCurrentMemberId(data.group.shareCode, res.addedMember.id);
      setCurrentMemberIdState(res.addedMember.id);
      const creatorName = (data.group.createdBy || data.group.creatorName || '').trim().toLowerCase();
      setIsCreator(Boolean(creatorName && res.addedMember.name.trim().toLowerCase() === creatorName));
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!currentGroup) return;
    const res = await removeMemberFromGroup(currentGroup.id, memberId);
    setCurrentGroup(res.group);
    setSummary(res.summary);
    if (currentMemberId === memberId) {
      setCurrentMemberIdState(null);
      setIsIdentifyOpen(true);
    }
  };

  const handleDeleteGroup = async () => {
    if (!currentGroup) return;
    await deleteGroup(currentGroup.id);
    const remaining = await fetchGroups();
    setGroups(remaining);
    if (remaining.length > 0) {
      await handleSelectGroup(remaining[0].id);
    } else {
      setCurrentGroup(null);
      setSummary(null);
    }
  };

  const handleSelectMemberIdentity = (member: Member) => {
    if (!currentGroup) return;
    setStoredUserName(currentGroup.id, member.name);
    setStoredUserName(currentGroup.shareCode, member.name);
    setCurrentMemberId(currentGroup.id, member.id);
    setCurrentMemberId(currentGroup.shareCode, member.id);
    setCurrentMemberIdState(member.id);
    setIsIdentifyOpen(false);

    // Sync creator permissions based strictly on selected name
    const creatorName = (currentGroup.createdBy || currentGroup.creatorName || '').trim().toLowerCase();
    const isMaker = Boolean(creatorName && member.name.trim().toLowerCase() === creatorName);
    setIsCreator(isMaker);
  };

  const openSettleWithPrefill = (fromId?: string, toId?: string, amount?: number) => {
    setSettlePrefill({ fromId, toId, amount });
    setIsSettleOpen(true);
  };

  const handleSettleMember = (memberId: string) => {
    const tx = summary?.simplifiedTransactions.find((t) => t.fromMemberId === memberId);
    if (tx) {
      openSettleWithPrefill(tx.fromMemberId, tx.toMemberId, tx.amount);
    } else {
      openSettleWithPrefill(memberId, undefined, undefined);
    }
  };

  const activeCurrentMember = currentGroup?.members.find((m) => m.id === currentMemberId) || null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <Header
        currentGroup={currentGroup}
        groups={groups}
        currentMember={activeCurrentMember}
        isCreator={isCreator}
        onSelectGroup={handleSelectGroup}
        onOpenNewGroup={() => setIsCreateGroupOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenIdentifyMember={() => setIsIdentifyOpen(true)}
      />

      {/* Permission Notice Banner Toast */}
      {permissionNotice && (
        <div
          id="permission-notice-toast"
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 animate-in fade-in slide-in-from-top-4 duration-200"
        >
          <div className="bg-slate-900 text-white rounded-2xl p-3.5 shadow-xl border border-slate-700 flex items-start justify-between gap-2.5">
            <div className="flex items-start space-x-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold leading-snug">{permissionNotice}</p>
            </div>
            <button
              onClick={() => setPermissionNotice(null)}
              className="text-slate-400 hover:text-white shrink-0 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
                onOpenAddExpense={handleOpenAddExpense}
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
                  onOpenAddExpense={handleOpenAddExpense}
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
                isCreator={isCreator}
                currentMemberId={currentMemberId}
                onSelectGroup={handleSelectGroup}
                onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
                onAddMember={handleAddMember}
                onRemoveMember={handleRemoveMember}
                onDeleteGroup={handleDeleteGroup}
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
          onOpenAddExpense={handleOpenAddExpense}
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
            isCreator={isCreator}
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

          <IdentifyMemberModal
            isOpen={isIdentifyOpen}
            group={currentGroup}
            currentMemberId={currentMemberId}
            canDismiss={!!currentMemberId}
            onClose={() => setIsIdentifyOpen(false)}
            onSelectMember={handleSelectMemberIdentity}
            onAddNewMember={handleAddMember}
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
