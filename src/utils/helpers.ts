import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

// ── Date helpers ────────────────────────────────────────────
export function formatDate(date: string | Date, fmt = 'MMM d, yyyy'): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '—';
    return format(d, fmt);
  } catch {
    return '—';
  }
}

export function timeAgo(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return '—';
  }
}

// ── Currency helpers ─────────────────────────────────────────
export function formatCurrency(amount: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── File size helpers ────────────────────────────────────────
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ── String helpers ───────────────────────────────────────────
export function truncate(str: string, max = 60): string {
  if (str.length <= max) return str;
  return str.slice(0, max).trimEnd() + '…';
}

export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ── ID generator ─────────────────────────────────────────────
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Stage helpers ────────────────────────────────────────────
export const STAGE_LABELS: Record<string, string> = {
  exploring: 'Exploring Options',
  considering: 'Considering Separation',
  recently_separated: 'Recently Separated',
  preparing_divorce: 'Preparing for Divorce',
  proceedings_underway: 'Proceedings Underway',
  finalizing: 'Finalizing Arrangements',
  rebuilding: 'Rebuilding After Divorce',
};

export const STAGE_COLORS: Record<string, string> = {
  exploring: 'accent',
  considering: 'accent',
  recently_separated: 'teal',
  preparing_divorce: 'warning',
  proceedings_underway: 'warning',
  finalizing: 'success',
  rebuilding: 'success',
};

export function getStageLabel(stage: string): string {
  return STAGE_LABELS[stage] ?? stage;
}

// ── Priority helpers ─────────────────────────────────────────
export const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-secondary-text',
  medium: 'text-warning',
  high: 'text-accent',
  urgent: 'text-error',
};

export const PRIORITY_BG: Record<string, string> = {
  low: 'bg-border text-secondary-text',
  medium: 'bg-amber-50 text-warning',
  high: 'bg-accent-50 text-accent',
  urgent: 'bg-red-50 text-error',
};

// ── Color utilities ──────────────────────────────────────────
export function categoryColor(category: string): string {
  const map: Record<string, string> = {
    income: 'bg-green-50 text-success',
    expense: 'bg-red-50 text-error',
    asset: 'bg-accent-50 text-accent',
    debt: 'bg-amber-50 text-warning',
    Housing: 'bg-teal-50 text-teal',
    Food: 'bg-orange-50 text-orange-600',
    Transport: 'bg-blue-50 text-blue-600',
    Legal: 'bg-accent-50 text-accent',
    Children: 'bg-pink-50 text-pink-600',
    Utilities: 'bg-yellow-50 text-yellow-700',
    Salary: 'bg-green-50 text-success',
    Other: 'bg-border text-secondary-text',
  };
  return map[category] ?? 'bg-border text-secondary-text';
}
