import React from 'react';
import { cn } from '../../lib/cn';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

const styles: Record<BadgeVariant, string> = {
  success: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  danger: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  neutral: 'bg-[--bg-tertiary] text-[--text-secondary]',
  brand: 'bg-[--nexus-500]/10 text-[--nexus-500]',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  neutral: 'bg-slate-400',
  brand: 'bg-[--nexus-500]',
};

export const Badge = React.memo(function Badge({
  children, variant = 'neutral', dot, pulse, className,
}: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
      styles[variant],
      className,
    )}>
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant])}>
          {pulse && <span className={cn('absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping', dotColors[variant])} />}
        </span>
      )}
      {children}
    </span>
  );
});
