import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import api from "../../services/api";

export const BASE_URL = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
export const fileUrl = (p) => (!p ? null : /^https?:/.test(p) ? p : `${BASE_URL}/storage/${p}`);
export const asArray = (d) => (Array.isArray(d) ? d : d && Array.isArray(d.data) ? d.data : []);
export const formatShortDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) : "");

export function timeAgo(d) {
  if (!d) return "";
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (!Number.isFinite(diff)) return "";
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`;
  return formatShortDate(d);
}

export const OFFER_TYPES = {
  internship: "Stage", apprenticeship: "Alternance", junior_mission: "Mission junior",
  first_job: "Emploi", permanent: "Recrutement permanent",
};

export const hash = (value) => [...String(value || "")].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);
export const GRADIENTS = [
  "from-[#0B1F33] to-[#16324F]", "from-[#16B8B1] to-[#0F9691]", "from-slate-600 to-slate-800", "from-teal-500 to-emerald-700",
];

export const getMissionTitle = (mission) => {
  if (mission.title) return mission.title;
  if (mission.resource_offer?.title) return mission.resource_offer.title;
  if (mission.resource_request?.title) return mission.resource_request.title;
  if (mission.proposal?.resource_request?.title) return mission.proposal.resource_request.title;
  if (mission.job_offer?.title) return mission.job_offer.title;
  const talent = mission.profile?.user?.name || "Talent";
  const company = mission.requesting_company?.name || mission.requestingCompany?.name || "Entreprise";
  return `Mission de ${talent} chez ${company}`;
};

export function getAuthor(post) {
  const isTalent = post.author_type === "talent";
  const prof = post.author?.professional_profile;
  return {
    isTalent,
    name: isTalent ? post.author?.name || "Talent" : post.company?.name || post.author?.name || "Entreprise",
    logo: fileUrl(isTalent ? prof?.avatar_path || post.author?.avatar_path : post.company?.logo_path),
    subtitle: isTalent ? prof?.headline : [post.company?.city, post.company?.country].filter(Boolean).join(", "),
  };
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function useCountUp(target = 0, duration = 700) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) { setVal(target); return undefined; }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

export function useNow(interval = 60000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return now;
}

/* ---------- Styles communs (doux) ---------- */
export const card =
  "rounded-2xl bg-white shadow-[0_1px_2px_rgba(16,42,67,0.04),0_10px_30px_-14px_rgba(16,42,67,0.10)] ring-1 ring-slate-900/[0.04] dark:bg-[#112A3A] dark:shadow-none dark:ring-white/[0.06]";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1F33] px-4 py-2.5 text-[13px] font-medium text-white transition hover:bg-[#16324F] active:scale-[.98] disabled:opacity-50 dark:bg-[#16B8B1] dark:text-[#0B1F33] dark:hover:bg-[#0F9691]";
export const btnSoft =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100/80 px-4 py-2.5 text-[13px] font-medium text-slate-600 transition hover:bg-slate-100 active:scale-[.98] dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15";

export const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
.ts-root{font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif}
@keyframes ts-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes ts-pop{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:none}}
@keyframes ts-shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
.ts-fade,.ts-rise{animation:ts-fade .4s ease-out backwards}
.ts-pop{animation:ts-pop .2s ease-out}
.ts-skel{background:linear-gradient(90deg,rgba(148,163,184,.10) 25%,rgba(148,163,184,.22) 50%,rgba(148,163,184,.10) 75%);background-size:800px 100%;animation:ts-shimmer 1.6s linear infinite}
.ts-noscroll{scrollbar-width:none}.ts-noscroll::-webkit-scrollbar{display:none}
@media (prefers-reduced-motion:reduce){.ts-fade,.ts-rise,.ts-pop,.ts-skel{animation:none!important}}
`;

/* ---------- Petits composants ---------- */
export function Avatar({ src, name, size = 40, rounded = "rounded-full", fit = "cover", className = "" }) {
  const [err, setErr] = useState(false);
  useEffect(() => setErr(false), [src]);
  return (
    <div
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-slate-100 font-medium text-slate-500 dark:bg-white/10 dark:text-slate-300 ${rounded} ${className}`}
    >
      {src && !err ? (
        <img src={src} alt="" onError={() => setErr(true)} className={`h-full w-full ${fit === "contain" ? "object-contain p-1" : "object-cover"}`} />
      ) : (
        <span style={{ fontSize: size * 0.4 }}>{(name || "?").charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

export function Chip({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs text-slate-600 ring-1 ring-slate-900/5 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10">
      {Icon && <Icon size={13} className="text-teal-500" />} {children}
    </span>
  );
}

export function Empty({ icon: Icon, text, compact = false }) {
  return (
    <div className={`flex flex-col items-center rounded-2xl bg-slate-50/70 px-4 text-center dark:bg-white/[0.03] ${compact ? "py-6" : "py-10"}`}>
      {Icon && (
        <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm dark:bg-white/10">
          <Icon size={18} />
        </span>
      )}
      <p className="max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );
}

export function ModalShell({ title, subtitle, icon: Icon, onClose, children, footer, maxWidth = "max-w-2xl" }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="ts-root fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={`ts-pop flex max-h-[90vh] w-full ${maxWidth} flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#112A3A]`}>
        <div className="flex shrink-0 items-center justify-between gap-3 bg-gradient-to-br from-[#0B1F33] to-[#16324F] px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            {Icon && <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-teal-300"><Icon size={19} /></span>}
            <div>
              <h3 className="text-base font-semibold tracking-tight">{title}</h3>
              {subtitle && <p className="text-[11px] text-white/65">{subtitle}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20">
            <X size={17} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer}
      </div>
    </div>
  );
}