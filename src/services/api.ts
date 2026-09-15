import { Group, GroupSummary, Expense, Settlement, CurrencyCode } from '../types/index.ts';

const BASE_URL = '/api';

// Local storage helpers for user and creator name
export function getStoredUserName(groupId: string): string | null {
  return (
    localStorage.getItem(`userName_${groupId}`) ||
    localStorage.getItem(`creatorName_${groupId}`) ||
    localStorage.getItem('user_name')
  );
}

export function setStoredUserName(groupId: string, name: string): void {
  const trimmed = name.trim();
  localStorage.setItem(`userName_${groupId}`, trimmed);
  localStorage.setItem('user_name', trimmed);
}

export function clearStoredUserName(groupId: string): void {
  localStorage.removeItem(`userName_${groupId}`);
  localStorage.removeItem(`creatorName_${groupId}`);
}

export function getStoredCreatorName(groupId: string): string | null {
  return localStorage.getItem(`creatorName_${groupId}`);
}

export function setStoredCreatorName(groupId: string, creatorName: string): void {
  const trimmed = creatorName.trim();
  localStorage.setItem(`creatorName_${groupId}`, trimmed);
  localStorage.setItem(`userName_${groupId}`, trimmed);
  localStorage.setItem('user_name', trimmed);
}

export function getCurrentMemberId(groupId: string): string | null {
  return localStorage.getItem(`current_member_${groupId}`);
}

export function setCurrentMemberId(groupId: string, memberId: string): void {
  localStorage.setItem(`current_member_${groupId}`, memberId);
}

export function clearCurrentMemberId(groupId: string): void {
  localStorage.removeItem(`current_member_${groupId}`);
}

export function getAuthHeaders(groupId: string): Record<string, string> {
  const userName = getStoredUserName(groupId);
  return userName ? { 'x-user-name': encodeURIComponent(userName) } : {};
}

export async function fetchGroups(): Promise<Group[]> {
  const res = await fetch(`${BASE_URL}/groups`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch groups');
  return data.data;
}

export async function fetchGroup(idOrCode: string): Promise<{ group: Group; summary: GroupSummary }> {
  const res = await fetch(`${BASE_URL}/groups/${encodeURIComponent(idOrCode)}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch group');
  return data.data;
}

export async function verifyCreator(
  idOrCode: string,
  currentUserName?: string | null
): Promise<{ isCreator: boolean; createdBy?: string; creatorName?: string; currentUserName?: string }> {
  const userName = currentUserName || getStoredUserName(idOrCode);
  const headers: Record<string, string> = userName
    ? { 'x-user-name': encodeURIComponent(userName) }
    : {};

  const res = await fetch(`${BASE_URL}/groups/${encodeURIComponent(idOrCode)}/verify-creator`, {
    headers,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to verify creator');
  return data.data;
}

export async function createGroup(payload: {
  name: string;
  creatorName?: string;
  createdBy?: string;
  description?: string;
  defaultCurrency: CurrencyCode;
  members: { name: string; email?: string }[];
}): Promise<Group> {
  const creator = (payload.createdBy || payload.creatorName || payload.members[0]?.name || 'Creator').trim();
  const res = await fetch(`${BASE_URL}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      createdBy: creator,
      creatorName: creator,
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to create group');

  const created = data.data as Group;
  const finalCreatorName = created.createdBy || created.creatorName || creator;

  // Store creator's name in browser's localStorage on the device that created the group
  setStoredCreatorName(created.id, finalCreatorName);
  setStoredCreatorName(created.shareCode, finalCreatorName);
  setStoredUserName(created.id, finalCreatorName);
  setStoredUserName(created.shareCode, finalCreatorName);

  if (created.creatorMemberId) {
    setCurrentMemberId(created.id, created.creatorMemberId);
    setCurrentMemberId(created.shareCode, created.creatorMemberId);
  }

  return created;
}

export async function deleteGroup(groupIdOrCode: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/groups/${encodeURIComponent(groupIdOrCode)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(groupIdOrCode),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to delete group');

  // Clean up local creator name and member mapping
  clearStoredUserName(groupIdOrCode);
  clearCurrentMemberId(groupIdOrCode);

  return data;
}

export async function addMemberToGroup(
  groupIdOrCode: string,
  member: { name: string; email?: string }
): Promise<{ group: Group; addedMember?: any }> {
  const res = await fetch(`${BASE_URL}/groups/${encodeURIComponent(groupIdOrCode)}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(member),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to add member');
  return { group: data.data, addedMember: data.addedMember };
}

export async function removeMemberFromGroup(
  groupIdOrCode: string,
  memberId: string
): Promise<{ group: Group; summary: GroupSummary }> {
  const res = await fetch(
    `${BASE_URL}/groups/${encodeURIComponent(groupIdOrCode)}/members/${encodeURIComponent(memberId)}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(groupIdOrCode),
    }
  );
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to remove member');
  return data.data;
}

export async function addExpense(
  groupIdOrCode: string,
  expenseData: any
): Promise<{ group: Group; expense: Expense; summary: GroupSummary }> {
  const userName = getStoredUserName(groupIdOrCode);
  const res = await fetch(`${BASE_URL}/groups/${encodeURIComponent(groupIdOrCode)}/expenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(groupIdOrCode),
    },
    body: JSON.stringify({ ...expenseData, userName }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to add expense');
  return data.data;
}

export async function updateExpense(
  groupIdOrCode: string,
  expenseId: string,
  expenseData: any
): Promise<{ group: Group; expense: Expense; summary: GroupSummary }> {
  const userName = getStoredUserName(groupIdOrCode);
  const res = await fetch(`${BASE_URL}/expenses/${expenseId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(groupIdOrCode),
    },
    body: JSON.stringify({ ...expenseData, groupId: groupIdOrCode, userName }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to update expense');
  return data.data;
}

export async function deleteExpense(
  groupIdOrCode: string,
  expenseId: string
): Promise<{ group: Group; summary: GroupSummary }> {
  const res = await fetch(`${BASE_URL}/groups/${encodeURIComponent(groupIdOrCode)}/expenses/${expenseId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(groupIdOrCode),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to delete expense');
  return data.data;
}

export async function recordSettlement(
  groupIdOrCode: string,
  settlementData: any
): Promise<{ group: Group; settlement: Settlement; summary: GroupSummary }> {
  const userName = getStoredUserName(groupIdOrCode);
  const res = await fetch(`${BASE_URL}/groups/${encodeURIComponent(groupIdOrCode)}/settlements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(groupIdOrCode),
    },
    body: JSON.stringify({ ...settlementData, userName }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to record settlement');
  return data.data;
}

export async function deleteSettlement(
  groupIdOrCode: string,
  settlementId: string
): Promise<{ group: Group; summary: GroupSummary }> {
  const res = await fetch(`${BASE_URL}/groups/${encodeURIComponent(groupIdOrCode)}/settlements/${settlementId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(groupIdOrCode),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to delete settlement');
  return data.data;
}

export async function getSystemStatus(): Promise<{
  status: string;
  isMongo: boolean;
  engine: string;
}> {
  const res = await fetch(`${BASE_URL}/system/status`);
  return res.json();
}
