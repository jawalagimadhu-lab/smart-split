// ============================================================
// Smart Split — Sample / Demo Data
// Clearly labeled: this data is for demonstration only.
// ============================================================

import type {
  Task, FinancialEntry, CalendarEvent, Notification,
  JournalEntry, Resource, Document, Conversation, Message
} from '@/types';

export const DEMO_TASKS: Task[] = [
  {
    id: 't1', user_id: 'demo', title: 'Gather all financial documents',
    stage: 'organize', category: 'Documents', priority: 'high',
    status: 'in_progress', due_date: '2026-11-05', tags: ['documents', 'finance'],
    description: 'Collect bank statements, tax returns, and investment accounts for the past 3 years.',
  },
  {
    id: 't2', user_id: 'demo', title: 'Schedule a consultation with a family lawyer',
    stage: 'professional_guidance', category: 'Legal', priority: 'high',
    status: 'pending', due_date: '2026-11-10', tags: ['legal', 'lawyer'],
    description: 'Research and book an initial consultation with a qualified family law solicitor.',
  },
  {
    id: 't3', user_id: 'demo', title: 'Open a personal bank account',
    stage: 'prepare_financially', category: 'Finance', priority: 'medium',
    status: 'completed', completed_at: '2026-10-20', tags: ['banking', 'finance'],
    description: 'Ensure you have a personal account separate from any joint accounts.',
  },
  {
    id: 't4', user_id: 'demo', title: 'Review parenting arrangement options',
    stage: 'parenting', category: 'Parenting', priority: 'medium',
    status: 'pending', tags: ['parenting', 'custody'],
  },
  {
    id: 't5', user_id: 'demo', title: 'Create a post-separation budget',
    stage: 'prepare_financially', category: 'Finance', priority: 'high',
    status: 'pending', due_date: '2026-11-15', tags: ['budget', 'finance'],
  },
  {
    id: 't6', user_id: 'demo', title: 'Understand the divorce petition process',
    stage: 'legal_procedures', category: 'Legal', priority: 'medium',
    status: 'pending', tags: ['legal', 'process'],
  },
  {
    id: 't7', user_id: 'demo', title: 'Locate your marriage certificate',
    stage: 'organize', category: 'Documents', priority: 'high',
    status: 'completed', completed_at: '2026-10-15', tags: ['documents'],
  },
];

export const DEMO_FINANCE: FinancialEntry[] = [
  { id: 'f1', user_id: 'demo', type: 'income', category: 'Salary', description: 'Monthly salary', amount: 3800, frequency: 'monthly', date: '2026-10-01', shared: false },
  { id: 'f2', user_id: 'demo', type: 'expense', category: 'Housing', description: 'Rent / mortgage', amount: 1200, frequency: 'monthly', date: '2026-10-01', shared: true },
  { id: 'f3', user_id: 'demo', type: 'expense', category: 'Transport', description: 'Car loan + fuel', amount: 350, frequency: 'monthly', date: '2026-10-01', shared: false },
  { id: 'f4', user_id: 'demo', type: 'expense', category: 'Food', description: 'Groceries & dining', amount: 480, frequency: 'monthly', date: '2026-10-01', shared: false },
  { id: 'f5', user_id: 'demo', type: 'expense', category: 'Legal', description: 'Legal consultation fees', amount: 200, frequency: 'monthly', date: '2026-10-01', shared: false },
  { id: 'f6', user_id: 'demo', type: 'expense', category: 'Utilities', description: 'Gas, electricity, internet', amount: 180, frequency: 'monthly', date: '2026-10-01', shared: true },
  { id: 'f7', user_id: 'demo', type: 'asset', category: 'Property', description: 'Family home (estimated equity)', amount: 120000, frequency: 'one_time', date: '2026-10-01', shared: true },
  { id: 'f8', user_id: 'demo', type: 'asset', category: 'Savings', description: 'Personal savings account', amount: 8500, frequency: 'one_time', date: '2026-10-01', shared: false },
  { id: 'f9', user_id: 'demo', type: 'debt', category: 'Credit Card', description: 'Shared credit card balance', amount: 3200, frequency: 'one_time', date: '2026-10-01', shared: true },
  { id: 'f10', user_id: 'demo', type: 'expense', category: 'Children', description: 'School fees & childcare', amount: 320, frequency: 'monthly', date: '2026-10-01', shared: true },
];

export const DEMO_CALENDAR_EVENTS: CalendarEvent[] = [
  { id: 'e1', title: 'Lawyer Consultation', type: 'appointment', date: '2026-11-10', description: 'Initial consultation with family law solicitor.', color: '#8A7AE6' },
  { id: 'e2', title: 'Document Review Deadline', type: 'document', date: '2026-11-05', description: 'Gather all financial documents.', color: '#5AAE9A' },
  { id: 'e3', title: 'Post-Separation Budget Due', type: 'budget', date: '2026-11-15', description: 'Complete the first draft of your new budget.', color: '#C58A37' },
  { id: 'e4', title: "Child's School Parent Evening", type: 'parenting', date: '2026-11-12', color: '#5AAE9A' },
  { id: 'e5', title: 'Mediation Session', type: 'mediation', date: '2026-11-20', description: 'First mediation appointment.', color: '#8A7AE6' },
];

export const DEMO_NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'task', title: 'Task Due Soon', message: 'Gather all financial documents is due in 10 days.', read: false, created_at: new Date().toISOString() },
  { id: 'n2', type: 'ai', title: 'Smart Split AI is Ready', message: 'Your AI assistant is connected and ready to help.', read: false, created_at: new Date().toISOString() },
  { id: 'n3', type: 'system', title: 'Welcome to Smart Split', message: 'Your secure workspace is set up. Start by exploring your dashboard.', read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
];

export const DEMO_JOURNAL: JournalEntry[] = [
  {
    id: 'j1', title: 'First steps', content: 'Today I started organizing my documents. It felt overwhelming at first but breaking it into small tasks helped.',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(), tags: ['progress', 'documents'],
  },
];

export const DEMO_RESOURCES: Resource[] = [
  { id: 'r1', title: 'Understanding the Divorce Process', description: 'A clear overview of what to expect at each stage of a divorce.', category: 'Legal', type: 'guide', tags: ['divorce', 'process', 'beginner'], bookmarked: false },
  { id: 'r2', title: 'Separation & Divorce Financial Checklist', description: 'Key financial steps to take when separating.', category: 'Finance', type: 'checklist', tags: ['finance', 'checklist'], bookmarked: true },
  { id: 'r3', title: 'Parenting Through Separation', description: 'Guidance on supporting children and maintaining stability.', category: 'Parenting', type: 'article', tags: ['parenting', 'children'], bookmarked: false },
  { id: 'r4', title: 'Managing Stress During Separation', description: 'Practical strategies for emotional wellbeing.', category: 'Wellbeing', type: 'article', tags: ['wellbeing', 'stress'], bookmarked: false },
  { id: 'r5', title: 'Property Division Explained', description: 'How assets and property are typically divided in a divorce.', category: 'Legal', type: 'guide', tags: ['property', 'assets'], bookmarked: true },
  { id: 'r6', title: 'Emergency Planning Guide', description: 'Steps to protect yourself and your children if you are in an unsafe situation.', category: 'Safety', type: 'guide', tags: ['safety', 'emergency'], bookmarked: false },
  { id: 'r7', title: 'Life After Divorce: A Practical Guide', description: 'Planning your next chapter with practical steps.', category: 'Life After', type: 'guide', tags: ['life-after', 'planning'], bookmarked: false },
  { id: 'r8', title: 'Spousal Support Overview', description: 'What spousal support (alimony) means and how it is calculated.', category: 'Legal', type: 'article', tags: ['spousal-support', 'legal'], bookmarked: false },
];

export const DEMO_DOCUMENTS: Document[] = [
  { id: 'd1', user_id: 'demo', name: 'Marriage Certificate.pdf', original_name: 'Marriage Certificate.pdf', category: 'marriage', tags: ['key-document'], file_type: 'pdf', file_size: 245000, status: 'ready', is_favorite: true, upload_date: '2026-10-15' },
  { id: 'd2', user_id: 'demo', name: 'Bank Statement Oct 2026.pdf', original_name: 'Bank Statement Oct 2026.pdf', category: 'financial', tags: ['bank', '2026'], file_type: 'pdf', file_size: 512000, status: 'ready', is_favorite: false, upload_date: '2026-10-18' },
  { id: 'd3', user_id: 'demo', name: 'Tax Return 2025.pdf', original_name: 'Tax Return 2025.pdf', category: 'income', tags: ['tax', '2025'], file_type: 'pdf', file_size: 340000, status: 'ready', is_favorite: false, upload_date: '2026-10-20' },
];

export const LEGAL_GUIDE_TOPICS = [
  {
    id: 'lg1', category: 'Divorce Basics', title: 'What is Divorce?',
    content: `Divorce is the legal dissolution of a marriage by a court or other competent body. The requirements, process, and timelines vary significantly depending on your jurisdiction.

**General process overview:**
- One or both spouses file a petition or application to divorce
- The other spouse is notified and may respond
- Both parties exchange financial and relevant personal information
- Arrangements are made for property, support, and children
- A court issues a final divorce order or decree

**Key terms:**
- **Petitioner / Applicant**: The spouse who files for divorce
- **Respondent**: The spouse who receives the divorce petition
- **Consent divorce / Uncontested divorce**: Both parties agree on all matters
- **Contested divorce**: Parties disagree on one or more matters

This content is for general educational purposes only. Laws vary widely between countries, states, and jurisdictions. Always verify with a qualified legal professional in your area.`,
    tags: ['beginner', 'process'], reading_time: 5,
  },
  {
    id: 'lg2', category: 'Property Division', title: 'How is Property Divided?',
    content: `Property division is one of the most complex aspects of divorce. The approach differs significantly by jurisdiction.

**Common approaches:**
- **Community property**: Assets acquired during the marriage are split 50/50 (used in some US states and other jurisdictions)
- **Equitable distribution**: Assets are divided fairly but not necessarily equally, based on various factors
- **Matrimonial property regimes**: Some countries have specific legal frameworks governing how marital property is shared

**Factors that typically influence division:**
- Length of the marriage
- Contributions of each spouse (financial and non-financial)
- Future earning capacity
- Needs of any children
- Pre-marital agreements

**Important:** This is a complex area of law. What seems fair may differ from what a court would order. Get legal advice specific to your jurisdiction.`,
    tags: ['property', 'assets', 'finance'], reading_time: 6,
  },
  {
    id: 'lg3', category: 'Child Custody', title: 'Understanding Child Custody',
    content: `Child custody arrangements determine where children live and how parenting responsibilities are shared after separation.

**Types of custody:**
- **Physical / Residential custody**: Where the child primarily lives
- **Legal custody**: Who makes important decisions about the child's life (education, health, religion)
- **Sole custody**: One parent has primary responsibility
- **Shared / Joint custody**: Both parents share responsibility

**Best interests of the child:**
Most jurisdictions prioritize the child's best interests when making custody decisions. This considers factors such as:
- The child's relationship with each parent
- Each parent's ability to provide stability
- The child's own wishes (depending on age)
- Any history of family violence or safety concerns

**Note:** Arrangements can be agreed between parents or decided by a court. Mediation is often encouraged before litigation.`,
    tags: ['children', 'custody', 'parenting'], reading_time: 7,
  },
  {
    id: 'lg4', category: 'Mediation', title: 'What is Divorce Mediation?',
    content: `Mediation is a process where a neutral third party (the mediator) helps divorcing couples reach agreements on disputed issues.

**Benefits of mediation:**
- Generally faster and less expensive than court proceedings
- Allows both parties more control over outcomes
- Less adversarial than litigation
- Can preserve a co-parenting relationship

**What mediation can cover:**
- Property division
- Spousal support arrangements
- Parenting plans and custody
- Financial disclosure

**What mediation cannot do:**
- Make legally binding orders (agreements still need legal formalization)
- Replace independent legal advice
- Be appropriate in situations involving domestic abuse or a significant power imbalance

Always consult a lawyer to review any mediated agreement before signing.`,
    tags: ['mediation', 'process'], reading_time: 5,
  },
  {
    id: 'lg5', category: 'Spousal Support', title: 'Spousal Support (Alimony) Explained',
    content: `Spousal support (also called alimony, maintenance, or spousal maintenance) is financial support paid by one spouse to the other after separation or divorce.

**When spousal support may be awarded:**
- One spouse earns significantly more than the other
- One spouse gave up career opportunities to support the family or care for children
- The marriage was long-duration
- One spouse has limited ability to support themselves

**Types of spousal support:**
- **Temporary**: Paid during divorce proceedings
- **Rehabilitative**: Time-limited support to allow a spouse to gain employment skills
- **Permanent / Long-term**: May apply in long marriages or where a spouse cannot become self-supporting

**Important:** Spousal support laws vary significantly between jurisdictions. The amount and duration depend on many factors specific to your situation. Get professional legal advice.`,
    tags: ['spousal-support', 'finance', 'legal'], reading_time: 6,
  },
];

export const BREATHING_EXERCISES = [
  {
    id: 'b1', name: 'Box Breathing',
    description: 'A calming technique used to reduce stress and improve focus.',
    steps: ['Breathe in for 4 counts', 'Hold for 4 counts', 'Breathe out for 4 counts', 'Hold for 4 counts'],
    duration: '4 minutes',
  },
  {
    id: 'b2', name: '4-7-8 Breathing',
    description: 'A relaxation technique that helps reduce anxiety.',
    steps: ['Breathe in through your nose for 4 counts', 'Hold your breath for 7 counts', 'Exhale completely through your mouth for 8 counts'],
    duration: '5 minutes',
  },
  {
    id: 'b3', name: 'Grounding: 5-4-3-2-1',
    description: 'A grounding exercise to bring you back to the present moment.',
    steps: [
      'Name 5 things you can see',
      'Name 4 things you can physically feel',
      'Name 3 things you can hear',
      'Name 2 things you can smell',
      'Name 1 thing you can taste',
    ],
    duration: '3 minutes',
  },
];

export const REFLECTION_PROMPTS = [
  'What is one small thing I accomplished today that I can acknowledge?',
  'What do I need most right now — practical help, emotional support, or space?',
  'What are three things I am grateful for today, no matter how small?',
  'What is one worry I can set aside for now, and one step I can take on it tomorrow?',
  'How did I show up for myself today? What would I do differently?',
  'What am I most looking forward to in my next chapter?',
  'Who in my life has shown up for me recently? Have I thanked them?',
];

export const SUGGESTED_AI_PROMPTS = [
  'Help me understand the divorce process in my area.',
  'What documents should I organize first?',
  'Help me prepare questions for a family lawyer.',
  'Create a practical separation checklist for me.',
  'Help me estimate my monthly expenses after separation.',
  'Explain the term "equitable distribution" in simple language.',
  'Help me prepare for my first mediation session.',
  'What should I consider when making a parenting plan?',
  'How can I manage stress during this process?',
  'Help me draft a neutral message about scheduling arrangements.',
];
