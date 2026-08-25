import React from 'react';

/**
 * Standardized Skeleton loading components for placeholder shimmer states.
 */
export function Skeleton({ className = '', variant = 'rectangular', ...props }) {
  const variantStyles = {
    rectangular: 'rounded-xl',
    circular: 'rounded-full',
    text: 'rounded-md h-4 my-1',
  };

  return (
    <div
      className={`animate-pulse bg-surface-container-high/70 ${variantStyles[variant] || variantStyles.rectangular} ${className}`}
      {...props}
    />
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`p-6 rounded-2xl bg-surface-container-lowest border border-surface-container/60 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton variant="circular" className="w-12 h-12" />
        <Skeleton variant="rectangular" className="w-20 h-6" />
      </div>
      <Skeleton variant="text" className="w-3/4 h-5" />
      <Skeleton variant="text" className="w-1/2 h-4" />
      <div className="pt-2 flex gap-2">
        <Skeleton variant="rectangular" className="flex-1 h-9 rounded-xl" />
        <Skeleton variant="rectangular" className="w-24 h-9 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`w-full rounded-2xl bg-surface-container-lowest border border-surface-container/60 overflow-hidden ${className}`}>
      <div className="p-4 bg-surface-container/40 flex gap-4 border-b border-surface-container">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" className="flex-1 h-4" />
        ))}
      </div>
      <div className="divide-y divide-surface-container/40">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} variant="text" className="flex-1 h-4" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Skeleton;
