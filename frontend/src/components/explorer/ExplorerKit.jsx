import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  LayoutGrid,
  List,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

/* ============================================================
   POLICE + ANIMATIONS (une seule fois, partagées par les 3 pages)
============================================================ */

export const FONT = "font-['Plus_Jakarta_Sans',sans-serif]";

export function ExplorerStyles() {
  return (
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
@keyframes ts-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@keyframes ts-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes ts-slide { from { transform: translateX(100%); } to { transform: none; } }
@keyframes ts-toast { from { opacity: 0; transform: translateY(10px) scale(.98); } to { opacity: 1; transform: none; } }
@keyframes ts-live { 0% { box-shadow: 0 0 0 0 rgba(22,184,177,.55); } 100% { box-shadow: 0 0 0 8px rgba(22,184,177,0); } }
.ts-rise { animation: ts-rise .45s cubic-bezier(.2,.7,.2,1) both; }
.ts-fade { animation: ts-fade .2s ease both; }
.ts-slide { animation: ts-slide .3s cubic-bezier(.2,.7,.2,1) both; }
.ts-toast { animation: ts-toast .25s ease both; }
.ts-live { animation: ts-live 1.8s ease-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .ts-rise, .ts-fade, .ts-slide, .ts-toast, .ts-live { animation: none !important; }
}
`}</style>
  );
}

/* ============================================================
   HELPERS
============================================================ */

const DAY = 86400000;

export const hasValue = (v) => v !== null && v !== undefined && v !== "";

export const asArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(date);
};

export const daysSince = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((Date.now() - date.getTime()) / DAY);
};

export const daysUntil = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / DAY);
};

export const formatRelativeDate = (value) => {
  const diff = daysSince(value);
  if (diff === null) return null;
  if (diff <= 0) return "Aujourd'hui";
  if (diff === 1) return "Hier";
  if (diff < 30) return `Il y a ${diff} jours`;
  return formatDate(value);
};

export const getInitials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "TS";

/* ============================================================
   HOOKS
============================================================ */

/** Compteur animé : le nombre « roule » vers sa nouvelle valeur. */
export function useCountUp(target, duration = 600) {
  const [value, setValue] = useState(0);
  const previous = useRef(0);

  useEffect(() => {
    if (typeof target !== "number") return undefined;
    const from = previous.current;
    const start = performance.now();
    let raf;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (target - from) * eased);
      previous.current = next;
      setValue(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

export function AnimatedNumber({ value }) {
  const animated = useCountUp(value);
  return <>{typeof value === "number" ? animated : "…"}</>;
}

/** Favoris persistants (localStorage), recalculés si la clé change (ex. utilisateur chargé). */
export function useSavedIds(storageKey) {
  const read = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const [ids, setIds] = useState(read);
  const currentKey = useRef(storageKey);

  useEffect(() => {
    if (currentKey.current !== storageKey) {
      currentKey.current = storageKey;
      setIds(read());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const toggle = useCallback(
    (id) => {
      setIds((current) => {
        const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          /* stockage indisponible */
        }
        return next;
      });
    },
    [storageKey]
  );

  return [ids, toggle];
}

export function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const flash = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return [toast, flash, () => setToast(null)];
}

/* ============================================================
   PETITS ÉLÉMENTS D'INTERFACE
============================================================ */

export const LABEL = "text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B7F95] dark:text-slate-400";

const FIELD =
  "h-10 w-full rounded-xl border border-[#E4EBF1] bg-white pl-9 pr-8 text-[13px] font-medium text-[#0B1F33] outline-none transition " +
  "placeholder:font-normal placeholder:text-[#94A3B8] focus:border-[#16B8B1] focus:ring-4 focus:ring-[#16B8B1]/10 " +
  "dark:border-white/10 dark:bg-[#131E47] dark:text-white dark:placeholder:text-slate-500";

export function SearchField({ value, onChange, placeholder, label, icon: Icon = Search, className = "" }) {
  return (
    <label className={`relative block ${className}`}>
      <Icon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7F95] dark:text-slate-500" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label || placeholder}
        className={FIELD}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Effacer"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#6B7F95] transition hover:bg-[#E8F8F7] hover:text-[#0B1F33] dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <X size={13} />
        </button>
      )}
    </label>
  );
}

/** Filtre rapide en pastille (activable). tone: teal | rose | amber */
export function QuickChip({ active, onClick, icon: Icon, children, tone = "teal" }) {
  const tones = {
    teal: "border-[#16B8B1] bg-[#E8F8F7] text-[#0F9691] dark:border-[#16B8B1]/50 dark:bg-[#16B8B1]/10 dark:text-[#7FD3CF]",
    rose: "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400",
    amber: "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-semibold transition active:scale-[0.98] ${
        active
          ? tones[tone]
          : "border-[#E4EBF1] bg-white text-[#6B7F95] hover:border-[#BFE3E0] hover:text-[#0F9691] dark:border-white/10 dark:bg-[#131E47] dark:text-slate-400 dark:hover:border-[#16B8B1]/40 dark:hover:text-[#16B8B1]"
      }`}
    >
      {Icon && <Icon size={14} fill={active && tone !== "teal" ? "currentColor" : "none"} />}
      {children}
    </button>
  );
}

export function SelectBox({ value, onChange, label, children }) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 appearance-none rounded-xl border border-[#E4EBF1] bg-white pl-3.5 pr-9 text-xs font-semibold text-[#1F3550] outline-none transition focus:border-[#16B8B1] focus:ring-4 focus:ring-[#16B8B1]/10 dark:border-white/10 dark:bg-[#131E47] dark:text-slate-200"
      >
        {children}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7F95] dark:text-slate-500" />
    </label>
  );
}

export function IconButton({ onClick, label, disabled, spinning, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E4EBF1] bg-white text-[#6B7F95] transition hover:border-[#BFE3E0] hover:text-[#0F9691] disabled:opacity-50 dark:border-white/10 dark:bg-[#131E47] dark:text-slate-400 dark:hover:border-[#16B8B1]/50 dark:hover:text-[#16B8B1]"
    >
      {children || <RefreshCw size={15} className={spinning ? "animate-spin" : ""} />}
    </button>
  );
}

export function ViewToggle({ value, onChange }) {
  const options = [
    { id: "grid", label: "Affichage en grille", icon: LayoutGrid },
    { id: "list", label: "Affichage en liste", icon: List },
  ];

  return (
    <div className="flex h-10 items-center gap-0.5 rounded-xl border border-[#E4EBF1] bg-white p-1 dark:border-white/10 dark:bg-[#131E47]">
      {options.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-label={label}
          aria-pressed={value === id}
          title={label}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
            value === id
              ? "bg-[#0B1F33] text-white dark:bg-[#0F9691]"
              : "text-[#6B7F95] hover:text-[#0F9691] dark:text-slate-400 dark:hover:text-[#16B8B1]"
          }`}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
}

export function FiltersButton({ count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#E4EBF1] bg-white px-3.5 text-xs font-semibold text-[#1F3550] transition hover:border-[#BFE3E0] hover:text-[#0F9691] dark:border-white/10 dark:bg-[#131E47] dark:text-slate-200 dark:hover:border-[#16B8B1]/50 dark:hover:text-[#16B8B1]"
    >
      <SlidersHorizontal size={14} />
      Filtres
      {count > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#16B8B1] px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );
}

/** Rappel des filtres actifs, chacun supprimable d'un clic. */
export function ActiveFilters({ items, onReset }) {
  if (!items.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={item.onRemove}
          className="group inline-flex items-center gap-1.5 rounded-full bg-[#0B1F33]/5 py-1 pl-3 pr-2 text-[11px] font-semibold text-[#0B1F33] transition hover:bg-rose-50 hover:text-rose-600 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
        >
          {item.label}
          <X size={12} className="opacity-60 group-hover:opacity-100" />
        </button>
      ))}
      <button
        type="button"
        onClick={onReset}
        className="text-[11px] font-bold text-[#0F9691] transition hover:text-[#0B6F6B] dark:text-[#16B8B1] dark:hover:text-[#7FD3CF]"
      >
        Tout effacer
      </button>
    </div>
  );
}

/* ============================================================
   TIROIR DE FILTRES
============================================================ */

export function FilterDrawer({ open, onClose, activeCount, onReset, resultCount, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex justify-end" role="dialog" aria-modal="true" aria-label="Filtres">
      <div className="ts-fade absolute inset-0 bg-[#0B1F33]/50 backdrop-blur-sm" onClick={onClose} />

      <aside className="ts-slide relative flex h-full w-full max-w-[400px] flex-col bg-white shadow-2xl dark:bg-[#131E47]">
        <header className="flex items-center justify-between border-b border-[#E4EBF1] px-5 py-4 dark:border-white/10">
          <div>
            <h2 className="text-base font-extrabold text-[#0B1F33] dark:text-white">Filtres</h2>
            <p className="mt-0.5 text-xs text-[#6B7F95] dark:text-slate-400">
              {activeCount > 0 ? `${activeCount} filtre${activeCount > 1 ? "s" : ""} actif${activeCount > 1 ? "s" : ""}` : "Affinez votre recherche"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer les filtres"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#6B7F95] transition hover:bg-[#F5F8FC] hover:text-[#0B1F33] dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

        <footer className="flex items-center gap-3 border-t border-[#E4EBF1] px-5 py-4 dark:border-white/10">
          <button
            type="button"
            onClick={onReset}
            disabled={activeCount === 0}
            className="h-11 rounded-xl border border-[#E4EBF1] px-4 text-xs font-bold text-[#6B7F95] transition hover:border-[#BFE3E0] hover:text-[#0F9691] disabled:opacity-40 dark:border-white/10 dark:text-slate-300"
          >
            Réinitialiser
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-xl bg-[#0B1F33] text-sm font-bold text-white transition hover:bg-[#16324F] dark:bg-[#0F9691] dark:hover:bg-[#16B8B1]"
          >
            Voir {resultCount} résultat{resultCount > 1 ? "s" : ""}
          </button>
        </footer>
      </aside>
    </div>
  );
}

export function DrawerSection({ title, children }) {
  return (
    <section className="mb-7">
      <h3 className={`${LABEL} mb-3`}>{title}</h3>
      {children}
    </section>
  );
}

export function OptionPill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-2 text-xs transition ${
        active
          ? "border-[#16B8B1] bg-[#E8F8F7] font-bold text-[#0F9691] dark:border-[#16B8B1]/50 dark:bg-[#16B8B1]/10 dark:text-[#7FD3CF]"
          : "border-[#E4EBF1] bg-white font-medium text-[#6B7F95] hover:border-[#BFE3E0] hover:text-[#0F9691] dark:border-white/10 dark:bg-[#1A2650] dark:text-slate-400 dark:hover:border-[#16B8B1]/30 dark:hover:text-[#16B8B1]"
      }`}
    >
      {children}
    </button>
  );
}

/* ============================================================
   LISTES, ÉTATS, PAGINATION
============================================================ */

export function ResultsGrid({ view, children }) {
  return (
    <div className={view === "list" ? "mt-5 flex flex-col gap-3" : "mt-5 grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3"}>
      {children}
    </div>
  );
}

export function SkeletonCards({ view, count = 6 }) {
  return (
    <ResultsGrid view={view}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-[#E4EBF1] bg-white p-5 dark:border-white/10 dark:bg-[#131E47]"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-[#E4EBF1] dark:bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/5 rounded bg-[#E4EBF1] dark:bg-white/10" />
              <div className="h-2.5 w-1/4 rounded bg-[#E4EBF1] dark:bg-white/10" />
            </div>
          </div>
          <div className="mt-5 h-4 w-3/4 rounded bg-[#E4EBF1] dark:bg-white/10" />
          <div className="mt-3 h-3 rounded bg-[#E4EBF1] dark:bg-white/10" />
          <div className="mt-2 h-3 w-4/5 rounded bg-[#E4EBF1] dark:bg-white/10" />
          <div className="mt-5 h-12 rounded-xl bg-[#E4EBF1] dark:bg-white/10" />
        </div>
      ))}
    </ResultsGrid>
  );
}

export function EmptyState({ icon: Icon, title, text, actionLabel, onAction }) {
  return (
    <div className="ts-rise mt-5 rounded-3xl border border-dashed border-[#BFE3E0] bg-white px-5 py-16 text-center dark:border-white/20 dark:bg-[#131E47]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F8F7] text-[#0F9691] dark:bg-[#16B8B1]/10 dark:text-[#16B8B1]">
        <Icon size={24} />
      </div>
      <h3 className="mt-5 text-lg font-extrabold text-[#0B1F33] dark:text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6B7F95] dark:text-slate-400">{text}</p>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0B1F33] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#16324F] dark:bg-[#0F9691] dark:hover:bg-[#16B8B1]"
        >
          <X size={15} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

const buildPages = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…a");
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (end < total - 1) pages.push("…b");
  pages.push(total);
  return pages;
};

export function Pagination({ page, totalPages, onChange, label }) {
  if (totalPages <= 1) return null;

  const base =
    "flex h-10 items-center justify-center rounded-xl border border-[#E4EBF1] bg-white text-xs font-bold text-[#6B7F95] transition hover:border-[#BFE3E0] hover:text-[#0F9691] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-[#131E47] dark:text-slate-300 dark:hover:border-[#16B8B1]/50 dark:hover:text-[#16B8B1]";

  return (
    <nav aria-label={label} className="flex flex-wrap items-center justify-center gap-2 pt-8">
      <button type="button" onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} aria-label="Page précédente" className={`${base} gap-1 px-3`}>
        <ChevronLeft size={15} />
        Précédent
      </button>

      {buildPages(page, totalPages).map((p) =>
        typeof p === "string" ? (
          <span key={p} className="px-1 text-xs text-[#6B7F95]">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={page === p ? "page" : undefined}
            className={
              page === p
                ? "flex h-10 min-w-10 items-center justify-center rounded-xl bg-[#0B1F33] px-3 text-xs font-bold text-white shadow-sm dark:bg-[#0F9691]"
                : `${base} min-w-10 px-3`
            }
          >
            {p}
          </button>
        )
      )}

      <button type="button" onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} aria-label="Page suivante" className={`${base} gap-1 px-3`}>
        Suivant
        <ChevronRight size={15} />
      </button>
    </nav>
  );
}

export function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isError = toast.type === "error";

  return (
    <div
      role="status"
      className={`ts-toast fixed bottom-5 right-5 z-[120] flex max-w-[calc(100vw-2.5rem)] items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 text-sm shadow-[0_12px_40px_rgba(11,42,48,0.15)] dark:bg-[#1A2650] ${
        isError
          ? "border-rose-200 text-rose-700 dark:border-rose-500/30 dark:text-rose-400"
          : "border-[#BFE3E0] text-[#0F9691] dark:border-[#16B8B1]/30 dark:text-[#16B8B1]"
      }`}
    >
      {isError ? <AlertCircle size={18} className="shrink-0" /> : <CheckCircle2 size={18} className="shrink-0" />}
      <span className="font-semibold">{toast.msg}</span>
      <button type="button" onClick={onClose} aria-label="Fermer la notification" className="ml-1 rounded-lg p-1 text-[#6B7F95] hover:bg-[#F5F8FC] dark:text-slate-500 dark:hover:bg-white/10">
        <X size={15} />
      </button>
    </div>
  );
}

/* ============================================================
   VISUELS DE CARTE
============================================================ */

export function MatchRing({ score, size = 44 }) {
  const color = score >= 70 ? "#16B8B1" : score >= 50 ? "#F59E0B" : "#94A3B8";

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      title={`${Math.round(score)}% de correspondance avec votre profil`}
      role="img"
      aria-label={`${Math.round(score)}% de correspondance avec votre profil`}
    >
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-[#E4EBF1] dark:text-white/10" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="94.25"
          strokeDashoffset={94.25 - (94.25 * score) / 100}
          style={{ transition: "stroke-dashoffset .8s ease" }}
        />
      </svg>
      <span className="relative text-[10px] font-extrabold" style={{ color }}>
        {Math.round(score)}%
      </span>
    </div>
  );
}

export function Avatar({ url, name, tone = "teal" }) {
  const [failed, setFailed] = useState(false);

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={name}
        onError={() => setFailed(true)}
        className="h-11 w-11 shrink-0 rounded-xl border border-[#E4EBF1] object-cover dark:border-white/10"
      />
    );
  }

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-xs font-extrabold ${
        tone === "indigo"
          ? "border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400"
          : "border-[#E4EBF1] bg-[#E8F8F7] text-[#0F9691] dark:border-white/10 dark:bg-[#16B8B1]/10 dark:text-[#16B8B1]"
      }`}
    >
      {getInitials(name)}
    </div>
  );
}

/** Pastille de statut calculée automatiquement (Nouveau, Clôture proche…). tone: teal | amber | rose | slate */
export function StatusBadge({ tone = "teal", children }) {
  const tones = {
    teal: "bg-[#E8F8F7] text-[#0F9691] dark:bg-[#16B8B1]/10 dark:text-[#7FD3CF]",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
    slate: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
    indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** Mini-bloc d'information (icône + libellé + valeur). */
export function InfoTile({ icon: Icon, label, value, muted, tone }) {
  const toneClass = tone === "amber" ? "text-amber-600 dark:text-amber-400" : "text-[#0B1F33] dark:text-white";

  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-xl bg-[#F5F8FC] px-3 py-2.5 dark:bg-white/5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#0F9691] shadow-sm dark:bg-white/10 dark:text-[#16B8B1]">
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-[#6B7F95] dark:text-slate-400">{label}</p>
        <p className={`truncate text-xs font-extrabold ${muted ? "font-semibold text-slate-400 dark:text-slate-500" : toneClass}`}>{value}</p>
      </div>
    </div>
  );
}