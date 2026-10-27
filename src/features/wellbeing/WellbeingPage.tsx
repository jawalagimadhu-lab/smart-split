import { useState } from 'react';
import { Heart, BookOpen, Wind, Smile, Plus, Trash2, Search, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { useWellbeingStore } from '@/app/store';
import { BREATHING_EXERCISES, REFLECTION_PROMPTS } from '@/utils/sampleData';
import { generateId, formatDate, timeAgo } from '@/utils/helpers';
import type { JournalEntry, MoodEntry } from '@/types';

type Tab = 'mood' | 'journal' | 'exercises' | 'reflections';

const MOOD_LABELS: Record<number, { label: string; emoji: string; color: string }> = {
  1: { label: 'Very Difficult', emoji: '😔', color: 'bg-red-100 text-error border-red-200' },
  2: { label: 'Difficult', emoji: '😕', color: 'bg-amber-100 text-warning border-amber-200' },
  3: { label: 'Neutral', emoji: '😐', color: 'bg-border text-secondary-text border-border' },
  4: { label: 'Okay', emoji: '🙂', color: 'bg-teal-100 text-teal border-teal-200' },
  5: { label: 'Good', emoji: '😊', color: 'bg-accent-100 text-accent border-accent-200' },
};

export default function WellbeingPage() {
  const { journalEntries, moodHistory, addJournalEntry, updateJournalEntry, removeJournalEntry, addMoodEntry } = useWellbeingStore();
  const [tab, setTab] = useState<Tab>('mood');
  const [journalOpen, setJournalOpen] = useState(false);
  const [editJournal, setEditJournal] = useState<JournalEntry | null>(null);
  const [deleteJournalId, setDeleteJournalId] = useState<string | null>(null);
  const [journalSearch, setJournalSearch] = useState('');
  const [journalForm, setJournalForm] = useState({ title: '', content: '' });
  const [todayMood, setTodayMood] = useState<number | null>(null);
  const [moodNotes, setMoodNotes] = useState('');
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const [exerciseStep, setExerciseStep] = useState(0);

  const todayKey = new Date().toDateString();
  const todayEntry = moodHistory.find(m => new Date(m.date).toDateString() === todayKey);

  const handleMoodSave = () => {
    if (!todayMood) { toast.error('Select a mood first.'); return; }
    addMoodEntry({ id: generateId(), date: new Date().toISOString(), mood: todayMood as MoodEntry['mood'], notes: moodNotes });
    setTodayMood(null);
    setMoodNotes('');
    toast.success('Mood check-in saved');
  };

  const handleJournalSave = () => {
    if (!journalForm.content.trim()) { toast.error('Write something first.'); return; }
    if (editJournal) {
      updateJournalEntry(editJournal.id, { ...journalForm, updated_at: new Date().toISOString() });
      toast.success('Entry updated');
    } else {
      addJournalEntry({ id: generateId(), title: journalForm.title || formatDate(new Date().toISOString()), content: journalForm.content, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), tags: [] });
      toast.success('Journal entry saved');
    }
    setJournalOpen(false);
    setEditJournal(null);
    setJournalForm({ title: '', content: '' });
  };

  const filteredJournal = journalEntries.filter(e => !journalSearch || e.title.toLowerCase().includes(journalSearch.toLowerCase()) || e.content.toLowerCase().includes(journalSearch.toLowerCase()));

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'mood', label: 'Mood', icon: <Smile className="w-4 h-4" /> },
    { id: 'journal', label: 'Journal', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'exercises', label: 'Exercises', icon: <Wind className="w-4 h-4" /> },
    { id: 'reflections', label: 'Reflections', icon: <Heart className="w-4 h-4" /> },
  ];

  return (
    <div className="page-container space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-text">Wellbeing Center</h1>
        <p className="text-secondary-text mt-1 text-sm">A private, compassionate space for your emotional health. Optional and completely confidential.</p>
      </div>

      <div className="bg-teal-50 border border-teal-100 rounded-xl p-3.5 flex items-start gap-2.5">
        <Heart className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
        <p className="text-xs text-teal-700">This section is private to you. Smart Split does not provide therapy or mental health treatment. If you are in crisis or need immediate support, please contact emergency services or a crisis helpline in your area.</p>
      </div>

      {/* Crisis resources always visible */}
      <div className="bg-red-50 border border-red-100 rounded-xl p-3.5">
        <p className="text-xs font-medium text-error mb-2">If you're in immediate danger or experiencing a mental health crisis:</p>
        <div className="grid sm:grid-cols-2 gap-2 text-xs text-red-700">
          <p>🆘 <strong>Emergency:</strong> Call 999 (UK) / 911 (US) / 000 (AU)</p>
          <p>📞 <strong>Crisis line:</strong> 988 (US) / 116 123 Samaritans (UK)</p>
          <p>💬 <strong>Crisis text:</strong> Text HOME to 741741 (US/UK)</p>
          <p>🌐 <strong>More resources:</strong> Search "crisis line [your country]"</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-background rounded-xl border border-border">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={clsx('flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm font-medium transition-all', tab === t.id ? 'bg-white text-accent shadow-sm border border-border' : 'text-secondary-text hover:text-primary-text')}>
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Mood Check-in */}
      {tab === 'mood' && (
        <div className="space-y-5">
          <Card>
            <CardTitle subtitle="Optional — completely private">Today's Check-in</CardTitle>
            {todayEntry ? (
              <div className={clsx('mt-4 p-4 rounded-xl border', MOOD_LABELS[todayEntry.mood].color)}>
                <p className="text-sm font-medium">Today's mood: {MOOD_LABELS[todayEntry.mood].emoji} {MOOD_LABELS[todayEntry.mood].label}</p>
                {todayEntry.notes && <p className="text-xs mt-1 opacity-80">{todayEntry.notes}</p>}
                <p className="text-xs mt-1 opacity-70">{timeAgo(todayEntry.date)}</p>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-secondary-text">How are you feeling today?</p>
                <div className="flex gap-2 flex-wrap">
                  {([5, 4, 3, 2, 1] as const).map(m => (
                    <button key={m} onClick={() => setTodayMood(m)} className={clsx('flex-1 min-w-[70px] p-3 rounded-xl border-2 transition-all text-center', todayMood === m ? MOOD_LABELS[m].color : 'border-border hover:border-accent-200 bg-white')}>
                      <div className="text-xl">{MOOD_LABELS[m].emoji}</div>
                      <div className="text-xs mt-1">{MOOD_LABELS[m].label}</div>
                    </button>
                  ))}
                </div>
                {todayMood && (
                  <div className="animate-fade-in space-y-3">
                    <Textarea label="Any notes? (optional)" value={moodNotes} onChange={e => setMoodNotes(e.target.value)} placeholder="What's on your mind today?" rows={2} />
                    <Button variant="teal" size="sm" onClick={handleMoodSave}>Save Check-in</Button>
                  </div>
                )}
              </div>
            )}
          </Card>

          {moodHistory.length > 0 && (
            <Card>
              <CardTitle subtitle="Recent mood history">Mood History</CardTitle>
              <div className="mt-4 space-y-2">
                {moodHistory.slice(0, 7).map(entry => (
                  <div key={entry.id} className={clsx('flex items-center gap-3 p-2.5 rounded-xl border', MOOD_LABELS[entry.mood].color)}>
                    <span className="text-lg">{MOOD_LABELS[entry.mood].emoji}</span>
                    <div className="flex-1"><p className="text-xs font-medium">{MOOD_LABELS[entry.mood].label}</p>{entry.notes && <p className="text-xs opacity-70 truncate">{entry.notes}</p>}</div>
                    <p className="text-xs opacity-70">{formatDate(entry.date, 'MMM d')}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Journal */}
      {tab === 'journal' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
              <input value={journalSearch} onChange={e => setJournalSearch(e.target.value)} placeholder="Search journal..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white" />
            </div>
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setJournalForm({ title: '', content: '' }); setEditJournal(null); setJournalOpen(true); }}>New Entry</Button>
          </div>

          {filteredJournal.length === 0 ? (
            <EmptyState icon={<BookOpen className="w-6 h-6" />} title="Your journal is empty" description="Writing can help process difficult emotions. Your entries are completely private." action={<Button variant="primary" size="sm" onClick={() => setJournalOpen(true)}>Write Your First Entry</Button>} />
          ) : (
            <div className="space-y-3">
              {filteredJournal.map(entry => (
                <Card key={entry.id} hover onClick={() => { setEditJournal(entry); setJournalForm({ title: entry.title, content: entry.content }); setJournalOpen(true); }}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-sm text-primary-text">{entry.title}</h3>
                    <button onClick={e => { e.stopPropagation(); setDeleteJournalId(entry.id); }} className="p-1 rounded text-secondary-text hover:text-error transition-colors ml-2">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-secondary-text line-clamp-2">{entry.content}</p>
                  <p className="text-xs text-secondary-text mt-2">{timeAgo(entry.created_at)}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Breathing Exercises */}
      {tab === 'exercises' && (
        <div className="space-y-4">
          <p className="text-sm text-secondary-text">These exercises can help manage stress and anxiety. They are not a substitute for professional mental health care.</p>
          {BREATHING_EXERCISES.map(ex => (
            <Card key={ex.id}>
              <CardHeader action={<Badge variant="neutral">{ex.duration}</Badge>}>
                <CardTitle subtitle={ex.description}>{ex.name}</CardTitle>
              </CardHeader>
              {activeExercise === ex.id ? (
                <div className="space-y-3 animate-fade-in">
                  <div className="bg-accent-50 rounded-xl p-4 border border-accent-100 text-center">
                    <p className="text-sm font-medium text-accent mb-2">Step {exerciseStep + 1} of {ex.steps.length}</p>
                    <p className="text-base font-semibold text-primary-text">{ex.steps[exerciseStep]}</p>
                    <div className="flex justify-center gap-2 mt-4">
                      {ex.steps.map((_, i) => <div key={i} className={clsx('w-2 h-2 rounded-full', i === exerciseStep ? 'bg-accent' : 'bg-border')} />)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setExerciseStep(s => Math.max(0, s - 1))} disabled={exerciseStep === 0}>← Back</Button>
                    {exerciseStep < ex.steps.length - 1
                      ? <Button variant="teal" size="sm" onClick={() => setExerciseStep(s => s + 1)}>Next →</Button>
                      : <Button variant="teal" size="sm" onClick={() => { setActiveExercise(null); setExerciseStep(0); toast.success('Exercise complete!'); }}>Finish ✓</Button>
                    }
                    <Button variant="ghost" size="sm" className="ml-auto" onClick={() => { setActiveExercise(null); setExerciseStep(0); }}>Stop</Button>
                  </div>
                </div>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => { setActiveExercise(ex.id); setExerciseStep(0); }}>Start Exercise</Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Reflection Prompts */}
      {tab === 'reflections' && (
        <div className="space-y-3">
          <p className="text-sm text-secondary-text">Use these prompts to guide your reflection. Tap any prompt to use it as a journal entry.</p>
          {REFLECTION_PROMPTS.map((prompt, i) => (
            <button key={i} onClick={() => { setJournalForm({ title: '', content: prompt }); setEditJournal(null); setJournalOpen(true); setTab('journal'); }}
              className="w-full text-left p-4 bg-white rounded-xl border border-border hover:border-accent-200 hover:shadow-sm transition-all">
              <span className="text-accent mr-2">✦</span>
              <span className="text-sm text-primary-text">{prompt}</span>
            </button>
          ))}
        </div>
      )}

      {/* Journal Modal */}
      <Modal isOpen={journalOpen} onClose={() => { setJournalOpen(false); setEditJournal(null); setJournalForm({ title: '', content: '' }); }} title={editJournal ? 'Edit Journal Entry' : 'New Journal Entry'} size="lg">
        <div className="space-y-4">
          <Input label="Title (optional)" value={journalForm.title} onChange={e => setJournalForm({ ...journalForm, title: e.target.value })} placeholder={formatDate(new Date().toISOString())} />
          <Textarea label="Your thoughts" value={journalForm.content} onChange={e => setJournalForm({ ...journalForm, content: e.target.value })} placeholder="Write freely — this is private and only visible to you..." rows={8} />
          <p className="text-xs text-secondary-text">Your journal entries are stored locally and are completely private to you.</p>
          <div className="flex gap-3 justify-end"><Button variant="ghost" onClick={() => setJournalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleJournalSave}>{editJournal ? 'Save Changes' : 'Save Entry'}</Button></div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteJournalId} onClose={() => setDeleteJournalId(null)} onConfirm={() => { if (deleteJournalId) { removeJournalEntry(deleteJournalId); toast.success('Entry deleted'); } }} title="Delete Journal Entry" message="Delete this journal entry? It cannot be recovered." confirmLabel="Delete" danger />
    </div>
  );
}
