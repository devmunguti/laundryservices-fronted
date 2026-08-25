import React, { useEffect, useRef } from 'react';

/**
 * Reusable ConfirmationModal Component for Laundry Platform
 * Replaces native browser alert/confirm dialogs with an accessible, high-fidelity UI dialog.
 */
export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  subtitle = '',
  itemName = '',
  warningMessage = 'Are you sure you want to proceed with this action?',
  auditNote = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' | 'warning' | 'primary' | 'info'
  isLoading = false,
  icon = 'warning',
}) {
  const modalRef = useRef(null);
  const confirmBtnRef = useRef(null);

  // Keyboard accessibility: ESC to close & focus management
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const timer = setTimeout(() => {
      if (confirmBtnRef.current) {
        confirmBtnRef.current.focus();
      }
    }, 50);

    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
      clearTimeout(timer);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isDanger = type === 'danger';
  const isWarning = type === 'warning';
  const isPrimary = type === 'primary';
  const isInfo = type === 'info';

  const accentColor = isDanger
    ? 'bg-rose-600'
    : isWarning
    ? 'bg-amber-500'
    : isInfo
    ? 'bg-sky-600'
    : 'bg-primary';

  const iconStyles = isDanger
    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
    : isWarning
    ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
    : isInfo
    ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400'
    : 'bg-primary-fixed text-on-primary-fixed-variant';

  const confirmBtnColor = isDanger
    ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-600/20'
    : isWarning
    ? 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 shadow-amber-500/20'
    : isInfo
    ? 'bg-sky-600 hover:bg-sky-700 active:bg-sky-800 shadow-sky-600/20'
    : 'bg-primary hover:bg-primary-container active:scale-[0.98] shadow-primary/20';

  const calloutStyles = isDanger
    ? 'bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 border-rose-200/80 dark:border-rose-900/50'
    : isWarning
    ? 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border-amber-200/80 dark:border-amber-900/50'
    : isInfo
    ? 'bg-sky-50/70 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 border-sky-200/80 dark:border-sky-900/50'
    : 'bg-surface-container text-on-surface border-outline-variant/40';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      aria-describedby="confirmation-modal-desc"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-200 relative overflow-hidden outline-none"
      >
        {/* Top Accent Strip */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${accentColor}`} />

        {/* Icon & Title Header */}
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconStyles}`}>
            <span
              className="material-symbols-outlined text-[28px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {icon || (isDanger ? 'delete_forever' : isWarning ? 'warning' : 'help')}
            </span>
          </div>

          <div className="space-y-1">
            <h3
              id="confirmation-modal-title"
              className="font-headline-sm text-xl font-bold text-slate-900 dark:text-white tracking-tight"
            >
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Item Target Warning */}
        {itemName && (
          <div className="font-medium text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
            Target item:{' '}
            <span className="font-bold text-slate-950 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
              "{itemName}"
            </span>
          </div>
        )}

        {/* Descriptive Warning Callout */}
        {warningMessage && (
          <div
            id="confirmation-modal-desc"
            className={`p-4 rounded-2xl text-xs space-y-2 border leading-relaxed ${calloutStyles}`}
          >
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                {isDanger ? 'warning' : isWarning ? 'info' : 'task_alt'}
              </span>
              <span>{warningMessage}</span>
            </div>

            {auditNote && (
              <div className="flex items-center gap-1.5 pt-2 border-t border-black/10 dark:border-white/10 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                <span className="material-symbols-outlined text-[15px] text-emerald-600 dark:text-emerald-400">
                  shield
                </span>
                <span>{auditNote}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${confirmBtnColor}`}
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  sync
                </span>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">
                  {isDanger ? 'delete' : isWarning ? 'check' : 'done'}
                </span>
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
