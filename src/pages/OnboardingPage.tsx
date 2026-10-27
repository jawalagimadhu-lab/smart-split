import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, ArrowLeft, SkipForward } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/app/store';
import { useTaskStore, useNotificationStore } from '@/app/store';
import { DEMO_TASKS, DEMO_NOTIFICATIONS } from '@/utils/sampleData';
import type { SeparationStage } from '@/types';

const STAGES: { value: SeparationStage; label: string; description: string }[] = [
  { value: 'exploring', label: 'Exploring options', description: 'I want to understand what separation and divorce involve.' },
  { value: 'considering', label: 'Considering separation', description: 'I\'m thinking seriously about separating.' },
  { value: 'recently_separated', label: 'Recently separated', description: 'We have recently separated and I need to organize things.' },
  { value: 'preparing_divorce', label: 'Preparing for divorce', description: 'I am preparing to begin the divorce process.' },
  { value: 'proceedings_underway', label: 'Proceedings underway', description: 'The divorce process has already started.' },
  { value: 'finalizing', label: 'Finalizing arrangements', description: 'We are close to finalizing our divorce and arrangements.' },
  { value: 'rebuilding', label: 'Rebuilding after divorce', description: 'My divorce is finalized and I\'m planning my next chapter.' },
];

const GOALS = [
  { value: 'understand_process', label: 'Understand the process' },
  { value: 'organize_documents', label: 'Organize documents' },
  { value: 'financial_planning', label: 'Financial planning' },
  { value: 'parenting_arrangements', label: 'Plan parenting arrangements' },
  { value: 'find_lawyer', label: 'Prepare to find a lawyer' },
  { value: 'mediation', label: 'Prepare for mediation' },
  { value: 'emotional_support', label: 'Emotional wellbeing' },
  { value: 'life_after', label: 'Plan life after divorce' },
];

const COUNTRIES = [
  'United Kingdom', 'United States', 'Canada', 'Australia', 'Ireland',
  'New Zealand', 'South Africa', 'India', 'Germany', 'France', 'Spain',
  'Netherlands', 'Other',
];

interface OnboardingData {
  display_name: string;
  country: string;
  jurisdiction: string;
  separation_stage: SeparationStage | '';
  primary_goals: string[];
  has_children: boolean;
  language: string;
  notifications_enabled: boolean;
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const setTasks = useTaskStore((s) => s.setTasks);
  const setNotifications = useNotificationStore((s) => s.setNotifications);

  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    display_name: user?.display_name ?? '',
    country: user?.preferences?.country ?? '',
    jurisdiction: user?.preferences?.jurisdiction ?? '',
    separation_stage: '',
    primary_goals: [],
    has_children: false,
    language: 'en',
    notifications_enabled: true,
  });

  const TOTAL_STEPS = 6;
  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  const toggleGoal = (g: string) => {
    setData((d) => ({
      ...d,
      primary_goals: d.primary_goals.includes(g)
        ? d.primary_goals.filter((x) => x !== g)
        : [...d.primary_goals, g],
    }));
  };

  const handleFinish = () => {
    if (!data.separation_stage) {
      toast.error('Please select your current stage.');
      return;
    }
    // Save preferences to user
    updateUser({
      display_name: data.display_name || user?.display_name || 'User',
      preferences: {
        jurisdiction: data.jurisdiction,
        country: data.country,
        separation_stage: data.separation_stage as SeparationStage,
        primary_goals: data.primary_goals,
        has_children: data.has_children,
        language: data.language,
        theme: 'light',
        notifications_enabled: data.notifications_enabled,
        onboarding_completed: true,
      },
    });
    // Load demo tasks & notifications
    setTasks(DEMO_TASKS);
    setNotifications(DEMO_NOTIFICATIONS);
    toast.success('Your workspace is ready!');
    navigate('/app/dashboard');
  };

  const handleSkip = () => {
    updateUser({
      preferences: {
        jurisdiction: '',
        country: '',
        separation_stage: 'exploring',
        primary_goals: [],
        has_children: false,
        language: 'en',
        theme: 'light',
        notifications_enabled: true,
        onboarding_completed: true,
      },
    });
    setTasks(DEMO_TASKS);
    setNotifications(DEMO_NOTIFICATIONS);
    navigate('/app/dashboard');
  };

  const steps = [
    // Step 0: Welcome
    <div key="welcome" className="animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-accent-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-accent text-2xl">👋</div>
        <h2 className="text-2xl font-bold text-primary-text mb-2">
          Welcome, {user?.display_name || 'there'}!
        </h2>
        <p className="text-secondary-text max-w-sm mx-auto leading-relaxed">
          Let's personalize your workspace. This takes about 2 minutes and helps Smart Split
          give you the most relevant guidance and tools.
        </p>
      </div>
      <div className="bg-accent-50 rounded-xl p-4 border border-accent-100">
        <p className="text-sm text-accent font-medium mb-2">You can:</p>
        <ul className="space-y-1.5">
          {[
            'Skip any question you\'re not comfortable answering',
            'Change your answers any time in Settings',
            'Use Smart Split without sharing intimate details',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-primary-text">
              <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>,

    // Step 1: Name
    <div key="name" className="animate-fade-in">
      <h2 className="text-xl font-bold text-primary-text mb-2">What should we call you?</h2>
      <p className="text-secondary-text text-sm mb-6">This is just for your personalized experience inside the app.</p>
      <input
        type="text"
        className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        placeholder="Your preferred name (e.g. Alex)"
        value={data.display_name}
        onChange={(e) => setData({ ...data, display_name: e.target.value })}
      />
    </div>,

    // Step 2: Stage
    <div key="stage" className="animate-fade-in">
      <h2 className="text-xl font-bold text-primary-text mb-2">Where are you right now?</h2>
      <p className="text-secondary-text text-sm mb-6">
        This helps us personalize your action plan and resources. You can change this at any time.
      </p>
      <div className="space-y-2.5">
        {STAGES.map((stage) => (
          <button
            key={stage.value}
            onClick={() => setData({ ...data, separation_stage: stage.value })}
            className={clsx(
              'w-full text-left p-4 rounded-xl border-2 transition-all duration-150',
              data.separation_stage === stage.value
                ? 'border-accent bg-accent-50'
                : 'border-border bg-white hover:border-accent-200'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={clsx(
                'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                data.separation_stage === stage.value ? 'border-accent bg-accent' : 'border-border'
              )}>
                {data.separation_stage === stage.value && <Check className="w-3 h-3 text-white" />}
              </div>
              <div>
                <div className="font-medium text-sm text-primary-text">{stage.label}</div>
                <div className="text-xs text-secondary-text">{stage.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>,

    // Step 3: Country
    <div key="country" className="animate-fade-in">
      <h2 className="text-xl font-bold text-primary-text mb-2">What country are you in?</h2>
      <p className="text-secondary-text text-sm mb-6">
        Divorce laws vary significantly by country. We use this to show you the most relevant information.
        We'll always be clear when information applies to your jurisdiction versus being general.
      </p>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {COUNTRIES.map((country) => (
            <button
              key={country}
              onClick={() => setData({ ...data, country })}
              className={clsx(
                'p-3 rounded-xl border-2 text-sm text-left transition-all duration-150',
                data.country === country
                  ? 'border-accent bg-accent-50 text-accent font-medium'
                  : 'border-border bg-white hover:border-accent-200 text-primary-text'
              )}
            >
              {country}
            </button>
          ))}
        </div>
        {data.country && data.country !== 'Other' && (
          <div className="animate-fade-in">
            <label className="block text-sm font-medium text-primary-text mb-1.5">
              Specific region or jurisdiction (optional)
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="e.g. England & Wales, California, Ontario"
              value={data.jurisdiction}
              onChange={(e) => setData({ ...data, jurisdiction: e.target.value })}
            />
          </div>
        )}
      </div>
    </div>,

    // Step 4: Goals + children
    <div key="goals" className="animate-fade-in">
      <h2 className="text-xl font-bold text-primary-text mb-2">What are your main goals?</h2>
      <p className="text-secondary-text text-sm mb-4">Select all that apply. You can update these later.</p>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {GOALS.map((goal) => {
          const selected = data.primary_goals.includes(goal.value);
          return (
            <button
              key={goal.value}
              onClick={() => toggleGoal(goal.value)}
              className={clsx(
                'p-3 rounded-xl border-2 text-sm text-left flex items-center gap-2 transition-all',
                selected ? 'border-accent bg-accent-50 text-accent' : 'border-border bg-white hover:border-accent-200 text-primary-text'
              )}
            >
              <div className={clsx('w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center', selected ? 'border-accent bg-accent' : 'border-border')}>
                {selected && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
              {goal.label}
            </button>
          );
        })}
      </div>
      <div className="border border-border rounded-xl p-4">
        <p className="text-sm font-medium text-primary-text mb-3">Do you have children?</p>
        <div className="flex gap-3">
          {[{ v: true, l: 'Yes, I have children' }, { v: false, l: 'No children' }].map(({ v, l }) => (
            <button
              key={l}
              onClick={() => setData({ ...data, has_children: v })}
              className={clsx(
                'flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all',
                data.has_children === v ? 'border-accent bg-accent-50 text-accent' : 'border-border bg-white hover:border-accent-200 text-secondary-text'
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>,

    // Step 5: Ready
    <div key="ready" className="animate-fade-in text-center">
      <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check className="w-10 h-10 text-teal" />
      </div>
      <h2 className="text-2xl font-bold text-primary-text mb-3">Your workspace is ready</h2>
      <p className="text-secondary-text mb-6 max-w-sm mx-auto leading-relaxed">
        Smart Split has personalized your dashboard, tasks, and resources based on your answers.
        You can update any of these preferences in Settings.
      </p>
      <div className="space-y-2 text-sm text-left bg-background rounded-xl p-4 border border-border mb-6">
        {data.display_name && <div className="flex gap-2"><span className="text-secondary-text">Name:</span><span className="font-medium">{data.display_name}</span></div>}
        {data.country && <div className="flex gap-2"><span className="text-secondary-text">Country:</span><span className="font-medium">{data.country}{data.jurisdiction ? ` — ${data.jurisdiction}` : ''}</span></div>}
        {data.separation_stage && <div className="flex gap-2"><span className="text-secondary-text">Stage:</span><span className="font-medium">{STAGES.find(s => s.value === data.separation_stage)?.label}</span></div>}
        <div className="flex gap-2"><span className="text-secondary-text">Children:</span><span className="font-medium">{data.has_children ? 'Yes' : 'No'}</span></div>
      </div>
    </div>,
  ];

  const canGoNext = () => {
    if (step === 2 && !data.separation_stage) return false;
    return true;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <Logo size="md" />
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-secondary-text">Step {step + 1} of {TOTAL_STEPS}</span>
            <button onClick={handleSkip} className="text-xs text-secondary-text hover:text-accent flex items-center gap-1">
              <SkipForward className="w-3 h-3" />
              Skip setup
            </button>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-border shadow-md p-8 min-h-[400px] flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {steps[step]}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>

            {step < TOTAL_STEPS - 1 ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => { if (canGoNext()) setStep(step + 1); }}
                disabled={!canGoNext()}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {step === 0 ? 'Get Started' : 'Continue'}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleFinish}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Go to Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
