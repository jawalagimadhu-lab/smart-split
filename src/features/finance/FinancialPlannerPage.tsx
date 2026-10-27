import { useState } from 'react';
import {
  DollarSign, Plus, Trash2, Edit2, TrendingUp, TrendingDown,
  PieChart, BarChart2, Download, Info, CheckCircle2, AlertTriangle
} from 'lucide-react';
import {
  PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFinanceStore } from '@/app/store';
import { DEMO_FINANCE } from '@/utils/sampleData';
import { formatCurrency, generateId, formatDate } from '@/utils/helpers';
import type { FinancialEntry } from '@/types';

const EXPENSE_CATEGORIES = [
  'Housing', 'Utilities', 'Food', 'Transport', 'Healthcare',
  'Insurance', 'Children', 'Education', 'Legal', 'Personal Care',
  'Entertainment', 'Savings', 'Debt Repayment', 'Other',
];

const INCOME_CATEGORIES = ['Salary', 'Self-Employment', 'Investments', 'Benefits', 'Child Support', 'Spousal Support', 'Other'];
const ASSET_CATEGORIES = ['Property', 'Savings', 'Investments', 'Vehicle', 'Pension', 'Business', 'Other'];
const DEBT_CATEGORIES = ['Mortgage', 'Credit Card', 'Personal Loan', 'Car Finance', 'Student Loan', 'Other'];

const COLORS = ['#8A7AE6', '#5AAE9A', '#F8E5D8', '#C58A37', '#C75D63', '#27866B', '#777D8B', '#20283B'];

type EntryType = 'income' | 'expense' | 'asset' | 'debt';
type TabType = 'overview' | 'income' | 'expenses' | 'assets' | 'scenario';

const tabs: { id: TabType; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'income', label: 'Income' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'assets', label: 'Assets & Debts' },
  { id: 'scenario', label: 'Scenario Planner' },
];

const defaultForm = {
  type: 'expense' as EntryType,
  category: 'Housing',
  description: '',
  amount: '',
  frequency: 'monthly' as 'monthly' | 'one_time' | 'yearly',
  shared: false,
  notes: '',
};

export default function FinancialPlannerPage() {
  const { entries, addEntry, updateEntry, removeEntry } = useFinanceStore();
  const allEntries = entries.length > 0 ? entries : DEMO_FINANCE;

  const [tab, setTab] = useState<TabType>('overview');
  const [addOpen, setAddOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<FinancialEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  // Calculations
  const monthlyIncome = allEntries
    .filter(e => e.type === 'income')
    .reduce((s, e) => s + (e.frequency === 'monthly' ? e.amount : e.frequency === 'yearly' ? e.amount / 12 : 0), 0);

  const monthlyExpenses = allEntries
    .filter(e => e.type === 'expense')
    .reduce((s, e) => s + (e.frequency === 'monthly' ? e.amount : e.frequency === 'yearly' ? e.amount / 12 : 0), 0);

  const totalAssets = allEntries.filter(e => e.type === 'asset').reduce((s, e) => s + e.amount, 0);
  const totalDebts = allEntries.filter(e => e.type === 'debt').reduce((s, e) => s + e.amount, 0);
  const netWorth = totalAssets - totalDebts;
  const monthlyBalance = monthlyIncome - monthlyExpenses;

  // Expense breakdown for pie chart
  const expenseByCategory = allEntries
    .filter(e => e.type === 'expense')
    .reduce((acc, e) => {
      const cat = e.category;
      const monthly = e.frequency === 'monthly' ? e.amount : e.frequency === 'yearly' ? e.amount / 12 : e.amount;
      acc[cat] = (acc[cat] ?? 0) + monthly;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(expenseByCategory)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Scenario bar chart data
  const scenarioData = [
    { name: 'Current', income: Math.round(monthlyIncome), expenses: Math.round(monthlyExpenses) },
    { name: 'After Sep.', income: Math.round(monthlyIncome * 0.85), expenses: Math.round(monthlyExpenses * 0.75 + 400) },
    { name: 'With Support', income: Math.round(monthlyIncome * 0.85 + 500), expenses: Math.round(monthlyExpenses * 0.75 + 400) },
  ];

  const getCategoriesForType = (type: EntryType) => {
    if (type === 'income') return INCOME_CATEGORIES;
    if (type === 'expense') return EXPENSE_CATEGORIES;
    if (type === 'asset') return ASSET_CATEGORIES;
    return DEBT_CATEGORIES;
  };

  const handleSave = () => {
    if (!form.description.trim()) { toast.error('Add a description.'); return; }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) { toast.error('Enter a valid amount.'); return; }

    if (editEntry) {
      updateEntry(editEntry.id, { ...form, amount: Number(form.amount) });
      toast.success('Entry updated');
    } else {
      addEntry({
        id: generateId(),
        user_id: 'user',
        ...form,
        amount: Number(form.amount),
        date: new Date().toISOString(),
      });
      toast.success('Entry added');
    }
    setAddOpen(false);
    setEditEntry(null);
    setForm(defaultForm);
  };

  const openEdit = (entry: FinancialEntry) => {
    setEditEntry(entry);
    setForm({
      type: entry.type,
      category: entry.category,
      description: entry.description,
      amount: String(entry.amount),
      frequency: entry.frequency,
      shared: entry.shared,
      notes: entry.notes ?? '',
    });
    setAddOpen(true);
  };

  const EntriesList = ({ type }: { type: EntryType }) => {
    const typeEntries = allEntries.filter(e => e.type === type);
    if (typeEntries.length === 0)
      return <EmptyState icon={<DollarSign className="w-6 h-6" />} title={`No ${type} entries yet`} description="Add your first entry to start building your financial picture." action={<Button variant="primary" size="sm" onClick={() => { setForm({ ...defaultForm, type }); setAddOpen(true); }}>Add Entry</Button>} />;
    return (
      <div className="space-y-2">
        {typeEntries.map(entry => (
          <div key={entry.id} className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-border hover:shadow-sm transition-all group">
            <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold',
              type === 'income' ? 'bg-teal-50 text-teal' : type === 'expense' ? 'bg-red-50 text-error' : type === 'asset' ? 'bg-accent-50 text-accent' : 'bg-amber-50 text-warning'
            )}>
              {entry.category[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary-text truncate">{entry.description}</p>
              <p className="text-xs text-secondary-text">{entry.category} · {entry.frequency.replace('_', ' ')}</p>
            </div>
            {entry.shared && <Badge variant="accent">Shared</Badge>}
            <p className={clsx('text-sm font-semibold',
              type === 'income' ? 'text-teal' : type === 'expense' ? 'text-error' : type === 'asset' ? 'text-accent' : 'text-warning'
            )}>
              {type === 'debt' || type === 'expense' ? '-' : '+'}{formatCurrency(entry.amount)}
              {(type === 'income' || type === 'expense') && entry.frequency === 'monthly' && <span className="text-xs font-normal text-secondary-text">/mo</span>}
            </p>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEdit(entry)} className="p-1.5 rounded-lg text-secondary-text hover:text-accent hover:bg-border"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => setDeleteId(entry.id)} className="p-1.5 rounded-lg text-secondary-text hover:text-error hover:bg-border"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-text">Financial Planner</h1>
          <p className="text-secondary-text mt-1 text-sm">Track income, expenses, assets, and debts. Plan for your financial future.</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setForm(defaultForm); setEditEntry(null); setAddOpen(true); }}>
          Add Entry
        </Button>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">These are personal estimates only. Totals use deterministic calculations — not AI. Consult a financial adviser for professional guidance.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Monthly Income', value: formatCurrency(monthlyIncome), color: 'text-teal', bg: 'bg-teal-50', icon: <TrendingUp className="w-4 h-4" /> },
          { label: 'Monthly Expenses', value: formatCurrency(monthlyExpenses), color: 'text-error', bg: 'bg-red-50', icon: <TrendingDown className="w-4 h-4" /> },
          { label: 'Monthly Balance', value: formatCurrency(monthlyBalance), color: monthlyBalance >= 0 ? 'text-success' : 'text-error', bg: monthlyBalance >= 0 ? 'bg-green-50' : 'bg-red-50', icon: <DollarSign className="w-4 h-4" /> },
          { label: 'Net Worth (est.)', value: formatCurrency(netWorth), color: netWorth >= 0 ? 'text-accent' : 'text-warning', bg: 'bg-accent-50', icon: <BarChart2 className="w-4 h-4" /> },
        ].map(s => (
          <Card key={s.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-secondary-text mb-1">{s.label}</p>
                <p className={clsx('text-xl font-bold', s.color)}>{s.value}</p>
              </div>
              <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', s.bg, s.color)}>{s.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-background rounded-xl border border-border w-full overflow-x-auto scrollbar-hide">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={clsx('flex-1 min-w-fit px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              tab === t.id ? 'bg-white text-accent shadow-sm border border-border' : 'text-secondary-text hover:text-primary-text'
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle subtitle="Monthly spending by category">Expense Breakdown</CardTitle></CardHeader>
            {pieData.length === 0 ? (
              <p className="text-sm text-secondary-text py-4 text-center">Add expenses to see breakdown</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <RechartsPie>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </RechartsPie>
              </ResponsiveContainer>
            )}
          </Card>
          <Card>
            <CardHeader><CardTitle subtitle="Assets vs debts overview">Balance Sheet Summary</CardTitle></CardHeader>
            <div className="space-y-3">
              {[
                { label: 'Total Assets', value: totalAssets, color: 'text-accent', bar: 'bg-accent' },
                { label: 'Total Debts', value: totalDebts, color: 'text-error', bar: 'bg-error' },
                { label: 'Net Worth', value: netWorth, color: netWorth >= 0 ? 'text-success' : 'text-error', bar: netWorth >= 0 ? 'bg-success' : 'bg-error' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-secondary-text">{item.label}</span>
                    <span className={clsx('text-sm font-semibold', item.color)}>{formatCurrency(item.value)}</span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full">
                    <div className={clsx('h-full rounded-full transition-all', item.bar)} style={{ width: `${Math.min(100, Math.abs(item.value) / Math.max(totalAssets, 1) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-xs text-secondary-text">These figures are estimates based on the information you've entered. Consult a financial professional for a comprehensive assessment.</p>
            </div>
          </Card>
        </div>
      )}

      {tab === 'income' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-secondary-text">Total monthly income: <span className="font-semibold text-teal">{formatCurrency(monthlyIncome)}</span></p>
            <Button variant="secondary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setForm({ ...defaultForm, type: 'income', category: 'Salary' }); setEditEntry(null); setAddOpen(true); }}>Add Income</Button>
          </div>
          <EntriesList type="income" />
        </div>
      )}

      {tab === 'expenses' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-secondary-text">Total monthly expenses: <span className="font-semibold text-error">{formatCurrency(monthlyExpenses)}</span></p>
            <Button variant="secondary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setForm({ ...defaultForm, type: 'expense' }); setEditEntry(null); setAddOpen(true); }}>Add Expense</Button>
          </div>
          <EntriesList type="expense" />
        </div>
      )}

      {tab === 'assets' && (
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-primary-text text-sm">Assets ({formatCurrency(totalAssets)})</h3>
              <Button variant="secondary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setForm({ ...defaultForm, type: 'asset', category: 'Property', frequency: 'one_time' }); setEditEntry(null); setAddOpen(true); }}>Add Asset</Button>
            </div>
            <EntriesList type="asset" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-primary-text text-sm">Debts ({formatCurrency(totalDebts)})</h3>
              <Button variant="secondary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setForm({ ...defaultForm, type: 'debt', category: 'Mortgage', frequency: 'one_time' }); setEditEntry(null); setAddOpen(true); }}>Add Debt</Button>
            </div>
            <EntriesList type="debt" />
          </div>
        </div>
      )}

      {tab === 'scenario' && (
        <div className="space-y-5">
          <div className="bg-accent-50 border border-accent-100 rounded-xl p-4 text-sm text-accent">
            <p className="font-medium mb-1">Scenario Planner — Estimates Only</p>
            <p className="text-xs text-accent/80">These hypothetical scenarios are based on rough adjustments to your current numbers. They are estimates to help you plan, not financial predictions. Consult a financial adviser for personalised advice.</p>
          </div>
          <Card>
            <CardHeader><CardTitle subtitle="Estimated monthly income vs expenses across scenarios">Budget Scenarios</CardTitle></CardHeader>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={scenarioData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E7EE" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#777D8B' }} />
                <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: '#777D8B' }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#5AAE9A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#8A7AE6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <div className="grid sm:grid-cols-3 gap-4">
            {scenarioData.map(s => (
              <Card key={s.name}>
                <h3 className="font-semibold text-sm text-primary-text mb-3">{s.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-secondary-text">Income</span><span className="text-teal font-medium">{formatCurrency(s.income)}</span></div>
                  <div className="flex justify-between"><span className="text-secondary-text">Expenses</span><span className="text-error font-medium">{formatCurrency(s.expenses)}</span></div>
                  <div className="flex justify-between pt-2 border-t border-border"><span className="text-secondary-text">Balance</span><span className={clsx('font-semibold', s.income - s.expenses >= 0 ? 'text-success' : 'text-error')}>{formatCurrency(s.income - s.expenses)}</span></div>
                </div>
                <p className="text-xs text-secondary-text mt-3">Estimate only</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={addOpen} onClose={() => { setAddOpen(false); setEditEntry(null); setForm(defaultForm); }} title={editEntry ? 'Edit Entry' : 'Add Financial Entry'} size="md">
        <div className="space-y-4">
          <Select label="Type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as EntryType, category: getCategoriesForType(e.target.value as EntryType)[0] })}
            options={[{ value: 'income', label: 'Income' }, { value: 'expense', label: 'Expense' }, { value: 'asset', label: 'Asset' }, { value: 'debt', label: 'Debt' }]} />
          <Select label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
            options={getCategoriesForType(form.type).map(c => ({ value: c, label: c }))} />
          <Input label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Monthly rent" />
          <Input label="Amount (£/$)" type="number" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
          <Select label="Frequency" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value as 'monthly' | 'one_time' | 'yearly' })}
            options={[{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }, { value: 'one_time', label: 'One-time' }]} />
          <label className="flex items-center gap-2 text-sm text-primary-text cursor-pointer">
            <input type="checkbox" checked={form.shared} onChange={e => setForm({ ...form, shared: e.target.checked })} className="rounded" />
            This is a shared expense / joint asset
          </label>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => { setAddOpen(false); setEditEntry(null); setForm(defaultForm); }}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>{editEntry ? 'Save Changes' : 'Add Entry'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { if (deleteId) { removeEntry(deleteId); toast.success('Entry deleted'); } }} title="Delete Entry" message="Delete this financial entry? This cannot be undone." confirmLabel="Delete" danger />
    </div>
  );
}
