import React from 'react';
import { cn } from '../../lib/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({ variant = 'default', padding = 'md', children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-default)]',
        variant === 'default' && 'shadow-[var(--shadow-sm)]',
        variant === 'interactive' && 'shadow-[var(--shadow-sm)] cursor-pointer transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 active:translate-y-0 hover:border-[var(--border-strong)]',
        variant === 'flat' && 'border-[var(--border-default)]',
        paddingStyles[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
