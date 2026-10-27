import { Link } from 'react-router-dom';
import {
  Bot, Plus, FileText, DollarSign, Calendar, ArrowRight,
  CheckCircle2, Circle, AlertCircle, Clock, TrendingUp,
  BookOpen, Sparkles, Bell
} from 'lucide-react';
import clsx from 'clsx';
import { Card, CardHeader, CardTitle, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, ProgressBar } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore, useTaskStore, useNotificationStore, useFinanceStore } from '@/app/store';
import { DEMO_FINANCE, DEMO_RESOURCES } from '@/utils/sampleData';
import { formatDate, getStageLabel, PRIORITY_BG, formatCurrency } from '@/utils/helpers';
import type { Task } from '@/types';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const tasks = useTaskStore((s) => s.tasks);
  const { updateTask } = useTaskStore();
  const notifications = useNotificationStore((s) => s.notifications);
  const unread = notifications.filter((n) => !n.read).length;

  const displayName = user?.display_name || user?.username || 'there';
  const stage = user?.preferences?.separation_stage ?? 'exploring';
  const stageLabel = getStageLabel(stage);

  // Task stats
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const pending = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
  const overdue = tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length;
  const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  // Today's priorities
  const todayPriority = tasks
    .filter((t) => t.status !== 'completed' && t.status !== 'skipped')
    .sort((a, b) => {
      const p = { urgent: 4, high: 3, medium: 2, low: 1 };
      return p[b.priority] - p[a.priority];
    })
    .slice(0, 3);

  // Finance summary (use demo data if store is empty)
  const financeEntries = useFinanceStore((s) => s.entries).length > 0
    ? useFinanceStore((s) => s.entries)
    : DEMO_FINANCE;

  const monthlyIncome = financeEntries
    .filter((e) => e.type === 'income' && e.frequency === 'monthly')
    .reduce((sum, e) => sum + e.amount, 0);
  const monthlyExpenses = financeEntries
    .filter((e) => e.type === 'expense' && e.frequency === 'monthly')
    .reduce((sum, e) => sum + e.amount, 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="page-container space-y-6">
      {/* Demo banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2.5 text-sm">
        <Sparkles className="w-4 h-4 text-warning flex-shrink-0" />
        <span className="text-warning font-medium">Demo Mode</span>
        <span className="text-amber-700"> — Sample data is shown for illustration. Your real data will appear as you add it.</span>
      </div>

      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-text">
            {greeting}, {displayName}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="accent" dot>{stageLabel}</Badge>
            {unread > 0 && (
              <Link to="/app/notifications">
                <Badge variant="error" dot>{unread} new notification{unread !== 1 ? 's' : ''}</Badge>
              </Link>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          <Link to="/app/ai">
            <Button variant="primary" size="sm" leftIcon={<Bot className="w-4 h-4" />}>Ask AI</Button>
          </Link>
          <Link to="/app/planner">
            <Button variant="secondary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>Add Task</Button>
          </Link>
          <Link to="/app/documents">
            <Button variant="secondary" size="sm" leftIcon={<FileText className="w-4 h-4" />}>Upload Doc</Button>
          </Link>
          <Link to="/app/finance">
            <Button variant="secondary" size="sm" leftIcon={<DollarSign className="w-4 h-4" />}>Budget</Button>
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tasks Complete"
          value={`${completed}/${tasks.length}`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="success"
        />
        <StatCard
          label="Pending Tasks"
          value={pending}
          icon={<Clock className="w-5 h-5" />}
          color="accent"
        />
        {overdue > 0 ? (
          <StatCard
            label="Overdue"
            value={overdue}
            icon={<AlertCircle className="w-5 h-5" />}
            color="peach"
          />
        ) : (
          <StatCard
            label="Monthly Income"
            value={formatCurrency(monthlyIncome)}
            icon={<TrendingUp className="w-5 h-5" />}
            color="teal"
          />
        )}
        <StatCard
          label="Overall Progress"
          value={`${progress}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="teal"
        />
      </div>

      {/* Progress bar */}
      <Card>
        <CardHeader>
          <CardTitle subtitle={`${completed} of ${tasks.length} tasks completed across all stages`}>
            Separation Plan Progress
          </CardTitle>
        </CardHeader>
        <ProgressBar value={progress} color="accent" size="md" />
        <div className="flex justify-between mt-2">
          <span className="text-xs text-secondary-text">Getting started</span>
          <span className="text-xs text-secondary-text">Plan complete</span>
        </div>
      </Card>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's priorities */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader
              action={
                <Link to="/app/planner" className="text-xs text-accent hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              }
            >
              <CardTitle subtitle="Your highest-priority open tasks">Today's Priorities</CardTitle>
            </CardHeader>

            {todayPriority.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="w-8 h-8" />}
                title="All caught up!"
                description="No pending tasks. Add new tasks to keep moving forward."
                action={
                  <Link to="/app/planner">
                    <Button variant="secondary" size="sm">Add a Task</Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-2.5">
                {todayPriority.map((task) => (
                  <TaskRow key={task.id} task={task} onComplete={() => updateTask(task.id, { status: 'completed', completed_at: new Date().toISOString() })} />
                ))}
              </div>
            )}
          </Card>

          {/* Financial summary */}
          <Card>
            <CardHeader
              action={
                <Link to="/app/finance" className="text-xs text-accent hover:underline flex items-center gap-1">
                  View planner <ArrowRight className="w-3 h-3" />
                </Link>
              }
            >
              <CardTitle subtitle="Monthly estimates based on your entries">Financial Summary</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-teal-50 rounded-xl p-3.5 border border-teal-100">
                <p className="text-xs text-teal-500 font-medium mb-1">Monthly Income</p>
                <p className="text-xl font-bold text-teal">{formatCurrency(monthlyIncome)}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3.5 border border-red-100">
                <p className="text-xs text-error font-medium mb-1">Monthly Expenses</p>
                <p className="text-xl font-bold text-error">{formatCurrency(monthlyExpenses)}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary-text">Monthly balance</span>
                <span className={clsx('font-semibold text-sm', monthlyIncome - monthlyExpenses >= 0 ? 'text-success' : 'text-error')}>
                  {monthlyIncome - monthlyExpenses >= 0 ? '+' : ''}{formatCurrency(monthlyIncome - monthlyExpenses)}
                </span>
              </div>
              <p className="text-xs text-secondary-text mt-1">These are estimates. Add your details in the Financial Planner.</p>
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* AI Quick Access */}
          <Card className="bg-accent-50 border-accent-100">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-text text-sm">Smart Split AI</h3>
                <p className="text-xs text-secondary-text">Ask anything about your situation</p>
              </div>
            </div>
            <div className="space-y-1.5 mb-4">
              {['What documents do I need?', 'Help me understand divorce types', 'Create a separation checklist'].map((q) => (
                <Link
                  key={q}
                  to={`/app/ai?prompt=${encodeURIComponent(q)}`}
                  className="block text-xs text-accent hover:text-accent-600 py-1 px-2.5 rounded-lg hover:bg-accent-100 transition-colors"
                >
                  → {q}
                </Link>
              ))}
            </div>
            <Link to="/app/ai">
              <Button variant="primary" size="sm" fullWidth rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Open AI Assistant
              </Button>
            </Link>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader
              action={
                <Link to="/app/notifications" className="text-xs text-accent hover:underline">
                  View all
                </Link>
              }
            >
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            {notifications.slice(0, 3).length === 0 ? (
              <p className="text-sm text-secondary-text">No notifications</p>
            ) : (
              <div className="space-y-2.5">
                {notifications.slice(0, 3).map((n) => (
                  <div key={n.id} className={clsx('flex gap-2.5 p-2.5 rounded-xl', !n.read && 'bg-background')}>
                    <Bell className={clsx('w-4 h-4 flex-shrink-0 mt-0.5', n.read ? 'text-border' : 'text-accent')} />
                    <div>
                      <p className="text-xs font-medium text-primary-text">{n.title}</p>
                      <p className="text-xs text-secondary-text">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recommended resources */}
          <Card>
            <CardHeader
              action={
                <Link to="/app/resources" className="text-xs text-accent hover:underline">
                  View all
                </Link>
              }
            >
              <CardTitle>Recommended Resources</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {DEMO_RESOURCES.slice(0, 3).map((r) => (
                <Link
                  key={r.id}
                  to="/app/resources"
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-background transition-colors group"
                >
                  <BookOpen className="w-4 h-4 text-accent flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-primary-text truncate">{r.title}</p>
                    <p className="text-xs text-secondary-text">{r.category}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-secondary-text group-hover:text-accent transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Upcoming calendar */}
      <Card>
        <CardHeader
          action={
            <Link to="/app/calendar" className="text-xs text-accent hover:underline flex items-center gap-1">
              Open calendar <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          <CardTitle subtitle="Your upcoming dates and deadlines">Important Dates</CardTitle>
        </CardHeader>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { date: '2026-11-05', title: 'Document Review', type: 'document', color: 'bg-teal-50 text-teal border-teal-100' },
            { date: '2026-11-10', title: 'Lawyer Consultation', type: 'appointment', color: 'bg-accent-50 text-accent border-accent-100' },
            { date: '2026-11-12', title: 'School Parent Evening', type: 'parenting', color: 'bg-teal-50 text-teal border-teal-100' },
            { date: '2026-11-20', title: 'Mediation Session', type: 'mediation', color: 'bg-accent-50 text-accent border-accent-100' },
          ].map((ev) => (
            <div key={ev.title} className={clsx('rounded-xl border p-3', ev.color)}>
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{formatDate(ev.date, 'MMM d')}</span>
              </div>
              <p className="text-sm font-medium text-primary-text">{ev.title}</p>
              <p className="text-xs capitalize">{ev.type}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function TaskRow({ task, onComplete }: { task: Task; onComplete: () => void }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-background transition-colors group">
      <button
        onClick={onComplete}
        className="mt-0.5 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-full"
        aria-label="Mark complete"
      >
        {task.status === 'completed' ? (
          <CheckCircle2 className="w-4.5 h-4.5 text-success w-[18px] h-[18px]" />
        ) : (
          <Circle className="w-[18px] h-[18px] text-border group-hover:text-accent transition-colors" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-primary-text truncate">{task.title}</p>
        {task.due_date && (
          <p className="text-xs text-secondary-text mt-0.5">
            Due {formatDate(task.due_date)}
          </p>
        )}
      </div>
      <span className={clsx('text-xs px-2 py-0.5 rounded-full flex-shrink-0', PRIORITY_BG[task.priority])}>
        {task.priority}
      </span>
    </div>
  );
}
