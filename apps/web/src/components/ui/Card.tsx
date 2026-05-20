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

export const Card = React.memo(function Card({
  variant = 'default',
  padding = 'md',
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[--radius-lg] bg-[--bg-primary] border border-[--border]',
        'dark:bg-[--bg-secondary] dark:border-[--border]',
        variant === 'default' && 'shadow-[--shadow-sm] dark:shadow-none',
        variant === 'interactive' && [
          'shadow-[--shadow-sm] cursor-pointer',
          'transition-all duration-200',
          'hover:shadow-[--shadow-md] hover:-translate-y-0.5',
          'active:translate-y-0',
          'dark:hover:bg-[--bg-tertiary]',
        ],
        variant === 'flat' && 'border-[--border] dark:border-[--border-strong]',
        paddingStyles[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
