'use client';

import React, { forwardRef, useId, useState } from 'react';
import { cn } from '../../lib/cn';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'placeholder' | 'prefix'> {
  label: string;
  error?: string;
  hint?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  success?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, prefix, suffix, prefixIcon, suffixIcon, success, className, value, defaultValue, onChange, ...props },
  ref,
) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const currentValue = value !== undefined ? value : internalValue;
  const hasValue = String(currentValue).length > 0;
  const isFloated = focused || hasValue;
  const start = prefix ?? prefixIcon;
  const end = suffix ?? suffixIcon;

  return (
    <div className="relative w-full">
      <div className={cn(
        'relative flex items-center rounded-[var(--radius-md)] border transition-all duration-150 bg-[var(--bg-surface)]',
        error
          ? 'border-[var(--danger-text)] bg-[var(--danger-bg)]'
          : focused
          ? 'border-[var(--gold-500)] shadow-[var(--shadow-gold)]'
          : success
          ? 'border-[var(--success-text)]'
          : 'border-[var(--border-default)] hover:border-[var(--border-strong)]',
      )}>
        {start && <span className="pl-3 text-[var(--text-tertiary)] flex-shrink-0">{start}</span>}
        <div className="relative flex-1">
          <label
            htmlFor={id}
            className={cn(
              'absolute left-3 pointer-events-none select-none transition-all duration-150 origin-left',
              isFloated ? 'top-1.5 text-[11px] font-medium text-[var(--text-gold)]' : 'top-1/2 -translate-y-1/2 text-[14px] text-[var(--text-tertiary)]',
            )}
          >
            {label}
          </label>
          <input
            id={id}
            ref={ref}
            value={value as string | number | readonly string[] | undefined}
            defaultValue={defaultValue}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(event) => {
              setInternalValue(event.target.value);
              onChange?.(event);
            }}
            className={cn('w-full bg-transparent pt-5 pb-1.5 px-3 text-[14px] text-[var(--text-primary)] outline-none', className)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            {...props}
          />
        </div>
        {end && <span className="pr-3 text-[var(--text-tertiary)] flex-shrink-0">{end}</span>}
      </div>
      {(error || hint) && (
        <p className={cn('mt-1.5 text-[12px] px-1', error ? 'text-[var(--danger-text)]' : 'text-[var(--text-tertiary)]')}>
          {error || hint}
        </p>
      )}
    </div>
  );
});
