import React from 'react';
import clsx from 'clsx';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-16 text-center px-4', className)}>
      {icon && (
        <div className="w-16 h-16 bg-accent-50 rounded-2xl flex items-center justify-center mb-4 text-accent">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-primary-text mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-secondary-text max-w-sm text-balance">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
