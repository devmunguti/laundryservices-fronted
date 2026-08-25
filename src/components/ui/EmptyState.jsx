import React from 'react';
import Button from './Button';

/**
 * Standardized EmptyState component for zero-data views, search misses, and empty lists.
 */
export default function EmptyState({
  icon = 'inbox',
  title = 'No Data Found',
  description = 'There are no items to display at this time.',
  actionLabel,
  onAction,
  actionIcon,
  className = '',
  children,
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl bg-surface-container-lowest border border-dashed border-outline-variant/50 max-w-lg mx-auto ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-outline mb-4 shadow-inner">
        <span
          className="material-symbols-outlined text-[32px]"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
        >
          {icon}
        </span>
      </div>

      <h3 className="font-headline-md text-lg font-bold text-on-surface mb-1.5">{title}</h3>
      <p className="font-body-md text-sm text-on-surface-variant max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {children}

      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction} leftIcon={actionIcon}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
