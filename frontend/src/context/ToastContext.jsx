import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

/* ============================================================
   CONTEXTE
============================================================ */
const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit être utilisé dans <ToastProvider>");
  return ctx;
}

/* ============================================================
   PROVIDER
============================================================ */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Conteneur des toasts */}
      <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} {...toast} onClose={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ============================================================
   ITEM
============================================================ */
const STYLES = {
  success: {
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    iconBg: "bg-emerald-500/20",
    Icon: CheckCircle,
  },
  error: {
    border: "border-rose-500/40",
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    iconBg: "bg-rose-500/20",
    Icon: AlertCircle,
  },
  info: {
    border: "border-blue-500/40",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    iconBg: "bg-blue-500/20",
    Icon: Info,
  },
  warning: {
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    iconBg: "bg-amber-500/20",
    Icon: AlertTriangle,
  },
};

function ToastItem({ message, type = "info", onClose }) {
  const style = STYLES[type] || STYLES.info;
  const Icon = style.Icon;

  return (
    <div
      className="pointer-events-auto flex w-[380px] max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl border p-3.5 shadow-2xl backdrop-blur-xl transition-all"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: style.border.replace(/border-|/g, ""),
        animation: "slideIn 0.25s ease-out",
      }}
    >
      {/* Icône */}
      <span
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${style.iconBg} ${style.text}`}
      >
        <Icon size={14} strokeWidth={2.5} />
      </span>

      {/* Message */}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium leading-relaxed text-[var(--text-app)]">
          {message}
        </p>
      </div>

      {/* Bouton fermer */}
      <button
        onClick={onClose}
        className="shrink-0 rounded-md p-1 text-[var(--text-faint)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
      >
        <X size={14} />
      </button>
    </div>
  );
}