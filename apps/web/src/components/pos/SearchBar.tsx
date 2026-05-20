'use client';

import React, { useRef } from 'react';
import { cn } from '../../lib/cn';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  resultCount?: number;
  onBarcodeScan?: () => void;
  className?: string;
}

export const SearchBar = React.memo(function SearchBar({
  value, onChange, resultCount, onBarcodeScan, className,
}: SearchBarProps) {
  const ref = useRef<HTMLInputElement>(null);

  // Expose ref globally for F1 shortcut
  React.useEffect(() => {
    (window as Window & { posSearchRef?: HTMLInputElement | null }).posSearchRef = ref.current;
    return () => { (window as Window & { posSearchRef?: HTMLInputElement | null }).posSearchRef = null; };
  }, []);

  return (
    <div className={cn('relative flex items-center', className)}>
      <span className="absolute left-3 text-[--text-tertiary] pointer-events-none" aria-hidden>🔍</span>
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={value ? '' : 'Buscar productos... (F1)'}
        aria-label="Buscar productos"
        className={cn(
          'w-full pl-10 pr-20 py-2.5 rounded-[--radius-md] border border-[--border]',
          'bg-[--bg-primary] text-[--text-primary] text-sm',
          'focus:outline-none focus:border-[--nexus-500] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.20)]',
          'transition-all duration-150',
        )}
      />
      <div className="absolute right-2 flex items-center gap-1">
        {value && resultCount !== undefined && (
          <span className="text-xs text-[--text-tertiary]">{resultCount}</span>
        )}
        {value && (
          <button
            onClick={() => onChange('')}
            className="w-6 h-6 flex items-center justify-center text-[--text-tertiary] hover:text-[--text-primary] rounded"
            aria-label="Limpiar búsqueda"
          >
            ✕
          </button>
        )}
        {onBarcodeScan && (
          <button
            onClick={onBarcodeScan}
            className="w-7 h-7 flex items-center justify-center text-[--text-tertiary] hover:text-[--nexus-500] rounded transition-colors"
            aria-label="Escanear código de barras"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="3" height="16"/><rect x="6" y="4" width="1" height="16"/>
              <rect x="9" y="4" width="2" height="16"/><rect x="13" y="4" width="1" height="16"/>
              <rect x="16" y="4" width="3" height="16"/><rect x="21" y="4" width="2" height="16"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
});
