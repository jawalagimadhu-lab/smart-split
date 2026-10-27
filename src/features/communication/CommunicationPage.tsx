import { useState } from 'react';
import { MessageSquare, Plus, Copy, Trash2, Edit2, Save, Bot, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCommunicationStore, useAuthStore } from '@/app/store';
import { generateId, formatDate } from '@/utils/helpers';
import type { MessageDraft } from '@/types';

const TONES: MessageDraft['tone'][] = ['neutral', 'respectful', 'concise', 'formal', 'child_focused'];
const CATEGORIES: MessageDraft['category'][] = ['general', 'scheduling', 'mediation', 'legal', 'parenting'];

const TONE_DESCRIPTIONS: Record<MessageDraft['tone'], string> = {
  neutral: 'Factual and emotionally neutral',
  respectful: 'Polite and considerate tone',
  concise: 'Brief and to the point',
  formal: 'Professional and official language',
  child_focused: 'Centered on children\'s needs',
};

const TONE_BADGE: Record<MessageDraft['tone'], 'accent' | 'teal' | 'neutral' | 'success' | 'peach'> = {
  neutral: 'neutral', respectful: 'teal', concise: 'accent', formal: 'neutral', child_focused: 'teal',
};

// Demo AI tone rewriting (used when AI not connected)
const DEMO_REWRITES: Record<MessageDraft['tone'], (text: string) => string> = {
  neutral: (t) => `[Neutral rewrite — Demo] ${t.trim().replace(/!/g, '.').replace(/please|kindly/gi, '')}`,
  respectful: (t) => `[Respectful rewrite — Demo] I hope you are well. ${t.trim()} I appreciate your understanding.`,
  concise: (t) => `[Concise rewrite — Demo] ${t.trim().split('.')[0]}.`,
  formal: (t) => `[Formal rewrite — Demo] I am writing to communicate the following: ${t.trim()}`,
  child_focused: (t) => `[Child-focused rewrite — Demo] For the wellbeing of our child/children: ${t.trim()}`,
};

const defaultForm = {
  title: '',
  content: '',
  tone: 'neutral' as MessageDraft['tone'],
  category: 'general' as MessageDraft['category'],
};

export default function CommunicationPage() {
  const { drafts, addDraft, updateDraft, removeDraft } = useCommunicationStore();
  const [composeOpen, setComposeOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<MessageDraft | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [rewriting, setRewriting] = useState(false);
  const [rewriteResult, setRewriteResult] = useState('');

  const handleSave = () => {
    if (!form.content.trim()) { toast.error('Message content is required.'); return; }
    const now = new Date().toISOString();
    if (editDraft) {
      updateDraft(editDraft.id, { ...form, updated_at: now });
      toast.success('Draft updated');
    } else {
      addDraft({ id: generateId(), ...form, created_at: now, updated_at: now });
      toast.success('Draft saved');
    }
    setComposeOpen(false);
    setEditDraft(null);
    setForm(defaultForm);
    setRewriteResult('');
  };

  const handleRewrite = async () => {
    if (!form.content.trim()) { toast.error('Enter a message to rewrite.'); return; }
    setRewriting(true);
    await new Promise(r => setTimeout(r, 900));
    const rewritten = DEMO_REWRITES[form.tone](form.content);
    setRewriteResult(rewritten);
    setRewriting(false);
    toast.success('Rewrite generated (Demo mode)');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const openEdit = (draft: MessageDraft) => {
    setEditDraft(draft);
    setForm({ title: draft.title, content: draft.content, tone: draft.tone, category: draft.category });
    setRewriteResult('');
    setComposeOpen(true);
  };

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-text">Communication Hub</h1>
          <p className="text-secondary-text mt-1 text-sm">Draft, refine, and organize important communications.</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setForm(defaultForm); setEditDraft(null); setRewriteResult(''); setComposeOpen(true); }}>
          New Draft
        </Button>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 space-y-1">
          <p className="font-medium">Important</p>
          <p>• Messages are never sent automatically. You must copy, download, or send them yourself.</p>
          <p>• Saved drafts are not legally privileged or guaranteed to be admissible as evidence.</p>
          <p>• AI tone assistance in demo mode generates example rewrites only — not real AI suggestions.</p>
        </div>
      </div>

      {/* Tone guide */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {TONES.map(tone => (
          <div key={tone} className="p-3 bg-white rounded-xl border border-border text-center">
            <Badge variant={TONE_BADGE[tone]} className="mb-1 capitalize">{tone.replace('_', ' ')}</Badge>
            <p className="text-xs text-secondary-text">{TONE_DESCRIPTIONS[tone]}</p>
          </div>
        ))}
      </div>

      {/* Drafts list */}
      {drafts.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="w-8 h-8" />}
          title="No drafts yet"
          description="Create a draft message. Use AI tone tools to help find the right words."
          action={<Button variant="primary" size="sm" onClick={() => setComposeOpen(true)}>Create Your First Draft</Button>}
        />
      ) : (
        <div className="space-y-3">
          {drafts.map(draft => (
            <Card key={draft.id}>
              <div className="flex items-start gap-3">
                <MessageSquare className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm text-primary-text truncate">{draft.title || 'Untitled Draft'}</h3>
                    <Badge variant={TONE_BADGE[draft.tone]}>{draft.tone.replace('_', ' ')}</Badge>
                    <Badge variant="neutral">{draft.category}</Badge>
                  </div>
                  <p className="text-xs text-secondary-text line-clamp-2 mb-2">{draft.content}</p>
                  <p className="text-xs text-secondary-text">{formatDate(draft.updated_at)}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => handleCopy(draft.content)} className="p-1.5 rounded-lg text-secondary-text hover:text-accent hover:bg-border transition-colors" title="Copy"><Copy className="w-3.5 h-3.5" /></button>
                  <button onClick={() => openEdit(draft)} className="p-1.5 rounded-lg text-secondary-text hover:text-accent hover:bg-border transition-colors" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteId(draft.id)} className="p-1.5 rounded-lg text-secondary-text hover:text-error hover:bg-border transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Compose / Edit Modal */}
      <Modal isOpen={composeOpen} onClose={() => { setComposeOpen(false); setEditDraft(null); setForm(defaultForm); setRewriteResult(''); }} title={editDraft ? 'Edit Draft' : 'New Message Draft'} size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Draft title (optional)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Schedule change request" />
            <Select label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value as MessageDraft['category'] })} options={CATEGORIES.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))} />
          </div>

          <Textarea label="Your message" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write your message here..." rows={5} />

          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-primary-text">AI Tone Assistant</span>
              <Badge variant="neutral">Demo mode</Badge>
            </div>
            <Select label="Rewrite in tone:" value={form.tone} onChange={e => setForm({ ...form, tone: e.target.value as MessageDraft['tone'] })} options={TONES.map(t => ({ value: t, label: `${t.replace('_', ' ')} — ${TONE_DESCRIPTIONS[t]}` }))} />
            <Button variant="secondary" size="sm" leftIcon={<Bot className="w-3.5 h-3.5" />} onClick={handleRewrite} loading={rewriting}>
              {rewriting ? 'Rewriting...' : 'Rewrite with AI'}
            </Button>

            {rewriteResult && (
              <div className="bg-accent-50 rounded-xl p-4 border border-accent-100 animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-accent">AI Suggestion (Demo — review before using)</p>
                  <div className="flex gap-1">
                    <button onClick={() => handleCopy(rewriteResult)} className="text-xs text-accent hover:underline flex items-center gap-1"><Copy className="w-3 h-3" />Copy</button>
                    <button onClick={() => setForm({ ...form, content: rewriteResult })} className="text-xs text-accent hover:underline ml-2 flex items-center gap-1"><Save className="w-3 h-3" />Use this</button>
                  </div>
                </div>
                <p className="text-sm text-primary-text whitespace-pre-wrap">{rewriteResult}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => { setComposeOpen(false); setEditDraft(null); setForm(defaultForm); setRewriteResult(''); }}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>{editDraft ? 'Save Changes' : 'Save Draft'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { if (deleteId) { removeDraft(deleteId); toast.success('Draft deleted'); } }} title="Delete Draft" message="Delete this draft? This cannot be undone." confirmLabel="Delete" danger />
    </div>
  );
}
