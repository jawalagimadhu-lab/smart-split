import { Bell, Check, CheckCheck, Trash2, Bot, Calendar, FileText, Info } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useNotificationStore } from '@/app/store';
import { timeAgo } from '@/utils/helpers';
import type { Notification } from '@/types';

const TYPE_ICONS: Record<Notification['type'], React.ReactNode> = {
  task: <Check className="w-4 h-4" />,
  document: <FileText className="w-4 h-4" />,
  calendar: <Calendar className="w-4 h-4" />,
  system: <Info className="w-4 h-4" />,
  ai: <Bot className="w-4 h-4" />,
};

const TYPE_COLORS: Record<Notification['type'], string> = {
  task: 'bg-teal-50 text-teal',
  document: 'bg-accent-50 text-accent',
  calendar: 'bg-amber-50 text-warning',
  system: 'bg-border text-secondary-text',
  ai: 'bg-accent-50 text-accent',
};

export default function NotificationsPage() {
  const { notifications, markRead, markAllRead, removeNotification } = useNotificationStore();
  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-text">Notifications</h1>
          <p className="text-secondary-text mt-1 text-sm">{unread > 0 ? `${unread} unread notification${unread !== 1 ? 's' : ''}` : 'All caught up!'}</p>
        </div>
        {unread > 0 && (
          <Button variant="secondary" size="sm" leftIcon={<CheckCheck className="w-4 h-4" />} onClick={() => { markAllRead(); toast.success('All marked as read'); }}>
            Mark All Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={<Bell className="w-8 h-8" />} title="No notifications" description="You're all caught up. Notifications will appear here as you use Smart Split." />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              className={clsx('flex items-start gap-3 p-4 rounded-2xl border transition-all', !n.read ? 'bg-white border-border shadow-sm' : 'bg-background border-border/50')}
              onClick={() => !n.read && markRead(n.id)}
            >
              <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', TYPE_COLORS[n.type])}>
                {TYPE_ICONS[n.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={clsx('text-sm font-medium', !n.read ? 'text-primary-text' : 'text-secondary-text')}>{n.title}</p>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1" />}
                </div>
                <p className="text-xs text-secondary-text mt-0.5">{n.message}</p>
                <p className="text-xs text-secondary-text mt-1">{timeAgo(n.created_at)}</p>
              </div>
              <button onClick={e => { e.stopPropagation(); removeNotification(n.id); toast.success('Notification dismissed'); }}
                className="p-1.5 rounded-lg text-secondary-text hover:text-error hover:bg-border transition-colors flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
