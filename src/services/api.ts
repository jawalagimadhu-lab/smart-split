// ============================================================
// Smart Split — API Service Layer
// All calls proxy through /api → FastAPI backend at port 8000
// ============================================================

const BASE = '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      msg = body.detail || body.error || body.message || msg;
    } catch {}
    throw new ApiError(msg, res.status);
  }

  const ct = res.headers.get('content-type');
  if (!ct || !ct.includes('application/json')) return undefined as unknown as T;
  return res.json();
}

// ── Auth ────────────────────────────────────────────────────
export const authApi = {
  register: (data: { username: string; email: string; password: string; display_name: string }) =>
    request<{ access_token: string; token_type: string; user: unknown }>(
      '/auth/register', { method: 'POST', body: JSON.stringify(data) }
    ),

  login: (data: { email: string; password: string }) =>
    request<{ access_token: string; token_type: string; user: unknown }>(
      '/auth/login', { method: 'POST', body: JSON.stringify(data) }
    ),

  me: (token: string) =>
    request<unknown>('/auth/me', {}, token),

  updatePreferences: (prefs: unknown, token: string) =>
    request<unknown>('/auth/preferences', { method: 'PUT', body: JSON.stringify(prefs) }, token),
};

// ── AI / Chat ───────────────────────────────────────────────
export const chatApi = {
  status: (token: string) =>
    request<unknown>('/ai/status', {}, token),

  conversations: (token: string) =>
    request<unknown[]>('/ai/conversations', {}, token),

  createConversation: (title: string, token: string) =>
    request<unknown>('/ai/conversations', { method: 'POST', body: JSON.stringify({ title }) }, token),

  messages: (conversationId: string, token: string) =>
    request<unknown[]>(`/ai/conversations/${conversationId}/messages`, {}, token),

  deleteConversation: (id: string, token: string) =>
    request<void>(`/ai/conversations/${id}`, { method: 'DELETE' }, token),

  renameConversation: (id: string, title: string, token: string) =>
    request<unknown>(`/ai/conversations/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) }, token),

  cancelStream: (conversationId: string, token: string) =>
    request<{ cancelled: boolean }>('/ai/cancel', { method: 'POST', body: JSON.stringify({ conversation_id: conversationId }) }, token),

  // Streaming chat — returns raw Response for SSE reading
  chat: (conversationId: string, message: string, token: string, useRag = false) =>
    fetch(`${BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ conversation_id: conversationId, message, use_rag: useRag }),
    }),

  // Document intelligence (summarize, extract_dates, etc.)
  documentIntel: (data: { document_id: string; operation: string; text_excerpt: string }, token: string) =>
    request<{ operation: string; document_id: string; document_name: string; result: string; disclaimer: string }>(
      '/ai/document-intel', { method: 'POST', body: JSON.stringify(data) }, token
    ),

  // RAG query
  ragQuery: (data: { query: string; document_ids?: string[] }, token: string) =>
    request<{ answer: string; sources: unknown[]; disclaimer: string }>(
      '/ai/rag-query', { method: 'POST', body: JSON.stringify(data) }, token
    ),
};

// ── Documents ───────────────────────────────────────────────
export const documentsApi = {
  list: (token: string) =>
    request<unknown[]>('/documents', {}, token),

  upload: (formData: FormData, token: string) =>
    fetch(`${BASE}/documents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }).then(async r => {
      if (!r.ok) {
        let msg = `Upload failed (${r.status})`;
        try { const b = await r.json(); msg = b.detail || b.error || msg; } catch {}
        throw new ApiError(msg, r.status);
      }
      return r.json();
    }),

  update: (id: string, data: unknown, token: string) =>
    request<unknown>(`/documents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),

  delete: (id: string, token: string) =>
    request<void>(`/documents/${id}`, { method: 'DELETE' }, token),

  // Download returns a Blob
  download: async (id: string, filename: string, token: string) => {
    const res = await fetch(`${BASE}/documents/${id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new ApiError(`Download failed (${res.status})`, res.status);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  // RAG indexing
  indexDocument: (id: string, token: string) =>
    request<{ status: string; message: string }>(`/documents/${id}/index`, { method: 'POST' }, token),

  indexStatus: (id: string, token: string) =>
    request<{ document_id: string; status: string; chunk_count: number; indexed_at: string | null }>(
      `/documents/${id}/index-status`, {}, token
    ),
};

// ── Tasks ────────────────────────────────────────────────────
export const tasksApi = {
  list: (token: string) =>
    request<unknown[]>('/tasks', {}, token),

  create: (data: unknown, token: string) =>
    request<unknown>('/tasks', { method: 'POST', body: JSON.stringify(data) }, token),

  update: (id: string, data: unknown, token: string) =>
    request<unknown>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),

  delete: (id: string, token: string) =>
    request<void>(`/tasks/${id}`, { method: 'DELETE' }, token),

  // AI-generated suggested tasks based on user stage/goals
  suggest: (token: string) =>
    request<unknown[]>('/tasks/suggest', {}, token),
};

// ── Finance ──────────────────────────────────────────────────
export const financeApi = {
  list: (token: string) =>
    request<unknown[]>('/finance', {}, token),

  create: (data: unknown, token: string) =>
    request<unknown>('/finance', { method: 'POST', body: JSON.stringify(data) }, token),

  update: (id: string, data: unknown, token: string) =>
    request<unknown>(`/finance/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),

  delete: (id: string, token: string) =>
    request<void>(`/finance/${id}`, { method: 'DELETE' }, token),

  // Scenarios
  listScenarios: (token: string) =>
    request<unknown[]>('/finance/scenarios', {}, token),

  createScenario: (data: unknown, token: string) =>
    request<unknown>('/finance/scenarios', { method: 'POST', body: JSON.stringify(data) }, token),

  updateScenario: (id: string, data: unknown, token: string) =>
    request<unknown>(`/finance/scenarios/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),

  deleteScenario: (id: string, token: string) =>
    request<void>(`/finance/scenarios/${id}`, { method: 'DELETE' }, token),
};

// ── Calendar ─────────────────────────────────────────────────
export const calendarApi = {
  list: (token: string) =>
    request<unknown[]>('/calendar', {}, token),

  create: (data: unknown, token: string) =>
    request<unknown>('/calendar', { method: 'POST', body: JSON.stringify(data) }, token),

  update: (id: string, data: unknown, token: string) =>
    request<unknown>(`/calendar/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),

  delete: (id: string, token: string) =>
    request<void>(`/calendar/${id}`, { method: 'DELETE' }, token),
};

// ── Export Center ─────────────────────────────────────────────
export const exportApi = {
  // Returns a Blob
  exportPdf: async (type: string, token: string) => {
    const res = await fetch(`${BASE}/export/pdf/${type}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new ApiError(`Export failed (${res.status})`, res.status);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-split-${type}-${new Date().toISOString().slice(0, 10)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },

  exportCsv: async (type: string, token: string) => {
    const res = await fetch(`${BASE}/export/csv/${type}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new ApiError(`Export failed (${res.status})`, res.status);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-split-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

// ── Search ───────────────────────────────────────────────────
export const searchApi = {
  global: (query: string, token: string) =>
    request<{ tasks: unknown[]; documents: unknown[]; resources: unknown[] }>(
      `/search?q=${encodeURIComponent(query)}`, {}, token
    ),
};
