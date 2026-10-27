import React from 'react';
import clsx from 'clsx';

type BadgeVariant = 'accent' | 'teal' | 'peach' | 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variants: Record<BadgeVariant, string> = {
  accent: 'bg-accent-50 text-accent',
  teal: 'bg-teal-50 text-teal-500',
  peach: 'bg-peach-100 text-amber-700',
  success: 'bg-green-50 text-success',
  warning: 'bg-amber-50 text-warning',
  error: 'bg-red-50 text-error',
  neutral: 'bg-border text-secondary-text',
};

export function Badge({ children, variant = 'accent', className, dot = false }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

// Progress bar
interface ProgressBarProps {
  value: number; // 0–100
  label?: string;
  color?: 'accent' | 'teal' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  className?: string;
}

const barColors = {
  accent: 'bg-accent',
  teal: 'bg-teal',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
};

const barSizes = {
  sm: 'h-1.5',
  md: 'h-2.5',
};

export function ProgressBar({ value, label, color = 'accent', size = 'md', className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-secondary-text">{label}</span>
          <span className="text-xs font-medium text-primary-text">{pct}%</span>
        </div>
      )}
      <div className={clsx('w-full bg-border rounded-full overflow-hidden', barSizes[size])}>
        <div
          className={clsx('h-full rounded-full transition-all duration-500', barColors[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
