// ============================================================
// Smart Split — Core TypeScript Types
// ============================================================

// Auth & User
export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar?: string;
  created_at: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  jurisdiction: string;
  country: string;
  separation_stage: SeparationStage;
  primary_goals: string[];
  has_children: boolean;
  language: string;
  theme: 'light' | 'dark';
  notifications_enabled: boolean;
  onboarding_completed: boolean;
}

export type SeparationStage =
  | 'exploring'
  | 'considering'
  | 'recently_separated'
  | 'preparing_divorce'
  | 'proceedings_underway'
  | 'finalizing'
  | 'rebuilding';

// Auth
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  display_name: string;
}

// AI / Chat
export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  is_streaming?: boolean;
  error?: boolean;
}

export interface AIStatus {
  connected: boolean;
  model: string;
  status: 'connected' | 'connecting' | 'model_not_installed' | 'unavailable' | 'timeout' | 'error';
  message: string;
}

// Documents
export interface Document {
  id: string;
  user_id: string;
  name: string;
  original_name: string;
  category: DocumentCategory;
  tags: string[];
  description?: string;
  file_type: string;
  file_size: number;
  status: 'pending' | 'ready' | 'error';
  is_favorite: boolean;
  upload_date: string;
  review_date?: string;
  url?: string;
}

export type DocumentCategory =
  | 'identification'
  | 'marriage'
  | 'financial'
  | 'income'
  | 'property'
  | 'debt'
  | 'parenting'
  | 'court'
  | 'agreements'
  | 'correspondence'
  | 'other';

// Financial
export interface FinancialEntry {
  id: string;
  user_id: string;
  type: 'income' | 'expense' | 'asset' | 'debt';
  category: string;
  description: string;
  amount: number;
  frequency: 'one_time' | 'monthly' | 'yearly';
  date: string;
  notes?: string;
  shared: boolean;
}

export interface BudgetScenario {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  entries: FinancialEntry[];
  created_at: string;
  updated_at?: string;
}

// Tasks / Planner
export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  stage: TaskStage;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  due_date?: string;
  completed_at?: string;
  notes?: string;
  dependencies?: string[];
  tags: string[];
}

export type TaskStage =
  | 'understand'
  | 'organize'
  | 'prepare_financially'
  | 'professional_guidance'
  | 'legal_procedures'
  | 'parenting'
  | 'track_proceedings'
  | 'life_after';

// Parenting
export interface Child {
  id: string;
  name: string;
  date_of_birth: string;
  school?: string;
  notes?: string;
}

export interface ParentingEvent {
  id: string;
  title: string;
  type: 'pickup' | 'dropoff' | 'school' | 'medical' | 'holiday' | 'other';
  child_id?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  notes?: string;
  recurring?: boolean;
}

// Calendar
export interface CalendarEvent {
  id: string;
  title: string;
  type: 'task' | 'appointment' | 'court' | 'mediation' | 'parenting' | 'document' | 'budget' | 'personal';
  date: string;
  end_date?: string;
  description?: string;
  reminder?: boolean;
  color?: string;
}

// Wellbeing
export interface MoodEntry {
  id: string;
  date: string;
  mood: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  tags: string[];
}

// Notifications
export interface Notification {
  id: string;
  type: 'task' | 'document' | 'calendar' | 'system' | 'ai';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url?: string;
}

// Resources
export interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'article' | 'checklist' | 'guide' | 'external' | 'video';
  url?: string;
  tags: string[];
  bookmarked: boolean;
  last_verified?: string;
}

// Communication
export interface MessageDraft {
  id: string;
  title: string;
  content: string;
  tone: 'neutral' | 'respectful' | 'concise' | 'formal' | 'child_focused';
  created_at: string;
  updated_at: string;
  category: 'general' | 'scheduling' | 'mediation' | 'legal' | 'parenting';
}

// API Response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Navigation
export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
}
