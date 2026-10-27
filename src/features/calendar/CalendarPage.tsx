import { useState } from 'react';
import { Calendar as CalIcon, Plus, ChevronLeft, ChevronRight, Clock, Bell, BellOff, Trash2, Edit2 } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, addMonths, subMonths, parseISO, isToday } from 'date-fns';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCalendarStore, useNotificationStore } from '@/app/store';
import { DEMO_CALENDAR_EVENTS } from '@/utils/sampleData';
import { generateId, formatDate } from '@/utils/helpers';
import type { CalendarEvent } from '@/types';

const EVENT_TYPES: { value: CalendarEvent['type']; label: string; color: string }[] = [
  { value: 'task', label: 'Task', color: '#8A7AE6' },
  { value: 'appointment', label: 'Appointment', color: '#5AAE9A' },
  { value: 'court', label: 'Court Date', color: '#C75D63' },
  { value: 'mediation', label: 'Mediation', color: '#8A7AE6' },
  { value: 'parenting', label: 'Parenting', color: '#5AAE9A' },
  { value: 'document', label: 'Document Review', color: '#5AAE9A' },
  { value: 'budget', label: 'Budget Review', color: '#C58A37' },
  { value: 'personal', label: 'Personal', color: '#777D8B' },
];

const defaultForm = {
  title: '', type: 'appointment' as CalendarEvent['type'],
  date: '', description: '', reminder: false,
};

export default function CalendarPage() {
  const { events, addEvent, updateEvent, removeEvent } = useCalendarStore();
  const { addNotification } = useNotificationStore();
  const allEvents = events.length > 0 ? [...events, ...DEMO_CALENDAR_EVENTS.filter(d => !events.find(e => e.id === d.id))] : DEMO_CALENDAR_EVENTS;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [view, setView] = useState<'month' | 'agenda'>('month');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  const dayEvents = (day: Date) => allEvents.filter(e => isSameDay(parseISO(e.date), day));
  const selectedEvents = selectedDay ? dayEvents(selectedDay) : [];

  const handleSave = () => {
    if (!form.title.trim() || !form.date) { toast.error('Title and date are required.'); return; }
    if (editEvent) {
      updateEvent(editEvent.id, { ...form });
      toast.success('Event updated');
    } else {
      const ev: CalendarEvent = { id: generateId(), ...form };
      addEvent(ev);
      if (form.reminder) {
        addNotification({ id: generateId(), type: 'calendar', title: 'Reminder set', message: `Reminder set for: ${form.title}`, read: false, created_at: new Date().toISOString() });
      }
      toast.success('Event added');
    }
    setAddOpen(false);
    setEditEvent(null);
    setForm(defaultForm);
  };

  const openEdit = (ev: CalendarEvent) => {
    setEditEvent(ev);
    setForm({ title: ev.title, type: ev.type, date: ev.date, description: ev.description ?? '', reminder: ev.reminder ?? false });
    setAddOpen(true);
  };

  const upcomingEvents = [...allEvents]
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10);

  const typeConfig = (type: CalendarEvent['type']) => EVENT_TYPES.find(t => t.value === type) ?? EVENT_TYPES[0];

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-text">Calendar</h1>
          <p className="text-secondary-text mt-1 text-sm">Track appointments, deadlines, and important dates.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 p-1 bg-background rounded-xl border border-border">
            {(['month', 'agenda'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className={clsx('px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all', view === v ? 'bg-white text-accent shadow-sm border border-border' : 'text-secondary-text')}>{v}</button>
            ))}
          </div>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setForm(defaultForm); setEditEvent(null); setAddOpen(true); }}>Add Event</Button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800">
        ⚠️ Only user-entered dates are shown. Never record legal court deadlines here without verifying with your solicitor — required legal deadlines vary by jurisdiction and may not match anything shown here.
      </div>

      {view === 'month' ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Month grid */}
          <div className="lg:col-span-2">
            <Card padding="sm">
              <div className="flex items-center justify-between p-3 mb-2">
                <button onClick={() => setCurrentDate(d => subMonths(d, 1))} className="p-1.5 rounded-lg hover:bg-border transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                <h2 className="font-semibold text-primary-text">{format(currentDate, 'MMMM yyyy')}</h2>
                <button onClick={() => setCurrentDate(d => addMonths(d, 1))} className="p-1.5 rounded-lg hover:bg-border transition-colors"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-7 gap-0">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-xs text-secondary-text font-medium py-1.5">{d}</div>
                ))}
                {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
                {days.map(day => {
                  const evs = dayEvents(day);
                  const isSelected = selectedDay && isSameDay(day, selectedDay);
                  const today = isToday(day);
                  return (
                    <button key={day.toISOString()} onClick={() => setSelectedDay(isSameDay(day, selectedDay ?? new Date(0)) ? null : day)}
                      className={clsx('relative p-1.5 rounded-xl text-center text-sm transition-all min-h-[44px] flex flex-col items-center',
                        isSelected ? 'bg-accent text-white' : today ? 'bg-accent-50 text-accent font-semibold' : 'hover:bg-background text-primary-text'
                      )}>
                      <span>{format(day, 'd')}</span>
                      {evs.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {evs.slice(0, 3).map((ev, i) => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isSelected ? 'white' : typeConfig(ev.type).color }} />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Day events */}
          <div>
            {selectedDay ? (
              <Card>
                <CardHeader action={<Button variant="secondary" size="xs" leftIcon={<Plus className="w-3 h-3" />} onClick={() => { setForm({ ...defaultForm, date: format(selectedDay, 'yyyy-MM-dd') }); setAddOpen(true); }}>Add</Button>}>
                  <CardTitle>{format(selectedDay, 'EEEE, MMM d')}</CardTitle>
                </CardHeader>
                {selectedEvents.length === 0 ? (
                  <p className="text-sm text-secondary-text text-center py-4">No events on this day.</p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedEvents.map(ev => (
                      <div key={ev.id} className="p-3 rounded-xl border-l-4 bg-background" style={{ borderColor: typeConfig(ev.type).color }}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-primary-text">{ev.title}</p>
                            {ev.description && <p className="text-xs text-secondary-text mt-0.5">{ev.description}</p>}
                            <Badge variant="neutral" className="mt-1.5 text-xs capitalize">{ev.type}</Badge>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => openEdit(ev)} className="p-1 rounded hover:bg-border text-secondary-text hover:text-accent"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={() => setDeleteId(ev.id)} className="p-1 rounded hover:bg-border text-secondary-text hover:text-error"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ) : (
              <Card className="bg-accent-50 border-accent-100">
                <CalIcon className="w-6 h-6 text-accent mx-auto mb-2" />
                <p className="text-sm text-center text-accent font-medium">Select a day</p>
                <p className="text-xs text-center text-accent/70 mt-1">Click any day to view or add events.</p>
              </Card>
            )}

            {/* Upcoming */}
            <div className="mt-4">
              <h3 className="text-sm font-medium text-secondary-text mb-2">Upcoming Events</h3>
              {upcomingEvents.length === 0 ? (
                <p className="text-xs text-secondary-text">No upcoming events.</p>
              ) : (
                <div className="space-y-2">
                  {upcomingEvents.slice(0, 5).map(ev => (
                    <div key={ev.id} className="flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-border text-xs">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: typeConfig(ev.type).color }} />
                      <span className="flex-1 truncate font-medium text-primary-text">{ev.title}</span>
                      <span className="text-secondary-text flex-shrink-0">{formatDate(ev.date, 'MMM d')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Agenda view */
        <div className="space-y-3">
          {upcomingEvents.length === 0 ? (
            <EmptyState icon={<CalIcon className="w-6 h-6" />} title="No upcoming events" description="Add important dates, appointments, and deadlines." action={<Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>Add Event</Button>} />
          ) : (
            upcomingEvents.map(ev => (
              <div key={ev.id} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-border hover:shadow-sm transition-all group">
                <div className="text-center flex-shrink-0 w-12">
                  <p className="text-xs text-secondary-text">{formatDate(ev.date, 'MMM').toUpperCase()}</p>
                  <p className="text-xl font-bold text-primary-text">{formatDate(ev.date, 'd')}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-primary-text">{ev.title}</h3>
                  {ev.description && <p className="text-xs text-secondary-text mt-0.5">{ev.description}</p>}
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="neutral" className="capitalize">{ev.type}</Badge>
                    {ev.reminder && <Bell className="w-3 h-3 text-secondary-text" />}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(ev)} className="p-1.5 rounded-lg text-secondary-text hover:text-accent hover:bg-border"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteId(ev.id)} className="p-1.5 rounded-lg text-secondary-text hover:text-error hover:bg-border"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={addOpen} onClose={() => { setAddOpen(false); setEditEvent(null); setForm(defaultForm); }} title={editEvent ? 'Edit Event' : 'Add Event'} size="md">
        <div className="space-y-4">
          <Input label="Event title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Lawyer consultation" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as CalendarEvent['type'] })} options={EVENT_TYPES.map(t => ({ value: t.value, label: t.label }))} />
            <Input label="Date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <Textarea label="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
          <label className="flex items-center gap-2 text-sm text-primary-text cursor-pointer">
            <input type="checkbox" checked={form.reminder} onChange={e => setForm({ ...form, reminder: e.target.checked })} className="rounded" />
            Set a reminder notification
          </label>
          <p className="text-xs text-secondary-text">⚠️ This is a personal planning tool. Do not use it to track legally required court deadlines without verifying with your solicitor.</p>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => { setAddOpen(false); setEditEvent(null); setForm(defaultForm); }}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>{editEvent ? 'Save Changes' : 'Add Event'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { if (deleteId) { removeEvent(deleteId); toast.success('Event deleted'); } }} title="Delete Event" message="Delete this event?" confirmLabel="Delete" danger />
    </div>
  );
}
