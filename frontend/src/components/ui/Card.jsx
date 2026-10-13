
import React from "react";

export function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-slate-300 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ title, action }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="min-w-0 truncate text-sm font-bold tracking-tight text-slate-800">
        {title}
      </h3>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, emoji, text, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-9 text-center">
      {Icon ? (
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm">
          <Icon size={22} />
        </div>
      ) : (
        emoji && <div className="text-3xl">{emoji}</div>
      )}

      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
        {text}
      </p>

      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function GhostButton({
  icon: Icon,
  children,
  onClick,
  type = "button",
  disabled = false,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}

export function Badge({ icon: Icon, children, tone = "teal" }) {
  const tones = {
    teal: "border-teal-200 bg-teal-50 text-teal-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    slate: "border-slate-200 bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tones[tone] || tones.teal}`}
    >
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}
