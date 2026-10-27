import { useState } from 'react';
import { Sunrise, CheckSquare, Square, Plus, Target, Home, Briefcase, Star } from 'lucide-react';
import clsx from 'clsx';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { generateId } from '@/utils/helpers';

const ADDRESS_CHANGE_ITEMS = [
  'Electoral roll / voter registration', 'HMRC / tax authority', 'Bank accounts',
  'Employer / payroll', 'DVLA / vehicle licensing', 'NHS / doctor',
  'Children\'s school(s)', 'Insurance policies', 'Subscriptions and memberships',
  'Pension providers', 'Utilities (if moving)', 'Royal Mail / Post Office redirection',
];

const MOVING_CHECKLIST = [
  'Research housing options and costs', 'Arrange a viewing', 'Apply for rental or mortgage',
  'Arrange removals or transport', 'Pack non-essentials first', 'Transfer or set up utilities',
  'Update your address (see checklist)', 'Set up new home essentials', 'Register with a local GP',
  'Introduce yourself to neighbours', 'Review contents insurance',
];

const GOALS_CATEGORIES = [
  { id: 'career', label: 'Career & Income', icon: <Briefcase className="w-4 h-4" /> },
  { id: 'home', label: 'Home & Housing', icon: <Home className="w-4 h-4" /> },
  { id: 'personal', label: 'Personal Growth', icon: <Target className="w-4 h-4" /> },
  { id: 'social', label: 'Social & Relationships', icon: <Star className="w-4 h-4" /> },
];

interface Goal {
  id: string; text: string; category: string; completed: boolean;
}

export default function LifeAfterPage() {
  const [addressChecked, setAddressChecked] = useState<Set<string>>(new Set());
  const [movingChecked, setMovingChecked] = useState<Set<string>>(new Set());
  const [goals, setGoals] = useState<Goal[]>([
    { id: 'g1', text: 'Research new housing in my preferred area', category: 'home', completed: false },
    { id: 'g2', text: 'Update my CV and explore career opportunities', category: 'career', completed: false },
  ]);
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ text: '', category: 'personal' });

  const toggleGoal = (id: string) => setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  const addGoal = () => {
    if (!newGoal.text.trim()) return;
    setGoals(prev => [...prev, { id: generateId(), ...newGoal, completed: false }]);
    setAddGoalOpen(false);
    setNewGoal({ text: '', category: 'personal' });
  };

  const toggle = (set: Set<string>, setFn: (s: Set<string>) => void, key: string) => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    setFn(next);
  };

  return (
    <div className="page-container space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-text">Life After Divorce</h1>
        <p className="text-secondary-text mt-1 text-sm">
          Plan your next chapter with practical steps and personal goals. Healing and rebuilding look different for everyone — there's no single right timeline.
        </p>
      </div>

      <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
        <p className="text-sm text-teal-700">
          <strong>A note on pace:</strong> There is no set schedule for rebuilding after separation. These tools are here to help you when you're ready — not to rush you into a timeline that doesn't fit your life.
        </p>
      </div>

      {/* Personal Goals */}
      <Card>
        <CardHeader action={<Button variant="secondary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setAddGoalOpen(true)}>Add Goal</Button>}>
          <CardTitle subtitle="Personal goals for your next chapter">My Goals</CardTitle>
        </CardHeader>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
          {GOALS_CATEGORIES.map(cat => {
            const catGoals = goals.filter(g => g.category === cat.id);
            const completed = catGoals.filter(g => g.completed).length;
            return (
              <div key={cat.id} className="p-3 bg-background rounded-xl border border-border">
                <div className="flex items-center gap-2 mb-1 text-secondary-text">{cat.icon}<span className="text-xs font-medium">{cat.label}</span></div>
                <p className="text-xs text-secondary-text">{completed}/{catGoals.length} done</p>
              </div>
            );
          })}
        </div>
        <div className="space-y-2">
          {goals.map(goal => {
            const cat = GOALS_CATEGORIES.find(c => c.id === goal.category);
            return (
              <button key={goal.id} onClick={() => toggleGoal(goal.id)} className={clsx('w-full flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all', goal.completed ? 'bg-teal-50 border-teal-100' : 'bg-background border-border hover:border-accent-200')}>
                {goal.completed ? <CheckSquare className="w-4 h-4 text-teal flex-shrink-0" /> : <Square className="w-4 h-4 text-border flex-shrink-0" />}
                <span className={clsx('text-sm flex-1', goal.completed && 'line-through text-secondary-text')}>{goal.text}</span>
                {cat && <span className="text-secondary-text flex-shrink-0">{cat.icon}</span>}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Address change checklist */}
      <Card>
        <CardHeader><CardTitle subtitle={`${addressChecked.size} of ${ADDRESS_CHANGE_ITEMS.length} updated`}>Address Change Checklist</CardTitle></CardHeader>
        <div className="grid sm:grid-cols-2 gap-2">
          {ADDRESS_CHANGE_ITEMS.map(item => (
            <button key={item} onClick={() => toggle(addressChecked, setAddressChecked, item)} className={clsx('flex items-center gap-2 p-2.5 rounded-lg border text-left text-sm transition-all', addressChecked.has(item) ? 'bg-teal-50 border-teal-100 text-teal-700' : 'bg-background border-border hover:border-accent-200 text-primary-text')}>
              {addressChecked.has(item) ? <CheckSquare className="w-4 h-4 text-teal flex-shrink-0" /> : <Square className="w-4 h-4 text-border flex-shrink-0" />}
              {item}
            </button>
          ))}
        </div>
        <p className="text-xs text-secondary-text mt-3 pt-3 border-t border-border">This list is based on common requirements. Additional items may apply depending on your country and situation.</p>
      </Card>

      {/* Moving checklist */}
      <Card>
        <CardHeader><CardTitle subtitle={`${movingChecked.size} of ${MOVING_CHECKLIST.length} done`}>Moving Planner</CardTitle></CardHeader>
        <div className="space-y-2">
          {MOVING_CHECKLIST.map(item => (
            <button key={item} onClick={() => toggle(movingChecked, setMovingChecked, item)} className={clsx('w-full flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all', movingChecked.has(item) ? 'bg-teal-50 border-teal-100' : 'bg-background border-border hover:border-accent-200')}>
              {movingChecked.has(item) ? <CheckSquare className="w-4 h-4 text-teal flex-shrink-0" /> : <Square className="w-4 h-4 text-border flex-shrink-0" />}
              <span className={clsx('text-sm', movingChecked.has(item) ? 'text-teal-700' : 'text-primary-text')}>{item}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Add Goal Modal */}
      <Modal isOpen={addGoalOpen} onClose={() => setAddGoalOpen(false)} title="Add a Goal" size="sm">
        <div className="space-y-4">
          <Input label="Goal" value={newGoal.text} onChange={e => setNewGoal({ ...newGoal, text: e.target.value })} placeholder="e.g. Find a new home" />
          <div>
            <label className="block text-sm font-medium text-primary-text mb-1.5">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {GOALS_CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setNewGoal({ ...newGoal, category: cat.id })} className={clsx('p-2.5 rounded-xl border-2 text-sm flex items-center gap-2 transition-all', newGoal.category === cat.id ? 'border-accent bg-accent-50 text-accent' : 'border-border bg-white text-secondary-text hover:border-accent-200')}>
                  {cat.icon}{cat.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end"><Button variant="ghost" onClick={() => setAddGoalOpen(false)}>Cancel</Button><Button variant="primary" onClick={addGoal}>Add Goal</Button></div>
        </div>
      </Modal>
    </div>
  );
}
