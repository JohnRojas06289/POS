'use client';

import React, { forwardRef } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'gold' | 'dark' | 'ghost' | 'danger' | 'outline' | 'primary' | 'secondary';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  gold: 'bg-[var(--gold-500)] border-transparent text-[#1A1400] hover:bg-[var(--gold-400)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]',
  dark: 'bg-[#0A0A0A] border-[var(--border-gold)] text-[var(--text-gold)] hover:bg-[#141414] hover:border-[var(--gold-500)]',
  ghost: 'bg-transparent border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]',
  danger: 'bg-transparent border-[rgba(227,75,74,0.3)] text-[var(--danger-text)] hover:bg-[var(--danger-bg)]',
  outline: 'bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]',
  primary: 'bg-[var(--gold-500)] border-transparent text-[#1A1400] hover:bg-[var(--gold-400)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]',
  secondary: 'bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]',
};

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-[14px]',
  lg: 'h-12 px-6 text-[15px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'outline', size = 'md', loading = false, fullWidth = false, disabled, leftIcon, rightIcon, children, className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border font-medium transition-all duration-150 select-none cursor-pointer relative overflow-hidden active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
        </svg>
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});
