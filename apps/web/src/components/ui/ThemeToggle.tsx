'use client';

import { Palette } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { THEME_IDS } from '../../lib/themes';

const THEME_LABELS: Record<string, string> = {
  minimal: 'Minimalista',
  light: 'Claro',
  dark: 'Oscuro',
  sepia: 'Sepia',
  graphite: 'Grafito',
};

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-9 w-9" />;

  const currentTheme = (resolvedTheme ?? theme ?? 'minimal') as string;
  const currentIndex = THEME_IDS.indexOf(currentTheme as (typeof THEME_IDS)[number]);
  const nextTheme = THEME_IDS[(currentIndex + 1) % THEME_IDS.length] ?? 'minimal';

  return (
    <button
      onClick={() => setTheme(nextTheme)}
      className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--border-gold)] hover:text-[var(--text-gold)]"
      aria-label={`Tema actual: ${THEME_LABELS[currentTheme] ?? currentTheme}. Cambiar tema`}
      title={THEME_LABELS[currentTheme] ?? currentTheme}
    >
      <Palette size={16} />
    </button>
  );
}
