'use client';

import React, { useId, useState } from 'react';
import { cn } from '../../lib/cn';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'placeholder'> {
  label: string;
  error?: string;
  success?: boolean;
  hint?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
}

export const Input = React.memo(function Input({
  label,
  error,
  success,
  hint,
  prefixIcon,
  suffixIcon,
  className,
  value,
  defaultValue,
  ...props
}: InputProps) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');

  const currentValue = value !== undefined ? value : internalValue;
  const hasValue = String(currentValue).length > 0;
  const isFloated = focused || hasValue;

  return (
    <div className="relative w-full">
      <div className={cn(
        'relative flex items-center rounded-[--radius-md] border transition-all duration-150',
        error
          ? 'border-[--danger] focus-within:shadow-[0_0_0_3px_rgba(239,68,68,0.20)]'
          : success
          ? 'border-[--success] focus-within:shadow-[0_0_0_3px_rgba(16,185,129,0.20)]'
          : 'border-[--border] focus-within:border-[--nexus-500] focus-within:shadow-[--shadow-brand]',
        'bg-[--bg-primary] dark:bg-[--bg-secondary]',
      )}>
        {prefixIcon && (
          <span className="pl-3 text-[--text-tertiary] flex-shrink-0">{prefixIcon}</span>
        )}
        <div className="relative flex-1">
          <label
            htmlFor={id}
            className={cn(
              'absolute left-3 transition-all duration-150 pointer-events-none select-none',
              isFloated
                ? 'top-1 text-xs font-medium'
                : 'top-1/2 -translate-y-1/2 text-sm',
              focused
                ? error ? 'text-[--danger]' : success ? 'text-[--success]' : 'text-[--nexus-500]'
                : 'text-[--text-tertiary]',
            )}
          >
            {label}
          </label>
          <input
            id={id}
            value={value}
            defaultValue={defaultValue}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => {
              setInternalValue(e.target.value);
              props.onChange?.(e);
            }}
            className={cn(
              'w-full bg-transparent outline-none text-sm text-[--text-primary]',
              'pt-5 pb-1.5 px-3',
              prefixIcon ? 'pl-1' : 'pl-3',
              className,
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            {...props}
          />
        </div>
        {(success || error || suffixIcon) && (
          <span className="pr-3 flex-shrink-0 text-sm">
            {error ? <span className="text-[--danger]" aria-hidden>✕</span>
              : success ? <span className="text-[--success]" aria-hidden>✓</span>
              : suffixIcon}
          </span>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-[--danger] flex items-center gap-1">
          <span aria-hidden>⚠</span> {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-[--text-tertiary]">{hint}</p>
      )}
    </div>
  );
});
