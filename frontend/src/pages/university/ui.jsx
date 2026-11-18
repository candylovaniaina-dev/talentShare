import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertTriangle, Inbox, RefreshCw, X } from "lucide-react";
import api from "../../services/api";

/* ---------- Helpers ---------- */
const BASE_URL = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
export const fileUrl = (p) => (!p ? null : /^https?:/.test(p) ? p : `${BASE_URL}/storage/${p}`);
export const errMsg = (e, fb = "Une erreur est survenue.") =>
  e?.response?.data?.message || Object.values(e?.response?.data?.errors || {})?.[0]?.[0] || fb;
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—");
export const initials = (n = "?") => n.split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("");

export const LABELS = {
  verification: { pending: "En attente", verified: "Vérifié", rejected: "Refusé" },
  placement: { searching: "En recherche", internship: "En stage", employed: "En emploi", continuing: "Poursuite d'études", unavailable: "Indisponible" },
  partnership: { pending: "En attente", active: "Actif", declined: "Refusé", ended: "Terminé" },
  convention: { draft: "Brouillon", to_sign: "À signer", signed: "Signée", archived: "Archivée" },
  oppType: { stage: "Stage", alternance: "Alternance", premier_emploi: "Premier emploi", autre: "Autre" },
  convType: { internship: "Stage", alternance: "Alternance", tripartite: "Tripartite", other: "Autre" },
  level: { licence: "Licence", master: "Master", doctorat: "Doctorat", bts: "BTS", dut: "DUT", ingenieur: "Ingénieur", certification: "Certification", autre: "Autre" },
  uniType: { public: "Public", prive: "Privé", institut: "Institut", ecole: "École", centre_formation: "Centre de formation" },
  resType: { stage: "Stage", alternance: "Alternance", premier_emploi: "Premier emploi", mission: "Mission", autre: "Autre" },
  resStatus: { published: "Publiée", filled: "Pourvue", closed: "Clôturée" },
  request: { pending: "En attente", accepted: "Acceptée", declined: "Refusée", withdrawn: "Retirée" },
  uniSize: { lt_500: "Moins de 500 étudiants", "500_2000": "500 à 2 000 étudiants", "2000_10000": "2 000 à 10 000 étudiants", gt_10000: "Plus de 10 000 étudiants" },
  role: { owner: "Propriétaire", admin: "Administrateur", internship_office: "Service des stages", teacher: "Enseignant", viewer: "Lecture seule" },
};

/* ---------- Primitives ---------- */
export const cx = (...c) => c.filter(Boolean).join(" ");

export function Card({ className = "", children, ...p }) {
  return (
    <div {...p} className={cx("rounded-2xl bg-white shadow-[0_1px_2px_rgba(11,31,51,0.04),0_8px_24px_rgba(11,31,51,0.04)] ring-1 ring-[#E4EBF1] dark:bg-[#131E47] dark:ring-white/10", className)}>
      {children}
    </div>
  );
}

const BTN = {
  primary: "bg-[#16B8B1] text-[#0B1F33] hover:bg-[#13a39d] font-semibold",
  dark: "bg-[#0B1F33] text-white hover:bg-[#163650] font-semibold dark:bg-white dark:text-[#0B1F33]",
  ghost: "bg-transparent text-[#526B83] ring-1 ring-[#E4EBF1] hover:bg-[#F3F6FC] dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/5 font-medium",
  solidDanger: "bg-rose-600 text-white hover:bg-rose-700 font-semibold",
  danger: "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 font-semibold",
  soft: "bg-[#16B8B1]/10 text-[#0F9691] hover:bg-[#16B8B1]/20 dark:text-[#16B8B1] font-semibold",
};
export function Btn({ variant = "primary", size = "md", className = "", loading, icon: Icon, children, ...p }) {
  return (
    <button
      {...p}
      disabled={p.disabled || loading}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16B8B1] disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-8 px-3.5 text-[12px]" : "h-10 px-5 text-[13px]",
        BTN[variant], className
      )}
    >
      {loading
        ? <span aria-hidden="true" className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current/30 border-t-current" />
        : Icon && <Icon size={size === "sm" ? 14 : 16} strokeWidth={2.1} className="shrink-0" />}
      {children}
    </button>
  );
}

const TONES = {
  slate: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
  teal: "bg-[#16B8B1]/12 text-[#0F9691] dark:text-[#16B8B1]",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  rose: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
  blue: "bg-[#3478E8]/10 text-[#3478E8] dark:text-sky-300",
  navy: "bg-[#0B1F33] text-white",
};
export function Badge({ tone = "slate", children }) {
  return <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", TONES[tone])}>{children}</span>;
}
export const verifTone = { pending: "amber", verified: "teal", rejected: "rose" };
export const placeTone = { searching: "slate", internship: "blue", employed: "teal", continuing: "amber", unavailable: "slate" };
export const partnerTone = { pending: "amber", active: "teal", declined: "rose", ended: "slate" };
export const resTone = { published: "teal", filled: "blue", closed: "slate" };
export const reqTone = { pending: "amber", accepted: "teal", declined: "rose", withdrawn: "slate" };
export const convTone = { draft: "slate", to_sign: "amber", signed: "teal", archived: "slate" };

const inputCls = "w-full rounded-xl border border-[#E4EBF1] bg-white px-3.5 py-2.5 text-[13px] text-[#102A43] placeholder:text-slate-400 transition focus:border-[#16B8B1] focus:outline-none focus:ring-2 focus:ring-[#16B8B1]/20 dark:border-white/10 dark:bg-white/5 dark:text-white";
export const Input = (p) => <input {...p} className={cx(inputCls, p.className)} />;
export const Textarea = (p) => <textarea rows={3} {...p} className={cx(inputCls, "resize-none", p.className)} />;
export const Select = ({ children, ...p }) => <select {...p} className={cx(inputCls, "pr-8", p.className)}>{children}</select>;
export function Field({ label, hint, children, className = "" }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block text-[12px] font-semibold text-[#526B83] dark:text-slate-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div role="tablist" className="flex gap-6 border-b border-[#E4EBF1] dark:border-white/10">
      {tabs.map((t) => (
        <button
          key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          className={cx("-mb-px border-b-2 pb-3 text-[13px] transition focus:outline-none",
            value === t.id ? "border-[#16B8B1] font-semibold text-[#0B1F33] dark:text-white" : "border-transparent text-[#526B83] hover:text-[#0B1F33] dark:text-slate-400 dark:hover:text-white")}
        >
          {t.label}{t.count != null && <span className="ml-1.5 text-[11px] text-slate-400">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Avatar({ name, src, size = 36, round = "rounded-xl" }) {
  const [err, setErr] = useState(false);
  return (
    <span style={{ width: size, height: size }} className={cx("flex shrink-0 items-center justify-center overflow-hidden bg-[#16B8B1]/15 text-[11px] font-extrabold text-[#0F9691]", round)}>
      {src && !err ? <img src={fileUrl(src)} alt={name} onError={() => setErr(true)} className="h-full w-full object-cover" /> : initials(name)}
    </span>
  );
}

export function Empty({ title, text, action, icon: Icon = Inbox, compact }) {
  return (
    <div className={cx("flex flex-col items-center justify-center px-6 text-center", compact ? "py-8" : "py-14")}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#16B8B1]/10 text-[#0F9691] ring-1 ring-[#16B8B1]/20 dark:text-[#16B8B1]"><Icon size={22} strokeWidth={1.9} /></div>
      <p className="text-[14px] font-semibold text-[#0B1F33] dark:text-white">{title}</p>
      {text && <p className="mt-1 max-w-sm text-[12.5px] text-slate-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export const Spinner = ({ small }) => (
  <div className={cx("flex items-center justify-center", small ? "py-8" : "py-16")} role="status" aria-label="Chargement">
    <span className="h-7 w-7 animate-spin rounded-full border-2 border-[#16B8B1]/25 border-t-[#16B8B1]" />
  </div>
);

/* Erreur de chargement avec bouton « Réessayer » (évite un spinner infini) */
export function ErrorState({ message, onRetry, compact }) {
  return (
    <div role="alert" className={cx("flex flex-col items-center justify-center px-5 text-center", compact ? "py-8" : "py-14")}>
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-500/10"><AlertTriangle size={20} /></span>
      <p className="text-[13px] font-semibold text-[#0B1F33] dark:text-white">Chargement impossible</p>
      {message && <p className="mt-1 max-w-xs text-[12px] text-slate-500">{message}</p>}
      {onRetry && <Btn variant="soft" size="sm" icon={RefreshCw} className="mt-3" onClick={onRetry}>Réessayer</Btn>}
    </div>
  );
}

/* Section de page : en-tête (icône, titre, action) + contenu */
export function Panel({ icon: Icon, title, count, action, children, className = "", bodyClass = "" }) {
  return (
    <Card className={cx("overflow-hidden", className)}>
      <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon && <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#16B8B1]/12 text-[#0F9691] dark:text-[#16B8B1]"><Icon size={16} /></span>}
          <h3 className="truncate text-[14px] font-bold text-[#0B1F33] dark:text-white">{title}</h3>
          {count != null && <span className="rounded-full bg-[#F3F6FC] px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-white/10">{count}</span>}
        </div>
        {action}
      </div>
      <div className={bodyClass}>{children}</div>
    </Card>
  );
}

export function Stat({ label, value, hint, tone = "teal" }) {
  const bar = { teal: "bg-[#16B8B1]", blue: "bg-[#3478E8]", amber: "bg-amber-400", navy: "bg-[#0B1F33] dark:bg-white" }[tone];
  return (
    <Card className="relative overflow-hidden p-5">
      <span className={cx("absolute left-0 top-5 h-8 w-1 rounded-r-full", bar)} />
      <p className="text-[12px] font-medium text-[#526B83] dark:text-slate-400">{label}</p>
      <p className="mt-2 text-[28px] font-bold leading-none tracking-tight text-[#0B1F33] dark:text-white">{value}</p>
      {hint && <p className="mt-2 text-[11.5px] text-slate-400">{hint}</p>}
    </Card>
  );
}

/* Quand une page est affichée dans un onglet d'une autre page, son titre est masqué (seules les actions restent). */
export const Embedded = createContext(false);

export function PageHead({ title, subtitle, actions }) {
  const embedded = useContext(Embedded);
  if (embedded) return actions ? <div className="mb-4 flex flex-wrap items-center justify-end gap-2">{actions}</div> : null;
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-[#0B1F33] dark:text-white">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13px] text-[#526B83] dark:text-slate-400">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    </div>
  );
}

/* Anneau de progression */
export function Ring({ value = 0, size = 76, stroke = 8, label }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-[#E4EBF1] dark:text-white/10" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#16B8B1" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * value) / 100} style={{ transition: "stroke-dashoffset .8s ease" }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[15px] font-bold text-[#0B1F33] dark:text-white">{label ?? `${value}%`}</span>
    </div>
  );
}

/* ---------- Modals modernes (aux couleurs du thème) ---------- */
const KEYFRAMES = `
@keyframes ts-fade{from{opacity:0}to{opacity:1}}
@keyframes ts-pop{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:none}}
@keyframes ts-draw{to{stroke-dashoffset:0}}
@keyframes ts-ring{from{opacity:0;transform:scale(.55)}to{opacity:1;transform:scale(1)}}
@keyframes ts-glow{0%,100%{opacity:.55}50%{opacity:.9}}
@media (prefers-reduced-motion:reduce){.ts-anim,.ts-anim *{animation:none!important;stroke-dashoffset:0!important}}
`;
const Keyframes = () => <style>{KEYFRAMES}</style>;

function useEscape(open, onClose) {
  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = prev; };
  }, [open, onClose]);
}

export function Modal({ open, onClose, title, subtitle, children, footer, wide, size, icon: Icon, tone = "teal" }) {
  useEscape(open, onClose);
  if (!open) return null;
  const max = size === "xl" ? "sm:max-w-4xl" : wide ? "sm:max-w-2xl" : "sm:max-w-lg";
  const iconTone = tone === "rose" ? "bg-rose-50 text-rose-600 ring-rose-200 dark:bg-rose-500/10 dark:ring-rose-500/20" : "bg-[#16B8B1]/12 text-[#0F9691] ring-[#16B8B1]/25 dark:text-[#16B8B1]";
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <Keyframes />
      <button aria-label="Fermer" onClick={onClose} className="ts-anim absolute inset-0 cursor-default bg-[#06141F]/55 backdrop-blur-md" style={{ animation: "ts-fade .2s ease-out" }} />
      <div className={cx("ts-anim relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_30px_80px_rgba(6,20,31,0.35)] ring-1 ring-white/60 sm:rounded-[28px] dark:bg-[#131E47] dark:ring-white/10", max)} style={{ animation: "ts-pop .3s cubic-bezier(.2,.8,.2,1)" }}>
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#16B8B1] via-[#3478E8] to-[#16B8B1]" />
        <div className="flex items-start gap-4 px-6 pb-4 pt-6">
          {Icon && <span className={cx("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1", iconTone)}><Icon size={20} strokeWidth={2} /></span>}
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="text-[17px] font-bold leading-snug tracking-tight text-[#0B1F33] dark:text-white">{title}</h2>
            {subtitle && <p className="mt-1 text-[12.5px] leading-relaxed text-[#526B83] dark:text-slate-400">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Fermer" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#526B83] ring-1 ring-[#E4EBF1] transition hover:bg-[#F3F6FC] hover:text-[#0B1F33] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16B8B1] dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/5">
            <X size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-2">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-[#E4EBF1] bg-[#F8FAFD] px-6 py-4 sm:flex-row sm:justify-end dark:border-white/10 dark:bg-white/[0.03]">{footer}</div>}
      </div>
    </div>
  );
}

export function SuccessModal({ open, title, text, onClose, cta = "Continuer", children, secondary }) {
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label={title}>
      <Keyframes />
      <button aria-label="Fermer" onClick={onClose} className="ts-anim absolute inset-0 cursor-default bg-[#06141F]/55 backdrop-blur-md" style={{ animation: "ts-fade .2s ease-out" }} />
      <div className="ts-anim relative w-full max-w-md overflow-hidden rounded-[28px] bg-white text-center shadow-[0_30px_80px_rgba(6,20,31,0.4)] dark:bg-[#131E47]" style={{ animation: "ts-pop .35s cubic-bezier(.2,.8,.2,1)" }}>
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1F33] via-[#0F3B4A] to-[#0B1F33] px-8 pb-9 pt-10">
          <span aria-hidden="true" className="ts-anim pointer-events-none absolute -left-10 -top-12 h-44 w-44 rounded-full bg-[#16B8B1]/30 blur-3xl" style={{ animation: "ts-glow 3s ease-in-out infinite" }} />
          <span aria-hidden="true" className="pointer-events-none absolute -bottom-16 -right-10 h-44 w-44 rounded-full bg-[#3478E8]/25 blur-3xl" />
          <svg viewBox="0 0 88 88" className="ts-anim relative mx-auto h-[88px] w-[88px]" style={{ animation: "ts-ring .5s cubic-bezier(.2,.8,.2,1)" }} aria-hidden="true">
            <circle cx="44" cy="44" r="40" fill="#16B8B1" fillOpacity=".14" />
            <circle cx="44" cy="44" r="40" fill="none" stroke="#16B8B1" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="252" strokeDashoffset="252" className="ts-anim" style={{ animation: "ts-draw .7s .15s ease-out forwards" }} />
            <path d="M27 45l12 12 22-25" fill="none" stroke="#16B8B1" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="60" strokeDashoffset="60" className="ts-anim" style={{ animation: "ts-draw .45s .65s ease-out forwards" }} />
          </svg>
        </div>
        <div className="px-8 pb-8 pt-6">
          <h2 className="text-[20px] font-bold tracking-tight text-[#0B1F33] dark:text-white">{title}</h2>
          {text && <p className="mt-2 text-[13.5px] leading-relaxed text-[#526B83] dark:text-slate-300">{text}</p>}
          {children && <div className="mt-5 text-left">{children}</div>}
          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
            {secondary}
            <Btn onClick={onClose} className="sm:min-w-[160px]">{cta}</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConfirmModal({ open, title, text, confirmLabel = "Confirmer", danger = true, onConfirm, onCancel }) {
  return (
    <Modal open={open} onClose={onCancel} title={title} subtitle={text} icon={AlertTriangle} tone={danger ? "rose" : "teal"}
      footer={<><Btn variant="ghost" onClick={onCancel}>Annuler</Btn><Btn variant={danger ? "solidDanger" : "primary"} onClick={onConfirm}>{confirmLabel}</Btn></>} />
  );
}

/* const [confirmNode, ask] = useConfirm();  ask({ title, text, confirmLabel, onYes }) ; rendre {confirmNode} dans le JSX */
export function useConfirm() {
  const [st, setSt] = useState(null);
  const ask = useCallback((opts) => setSt(opts), []);
  const node = (
    <ConfirmModal
      open={!!st} title={st?.title} text={st?.text} confirmLabel={st?.confirmLabel} danger={st?.danger !== false}
      onCancel={() => setSt(null)}
      onConfirm={async () => { const f = st?.onYes; setSt(null); await f?.(); }}
    />
  );
  return [node, ask];
}

/* ---------- Toast ---------- */
export function useToast() {
  const [t, setT] = useState(null);
  const timer = useRef();
  const show = useCallback((msg, type = "ok") => {
    setT({ msg, type });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setT(null), 3800);
  }, []);
  const node = t && (
    <div role="status" className={cx("fixed bottom-5 right-5 z-[80] max-w-sm rounded-2xl px-4 py-3 text-[13px] font-medium shadow-xl", t.type === "err" ? "bg-rose-600 text-white" : "bg-[#0B1F33] text-white")}>
      {t.msg}
    </div>
  );
  return [node, show];
}

/* ---------- Chargement de données ---------- */
export function useFetch(url, params, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const load = useCallback(() => {
    if (!url) { setLoading(false); return Promise.resolve(); }
    setLoading(true);
    return api.get(url, { params })
      .then((r) => { setData(r.data); setError(null); })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, JSON.stringify(params), ...deps]);
  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load, setData };
}

export const useDebounced = (value, ms = 350) => {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
};
