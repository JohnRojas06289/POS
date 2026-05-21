'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, ScanBarcode, X } from 'lucide-react';
import { cn } from '../../lib/cn';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  resultCount?: number;
  onBarcodeScan?: () => void;
  className?: string;
}

export const SearchBar = React.memo(function SearchBar({ value, onChange, resultCount, onBarcodeScan, className }: SearchBarProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    (window as Window & { posSearchRef?: HTMLInputElement | null }).posSearchRef = ref.current;
    return () => { (window as Window & { posSearchRef?: HTMLInputElement | null }).posSearchRef = null; };
  }, []);

  useEffect(() => {
    if (draft === value) return;
    const timer = window.setTimeout(() => onChange(draft), 300);
    return () => window.clearTimeout(timer);
  }, [draft, onChange, value]);

  return (
    <div className={cn('relative flex items-center', className)}>
      <div className="pointer-events-none absolute left-3 text-[var(--text-gold)]" aria-hidden>
        <Search size={16} />
      </div>
      <input
        ref={ref}
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={draft ? '' : 'Buscar producto...'}
        aria-label="Buscar productos"
        autoFocus
        className={cn(
          'w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] py-3 pl-10 pr-24 text-sm text-[var(--text-primary)] shadow-[var(--shadow-sm)] outline-none transition-all duration-150',
          'placeholder:text-[var(--text-tertiary)] focus:border-[var(--gold-500)] focus:shadow-[var(--shadow-gold)]',
        )}
      />
      <div className="absolute right-2 flex items-center gap-1">
        {draft && resultCount !== undefined && <span className="text-xs text-[var(--text-tertiary)]">{resultCount}</span>}
        {draft && (
          <button
            onClick={() => {
              setDraft('');
              onChange('');
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
            aria-label="Limpiar búsqueda"
          >
            <X size={14} />
          </button>
        )}
        {onBarcodeScan && (
          <button
            onClick={onBarcodeScan}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-gold)]"
            aria-label="Escanear código de barras"
          >
            <ScanBarcode size={14} />
          </button>
        )}
      </div>
    </div>
  );
});
