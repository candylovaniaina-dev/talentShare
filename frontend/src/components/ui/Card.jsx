import React from "react";

export function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface)] p-5 shadow-card transition-all duration-200 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ title, action }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <h3 className="truncate text-sm font-semibold text-[var(--text-app)]">
        {title}
      </h3>
      {action}
    </div>
  );
}

export function EmptyState({ icon: Icon, emoji, text, action }) {
  return (
    <div className="rounded-xl2 border border-dashed border-[var(--border-app)] bg-[var(--bg-surface-2)] py-10 text-center">
      {Icon && <Icon size={24} strokeWidth={1.5} className="mx-auto text-[var(--text-faint)]" />}
      {!Icon && emoji && <div className="text-2xl">{emoji}</div>}
      <p className="mt-3 px-4 text-sm text-[var(--text-muted)]">{text}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function GhostButton({ icon: Icon, children, onClick, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-app)] bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
    >
      {Icon && <Icon size={12} strokeWidth={1.5} />} {children}
    </button>
  );
}

export function Badge({ icon: Icon, children, tone = "mint" }) {
  const tones = {
    mint:   "border-[var(--accent)]/20 bg-[var(--accent-bg)] text-[var(--accent-text)]",
    amber:  "border-amber-500/20 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    rose:   "border-rose-500/20 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
    blue:   "border-blue-500/20 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    navy:   "border-navy-700/20 bg-navy-50 text-navy-700 dark:bg-navy-600/15 dark:text-navy-200",
    slate:  "border-[var(--border-app)] bg-[var(--bg-surface-hover)] text-[var(--text-muted)]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}
    >
      {Icon && <Icon size={11} strokeWidth={2} />} {children}
    </span>
  );
}
