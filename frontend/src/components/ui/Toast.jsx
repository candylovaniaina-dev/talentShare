import { useEffect } from "react";
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from "lucide-react";

const STYLES = {
  success: {
    border: "border-[var(--accent)]/25",
    bg: "bg-[var(--accent-bg)]",
    text: "text-[var(--accent-text)]",
    Icon: CheckCircle,
  },
  error: {
    border: "border-rose-500/25",
    bg: "bg-rose-50 dark:bg-rose-500/10",
    text: "text-rose-700 dark:text-rose-400",
    Icon: AlertCircle,
  },
  info: {
    border: "border-navy-500/25",
    bg: "bg-navy-50 dark:bg-navy-600/15",
    text: "text-navy-700 dark:text-navy-200",
    Icon: Info,
  },
  warning: {
    border: "border-amber-500/25",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    Icon: AlertTriangle,
  },
};

export default function Toast({ message, type = "info", onClose, duration = 4000 }) {
  useEffect(() => {
    if (!duration) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  const { bg, text, border, Icon } = STYLES[type] || STYLES.info;

  return (
    <div
      className={`fixed top-4 right-4 z-[100] flex max-w-md items-start gap-3 rounded-xl2 border ${border} ${bg} ${text} px-4 py-3 shadow-pop`}
      style={{ animation: "slideIn 0.25s ease-out" }}
    >
      <Icon size={18} strokeWidth={1.75} className="mt-0.5 shrink-0" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button onClick={onClose} className="opacity-60 transition hover:opacity-100">
        <X size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
