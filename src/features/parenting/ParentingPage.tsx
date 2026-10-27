import { useState } from 'react';
import { Users, Plus, Calendar, DollarSign, Clock, MapPin, AlertTriangle, Baby } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { generateId, formatDate } from '@/utils/helpers';
import type { Child, ParentingEvent } from '@/types';

const EVENT_TYPES: ParentingEvent['type'][] = ['pickup', 'dropoff', 'school', 'medical', 'holiday', 'other'];

const SCHEDULE_TEMPLATES = [
  { id: 'alternate_weeks', name: 'Alternating Weeks', description: 'Children spend one week with each parent in rotation.' },
  { id: '2_2_3', name: '2-2-3 Rotation', description: 'Children spend 2 days, 2 days, then 3 days alternating between parents.' },
  { id: 'primary_residence', name: 'Primary Residence', description: 'Children primarily live with one parent, visiting the other on agreed days.' },
  { id: 'shared_equal', name: 'Equal Time Split', description: '50/50 arrangement, often split by month or term.' },
];

export default function ParentingPage() {
  const [children, setChildren] = useState<Child[]>([
    { id: 'c1', name: 'Sam', date_of_birth: '2018-03-15', school: 'Maple Primary School' },
  ]);
  const [events, setEvents] = useState<ParentingEvent[]>([
    { id: 'pe1', title: "Sam's school parent evening", type: 'school', child_id: 'c1', start_date: '2026-11-12', location: 'Maple Primary School' },
    { id: 'pe2', title: 'Pickup — Sam', type: 'pickup', child_id: 'c1', start_date: '2026-11-07', location: 'School gate' },
    { id: 'pe3', title: 'Doctor appointment', type: 'medical', child_id: 'c1', start_date: '2026-11-19' },
  ]);
  const [addChildOpen, setAddChildOpen] = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [childForm, setChildForm] = useState({ name: '', date_of_birth: '', school: '' });
  const [eventForm, setEventForm] = useState({ title: '', type: 'school' as ParentingEvent['type'], child_id: '', start_date: '', location: '', notes: '' });

  const addChild = () => {
    if (!childForm.name.trim()) { toast.error('Enter the child\'s name.'); return; }
    setChildren(prev => [...prev, { id: generateId(), ...childForm }]);
    toast.success('Child added');
    setAddChildOpen(false);
    setChildForm({ name: '', date_of_birth: '', school: '' });
  };

  const addEvent = () => {
    if (!eventForm.title.trim() || !eventForm.start_date) { toast.error('Title and date are required.'); return; }
    setEvents(prev => [...prev, { id: generateId(), ...eventForm }]);
    toast.success('Event added');
    setAddEventOpen(false);
    setEventForm({ title: '', type: 'school', child_id: '', start_date: '', location: '', notes: '' });
  };

  const typeColors: Record<ParentingEvent['type'], string> = {
    pickup: 'bg-teal-50 text-teal border-teal-100',
    dropoff: 'bg-teal-50 text-teal border-teal-100',
    school: 'bg-accent-50 text-accent border-accent-100',
    medical: 'bg-red-50 text-error border-red-100',
    holiday: 'bg-amber-50 text-warning border-amber-100',
    other: 'bg-border text-secondary-text border-border',
  };

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-text">Parenting & Custody Hub</h1>
          <p className="text-secondary-text mt-1 text-sm">Coordinate parenting events, schedules, and planning.</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setAddEventOpen(true)}>Add Event</Button>
      </div>

      {/* Important notice */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 space-y-1">
          <p className="font-medium">Important reminders</p>
          <p>• Plans created here are personal proposals only — not legally approved court orders.</p>
          <p>• Always have any parenting arrangement reviewed by a qualified family solicitor.</p>
          <p>• If there are safety concerns, please visit the Safety & Support section.</p>
        </div>
      </div>

      {/* Children */}
      <Card>
        <CardHeader action={<Button variant="secondary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setAddChildOpen(true)}>Add Child</Button>}>
          <CardTitle subtitle="Children's profiles">Children</CardTitle>
        </CardHeader>
        {children.length === 0 ? (
          <EmptyState icon={<Baby className="w-6 h-6" />} title="No children added" description="Add your children's profiles to track parenting events and schedules." action={<Button variant="secondary" size="sm" onClick={() => setAddChildOpen(true)}>Add a Child</Button>} />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {children.map(child => {
              const age = child.date_of_birth ? Math.floor((Date.now() - new Date(child.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
              return (
                <div key={child.id} className="flex items-center gap-3 p-3.5 bg-background rounded-xl border border-border">
                  <div className="w-10 h-10 bg-accent-50 text-accent rounded-full flex items-center justify-center font-semibold text-sm">{child.name[0].toUpperCase()}</div>
                  <div>
                    <p className="font-medium text-sm text-primary-text">{child.name}</p>
                    <p className="text-xs text-secondary-text">{age !== null ? `Age ${age}` : ''}{child.school ? ` · ${child.school}` : ''}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader action={<Button variant="secondary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setAddEventOpen(true)}>Add Event</Button>}>
          <CardTitle subtitle="Upcoming parenting calendar">Events & Schedule</CardTitle>
        </CardHeader>
        {events.length === 0 ? (
          <EmptyState icon={<Calendar className="w-6 h-6" />} title="No events yet" description="Add pickups, school events, appointments, and holidays." action={<Button variant="secondary" size="sm" onClick={() => setAddEventOpen(true)}>Add First Event</Button>} />
        ) : (
          <div className="space-y-2.5">
            {[...events].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()).map(ev => {
              const child = children.find(c => c.id === ev.child_id);
              return (
                <div key={ev.id} className={clsx('flex items-start gap-3 p-3.5 rounded-xl border', typeColors[ev.type])}>
                  <div className="mt-0.5 flex-shrink-0">
                    {ev.type === 'school' ? <Users className="w-4 h-4" /> : ev.type === 'medical' ? <Clock className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-primary-text">{ev.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(ev.start_date)}</span>
                      {ev.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.location}</span>}
                      {child && <span>{child.name}</span>}
                    </div>
                  </div>
                  <Badge variant="neutral">{ev.type}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Schedule Templates */}
      <Card>
        <CardHeader><CardTitle subtitle="Common parenting schedule patterns — these are examples only, not legal advice">Schedule Templates</CardTitle></CardHeader>
        <div className="grid sm:grid-cols-2 gap-3">
          {SCHEDULE_TEMPLATES.map(template => (
            <div key={template.id} className="p-4 bg-background rounded-xl border border-border hover:border-accent-200 transition-colors cursor-pointer" onClick={() => toast('This template is for reference only. Work with a solicitor to formalize parenting arrangements.', { icon: 'ℹ️' })}>
              <p className="font-medium text-sm text-primary-text mb-1">{template.name}</p>
              <p className="text-xs text-secondary-text">{template.description}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-secondary-text mt-4 pt-3 border-t border-border">
          These templates are for planning reference only. Any formal parenting arrangement should be agreed with legal advice and, where appropriate, approved by a court.
        </p>
      </Card>

      {/* Add Child Modal */}
      <Modal isOpen={addChildOpen} onClose={() => setAddChildOpen(false)} title="Add Child" size="sm">
        <div className="space-y-4">
          <Input label="Child's name" value={childForm.name} onChange={e => setChildForm({ ...childForm, name: e.target.value })} placeholder="First name" />
          <Input label="Date of birth (optional)" type="date" value={childForm.date_of_birth} onChange={e => setChildForm({ ...childForm, date_of_birth: e.target.value })} />
          <Input label="School (optional)" value={childForm.school} onChange={e => setChildForm({ ...childForm, school: e.target.value })} placeholder="School name" />
          <p className="text-xs text-secondary-text">Only enter information you're comfortable storing. Date of birth is used only to calculate age.</p>
          <div className="flex gap-3 justify-end"><Button variant="ghost" onClick={() => setAddChildOpen(false)}>Cancel</Button><Button variant="primary" onClick={addChild}>Add Child</Button></div>
        </div>
      </Modal>

      {/* Add Event Modal */}
      <Modal isOpen={addEventOpen} onClose={() => setAddEventOpen(false)} title="Add Parenting Event" size="md">
        <div className="space-y-4">
          <Input label="Event title" value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} placeholder="e.g. School pickup" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Event type" value={eventForm.type} onChange={e => setEventForm({ ...eventForm, type: e.target.value as ParentingEvent['type'] })} options={EVENT_TYPES.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))} />
            <Select label="Child" value={eventForm.child_id} onChange={e => setEventForm({ ...eventForm, child_id: e.target.value })} options={[{ value: '', label: 'All children' }, ...children.map(c => ({ value: c.id, label: c.name }))]} />
          </div>
          <Input label="Date" type="date" value={eventForm.start_date} onChange={e => setEventForm({ ...eventForm, start_date: e.target.value })} />
          <Input label="Location (optional)" value={eventForm.location} onChange={e => setEventForm({ ...eventForm, location: e.target.value })} placeholder="e.g. School gate" />
          <Textarea label="Notes (optional)" value={eventForm.notes} onChange={e => setEventForm({ ...eventForm, notes: e.target.value })} rows={2} />
          <div className="flex gap-3 justify-end"><Button variant="ghost" onClick={() => setAddEventOpen(false)}>Cancel</Button><Button variant="primary" onClick={addEvent}>Add Event</Button></div>
        </div>
      </Modal>
    </div>
  );
}
