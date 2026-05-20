'use client';

import React, { useRef } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-[--nexus-500] text-white hover:bg-[#1d4ed8] active:bg-[#1e40af] shadow-sm hover:shadow-md dark:hover:bg-blue-400',
  secondary: 'bg-[--bg-tertiary] text-[--text-primary] border border-[--border] hover:border-[--border-strong] hover:bg-[--border] dark:border-[--border-strong]',
  ghost: 'text-[--text-secondary] hover:text-[--text-primary] hover:bg-[--bg-tertiary] dark:hover:bg-[--bg-secondary]',
  danger: 'bg-[--danger] text-white hover:bg-red-600 active:bg-red-700 dark:hover:bg-red-400',
  outline: 'border-2 border-[--nexus-500] text-[--nexus-500] hover:bg-[--nexus-500] hover:text-white dark:text-[--nexus-300] dark:border-[--nexus-300]',
};

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

export const Button = React.memo(function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  leftIcon,
  rightIcon,
  children,
  className,
  onClick,
  ...props
}: ButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Ripple effect
    const btn = btnRef.current;
    if (btn) {
      const circle = document.createElement('span');
      const diameter = Math.max(btn.clientWidth, btn.clientHeight);
      const radius = diameter / 2;
      const rect = btn.getBoundingClientRect();
      circle.style.cssText = `
        width:${diameter}px;height:${diameter}px;
        left:${e.clientX - rect.left - radius}px;
        top:${e.clientY - rect.top - radius}px;
        position:absolute;border-radius:50%;
        background:rgba(255,255,255,0.3);
        animation:ripple 600ms linear;pointer-events:none;
      `;
      btn.appendChild(circle);
      setTimeout(() => circle.remove(), 600);
    }
    onClick?.(e);
  };

  return (
    <button
      ref={btnRef}
      disabled={disabled || loading}
      onClick={handleClick}
      className={cn(
        'relative overflow-hidden inline-flex items-center justify-center font-medium rounded-[--radius-md]',
        'transition-all duration-150 focus-visible:outline-2 focus-visible:outline-[--nexus-500] focus-visible:outline-offset-2',
        'hover:scale-[1.01] active:scale-[0.99]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});
