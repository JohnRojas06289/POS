'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cn } from '../../lib/cn';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const typeStyles: Record<ToastType, { bg: string; icon: string; bar: string }> = {
  success: { bg: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/40 dark:border-green-700 dark:text-green-300', icon: '✓', bar: 'bg-green-500' },
  error: { bg: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/40 dark:border-red-700 dark:text-red-300', icon: '✕', bar: 'bg-red-500' },
  warning: { bg: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/40 dark:border-yellow-700 dark:text-yellow-300', icon: '⚠', bar: 'bg-yellow-500' },
  info: { bg: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-300', icon: 'ℹ', bar: 'bg-blue-500' },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const duration = toast.duration ?? 4000;
  const styles = typeStyles[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, onDismiss]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'relative flex items-start gap-3 rounded-[--radius-md] border px-4 py-3 shadow-[--shadow-md] dark:shadow-lg',
        'min-w-[280px] max-w-[380px] overflow-hidden',
        'animate-in slide-in-from-bottom-2 fade-in duration-300',
        styles.bg,
      )}
    >
      <span className="text-base font-bold flex-shrink-0 mt-0.5" aria-hidden>{styles.icon}</span>
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 opacity-60 hover:opacity-100 text-sm leading-none"
        aria-label="Cerrar notificación"
      >
        ✕
      </button>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5">
        <div
          className={cn('h-full transition-all', styles.bar)}
          style={{
            animation: `shrink ${duration}ms linear forwards`,
          }}
        />
      </div>
      <style>{`@keyframes shrink { from { width: 100% } to { width: 0% } }`}</style>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-2), { id, type, message, duration }]);
  }, []);

  const ctx: ToastContextValue = {
    toast: addToast,
    success: (m) => addToast(m, 'success'),
    error: (m) => addToast(m, 'error'),
    warning: (m) => addToast(m, 'warning'),
    info: (m) => addToast(m, 'info'),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div
        aria-label="Notificaciones"
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
