import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { StorageEngine } from '../services/storageEngine.ts';
import { calculateGroupBalancesAndDebts } from '../../src/utils/debtSimplifier.ts';
import { CurrencyCode } from '../../src/types/index.ts';

const router = Router();

// Validation Schemas using Zod
const CreateGroupSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters'),
  creatorName: z.string().min(1, 'Creator name is required').optional(),
  description: z.string().optional(),
  defaultCurrency: z.enum(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CHF', 'SGD', 'AED']).default('USD'),
  members: z.array(z.object({
    name: z.string().min(1, 'Member name is required'),
    email: z.string().email().optional().or(z.literal('')),
    avatarColor: z.string().optional(),
  })).min(1, 'At least one member is required'),
});

const AddExpenseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CHF', 'SGD', 'AED']).default('USD'),
  category: z.string().default('General'),
  date: z.string().optional(),
  paidBy: z.array(z.object({
    memberId: z.string(),
    memberName: z.string(),
    amount: z.number().nonnegative(),
  })).min(1, 'At least one payer is required'),
  splitType: z.enum(['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES']).default('EQUAL'),
  splits: z.array(z.object({
    memberId: z.string(),
    memberName: z.string(),
    shareAmount: z.number().nonnegative(),
    exactAmount: z.number().optional(),
    percentage: z.number().optional(),
    shares: z.number().optional(),
  })).optional().default([]),
  notes: z.string().optional(),
});

const RecordSettlementSchema = z.object({
  fromMemberId: z.string(),
  fromMemberName: z.string(),
  toMemberId: z.string(),
  toMemberName: z.string(),
  amount: z.number().positive(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CHF', 'SGD', 'AED']),
  date: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(['Cash', 'Bank Transfer', 'Venmo', 'UPI', 'PayPal', 'Other']).default('Cash'),
});

// Helper to verify Creator permission
async function verifyCreatorPermission(
  req: Request,
  groupIdOrCode: string
): Promise<{ authorized: boolean; group?: any; error?: string }> {
  const group = await StorageEngine.getGroupByIdOrCode(groupIdOrCode);
  if (!group) {
    return { authorized: false, error: 'Group not found' };
  }

  // Token can come from header 'x-creator-token', body 'creatorToken', or query 'creatorToken'
  const providedToken =
    (req.headers['x-creator-token'] as string) ||
    req.body?.creatorToken ||
    (req.query?.creatorToken as string);

  // If group has a creatorToken configured, only creator can mutate
  if (group.creatorToken && providedToken !== group.creatorToken) {
    return {
      authorized: false,
      group,
      error: `Permission Denied: Only the group creator (${group.creatorName || 'Maker'}) can add, edit, or delete expenses, members, and group data. Other members have view-only access.`,
    };
  }

  return { authorized: true, group };
}

// 1. System status
router.get('/system/status', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    isMongo: StorageEngine.isMongo(),
    engine: StorageEngine.isMongo() ? 'MongoDB Atlas (Mongoose ODM)' : 'Resilient In-Memory & Local Engine',
    timestamp: new Date().toISOString(),
  });
});

// 2. List Groups
router.get('/groups', async (req: Request, res: Response) => {
  try {
    const groups = await StorageEngine.getAllGroups();
    res.json({ success: true, data: groups });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Create Group
router.post('/groups', async (req: Request, res: Response) => {
  try {
    const parsed = CreateGroupSchema.parse(req.body);
    const colors = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#14B8A6', '#EF4444', '#6366F1'];
    
    const membersWithIds = parsed.members.map((m, idx) => ({
      id: `m-${Date.now()}-${idx}`,
      name: m.name.trim(),
      email: m.email || undefined,
      avatarColor: m.avatarColor || colors[idx % colors.length],
      createdAt: new Date().toISOString(),
    }));

    const creatorName = parsed.creatorName?.trim() || membersWithIds[0]?.name || 'Creator';

    const newGroup = await StorageEngine.createGroup({
      name: parsed.name.trim(),
      creatorName,
      description: parsed.description?.trim(),
      defaultCurrency: parsed.defaultCurrency as CurrencyCode,
      members: membersWithIds,
    });

    res.status(201).json({ success: true, data: newGroup });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 3b. Verify Creator Status
router.get('/groups/:idOrCode/verify-creator', async (req: Request, res: Response) => {
  try {
    const group = await StorageEngine.getGroupByIdOrCode(req.params.idOrCode);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    const token =
      (req.headers['x-creator-token'] as string) ||
      (req.query?.creatorToken as string);
    const isCreator = Boolean(group.creatorToken && token === group.creatorToken);
    res.json({
      success: true,
      data: {
        isCreator,
        creatorName: group.creatorName,
        creatorMemberId: group.creatorMemberId,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Get Group by ID or Share Code (with balances & simplified debts)
router.get('/groups/:idOrCode', async (req: Request, res: Response) => {
  try {
    const group = await StorageEngine.getGroupByIdOrCode(req.params.idOrCode);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    const summary = calculateGroupBalancesAndDebts(
      group.members,
      group.expenses,
      group.settlements,
      group.defaultCurrency
    );

    res.json({
      success: true,
      data: {
        group,
        summary,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Delete Group (Creator Only)
router.delete('/groups/:idOrCode', async (req: Request, res: Response) => {
  try {
    const auth = await verifyCreatorPermission(req, req.params.idOrCode);
    if (!auth.authorized) {
      return res.status(403).json({ success: false, error: auth.error });
    }

    const success = await StorageEngine.deleteGroup(auth.group.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Group not found or could not be deleted' });
    }

    res.json({
      success: true,
      message: `Group "${auth.group.name}" and all associated expenses were deleted permanently.`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Add Member to Group (Allowed on Join or by Creator)
router.post('/groups/:idOrCode/members', async (req: Request, res: Response) => {
  try {
    const name = (req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, error: 'Member name is required' });
    }
    const colors = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#14B8A6'];
    const member = {
      id: `m-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name,
      email: req.body.email?.trim() || undefined,
      avatarColor: req.body.avatarColor || colors[Math.floor(Math.random() * colors.length)],
      isCreator: false,
      createdAt: new Date().toISOString(),
    };

    const updatedGroup = await StorageEngine.addMember(req.params.idOrCode, member);
    if (!updatedGroup) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    res.json({ success: true, data: updatedGroup, addedMember: member });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Remove Member from Group (Creator Only with expense edge cases validation)
router.delete('/groups/:idOrCode/members/:memberId', async (req: Request, res: Response) => {
  try {
    const auth = await verifyCreatorPermission(req, req.params.idOrCode);
    if (!auth.authorized) {
      return res.status(403).json({ success: false, error: auth.error });
    }

    const result = await StorageEngine.removeMember(auth.group.id, req.params.memberId);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    const summary = calculateGroupBalancesAndDebts(
      result.group!.members,
      result.group!.expenses,
      result.group!.settlements,
      result.group!.defaultCurrency
    );

    res.json({
      success: true,
      data: {
        group: result.group,
        summary,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Add Expense (Creator Only)
router.post('/groups/:idOrCode/expenses', async (req: Request, res: Response) => {
  try {
    const auth = await verifyCreatorPermission(req, req.params.idOrCode);
    if (!auth.authorized) {
      return res.status(403).json({ success: false, error: auth.error });
    }

    const parsed = AddExpenseSchema.parse(req.body);
    const result = await StorageEngine.addExpense(auth.group.id, parsed as any);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    const summary = calculateGroupBalancesAndDebts(
      result.group.members,
      result.group.expenses,
      result.group.settlements,
      result.group.defaultCurrency
    );

    res.status(201).json({ success: true, data: { group: result.group, expense: result.expense, summary } });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 9. Update Expense (by Group and ID - Creator Only)
router.put('/groups/:idOrCode/expenses/:expenseId', async (req: Request, res: Response) => {
  try {
    const auth = await verifyCreatorPermission(req, req.params.idOrCode);
    if (!auth.authorized) {
      return res.status(403).json({ success: false, error: auth.error });
    }

    const result = await StorageEngine.updateExpense(auth.group.id, req.params.expenseId, req.body);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Expense or group not found' });
    }
    const summary = calculateGroupBalancesAndDebts(
      result.group.members,
      result.group.expenses,
      result.group.settlements,
      result.group.defaultCurrency
    );
    res.json({ success: true, data: { group: result.group, expense: result.expense, summary } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9b. Direct Update Expense (/api/expenses/:id - Creator Only)
router.put('/expenses/:id', async (req: Request, res: Response) => {
  try {
    const expenseId = req.params.id;
    let group = req.body.groupId ? await StorageEngine.getGroupByIdOrCode(req.body.groupId) : null;
    if (!group) {
      group = await StorageEngine.findGroupByExpenseId(expenseId);
    }
    if (!group) {
      return res.status(404).json({ success: false, error: 'Associated expense group not found' });
    }

    const auth = await verifyCreatorPermission(req, group.id);
    if (!auth.authorized) {
      return res.status(403).json({ success: false, error: auth.error });
    }

    const result = await StorageEngine.updateExpense(group.id, expenseId, req.body);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Expense could not be updated' });
    }
    const summary = calculateGroupBalancesAndDebts(
      result.group.members,
      result.group.expenses,
      result.group.settlements,
      result.group.defaultCurrency
    );
    res.json({ success: true, data: { group: result.group, expense: result.expense, summary } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9c. Direct Delete Expense (/api/expenses/:id - Creator Only)
router.delete('/expenses/:id', async (req: Request, res: Response) => {
  try {
    const expenseId = req.params.id;
    let group = req.body?.groupId ? await StorageEngine.getGroupByIdOrCode(req.body.groupId) : null;
    if (!group) {
      group = await StorageEngine.findGroupByExpenseId(expenseId);
    }
    if (!group) {
      return res.status(404).json({ success: false, error: 'Associated expense group not found' });
    }

    const auth = await verifyCreatorPermission(req, group.id);
    if (!auth.authorized) {
      return res.status(403).json({ success: false, error: auth.error });
    }

    const updated = await StorageEngine.deleteExpense(group.id, expenseId);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Expense could not be deleted' });
    }
    const summary = calculateGroupBalancesAndDebts(
      updated.members,
      updated.expenses,
      updated.settlements,
      updated.defaultCurrency
    );
    res.json({ success: true, data: { group: updated, summary } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9d. Delete Expense (by Group and ID - Creator Only)
router.delete('/groups/:idOrCode/expenses/:expenseId', async (req: Request, res: Response) => {
  try {
    const auth = await verifyCreatorPermission(req, req.params.idOrCode);
    if (!auth.authorized) {
      return res.status(403).json({ success: false, error: auth.error });
    }

    const updated = await StorageEngine.deleteExpense(auth.group.id, req.params.expenseId);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Expense or group not found' });
    }
    const summary = calculateGroupBalancesAndDebts(
      updated.members,
      updated.expenses,
      updated.settlements,
      updated.defaultCurrency
    );
    res.json({ success: true, data: { group: updated, summary } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Record Settlement (Creator Only)
router.post('/groups/:idOrCode/settlements', async (req: Request, res: Response) => {
  try {
    const auth = await verifyCreatorPermission(req, req.params.idOrCode);
    if (!auth.authorized) {
      return res.status(403).json({ success: false, error: auth.error });
    }

    const parsed = RecordSettlementSchema.parse(req.body);
    const result = await StorageEngine.recordSettlement(auth.group.id, parsed as any);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    const summary = calculateGroupBalancesAndDebts(
      result.group.members,
      result.group.expenses,
      result.group.settlements,
      result.group.defaultCurrency
    );
    res.status(201).json({ success: true, data: { group: result.group, settlement: result.settlement, summary } });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 11. Delete / Revert Settlement (Creator Only)
router.delete('/groups/:idOrCode/settlements/:settlementId', async (req: Request, res: Response) => {
  try {
    const auth = await verifyCreatorPermission(req, req.params.idOrCode);
    if (!auth.authorized) {
      return res.status(403).json({ success: false, error: auth.error });
    }

    const updated = await StorageEngine.deleteSettlement(auth.group.id, req.params.settlementId);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Settlement or group not found' });
    }
    const summary = calculateGroupBalancesAndDebts(
      updated.members,
      updated.expenses,
      updated.settlements,
      updated.defaultCurrency
    );
    res.json({ success: true, data: { group: updated, summary } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Export to CSV
router.get('/groups/:idOrCode/export.csv', async (req: Request, res: Response) => {
  try {
    const group = await StorageEngine.getGroupByIdOrCode(req.params.idOrCode);
    if (!group) {
      return res.status(404).send('Group not found');
    }

    const rows = [
      ['Date', 'Expense Title', 'Category', 'Paid By', 'Amount', 'Currency', 'Split Type', 'Split Details', 'Notes'],
    ];

    for (const exp of group.expenses) {
      const payers = exp.paidBy.map((p) => `${p.memberName}: ${p.amount}`).join('; ');
      const splits = exp.splits.map((s) => `${s.memberName}: ${s.shareAmount}`).join('; ');
      rows.push([
        new Date(exp.date).toLocaleDateString(),
        `"${exp.title.replace(/"/g, '""')}"`,
        `"${exp.category}"`,
        `"${payers}"`,
        exp.amount.toFixed(2),
        exp.currency,
        exp.splitType,
        `"${splits}"`,
        `"${(exp.notes || '').replace(/"/g, '""')}"`,
      ]);
    }

    const csvContent = rows.map((r) => r.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${group.slug}-expenses.csv"`);
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).send(`Export failed: ${err.message}`);
  }
});

export default router;
