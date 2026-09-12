import { Group, GroupSummary, Expense, Settlement, CurrencyCode } from '../types/index.ts';

const BASE_URL = '/api';

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

export async function createGroup(payload: {
  name: string;
  description?: string;
  defaultCurrency: CurrencyCode;
  members: { name: string; email?: string }[];
}): Promise<Group> {
  const res = await fetch(`${BASE_URL}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to create group');
  return data.data;
}

export async function addMemberToGroup(
  groupIdOrCode: string,
  member: { name: string; email?: string }
): Promise<Group> {
  const res = await fetch(`${BASE_URL}/groups/${encodeURIComponent(groupIdOrCode)}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(member),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to add member');
  return data.data;
}

export async function addExpense(
  groupIdOrCode: string,
  expenseData: any
): Promise<{ group: Group; expense: Expense; summary: GroupSummary }> {
  const res = await fetch(`${BASE_URL}/groups/${encodeURIComponent(groupIdOrCode)}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expenseData),
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
  const res = await fetch(`${BASE_URL}/expenses/${expenseId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...expenseData, groupId: groupIdOrCode }),
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
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to delete expense');
  return data.data;
}

export async function recordSettlement(
  groupIdOrCode: string,
  settlementData: any
): Promise<{ group: Group; settlement: Settlement; summary: GroupSummary }> {
  const res = await fetch(`${BASE_URL}/groups/${encodeURIComponent(groupIdOrCode)}/settlements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settlementData),
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
