import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  Search, ChevronDown, MoreHorizontal, Trash2, X, Check,
  Loader2, Inbox, ChevronRight, LayoutList, LayoutGrid,
} from "lucide-react";

/* Helpers */
export const asArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

export const timestamp = (item) => {
  const date = item?.created_at || item?.published_at || item?.updated_at;
  if (!date) return 0;
  const result = new Date(date).getTime();
  return Number.isNaN(result) ? 0 : result;
};

export const fmtDate = (date) => {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(parsed);
};

export const initials = (name = "") =>
  String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("");

/* Boutons */
const BUTTON_VARIANTS = {
  primary: "bg-[#16B8B1] text-[#0F2340] hover:bg-[#0F9691] focus-visible:ring-[#16B8B1] shadow-sm font-bold",
  secondary: "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-300 dark:border-white/10 dark:bg-transparent dark:text-slate-200 dark:hover:bg-white/5",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-300 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white",
  soft: "bg-[#16B8B1]/10 text-[#0F9691] hover:bg-[#16B8B1]/20 focus-visible:ring-[#16B8B1] dark:text-[#16B8B1] dark:bg-[#16B8B1]/10 dark:hover:bg-[#16B8B1]/20",
  danger: "text-slate-500 hover:bg-rose-50 hover:text-rose-700 focus-visible:ring-rose-300 dark:text-slate-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400",
};

const BUTTON_SIZES = { sm: "h-8 px-3 text-xs", md: "h-9 px-3.5 text-[13px]" };

export function Button({ variant = "secondary", size = "sm", icon: Icon, to, className = "", children, ...props }) {
  const classes = `inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`;
  if (to) return <Link to={to} className={classes} {...props}>{Icon && <Icon size={14} />}{children}</Link>;
  return <button type="button" className={classes} {...props}>{Icon && <Icon size={14} />}{children}</button>;
}

/* Onglets soulignés */
export function Segmented({ value, onChange, options = [] }) {
  return (
    <div role="tablist" className="flex w-full items-center gap-6 overflow-x-auto border-b border-slate-200 dark:border-white/10">
      {options.map((option) => {
        const active = value === option.id;
        return (
          <button key={option.id} type="button" role="tab" aria-selected={active} onClick={() => onChange(option.id)} className={`-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 py-3 text-[13px] transition ${active ? "border-[#16B8B1] font-bold text-[#0F2340] dark:text-white" : "border-transparent text-slate-500 hover:text-[#0F2340] dark:text-slate-400 dark:hover:text-white"}`}>
            {option.label}
            <span className={`min-w-5 rounded-md px-1.5 py-0.5 text-center text-[10px] font-bold tabular-nums ${active ? "bg-[#16B8B1]/10 text-[#0F9691] dark:bg-[#16B8B1]/20 dark:text-[#16B8B1]" : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"}`}>{option.count ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}

/* Commutateur liste / grille */
export function ViewToggle({ value, onChange }) {
  const items = [{ id: "list", icon: LayoutList, label: "Vue liste" }, { id: "grid", icon: LayoutGrid, label: "Vue grille" }];
  return (
    <div className="inline-flex h-9 items-center gap-0.5 rounded-lg bg-slate-100 p-0.5 dark:bg-white/5">
      {items.map(({ id, icon: Icon, label }) => (
        <button key={id} type="button" aria-label={label} aria-pressed={value === id} onClick={() => onChange(id)} className={`flex h-8 w-8 items-center justify-center rounded-md transition ${value === id ? "bg-white text-[#0F9691] shadow-sm dark:bg-[#16B8B1]/20 dark:text-[#16B8B1]" : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}><Icon size={15} /></button>
      ))}
    </div>
  );
}

/* Recherche */
export function SearchInput({ value, onChange, placeholder = "Rechercher..." }) {
  return (
    <div className="relative w-full sm:w-64">
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[13px] text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#16B8B1] focus:ring-4 focus:ring-[#16B8B1]/10 dark:border-white/10 dark:bg-[#0A1230] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#16B8B1]" />
    </div>
  );
}

/* Liste déroulante */
export function SelectField({ value, onChange, options = [], label }) {
  return (
    <label className="relative block">
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-[13px] text-slate-700 transition hover:border-slate-300 focus:border-[#16B8B1] focus:outline-none focus:ring-4 focus:ring-[#16B8B1]/10 dark:border-white/10 dark:bg-[#0A1230] dark:text-slate-200">
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
    </label>
  );
}

/* Statuts */
export function StatusBadge({ status, config = {} }) {
  const item = config[status] || { label: status || "Non défini", style: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400", dot: "bg-slate-400" };
  return <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium ${item.style}`}><span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />{item.label}</span>;
}

/* Briques de carte */
export function MetaItem({ icon: Icon, children }) {
  return <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">{Icon && <Icon size={13} className="text-slate-400" />}{children}</span>;
}

export function Figure({ value, label, accent = false }) {
  return (
    <div className="min-w-[56px]">
      <p className={`text-lg font-bold leading-none tabular-nums ${accent ? "text-[#16B8B1]" : "text-[#0F2340] dark:text-white"}`}>{value}</p>
      <p className="mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

export function Pipeline({ steps = [], current = -1 }) {
  return (
    <div className="flex w-full max-w-md items-start gap-1.5" aria-hidden="true">
      {steps.map((step, i) => (
        <div key={step.id} className="min-w-0 flex-1">
          <div className={`h-1 rounded-full ${i <= current ? "bg-[#16B8B1]" : "bg-slate-200 dark:bg-white/10"}`} />
          <p className={`mt-1.5 truncate text-[11px] ${i === current ? "font-bold text-[#0F2340] dark:text-white" : "text-slate-400"}`}>{step.label}</p>
        </div>
      ))}
    </div>
  );
}

/* Menu contextuel */
export function DropdownActions({ items = [] }) {
  const [open, setOpen] = useState(false);
  if (!items.length) return null;
  const handleAction = (item) => { setOpen(false); if (item.onClick) item.onClick(); };
  return (
    <div className="relative shrink-0">
      <button type="button" aria-label="Ouvrir les actions" aria-expanded={open} onClick={() => setOpen((v) => !v)} className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${open ? "bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-slate-200"}`}><MoreHorizontal size={17} /></button>
      {open && (
        <>
          <button type="button" aria-label="Fermer le menu" className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-40 min-w-[190px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg shadow-slate-900/10 dark:border-white/10 dark:bg-[#131E47]">
            {items.map((item, index) => {
              const Icon = item.icon || ChevronRight;
              const classes = `flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition ${item.danger ? "text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"}`;
              return item.to ? (
                <Link key={`${item.label}-${index}`} to={item.to} onClick={() => setOpen(false)} className={classes}><Icon size={14} />{item.label}</Link>
              ) : (
                <button key={`${item.label}-${index}`} type="button" onClick={() => handleAction(item)} className={classes}><Icon size={14} />{item.label}</button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* Confirmation de suppression */
export function ConfirmDialog({ title, message, fallbackError = "Une erreur est survenue.", onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const confirm = async () => {
    if (loading) return;
    setLoading(true); setError("");
    try { await onConfirm(); }
    catch (err) { setError(err.response?.data?.message || err.message || fallbackError); setLoading(false); }
  };
  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#0F2340]/50 p-4 backdrop-blur-sm" onClick={loading ? undefined : onCancel}>
      <div role="alertdialog" aria-modal="true" className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#131E47]" onClick={(e) => e.stopPropagation()}>
        <div className="p-5">
          <h3 className="text-base font-bold text-[#0F2340] dark:text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{message}</p>
          {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3 dark:border-white/10 dark:bg-white/5">
          <Button variant="secondary" size="md" disabled={loading} onClick={onCancel}>Annuler</Button>
          <button type="button" disabled={loading} onClick={confirm} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-rose-600 px-3.5 text-[13px] font-bold text-white transition hover:bg-rose-700 disabled:opacity-60">
            {loading ? <><Loader2 size={14} className="animate-spin" /> Suppression…</> : <><Trash2 size={14} /> Supprimer</>}
          </button>
        </div>
      </div>
    </div>, document.body
  );
}

/* Notification */
export function Notice({ message, onClose }) {
  if (!message) return null;
  return createPortal(
    <div className="fixed bottom-6 right-6 z-[10001] flex max-w-sm items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl shadow-slate-900/10 dark:border-white/10 dark:bg-[#131E47]">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#16B8B1]/10 text-[#0F9691] dark:bg-[#16B8B1]/20 dark:text-[#16B8B1]"><Check size={12} /></span>
      <p className="min-w-0 flex-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{message}</p>
      <button type="button" onClick={onClose} aria-label="Fermer la notification" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"><X size={14} /></button>
    </div>, document.body
  );
}

/* Chargement */
export function ListSkeleton({ label = "Chargement..." }) {
  return (
    <div className="space-y-2.5" role="status" aria-label={label}>
      {[1, 2, 3].map((item) => (
        <div key={item} className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#131E47]">
          <div className="flex items-center gap-2"><div className="h-5 w-16 rounded-md bg-slate-100 dark:bg-white/5" /><div className="h-5 w-12 rounded-md bg-slate-100 dark:bg-white/5" /></div>
          <div className="mt-3 h-4 w-2/5 rounded bg-slate-100 dark:bg-white/5" />
          <div className="mt-2 h-3 w-3/5 rounded bg-slate-100 dark:bg-white/5" />
          <div className="mt-4 h-1 w-full max-w-md rounded bg-slate-100 dark:bg-white/5" />
        </div>
      ))}
    </div>
  );
}

/* État vide */
export function EmptyPanel({ icon: Icon = Inbox, title, text, children }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center dark:border-white/10 dark:bg-[#131E47]">
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"><Icon size={17} strokeWidth={1.7} /></div>
      <h3 className="mt-4 text-sm font-bold text-[#0F2340] dark:text-white">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-6 text-slate-500 dark:text-slate-400">{text}</p>
      {children && <div className="mt-5 flex justify-center">{children}</div>}
    </div>
  );
}