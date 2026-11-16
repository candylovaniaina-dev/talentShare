import React from "react";
import { AlertCircle, X } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  variant = "primary", // "primary" | "danger" | "success"
  loading = false,
}) {
  if (!isOpen) return null;

  const variants = {
    primary: "bg-[#16B8B1] text-[#0B1F33] hover:bg-[#0F9691] hover:text-white",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
    success: "bg-emerald-600 text-white hover:bg-emerald-500",
  };

  const iconVariants = {
    primary: "bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400",
    danger: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
    success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#131E47]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconVariants[variant]}`}>
              <AlertCircle size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {title}
              </h3>
              {description && (
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-[#0A1230] sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-[#131E47] dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]}`}
          >
            {loading && <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}