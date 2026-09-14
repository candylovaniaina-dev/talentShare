import { useEffect } from "react";
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from "lucide-react";

const STYLES = {
  success: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-800", Icon: CheckCircle },
  error:   { bg: "bg-rose-50 border-rose-200",       text: "text-rose-800",    Icon: AlertCircle },
  info:    { bg: "bg-blue-50 border-blue-200",       text: "text-blue-800",    Icon: Info },
  warning: { bg: "bg-amber-50 border-amber-200",     text: "text-amber-800",   Icon: AlertTriangle },
};

export default function Toast({ message, type = "info", onClose, duration = 4000 }) {
  useEffect(() => {
    if (!duration) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  const { bg, text, Icon } = STYLES[type] || STYLES.info;

  return (
    <div className={`fixed top-4 right-4 z-[100] flex max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg ${bg} ${text} animate-in slide-in-from-top`}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button onClick={onClose} className="opacity-60 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );
}