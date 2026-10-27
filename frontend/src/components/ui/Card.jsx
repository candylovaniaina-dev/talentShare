import React from "react";

export function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-slate-300 dark:border-white/10 dark:bg-[#112A3A] dark:shadow-none dark:hover:border-white/20 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ title, action }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-white/10">
      <h3 className="min-w-0 truncate text-sm font-bold tracking-tight text-slate-800 dark:text-white">
        {title}
      </h3>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function EmptyState({ emoji, text, action }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-8 text-center dark:border-white/10 dark:bg-[#0B1F33]">
      {emoji && <div className="mb-4 text-4xl">{emoji}</div>}
      <p className="mx-auto max-w-md text-sm text-slate-500 dark:text-slate-400">
        {text}
      </p>
      {action && <div className="mt-6">{action}</div>}
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
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#0B1F33] dark:text-slate-300 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
    >
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}

export function Badge({ icon: Icon, children, tone = "teal" }) {
  const tones = {
    teal: "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
    rose: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
    blue: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
    slate: "border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
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