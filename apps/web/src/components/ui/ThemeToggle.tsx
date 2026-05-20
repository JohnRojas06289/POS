'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />;

  const isDark = theme === 'dark';
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-8 h-8 rounded-[--radius-sm] flex items-center justify-center text-[--text-secondary] hover:text-[--text-primary] hover:bg-[--bg-tertiary] dark:hover:bg-[--bg-tertiary] dark:text-[--text-secondary] transition-all duration-150"
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      <span
        className="text-base transition-transform duration-300"
        style={{ transform: isDark ? 'rotate(0deg)' : 'rotate(180deg)' }}
      >
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  );
}
