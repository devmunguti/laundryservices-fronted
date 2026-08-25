import React from 'react';

/**
 * Standardized Badge component for status labels, count indicators, and category tags.
 */
export default function Badge({
  children,
  variant = 'default', // 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'purple'
  size = 'md', // 'sm' | 'md'
  dot = false,
  icon = null,
  className = '',
  ...props
}) {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-semibold gap-1 leading-tight',
    md: 'text-xs px-2.5 py-1 font-semibold gap-1.5 leading-tight',
  };

  const variantStyles = {
    default: 'bg-surface-container text-on-surface-variant border border-outline-variant/30',
    primary: 'bg-primary-fixed text-on-primary-fixed-variant border border-primary/20',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300',
    error: 'bg-rose-50 text-rose-800 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300',
    info: 'bg-sky-50 text-sky-800 border border-sky-200/60 dark:bg-sky-950/40 dark:text-sky-300',
    purple: 'bg-purple-50 text-purple-800 border border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300',
  };

  const dotColorStyles = {
    default: 'bg-outline',
    primary: 'bg-primary',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
    info: 'bg-sky-500',
    purple: 'bg-purple-500',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full tracking-wide select-none ${sizeStyles[size] || sizeStyles.md} ${
        variantStyles[variant] || variantStyles.default
      } ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColorStyles[variant] || dotColorStyles.default}`}
        />
      )}
      {icon && (
        <span className="material-symbols-outlined text-[14px] leading-none shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </span>
  );
}
