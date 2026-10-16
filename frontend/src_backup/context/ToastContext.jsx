import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast doit être utilisé dans <ToastProvider>");
  }

  return context;
}

const STYLES = {
  success: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    iconBg: "bg-emerald-500/15",
    Icon: CheckCircle,
    title: "Succès",
  },
  error: {
    border: "border-rose-500/30",
    bg: "bg-rose-500/10",
    text: "text-rose-500",
    iconBg: "bg-rose-500/15",
    Icon: AlertCircle,
    title: "Erreur",
  },
  info: {
    border: "border-sky-500/30",
    bg: "bg-sky-500/10",
    text: "text-sky-500",
    iconBg: "bg-sky-500/15",
    Icon: Info,
    title: "Information",
  },
  warning: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    iconBg: "bg-amber-500/15",
    Icon: AlertTriangle,
    title: "Attention",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    const timer = timers.current.get(id);

    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = "success", duration = 4000) => {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;

      const toast = {
        id,
        message: String(message ?? ""),
        type: STYLES[type] ? type : "info",
      };

      setToasts((current) => [...current, toast]);

      if (duration > 0) {
        const timer = setTimeout(() => {
          dismiss(id);
        }, duration);

        timers.current.set(id, timer);
      }
    },
    [dismiss]
  );

  useEffect(() => {
    const activeTimers = timers.current;

    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed right-3 top-3 z-[9999] flex w-[calc(100%-1.5rem)] max-w-[380px] flex-col gap-3 sm:right-5 sm:top-5"
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            {...toast}
            onClose={() => dismiss(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ message, type = "info", onClose }) {
  const style = STYLES[type] || STYLES.info;
  const Icon = style.Icon;

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={[
        "pointer-events-auto flex items-start gap-3 rounded-2xl border p-4",
        "bg-[var(--bg-surface)] shadow-xl shadow-slate-950/10",
        "backdrop-blur-xl transition-all duration-200",
        style.border,
        style.bg,
      ].join(" ")}
      style={{
        animation: "slideIn 0.25s ease-out",
      }}
    >
      <span
        className={[
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          style.iconBg,
          style.text,
        ].join(" ")}
      >
        <Icon size={19} strokeWidth={2.2} aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm font-semibold text-[var(--text-app)]">
          {style.title}
        </p>
        <p className="mt-1 break-words text-sm leading-relaxed text-[var(--text-muted,var(--text-app))]">
          {message}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer la notification"
        className="shrink-0 rounded-lg p-1.5 text-[var(--text-faint)] transition-colors hover:bg-black/5 hover:text-[var(--text-app)] focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}