import React from 'react';
import Button from './Button';

/**
 * Standardized ErrorState component for network failures and error boundaries.
 */
export default function ErrorState({
  icon = 'error',
  title = 'Something Went Wrong',
  message = 'We encountered an error loading this information. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl bg-error-container/10 border border-error/30 max-w-lg mx-auto ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-error-container/40 flex items-center justify-center text-error mb-4">
        <span className="material-symbols-outlined text-[32px]">{icon}</span>
      </div>

      <h3 className="font-headline-md text-lg font-bold text-error mb-1.5">{title}</h3>
      <p className="font-body-md text-sm text-on-surface-variant max-w-sm mb-6 leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <Button variant="danger" size="md" onClick={onRetry} leftIcon="refresh">
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
