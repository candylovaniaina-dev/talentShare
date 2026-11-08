import React from "react";
import { Loader2, X } from "lucide-react";
import AppShell from "../layout/AppShell";
import PublicNavbar from "../layout/PublicNavbar";
import { useAuth } from "../../context/AuthContext";

/* ───────────── Libellés ───────────── */
export const MISSION_TYPES = {
  full_time: "Temps plein", part_time: "Temps partiel", freelance: "Freelance",
  mission: "Mission", loan: "Mise à disposition",
};
export const LOCATION_LABELS = { onsite: "Sur site", hybrid: "Hybride", remote: "Télétravail" };
export const UNIT_LABELS = { percentage: "%", hours_per_week: "h/sem", days_per_week: "j/sem" };
export const LEVEL_LABELS = { beginner: "Débutant", intermediate: "Intermédiaire", advanced: "Avancé", expert: "Expert" };
export const VISIBILITY = {
  public: { label: "Publique", hint: "Visible par tous, même sans compte." },
  companies: { label: "Entreprises", hint: "Visible uniquement par les entreprises inscrites." },
  private: { label: "Privée", hint: "Visible uniquement par votre entreprise." },
};

export const OFFER_STATUS = {
  draft:           { label: "Brouillon",        cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300", bar: "bg-slate-300" },
  published:       { label: "Publiée",          cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300", bar: "bg-emerald-500" },
  closed:          { label: "Clôturée",         cls: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300", bar: "bg-rose-400" },
  expired:         { label: "Expirée",          cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300", bar: "bg-amber-400" },
  mission_pending: { label: "Mission en attente", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300", bar: "bg-amber-400" },
  mission_planned: { label: "Mission planifiée", cls: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300", bar: "bg-sky-500" },
  mission_active:  { label: "Mission en cours", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300", bar: "bg-emerald-600" },
};

export const PROPOSAL_STATUS = {
  draft:     { label: "Brouillon", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300", dot: "bg-slate-400" },
  sent:      { label: "Envoyée",   cls: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300", dot: "bg-sky-500" },
  viewed:    { label: "Consultée", cls: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300", dot: "bg-violet-500" },
  accepted:  { label: "Acceptée",  cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300", dot: "bg-emerald-500" },
  declined:  { label: "Refusée",   cls: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300", dot: "bg-rose-500" },
  expired:   { label: "Expirée",   cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300", dot: "bg-amber-500" },
  cancelled: { label: "Annulée",   cls: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400", dot: "bg-slate-400" },
};

/* ───────────── Helpers ───────────── */
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");
export const toInputDate = (d) => (d ? String(d).slice(0, 10) : "");
export const storageUrl = (p) => (p ? `/storage/${p}` : null);
export const initials = (name) =>
  (name || "?").split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase();

export function durationLabel(start, end) {
  if (!start || !end) return "";
  const days = Math.round((new Date(end) - new Date(start)) / 86400000) + 1;
  if (!(days > 0)) return "";
  if (days < 14) return `${days} jour${days > 1 ? "s" : ""}`;
  if (days < 70) return `${Math.round(days / 7)} semaines`;
  const months = Math.round(days / 30.4);
  if (months < 12) return `${months} mois`;
  const y = (months / 12).toFixed(1).replace(".0", "");
  return `${y} an${y === "1" ? "" : "s"}`;
}

export const workloadLabel = (v, u) => `${v ?? "—"} ${UNIT_LABELS[u] || "%"}`;

export const apiError = (err, fallback = "Une erreur est survenue") => {
  const d = err?.response?.data;
  if (d?.errors) {
    const first = Object.values(d.errors)[0];
    return Array.isArray(first) ? first[0] : String(first);
  }
  return d?.message || d?.error || fallback;
};

export const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition " +
  "placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 " +
  "dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-900";

export const cardCls =
  "rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0D2030]";

export const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-500 dark:text-[#06251F] dark:hover:bg-emerald-400";
export const btnGhost =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800";
export const btnDanger =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-500/30 dark:bg-transparent dark:text-rose-300 dark:hover:bg-rose-500/10";

/* ───────────── Composants ───────────── */
export function PageLayout({ children }) {
  const { user } = useAuth();
  if (user) return <AppShell>{children}</AppShell>;
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-[#0B253B]">
      <div className="mx-auto max-w-5xl px-6 pt-6"><PublicNavbar variant="light" /></div>
      {children}
    </div>
  );
}

export function Spinner({ label = "Chargement..." }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
      <Loader2 className="animate-spin text-emerald-600 dark:text-emerald-400" size={24} /> {label}
    </div>
  );
}

export function Badge({ cls = "", children }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>{children}</span>;
}

export function StatusBadge({ map, status }) {
  const cfg = map[status] || { label: status, cls: "bg-slate-100 text-slate-600", dot: "bg-slate-400" };
  return (
    <Badge cls={cfg.cls}>
      {cfg.dot && <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />}
      {cfg.label}
    </Badge>
  );
}

export function Avatar({ name, path, size = 44 }) {
  const style = { width: size, height: size };
  return path ? (
    <img src={storageUrl(path)} alt={name} style={style} className="shrink-0 rounded-2xl border border-slate-200 object-cover dark:border-slate-700" />
  ) : (
    <div style={style} className="flex shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
      {initials(name)}
    </div>
  );
}

export function MetaChip({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
      {Icon && <Icon size={13} className="text-emerald-600 dark:text-emerald-400" />} {children}
    </span>
  );
}

export function SkillChips({ skills = [], max = 6 }) {
  if (!skills.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.slice(0, max).map((s) => (
        <span key={s.id} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {s.name}
        </span>
      ))}
      {skills.length > max && <span className="px-1 py-1 text-[11px] font-semibold text-slate-400">+{skills.length - max}</span>}
    </div>
  );
}

export function Field({ label, hint, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
        {label} {required && <span className="text-emerald-600">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/40">
      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500 dark:text-slate-400">{text}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/** Modale épurée : en-tête simple, séparateurs fins. */
export function Modal({ title, subtitle, icon: Icon, onClose, children, footer, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className={`flex max-h-[92vh] w-full ${wide ? "max-w-2xl" : "max-w-md"} flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-[#0D2030]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-2.5">
            {Icon && <Icon size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />}
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
              {subtitle && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-3.5 dark:border-slate-800">{footer}</div>}
      </div>
    </div>
  );
}