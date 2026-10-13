
import { useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  AlertTriangle,
} from "lucide-react";

const STYLES = {
  success: {
    bg: "border-emerald-200 bg-white",
    iconBg: "bg-emerald-50 text-emerald-700",
    text: "text-slate-800",
    description: "text-slate-500",
    Icon: CheckCircle2,
    accent: "bg-emerald-500",
  },
  error: {
    bg: "border-rose-200 bg-white",
    iconBg: "bg-rose-50 text-rose-700",
    text: "text-slate-800",
    description: "text-slate-500",
    Icon: AlertCircle,
    accent: "bg-rose-500",
  },
  info: {
    bg: "border-blue-200 bg-white",
    iconBg: "bg-blue-50 text-blue-700",
    text: "text-slate-800",
    description: "text-slate-500",
    Icon: Info,
    accent: "bg-blue-500",
  },
  warning: {
    bg: "border-amber-200 bg-white",
    iconBg: "bg-amber-50 text-amber-700",
    text: "text-slate-800",
    description: "text-slate-500",
    Icon: AlertTriangle,
    accent: "bg-amber-500",
  },
};

export default function Toast({
  message,
  type = "info",
  onClose,
  duration = 4000,
}) {
  useEffect(() => {
    if (!duration || !onClose) return undefined;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!message) return null;

  const style = STYLES[type] || STYLES.info;
  const { Icon } = style;

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      className={`fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 overflow-hidden rounded-2xl border p-4 shadow-xl shadow-slate-900/10 sm:right-6 sm:top-6 ${style.bg}`}
    >
      <div
        className={`absolute inset-y-0 left-0 w-1 ${style.accent}`}
      />

      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.iconBg}`}
      >
        <Icon size={20} />
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <p className={`text-sm font-semibold ${style.text}`}>
          {type === "success"
            ? "Opération réussie"
            : type === "error"
              ? "Une erreur est survenue"
              : type === "warning"
                ? "Attention"
                : "Information"}
        </p>

        <p className={`mt-1 break-words text-sm leading-5 ${style.description}`}>
          {message}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer la notification"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <X size={16} />
      </button>
    </div>
  );
}
