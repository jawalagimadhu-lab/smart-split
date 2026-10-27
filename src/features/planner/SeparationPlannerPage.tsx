import { useState } from 'react';
import {
  Plus, CheckCircle2, Circle, Clock, Search,
  Trash2, Edit2, ChevronDown, ChevronRight, ListChecks, Sparkles
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, ProgressBar } from '@/components/ui/Badge';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTaskStore, useAuthStore } from '@/app/store';
import { tasksApi } from '@/services/api';
import { useBackendSync } from '@/hooks/useBackendSync';
import { generateId, formatDate, PRIORITY_BG } from '@/utils/helpers';
import type { Task, TaskStage } from '@/types';

const STAGES: { id: TaskStage; label: string; description: string; color: string }[] = [
  { id: 'understand', label: '1. Understand Your Situation', description: 'Gather information and understand your options.', color: 'bg-accent-50 border-accent-100 text-accent' },
  { id: 'organize', label: '2. Organize Information', description: 'Collect documents and key records.', color: 'bg-teal-50 border-teal-100 text-teal' },
  { id: 'prepare_financially', label: '3. Prepare Financially', description: 'Build your financial picture and budget.', color: 'bg-amber-50 border-amber-100 text-warning' },
  { id: 'professional_guidance', label: '4. Seek Professional Guidance', description: 'Consult lawyers, mediators, and advisers.', color: 'bg-accent-50 border-accent-100 text-accent' },
  { id: 'legal_procedures', label: '5. Understand Legal Procedures', description: 'Learn the process that applies in your jurisdiction.', color: 'bg-teal-50 border-teal-100 text-teal' },
  { id: 'parenting', label: '6. Parenting Arrangements', description: 'Plan and agree on parenting arrangements.', color: 'bg-peach-100 border-peach-200 text-amber-700' },
  { id: 'track_proceedings', label: '7. Track Proceedings & Dates', description: 'Stay on top of important dates and deadlines.', color: 'bg-amber-50 border-amber-100 text-warning' },
  { id: 'life_after', label: '8. Plan Life After Separation', description: 'Prepare for your next chapter.', color: 'bg-teal-50 border-teal-100 text-teal' },
];

const CATEGORIES = ['Documents', 'Legal', 'Finance', 'Parenting', 'Housing', 'Personal', 'Admin', 'Other'];

const defaultForm = {
  title: '',
  description: '',
  stage: 'understand' as TaskStage,
  category: 'Personal',
  priority: 'medium' as Task['priority'],
  due_date: '',
  notes: '',
};

export default function SeparationPlannerPage() {
  const { token } = useAuthStore();
  const { tasks, setTasks, addTask, updateTask, removeTask } = useTaskStore();
  const isDemo = !token || token === 'demo-token';
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [expandedStages, setExpandedStages] = useState<Set<TaskStage>>(new Set(['understand', 'organize', 'prepare_financially']));
  const [addOpen, setAddOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Sync tasks from backend on mount
  useBackendSync<Task>({
    fetcher: (t) => tasksApi.list(t) as Promise<Task[]>,
    onSuccess: setTasks,
    skipIfPopulated: false,
  });

  const loadSuggestions = async () => {
    if (isDemo) { toast('Suggestions require backend connection.', { icon: 'ℹ️' }); return; }
    setLoadingSuggestions(true);
    try {
      const suggestions = await tasksApi.suggest(token!) as Task[];
      let added = 0;
      for (const s of suggestions) {
        const exists = tasks.some(t => t.title === s.title);
        if (!exists) {
          addTask(s);
          added++;
        }
      }
      toast.success(added > 0 ? `${added} suggested tasks added` : 'All suggestions already exist');
    } catch {
      toast.error('Could not load suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const toggleStage = (stage: TaskStage) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      next.has(stage) ? next.delete(stage) : next.add(stage);
      return next;
    });
  };


  const filteredTasks = tasks.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || t.status === filter;
    return matchSearch && matchFilter;
  });

  const completed = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  const handleSave = () => {
    if (!form.title.trim()) { toast.error('Task title is required.'); return; }
    if (editTask) {
      updateTask(editTask.id, { ...form });
      toast.success('Task updated');
    } else {
      addTask({
        id: generateId(), user_id: 'user',
        ...form, status: 'pending', tags: [],
      });
      toast.success('Task added');
    }
    setAddOpen(false);
    setEditTask(null);
    setForm(defaultForm);
  };

  const openEdit = (task: Task) => {
    setEditTask(task);
    setForm({ title: task.title, description: task.description ?? '', stage: task.stage, category: task.category, priority: task.priority, due_date: task.due_date ?? '', notes: task.notes ?? '' });
    setAddOpen(true);
  };

  const cycleStatus = (task: Task) => {
    const next: Record<Task['status'], Task['status']> = {
      pending: 'in_progress', in_progress: 'completed', completed: 'pending', skipped: 'pending',
    };
    updateTask(task.id, { status: next[task.status], ...(next[task.status] === 'completed' ? { completed_at: new Date().toISOString() } : {}) });
  };

  const statusIcon = (status: Task['status']) => {
    if (status === 'completed') return <CheckCircle2 className="w-[18px] h-[18px] text-success" />;
    if (status === 'in_progress') return <Clock className="w-[18px] h-[18px] text-accent" />;
    return <Circle className="w-[18px] h-[18px] text-border" />;
  };

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-text">Separation Planner</h1>
          <p className="text-secondary-text mt-1 text-sm">Your personalized action plan, organized by stage.</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setForm(defaultForm); setEditTask(null); setAddOpen(true); }}>
          Add Task
        </Button>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader><CardTitle subtitle={`${completed} of ${tasks.length} tasks completed`}>Overall Progress</CardTitle></CardHeader>
        <ProgressBar value={progress} color="accent" size="md" />
        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          {[
            { label: 'Completed', value: tasks.filter(t => t.status === 'completed').length, color: 'text-success' },
            { label: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: 'text-accent' },
            { label: 'Pending', value: tasks.filter(t => t.status === 'pending').length, color: 'text-secondary-text' },
          ].map(s => (
            <div key={s.label}>
              <p className={clsx('text-xl font-bold', s.color)}>{s.value}</p>
              <p className="text-xs text-secondary-text">{s.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white" />
        </div>
        <div className="flex gap-1 p-1 bg-background rounded-xl border border-border">
          {(['all', 'pending', 'in_progress', 'completed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={clsx('px-3 py-1 rounded-lg text-xs font-medium transition-all capitalize whitespace-nowrap', filter === f ? 'bg-white text-accent shadow-sm border border-border' : 'text-secondary-text hover:text-primary-text')}>
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="w-8 h-8" />}
          title="No tasks yet"
          description="Your personalized separation plan will be built here. Add your first task to get started."
          action={<Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>Add Your First Task</Button>}
        />
      ) : (
        /* Stages */
        <div className="space-y-4">
          {STAGES.map(stage => {
            const stageTasks = filteredTasks.filter(t => t.stage === stage.id);
            const isExpanded = expandedStages.has(stage.id);
            const stageComplete = stageTasks.filter(t => t.status === 'completed').length;

            return (
              <div key={stage.id} className="bg-white rounded-2xl border border-border overflow-hidden">
                <button
                  onClick={() => toggleStage(stage.id)}
                  className={clsx('w-full flex items-center gap-3 p-4 text-left hover:bg-background transition-colors', isExpanded && 'border-b border-border')}
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-secondary-text flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-secondary-text flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm text-primary-text">{stage.label}</span>
                    <p className="text-xs text-secondary-text">{stage.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-secondary-text">{stageComplete}/{stageTasks.length}</span>
                    {stageTasks.length > 0 && (
                      <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${stageTasks.length > 0 ? (stageComplete / stageTasks.length) * 100 : 0}%` }} />
                      </div>
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-3 space-y-1.5">
                    {stageTasks.length === 0 ? (
                      <div className="py-4 text-center">
                        <p className="text-xs text-secondary-text mb-2">No tasks in this stage{search ? ' matching your search' : ''}.</p>
                        <button onClick={() => { setForm({ ...defaultForm, stage: stage.id }); setAddOpen(true); }} className="text-xs text-accent hover:underline">+ Add a task</button>
                      </div>
                    ) : (
                      stageTasks.map(task => (
                        <div key={task.id} className={clsx('flex items-start gap-3 p-3 rounded-xl transition-all group', task.status === 'completed' ? 'opacity-60' : 'hover:bg-background')}>
                          <button onClick={() => cycleStatus(task)} className="mt-0.5 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-full">{statusIcon(task.status)}</button>
                          <div className="flex-1 min-w-0">
                            <p className={clsx('text-sm font-medium text-primary-text', task.status === 'completed' && 'line-through text-secondary-text')}>{task.title}</p>
                            {task.description && <p className="text-xs text-secondary-text mt-0.5 truncate">{task.description}</p>}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {task.due_date && (
                                <span className={clsx('text-xs flex items-center gap-1', new Date(task.due_date) < new Date() && task.status !== 'completed' ? 'text-error' : 'text-secondary-text')}>
                                  <Clock className="w-3 h-3" />
                                  {formatDate(task.due_date)}
                                </span>
                              )}
                              <span className={clsx('text-xs px-2 py-0.5 rounded-full', PRIORITY_BG[task.priority])}>{task.priority}</span>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button onClick={() => openEdit(task)} className="p-1.5 rounded-lg text-secondary-text hover:text-accent hover:bg-border"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setDeleteId(task.id)} className="p-1.5 rounded-lg text-secondary-text hover:text-error hover:bg-border"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      ))
                    )}
                    <button onClick={() => { setForm({ ...defaultForm, stage: stage.id }); setAddOpen(true); }} className="w-full flex items-center gap-2 p-2.5 rounded-xl text-xs text-secondary-text hover:text-accent hover:bg-background transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                      Add task to this stage
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={addOpen} onClose={() => { setAddOpen(false); setEditTask(null); setForm(defaultForm); }} title={editTask ? 'Edit Task' : 'Add Task'} size="md">
        <div className="space-y-4">
          <Input label="Task title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Gather bank statements" />
          <Textarea label="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="More details..." rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Stage" value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value as TaskStage })}
              options={STAGES.map(s => ({ value: s.id, label: s.label }))} />
            <Select label="Priority" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Task['priority'] })}
              options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }]} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              options={CATEGORIES.map(c => ({ value: c, label: c }))} />
            <Input label="Due date (optional)" type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <Textarea label="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." rows={2} />
          <p className="text-xs text-secondary-text">⚠️ Do not record legally required deadlines here without verifying with your solicitor. Deadline requirements vary by jurisdiction.</p>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => { setAddOpen(false); setEditTask(null); setForm(defaultForm); }}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>{editTask ? 'Save Changes' : 'Add Task'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { if (deleteId) { removeTask(deleteId); toast.success('Task deleted'); } }} title="Delete Task" message="Delete this task? This cannot be undone." confirmLabel="Delete" danger />
    </div>
  );
}
