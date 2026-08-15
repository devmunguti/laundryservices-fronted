import React, { useEffect, useRef } from 'react';

/**
 * Reusable ConfirmationModal Component for Aura Laundry Platform
 * Replaces native browser alert/confirm dialogs with an accessible, high-fidelity UI dialog.
 */
export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Permanent Deletion',
  subtitle = '',
  itemName = '',
  warningMessage = 'This will remove the cleaner account and all associated services, orders, promotions, and listings from the platform.',
  auditNote = 'Audit logs and system activity records will be preserved.',
  confirmText = 'Delete Permanently',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' | 'warning' | 'primary'
  isLoading = false,
  icon = 'delete_forever'
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
    // Auto-focus the cancel or confirm button on open
    const timer = setTimeout(() => {
      if (confirmBtnRef.current) {
        confirmBtnRef.current.focus();
      }
    }, 50);

    // Prevent body scroll when modal is active
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
      clearTimeout(timer);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isDanger = type === 'danger';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        // Close on backdrop click if not loading
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
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-200 relative overflow-hidden"
      >
        {/* Top Accent Strip */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            isDanger ? 'bg-rose-600' : 'bg-amber-500'
          }`}
        />

        {/* Icon & Title Header */}
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isDanger
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                : 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
            }`}
          >
            <span
              className="material-symbols-outlined text-[28px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {icon}
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
            Are you sure you want to permanently delete{' '}
            <span className="font-bold text-slate-950 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
              "{itemName}"
            </span>
            ?
          </div>
        )}

        {/* Descriptive Warning Callout */}
        <div
          id="confirmation-modal-desc"
          className={`p-4 rounded-2xl text-xs space-y-2 border leading-relaxed ${
            isDanger
              ? 'bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 border-rose-200/80 dark:border-rose-900/50'
              : 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border-amber-200/80 dark:border-amber-900/50'
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5 text-rose-600 dark:text-rose-400">
              warning
            </span>
            <span>{warningMessage}</span>
          </div>

          {auditNote && (
            <div className="flex items-center gap-1.5 pt-2 border-t border-rose-200/60 dark:border-rose-900/40 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              <span className="material-symbols-outlined text-[15px] text-emerald-600 dark:text-emerald-400">
                shield
              </span>
              <span>{auditNote}</span>
            </div>
          )}
        </div>

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
            className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-600/20'
                : 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 shadow-amber-500/20'
            }`}
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  sync
                </span>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">
                  delete
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
