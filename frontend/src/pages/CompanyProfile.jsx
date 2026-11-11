import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { countries } from "../utils/countries";
import { cities } from "../utils/cities";
import { CONTRACTS, formatDate } from "../utils/contracts";
import SuggestedTalentsSection from "../components/talents/SuggestedTalentsSection";
import CompanyOnboarding from "./CreateCompanyPage";
import ProposeTalentModal from "../components/resource-sharing/ProposeTalentModal";
import CreateOfferModal from "../components/publications/CreateJobOfferModal";

import {
  Building2, MapPin, Globe, Phone, Users, Edit, Camera, X, Plus,
  Trash2, CheckCircle, AlertCircle, Loader2, Save, Building,
  Link2, Briefcase, ShieldCheck, TrendingUp, Search, Mail, ArrowRight, ArrowUpRight,
  Layers, Star, Calendar, FileText, Home, Clock, Heart,
  MessageCircle, Send, Zap, Euro, Quote, UserPlus, BadgeCheck, RefreshCw,
  LayoutGrid, Flame, GraduationCap, RotateCcw, Rocket,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                 CONSTANTES                                 */
/* -------------------------------------------------------------------------- */

const COMPANY_SIZES = [
  { value: "1-10", label: "1-10 employés" },
  { value: "11-50", label: "11-50 employés" },
  { value: "51-200", label: "51-200 employés" },
  { value: "201-500", label: "201-500 employés" },
  { value: "501-1000", label: "501-1000 employés" },
  { value: "1000+", label: "1000+ employés" },
];

const OFFER_TYPE_OPTIONS = [
  { value: "internship", label: "Stage", hint: "Durée déterminée", icon: GraduationCap, color: "bg-[#0B1F33]" },
  { value: "apprenticeship", label: "Alternance", hint: "Rythme école / entreprise", icon: RotateCcw, color: "bg-[#16324F]" },
  { value: "fixed_term", label: "CDD", hint: "Durée déterminée", icon: Calendar, color: "bg-[#0F9691]" },
  { value: "permanent", label: "Recrutement permanent", hint: "CDI · sans date de fin", icon: Briefcase, color: "bg-[#16B8B1]" },
];

// Libellés (inclut les anciens types pour les offres déjà publiées)
const OFFER_TYPE_LABELS = {
  internship: "Stage", apprenticeship: "Alternance", fixed_term: "CDD",
  permanent: "Recrutement permanent", first_job: "Recrutement permanent",
  junior_mission: "Mission junior", freelance: "Freelance", student_project: "Projet étudiant",
};

// ✅ Groupes de collaborateurs selon le type de contrat
const CONTRACT_GROUPS = [
  { id: "interns", label: "Stagiaires", types: ["internship", "apprenticeship"], icon: GraduationCap },
  { id: "fixed", label: "Salariés CDD", types: ["fixed_term"], icon: Calendar },
  { id: "permanent", label: "Salariés permanents (CDI)", types: ["permanent"], icon: Briefcase },
];

// Durée par défaut (mois) pour calculer automatiquement la date de fin
const DEFAULT_MONTHS = { internship: 3, apprenticeship: 12, fixed_term: 6 };

// Un salarié ajouté à la main sans type est considéré comme permanent
const employeeContract = (e) => e.contract_type || "permanent";

const employeesOfGroup = (list, groupId) =>
  groupId === "all"
    ? list
    : list.filter((e) =>
        CONTRACT_GROUPS.find((g) => g.id === groupId)?.types.includes(employeeContract(e))
      );

const addMonthsISO = (iso, n) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
};

const TABS = [
  { id: "profile", label: "Mon entreprise", hint: "Vitrine & suivi", icon: Building2 },
  { id: "home", label: "Actualité", hint: "Fil du réseau", icon: LayoutGrid },
];

const EMPTY_FORM = {
  name: "", description: "", industry: "", country: "Madagascar", city: "",
  website: "", address: "", phone: "", size: "", latitude: "", longitude: "",
};

const API_BASE = "http://localhost:8001";

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 transition focus:border-[#16B8B1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16B8B1]/20 dark:border-white/10 dark:bg-[#0A1230] dark:text-white";

const card =
  "rounded-xl border border-slate-200/60 bg-white shadow-sm dark:border-white/10 dark:bg-[#131E47]";

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

function buildImageUrl(pathOrUrl, fallback = null) {
  if (!pathOrUrl) return fallback;
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  
  // Nettoie le chemin pour éviter les doubles slashes
  const cleanPath = pathOrUrl.startsWith("/") ? pathOrUrl.slice(1) : pathOrUrl;
  
  // Si le chemin commence déjà par "storage/", on ne le rajoute pas
  if (cleanPath.startsWith("storage/")) {
    return `${API_BASE}/${cleanPath}`;
  }
  return `${API_BASE}/storage/${cleanPath}`;
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

const asList = (res) =>
  Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : [];

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function useCountUp(target = 0, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) { setVal(target); return; }
    let raf; const start = performance.now();
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

function buildActivities(myOffers = [], myProposals = []) {
  const list = [];

  myProposals.forEach((p) => {
    if (p.status === "accepted" || p.mission) {
      let displayStatus = "En cours";
      let tone = "positive";

      if (p.mission?.status === "completed") { displayStatus = "Terminée"; tone = "neutral"; }
      else if (p.mission?.status === "cancelled") { displayStatus = "Annulée"; tone = "danger"; }
      else if (p.interview_status === "validated") { displayStatus = "En cours"; }
      else { displayStatus = "Validée"; tone = "info"; }

      const missionTitle =
        p.mission?.title ||
        p.resource_request?.title ||
        p.resource_offer?.title ||
        p.job_offer?.title ||
        `Mission de ${p.profile?.user?.name || "un talent"}`;

      list.push({
        id: `prop-${p.id}`, rawId: p.id, type: "mission",
        title: missionTitle,
        subtitle: `Avec ${p.profile?.user?.name || "un talent"}`,
        date: p.updated_at || p.created_at, status: displayStatus, tone,
      });
    }
  });

  myOffers.forEach((o) => {
    list.push({
      id: `offer-${o.id}`, rawId: o.id, type: "publication",
      title: o.title || "Offre sans titre",
      subtitle: "Recrutement",
      date: o.created_at,
      status: o.status === "published" ? "Publiée" : "Brouillon",
      tone: o.status === "published" ? "positive" : "neutral",
    });
  });

  return list.sort((a, b) => new Date(b.date) - new Date(a.date));
}

const TONES = {
  positive: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400",
  info: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
  danger: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
  neutral: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400",
};

/* -------------------------------------------------------------------------- */
/*                           PETITS COMPOSANTS UI                             */
/* -------------------------------------------------------------------------- */

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
        {Icon && <Icon size={12} className="text-teal-500" />} {label}
      </label>
      {children}
    </div>
  );
}
function Avatar({ path, name, size = "md", rounded = "full" }) {
  const sizes = {
    xs: "h-7 w-7 text-[10px]",
    sm: "h-9 w-9 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-lg",
    xl: "h-24 w-24 text-2xl",
  };
  const roundedCls = rounded === "full" ? "rounded-full" : "rounded-xl";
  const initials = (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  
  // ✅ On réinitialise l'erreur si le chemin change
  const [error, setError] = useState(false);
  useEffect(() => setError(false), [path]);

  if (!path || error) {
    return (
      <div className={`${sizes[size]} ${roundedCls} flex shrink-0 items-center justify-center bg-[#16B8B1] font-medium text-[#0B1F33]`}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={buildImageUrl(path)}
      alt={name}
      onError={() => setError(true)}
      className={`${sizes[size]} shrink-0 ${roundedCls} border border-slate-200 bg-white object-cover`}
    />
  );
}
function ProgressRing({ value }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" className="dark:stroke-white/10" />
        <circle
          cx="40" cy="40" r={r} fill="none" stroke="#16B8B1" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * value) / 100}
          style={{ transition: "stroke-dashoffset .9s cubic-bezier(.16,1,.3,1)" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-base font-semibold text-slate-700 dark:text-white">{value}%</span>
    </div>
  );
}

function MiniStat({ value, label }) {
  const n = useCountUp(value, 700);
  return (
    <div>
      <p className="text-lg font-semibold tabular-nums text-slate-700 dark:text-white">{n}</p>
      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function StatTile({ icon: Icon, value, label, tone, onClick, suffix = "" }) {
  const n = useCountUp(value, 800);
  const tones = {
    navy: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
    teal: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400",
    blue: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
    amber: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
  };
  return (
    <button onClick={onClick} className={`${card} group relative overflow-hidden p-4 text-left transition duration-300 hover:-translate-y-1.5 hover:shadow-md active:scale-95`}>
      <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone] || tones.navy} shadow-sm transition group-hover:rotate-6`}><Icon size={18} /></span>
      <p className="mt-3 text-2xl font-semibold leading-none tabular-nums text-slate-700 dark:text-white">{n}{suffix}</p>
      <p className="mt-1.5 flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}<ArrowUpRight size={13} className="opacity-0 transition group-hover:opacity-100" /></p>
    </button>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-5">
      {[0, 1, 2].map((i) => <div key={i} className="ts-skel h-56 rounded-xl" style={{ animationDelay: `${i * 120}ms` }} />)}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                     MODALE DE BASE                                         */
/* -------------------------------------------------------------------------- */

function ModalShell({ icon: Icon = Plus, title, subtitle, onClose, children, footer, size = "max-w-lg" }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="ts-fade fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className={`ts-pop flex max-h-[92vh] w-full ${size} flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-[#131E47]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex items-center gap-3.5 overflow-hidden bg-[#0B1F33] px-6 py-5">
          <span className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#16B8B1]/20 blur-2xl" />
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#16B8B1] backdrop-blur">
            <Icon size={20} />
          </span>
          <div className="relative min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold tracking-tight text-white">{title}</h2>
            {subtitle && <p className="mt-0.5 truncate text-[11px] text-white/70">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:rotate-90 hover:bg-white/20"
          >
            <X size={17} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-3.5 dark:border-white/5 dark:bg-white/5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function ModalFooter({ onClose, formId, onSubmit, saving, disabled, label = "Enregistrer", icon: Icon = CheckCircle, cancelLabel = "Annuler" }) {
  const hasSubmit = !!(formId || onSubmit);
  return (
    <>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:bg-transparent dark:text-slate-300 dark:hover:bg-white/5"
      >
        {cancelLabel}
      </button>
      {hasSubmit && (
        <button
          type={formId ? "submit" : "button"}
          form={formId}
          onClick={onSubmit}
          disabled={saving || disabled}
          className="inline-flex items-center gap-2 rounded-lg bg-[#16B8B1] px-5 py-2 text-xs font-medium text-[#0B1F33] shadow-sm transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
          {label}
        </button>
      )}
    </>
  );
}

function ErrorBox({ children }) {
  if (!children) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
      <AlertCircle size={14} className="mt-0.5 shrink-0" />
      {children}
    </div>
  );
}

function PhotoPicker({ preview, onPick, label }) {
  const ref = useRef(null);
  return (
    <div className="flex items-center gap-4 rounded-lg border border-slate-100 bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-white/5">
      <div className="group relative cursor-pointer" onClick={() => ref.current?.click()}>
        {preview ? (
          <img src={preview} alt="aperçu" className="h-16 w-16 rounded-full border-2 border-white object-cover shadow" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-white text-slate-400 dark:border-white/20 dark:bg-white/5">
            <Camera size={20} />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/50 opacity-0 transition group-hover:opacity-100">
          <span className="text-[9px] font-medium text-white">Changer</span>
        </div>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={onPick} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-white">{label}</p>
        <p className="text-xs text-slate-400">Optionnel · 2 Mo maximum</p>
      </div>
    </div>
  );
}

function AccountFound({ user }) {
  if (!user) return null;
  return (
    <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-teal-200/50 bg-teal-50/50 p-2.5 dark:bg-teal-500/10">
      <CheckCircle size={16} className="shrink-0 text-teal-500" />
      <p className="truncate text-xs font-medium text-teal-600 dark:text-teal-400">Compte trouvé : {user.name}</p>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-teal-500 shadow-sm dark:bg-white/10 dark:text-teal-400">
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium text-slate-700 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                     SUIVI D'ACTIVITÉ (TIMELINE)                            */
/* -------------------------------------------------------------------------- */

function CompanyActivityTracker({ activities, onOpen }) {
  const [filter, setFilter] = useState("all");

  const filters = [
    { id: "all", label: "Tout" },
    { id: "mission", label: "Missions" },
    { id: "publication", label: "Publications" },
  ];

  const filtered = activities.filter((a) => filter === "all" || a.type === filter);

  return (
    <section className={`${card} overflow-hidden`}>
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
        <div>
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">Suivi de votre activité</h2>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Missions et publications issues de vos données.</p>
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-50 p-1 dark:bg-white/5" role="tablist">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              onClick={() => setFilter(item.id)}
              className={`shrink-0 rounded-md px-3.5 py-1.5 text-[11px] font-medium transition active:scale-95 ${
                filter === item.id
                  ? "bg-white text-slate-800 shadow-sm dark:bg-white/10 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <span className="ts-float mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-50 text-slate-400 dark:bg-white/5 dark:text-slate-500"><Clock size={22} /></span>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Aucune activité pour le moment</p>
          <p className="mt-1 text-xs text-slate-400">Les nouveaux éléments apparaîtront ici.</p>
        </div>
      ) : (
        <ol className="relative px-5 py-4">
          <span className="absolute bottom-6 left-[34px] top-6 w-px bg-slate-100 dark:bg-white/5" />
          {filtered.slice(0, 8).map((a, i) => (
            <li key={a.id} className="relative" style={{ animationDelay: `${i * 50}ms` }}>
              <button
                type="button"
                onClick={() => onOpen(a)}
                className="group flex w-full items-start gap-4 rounded-lg p-3 text-left transition hover:bg-slate-50 dark:hover:bg-white/5"
              >
                <span className={`relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${a.type === "mission" ? "bg-teal-400" : "bg-slate-400"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 text-[10px]">
                    <span className={`font-semibold uppercase tracking-wider ${a.type === "mission" ? "text-teal-600 dark:text-teal-400" : "text-slate-600 dark:text-slate-300"}`}>
                      {a.type === "mission" ? "Mission" : "Publication"}
                    </span>
                    {a.subtitle && <span className="truncate text-slate-500 dark:text-slate-400">· {a.subtitle}</span>}
                  </div>
                  <h3 className="mt-0.5 truncate text-sm font-medium text-slate-700 transition group-hover:text-teal-600 dark:text-slate-200 dark:group-hover:text-teal-400">{a.title}</h3>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${TONES[a.tone] || TONES.neutral}`}>{a.status}</span>
                  <time className="text-[10px] text-slate-400 dark:text-slate-500">{timeAgo(a.date)}</time>
                </div>
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                               TÉMOIGNAGES                                  */
/* -------------------------------------------------------------------------- */

function TestimonialsSection({ companyId }) {
  const [testimonials, setTestimonials] = useState(() => {
    try {
      const saved = localStorage.getItem(`testimonials_${companyId}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [showModal, setShowModal] = useState(false);

  const save = (list) => {
    setTestimonials(list);
    try { localStorage.setItem(`testimonials_${companyId}`, JSON.stringify(list)); } catch {}
  };

  const remove = (id) => {
    if (!confirm("Supprimer ce témoignage ?")) return;
    save(testimonials.filter((t) => t.id !== id));
  };

  return (
    <>
      <section className={`${card} p-5 sm:p-7`}>
        <div className="mb-5 flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">Témoignages</h3>
          <button onClick={() => setShowModal(true)} className="ts-company-btn ts-company-secondary">
            <Plus size={14} /> Ajouter
          </button>
        </div>

        {testimonials.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-5 py-9 text-center dark:border-white/10 dark:bg-white/5">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white text-teal-500 shadow-sm dark:bg-white/10 dark:text-teal-400">
              <Quote size={20} />
            </span>
            <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">Aucun témoignage pour l'instant</p>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-400">
              Les avis de vos partenaires et collaborateurs renforcent la confiance des talents.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {testimonials.map((t) => (
              <div key={t.id} className="ts-lift group relative rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-white/10 dark:bg-white/5">
                <button
                  onClick={() => remove(t.id)}
                  aria-label="Supprimer"
                  className="absolute right-3 top-3 hidden rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500 group-hover:block"
                >
                  <X size={13} />
                </button>
                <div className="flex items-center gap-3">
                  <Avatar name={t.author} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-white">{t.author}</p>
                    {t.role && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{t.role}</p>}
                  </div>
                </div>
                <div className="mt-3 flex gap-0.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={13} fill={n <= t.rating ? "currentColor" : "none"} />
                  ))}
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">« {t.text} »</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {showModal && (
        <AddTestimonialModal
          onClose={() => setShowModal(false)}
          onSuccess={(entry) => {
            save([entry, ...testimonials]);
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}

function AddTestimonialModal({ onClose, onSuccess }) {
  const [author, setAuthor] = useState("");
  const [role, setRole] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [error, setError] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    setError(null);
    if (!author.trim()) return setError("Le nom est requis.");
    if (!text.trim()) return setError("Le témoignage est requis.");
    onSuccess({
      id: Date.now(),
      author: author.trim(),
      role: role.trim(),
      text: text.trim(),
      rating,
      date: new Date().toISOString(),
    });
  };

  return (
    <ModalShell
      icon={Quote}
      title="Ajouter un témoignage"
      subtitle="Partagez votre expérience avec cette entreprise."
      onClose={onClose}
      footer={<ModalFooter onClose={onClose} formId="testimonial-form" label="Publier le témoignage" />}
    >
      <form id="testimonial-form" onSubmit={submit} className="space-y-5">
        <ErrorBox>{error}</ErrorBox>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field icon={Users} label="Nom de la personne *">
            <input required value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Ex: Jean Dupont" className={inputCls} />
          </Field>
          <Field icon={Briefcase} label="Poste / relation">
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ex: Directeur RH" className={inputCls} />
          </Field>
        </div>

        <Field icon={Quote} label="Témoignage *">
          <textarea required rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Décrivez votre expérience avec cette entreprise..." className={inputCls} />
          <p className="mt-1 text-xs text-slate-400">{text.length} caractère{text.length > 1 ? "s" : ""}</p>
        </Field>

        <Field icon={Star} label="Note">
          <div className="flex items-center gap-1.5 pt-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} className="text-amber-400 transition hover:scale-125">
                <Star size={26} fill={n <= rating ? "currentColor" : "none"} />
              </button>
            ))}
            <span className="ml-2 text-sm font-medium text-slate-500">{rating}/5</span>
          </div>
        </Field>
      </form>
    </ModalShell>
  );
}

/* -------------------------------------------------------------------------- */
/*                                PAGE PRINCIPALE                             */
/* -------------------------------------------------------------------------- */

const STYLES = `
.ts-rise{animation:ts-rise .55s cubic-bezier(.2,.7,.2,1) backwards}
.ts-pop{animation:ts-pop .28s cubic-bezier(.2,.8,.2,1)}
.ts-fade{animation:ts-fade .2s ease-out both}
.ts-float{animation:ts-float 3.2s ease-in-out infinite}
.ts-drift{animation:ts-drift 11s ease-in-out infinite}
.ts-skel{background:linear-gradient(90deg,rgba(148,163,184,.12) 25%,rgba(148,163,184,.28) 50%,rgba(148,163,184,.12) 75%);background-size:800px 100%;animation:ts-shimmer 1.4s linear infinite}
.ts-noscroll{scrollbar-width:none}.ts-noscroll::-webkit-scrollbar{display:none}
.ts-lift{transition:transform .2s ease, box-shadow .2s ease, border-color .2s ease}
.ts-lift:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(11,31,51,.05);border-color:#e2e8f0}
.ts-company-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:500;transition:all .2s ease}
.ts-company-primary{color:#fff;background:#16B8B1;box-shadow:0 4px 12px rgba(22,184,177,.15)}
.ts-company-primary:hover{transform:translateY(-1px);box-shadow:0 8px 18px rgba(22,184,177,.25)}
.ts-company-secondary{background:#fff;border:1px solid #e2e8f0;color:#475569}
.ts-company-secondary:hover{background:#f8fafc;border-color:#cbd5e1}
@media (prefers-reduced-motion:reduce){.ts-rise,.ts-pop,.ts-fade,.ts-float,.ts-drift,.ts-skel,.ts-highlight{animation:none!important}.ts-lift{transition:none!important}}
`;

export default function CompanyProfile() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get("tab") === "home" ? "home" : "profile";
  const highlightId = searchParams.get("highlight");
  const highlightKind = searchParams.get("kind");

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [employeesGroup, setEmployeesGroup] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [createPreset, setCreatePreset] = useState("internship");
  const [applyOffer, setApplyOffer] = useState(null);
  const [recruiterProposal, setRecruiterProposal] = useState(null);
  const [talentProposal, setTalentProposal] = useState(null);

  const [newsFilter, setNewsFilter] = useState("all");
  const [myFilter, setMyFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [myOffers, setMyOffers] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [myProposals, setMyProposals] = useState([]);
  const [feedOffers, setFeedOffers] = useState([]);
  const [feedRequests, setFeedRequests] = useState([]);
  const [loadingHome, setLoadingHome] = useState(false);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [offerSuccess, setOfferSuccess] = useState(false);
  const [pendingHighlight, setPendingHighlight] = useState(null);

  /* ----------------------------- CHARGEMENTS ----------------------------- */

  const loadHome = async () => {
    setLoadingHome(true);
    try {
      const [offersRes, reqRes, propRes] = await Promise.all([
        api.get("/job-offers", { params: { only_mine: 1, per_page: 20 } }).catch(() => ({ data: { data: [] } })),
        api.get("/resource-requests", { params: { my: 1, per_page: 20 } }).catch(() => ({ data: { data: [] } })),
        api.get("/proposals/sent", { params: { per_page: 20 } }).catch(() => ({ data: [] })),
      ]);
      const offers = asList(offersRes);
      const requests = asList(reqRes).filter(
        (r) => r.created_by === user?.id || (company?.id && r.company_id === company.id)
      );
      setMyOffers(offers);
      setMyRequests(requests);
      setMyProposals(asList(propRes));
      return { offers, requests };
    } catch {
      setMyOffers([]); setMyRequests([]); setMyProposals([]);
      return { offers: [], requests: [] };
    } finally {
      setLoadingHome(false);
    }
  };

  const loadActualite = async () => {
    setLoadingFeed(true);
    try {
      const [offersRes, requestsRes] = await Promise.all([
        api.get("/job-offers", { params: { exclude_mine: 1, per_page: 30 } }).catch(() => ({ data: { data: [] } })),
        api.get("/resource-requests", { params: { per_page: 40 } }).catch(() => ({ data: { data: [] } })),
      ]);
      const offers = asList(offersRes).filter((o) => o.company_id !== company?.id);
      const requests = asList(requestsRes).filter(
        (r) => r.company_id !== company?.id && r.created_by !== user?.id
      );
      setFeedOffers(offers);
      setFeedRequests(requests);
      return { offers, requests };
    } catch {
      setFeedOffers([]); setFeedRequests([]);
      return { offers: [], requests: [] };
    } finally {
      setLoadingFeed(false);
    }
  };

  const loadCompany = async () => {
    try {
      setLoading(true);
      const res = await api.get("/companies/me");
      const data = res.data;
      setCompany(data);

      try {
        const r = await api.get(`/companies/${data.id}/members`);
        setMembers(r.data.data || []);
      } catch (err) {
        console.error("Erreur membres :", err);
        setMembers([]);
      }

      try {
        const r = await api.get(`/companies/${data.id}/employees`);
        const list = Array.isArray(r.data) ? r.data : (r.data.data || []);
        setEmployees(list);
      } catch (err) {
        console.error("Erreur salariés :", err);
        setEmployees([]);
      }

    } catch (err) {
      if (err.response?.status === 404) setCompany(null);
      else showToast("Erreur de chargement", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCompany(); }, []);

  useEffect(() => {
    if (!company) return;
    loadHome();
  }, [company?.id]);

  useEffect(() => {
    if (!company) return;
    if (currentTab === "home") loadActualite();
  }, [company?.id, currentTab]);

  useEffect(() => {
    if (!company || !highlightId) return;
    let cancelled = false;

    (async () => {
      const [mine, feed] = await Promise.all([loadHome(), loadActualite()]);
      if (cancelled) return;

      const id = String(highlightId);
      const has = (list) => list.some((x) => String(x.id) === id);
      const kinds = highlightKind === "offer" || highlightKind === "request" ? [highlightKind] : ["offer", "request"];
      let found = null;

      for (const kind of kinds) {
        const key = kind === "offer" ? "offers" : "requests";
        if (has(mine[key])) { found = { tab: "profile", kind }; break; }
        if (has(feed[key])) { found = { tab: "home", kind }; break; }
      }

      if (!found) {
        for (const kind of kinds) {
          try {
            const res = await api.get(kind === "offer" ? `/job-offers/${id}` : `/resource-requests/${id}`);
            const item = res.data?.data || res.data;
            if (!item?.id) continue;
            const isMine = item.company_id === company.id || item.created_by === user?.id;
            const merge = (prev) => [item, ...prev.filter((x) => x.id !== item.id)];
            if (kind === "offer") (isMine ? setMyOffers : setFeedOffers)(merge);
            else (isMine ? setMyRequests : setFeedRequests)(merge);
            found = { tab: isMine ? "profile" : "home", kind };
            break;
          } catch { /* on essaie le type suivant */ }
        }
      }

      if (cancelled) return;

      if (!found) {
        showToast("Cette publication n'est plus disponible.", "error");
        setSearchParams({ tab: "home" }, { replace: true });
        return;
      }

      setSearchQuery("");
      setNewsFilter("all");
      setMyFilter("all");
      setPendingHighlight({ id, kind: found.kind });
      setSearchParams({ tab: found.tab }, { replace: true });
    })();

    return () => { cancelled = true; };
  }, [company?.id, highlightId, highlightKind]);

  useEffect(() => {
    if (!pendingHighlight) return;
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      const el = document.getElementById(`${pendingHighlight.kind}-${pendingHighlight.id}`);
      if (el) {
        clearInterval(timer);
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ts-highlight");
        setTimeout(() => el.classList.remove("ts-highlight"), 4500);
        setPendingHighlight(null);
      } else if (tries > 40) {
        clearInterval(timer);
        setPendingHighlight(null);
      }
    }, 150);
    return () => clearInterval(timer);
  }, [pendingHighlight]);

  /* ------------------------------- ACTIONS -------------------------------- */

  const goTab = (id) => setSearchParams({ tab: id });
  const openCreate = (preset = "internship") => { setCreatePreset(preset); setShowCreateOffer(true); };

  const handleRemoveMember = async (memberId) => {
    if (!confirm("Retirer ce membre ?")) return;
    try { await api.delete(`/companies/${company.id}/members/${memberId}`); showToast("Membre retiré", "success"); loadCompany(); }
    catch { showToast("Erreur", "error"); }
  };
  const handleRemoveEmployee = async (employeeId) => {
    if (!confirm("Retirer ce salarié ?")) return;
    try { await api.delete(`/companies/${company.id}/employees/${employeeId}`); showToast("Salarié retiré", "success"); loadCompany(); }
    catch { showToast("Erreur", "error"); }
  };
  const handleRequestVerification = async () => {
    try { await api.post(`/companies/${company.id}/verify`); showToast("Demande envoyée", "success"); loadCompany(); }
    catch (err) { showToast(err.response?.data?.message || "Erreur", "error"); }
  };

  /* ------------------------------- RENDU ---------------------------------- */

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[55vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="animate-spin text-teal-500" size={34} />
            <span className="text-sm font-medium">Préparation de votre espace entreprise…</span>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!company) {
    return (
      <AppShell>
        <CompanyOnboarding
          onCreated={() => {
            loadCompany();
            navigate("/company?tab=profile");
          }}
        />
      </AppShell>
    );
  }

  const sizeLabel = COMPANY_SIZES.find((s) => s.value === company?.size)?.label || company?.size || "Taille non renseignée";
  const completionItems = [
    ["Logo de l'entreprise", !!(company?.logo_url || company?.logo_path)],
    ["Présentation de l'activité", !!company?.description],
    ["Site web", !!company?.website],
    ["Coordonnées", !!(company?.phone || company?.address)],
    ["Entreprise vérifiée", !!company?.is_verified],
  ];
  const completion = Math.round((completionItems.filter((i) => i[1]).length / completionItems.length) * 100);
  const location = [company.city, company.country].filter(Boolean).join(", ");

  const activities = buildActivities(myOffers, myProposals);

  const openActivity = (a) => {
    if (a.type === "publication") navigate(`/company?tab=profile&highlight=${a.rawId}&kind=offer`);
    else navigate(`/proposals/${a.rawId}`);
  };

  const myPublications = [
    ...myOffers.map((o) => ({ ...o, _type: "offer" })),
    ...myRequests.map((r) => ({ ...r, _type: "request" })),
  ]
    .filter((p) => myFilter === "all" || (myFilter === "offers" ? p._type === "offer" : p._type === "request"))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  let allPublications =
    newsFilter === "all"
      ? [...feedOffers.map((o) => ({ ...o, _type: "offer" })), ...feedRequests.map((r) => ({ ...r, _type: "request" }))]
      : newsFilter === "offers"
      ? feedOffers.map((o) => ({ ...o, _type: "offer" }))
      : feedRequests.map((r) => ({ ...r, _type: "request" }));

  allPublications = allPublications
    .filter((pub) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (pub.title || "").toLowerCase().includes(q) ||
        (pub.description || "").toLowerCase().includes(q) ||
        (pub.company?.name || pub.author?.name || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const infoItems = [
    { label: "Secteur d'activité", value: company.industry, icon: Layers },
    { label: "Taille de l'équipe", value: sizeLabel, icon: Users },
    { label: "Pays / ville", value: location, icon: MapPin },
    { label: "Téléphone professionnel", value: company.phone, icon: Phone },
    { label: "Adresse", value: company.address, icon: Building2 },
    { label: "Site internet", value: company.website, icon: Globe },
  ];

  const renderPublication = (pub, onDeleted) =>
    pub._type === "offer" ? (
      <OfferFeedCard
        key={`offer-${pub.id}`}
        offer={pub}
        currentCompanyId={company.id}
        currentUser={user}
        onDeleted={onDeleted}
        onApply={(o) => setApplyOffer(o)}
      />
    ) : (
      <RequestFeedCard
        key={`request-${pub.id}`}
        request={pub}
        currentUser={user}
        onPropose={(req) =>
          req.author_type === "talent"
            ? setRecruiterProposal(req)
            : setTalentProposal(req)
        }
      />
    );

  const chipBtn = (active) =>
    `rounded-lg px-3.5 py-1.5 text-xs font-medium transition active:scale-95 ${
      active
        ? "bg-white text-slate-800 shadow-sm dark:bg-white/10 dark:text-white"
        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
    }`;

  const groupModalTitle =
    employeesGroup === "all"
      ? "Toute l'équipe salariée"
      : CONTRACT_GROUPS.find((g) => g.id === employeesGroup)?.label;

  return (
    <AppShell>
      <style>{STYLES}</style>

      <div className="min-h-screen bg-[#F8FAFC] px-3 py-4 transition-colors duration-300 dark:bg-transparent sm:px-5 lg:px-7 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="mx-auto max-w-[1280px] space-y-5">

          <div key={currentTab} className="ts-pop">
            {/* ======================= MON ENTREPRISE ======================= */}
            {currentTab === "profile" && (
              <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="min-w-0 space-y-5">
                  <section className={`${card} overflow-hidden`}>
                    <div className="flex items-center gap-3 p-4 sm:p-5">
                      <Avatar path={company.logo_url || company.logo_path} name={company.name} size="lg" rounded="lg" />
                      <button onClick={() => openCreate()} className="group flex h-12 w-full flex-1 items-center justify-between rounded-full border border-slate-200 bg-slate-50 px-5 text-left text-[15px] text-slate-500 transition hover:border-teal-300 hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                        <span>Quel recrutement souhaitez-vous publier ?</span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-600 transition group-hover:rotate-90 dark:bg-teal-500/20 dark:text-teal-400"><Plus size={16} /></span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-px border-t border-slate-100 bg-slate-100 sm:grid-cols-4 dark:border-white/5 dark:bg-white/5">
                      {OFFER_TYPE_OPTIONS.map((c) => (
                        <button key={c.value} onClick={() => openCreate(c.value)} className="group flex items-center gap-2.5 bg-white px-4 py-3 text-left transition hover:bg-slate-50 dark:bg-[#131E47] dark:hover:bg-white/5">
                          <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-white transition group-hover:-rotate-6 group-hover:scale-110 ${c.color}`}><c.icon size={16} /></span>
                          <span>
                            <span className="block text-xs font-medium text-slate-700 dark:text-slate-200">{c.label}</span>
                            <span className="block text-[10px] text-slate-500 dark:text-slate-400">{c.hint}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatTile icon={Briefcase} value={myOffers.length} label="Offres publiées" tone="navy" onClick={() => document.getElementById("my-posts")?.scrollIntoView({ behavior: "smooth" })} />
                    <StatTile icon={Users} value={members.length} label="Membres" tone="teal" onClick={() => setShowAllMembers(true)} />
                    <StatTile icon={UserPlus} value={employees.length} label="Équipe salariée" tone="blue" onClick={() => setEmployeesGroup("all")} />
                    <StatTile icon={TrendingUp} value={completion} suffix="%" label="Profil complété" tone="amber" onClick={() => setShowFormModal(true)} />
                  </div>

                  <CompanyActivityTracker activities={activities} onOpen={openActivity} />

                  <section className={`${card} p-5 sm:p-7`}>
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold text-slate-800 dark:text-white">L'entreprise en bref</h3>
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400"><Building size={18} /></span>
                    </div>
                    <p className="whitespace-pre-line text-[15px] font-medium leading-7 text-slate-600 dark:text-slate-300">
                      {company.description || "Présentez ici votre entreprise, vos domaines d'expertise, vos valeurs et ce qui vous distingue. Une description claire aide les talents et les partenaires à mieux vous connaître."}
                    </p>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {infoItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.label} className="flex min-w-0 items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3.5 dark:border-white/10 dark:bg-white/5">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-teal-600 shadow-sm dark:bg-white/10 dark:text-teal-400">
                              <Icon size={16} />
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-400">{item.label}</p>
                              {item.label === "Site internet" && item.value ? (
                                <a href={item.value.startsWith("http") ? item.value : `https://${item.value}`} target="_blank" rel="noreferrer" className="mt-0.5 block break-all text-sm font-medium text-teal-600 hover:underline dark:text-teal-400">
                                  {item.value}
                                </a>
                              ) : (
                                <p className="mt-0.5 break-words text-sm font-medium text-slate-700 dark:text-slate-200">{item.value || "À compléter"}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section id="my-posts" className={`${card} overflow-hidden`}>
                    <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
                      <div>
                        <h3 className="text-base font-semibold text-slate-800 dark:text-white">Mes publications</h3>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Gérez vos recrutements et demandes visibles par le réseau TalentShare.</p>
                      </div>
                      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-white/5">
                        {[["all", "Tout"], ["offers", "Recrutement"], ["requests", "Demandes"]].map(([id, label]) => (
                          <button key={id} onClick={() => setMyFilter(id)} className={chipBtn(myFilter === id)}>{label}</button>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 sm:p-5">
                      {loadingHome ? (
                        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-teal-500" size={25} /></div>
                      ) : myPublications.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-5 py-10 text-center dark:border-white/10 dark:bg-white/5">
                          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white text-teal-500 shadow-sm dark:bg-white/10 dark:text-teal-400"><FileText size={22} /></span>
                          <h4 className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">Votre première publication commence ici</h4>
                          <p className="mx-auto mt-1 max-w-sm text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">Publiez une offre pour présenter un besoin et entrer en contact avec des profils adaptés.</p>
                          <button onClick={() => openCreate()} className="ts-company-btn ts-company-primary mt-4"><Plus size={14} /> Publier une offre</button>
                        </div>
                      ) : (
                        <div className="space-y-5">
                          {myPublications.map((pub) => renderPublication(pub, loadHome))}
                        </div>
                      )}
                    </div>
                  </section>

                  <TestimonialsSection companyId={company.id} />
                </div>

                <aside className="space-y-5">
                  <section className={`${card} p-5`}>
                    <div className="flex items-center gap-4">
                      <ProgressRing value={completion} />
                      <h3 className="text-[15px] font-semibold leading-snug text-slate-800 dark:text-white">Un profil qui inspire confiance</h3>
                    </div>
                    <div className="mt-5 space-y-2.5">
                      {completionItems.map(([label, done]) => (
                        <div key={label} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs ${done ? "bg-teal-50 dark:bg-teal-500/10" : "bg-slate-50 dark:bg-white/5"}`}>
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full ${done ? "bg-teal-400 text-white" : "bg-slate-200 text-slate-400 dark:bg-white/10"}`}>
                            {done ? <CheckCircle size={12} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                          </span>
                          <span className={done ? "font-medium text-slate-500 dark:text-slate-400" : "font-medium text-slate-700 dark:text-slate-200"}>{label}</span>
                        </div>
                      ))}
                    </div>
                    {!company.is_verified && (
                      <button onClick={handleRequestVerification} className="ts-company-btn ts-company-secondary mt-5 w-full">
                        <ShieldCheck size={14} /> Demander la vérification
                      </button>
                    )}
                  </section>

                  <section className={`${card} p-5`}>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-[15px] font-semibold text-slate-800 dark:text-white">Collaborateurs</h3>
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400"><Users size={18} /></span>
                    </div>

                    <button onClick={() => setShowAllMembers(true)} className="ts-lift mb-3 flex w-full items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3.5 text-left dark:border-white/10 dark:bg-white/5">
                      <span className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-teal-600 shadow-sm dark:bg-white/10 dark:text-teal-400"><Users size={16} /></span>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Membres de l'équipe</span>
                      </span>
                      <span className="text-lg font-semibold text-slate-700 dark:text-white">{members.length}</span>
                    </button>

                    <div className="space-y-2">
                      {CONTRACT_GROUPS.map((g) => {
                        const Icon = g.icon;
                        const count = employeesOfGroup(employees, g.id).length;
                        return (
                          <button key={g.id} onClick={() => setEmployeesGroup(g.id)} className="ts-lift flex w-full items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3.5 text-left dark:border-white/10 dark:bg-white/5">
                            <span className="flex items-center gap-3">
                              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300"><Icon size={16} /></span>
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{g.label}</span>
                            </span>
                            <span className="text-lg font-semibold text-slate-700 dark:text-white">{count}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button onClick={() => setShowAddMember(true)} className="ts-company-btn ts-company-secondary flex-1"><Plus size={13} /> Membre</button>
                      <button onClick={() => setShowAddEmployee(true)} className="ts-company-btn ts-company-secondary flex-1"><Plus size={13} /> Salarié</button>
                    </div>
                    <button onClick={() => setEmployeesGroup("all")} className="mt-3 flex w-full items-center justify-between border-t border-slate-100 pt-3 text-xs font-medium text-teal-600 dark:border-white/10 dark:text-teal-400">
                      Voir toute l'équipe <ArrowRight size={14} />
                    </button>
                  </section>

                  <section className="relative overflow-hidden rounded-xl bg-[#0B1F33] p-5 text-white shadow-md">
                    <span className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#16B8B1]/20 blur-2xl" />
                    <h3 className="relative text-base font-semibold">Développez votre réseau</h3>
                    <p className="relative mt-2 text-xs font-medium leading-5 text-white/80">
                      Découvrez les demandes de ressources et les offres publiées par les autres acteurs de TalentShare.
                    </p>
                    <button onClick={() => goTab("home")} className="relative mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:-translate-y-0.5 active:scale-95">
                      Explorer l'actualité <ArrowRight size={14} />
                    </button>
                  </section>

                  <SuggestedTalentsSection />
                </aside>
              </div>
            )}

            {/* ============================ ACTUALITÉ ============================ */}
            {currentTab === "home" && (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="min-w-0 space-y-5">
                  <section className={`${card} sticky top-2 z-20 p-3 sm:p-4`}>
                    <div className="flex flex-col gap-3">
                      <label className="group relative block">
                        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-teal-500" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Rechercher une publication, une compétence, une entreprise…"
                          className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-2.5 pl-11 pr-10 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 dark:border-white/10 dark:bg-[#0A1230] dark:text-white dark:placeholder:text-slate-500"
                        />
                        {searchQuery && (
                          <button type="button" onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"><X size={14} /></button>
                        )}
                      </label>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-1 rounded-lg bg-slate-50 p-1 dark:bg-white/5">
                          {[
                            { id: "all", label: "Tout voir", count: feedOffers.length + feedRequests.length },
                            { id: "offers", label: "Recrutement", count: feedOffers.length },
                            { id: "requests", label: "Demandes", count: feedRequests.length },
                          ].map((f) => (
                            <button key={f.id} onClick={() => setNewsFilter(f.id)} className={chipBtn(newsFilter === f.id)}>
                              {f.label}
                              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${newsFilter === f.id ? "bg-white text-slate-700 dark:bg-white/10 dark:text-white" : "bg-slate-200 text-slate-500 dark:bg-white/10"}`}>{f.count}</span>
                            </button>
                          ))}
                        </div>
                        <div className="ml-auto flex items-center gap-3">
                          <span className="hidden text-xs font-medium text-slate-500 sm:inline-block dark:text-slate-400">
                            {allPublications.length} résultat{allPublications.length > 1 ? "s" : ""}
                          </span>
                          <button onClick={loadActualite} disabled={loadingFeed} className="ts-company-btn ts-company-secondary" aria-label="Actualiser les publications">
                            <RefreshCw size={14} className={loadingFeed ? "animate-spin" : ""} /><span className="hidden sm:inline">Actualiser</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>

                  {loadingFeed && allPublications.length === 0 ? (
                    <FeedSkeleton />
                  ) : allPublications.length === 0 ? (
                    <div className={`${card} border-dashed px-5 py-14 text-center`}>
                      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-slate-50 text-slate-400 dark:bg-white/5"><Search size={23} /></span>
                      <h4 className="mt-4 text-base font-semibold text-slate-700 dark:text-white">Aucune publication trouvée</h4>
                      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">Essayez de modifier votre recherche ou actualisez le fil pour voir les dernières publications.</p>
                      <button onClick={() => { setSearchQuery(""); setNewsFilter("all"); loadActualite(); }} className="ts-company-btn ts-company-primary mt-5"><RefreshCw size={14} /> Réinitialiser</button>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {allPublications.map((pub, i) => (
                        <div key={`${pub._type}-${pub.id}`} className="ts-rise" style={{ animationDelay: `${Math.min(i, 6) * 70}ms` }}>
                          {renderPublication(pub, loadActualite)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <aside className="hidden space-y-5 lg:block">
                  <div className="sticky top-2 space-y-5">
                    <section className={`${card} overflow-hidden`}>
                      <div className="h-16 bg-slate-50 dark:bg-white/5" />

                      <div className="px-5 pb-5 text-center">
                        <div className="mx-auto -mt-10 flex h-[80px] w-[80px] items-center justify-center overflow-hidden rounded-xl border-4 border-white bg-white shadow-sm dark:border-[#131E47]">
                          {company.logo_url || company.logo_path ? (
                            <img
                              src={buildImageUrl(company.logo_url || company.logo_path)}
                              alt={company.name}
                              className="h-full w-full object-contain p-2"
                              onError={(e) => { e.currentTarget.style.display = "none"; }}
                            />
                          ) : (
                            <span className="text-2xl font-semibold text-teal-600">{company.name?.charAt(0)?.toUpperCase()}</span>
                          )}
                        </div>

                        <p className="mt-2 truncate text-base font-semibold text-slate-800 dark:text-white">{company.name}</p>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-teal-600 dark:text-teal-400">Entreprise</p>

                        <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 rounded-lg bg-slate-50 py-3 dark:divide-white/10 dark:bg-white/5">
                          <MiniStat value={myOffers.length} label="Offres" />
                          <MiniStat value={members.length} label="Membres" />
                          <MiniStat value={employees.length} label="Salariés" />
                        </div>
                      </div>
                    </section>

                    <section className={`${card} p-4`}>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white"><Flame size={15} className="text-amber-500" /> Activité récente</h3>
                      {activities.slice(0, 4).length === 0 ? (
                        <p className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">Rien pour l'instant.</p>
                      ) : (
                        <ul className="space-y-1">
                          {activities.slice(0, 4).map((a) => (
                            <li key={a.id}>
                              <button onClick={() => openActivity(a)} className="group flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-slate-50 dark:hover:bg-white/5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
                                  {a.type === "mission" ? <Zap size={14} /> : <Briefcase size={14} />}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-xs font-medium text-slate-700 group-hover:text-teal-600 dark:text-slate-200 dark:group-hover:text-teal-400">{a.title}</span>
                                  <span className="block text-[10px] text-slate-400">{a.status} · {timeAgo(a.date)}</span>
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <button onClick={() => goTab("profile")} className="mt-2 w-full rounded-lg py-2 text-xs font-medium text-teal-600 transition hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-500/10">Tout voir →</button>
                    </section>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </div>
      </div>

      <button onClick={() => openCreate()} aria-label="Publier une offre" className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-teal-500 text-white shadow-lg transition hover:rotate-90 hover:scale-110 active:scale-95 lg:hidden">
        <Plus size={26} />
      </button>

      {showAllMembers && (
        <AllPeopleModal
          title="Tous les membres" subtitle={`${members.length} membre${members.length > 1 ? "s" : ""}`}
          icon={Users} people={members} type="member" companyLogo={company.logo_url || company.logo_path}
          onClose={() => setShowAllMembers(false)} onRemove={handleRemoveMember}
          onClick={(m) => { setShowAllMembers(false); setSelectedMember(m); }}
          onAdd={() => { setShowAllMembers(false); setShowAddMember(true); }}
        />
      )}

      {employeesGroup && (
        <AllPeopleModal
          title={groupModalTitle}
          subtitle={`${employeesOfGroup(employees, employeesGroup).length} personne${employeesOfGroup(employees, employeesGroup).length > 1 ? "s" : ""}`}
          icon={Briefcase}
          people={employeesOfGroup(employees, employeesGroup)}
          type="employee"
          onClose={() => setEmployeesGroup(null)}
          onRemove={handleRemoveEmployee}
          onClick={(emp) => { setEmployeesGroup(null); setSelectedEmployee(emp); }}
          onAdd={() => { setEmployeesGroup(null); setShowAddEmployee(true); }}
        />
      )}

      {showFormModal && (
        <CompanyFormModal
          company={company} onClose={() => setShowFormModal(false)}
          onSuccess={() => { setShowFormModal(false); showToast("Entreprise mise à jour", "success"); loadCompany(); }}
        />
      )}
      {showAddMember && <AddMemberModal companyId={company.id} onClose={() => setShowAddMember(false)} onSuccess={() => { setShowAddMember(false); loadCompany(); }} />}
      {showAddEmployee && <AddEmployeeModal companyId={company.id} onClose={() => setShowAddEmployee(false)} onSuccess={() => { setShowAddEmployee(false); loadCompany(); }} />}
      {selectedEmployee && <EmployeeDetailModal employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />}
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember} companyId={company.id} onClose={() => setSelectedMember(null)} companyLogo={company.logo_url || company.logo_path}
          onPhotoUpdated={() => { setSelectedMember(null); loadCompany(); }}
        />
      )}

      {showCreateOffer && (
        <CreateOfferModal
          company={company}
          presetType={createPreset}
          onClose={() => setShowCreateOffer(false)}
          onSuccess={() => { setShowCreateOffer(false); setOfferSuccess(true); loadHome(); }}
        />
      )}

      {offerSuccess && (
        <div className="ts-fade fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-slate-900/80 p-6 backdrop-blur-md">
          <div className="relative flex w-full max-w-md flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-teal-50 shadow-sm dark:bg-teal-500/20">
              <CheckCircle size={48} className="text-teal-500" />
            </div>
            <h2 className="mt-8 text-2xl font-semibold text-white">Offre publiée !</h2>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-300">
              Votre offre a bien été publiée. Elle est maintenant visible par tous les talents du réseau.
            </p>
            <button onClick={() => setOfferSuccess(false)} className="mt-8 rounded-lg bg-teal-50 px-8 py-3 text-sm font-medium text-teal-700 transition hover:bg-teal-100">
              Fermer
            </button>
          </div>
        </div>
      )}

      {applyOffer && (
        <ApplyOfferModal
          offer={applyOffer}
          onClose={() => setApplyOffer(null)}
          onSuccess={() => { setApplyOffer(null); showToast("Candidature envoyée", "success"); }}
        />
      )}

      {recruiterProposal && (
        <RecruiterProposalModal
          request={recruiterProposal}
          company={company}
          onClose={() => setRecruiterProposal(null)}
          onSuccess={() => {
            setRecruiterProposal(null);
            showToast("Proposition envoyée avec succès !", "success");
          }}
        />
      )}
      {talentProposal && (
        <ProposeTalentModal
          myCompanies={[company]}
          targetCompany={talentProposal.company}
          resourceRequest={talentProposal}
          onClose={() => setTalentProposal(null)}
          onSaved={(msg) => {
            setTalentProposal(null);
            showToast(msg || "Proposition envoyée", "success");
            loadActualite();
          }}
        />
      )}
    </AppShell>
  );
}

/* -------------------------------------------------------------------------- */
/*                     INTERACTIONS COMMUNES                                  */
/* -------------------------------------------------------------------------- */

function useEngagement({ basePath, item, shareUrl }) {
  const { showToast } = useToast();
  const [liked, setLiked] = useState(item.is_liked || false);
  const [likesCount, setLikesCount] = useState(item.likes_count || 0);
  const [liking, setLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [commentsCount, setCommentsCount] = useState(item.comments_count || 0);

  useEffect(() => {
    api.get(`${basePath}/comments`)
      .then((res) => setCommentsCount((res.data.data || []).length))
      .catch(() => {});
  }, [basePath]);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const res = await api.post(`${basePath}/like`);
      setLiked(res.data.liked);
      setLikesCount(res.data.likes_count);
    } catch {
      setLiked((l) => {
        const next = !l;
        setLikesCount((c) => Math.max(0, c + (next ? 1 : -1)));
        return next;
      });
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast("Lien copié", "success");
      api.post(`${basePath}/share`).catch(() => {});
    } catch {
      showToast("Impossible de copier", "error");
    }
  };

  const toggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) {
      setLoadingComments(true);
      try {
        const res = await api.get(`${basePath}/comments`);
        setComments(res.data.data || []);
      } catch {
        setComments([]);
      }
      setLoadingComments(false);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setPostingComment(true);
    try {
      const res = await api.post(`${basePath}/comment`, { content: commentText.trim() });
      setComments([res.data.comment, ...comments]);
      setCommentsCount((c) => c + 1);
      setCommentText("");
      showToast("Commentaire ajouté", "success");
    } catch (err) {
      showToast(err.response?.data?.message || `Erreur ${err.response?.status || ""}`, "error");
    } finally {
      setPostingComment(false);
    }
  };

  return {
    liked, likesCount, liking, handleLike, handleShare, toggleComments,
    showComments, comments, commentText, setCommentText, loadingComments,
    postingComment, commentsCount, submitComment,
  };
}

function EngagementBar({ eng, currentUser, children }) {
  const btn = "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-medium text-slate-500 transition hover:bg-slate-50 active:scale-95 dark:text-slate-400 dark:hover:bg-white/5";
  return (
    <>
      {eng.likesCount > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-400 text-white">
            <Heart size={9} fill="currentColor" />
          </span>
          {eng.likesCount} {eng.likesCount > 1 ? "personnes aiment" : "personne aime"}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-slate-100 pt-2 dark:border-white/5">
        <button
          onClick={eng.handleLike}
          disabled={eng.liking}
          className={`${btn} ${eng.liked ? "!text-rose-500 hover:!bg-rose-50 dark:hover:!bg-rose-500/10" : ""}`}
        >
          <Heart size={16} fill={eng.liked ? "currentColor" : "none"} className={eng.liked ? "ts-pop" : ""} />
          J'aime
        </button>
        <button onClick={eng.toggleComments} className={`${btn} ${eng.showComments ? "bg-slate-100 dark:bg-white/5" : ""}`}>
          <MessageCircle size={16} />
          {eng.commentsCount > 0 ? eng.commentsCount : "Commenter"}
        </button>
        <button onClick={eng.handleShare} className={btn}>
          <Send size={16} /> <span className="hidden sm:inline">Partager</span>
        </button>
        {children}
      </div>

      {eng.showComments && (
        <div className="ts-pop mt-3 space-y-3 rounded-lg bg-slate-50/70 p-4 dark:bg-white/5">
          <form onSubmit={eng.submitComment} className="flex items-center gap-2">
            <Avatar path={currentUser?.avatar_path} name={currentUser?.name || "?"} size="xs" />
            <input
              type="text"
              value={eng.commentText}
              onChange={(e) => eng.setCommentText(e.target.value)}
              placeholder="Écrivez un commentaire..."
              className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 dark:border-white/10 dark:bg-[#0A1230] dark:text-white"
            />
            <button
              type="submit"
              disabled={eng.postingComment || !eng.commentText.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-teal-600 transition hover:scale-110 disabled:opacity-40 dark:bg-teal-500/20 dark:text-teal-400"
            >
              {eng.postingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </form>

          <div className="space-y-2">
            {eng.loadingComments ? (
              <div className="flex justify-center py-3"><Loader2 size={16} className="animate-spin text-teal-500" /></div>
            ) : eng.comments.length === 0 ? (
              <p className="py-2 text-center text-xs font-medium text-slate-400">Aucun commentaire pour le moment</p>
            ) : (
              eng.comments.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <Avatar path={c.user?.avatar_path} name={c.user?.name || "?"} size="xs" />
                  <div className="flex-1 rounded-xl rounded-tl-md bg-white px-3.5 py-2 shadow-sm ring-1 ring-slate-100 dark:bg-[#0A1230] dark:ring-white/5">
                    <p className="text-xs font-medium text-slate-800 dark:text-white">{c.user?.name || "Utilisateur"}</p>
                    <p className="mt-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">{c.content}</p>
                    <p className="mt-1 text-[10px] font-medium text-slate-400">{timeAgo(c.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                               CARTES DU FIL                                */
/* -------------------------------------------------------------------------- */

function RequestFeedCard({ request, currentUser, onPropose }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const eng = useEngagement({
    basePath: `/resource-requests/${request.id}`,
    item: request,
    shareUrl: `${window.location.origin}/resource-requests/${request.id}`,
  });

  const isOwner = currentUser?.id === request.created_by;
  const isTalent = request.author_type === "talent";
  const company = request.company;
  const author = request.author;
  const isUrgent = request.urgency === "urgent";
  const hasBudget = request.budget_min && request.budget_max;
  const hasSkills = request.skills?.length > 0;

  const badge = "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium";

  return (
    <article id={`request-${request.id}`} className={`${card} group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md`}>
      <span className="absolute inset-y-0 left-0 w-1 bg-teal-400" />

      <div className="p-5 pl-6">
        <div className="flex items-start gap-3">
          {isTalent ? (
            <Avatar
              path={author?.professional_profile?.avatar_path || author?.professionalProfile?.avatar_path || author?.avatar_path}
              name={author?.name || "Talent"}
              size="md"
            />
          ) : (
            <Avatar path={company?.logo_url || company?.logo_path} name={company?.name || "Entreprise"} size="md" rounded="lg" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-medium text-slate-800 dark:text-white">
                {isTalent ? author?.name || "Talent" : company?.name || "Entreprise"}
              </p>
              <span className={`${badge} border-teal-100 bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400`}>Demande</span>
              {isUrgent && <span className={`${badge} border-rose-200 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400`}><Zap size={9} /> Urgent</span>}
              {isOwner && <span className={`${badge} border-slate-200 bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300`}>Ma publication</span>}
            </div>
            <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400">
              <Clock size={11} /> {timeAgo(request.created_at)}
              {request.city && (<><span>·</span><MapPin size={11} /> {request.city}</>)}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-semibold leading-snug text-slate-800 transition group-hover:text-teal-600 dark:text-white">{request.title}</h3>
          {request.description && (
            <div className="mt-1.5">
              <p className={`text-[15px] font-medium leading-relaxed text-slate-600 dark:text-slate-300 ${isExpanded ? "" : "line-clamp-3"}`}>
                {request.description}
              </p>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="mt-1 text-sm font-medium text-teal-600 hover:underline dark:text-teal-400"
              >
                {isExpanded ? "Voir moins" : "Voir plus"}
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium">
          {hasBudget && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
              <Euro size={11} /> {request.budget_min}–{request.budget_max} €/j
            </span>
          )}
          {request.start_at && request.end_at && (
            <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Calendar size={11} />
              {new Date(request.start_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              {" – "}
              {new Date(request.end_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            </span>
          )}
          {request.workload_percent && <span className="text-slate-500 dark:text-slate-400">{request.workload_percent}%</span>}
        </div>

        {hasSkills && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {request.skills.slice(0, 5).map((s) => (
              <span key={s.id} className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                {s.name}
              </span>
            ))}
            {request.skills.length > 5 && <span className="self-center text-xs font-medium text-slate-400">+{request.skills.length - 5}</span>}
          </div>
        )}

        <EngagementBar eng={eng} currentUser={currentUser}>
          {!isOwner && (currentUser?.role === "employee" || currentUser?.role === "student") && (
            <Link to={`/resource-requests/${request.id}`} className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-2.5 text-[13px] font-medium text-slate-600 transition hover:bg-slate-100 dark:bg-white/10 dark:text-white">
              <ArrowRight size={15} /> Proposer
            </Link>
          )}
          {!isOwner && currentUser?.role === "company" && (
            <button
              onClick={() => onPropose?.(request)}
              className="group inline-flex items-center gap-2 rounded-lg bg-teal-50 px-4 py-2.5 text-[13px] font-medium text-teal-700 transition hover:bg-teal-100 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20"
            >
              <UserPlus size={15} /> Proposer un salarié
            </button>
          )}
        </EngagementBar>
      </div>
    </article>
  );
}

function OfferFeedCard({ offer, currentCompanyId, currentUser, onDeleted, onApply }) {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const eng = useEngagement({
    basePath: `/job-offers/${offer.id}`,
    item: offer,
    shareUrl: `${window.location.origin}/actualite#offer-${offer.id}`,
  });

  const isMyOffer = offer.company_id === currentCompanyId;
  const company = offer.company;
  const typeLabel = OFFER_TYPE_LABELS[offer.offer_type] || offer.offer_type;
  const durationLabel = offer.duration_months
    ? `${offer.duration_months} mois`
    : offer.duration_text || null;

  const handleDelete = async () => {
    if (!confirm("Supprimer cette offre ?")) return;
    setDeleting(true);
    try {
      await api.delete(`/job-offers/${offer.id}`);
      showToast("Offre supprimée", "success");
      onDeleted?.();
    } catch {
      showToast("Erreur suppression", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article id={`offer-${offer.id}`} className={`${card} group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md`}>
      <span className="absolute inset-y-0 left-0 w-1 bg-slate-400" />

      <div className="p-5 pl-6">
        <div className="flex items-start gap-3">
          <Avatar path={company?.logo_url || company?.logo_path} name={company?.name || "Entreprise"} size="md" rounded="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-medium text-slate-800 dark:text-white">{company?.name || "Entreprise"}</p>
              {company?.is_verified && <BadgeCheck size={14} className="text-teal-500" />}
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">Recrutement</span>
              {isMyOffer && (
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">Ma publication</span>
              )}
            </div>
            <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400">
              <Clock size={11} /> {timeAgo(offer.created_at)}
              {offer.city && (<><span>·</span><MapPin size={11} /> {offer.city}</>)}
              {offer.remote && (
                <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">Télétravail</span>
              )}
            </p>
          </div>

          {isMyOffer && (
            <button onClick={handleDelete} disabled={deleting} aria-label="Supprimer l'offre" className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500">
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          )}
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
              {typeLabel}
            </span>
            {durationLabel && (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-[11px] font-medium text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
                <Clock size={11} /> {durationLabel}
              </span>
            )}
          </div>
          <h3 className="mt-2 text-lg font-semibold text-slate-800 transition group-hover:text-teal-600 dark:text-white">{offer.title}</h3>
          {offer.description && (
            <div className="mt-1.5">
              <p className={`text-[15px] font-medium leading-relaxed text-slate-600 dark:text-slate-300 ${isExpanded ? "" : "line-clamp-4"}`}>
                {offer.description}
              </p>

              {(offer.description || "").length > 200 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className="mt-1 text-sm font-medium text-teal-600 hover:underline dark:text-teal-400"
                >
                  {isExpanded ? "Voir moins" : "Voir plus"}
                </button>
              )}
            </div>
          )}
        </div>

        <EngagementBar eng={eng} currentUser={currentUser}>
          {!isMyOffer && (currentUser?.role === "employee" || currentUser?.role === "student") && (
            <button onClick={() => onApply?.(offer)} className="inline-flex items-center gap-2 rounded-lg bg-teal-50 px-4 py-2.5 text-[13px] font-medium text-teal-700 transition hover:bg-teal-100 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20">
              <Briefcase size={15} /> Postuler
            </button>
          )}
          {!isMyOffer && currentUser?.role === "company" && (
            <button
              onClick={() => {
                const ownerId = offer.company?.owner_user_id;
                if (ownerId) navigate(`/messages?to=${ownerId}`);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-[13px] font-medium text-slate-600 transition hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20"
            >
              <MessageCircle size={15} /> Contacter
            </button>
          )}
        </EngagementBar>
      </div>
    </article>
  );
}

function RecruiterProposalModal({ request, company, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [message, setMessage] = useState("");
  const [conditions, setConditions] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  useEffect(() => {
    api.get(`/companies/${company.id}/employees`)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
        setEmployees(list);
      })
      .catch(() => setEmployees([]))
      .finally(() => setLoadingEmployees(false));
  }, [company.id]);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedEmployeeId) {
      setError("Veuillez sélectionner un salarié à proposer.");
      return;
    }
    if (message.trim().length < 20) {
      setError("Le message d'accompagnement doit faire au moins 20 caractères.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/proposals/recruiter-apply", {
        resource_request_id: request.id,
        proposed_by_company_id: company.id,
        employee_id: selectedEmployeeId,
        message: message.trim(),
        conditions: conditions.trim() || null,
        start_at: startAt || null,
        end_at: endAt || null,
        status: "sent",
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'envoi de la proposition.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      icon={Send}
      title="Proposer un salarié"
      subtitle={`Répondre à la demande de ${request.company?.name || "l'entreprise"}`}
      onClose={onClose}
      size="max-w-xl"
      footer={<ModalFooter onClose={onClose} formId="recruiter-proposal-form" saving={saving} icon={Send} label={saving ? "Envoi..." : "Envoyer la proposition"} />}
    >
      <form id="recruiter-proposal-form" onSubmit={submit} className="flex flex-col h-full space-y-5">
        <ErrorBox>{error}</ErrorBox>

        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 shrink-0 dark:border-white/10 dark:bg-white/5">
          <p className="text-sm font-medium text-slate-800 dark:text-white">{request.title}</p>
          <p className="mt-1 line-clamp-2 text-xs font-medium text-slate-600 dark:text-slate-400">{request.description}</p>
          {request.start_at && request.end_at && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-teal-600 dark:text-teal-400">
              <Calendar size={12} />
              Du {new Date(request.start_at).toLocaleDateString("fr-FR")} au {new Date(request.end_at).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>

        <div className="space-y-5 min-h-0 flex-1 overflow-y-auto pr-1">

          <Field icon={Users} label="Quel salarié souhaitez-vous proposer ? *">
            {loadingEmployees ? (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500">
                <Loader2 size={14} className="animate-spin" /> Chargement de vos salariés...
              </div>
            ) : employees.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5">
                Vous n'avez pas encore de salarié enregistré.
              </div>
            ) : (
              <select
                required
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className={inputCls}
              >
                <option value="">— Choisir un salarié —</option>
                {employees.map((emp) => {
                  const profileId =
                    emp.professional_profile_id ||
                    emp.user?.professional_profile?.id ||
                    emp.user?.professionalProfile?.id;

                  const name = emp.user?.name || `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || "Salarié";

                  if (!profileId) {
                    return (
                      <option key={emp.id} value="" disabled>
                        {name} (Profil professionnel manquant)
                      </option>
                    );
                  }

                  return (
                    <option key={emp.id} value={profileId}>
                      {name} {emp.position ? `- ${emp.position}` : ""}
                    </option>
                  );
                })}
              </select>
            )}
          </Field>

          <Field icon={FileText} label="Message d'accompagnement *">
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Expliquez pourquoi ce talent correspond parfaitement à la demande..."
              className={inputCls}
            />
            <p className={`mt-1 text-xs ${message.length < 20 ? "text-amber-500" : "text-slate-400"}`}>
              {message.length} / 20 caractères minimum
            </p>
          </Field>

          <Field icon={Quote} label="Conditions particulières (optionnel)">
            <textarea
              rows={2}
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              placeholder="Rémunération, avantages..."
              className={inputCls}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field icon={Calendar} label="Date de début (optionnel)">
              <input type="date" value={startAt} onChange={(e) => setStartAt(e.target.value)} className={inputCls} />
            </Field>
            <Field icon={Calendar} label="Date de fin (optionnel)">
              <input type="date" value={endAt} min={startAt} onChange={(e) => setEndAt(e.target.value)} className={inputCls} />
            </Field>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}

function EmployeeDetailModal({ employee, onClose }) {
  const name = employee.user?.name || `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || "Salarié";
  const email = employee.user?.email || employee.email;
  const phone = employee.user?.phone || employee.phone;
  const position = employee.position;
  const profile = employee.user?.professional_profile || employee.user?.professionalProfile;
  const bio = profile?.bio;
  const headline = profile?.headline;
  const displayPosition = position || headline;
  const avatar = employee.photo_path || profile?.avatar_path;

  const contractType = employeeContract(employee);
  const contract = CONTRACTS[contractType];
  const isTrialEmployee = employee.status === "trial";
  const hasEnded = employee.status === "ended";

  return (
    <ModalShell
      icon={Briefcase}
      title="Détails du salarié"
      subtitle={displayPosition || "Membre de l'équipe"}
      onClose={onClose}
      footer={<ModalFooter onClose={onClose} cancelLabel="Fermer" />}
    >
      <div className="flex flex-col items-center text-center">
        <Avatar path={avatar} name={name} size="xl" />
        <h3 className="mt-3 text-base font-semibold text-slate-800 dark:text-white">{name}</h3>
        {position && <p className="text-sm font-medium text-teal-600">{position}</p>}
        {headline && <p className="mt-1 text-xs text-slate-500">{headline}</p>}

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
            {contract?.short || "Salarié"}
          </span>
          {isTrialEmployee && (
            <span className="inline-flex items-center rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">Période d'essai</span>
          )}
          {hasEnded && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-white/10 dark:text-slate-400">Contrat terminé</span>
          )}
          {employee.has_account ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-600 dark:bg-teal-500/10 dark:text-teal-400"><CheckCircle size={12} /> Compte actif</span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-white/10 dark:text-slate-400"><AlertCircle size={12} /> Sans compte</span>
          )}
        </div>
      </div>

      {bio && (
        <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs font-medium text-slate-400">À propos</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{bio}</p>
        </div>
      )}

      <div className="mt-4 space-y-2.5">
        {email && <DetailRow icon={Mail} label="Email" value={email} />}
        {phone && <DetailRow icon={Phone} label="Téléphone" value={phone} />}
        {displayPosition && <DetailRow icon={Briefcase} label="Poste" value={displayPosition} />}
        <DetailRow icon={FileText} label="Contrat" value={contract?.label || "CDI"} />
        {employee.start_date && <DetailRow icon={Calendar} label="Début" value={formatDate(employee.start_date)} />}
        <DetailRow
          icon={Calendar}
          label={employee.end_date ? "Fin prévue" : "Échéance"}
          value={employee.end_date ? formatDate(employee.end_date) : contractType === "permanent" ? "Sans date de fin (CDI)" : "À définir"}
        />
      </div>
    </ModalShell>
  );
}

function MemberDetailModal({ member, companyId, companyLogo, onClose, onPhotoUpdated }) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const photoInputRef = useRef(null);

  const name = member.user?.name || "Utilisateur";
  const email = member.user?.email;
  const role = member.role;
  const profile = member.user?.professional_profile || member.user?.professionalProfile;
  const headline = profile?.headline;
  
  // ✅ LOGIQUE : Si pas de photo perso ET c'est l'owner, on affiche le logo de l'entreprise
  const avatar = profile?.avatar_path || member.user?.avatar_path || (role === "owner" ? companyLogo : null) || member.photo_path || null;

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("Photo trop lourde (2 Mo max)", "error"); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append("photo", file);
    try {
      await api.post(`/companies/${companyId}/members/${member.id}/photo`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      showToast("Photo mise à jour", "success");
      onPhotoUpdated?.();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur upload", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <ModalShell
      icon={Users}
      title="Détails du membre"
      subtitle={headline || "Membre de l'entreprise"}
      onClose={onClose}
      footer={<ModalFooter onClose={onClose} cancelLabel="Fermer" />}
    >
      <div className="flex flex-col items-center text-center">
        <div className="group relative cursor-pointer" onClick={() => photoInputRef.current?.click()}>
          <Avatar path={avatar} name={name} size="xl" />
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/50 opacity-0 transition group-hover:opacity-100">
            {uploading ? <Loader2 size={20} className="animate-spin text-white" /> : <Camera size={20} className="text-white" />}
          </div>
          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        </div>
        <h3 className="mt-3 text-base font-semibold text-slate-800 dark:text-white">{name}</h3>
        {headline && <p className="mt-1 text-xs text-slate-500">{headline}</p>}
        <span className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${role === "owner" || role === "admin" ? "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400" : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"}`}>
          {role}
        </span>
      </div>

      {email && <div className="mt-5"><DetailRow icon={Mail} label="Email" value={email} /></div>}
      <p className="mt-4 text-center text-xs text-slate-400">Cliquez sur la photo pour la modifier</p>
    </ModalShell>
  );
}

function AllPeopleModal({ title, subtitle, icon, people, type, onClose, onAdd, onClick, onRemove, companyLogo }) {
  const [search, setSearch] = useState("");

  const filtered = people.filter((p) => {
    const name = p.user?.name || `${p.first_name || ""} ${p.last_name || ""}`.trim();
    const email = p.user?.email || p.email || "";
    const q = search.toLowerCase();
    return !q || name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
  });

  return (
    <ModalShell
      icon={icon}
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      size="max-w-4xl"
      footer={
        <>
          <p className="mr-auto text-xs text-slate-500">{filtered.length} sur {people.length}</p>
          <ModalFooter onClose={onClose} cancelLabel="Fermer" />
          <button onClick={onAdd} className="inline-flex items-center gap-2 rounded-lg bg-teal-50 px-5 py-2 text-xs font-medium text-teal-700 transition hover:bg-teal-100 dark:bg-teal-500/20 dark:text-teal-400">
            <Plus size={15} /> Ajouter
          </button>
        </>
      }
    >
      <div className="mb-5 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 transition focus-within:border-teal-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-100 dark:border-white/10 dark:bg-[#0A1230] dark:focus-within:bg-[#0A1230]">
        <Search size={15} className="shrink-0 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou email..."
          className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-white"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-slate-50 text-slate-400 dark:bg-white/5"><Search size={20} /></span>
          <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">Aucun résultat</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const isMember = type === "member";
            const name = p.user?.name || `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Utilisateur";
            const email = p.user?.email || p.email;
            
            const isOwner = isMember && p.role === "owner";

            // ✅ LOGIQUE : Si pas de photo perso ET c'est l'owner, on affiche le logo de l'entreprise
            let avatar = null;
            if (isOwner && !p.user?.avatar_path && !p.user?.professional_profile?.avatar_path && companyLogo) {
                avatar = companyLogo;
            } else {
                avatar = isMember
                  ? (p.user?.avatar_path || p.user?.professional_profile?.avatar_path || p.user?.professionalProfile?.avatar_path || p.photo_path)
                  : (p.photo_path || p.user?.avatar_path || p.user?.professional_profile?.avatar_path || p.user?.professionalProfile?.avatar_path);
            }

            const contractType = employeeContract(p);
            const sub = isMember
              ? p.role
              : [p.position, CONTRACTS[contractType]?.short].filter(Boolean).join(" · ");
            
            return (
              <div
                key={p.id}
                onClick={() => onClick?.(p)}
                className={`group relative rounded-lg border border-slate-100 bg-slate-50/50 p-4 transition dark:border-white/10 dark:bg-white/5 ${onClick ? "cursor-pointer hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm dark:hover:bg-white/10" : ""}`}
              >
                {onRemove && !isOwner && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove(p.id); }}
                    className="absolute right-2 top-2 z-10 hidden rounded-md bg-white p-1.5 text-slate-400 shadow-sm transition hover:bg-rose-50 hover:text-rose-500 group-hover:block dark:bg-[#0A1230]"
                    title={`Supprimer ce ${isMember ? "membre" : "salarié"}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}

                <div className="flex flex-col items-center text-center">
                  <Avatar path={avatar} name={name} size="lg" />
                  <p className="mt-3 line-clamp-1 text-sm font-medium text-slate-800 dark:text-white">{name}</p>
                  {sub && <p className="mt-0.5 line-clamp-1 text-xs font-medium text-teal-600 dark:text-teal-400">{sub}</p>}
                  {email && <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{email}</p>}
                  {!isMember && (p.end_date || contractType === "permanent") && (
                    <p className="mt-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      {p.end_date ? `Fin prévue : ${formatDate(p.end_date)}` : "Sans date de fin (CDI)"}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ModalShell>
  );
}

function CompanyFormModal({ company, onClose, onSuccess }) {
  const { showToast } = useToast();
  const isEditing = !!company;
  const [form, setForm] = useState(
    company ? {
      name: company.name || "", description: company.description || "",
      industry: company.industry || "", country: company.country || "Madagascar",
      city: company.city || "", website: company.website || "",
      address: company.address || "", phone: company.phone || "",
      size: company.size || "", latitude: company.latitude || "", longitude: company.longitude || "",
    } : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form };
    Object.keys(payload).forEach((key) => {
      if (payload[key] === "" || payload[key] === undefined) payload[key] = null;
    });
    payload.name = form.name;

    try {
      if (isEditing) await api.patch(`/companies/${company.id}`, payload);
      else await api.post("/companies", payload);
      onSuccess();
    } catch (err) {
      const message = err.response?.data?.message || Object.values(err.response?.data?.errors || {})[0]?.[0] || "Erreur";
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      icon={Building}
      title={isEditing ? "Modifier l'entreprise" : "Créer mon entreprise"}
      subtitle={isEditing ? company.name : "Présentez votre activité au réseau."}
      onClose={onClose}
      size="max-w-2xl"
      footer={<ModalFooter onClose={onClose} formId="company-form" saving={saving} icon={Save} label={isEditing ? "Enregistrer" : "Créer"} />}
    >
      <form id="company-form" onSubmit={submit} className="space-y-4">
        <Field icon={Building} label="Nom *">
          <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
        </Field>
        <Field icon={FileText} label="Description">
          <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field icon={Briefcase} label="Secteur">
            <input type="text" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className={inputCls} />
          </Field>
          <Field icon={Users} label="Taille">
            <select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className={inputCls}>
              <option value="">Sélectionner</option>
              {COMPANY_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field icon={Globe} label="Pays">
            <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputCls}>
              {countries.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
            </select>
          </Field>
          <Field icon={MapPin} label="Ville">
            <input type="text" list="city-list" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} />
            <datalist id="city-list">{cities.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
        </div>
        <Field icon={MapPin} label="Adresse">
          <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field icon={Link2} label="Site web">
            <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." className={inputCls} />
          </Field>
          <Field icon={Phone} label="Téléphone">
            <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
          </Field>
        </div>
      </form>
    </ModalShell>
  );
}

function AddMemberModal({ companyId, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [suggestedUser, setSuggestedUser] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    const e = email.trim();
    if (!e || !e.includes("@") || e.length < 5) { setSuggestedUser(null); return; }
    setSearching(true);
    const timeout = setTimeout(() => {
      api.get(`/users/search?email=${encodeURIComponent(e)}`)
        .then((res) => {
          const u = res.data;
          setSuggestedUser(u);
          if (u.avatar_path) setAvatarPreview(`/storage/${u.avatar_path}`);
        })
        .catch(() => setSuggestedUser(null))
        .finally(() => setSearching(false));
    }, 500);
    return () => clearTimeout(timeout);
  }, [email]);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("Photo trop lourde (2 Mo max)", "error"); return; }
    setPhotoFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const userRes = await api.get(`/users/search?email=${encodeURIComponent(email)}`);
      const memberRes = await api.post(`/companies/${companyId}/members`, { user_id: userRes.data.id, role });
      const createdMember = memberRes.data.data;

      if (photoFile && createdMember?.id) {
        const fd = new FormData();
        fd.append("photo", photoFile);
        try {
          await api.post(`/companies/${companyId}/members/${createdMember.id}/photo`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        } catch (err) {
          console.warn("Photo non uploadée :", err.response?.data);
        }
      }

      showToast("Membre ajouté", "success");
      onSuccess();
    } catch (err) {
      showToast(err.response?.data?.message || "Utilisateur introuvable", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      icon={UserPlus}
      title="Ajouter un membre"
      subtitle="Invitez un utilisateur TalentShare dans votre équipe."
      onClose={onClose}
      footer={<ModalFooter onClose={onClose} formId="member-form" saving={saving} icon={Plus} label="Ajouter" />}
    >
      <form id="member-form" onSubmit={submit} className="space-y-5">
        <PhotoPicker preview={avatarPreview} onPick={handlePhotoSelect} label="Photo du membre" />

        <Field icon={Mail} label="Email *">
          <div className="relative">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemple.com" className={inputCls} />
            {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-teal-500" />}
          </div>
          <AccountFound user={suggestedUser} />
        </Field>

        <Field icon={Users} label="Rôle">
          <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
            <option value="member">Membre</option>
            <option value="admin">Administrateur</option>
            <option value="viewer">Visualisateur</option>
          </select>
        </Field>
      </form>
    </ModalShell>
  );
}

function AddEmployeeModal({ companyId, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    email: "", first_name: "", last_name: "", position: "", phone: "",
    contract_type: "permanent", start_date: "", end_date: "",
  });
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [suggestedUser, setSuggestedUser] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const updateContract = (patch) =>
    setForm((prev) => {
      const next = { ...prev, ...patch };
      const months = DEFAULT_MONTHS[next.contract_type];
      next.end_date = months ? addMonthsISO(next.start_date, months) : "";
      return next;
    });

  useEffect(() => {
    const email = form.email.trim();
    if (!email || !email.includes("@") || email.length < 5) { setSuggestedUser(null); return; }
    setSearching(true);
    const timeout = setTimeout(() => {
      api.get(`/users/search?email=${encodeURIComponent(email)}`)
        .then((res) => {
          const u = res.data;
          setSuggestedUser(u);
          setForm((prev) => ({
            ...prev,
            first_name: prev.first_name || u.first_name || "",
            last_name: prev.last_name || u.last_name || "",
            phone: prev.phone || u.phone || "",
            position: prev.position || u.headline || "",
          }));
          if (u.avatar_path) setAvatarPreview(`/storage/${u.avatar_path}`);
        })
        .catch(() => setSuggestedUser(null))
        .finally(() => setSearching(false));
    }, 500);
    return () => clearTimeout(timeout);
  }, [form.email]);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("Photo trop lourde (2 Mo max)", "error"); return; }
    setPhotoFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      Object.keys(payload).forEach((k) => { if (payload[k] === "") payload[k] = null; });
      payload.email = form.email;
      payload.first_name = form.first_name;
      payload.last_name = form.last_name;
      if (form.contract_type === "permanent") payload.end_date = null;

      const res = await api.post(`/companies/${companyId}/employees`, payload);
      const created = res.data.data;

      if (photoFile && created?.id) {
        const fd = new FormData();
        fd.append("photo", photoFile);
        try {
          await api.post(`/companies/${companyId}/employees/${created.id}/photo`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        } catch (err) {
          console.warn("Photo non uploadée :", err.response?.data);
        }
      }

      showToast("Salarié ajouté", "success");
      onSuccess();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      icon={UserPlus}
      title="Ajouter un salarié"
      subtitle="Renseignez les informations de votre collaborateur."
      onClose={onClose}
      footer={<ModalFooter onClose={onClose} formId="employee-form" saving={saving} icon={Plus} label="Ajouter" />}
    >
      <form id="employee-form" onSubmit={submit} className="space-y-5">
        <PhotoPicker preview={avatarPreview} onPick={handlePhotoSelect} label="Photo du salarié" />

        <Field icon={Mail} label="Email *">
          <div className="relative">
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemple.com" className={inputCls} />
            {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-teal-500" />}
          </div>
          <AccountFound user={suggestedUser} />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field icon={Users} label="Prénom *">
            <input type="text" required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className={inputCls} />
          </Field>
          <Field icon={Users} label="Nom *">
            <input type="text" required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className={inputCls} />
          </Field>
        </div>

        <Field icon={Briefcase} label="Poste">
          <input type="text" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Ex: Développeur" className={inputCls} />
        </Field>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field icon={FileText} label="Type de contrat">
            <select value={form.contract_type} onChange={(e) => updateContract({ contract_type: e.target.value })} className={inputCls}>
              <option value="internship">Stage</option>
              <option value="apprenticeship">Alternance</option>
              <option value="fixed_term">CDD</option>
              <option value="permanent">CDI</option>
            </select>
          </Field>
          <Field icon={Calendar} label="Début">
            <input type="date" value={form.start_date} onChange={(e) => updateContract({ start_date: e.target.value })} className={inputCls} />
          </Field>
          <Field icon={Calendar} label={form.contract_type === "permanent" ? "Fin" : "Fin (auto)"}>
            <input
              type="date"
              value={form.end_date}
              disabled={form.contract_type === "permanent"}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              className={`${inputCls} disabled:opacity-50`}
            />
          </Field>
        </div>
        {form.contract_type === "permanent" && (
          <p className="-mt-3 text-[11px] text-slate-400">CDI : pas de date de fin.</p>
        )}

        <Field icon={Phone} label="Téléphone">
          <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
        </Field>
      </form>
    </ModalShell>
  );
}

function ApplyOfferModal({ offer, onClose, onSuccess }) {
  const [profile, setProfile] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/profile/me").then((r) => r.data).catch(() => null),
      api.get("/portfolio/my").then((r) => r.data).catch(() => null),
    ]).then(([p, pf]) => {
      setProfile(p);
      setPortfolio(pf);
      setLoading(false);
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!profile) { setError("Vous devez d'abord créer votre profil professionnel."); return; }

    setSaving(true);
    try {
      await api.post("/applications", {
        job_offer_id: offer.id,
        cover_letter: coverLetter || null,
        portfolio_id: portfolio?.id || null,
        cv_path: profile?.cv_path || null,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la candidature.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      icon={Send}
      title={offer.title}
      subtitle={`Postuler chez ${offer.company?.name || "l'entreprise"}`}
      onClose={onClose}
      footer={<ModalFooter onClose={onClose} formId="apply-form" saving={saving} disabled={loading || !profile} icon={Send} label={saving ? "Envoi..." : "Envoyer ma candidature"} />}
    >
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-teal-500" size={24} /></div>
      ) : (
        <form id="apply-form" onSubmit={submit} className="space-y-4">
          <ErrorBox>{error}</ErrorBox>

          {!profile && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <div>
                Vous n'avez pas encore de profil professionnel.{" "}
                <a href="/profile" className="font-bold underline">Créez-le d'abord</a>.
              </div>
            </div>
          )}

          <Field icon={FileText} label="Lettre de motivation">
            <textarea rows={5} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="Expliquez pourquoi cette offre vous intéresse..." className={inputCls} />
          </Field>

          {portfolio && (
            <div className="flex items-center gap-2 rounded-lg border border-teal-200/50 bg-teal-50/50 p-3 text-xs font-medium text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
              <CheckCircle size={14} /> Votre portfolio sera joint automatiquement
            </div>
          )}
          {profile?.cv_path && (
            <div className="flex items-center gap-2 rounded-lg border border-teal-200/50 bg-teal-50/50 p-3 text-xs font-medium text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
              <CheckCircle size={14} /> Votre CV sera joint automatiquement
            </div>
          )}
        </form>
      )}
    </ModalShell>
  );
}