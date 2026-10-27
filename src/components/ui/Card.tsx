import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({ children, className, padding = 'md', hover = false, onClick }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-2xl border border-border shadow-sm',
        paddings[padding],
        hover && 'hover:shadow-md transition-shadow duration-200 cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function CardHeader({ children, className, action }: CardHeaderProps) {
  return (
    <div className={clsx('flex items-center justify-between mb-4', className)}>
      <div className="flex-1">{children}</div>
      {action && <div className="ml-4 flex-shrink-0">{action}</div>}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export function CardTitle({ children, subtitle, className }: CardTitleProps) {
  return (
    <div className={className}>
      <h3 className="text-base font-semibold text-primary-text">{children}</h3>
      {subtitle && <p className="text-sm text-secondary-text mt-0.5">{subtitle}</p>}
    </div>
  );
}

// Stat card
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  color?: 'accent' | 'teal' | 'peach' | 'success';
  className?: string;
}

const statColors = {
  accent: { bg: 'bg-accent-50', text: 'text-accent', icon: 'text-accent' },
  teal: { bg: 'bg-teal-50', text: 'text-teal', icon: 'text-teal' },
  peach: { bg: 'bg-peach-100', text: 'text-amber-700', icon: 'text-amber-600' },
  success: { bg: 'bg-green-50', text: 'text-success', icon: 'text-success' },
};

export function StatCard({ label, value, icon, trend, color = 'accent', className }: StatCardProps) {
  const colors = statColors[color];
  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-secondary-text">{label}</p>
          <p className={clsx('text-2xl font-bold mt-1', colors.text)}>{value}</p>
          {trend && (
            <p className={clsx('text-xs mt-1', trend.value >= 0 ? 'text-success' : 'text-error')}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className={clsx('p-2.5 rounded-xl', colors.bg)}>
            <div className={clsx('w-5 h-5', colors.icon)}>{icon}</div>
          </div>
        )}
      </div>
    </Card>
  );
}
