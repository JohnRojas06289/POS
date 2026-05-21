import React from 'react';
import { cn } from '../../lib/cn';

type BadgeVariant = 'gold' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

const styles: Record<BadgeVariant, string> = {
  gold: 'bg-[rgba(201,168,76,0.12)] text-[var(--text-gold)] border-[var(--border-gold)]',
  success: 'bg-[var(--success-bg)] text-[var(--success-text)] border-transparent',
  warning: 'bg-[var(--warning-bg)] text-[var(--warning-text)] border-transparent',
  danger: 'bg-[var(--danger-bg)] text-[var(--danger-text)] border-transparent',
  info: 'bg-[var(--info-bg)] text-[var(--info-text)] border-transparent',
  neutral: 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-default)]',
  brand: 'bg-[rgba(201,168,76,0.12)] text-[var(--text-gold)] border-[var(--border-gold)]',
};

const dotColors: Record<BadgeVariant, string> = {
  gold: 'bg-[var(--text-gold)]',
  success: 'bg-[var(--success-text)]',
  warning: 'bg-[var(--warning-text)]',
  danger: 'bg-[var(--danger-text)]',
  info: 'bg-[var(--info-text)]',
  neutral: 'bg-[var(--text-tertiary)]',
  brand: 'bg-[var(--text-gold)]',
};

export function Badge({ children, variant = 'neutral', dot, pulse, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide', styles[variant], className)}>
      {dot && <span className={cn('relative h-1.5 w-1.5 flex-shrink-0 rounded-full', dotColors[variant])}>{pulse && <span className={cn('absolute inset-0 rounded-full opacity-75 animate-ping', dotColors[variant])} />}</span>}
      {children}
    </span>
  );
}
