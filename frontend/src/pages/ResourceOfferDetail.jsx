import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, MessageSquare, Send, Loader2, Calendar, MapPin, Clock, Wallet, ArrowUpRight,
  Eye, Inbox, Users, Link2, Edit3, Hourglass, ShieldCheck, FileText, CheckCircle2,
} from "lucide-react";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import ProposalFormModal from "../components/resource-sharing/ProposalFormModal";
import { PageLayout } from "../components/resource-sharing/shared";
import {
  FONT, LOCATIONS, MISSION_TYPES, Avatar, StateBadge, SkillChips, WaiterRow, Tabs, ModalFrame, ConfirmDialog,
  Empty, Skeleton, fmtDate, workloadLabel, apiError, money, toDate, workingDays, workloadFactor,
  daysUntil, relDays,
} from "../components/talent-market/ui";

/* ========================================================================== */
/*  Styles                                                                     */
/* ========================================================================== */

const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
.ts-font, .ts-font *{font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif}
@keyframes ts-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.ts-rise{animation:ts-rise .45s ease both}
@keyframes ts-grow{from{width:0}}
.ts-grow{animation:ts-grow .9s ease both}
@keyframes tsPop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}
@keyframes tsUp{from{transform:translateY(10px);opacity:0}to{transform:none;opacity:1}}
`;

const card = "rounded-2xl border border-slate-200/70 bg-white shadow-sm shadow-[#0B2235]/[0.03] dark:border-white/10 dark:bg-[#0F2A40]";
const inp = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#16B8B1] focus:ring-4 focus:ring-[#16B8B1]/15 dark:border-white/10 dark:bg-[#0B2235] dark:text-white";
const btnMain = "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#16B8B1] px-4 py-3 text-[13px] font-bold text-[#0B2235] transition hover:bg-[#2BD0C9] disabled:cursor-not-allowed disabled:opacity-50";
const btnLine = "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-[13px] font-semibold text-slate-700 transition hover:border-[#16B8B1] hover:text-[#0E8F8A] dark:border-white/10 dark:text-slate-200 dark:hover:text-[#5EE0DA]";
const btnRose = "inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-[13px] font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10";

/* ========================================================================== */
/*  Libellés                                                                   */
/* ========================================================================== */

const OFFER_STATUS = {
  draft: ["Brouillon", "bg-white/10 text-white/80"],
  published: ["Publiée", "bg-[#16B8B1]/25 text-[#7FE8E3]"],
  closed: ["Clôturée", "bg-white/10 text-white/60"],
  expired: ["Expirée", "bg-rose-400/20 text-rose-200"],
  mission_pending: ["Mission en attente d'accord", "bg-amber-400/20 text-amber-200"],
  mission_planned: ["Mission planifiée", "bg-sky-400/20 text-sky-200"],
  mission_active: ["Mission en cours", "bg-violet-400/20 text-violet-200"],
};

const PROPOSAL_STATUS = {
  draft: ["Brouillon", "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300", "bg-slate-300"],
  sent: ["Reçue", "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300", "bg-amber-400"],
  viewed: ["Vue", "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300", "bg-sky-400"],
  accepted: ["Acceptée", "bg-[#16B8B1]/15 text-[#0E8F8A] dark:text-[#5EE0DA]", "bg-[#16B8B1]"],
  declined: ["Refusée", "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300", "bg-rose-400"],
  cancelled: ["Annulée", "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400", "bg-slate-300"],
  expired: ["Expirée", "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400", "bg-slate-300"],
};

const VISIBILITY = {
  public: "Visible par tout le réseau",
  companies: "Visible par les entreprises",
  private: "Privée",
};

const storage = (p) => (p ? (p.startsWith("http") ? p : `/storage/${p.replace(/^\/?storage\//, "")}`) : null);

const durationText = (a, b) => {
  const s = toDate(a), e = toDate(b);
  if (!s || !e || e < s) return "";
  const days = Math.round((e - s) / 86400000) + 1;
  if (days < 60) return `${days} jour${days > 1 ? "s" : ""}`;
  const m = Math.round(days / 30.4);
  return m >= 12 && m % 12 === 0 ? `${m / 12} an${m > 12 ? "s" : ""}` : `${m} mois`;
};

/* ========================================================================== */
/*  Petits composants                                                          */
/* ========================================================================== */

function CountUp({ value, format = (v) => v }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const target = Number(value) || 0;
    let raf; let t0;
    const step = (t) => {
      if (!t0) t0 = t;
      const p = Math.min(1, (t - t0) / 700);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{format(n)}</>;
}

function Ring({ pct, size = 52, children }) {
  const r = (size - 7) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="5" stroke="rgba(255,255,255,0.15)" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="5" stroke="#16B8B1" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * Math.min(100, pct)) / 100} className="transition-all duration-700" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-white">{children}</span>
    </div>
  );
}

function Card({ title, hint, right, children, className = "" }) {
  return (
    <section className={`${card} ts-rise p-5 sm:p-6 ${className}`}>
      {(title || right) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.1em] text-[#0B2235] dark:text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-[#16B8B1]" /> {title}
            </h2>
            {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

function Kpi({ icon: Icon, label, children, sub }) {
  return (
    <div className="flex items-center gap-3.5 px-5 py-4">
      {children ? children : (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#5EE0DA]"><Icon size={18} /></span>
      )}
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">{label}</p>
        <p className="mt-0.5 truncate text-sm font-extrabold text-white">{sub.main}</p>
        {sub.small && <p className="truncate text-[11px] text-white/55">{sub.small}</p>}
      </div>
    </div>
  );
}

function Tile({ icon: Icon, label, value, hot }) {
  return (
    <div className={`rounded-xl px-3.5 py-3.5 ${hot ? "bg-amber-100 dark:bg-amber-500/15" : "bg-slate-50 dark:bg-[#0B2235]"}`}>
      <Icon size={15} className={hot ? "text-amber-600" : "text-slate-400"} />
      <p className={`mt-2 text-xl font-extrabold leading-none tabular-nums ${hot ? "text-amber-700 dark:text-amber-300" : "text-[#0B2235] dark:text-white"}`}>
        <CountUp value={value} />
      </p>
      <p className="mt-1.5 text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-[13px]">
      <dt className="shrink-0 text-slate-400">{k}</dt>
      <dd className="text-right font-semibold text-slate-800 dark:text-slate-100">{v || "—"}</dd>
    </div>
  );
}

function Timeline({ start, end, freeFrom }) {
  const s = toDate(start), e = toDate(end);
  if (!s || !e || e <= s) return null;
  const now = new Date();
  const pos = (d) => Math.max(0, Math.min(100, ((d - s) / (e - s)) * 100));
  const today = pos(now);
  const free = freeFrom ? pos(toDate(freeFrom)) : 0;
  const phase = now < s ? "upcoming" : now > e ? "past" : "live";
  const label = phase === "upcoming" ? `Débute ${relDays(start) || ""}` : phase === "live" ? `Se termine ${relDays(end) || ""}` : "Période terminée";

  return (
    <div>
      <div className="relative h-3 rounded-full bg-[#16B8B1]/15">
        {free > 0 ? (
          <div className="ts-grow absolute inset-y-0 left-0 rounded-full bg-amber-300" style={{ width: `${free}%` }} />
        ) : (
          <div className="ts-grow absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#16B8B1] to-[#3478E8]" style={{ width: `${today}%` }} />
        )}
        {phase === "live" && (
          <span className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-[#3478E8] shadow-md dark:border-[#0F2A40]" style={{ left: `${today}%` }} />
        )}
      </div>
      <div className="mt-2.5 flex justify-between text-[11px] font-medium text-slate-500">
        <span>{fmtDate(start)}</span>
        <span>{fmtDate(end)}</span>
      </div>
      <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#16B8B1]/10 px-2.5 py-1.5 text-xs font-bold text-[#0E8F8A] dark:text-[#5EE0DA]">
        <Hourglass size={12} /> {label}
      </p>
      {free > 0 && (
        <p className="mt-3 flex items-center gap-4 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-300" /> En mission</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#16B8B1]/50" /> Disponible</span>
        </p>
      )}
    </div>
  );
}

function CostCard({ o }) {
  const startMin = String(o.start_at).slice(0, 10);
  const endMax = String(o.end_at).slice(0, 10);
  const [r, setR] = useState({ start: startMin, end: endMax });
  const days = workingDays(r.start, r.end);
  const total = o.daily_rate ? o.daily_rate * days * workloadFactor(o.workload_value, o.workload_unit) : null;

  const preset = (months) => {
    const d = new Date(r.start || startMin);
    d.setUTCMonth(d.getUTCMonth() + months);
    const iso = d.toISOString().slice(0, 10);
    setR((x) => ({ ...x, end: iso > endMax ? endMax : iso }));
  };

  return (
    <Card title="Estimer le coût" hint="Choisissez vos dates pour calculer le budget.">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-slate-500">Début</label>
          <input type="date" className={inp} value={r.start} min={startMin} max={r.end || endMax} onChange={(e) => setR((x) => ({ ...x, start: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-slate-500">Fin</label>
          <input type="date" className={inp} value={r.end} min={r.start || startMin} max={endMax} onChange={(e) => setR((x) => ({ ...x, end: e.target.value }))} />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {[[1, "1 mois"], [3, "3 mois"]].map(([m, l]) => (
          <button type="button" key={m} onClick={() => preset(m)}
            className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-[#16B8B1]/15 hover:text-[#0E8F8A] dark:bg-white/10 dark:text-slate-300">{l}</button>
        ))}
        <button type="button" onClick={() => setR({ start: startMin, end: endMax })}
          className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-[#16B8B1]/15 hover:text-[#0E8F8A] dark:bg-white/10 dark:text-slate-300">Toute la période</button>
      </div>
      {total != null ? (
        <div className="mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B2235] to-[#163650] p-5 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">Budget estimé</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums tracking-tight text-[#5EE0DA]">≈ {money(total)} €</p>
          <p className="mt-2 text-xs leading-5 text-white/60">
            {days} jours ouvrés · {o.daily_rate} € / jour · charge {workloadLabel(o.workload_value, o.workload_unit)}
          </p>
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:bg-white/5">Le tarif est à discuter : contactez l'entreprise pour obtenir un devis.</p>
      )}
    </Card>
  );
}

/* ========================================================================== */
/*  MODALE DE SUCCÈS PLEIN ÉCRAN                                               */
/* ========================================================================== */
function SuccessModal({ title, text, onClose }) {
  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-sm ts-font">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_30px_80px_-20px_rgba(15,23,42,0.4)] dark:bg-[#131E47]">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-teal-600 ring-8 ring-teal-50 dark:ring-white/5"
          style={{ animation: "tsPop .45s ease-out both" }}>
          <CheckCircle2 size={32} strokeWidth={2.6} />
        </span>
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-white" style={{ animation: "tsUp .4s .1s ease-out both" }}>{title}</h2>
        {text && <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300" style={{ animation: "tsUp .4s .18s ease-out both" }}>{text}</p>}
        <button onClick={onClose} className={`${btnMain} mt-7 w-full py-3`}>Continuer</button>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  Page                                                                       */
/* ========================================================================== */

export default function ResourceOfferDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { toast, show, close } = useToast();

  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [myCompanies, setMyCompanies] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [propLoading, setPropLoading] = useState(false);
  const [showPropose, setShowPropose] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [acting, setActing] = useState(false);
  const [avail, setAvail] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null); // ✅ État pour le modal de succès

  const tab = params.get("tab") === "proposals" ? "proposals" : "details";

  const loadOffer = () =>
    api.get(`/resource-sharing/${id}`)
      .then((r) => setOffer(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));

  useEffect(() => { setLoading(true); loadOffer(); /* eslint-disable-next-line */ }, [id, user]);

  useEffect(() => {
    if (!user) return;
    api.get(`/talent-market/${id}`).then((r) => setAvail(r.data)).catch(() => setAvail(null));
  }, [id, user, offer?.status]);

  useEffect(() => {
    if (!user) return;
    api.get("/companies/my/all")
      .then((r) => setMyCompanies(Array.isArray(r.data) ? r.data : r.data?.data || []))
      .catch(() => setMyCompanies([]));
  }, [user]);

  const loadProposals = () => {
    setPropLoading(true);
    api.get(`/resource-sharing/${id}/proposals`)
      .then((r) => setProposals(Array.isArray(r.data) ? r.data : []))
      .catch(() => setProposals([]))
      .finally(() => setPropLoading(false));
  };

  useEffect(() => { if (offer?.is_owner) loadProposals(); /* eslint-disable-next-line */ }, [offer?.is_owner]);

  const pending = useMemo(() => proposals.filter((p) => ["sent", "viewed"].includes(p.display_status || p.status)).length, [proposals]);

  if (loading) return <PageLayout><style>{FONT_CSS}</style><div className="ts-font mx-auto max-w-[1200px] px-4 py-10"><Skeleton rows={3} /></div></PageLayout>;

  if (error || !offer) {
    return (
      <PageLayout>
        <style>{FONT_CSS}</style>
        <div className="ts-font mx-auto max-w-lg px-4 py-24">
          <Empty title="Offre introuvable" text="Cette offre est indisponible ou vous n'y avez pas accès.">
            <Link to="/resource-offers/browse" className={`${btnMain} !w-auto`}>Retour au marché des talents</Link>
          </Empty>
        </div>
      </PageLayout>
    );
  }

  const profile = offer.profile || {};
  const company = offer.company || {};
  const talent = profile.user || {};
  const isOwner = !!offer.is_owner;
  const alreadyIds = (offer.already_proposed_companies || []).map(Number);
  const eligible = myCompanies.filter((c) => c.id !== offer.company_id && !alreadyIds.includes(Number(c.id)));
  const available = offer.status === "published" && offer.display_status === "published";

  const ao = avail?.offer;
  const state = ao?.state;
  const unavailableNow = !!(user && !isOwner && ao && state !== "available");
  const canPropose = user && !isOwner && available && eligible.length > 0 && !unavailableNow;
  const hasProposed = user && !isOwner && alreadyIds.length > 0 && eligible.length === 0;
  const displayKey = offer.display_status || offer.status;
  const [statusLabel, statusCls] = OFFER_STATUS[displayKey] || [displayKey, OFFER_STATUS.draft[1]];
  const hasMission = String(displayKey).startsWith("mission_");

  const logo = ao?.company?.logo_url || storage(company.logo_path);
  const companyCity = ao?.company?.city;
  const verified = !!ao?.company?.is_verified;
  const avatarSrc = ao?.talent?.avatar_url || storage(profile.avatar_path);
  const portfolio = ao?.talent?.portfolio;
  const waitCount = ao?.waitlist_count || 0;
  const waiters = avail?.waiting_companies || [];

  const skills = ao?.skills?.length
    ? ao.skills
    : (offer.skills || []).map((s) => ({ ...s, level: (profile.skills || []).find((x) => x.id === s.id)?.pivot?.level }));

  const dur = durationText(offer.start_at, offer.end_at);
  const days = workingDays(offer.start_at, offer.end_at);
  const potential = offer.daily_rate ? offer.daily_rate * days * workloadFactor(offer.workload_value, offer.workload_unit) : null;

  const wv = Number(offer.workload_value) || 0;
  const loadPct = offer.workload_unit === "percentage" ? wv : offer.workload_unit === "hours_per_week" ? (wv / 40) * 100 : (wv / 5) * 100;

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); show("Lien copié", "success"); }
    catch { show("Impossible de copier le lien", "error"); }
  };

  const submitContact = async () => {
    if (!user) { navigate("/login"); return; }
    if (!message.trim()) return;
    setSending(true);
    try {
      await api.post("/conversations", { participant_ids: [company.owner_user_id], body: message, resource_offer_id: offer.id });
      setShowContact(false); setMessage("");
      show("Message envoyé", "success");
      setTimeout(() => navigate("/messages"), 1000);
    } catch (e) { show(apiError(e), "error"); }
    finally { setSending(false); }
  };

  const respond = async () => {
    setActing(true);
    try {
      const { proposal, action } = confirm;
      await api.post(`/proposals/${proposal.id}/${action}`);
      
      setConfirm(null);
      loadProposals(); 
      loadOffer();

      // ✅ Affichage du modal de succès
      if (action === "accept") {
        setSuccessInfo({
          title: "Proposition acceptée !",
          text: `La mission a été créée avec succès. Le salarié va maintenant recevoir une notification pour confirmer sa participation.`,
        });
      } else {
        // Optionnel : afficher un toast pour le refus
        show("Proposition refusée.", "success");
      }
    } catch (e) { show(apiError(e), "error"); }
    finally { setActing(false); }
  };

  return (
    <PageLayout>
      <style>{FONT_CSS}</style>
      <main className={`ts-font min-h-screen bg-[#F4F7FA] px-3 pb-16 pt-6 dark:bg-transparent sm:px-5 lg:px-8 ${FONT} text-[13px]`}>
        <div className="mx-auto max-w-[1200px] space-y-6">
          <Link to={isOwner ? "/resource-offers" : "/resource-offers/browse"}
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-500 transition hover:text-[#0E8F8A] dark:text-slate-400">
            <ArrowLeft size={15} /> {isOwner ? "Mes offres" : "Marché des talents"}
          </Link>

          {/* Bandeau */}
          <section className="ts-rise relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B2235] via-[#0E2B42] to-[#163650] shadow-xl shadow-[#0B2235]/15">
            <span className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#16B8B1]/20 blur-3xl" />
            <span className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-[#3478E8]/20 blur-3xl" />

            <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/85">{MISSION_TYPES[offer.mission_type] || offer.mission_type}</span>
                  {isOwner && <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusCls}`}>{statusLabel}</span>}
                  {isOwner && <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/70">{VISIBILITY[offer.visibility || "public"]}</span>}
                  {ao && <StateBadge state={state} availableFrom={ao.available_from} indefinite={ao.indefinite} compact />}
                </div>
                <h1 className="mt-4 max-w-3xl break-words text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-[34px]">{offer.title}</h1>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-white/65">
                  <span className="inline-flex items-center gap-1.5"><Calendar size={14} className="text-[#5EE0DA]" /> {fmtDate(offer.start_at)} au {fmtDate(offer.end_at)}</span>
                  <span className="inline-flex items-center gap-1.5"><MapPin size={14} className="text-[#5EE0DA]" /> {LOCATIONS[offer.location_type] || "—"}{offer.location_city ? ` · ${offer.location_city}` : ""}</span>
                  {offer.published_at && <span className="inline-flex items-center gap-1.5"><Clock size={14} className="text-[#5EE0DA]" /> Publiée le {fmtDate(offer.published_at)}</span>}
                </div>
              </div>

              {company.name && (
                <Link to={company.id ? `/entreprises/${company.id}` : "#"}
                  className="group flex shrink-0 items-center gap-3.5 rounded-2xl bg-white/10 px-4 py-3.5 ring-1 ring-white/15 backdrop-blur transition hover:bg-white/15">
                  <Avatar name={company.name} src={logo} size={46} square />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">Entreprise prêteuse</p>
                    <p className="max-w-[220px] truncate text-sm font-bold text-white">{company.name}</p>
                    {(companyCity || verified) && (
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/60">
                        {verified && <ShieldCheck size={11} className="text-[#5EE0DA]" />}{companyCity}{companyCity && verified ? " · " : ""}{verified ? "vérifiée" : ""}
                      </p>
                    )}
                  </div>
                  <ArrowUpRight size={16} className="text-white/40 transition group-hover:text-white" />
                </Link>
              )}
            </div>

            <div className="relative grid grid-cols-2 border-t border-white/10 bg-white/[0.04] lg:grid-cols-4 lg:divide-x lg:divide-white/10">
              <Kpi icon={Wallet} label="Tarif journalier"
                sub={{ main: offer.daily_rate ? `${offer.daily_rate} € / jour` : "À discuter", small: potential ? `Budget max ≈ ${money(potential)} €` : null }} />
              <Kpi icon={Calendar} label="Durée"
                sub={{ main: dur || "—", small: days ? `${days} jours ouvrés` : null }} />
              <Kpi label="Charge"
                sub={{ main: workloadLabel(offer.workload_value, offer.workload_unit), small: "de disponibilité" }}>
                <Ring pct={loadPct}>{Math.round(Math.min(100, loadPct))}%</Ring>
              </Kpi>
              <Kpi icon={MapPin} label="Lieu"
                sub={{ main: LOCATIONS[offer.location_type] || "—", small: offer.location_city || null }} />
            </div>
          </section>

          {isOwner && (
            <Tabs value={tab} onChange={(k) => setParams(k === "details" ? {} : { tab: k })}
              tabs={[{ id: "details", label: "Détails" }, { id: "proposals", label: "Propositions reçues", count: proposals.length }]} />
          )}

          {/* Propositions */}
          {tab === "proposals" && isOwner ? (
            <section className="space-y-3">
              {propLoading ? <Skeleton rows={2} /> : proposals.length === 0 ? (
                <Empty title="Aucune proposition reçue" text="Dès qu'une entreprise enverra une proposition, elle apparaîtra ici." />
              ) : proposals.map((p, i) => {
                const st = p.display_status || p.status;
                const [label, cls, bar] = PROPOSAL_STATUS[st] || [st, PROPOSAL_STATUS.draft[1], PROPOSAL_STATUS.draft[2]];
                const pc = p.proposing_company || {};
                const open = ["sent", "viewed"].includes(st);
                return (
                  <article key={p.id} style={{ animationDelay: `${i * 50}ms` }} className={`${card} ts-rise relative overflow-hidden`}>
                    <span className={`absolute inset-y-0 left-0 w-1 ${bar}`} />
                    <div className="flex flex-col gap-4 p-5 pl-6 sm:flex-row sm:items-center sm:justify-between">
                      
                      {/* BLOC GAUCHE : Infos */}
                      <div className="flex min-w-0 flex-1 gap-3.5">
                        <Avatar name={pc.name} src={storage(pc.logo_path)} size={42} square />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold text-[#0B2235] dark:text-white">{pc.name || "Entreprise"}</p>
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${cls}`}>{label}</span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            Du {fmtDate(p.start_at)} au {fmtDate(p.end_at)} · {p.workload_percent || 100}%
                            {p.days_until_expiry != null && open && <span className="ml-1 font-semibold text-amber-600">· expire dans {p.days_until_expiry} j</span>}
                          </p>
                          {p.message && (
                            <p className="mt-2 line-clamp-1 text-xs text-slate-600 dark:text-slate-300 italic">« {p.message} »</p>
                          )}
                        </div>
                      </div>

                      {/* BLOC DROITE : Boutons sur la même ligne */}
                      <div className="flex shrink-0 items-center gap-2">
                        <Link to={`/proposals/${p.id}`} className={`${btnLine} !w-auto !py-2`}>
                          Détails
                        </Link>
                        {open && (
                          <>
                            <button onClick={() => setConfirm({ proposal: p, action: "accept" })} className={`${btnMain} !w-auto !py-2`}>
                              Accepter
                            </button>
                            <button onClick={() => setConfirm({ proposal: p, action: "decline" })} className={`${btnRose} !py-2`}>
                              Refuser
                            </button>
                          </>
                        )}
                      </div>

                    </div>
                  </article>
                );
              })}
            </section>
          ) : (
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-w-0 space-y-6">
                <section className={`${card} ts-rise overflow-hidden`}>
                  <div className="h-24 bg-gradient-to-r from-[#0B2235] via-[#163650] to-[#16B8B1]/60" />
                  <div className="px-5 pb-6 sm:px-6">
                    <div className="-mt-11 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div className="flex items-end gap-4">
                        <span className="rounded-full bg-white p-1 shadow-lg dark:bg-[#0F2A40]"><Avatar name={talent.name} src={avatarSrc} size={88} /></span>
                        <div className="min-w-0 pb-1">
                          <p className="truncate text-xl font-extrabold text-[#0B2235] dark:text-white">{talent.name}</p>
                          {profile.headline && profile.headline !== talent.name && (
                            <p className="truncate text-sm font-semibold text-[#0E8F8A] dark:text-[#5EE0DA]">{profile.headline}</p>
                          )}
                        </div>
                      </div>
                      {portfolio?.slug && (
                        <a href={`/portfolio/${portfolio.slug}`} target="_blank" rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 self-start rounded-xl bg-[#16B8B1]/10 px-4 py-2.5 text-xs font-bold text-[#0E8F8A] transition hover:bg-[#16B8B1]/20 dark:text-[#5EE0DA] sm:self-auto">
                          Voir son portfolio <ArrowUpRight size={13} />
                        </a>
                      )}
                    </div>
                    <p className="mt-4 text-xs text-slate-500">Salarié de <span className="font-semibold text-slate-700 dark:text-slate-200">{company.name}</span></p>
                    {profile.bio && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">{profile.bio}</p>}
                  </div>
                </section>

                <Card title="Description de la mission">
                  <p className="whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300">{offer.description}</p>
                </Card>

                {skills.length > 0 && (
                  <Card title="Compétences proposées" hint="Les barres indiquent le niveau déclaré."
                    right={<span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:bg-white/10">{skills.length}</span>}>
                    <SkillChips skills={skills} max={30} />
                  </Card>
                )}

                {offer.conditions && (
                  <Card title="Conditions particulières">
                    <ul className="space-y-2.5">
                      {offer.conditions.split("\n").filter(Boolean).map((c, i) => (
                        <li key={i} className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-[#0B2235] dark:text-slate-300">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#16B8B1]" /> {c}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>

              <aside className="min-w-0 space-y-6">
                <section className={`${card} ts-rise space-y-4 p-5 sm:p-6 lg:sticky lg:top-6 lg:z-10`}>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Tarif journalier</p>
                    <p className="mt-1.5 text-3xl font-extrabold tracking-tight text-[#0B2235] dark:text-white">
                      {offer.daily_rate
                        ? <><CountUp value={offer.daily_rate} /> <span className="text-sm font-semibold text-slate-400">€ / jour</span></>
                        : <span className="text-xl">À discuter</span>}
                    </p>
                    {potential != null && <p className="mt-1 text-xs text-slate-500">Budget maximal ≈ <b className="text-[#0E8F8A] dark:text-[#5EE0DA]">{money(potential)} €</b></p>}
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {isOwner && (
                      <>
                        <Link to="?tab=proposals" className={btnMain}><Inbox size={15} /> Voir les propositions{pending > 0 ? ` (${pending})` : ""}</Link>
                        {!hasMission && <Link to={`/resource-offers/${offer.id}/edit`} className={btnLine}><Edit3 size={14} /> Modifier l'offre</Link>}
                      </>
                    )}

                    {!isOwner && canPropose && <button onClick={() => setShowPropose(true)} className={btnMain}>Proposer une collaboration</button>}
                    {!isOwner && hasProposed && <Link to="/collaborations" className={btnLine}>Proposition déjà envoyée</Link>}
                    {!isOwner && !user && <Link to="/login" className={btnMain}>Connectez-vous pour proposer</Link>}

                    {unavailableNow && (
                      <div className="rounded-2xl bg-amber-50 p-4 text-xs leading-5 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                        Ce talent est actuellement {state === "reserved" ? "réservé" : "en mission"}
                        {ao.available_from ? `, libre à partir du ${fmtDate(ao.available_from)}` : ""}.
                        {waitCount > 0 && ` ${waitCount} entreprise${waitCount > 1 ? "s" : ""} l'attend${waitCount > 1 ? "ent" : ""} déjà.`}
                        <Link to={`/resource-offers/browse?offer=${offer.id}`} className={`${btnLine} mt-3 bg-white dark:bg-transparent`}>Rejoindre la liste d'attente</Link>
                      </div>
                    )}

                    {!isOwner && user && !available && (
                      <p className="rounded-2xl bg-amber-50 p-4 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">Cette offre n'accepte plus de propositions.</p>
                    )}
                    {!isOwner && user && available && myCompanies.length === 0 && (
                      <p className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-500 dark:bg-white/5">Seule une entreprise peut envoyer une proposition.</p>
                    )}

                    {!isOwner && (
                      <button onClick={() => (user ? setShowContact(true) : navigate("/login"))} className={btnLine}>
                        <MessageSquare size={14} /> Contacter l'entreprise
                      </button>
                    )}
                    <button onClick={copyLink}
                      className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-[#0E8F8A] dark:hover:bg-white/5">
                      <Link2 size={13} /> Copier le lien de l'offre
                    </button>
                  </div>
                </section>

                <Card title="Disponibilité">
                  <Timeline start={offer.start_at} end={offer.end_at} freeFrom={state && state !== "available" ? ao?.available_from : null} />
                  {ao?.available_from && state !== "available" && (
                    <p className="mt-3 text-xs font-semibold text-amber-700 dark:text-amber-300">Libre {relDays(ao.available_from)}, le {fmtDate(ao.available_from)}</p>
                  )}
                  {daysUntil(offer.end_at) != null && daysUntil(offer.end_at) >= 0 && (
                    <p className="mt-1.5 text-xs text-slate-500">Offre valable {relDays(offer.end_at)}</p>
                  )}
                </Card>

                {!isOwner && <CostCard o={offer} />}

                {isOwner && (
                  <Card title="Suivi de l'offre" hint="Performance et intérêt des autres entreprises.">
                    <div className="grid grid-cols-2 gap-2.5">
                      <Tile icon={Eye} label="Vues" value={offer.views_count || 0} />
                      <Tile icon={Inbox} label="Propositions" value={proposals.length} />
                      <Tile icon={Inbox} label="À traiter" value={pending} hot={pending > 0} />
                      <Tile icon={Users} label="En attente du talent" value={waitCount} />
                    </div>
                    {waiters.length > 0 && (
                      <div className="mt-5 space-y-2">
                        <p className="text-xs font-bold text-slate-500">Entreprises qui attendent ce talent</p>
                        {waiters.map((w, i) => <WaiterRow key={w.company_id || i} w={w} index={i} />)}
                      </div>
                    )}
                  </Card>
                )}

                <Card title="Récapitulatif">
                  <dl className="divide-y divide-slate-100 dark:divide-white/10">
                    <Row k="Entreprise" v={company.name} />
                    <Row k="Type" v={MISSION_TYPES[offer.mission_type] || offer.mission_type} />
                    <Row k="Charge" v={workloadLabel(offer.workload_value, offer.workload_unit)} />
                    <Row k="Durée" v={dur} />
                    <Row k="Lieu" v={`${LOCATIONS[offer.location_type] || "—"}${offer.location_city ? `, ${offer.location_city}` : ""}`} />
                    {isOwner && <Row k="Visibilité" v={VISIBILITY[offer.visibility || "public"]} />}
                  </dl>
                </Card>
              </aside>
            </div>
          )}
        </div>
      </main>

      {showPropose && (
        <ProposalFormModal offer={offer} companies={eligible} onClose={() => setShowPropose(false)}
          onSaved={(msg) => { setShowPropose(false); show(msg, "success"); loadOffer(); }} />
      )}

      {showContact && (
        <ModalFrame icon={MessageSquare} title={`Contacter ${company.name}`} subtitle="Votre message arrivera dans la messagerie." size="max-w-lg" onClose={() => setShowContact(false)}
          footer={
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowContact(false)} className={`${btnLine} !w-auto !py-2.5`}>Annuler</button>
              <button onClick={submitContact} disabled={!message.trim() || sending} className={`${btnMain} !w-auto !py-2.5`}>
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Envoyer
              </button>
            </div>
          }>
          <div className="px-6 py-6 sm:px-8">
            <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">Message</label>
            <textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} autoFocus className={inp}
              placeholder="Bonjour, nous sommes intéressés par ce profil…" />
          </div>
        </ModalFrame>
      )}

      {confirm && (
        <ConfirmDialog danger={confirm.action === "decline"} busy={acting}
          title={confirm.action === "accept" ? "Accepter la proposition ?" : "Refuser la proposition ?"}
          text={confirm.action === "accept"
            ? `Une mission sera créée avec ${confirm.proposal.proposing_company?.name || "cette entreprise"} et le salarié devra confirmer sa participation. Les autres propositions ne pourront plus être acceptées tant que cette mission existe.`
            : "L'entreprise sera prévenue du refus. Cette action est définitive."}
          confirmLabel={confirm.action === "accept" ? "Oui, accepter" : "Oui, refuser"}
          onConfirm={respond} onCancel={() => setConfirm(null)} />
      )}

      {/* ✅ MODAL DE SUCCÈS PLEIN ÉCRAN */}
      {successInfo && (
        <SuccessModal 
          title={successInfo.title} 
          text={successInfo.text} 
          onClose={() => setSuccessInfo(null)} 
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={close} />}
    </PageLayout>
  );
}