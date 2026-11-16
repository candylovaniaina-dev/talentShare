
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, AlertTriangle, X, Sparkles } from "lucide-react";

/* ==========================================================================
   DESIGN SYSTEM — TALENTSHARE
   Plus Jakarta Sans · Teal · Slate · Light SaaS
   ========================================================================== */

export const FONT = "font-['Plus_Jakarta_Sans',sans-serif]";

export const MISSION_TYPES = {
  staffing: "Mise à disposition",
  loan: "Mise à disposition",
  mission: "Mission",
  freelance: "Freelance",
  part_time: "Temps partiel",
  full_time: "Temps plein",
  other: "Autre",
};

export const MISSION_FILTERS = {
  staffing: "Mise à disposition",
  mission: "Mission",
  freelance: "Freelance",
  other: "Autre",
};

export const LOCATIONS = {
  onsite: "Sur site",
  remote: "Télétravail",
  hybrid: "Hybride",
};

export const LEVELS = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
  expert: "Expert",
};

const LEVEL_KEYS = Object.keys(LEVELS);

export const STATE = {
  available: {
    label: "Disponible",
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  },
  on_mission: {
    label: "En mission",
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  },
  reserved: {
    label: "Réservé",
    dot: "bg-sky-500",
    chip: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
  },
};

/* ==========================================================================
   BOUTONS / CHAMPS / CARTES
   ========================================================================== */

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#13A69F] px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_3px_10px_rgba(19,166,159,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0E928C] hover:shadow-[0_6px_16px_rgba(19,166,159,0.22)] focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";

export const btnDark =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#172B3B] px-4 py-2.5 text-[13px] font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#243E50] focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-400/30 disabled:cursor-not-allowed disabled:opacity-50";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-600 transition-all duration-200 hover:border-teal-200 hover:bg-teal-50/60 hover:text-teal-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/10 disabled:cursor-not-allowed disabled:opacity-50";

export const btnSoft =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-teal-100 bg-teal-50 px-4 py-2.5 text-[13px] font-bold text-teal-700 transition-all hover:border-teal-200 hover:bg-teal-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/15 disabled:opacity-50";

export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50";

export const inputCls =
  "w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-[13px] font-medium text-slate-700 placeholder:font-normal placeholder:text-slate-400 outline-none transition-all duration-200 hover:border-slate-300 focus:border-[#13A69F] focus:ring-4 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60";

export const cardCls =
  "rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.025)] transition-colors";

/* ==========================================================================
   UTILITAIRES
   ========================================================================== */

export const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export const workloadLabel = (v, u) =>
  v == null
    ? "—"
    : `${v} ${
        u === "percentage"
          ? "%"
          : u === "hours_per_week"
          ? "h / sem."
          : "j / sem."
      }`;

export const apiError = (e) =>
  e?.response?.data?.message ||
  e?.response?.data?.error ||
  "Une erreur est survenue.";

export const money = (n) =>
  new Intl.NumberFormat("fr-FR").format(Math.round(n || 0));

export const toDate = (d) => {
  if (!d) return null;
  const x = new Date(`${String(d).slice(0, 10)}T00:00:00`);
  return Number.isNaN(x.getTime()) ? null : x;
};

export const daysUntil = (d) => {
  const x = toDate(d);
  if (!x) return null;
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.round((x - t) / 86400000);
};

export const relDays = (d) => {
  const n = daysUntil(d);
  if (n === null) return "";
  if (n <= 0) return "aujourd'hui";
  if (n === 1) return "demain";
  if (n < 30) return `dans ${n} jours`;
  return `dans ${Math.round(n / 30.4)} mois`;
};

/** Jours ouvrés (lun-ven) entre deux dates incluses */
export const workingDays = (a, b) => {
  const s = toDate(a);
  const e = toDate(b);
  if (!s || !e || e < s) return 0;

  let n = 0;
  const c = new Date(s);

  while (c <= e) {
    const w = c.getDay();
    if (w !== 0 && w !== 6) n++;
    c.setDate(c.getDate() + 1);
  }

  return n;
};

/** Part de la charge appliquée au calcul d'un coût */
export const workloadFactor = (value, unit) => {
  const v = Number(value) || 0;
  if (unit === "percentage") return Math.min(v, 100) / 100;
  if (unit === "days_per_week") return Math.min(v, 5) / 5;
  if (unit === "hours_per_week") return Math.min(v, 40) / 40;
  return 1;
};

/** État persistant simple (localStorage) */
export function usePersisted(key, initial) {
  const [v, setV] = useState(() => {
    try {
      const r = localStorage.getItem(key);
      return r ? JSON.parse(r) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {
      // Stockage indisponible
    }
  }, [key, v]);

  return [v, setV];
}

/* ==========================================================================
   ONGLETS
   ========================================================================== */

export function Tabs({ tabs, value, onChange, className = "" }) {
  return (
    <div
      role="tablist"
      className={`inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-slate-200/70 bg-slate-100/80 p-1 ${className}`}
    >
      {tabs.map((t) => {
        const active = t.id === value;

        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-[12px] font-bold transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/15 ${
              active
                ? "bg-white text-[#147F7B] shadow-[0_1px_4px_rgba(15,23,42,0.09)]"
                : "text-slate-500 hover:bg-white/60 hover:text-slate-800"
            }`}
          >
            {t.label}
            {t.count != null && (
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums ${
                  active
                    ? "bg-teal-50 text-teal-700"
                    : "bg-slate-200/70 text-slate-500"
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ==========================================================================
   MODALE
   ========================================================================== */

export function ModalFrame({
  icon: Icon,
  title,
  subtitle,
  onClose,
  children,
  footer,
  size = "max-w-lg",
  headerExtra,
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKey);

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [onClose]);

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#102A38]/55 p-3 backdrop-blur-[5px] sm:p-5 ${FONT}`}
      onClick={onClose}
    >
      <div
        className={`relative flex max-h-[92vh] w-full ${size} flex-col overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-[0_28px_90px_-20px_rgba(15,40,55,0.35)]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex shrink-0 items-center gap-3.5 border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
          {Icon && (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-[#119B95] ring-1 ring-teal-100/80">
              <Icon size={20} strokeWidth={2} />
            </span>
          )}

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[16px] font-extrabold tracking-tight text-slate-900">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:rotate-90 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          >
            <X size={17} />
          </button>
        </div>

        {headerExtra && (
          <div className="shrink-0 border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
            {headerExtra}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto bg-white">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-slate-100 bg-slate-50/80 px-5 py-3.5 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ==========================================================================
   AVATAR / BADGES / COMPÉTENCES
   ========================================================================== */

export function Avatar({ name, src, size = 44, square = false }) {
  const [err, setErr] = useState(false);

  useEffect(() => setErr(false), [src]);

  const initials = (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <span
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center overflow-hidden border border-teal-100 bg-gradient-to-br from-[#DDF8F4] to-[#BDECE5] font-extrabold text-[#147F7B] ${
        square ? "rounded-2xl" : "rounded-full"
      }`}
    >
      {src && !err ? (
        <img
          src={src}
          alt=""
          onError={() => setErr(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span style={{ fontSize: size * 0.36 }}>{initials}</span>
      )}
    </span>
  );
}

export function StateBadge({
  state,
  availableFrom,
  indefinite,
  compact = false,
}) {
  const cfg = STATE[state] || STATE.available;

  let extra = "";

  if (!compact && state !== "available") {
    extra = indefinite
      ? " (durée indéterminée)"
      : availableFrom
      ? `, libre le ${fmtDate(availableFrom)}`
      : "";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${cfg.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
      {extra}
    </span>
  );
}

/** Témoin « salarié temporaire » ou « prêté à » */
export function TempBadge({ children = "Salarié temporaire" }) {
  return (
    <span className="inline-flex items-center rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">
      {children}
    </span>
  );
}

export function LevelBars({ level }) {
  const idx = LEVEL_KEYS.indexOf(level);
  if (idx < 0) return null;

  return (
    <span className="ml-1.5 inline-flex items-center gap-0.5" title={LEVELS[level]}>
      {LEVEL_KEYS.map((k, i) => (
        <span
          key={k}
          className={`h-1 w-2 rounded-full ${
            i <= idx ? "bg-[#16B8B1]" : "bg-slate-200"
          }`}
        />
      ))}
    </span>
  );
}

export function SkillChips({ skills = [], max = 5 }) {
  if (!skills.length) return null;

  const list = skills.map((s) =>
    typeof s === "string" ? { name: s } : s
  );

  return (
    <div className="flex flex-wrap gap-1.5">
      {list.slice(0, max).map((s, i) => (
        <span
          key={`${s.name}-${i}`}
          className="inline-flex items-center rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600"
        >
          {s.name}
          <LevelBars level={s.level} />
        </span>
      ))}

      {list.length > max && (
        <span className="self-center px-1 text-[10px] font-bold text-slate-400">
          +{list.length - max}
        </span>
      )}
    </div>
  );
}

/* ==========================================================================
   BARRE DE PROGRESSION
   ========================================================================== */

export function Meter({ value = 0, tone = "teal", className = "" }) {
  const tones = {
    teal: "bg-[#16B8B1]",
    amber: "bg-amber-400",
    violet: "bg-violet-400",
    emerald: "bg-emerald-400",
  };

  const color = tones[tone] || tones.teal;

  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}
    >
      <div
        className={`h-full rounded-full ${color} transition-all duration-700`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/* ==========================================================================
   ENTREPRISE EN ATTENTE
   ========================================================================== */

export function WaiterRow({ w, index }) {
  const name =
    w.company?.name || w.company_name || w.name || "Entreprise";
  const logo = w.company?.logo_url || w.logo_url || null;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-violet-100/80 bg-violet-50/60 p-3.5">
      <Avatar name={name} src={logo} size={40} square />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-[13px] font-bold text-slate-800">
            {name}
          </p>

          <span className="rounded-lg bg-white px-2 py-0.5 text-[10px] font-extrabold text-violet-700">
            n°{w.position || index + 1}
          </span>

          {w.status === "notified" && (
            <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              Notifiée
            </span>
          )}
        </div>

        {w.desired_start_at && (
          <p className="mt-1 text-[11px] font-medium text-slate-500">
            Souhaite démarrer le {fmtDate(w.desired_start_at)}
          </p>
        )}

        {w.message && (
          <p className="mt-1.5 line-clamp-2 text-xs italic leading-5 text-slate-600">
            « {w.message} »
          </p>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   ÉTATS VIDES / SQUELETTES
   ========================================================================== */

export function Empty({ title, text, children }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-14 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-[#13A69F]">
       
      </span>

      <h3 className="text-sm font-extrabold text-slate-800">{title}</h3>

      {text && (
        <p className="mt-2 max-w-sm text-[13px] leading-6 text-slate-500">
          {text}
        </p>
      )}

      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export function Skeleton({ rows = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-slate-100 bg-white p-5"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-slate-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 rounded-full bg-slate-100" />
              <div className="h-2.5 w-1/2 rounded-full bg-slate-50" />
            </div>
          </div>
          <div className="mt-5 h-2.5 w-3/4 rounded-full bg-slate-100" />
          <div className="mt-3 h-2.5 w-1/2 rounded-full bg-slate-50" />
        </div>
      ))}
    </div>
  );
}

/* ==========================================================================
   ÉCRAN DE SUCCÈS
   ========================================================================== */

export function SuccessScreen({
  title,
  text,
  details = [],
  tone = "success",
  actionLabel = "Continuer",
  onClose,
}) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", k);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const warn = tone === "warning";

  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      className={`fixed inset-0 z-[10050] flex items-center justify-center overflow-y-auto bg-[#102A38]/45 p-5 backdrop-blur-sm ${FONT}`}
    >
      <style>{`
        @keyframes tsPop {
          0% { transform: scale(.7); opacity: 0; }
          70% { transform: scale(1.06); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes tsUp {
          from { transform: translateY(12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-ts-anim] { animation: none !important; }
        }
      `}</style>

      <div className="w-full max-w-md rounded-[26px] border border-white/80 bg-white p-7 text-center shadow-[0_30px_90px_-20px_rgba(15,40,55,0.35)] sm:p-9">
        <span
          data-ts-anim
          className={`mx-auto flex h-[68px] w-[68px] items-center justify-center rounded-[22px] ring-8 ${
            warn
              ? "bg-amber-50 text-amber-600 ring-amber-50/60"
              : "bg-teal-50 text-[#119B95] ring-teal-50/60"
          }`}
          style={{ animation: "tsPop .45s ease-out both" }}
        >
          {warn ? (
            <AlertTriangle size={30} />
          ) : (
            <Check size={32} strokeWidth={2.6} />
          )}
        </span>

        <h2
          data-ts-anim
          className="mt-6 text-xl font-extrabold tracking-tight text-slate-900"
          style={{ animation: "tsUp .4s .1s ease-out both" }}
        >
          {title}
        </h2>

        {text && (
          <p
            data-ts-anim
            className="mt-2 text-[13px] leading-6 text-slate-500"
            style={{ animation: "tsUp .4s .18s ease-out both" }}
          >
            {text}
          </p>
        )}

        {details.length > 0 && (
          <ul className="mt-5 space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left text-xs leading-5 text-slate-600">
            {details.map((d, i) => (
              <li key={i} className="flex gap-2">
                <Check size={14} className="mt-0.5 shrink-0 text-teal-600" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        )}

        <button
          autoFocus
          onClick={onClose}
          className={`${btnPrimary} mt-7 w-full py-3`}
        >
          {actionLabel}
        </button>
      </div>
    </div>,
    document.body
  );
}

/* ==========================================================================
   CONFIRMATION
   ========================================================================== */

export function ConfirmDialog({
  title,
  text,
  confirmLabel = "Confirmer",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  return createPortal(
    <div
      className={`fixed inset-0 z-[10040] flex items-center justify-center bg-[#102A38]/45 p-4 backdrop-blur-sm ${FONT}`}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-[24px] border border-white/80 bg-white p-6 shadow-[0_24px_70px_-18px_rgba(15,40,55,0.35)]"
      >
        <div
          className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${
            danger ? "bg-rose-50 text-rose-600" : "bg-teal-50 text-teal-700"
          }`}
        >
          {danger ? <AlertTriangle size={20} /> : <Check size={20} />}
        </div>

        <h3 className="text-[15px] font-extrabold text-slate-900">
          {title}
        </h3>

        {text && (
          <p className="mt-2 text-[13px] leading-6 text-slate-500">
            {text}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className={btnGhost}
          >
            Annuler
          </button>

          <button
            onClick={onConfirm}
            disabled={busy}
            className={danger ? btnDanger : btnPrimary}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
