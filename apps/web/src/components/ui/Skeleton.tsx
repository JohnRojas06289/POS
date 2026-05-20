import React from 'react';
import { cn } from '../../lib/cn';

interface SkeletonProps {
  variant?: 'text' | 'card' | 'avatar' | 'table-row' | 'rect';
  width?: string | number;
  height?: string | number;
  className?: string;
  lines?: number;
}

function SkeletonBase({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'shimmer rounded-[--radius-sm]',
        'bg-[--bg-tertiary] dark:bg-[--bg-tertiary] dark:opacity-60',
        className,
      )}
      style={style}
    />
  );
}

export function Skeleton({ variant = 'rect', width, height, className, lines = 3 }: SkeletonProps) {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  if (variant === 'text') {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonBase
            key={i}
            className="h-4"
            style={{ width: i === lines - 1 ? '70%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'avatar') {
    return <SkeletonBase className={cn('rounded-full', className)} style={{ width: width ?? 40, height: height ?? 40 }} />;
  }

  if (variant === 'card') {
    return (
      <div className={cn('rounded-[--radius-lg] border border-[--border] overflow-hidden', className)}>
        <SkeletonBase className="h-40 rounded-none" />
        <div className="p-4 space-y-2">
          <SkeletonBase className="h-4 w-3/4" />
          <SkeletonBase className="h-3 w-1/2" />
          <SkeletonBase className="h-5 w-1/3 mt-3" />
        </div>
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <div className={cn('flex items-center gap-4 p-3', className)}>
        <SkeletonBase className="h-10 w-10 rounded-[--radius-sm] flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBase className="h-4 w-2/3" />
          <SkeletonBase className="h-3 w-1/3" />
        </div>
        <SkeletonBase className="h-6 w-16" />
      </div>
    );
  }

  return <SkeletonBase className={className} style={style} />;
}

export function SkeletonGrid({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid gap-3', className)} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="card" />
      ))}
    </div>
  );
}
