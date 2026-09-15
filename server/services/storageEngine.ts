import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { GroupModel, ExpenseModel, SettlementModel } from '../models/index.ts';
import { Group, Member, Expense, Settlement, AuditLog } from '../../src/types/index.ts';
import { calculateGroupBalancesAndDebts } from '../../src/utils/debtSimplifier.ts';
import { convertCurrency } from '../../src/utils/currencies.ts';

// In-Memory & Local JSON Store
const groupsStore = new Map<string, Group>();
const LOCAL_DATA_FILE = path.join(process.cwd(), 'server', 'data', 'localStore.json');

function saveToDisk() {
  try {
    const dir = path.dirname(LOCAL_DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const uniqueGroups = Array.from(new Set(groupsStore.values()));
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(uniqueGroups, null, 2), 'utf-8');
  } catch (err) {
    // Non-fatal disk save error
  }
}

function loadFromDisk(): boolean {
  try {
    if (fs.existsSync(LOCAL_DATA_FILE)) {
      const raw = fs.readFileSync(LOCAL_DATA_FILE, 'utf-8');
      const parsed: Group[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        for (const g of parsed) {
          groupsStore.set(g.id, g);
          groupsStore.set(g.shareCode.toUpperCase(), g);
          groupsStore.set(g.slug.toLowerCase(), g);
        }
        return true;
      }
    }
  } catch (err) {
    // Ignore error and fall back to seed
  }
  return false;
}

// Seed sample group for immediate out-of-the-box preview
const sampleGroupId = 'grp-goa-2026';
const sampleShareCode = 'GOA-7824';

const initialMembers: Member[] = [
  { id: 'm1', name: 'Aarav Sharma', avatarColor: '#3B82F6', isCreator: true, createdAt: new Date().toISOString() },
  { id: 'm2', name: 'Riya Patel', avatarColor: '#EC4899', createdAt: new Date().toISOString() },
  { id: 'm3', name: 'Kabir Verma', avatarColor: '#10B981', createdAt: new Date().toISOString() },
  { id: 'm4', name: 'Ananya Roy', avatarColor: '#F59E0B', createdAt: new Date().toISOString() },
];

const initialExpenses: Expense[] = [
  {
    id: 'exp-1',
    groupId: sampleGroupId,
    title: 'Beachside Villa Airbnb (3 Nights)',
    description: 'Private 3-bedroom villa near Anjuna beach',
    amount: 360,
    currency: 'USD',
    exchangeRateToBase: 1.0,
    baseAmount: 360,
    category: 'Accommodation',
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
    paidBy: [{ memberId: 'm1', memberName: 'Aarav Sharma', amount: 360 }],
    splitType: 'EQUAL',
    splits: [
      { memberId: 'm1', memberName: 'Aarav Sharma', shareAmount: 90 },
      { memberId: 'm2', memberName: 'Riya Patel', shareAmount: 90 },
      { memberId: 'm3', memberName: 'Kabir Verma', shareAmount: 90 },
      { memberId: 'm4', memberName: 'Ananya Roy', shareAmount: 90 },
    ],
    notes: 'Advance paid through Airbnb',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'exp-2',
    groupId: sampleGroupId,
    title: 'Seafood Dinner at Thalassa',
    description: 'Greek dinner + cocktails at sunset',
    amount: 140,
    currency: 'USD',
    exchangeRateToBase: 1.0,
    baseAmount: 140,
    category: 'Food & Dining',
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    paidBy: [{ memberId: 'm2', memberName: 'Riya Patel', amount: 140 }],
    splitType: 'SHARES',
    splits: [
      { memberId: 'm1', memberName: 'Aarav Sharma', shareAmount: 28, shares: 1 },
      { memberId: 'm2', memberName: 'Riya Patel', shareAmount: 28, shares: 1 },
      { memberId: 'm3', memberName: 'Kabir Verma', shareAmount: 56, shares: 2 },
      { memberId: 'm4', memberName: 'Ananya Roy', shareAmount: 28, shares: 1 },
    ],
    notes: 'Split with weighted shares for extra cocktails',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'exp-3',
    groupId: sampleGroupId,
    title: 'Scooters & Fuel Rentals (4 Bikes)',
    description: 'Honda Activa 4-day rentals plus full tanks',
    amount: 80,
    currency: 'USD',
    exchangeRateToBase: 1.0,
    baseAmount: 80,
    category: 'Transportation',
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
    paidBy: [{ memberId: 'm3', memberName: 'Kabir Verma', amount: 80 }],
    splitType: 'EQUAL',
    splits: [
      { memberId: 'm1', memberName: 'Aarav Sharma', shareAmount: 20 },
      { memberId: 'm2', memberName: 'Riya Patel', shareAmount: 20 },
      { memberId: 'm3', memberName: 'Kabir Verma', shareAmount: 20 },
      { memberId: 'm4', memberName: 'Ananya Roy', shareAmount: 20 },
    ],
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'exp-4',
    groupId: sampleGroupId,
    title: 'Scuba Diving & Water Sports',
    description: 'Grand Island package for Aarav & Kabir',
    amount: 120,
    currency: 'USD',
    exchangeRateToBase: 1.0,
    baseAmount: 120,
    category: 'Activities',
    date: new Date().toISOString(),
    paidBy: [{ memberId: 'm4', memberName: 'Ananya Roy', amount: 120 }],
    splitType: 'EXACT',
    splits: [
      { memberId: 'm1', memberName: 'Aarav Sharma', shareAmount: 60, exactAmount: 60 },
      { memberId: 'm3', memberName: 'Kabir Verma', shareAmount: 60, exactAmount: 60 },
    ],
    notes: 'Only Aarav and Kabir opted for the deep scuba dive',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const initialSettlements: Settlement[] = [
  {
    id: 'stl-1',
    groupId: sampleGroupId,
    fromMemberId: 'm2',
    fromMemberName: 'Riya Patel',
    toMemberId: 'm1',
    toMemberName: 'Aarav Sharma',
    amount: 50,
    currency: 'USD',
    date: new Date(Date.now() - 86400000).toISOString(),
    notes: 'Partial settlement via UPI for the villa',
    paymentMethod: 'UPI',
    completed: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const initialAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    groupId: sampleGroupId,
    action: 'GROUP_CREATED',
    description: 'Group "Trip to Goa" was created with base currency USD',
    timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
    actorName: 'Aarav Sharma',
  },
  {
    id: 'log-2',
    groupId: sampleGroupId,
    action: 'EXPENSE_ADDED',
    description: 'Aarav Sharma added "Beachside Villa Airbnb" ($360.00)',
    timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
    actorName: 'Aarav Sharma',
  },
  {
    id: 'log-3',
    groupId: sampleGroupId,
    action: 'EXPENSE_ADDED',
    description: 'Riya Patel added "Seafood Dinner at Thalassa" ($140.00)',
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
    actorName: 'Riya Patel',
  },
  {
    id: 'log-4',
    groupId: sampleGroupId,
    action: 'SETTLEMENT_RECORDED',
    description: 'Riya Patel settled $50.00 with Aarav Sharma via UPI',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    actorName: 'Riya Patel',
  },
];

const sampleGroup: Group = {
  id: sampleGroupId,
  shareCode: sampleShareCode,
  slug: 'trip-to-goa',
  name: 'Trip to Goa 🌴',
  description: '4 friends traveling across North & South Goa for a weekend getaway.',
  defaultCurrency: 'USD',
  createdBy: 'Aarav Sharma',
  creatorName: 'Aarav Sharma',
  creatorMemberId: 'm1',
  members: initialMembers,
  expenses: initialExpenses,
  settlements: initialSettlements,
  auditLogs: initialAuditLogs,
  createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  updatedAt: new Date().toISOString(),
};

// Initialize disk or memory seed
const hasLoadedFromDisk = loadFromDisk();
if (!hasLoadedFromDisk) {
  groupsStore.set(sampleGroupId, sampleGroup);
  groupsStore.set(sampleShareCode, sampleGroup);
  saveToDisk();
}

let isMongoConnected = false;

export async function initDatabase(): Promise<{ isMongo: boolean; message: string }> {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<username>') || uri.includes('<password>') || uri.trim() === '') {
    console.log('[KittySplit Database] Operating in fast resilient local storage mode.');
    return {
      isMongo: false,
      message: 'Operating in resilient local storage mode.',
    };
  }

  // Prevent unhandled errors on the mongoose connection
  mongoose.connection.removeAllListeners('error');
  mongoose.connection.on('error', () => {
    isMongoConnected = false;
  });

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 1500,
      connectTimeoutMS: 1500,
    });
    isMongoConnected = true;
    console.log('[KittySplit Database] Connected to MongoDB Atlas successfully.');
    return { isMongo: true, message: 'Connected to MongoDB Atlas' };
  } catch (err: any) {
    isMongoConnected = false;
    await mongoose.disconnect().catch(() => {});
    console.log('[KittySplit Database] MongoDB Atlas connection unreachable or IP restricted. Seamlessly operating in local storage mode.');
    return { isMongo: false, message: 'Operating in resilient local storage mode' };
  }
}

export const StorageEngine = {
  isMongo(): boolean {
    return isMongoConnected;
  },

  async getAllGroups(): Promise<Group[]> {
    if (isMongoConnected) {
      try {
        const groups = await (GroupModel as any).find().lean();
        const results: Group[] = [];
        for (const g of groups) {
          const expenses = await (ExpenseModel as any).find({ groupId: g.id }).lean();
          const settlements = await (SettlementModel as any).find({ groupId: g.id }).lean();
          results.push({
            ...g,
            expenses: expenses as any,
            settlements: settlements as any,
          } as Group);
        }
        return results;
      } catch (err) {
        // Fall back to local store
        isMongoConnected = false;
      }
    }
    const unique = new Map<string, Group>();
    for (const g of groupsStore.values()) {
      unique.set(g.id, g);
    }
    return Array.from(unique.values());
  },

  async getGroupByIdOrCode(idOrCode: string): Promise<Group | null> {
    const key = idOrCode.trim();
    if (isMongoConnected) {
      try {
        const group = await (GroupModel as any).findOne({
          $or: [{ id: key }, { shareCode: key.toUpperCase() }, { slug: key.toLowerCase() }],
        }).lean();
        if (group) {
          const expenses = await (ExpenseModel as any).find({ groupId: group.id }).sort({ date: -1 }).lean();
          const settlements = await (SettlementModel as any).find({ groupId: group.id }).sort({ date: -1 }).lean();
          return {
            ...group,
            expenses: expenses as any,
            settlements: settlements as any,
          } as Group;
        }
      } catch (err) {
        isMongoConnected = false;
      }
    }

    // Check memory store
    const direct = groupsStore.get(key) || groupsStore.get(key.toUpperCase()) || groupsStore.get(key.toLowerCase());
    if (direct) return direct;

    for (const g of groupsStore.values()) {
      if (g.id === key || g.shareCode.toUpperCase() === key.toUpperCase() || g.slug === key.toLowerCase()) {
        return g;
      }
    }
    return null;
  },

  async createGroup(data: Partial<Group> & { creatorName?: string }): Promise<Group> {
    const id = data.id || `grp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const prefix = (data.name || 'EXP')
      .replace(/[^a-zA-Z]/g, '')
      .substring(0, 3)
      .toUpperCase() || 'GRP';
    const shareCode = data.shareCode || `${prefix}-${randomCode}`;
    const slug = (data.name || 'group')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const members: Member[] = (data.members || []).map((m, idx) => ({
      ...m,
      id: m.id || `m-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
      avatarColor: m.avatarColor || ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6'][idx % 5],
      createdAt: m.createdAt || new Date().toISOString(),
    }));

    const creatorName = (data.createdBy || data.creatorName || members[0]?.name || 'Creator').trim();
    let creatorMember = members.find((m) => m.name.toLowerCase() === creatorName.toLowerCase());
    if (!creatorMember && members.length > 0) {
      creatorMember = members[0];
    }
    if (creatorMember) {
      creatorMember.isCreator = true;
    }

    const creatorMemberId = creatorMember?.id || `m-${Date.now()}-creator`;

    const newGroup: Group = {
      id,
      shareCode,
      slug,
      name: data.name || 'Untitled Group',
      description: data.description || '',
      defaultCurrency: data.defaultCurrency || 'USD',
      createdBy: creatorName,
      creatorName,
      creatorMemberId,
      members,
      expenses: [],
      settlements: [],
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          groupId: id,
          action: 'GROUP_CREATED',
          description: `Group "${data.name}" created by ${creatorName} with currency ${data.defaultCurrency || 'USD'}`,
          timestamp: new Date().toISOString(),
          actorName: creatorName,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isMongoConnected) {
      try {
        await GroupModel.create(newGroup);
      } catch (err) {
        isMongoConnected = false;
      }
    }

    groupsStore.set(id, newGroup);
    groupsStore.set(shareCode, newGroup);
    saveToDisk();
    return newGroup;
  },

  async addMember(groupId: string, member: Member): Promise<Group | null> {
    const group = await this.getGroupByIdOrCode(groupId);
    if (!group) return null;

    group.members.push(member);
    group.auditLogs.unshift({
      id: `log-${Date.now()}`,
      groupId: group.id,
      action: 'MEMBER_ADDED',
      description: `Added "${member.name}" to the group`,
      timestamp: new Date().toISOString(),
    });
    group.updatedAt = new Date().toISOString();

    if (isMongoConnected) {
      try {
        await (GroupModel as any).updateOne({ id: group.id }, { $set: { members: group.members, auditLogs: group.auditLogs } });
      } catch (err) {
        isMongoConnected = false;
      }
    }

    saveToDisk();
    return group;
  },

  async addExpense(groupId: string, expenseData: Partial<Expense>): Promise<{ group: Group; expense: Expense } | null> {
    const group = await this.getGroupByIdOrCode(groupId);
    if (!group) return null;

    const id = `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const currency = expenseData.currency || group.defaultCurrency;
    const amount = Number(expenseData.amount) || 0;
    const baseAmount = convertCurrency(amount, currency, group.defaultCurrency);
    const exchangeRateToBase = amount > 0 ? baseAmount / amount : 1.0;

    const newExpense: Expense = {
      id,
      groupId: group.id,
      title: expenseData.title || 'Untitled Expense',
      description: expenseData.description || '',
      amount,
      currency,
      exchangeRateToBase,
      baseAmount,
      category: expenseData.category || 'General',
      date: expenseData.date || new Date().toISOString(),
      paidBy: expenseData.paidBy || [],
      splitType: expenseData.splitType || 'EQUAL',
      splits: expenseData.splits || [],
      notes: expenseData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    group.expenses.unshift(newExpense);

    const payerNames = newExpense.paidBy.map((p) => p.memberName).join(', ');
    group.auditLogs.unshift({
      id: `log-${Date.now()}`,
      groupId: group.id,
      action: 'EXPENSE_ADDED',
      description: `${payerNames} added "${newExpense.title}" (${currency} ${amount.toFixed(2)})`,
      timestamp: new Date().toISOString(),
      actorName: payerNames,
    });
    group.updatedAt = new Date().toISOString();

    if (isMongoConnected) {
      try {
        await (ExpenseModel as any).create(newExpense);
        await (GroupModel as any).updateOne({ id: group.id }, { $set: { auditLogs: group.auditLogs } });
      } catch (err) {
        isMongoConnected = false;
      }
    }

    saveToDisk();
    return { group, expense: newExpense };
  },

  async findGroupByExpenseId(expenseId: string): Promise<Group | null> {
    for (const g of groupsStore.values()) {
      if (g.expenses.some((e) => e.id === expenseId)) {
        return g;
      }
    }
    if (isMongoConnected) {
      try {
        const exp = await (ExpenseModel as any).findOne({ id: expenseId }).lean();
        if (exp && exp.groupId) {
          return this.getGroupByIdOrCode(exp.groupId);
        }
      } catch (err) {
        isMongoConnected = false;
      }
    }
    return null;
  },

  async updateExpense(
    groupId: string,
    expenseId: string,
    expenseData: Partial<Expense>
  ): Promise<{ group: Group; expense: Expense } | null> {
    const group = await this.getGroupByIdOrCode(groupId);
    if (!group) return null;

    const index = group.expenses.findIndex((e) => e.id === expenseId);
    if (index === -1) return null;

    const existing = group.expenses[index];
    const currency = expenseData.currency || existing.currency || group.defaultCurrency;
    const amount = expenseData.amount !== undefined ? Number(expenseData.amount) : existing.amount;
    const baseAmount = convertCurrency(amount, currency, group.defaultCurrency);
    const exchangeRateToBase = amount > 0 ? baseAmount / amount : 1.0;

    const updatedExpense: Expense = {
      ...existing,
      title: expenseData.title !== undefined ? expenseData.title.trim() : existing.title,
      description: expenseData.description !== undefined ? expenseData.description.trim() : existing.description,
      amount,
      currency,
      exchangeRateToBase,
      baseAmount,
      category: expenseData.category || existing.category,
      date: expenseData.date || existing.date,
      paidBy: expenseData.paidBy || existing.paidBy,
      splitType: expenseData.splitType || existing.splitType,
      splits: expenseData.splits || existing.splits,
      notes: expenseData.notes !== undefined ? expenseData.notes : existing.notes,
      updatedAt: new Date().toISOString(),
    };

    group.expenses[index] = updatedExpense;

    const payerNames = updatedExpense.paidBy.map((p) => p.memberName).join(', ') || 'A member';
    group.auditLogs.unshift({
      id: `log-${Date.now()}`,
      groupId: group.id,
      action: 'EXPENSE_UPDATED',
      description: `${payerNames} updated "${updatedExpense.title}" (${currency} ${amount.toFixed(2)})`,
      timestamp: new Date().toISOString(),
      actorName: payerNames,
    });
    group.updatedAt = new Date().toISOString();

    if (isMongoConnected) {
      try {
        await (ExpenseModel as any).updateOne({ id: expenseId }, { $set: updatedExpense });
        await (GroupModel as any).updateOne({ id: group.id }, { $set: { auditLogs: group.auditLogs, updatedAt: group.updatedAt } });
      } catch (err) {
        isMongoConnected = false;
      }
    }

    saveToDisk();
    return { group, expense: updatedExpense };
  },

  async deleteExpense(groupId: string, expenseId: string): Promise<Group | null> {
    const group = await this.getGroupByIdOrCode(groupId);
    if (!group) return null;

    const index = group.expenses.findIndex((e) => e.id === expenseId);
    if (index === -1) return null;

    const removed = group.expenses.splice(index, 1)[0];
    group.auditLogs.unshift({
      id: `log-${Date.now()}`,
      groupId: group.id,
      action: 'EXPENSE_DELETED',
      description: `Expense "${removed.title}" was deleted`,
      timestamp: new Date().toISOString(),
    });
    group.updatedAt = new Date().toISOString();

    if (isMongoConnected) {
      try {
        await (ExpenseModel as any).deleteOne({ id: expenseId });
        await (GroupModel as any).updateOne({ id: group.id }, { $set: { auditLogs: group.auditLogs } });
      } catch (err) {
        isMongoConnected = false;
      }
    }

    saveToDisk();
    return group;
  },

  async recordSettlement(groupId: string, settlementData: Partial<Settlement>): Promise<{ group: Group; settlement: Settlement } | null> {
    const group = await this.getGroupByIdOrCode(groupId);
    if (!group) return null;

    const id = `stl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newSettlement: Settlement = {
      id,
      groupId: group.id,
      fromMemberId: settlementData.fromMemberId!,
      fromMemberName: settlementData.fromMemberName!,
      toMemberId: settlementData.toMemberId!,
      toMemberName: settlementData.toMemberName!,
      amount: Number(settlementData.amount) || 0,
      currency: settlementData.currency || group.defaultCurrency,
      date: settlementData.date || new Date().toISOString(),
      notes: settlementData.notes || '',
      paymentMethod: settlementData.paymentMethod || 'Cash',
      completed: settlementData.completed ?? true,
      createdAt: new Date().toISOString(),
    };

    group.settlements.unshift(newSettlement);
    group.auditLogs.unshift({
      id: `log-${Date.now()}`,
      groupId: group.id,
      action: 'SETTLEMENT_RECORDED',
      description: `${newSettlement.fromMemberName} paid ${newSettlement.toMemberName} ${newSettlement.currency} ${newSettlement.amount.toFixed(2)} (${newSettlement.paymentMethod})`,
      timestamp: new Date().toISOString(),
      actorName: newSettlement.fromMemberName,
    });
    group.updatedAt = new Date().toISOString();

    if (isMongoConnected) {
      try {
        await (SettlementModel as any).create(newSettlement);
        await (GroupModel as any).updateOne({ id: group.id }, { $set: { auditLogs: group.auditLogs } });
      } catch (err) {
        isMongoConnected = false;
      }
    }

    saveToDisk();
    return { group, settlement: newSettlement };
  },

  async deleteSettlement(groupId: string, settlementId: string): Promise<Group | null> {
    const group = await this.getGroupByIdOrCode(groupId);
    if (!group) return null;

    const index = group.settlements.findIndex((s) => s.id === settlementId);
    if (index === -1) return null;

    const removed = group.settlements.splice(index, 1)[0];
    group.auditLogs.unshift({
      id: `log-${Date.now()}`,
      groupId: group.id,
      action: 'SETTLEMENT_RECORDED',
      description: `Settlement of ${removed.currency} ${removed.amount.toFixed(2)} was reverted`,
      timestamp: new Date().toISOString(),
    });
    group.updatedAt = new Date().toISOString();

    if (isMongoConnected) {
      try {
        await (SettlementModel as any).deleteOne({ id: settlementId });
        await (GroupModel as any).updateOne({ id: group.id }, { $set: { auditLogs: group.auditLogs } });
      } catch (err) {
        isMongoConnected = false;
      }
    }

    saveToDisk();
    return group;
  },

  async deleteGroup(groupId: string): Promise<boolean> {
    const group = await this.getGroupByIdOrCode(groupId);
    if (!group) return false;

    if (isMongoConnected) {
      try {
        await (ExpenseModel as any).deleteMany({ groupId: group.id });
        await (SettlementModel as any).deleteMany({ groupId: group.id });
        await (GroupModel as any).deleteOne({ id: group.id });
      } catch (err) {
        isMongoConnected = false;
      }
    }

    groupsStore.delete(group.id);
    groupsStore.delete(group.shareCode.toUpperCase());
    groupsStore.delete(group.slug.toLowerCase());
    saveToDisk();
    return true;
  },

  async removeMember(
    groupId: string,
    memberId: string
  ): Promise<{ success: boolean; error?: string; group?: Group }> {
    const group = await this.getGroupByIdOrCode(groupId);
    if (!group) {
      return { success: false, error: 'Group not found' };
    }

    const member = group.members.find((m) => m.id === memberId);
    if (!member) {
      return { success: false, error: 'Member not found in this group' };
    }

    const creatorName = (group.createdBy || group.creatorName || '').trim().toLowerCase();
    if (
      member.id === group.creatorMemberId ||
      member.isCreator ||
      (creatorName && member.name.trim().toLowerCase() === creatorName)
    ) {
      return {
        success: false,
        error: `Cannot remove ${member.name} because they are the original creator of this group.`,
      };
    }

    // Check if member is involved in any active expenses
    const payingExpense = group.expenses.find((e) =>
      e.paidBy.some((p) => p.memberId === memberId && p.amount > 0)
    );
    if (payingExpense) {
      return {
        success: false,
        error: `Cannot remove ${member.name} because they paid for "${payingExpense.title}". Please edit or delete that expense first.`,
      };
    }

    const splittingExpense = group.expenses.find((e) =>
      e.splits.some((s) => s.memberId === memberId && s.shareAmount > 0)
    );
    if (splittingExpense) {
      return {
        success: false,
        error: `Cannot remove ${member.name} because they have an active split in "${splittingExpense.title}". Please adjust or delete that expense first.`,
      };
    }

    // Check if involved in settlements
    const settlement = group.settlements.find(
      (s) => s.fromMemberId === memberId || s.toMemberId === memberId
    );
    if (settlement) {
      return {
        success: false,
        error: `Cannot remove ${member.name} because they have recorded payment settlements in this group.`,
      };
    }

    // Safe to remove member
    group.members = group.members.filter((m) => m.id !== memberId);
    group.auditLogs.unshift({
      id: `log-${Date.now()}`,
      groupId: group.id,
      action: 'MEMBER_REMOVED',
      description: `Creator removed member "${member.name}" from the group`,
      timestamp: new Date().toISOString(),
      actorName: group.creatorName,
    });
    group.updatedAt = new Date().toISOString();

    if (isMongoConnected) {
      try {
        await (GroupModel as any).updateOne(
          { id: group.id },
          { $set: { members: group.members, auditLogs: group.auditLogs, updatedAt: group.updatedAt } }
        );
      } catch (err) {
        isMongoConnected = false;
      }
    }

    saveToDisk();
    return { success: true, group };
  },
};
