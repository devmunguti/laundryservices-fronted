import React from 'react';

/**
 * Standardized Button component with variants, loading state, icon slots, and accessible touch target.
 */
export default function Button({
  children,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  isLoading = false,
  leftIcon = null,
  rightIcon = null,
  onClick,
  className = '',
  title,
  ariaLabel,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-label-md font-semibold rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none';

  const sizeStyles = {
    sm: 'min-h-[36px] px-3 py-1.5 text-xs gap-1.5',
    md: 'min-h-[44px] px-4 py-2.5 text-sm gap-2',
    lg: 'min-h-[50px] px-6 py-3 text-base gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-primary text-on-primary hover:bg-primary-container active:scale-[0.98] shadow-xs shadow-primary/20 hover:shadow-md',
    secondary:
      'bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-[0.98]',
    outline:
      'border border-outline-variant/60 bg-transparent text-on-surface hover:bg-surface-container/50 active:scale-[0.98]',
    danger:
      'bg-error text-on-error hover:bg-red-700 active:scale-[0.98] shadow-xs shadow-error/20',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] shadow-xs shadow-emerald-600/20',
    ghost:
      'bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60 active:scale-[0.98]',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${
        variantStyles[variant] || variantStyles.primary
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && (
            <span className="material-symbols-outlined text-[18px] shrink-0 leading-none">
              {leftIcon}
            </span>
          )}
          <span>{children}</span>
          {rightIcon && (
            <span className="material-symbols-outlined text-[18px] shrink-0 leading-none">
              {rightIcon}
            </span>
          )}
        </>
      )}
    </button>
  );
}
