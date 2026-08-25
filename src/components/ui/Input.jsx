import React, { useState } from 'react';

/**
 * Standardized Input component with label, validation message, password toggle, and icon slots.
 */
export default function Input({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  containerClassName = '',
  autoComplete,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`w-full flex flex-col space-y-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="font-label-md text-xs font-semibold uppercase tracking-wider text-on-surface-variant flex items-center justify-between"
        >
          <span>
            {label} {required && <span className="text-error font-bold">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center w-full">
        {leftIcon && (
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">
            {leftIcon}
          </span>
        )}

        <input
          id={inputId}
          name={name}
          type={effectiveType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={`w-full min-h-[44px] py-2.5 rounded-xl font-body-md text-sm text-on-surface bg-surface-container-lowest border transition-all duration-200 outline-none placeholder:text-outline-variant focus:ring-2 focus:ring-primary/20 ${
            leftIcon ? 'pl-11' : 'pl-3.5'
          } ${isPassword || rightIcon ? 'pr-11' : 'pr-3.5'} ${
            error
              ? 'border-error text-error focus:border-error focus:ring-error/20 bg-error-container/10'
              : 'border-outline-variant/50 focus:border-primary'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-surface-container-high' : ''} ${className}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1 rounded-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        )}

        {!isPassword && rightIcon && (
          <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">
            {rightIcon}
          </span>
        )}
      </div>

      {error && (
        <div id={`${inputId}-error`} className="flex items-center gap-1 text-xs text-error font-medium pt-0.5">
          <span className="material-symbols-outlined text-[15px] shrink-0">error</span>
          <span>{error}</span>
        </div>
      )}

      {!error && helperText && (
        <p id={`${inputId}-helper`} className="text-[11px] text-on-surface-variant/80 font-normal pt-0.5">
          {helperText}
        </p>
      )}
    </div>
  );
}
