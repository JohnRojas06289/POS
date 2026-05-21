import React from 'react';
import { Card } from './Card';

interface KPICardProps {
  label: string;
  value: string;
  delta?: string;
  deltaType?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  onClick?: () => void;
}

export function KPICard({ label, value, delta, deltaType = 'neutral', icon, onClick }: KPICardProps) {
  return (
    <Card variant={onClick ? 'interactive' : 'default'} padding="md" className="p-4" onClick={onClick}>
      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[rgba(201,168,76,0.1)] text-[var(--text-gold)] text-[18px]">
          {icon}
        </div>
        {delta && (
          <span className={deltaType === 'up' ? 'text-[12px] font-medium text-[var(--success-text)]' : deltaType === 'down' ? 'text-[12px] font-medium text-[var(--danger-text)]' : 'text-[12px] font-medium text-[var(--text-tertiary)]'}>
            {deltaType === 'up' ? '↑' : deltaType === 'down' ? '↓' : ''} {delta}
          </span>
        )}
      </div>
      <p style={{ fontFamily: 'var(--font-display)' }} className="mb-1 text-[28px] font-medium leading-none tracking-tight text-[var(--text-primary)]">
        {value}
      </p>
      <p className="text-[12px] text-[var(--text-tertiary)]">{label}</p>
    </Card>
  );
}
