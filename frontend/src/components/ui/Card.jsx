import React from "react";

export function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-5 transition-colors ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ title, action }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <h3 className="truncate text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
        {title}
      </h3>
      {action}
    </div>
  );
}

export function EmptyState({ icon: Icon, emoji, text, action }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border-app)] bg-[var(--bg-surface-hover)] py-8 text-center">
      {Icon && <Icon size={22} className="mx-auto text-[var(--text-faint)]" />}
      {!Icon && emoji && <div className="text-2xl">{emoji}</div>}
      <p className="mt-2 px-4 text-xs text-[var(--text-muted)]">{text}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function GhostButton({ icon: Icon, children, onClick, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-app)] bg-transparent px-2.5 py-1.5 text-[11px] font-medium text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
    >
      {Icon && <Icon size={11} />} {children}
    </button>
  );
}

export function Badge({ icon: Icon, children, tone = "emerald" }) {
  const tones = {
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    amber:   "border-amber-500/30 bg-amber-500/10 text-amber-400",
    rose:    "border-rose-500/30 bg-rose-500/10 text-rose-400",
    blue:    "border-blue-500/30 bg-blue-500/10 text-blue-400",
    slate:   "border-[var(--border-app)] bg-[var(--bg-surface-hover)] text-[var(--text-muted)]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tones[tone]}`}
    >
      {Icon && <Icon size={10} />} {children}
    </span>
  );
}