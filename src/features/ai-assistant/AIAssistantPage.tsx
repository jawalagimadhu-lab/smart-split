import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bot, Send, Plus, Trash2, RefreshCw, Copy, ThumbsUp,
  ThumbsDown, StopCircle, Sparkles, AlertTriangle, CheckCircle2,
  XCircle, WifiOff, Edit2, Timer, Zap, FileSearch
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useChatStore, useAuthStore } from '@/app/store';
import { chatApi } from '@/services/api';
import { generateId, timeAgo } from '@/utils/helpers';
import { SUGGESTED_AI_PROMPTS } from '@/utils/sampleData';
import type { Conversation, Message, AIStatus } from '@/types';

// ── Demo responses ───────────────────────────────────────────
const DEMO_RESPONSES: Record<string, string> = {
  default: `I'm Smart Split AI, running in **demo mode** — Ollama is not connected.

In demo mode I show how the interface works but cannot generate real AI responses.

**To enable full AI:**
1. Install Ollama: [ollama.com](https://ollama.com)
2. Start it: \`ollama serve\`
3. Pull Mistral: \`ollama pull mistral\`
4. Start the backend: \`uvicorn main:app --reload\`

*Smart Split provides educational information only. Always consult a qualified legal professional.*`,

  documents: `Here are the key documents to organize when separating:

**Identity & Marriage**
- Passport or national ID
- Marriage certificate (original preferred)
- Birth certificates (yours and children's)
- Prenuptial or cohabitation agreements

**Financial**
- Bank statements (3 years)
- Tax returns (3 years)
- Pay slips / proof of income
- Pension statements
- Investment account statements
- Property deeds or mortgage statements

**Other**
- Insurance policies
- Debt statements (credit cards, loans)
- Utility bills (proof of address)

*Your lawyer may request additional documents specific to your situation.*`,

  process: `The divorce process varies significantly by country. Here's a general overview:

**Typical stages:**
1. **Decision** — One or both parties decide to divorce
2. **Legal filing** — A petition or application is filed with the court
3. **Financial disclosure** — Both parties declare assets, income, and debts
4. **Negotiations** — Reaching agreement on property, support, and children
5. **Court proceedings** — If agreement isn't reached, a judge decides
6. **Final order** — The court issues the divorce decree

**Important:** Laws and procedures differ between countries and regions. Consult a qualified family lawyer for advice specific to your situation.`,

  lawyer: `Important questions to ask a family lawyer:

**About the process:**
- What divorce process applies to my situation?
- How long might this take?
- What paperwork will I need?

**About finances:**
- How is property likely to be divided?
- What am I entitled to from joint assets?
- How is spousal support calculated?

**About children:**
- What parenting arrangements are typical here?
- How is child support calculated?

**About costs:**
- What are your fees?
- What is a realistic estimate of total costs?
- Are there mediation alternatives?

*Many lawyers offer a fixed-price initial consultation. Bring your key documents.*`,

  budget: `Creating a post-separation budget:

**Step 1: Income**
- Take-home salary after tax
- Benefits or support payments
- Investment income

**Step 2: Essential expenses**
- Housing (rent or mortgage — this will likely change)
- Utilities and internet
- Food and groceries
- Transport
- Insurance
- Children's expenses

**Step 3: One-time costs**
- Moving costs
- Security deposit
- New furniture
- Legal fees

**Step 4: Safety net**
- Aim for 3–6 months of expenses as emergency fund

Use the Financial Planner section to build your detailed budget.`,
};

function getDemoResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('document') || lower.includes('paperwork') || lower.includes('file'))
    return DEMO_RESPONSES.documents;
  if (lower.includes('process') || lower.includes('procedure') || lower.includes('how does') || lower.includes('step'))
    return DEMO_RESPONSES.process;
  if (lower.includes('lawyer') || lower.includes('solicitor') || lower.includes('attorney') || lower.includes('question'))
    return DEMO_RESPONSES.lawyer;
  if (lower.includes('budget') || lower.includes('money') || lower.includes('expense') || lower.includes('cost'))
    return DEMO_RESPONSES.budget;
  return DEMO_RESPONSES.default;
}

// Simple markdown renderer — keeps it lightweight
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-background px-1 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-accent underline">$1</a>')
    .replace(/^#{1,3} (.+)/gm, '<strong class="block text-sm font-semibold text-primary-text mt-3 mb-1">$1</strong>')
    .replace(/^- (.+)/gm, '<li class="ml-4 list-disc text-sm leading-relaxed">$1</li>')
    .replace(/^\d+\. (.+)/gm, '<li class="ml-4 list-decimal text-sm leading-relaxed">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

// ── Timing display component ──────────────────────────────────
interface StreamMeta { ttft_ms?: number; timing_ms?: number; token_count?: number }
function TimingBadge({ meta }: { meta: StreamMeta }) {
  if (!meta.timing_ms) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-secondary-text/60 ml-2">
      <Timer className="w-3 h-3" />
      {meta.timing_ms < 1000 ? `${meta.timing_ms}ms` : `${(meta.timing_ms / 1000).toFixed(1)}s`}
      {meta.token_count ? ` · ${meta.token_count} tokens` : ''}
    </span>
  );
}

export default function AIAssistantPage() {
  const [searchParams] = useSearchParams();
  const { token } = useAuthStore();
  const {
    conversations, activeConversationId, messages, aiStatus, isStreaming,
    setConversations, setActiveConversation, addConversation, removeConversation,
    setMessages, addMessage, updateLastMessage, setAiStatus, setStreaming,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteConvId, setDeleteConvId] = useState<string | null>(null);
  const [useRag, setUseRag] = useState(false);
  // Per-message streaming metadata
  const [streamMeta, setStreamMeta] = useState<StreamMeta>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Used to tell the backend to cancel — we also abort the fetch
  const abortCtrlRef = useRef<AbortController | null>(null);
  const activeConvIdRef = useRef<string | null>(null);

  const isDemo = !token || token === 'demo-token';
  const activeMessages = activeConversationId
    ? (messages[activeConversationId] ?? [])
    : [];

  // Keep ref in sync for use inside async callbacks
  useEffect(() => { activeConvIdRef.current = activeConversationId; }, [activeConversationId]);

  // Scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  useEffect(() => { scrollToBottom(); }, [activeMessages.length, scrollToBottom]);

  // ── On mount: check AI status and load conversation list ───
  useEffect(() => {
    checkAiStatus();
    if (!isDemo) loadConversations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── Handle prompt passed via URL ───────────────────────────
  useEffect(() => {
    const prompt = searchParams.get('prompt');
    if (prompt && !activeConversationId) {
      handleNewConversation(prompt);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAiStatus = async () => {
    if (isDemo) {
      setAiStatus({
        connected: false,
        model: 'mistral',
        status: 'unavailable',
        message: 'Demo mode — Ollama not connected. Predefined educational responses shown.',
      });
      return;
    }
    setAiStatus({ connected: false, model: 'mistral', status: 'connecting', message: 'Checking connection...' });
    try {
      const status = await chatApi.status(token!) as AIStatus;
      setAiStatus(status);
    } catch {
      setAiStatus({
        connected: false,
        model: 'mistral',
        status: 'unavailable',
        message: 'Cannot reach backend. Is it running on port 8000?',
      });
    }
  };

  // Load conversation list from backend and merge with local state
  const loadConversations = async () => {
    if (!token || isDemo) return;
    try {
      const data = await chatApi.conversations(token) as Conversation[];
      setConversations(data);
    } catch (err) {
      // Non-fatal — local state may still be valid
      console.warn('Could not load conversations from backend:', err);
    }
  };

  // Load messages for a conversation from backend
  const loadMessages = async (convId: string) => {
    if (!token || isDemo) return;
    try {
      const data = await chatApi.messages(convId, token) as Message[];
      setMessages(convId, data);
    } catch (err) {
      console.warn('Could not load messages:', err);
    }
  };

  const handleSelectConversation = async (id: string) => {
    setActiveConversation(id);
    // Only fetch if we don't already have messages for this conversation
    if (!messages[id] || messages[id].length === 0) {
      await loadMessages(id);
    }
  };

  const handleNewConversation = async (initialPrompt?: string) => {
    const title = initialPrompt
      ? initialPrompt.slice(0, 50) + (initialPrompt.length > 50 ? '…' : '')
      : 'New conversation';

    let convId: string;

    if (!isDemo) {
      try {
        const created = await chatApi.createConversation(title, token!) as Conversation;
        addConversation(created);
        convId = created.id;
      } catch {
        // Fallback to local-only conversation
        convId = generateId();
        addConversation({ id: convId, title, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), message_count: 0 });
      }
    } else {
      convId = generateId();
      addConversation({ id: convId, title, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), message_count: 0 });
    }

    setActiveConversation(convId);
    setMessages(convId, []);
    if (initialPrompt) {
      setTimeout(() => sendMessage(initialPrompt, convId), 100);
    }
  };

  const sendMessage = async (text?: string, convId?: string) => {
    const messageText = (text ?? input).trim();
    const conversationId = convId ?? activeConversationId;
    if (!messageText || !conversationId || isStreaming) return;
    if (!text) setInput('');
    setStreamMeta({});

    const userMsg: Message = {
      id: generateId(),
      conversation_id: conversationId,
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
    };
    addMessage(conversationId, userMsg);

    const aiPlaceholder: Message = {
      id: generateId(),
      conversation_id: conversationId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      is_streaming: true,
    };
    addMessage(conversationId, aiPlaceholder);
    setStreaming(true);

    // ── Demo mode ────────────────────────────────────────────
    if (isDemo || !aiStatus.connected) {
      setTimeout(() => {
        updateLastMessage(conversationId, getDemoResponse(messageText), true);
        setStreaming(false);
        setStreamMeta({ timing_ms: 800 + Math.floor(Math.random() * 400) });
      }, 800 + Math.random() * 600);
      return;
    }

    // ── Real streaming ───────────────────────────────────────
    abortCtrlRef.current = new AbortController();
    const localMeta: StreamMeta = {};

    try {
      const response = await chatApi.chat(conversationId, messageText, token!, useRag);

      if (!response.ok) {
        throw new Error(`Server error ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        // Check if stop was requested
        if (abortCtrlRef.current.signal.aborted) break;

        const { done, value } = await reader.read();
        if (done) break;

        const raw = decoder.decode(value, { stream: true });
        for (const line of raw.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            updateLastMessage(conversationId, accumulated, true);
            setStreaming(false);
            setStreamMeta({ ...localMeta });
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              accumulated += parsed.content;
              updateLastMessage(conversationId, accumulated, false);
            }
            if (parsed.ttft_ms) localMeta.ttft_ms = parsed.ttft_ms;
            if (parsed.timing_ms) localMeta.timing_ms = parsed.timing_ms;
            if (parsed.token_count) localMeta.token_count = parsed.token_count;
            if (parsed.error) {
              updateLastMessage(conversationId, `⚠️ ${parsed.error}`, true);
              setStreaming(false);
              return;
            }
            if (parsed.cancelled) {
              updateLastMessage(conversationId, accumulated + '\n\n*(generation stopped)*', true);
              setStreaming(false);
              return;
            }
          } catch { /* ignore malformed SSE lines */ }
        }
      }
      // Stream ended without [DONE] (e.g. aborted)
      updateLastMessage(conversationId, accumulated || '*(generation stopped)*', true);
      setStreamMeta({ ...localMeta });

    } catch (err: unknown) {
      if ((err as { name?: string })?.name === 'AbortError') {
        updateLastMessage(conversationId, '*(generation stopped)*', true);
      } else {
        const msg = err instanceof Error ? err.message : 'AI request failed.';
        updateLastMessage(conversationId, `⚠️ ${msg}`, true);
        toast.error('AI request failed. Is Ollama running?');
      }
    } finally {
      setStreaming(false);
      abortCtrlRef.current = null;
    }
  };

  const handleStop = async () => {
    // Abort the fetch read loop
    abortCtrlRef.current?.abort();
    // Also tell the backend to cancel the Ollama stream
    if (activeConversationId && token && !isDemo) {
      try {
        await chatApi.cancelStream(activeConversationId, token);
      } catch { /* best-effort */ }
    }
    setStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      activeConversationId ? sendMessage() : handleNewConversation(input);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleRename = async (id: string) => {
    const newTitle = renameValue.trim();
    if (!newTitle) { setRenamingId(null); return; }
    // Optimistic local update
    setConversations(conversations.map(c => c.id === id ? { ...c, title: newTitle } : c));
    setRenamingId(null);
    // Persist to backend
    if (!isDemo) {
      try {
        await chatApi.renameConversation(id, newTitle, token!);
      } catch { /* non-fatal, local state already updated */ }
    }
  };

  const handleDeleteConversation = async (id: string) => {
    removeConversation(id);
    if (!isDemo) {
      try {
        await chatApi.deleteConversation(id, token!);
      } catch { /* non-fatal */ }
    }
    toast.success('Conversation deleted');
    setDeleteConvId(null);
  };

  // ── AI Status Banner ──────────────────────────────────────
  const statusConfig = {
    connected: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'bg-teal-50 text-teal border-teal-100', label: 'Connected' },
    connecting: { icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />, color: 'bg-accent-50 text-accent border-accent-100', label: 'Connecting…' },
    model_not_installed: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'bg-amber-50 text-warning border-amber-100', label: 'Model not installed' },
    unavailable: { icon: <WifiOff className="w-3.5 h-3.5" />, color: 'bg-amber-50 text-warning border-amber-100', label: 'Demo mode' },
    timeout: { icon: <XCircle className="w-3.5 h-3.5" />, color: 'bg-red-50 text-error border-red-100', label: 'Timed out' },
    error: { icon: <XCircle className="w-3.5 h-3.5" />, color: 'bg-red-50 text-error border-red-100', label: 'Error' },
  };
  const cfg = statusConfig[aiStatus.status] ?? statusConfig.error;

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Conversation sidebar ──────────────────────────── */}
      <div className="hidden md:flex flex-col w-64 border-r border-border bg-white flex-shrink-0">
        <div className="p-4 border-b border-border space-y-2">
          <Button variant="primary" size="sm" fullWidth leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => handleNewConversation()}>
            New Conversation
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {conversations.length === 0 ? (
            <p className="text-xs text-secondary-text text-center py-6 px-3">
              Start a conversation to get AI-powered guidance.
            </p>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                className={clsx(
                  'group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all',
                  conv.id === activeConversationId
                    ? 'bg-accent-50 text-accent'
                    : 'hover:bg-background text-primary-text'
                )}
                onClick={() => handleSelectConversation(conv.id)}
              >
                {renamingId === conv.id ? (
                  <input
                    autoFocus
                    className="flex-1 text-xs bg-white border border-accent rounded px-1.5 py-0.5 outline-none"
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onBlur={() => handleRename(conv.id)}
                    onKeyDown={e => e.key === 'Enter' && handleRename(conv.id)}
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span className="flex-1 text-xs truncate">{conv.title}</span>
                )}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); setRenamingId(conv.id); setRenameValue(conv.title); }}
                    className="p-1 rounded hover:bg-white/60" aria-label="Rename"
                  ><Edit2 className="w-3 h-3" /></button>
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteConvId(conv.id); }}
                    className="p-1 rounded hover:bg-white/60 text-error" aria-label="Delete"
                  ><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Setup tip when not connected */}
        {!aiStatus.connected && (
          <div className="p-3 border-t border-border">
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <p className="text-xs font-medium text-warning mb-1">Enable Real AI</p>
              <p className="text-xs text-amber-700 mb-2">
                Install Ollama and pull mistral to enable live responses.
              </p>
              <div className="space-y-1 text-xs text-amber-700 font-mono bg-white rounded p-2 border border-amber-100">
                <p>ollama serve</p>
                <p>ollama pull mistral</p>
              </div>
              <a href="https://ollama.com" target="_blank" rel="noopener noreferrer"
                className="text-xs text-accent underline mt-2 block">
                ollama.com →
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ── Main chat area ────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white flex-shrink-0 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-accent text-white rounded-xl flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-primary-text">Smart Split AI</h2>
              <p className="text-xs text-secondary-text">Educational guidance, not legal advice</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* RAG toggle — only show when connected */}
            {aiStatus.connected && (
              <button
                onClick={() => setUseRag(v => !v)}
                className={clsx(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all',
                  useRag
                    ? 'bg-accent-50 text-accent border-accent-100'
                    : 'bg-white text-secondary-text border-border hover:border-accent-200'
                )}
                title="When enabled, the AI will search your uploaded documents for relevant context"
              >
                <FileSearch className="w-3 h-3" />
                Doc Search
              </button>
            )}
            {/* Status badge */}
            <div className={clsx('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs', cfg.color)}>
              {cfg.icon}
              <span className="font-medium">{cfg.label}</span>
              <span className="opacity-70">— {aiStatus.model}</span>
              {!aiStatus.connected && (
                <button onClick={checkAiStatus} className="ml-1 underline hover:no-underline">Retry</button>
              )}
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {!activeConversationId ? (
            /* Welcome / suggested prompts */
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-accent-50 text-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-primary-text mb-2">How can I help you today?</h2>
                <p className="text-secondary-text text-sm max-w-md mx-auto">
                  Ask me anything about separation and divorce. General educational information only —
                  always consult a qualified professional for decisions affecting your rights.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                {SUGGESTED_AI_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => handleNewConversation(prompt)}
                    className="text-left p-4 bg-white rounded-xl border border-border hover:border-accent-200 hover:shadow-sm transition-all text-sm text-primary-text"
                  >
                    <span className="text-accent mr-1.5">→</span>{prompt}
                  </button>
                ))}
              </div>

              {!aiStatus.connected && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <span className="font-medium text-warning text-sm">Demo Mode Active</span>
                  </div>
                  <p className="text-xs text-amber-700">
                    Predefined educational responses shown. These are not generated by a live AI model.
                  </p>
                </div>
              )}
            </div>
          ) : activeMessages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-secondary-text text-sm">Start the conversation below…</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {activeMessages.map((msg, idx) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  streamMeta={idx === activeMessages.length - 1 && msg.role === 'assistant' ? streamMeta : {}}
                  onCopy={handleCopy}
                  onRegenerate={
                    msg.role === 'assistant' && !isStreaming && idx === activeMessages.length - 1
                      ? () => {
                          const prevUser = [...activeMessages].reverse().find(m => m.role === 'user');
                          if (prevUser) sendMessage(prevUser.content);
                        }
                      : undefined
                  }
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-border bg-white px-4 py-4 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            {isStreaming && (
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs text-secondary-text">
                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                  <span className="ml-1">Generating response…</span>
                  {streamMeta.ttft_ms && (
                    <span className="flex items-center gap-1 ml-2 text-teal">
                      <Zap className="w-3 h-3" />First token in {streamMeta.ttft_ms}ms
                    </span>
                  )}
                </div>
                <button
                  onClick={handleStop}
                  className="flex items-center gap-1.5 text-xs text-error hover:text-error/80 transition-colors"
                >
                  <StopCircle className="w-3.5 h-3.5" />Stop
                </button>
              </div>
            )}

            <div className="flex items-end gap-3">
              {/* Mobile new conversation */}
              <button
                className="md:hidden flex-shrink-0 p-2.5 rounded-xl bg-background border border-border text-secondary-text hover:text-accent hover:border-accent-200 transition-all"
                onClick={() => handleNewConversation()}
                aria-label="New conversation"
              >
                <Plus className="w-4 h-4" />
              </button>

              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={e => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={activeConversationId ? 'Ask a question…' : 'Start a conversation…'}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-primary-text placeholder:text-secondary-text resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                  style={{ minHeight: '48px', maxHeight: '160px' }}
                  disabled={isStreaming}
                />
                <div className="absolute right-3 bottom-2.5 text-xs text-secondary-text/50">
                  ↵ Send · Shift+↵ New line
                </div>
              </div>

              <button
                onClick={() => activeConversationId ? sendMessage() : handleNewConversation(input)}
                disabled={!input.trim() || isStreaming}
                className={clsx(
                  'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                  input.trim() && !isStreaming
                    ? 'bg-accent text-white hover:bg-accent-500 shadow-sm'
                    : 'bg-border text-secondary-text cursor-not-allowed'
                )}
                aria-label="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-secondary-text text-center mt-2">
              Smart Split AI provides general educational information only — not legal advice.
              {!aiStatus.connected && ' • Demo mode active'}
              {useRag && aiStatus.connected && ' • Searching your documents'}
            </p>
          </div>
        </div>
      </div>

      {/* Confirm delete */}
      <ConfirmDialog
        isOpen={!!deleteConvId}
        onClose={() => setDeleteConvId(null)}
        onConfirm={() => deleteConvId && handleDeleteConversation(deleteConvId)}
        title="Delete Conversation"
        message="Delete this conversation and all its messages? This cannot be undone."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────────
interface MsgBubbleProps {
  message: Message;
  streamMeta: StreamMeta;
  onCopy: (t: string) => void;
  onRegenerate?: () => void;
}

function MessageBubble({ message, streamMeta, onCopy, onRegenerate }: MsgBubbleProps) {
  const isUser = message.role === 'user';
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  return (
    <div className={clsx('flex animate-fade-in', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-8 h-8 bg-accent text-white rounded-xl flex items-center justify-center flex-shrink-0 mr-3 mt-1">
          <Bot className="w-4 h-4" />
        </div>
      )}
      <div className={clsx('max-w-[85%] sm:max-w-[75%]', isUser && 'flex flex-col items-end')}>
        <div className={clsx(
          'rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-accent text-white rounded-tr-sm'
            : 'bg-white border border-border text-primary-text rounded-tl-sm'
        )}>
          {message.is_streaming && !message.content ? (
            <div className="flex items-center gap-1 py-1">
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
            </div>
          ) : isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} />
          )}
          {message.is_streaming && message.content && (
            <span className="inline-block w-0.5 h-4 bg-accent animate-pulse ml-0.5 align-middle" />
          )}
        </div>

        <div className="flex items-center gap-1 mt-1.5 px-1">
          <span className="text-xs text-secondary-text">{timeAgo(message.created_at)}</span>
          {!isUser && !message.is_streaming && streamMeta.timing_ms && (
            <TimingBadge meta={streamMeta} />
          )}
          {!isUser && !message.is_streaming && (
            <>
              <button onClick={() => onCopy(message.content)} className="p-1 rounded hover:bg-border text-secondary-text hover:text-primary-text transition-colors" title="Copy">
                <Copy className="w-3 h-3" />
              </button>
              {onRegenerate && (
                <button onClick={onRegenerate} className="p-1 rounded hover:bg-border text-secondary-text hover:text-primary-text transition-colors" title="Regenerate">
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => { setFeedback('up'); toast.success('Thanks for the feedback!'); }}
                className={clsx('p-1 rounded transition-colors', feedback === 'up' ? 'text-success' : 'text-secondary-text hover:text-success hover:bg-border')}
              ><ThumbsUp className="w-3 h-3" /></button>
              <button
                onClick={() => { setFeedback('down'); toast.success('Feedback noted.'); }}
                className={clsx('p-1 rounded transition-colors', feedback === 'down' ? 'text-error' : 'text-secondary-text hover:text-error hover:bg-border')}
              ><ThumbsDown className="w-3 h-3" /></button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
