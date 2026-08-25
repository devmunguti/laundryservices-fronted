import React from 'react';

/**
 * Standardized Card component with elevation, hover transitions, and rounded container styles.
 */
export default function Card({
  children,
  className = '',
  hoverable = false,
  onClick,
  padding = 'md', // 'none' | 'sm' | 'md' | 'lg'
  ...props
}) {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-surface-container-lowest rounded-2xl border border-surface-container/60 shadow-[0_1px_4px_rgba(0,0,0,0.03)] transition-all duration-200 ${
        hoverable
          ? 'hover:shadow-md hover:-translate-y-0.5 hover:border-outline-variant/40 cursor-pointer'
          : ''
      } ${paddingStyles[padding] || paddingStyles.md} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
