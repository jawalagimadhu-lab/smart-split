import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User,
  Conversation,
  Message,
  Task,
  Notification,
  AIStatus,
  JournalEntry,
  MoodEntry,
  FinancialEntry,
  Document,
  CalendarEvent,
  MessageDraft,
  Resource,
} from '@/types';

// ── Auth Store ──────────────────────────────────────────────
interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User, token: string) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user, token) => set({ user, token, isAuthenticated: true }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: 'smart-split-auth' }
  )
);

// ── UI Store ────────────────────────────────────────────────
interface UIStore {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      sidebarCollapsed: false,
      theme: 'light',
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    }),
    { name: 'smart-split-ui' }
  )
);

// ── AI / Chat Store ─────────────────────────────────────────
interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  aiStatus: AIStatus;
  isStreaming: boolean;
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversation: (id: string | null) => void;
  addConversation: (conv: Conversation) => void;
  removeConversation: (id: string) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateLastMessage: (conversationId: string, content: string, done?: boolean) => void;
  setAiStatus: (status: AIStatus) => void;
  setStreaming: (streaming: boolean) => void;
}

export const useChatStore = create<ChatStore>()((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  aiStatus: {
    connected: false,
    model: 'mistral',
    status: 'connecting',
    message: 'Checking connection...',
  },
  isStreaming: false,
  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (id) => set({ activeConversationId: id }),
  addConversation: (conv) =>
    set((state) => ({ conversations: [conv, ...state.conversations] })),
  removeConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      activeConversationId:
        state.activeConversationId === id ? null : state.activeConversationId,
    })),
  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: messages },
    })),
  addMessage: (conversationId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] ?? []), message],
      },
    })),
  updateLastMessage: (conversationId, content, done = false) =>
    set((state) => {
      const msgs = state.messages[conversationId] ?? [];
      const updated = msgs.map((m, i) =>
        i === msgs.length - 1 && m.role === 'assistant'
          ? { ...m, content, is_streaming: !done }
          : m
      );
      return { messages: { ...state.messages, [conversationId]: updated } };
    }),
  setAiStatus: (aiStatus) => set({ aiStatus }),
  setStreaming: (isStreaming) => set({ isStreaming }),
}));

// ── Tasks Store ─────────────────────────────────────────────
interface TaskStore {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set) => ({
      tasks: [],
      setTasks: (tasks) => set({ tasks }),
      addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      removeTask: (id) =>
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),
    }),
    { name: 'smart-split-tasks' }
  )
);

// ── Notifications Store ─────────────────────────────────────
interface NotificationStore {
  notifications: Notification[];
  setNotifications: (n: Notification[]) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  addNotification: (n: Notification) => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [],
      setNotifications: (notifications) => set({ notifications }),
      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
      addNotification: (n) =>
        set((state) => ({ notifications: [n, ...state.notifications] })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
    }),
    { name: 'smart-split-notifications' }
  )
);

// ── Wellbeing Store ─────────────────────────────────────────
interface WellbeingStore {
  journalEntries: JournalEntry[];
  moodHistory: MoodEntry[];
  addJournalEntry: (entry: JournalEntry) => void;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  removeJournalEntry: (id: string) => void;
  addMoodEntry: (entry: MoodEntry) => void;
}

export const useWellbeingStore = create<WellbeingStore>()(
  persist(
    (set) => ({
      journalEntries: [],
      moodHistory: [],
      addJournalEntry: (entry) =>
        set((state) => ({ journalEntries: [entry, ...state.journalEntries] })),
      updateJournalEntry: (id, updates) =>
        set((state) => ({
          journalEntries: state.journalEntries.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),
      removeJournalEntry: (id) =>
        set((state) => ({
          journalEntries: state.journalEntries.filter((e) => e.id !== id),
        })),
      addMoodEntry: (entry) =>
        set((state) => ({ moodHistory: [entry, ...state.moodHistory] })),
    }),
    { name: 'smart-split-wellbeing' }
  )
);

// ── Finance Store ───────────────────────────────────────────
interface FinanceStore {
  entries: FinancialEntry[];
  setEntries: (entries: FinancialEntry[]) => void;
  addEntry: (entry: FinancialEntry) => void;
  updateEntry: (id: string, updates: Partial<FinancialEntry>) => void;
  removeEntry: (id: string) => void;
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set) => ({
      entries: [],
      setEntries: (entries) => set({ entries }),
      addEntry: (entry) =>
        set((state) => ({ entries: [entry, ...state.entries] })),
      updateEntry: (id, updates) =>
        set((state) => ({
          entries: state.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),
      removeEntry: (id) =>
        set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),
    }),
    { name: 'smart-split-finance' }
  )
);

// ── Documents Store ─────────────────────────────────────────
interface DocumentStore {
  documents: Document[];
  setDocuments: (docs: Document[]) => void;
  addDocument: (doc: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  removeDocument: (id: string) => void;
}

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set) => ({
      documents: [],
      setDocuments: (documents) => set({ documents }),
      addDocument: (doc) =>
        set((state) => ({ documents: [doc, ...state.documents] })),
      updateDocument: (id, updates) =>
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        })),
      removeDocument: (id) =>
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
        })),
    }),
    { name: 'smart-split-documents' }
  )
);

// ── Calendar Store ──────────────────────────────────────────
interface CalendarStore {
  events: CalendarEvent[];
  setEvents: (events: CalendarEvent[]) => void;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  removeEvent: (id: string) => void;
}

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set) => ({
      events: [],
      setEvents: (events) => set({ events }),
      addEvent: (event) =>
        set((state) => ({ events: [event, ...state.events] })),
      updateEvent: (id, updates) =>
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),
      removeEvent: (id) =>
        set((state) => ({ events: state.events.filter((e) => e.id !== id) })),
    }),
    { name: 'smart-split-calendar' }
  )
);

// ── Communication Store ─────────────────────────────────────
interface CommunicationStore {
  drafts: MessageDraft[];
  addDraft: (draft: MessageDraft) => void;
  updateDraft: (id: string, updates: Partial<MessageDraft>) => void;
  removeDraft: (id: string) => void;
}

export const useCommunicationStore = create<CommunicationStore>()(
  persist(
    (set) => ({
      drafts: [],
      addDraft: (draft) =>
        set((state) => ({ drafts: [draft, ...state.drafts] })),
      updateDraft: (id, updates) =>
        set((state) => ({
          drafts: state.drafts.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        })),
      removeDraft: (id) =>
        set((state) => ({ drafts: state.drafts.filter((d) => d.id !== id) })),
    }),
    { name: 'smart-split-communication' }
  )
);

// ── Resources Store ─────────────────────────────────────────
interface ResourceStore {
  bookmarks: string[];
  recentlyViewed: string[];
  toggleBookmark: (id: string) => void;
  addRecentlyViewed: (id: string) => void;
}

export const useResourceStore = create<ResourceStore>()(
  persist(
    (set) => ({
      bookmarks: [],
      recentlyViewed: [],
      toggleBookmark: (id) =>
        set((state) => ({
          bookmarks: state.bookmarks.includes(id)
            ? state.bookmarks.filter((b) => b !== id)
            : [...state.bookmarks, id],
        })),
      addRecentlyViewed: (id) =>
        set((state) => ({
          recentlyViewed: [id, ...state.recentlyViewed.filter((r) => r !== id)].slice(0, 20),
        })),
    }),
    { name: 'smart-split-resources' }
  )
);

// ── Scenarios Store ─────────────────────────────────────────
import type { BudgetScenario } from '@/types';

interface ScenarioStore {
  scenarios: BudgetScenario[];
  setScenarios: (s: BudgetScenario[]) => void;
  addScenario: (s: BudgetScenario) => void;
  updateScenario: (id: string, updates: Partial<BudgetScenario>) => void;
  removeScenario: (id: string) => void;
}

export const useScenarioStore = create<ScenarioStore>()(
  persist(
    (set) => ({
      scenarios: [],
      setScenarios: (scenarios) => set({ scenarios }),
      addScenario: (s) => set((state) => ({ scenarios: [s, ...state.scenarios] })),
      updateScenario: (id, updates) =>
        set((state) => ({
          scenarios: state.scenarios.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),
      removeScenario: (id) =>
        set((state) => ({ scenarios: state.scenarios.filter((s) => s.id !== id) })),
    }),
    { name: 'smart-split-scenarios' }
  )
);
