import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Clock3,
  FileSearch,
  Flag,
  Inbox,
  LayoutGrid,
  List,
  Loader2,
  Play,
  RotateCcw,
  Search,
  Send,
  Zap,
} from "lucide-react";

import AppShell from "../components/layout/AppShell";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

import { CONTRACTS, getContractType, activeLabel } from "../utils/contracts";

import {
  Avatar,
  StatusPill,
  MISSION_STATUS,
  PROPOSAL_STATUS,
  fmt,
  durationText,
} from "../components/collab/ui";

/* =====================================================
   CONFIGURATION
===================================================== */

const MISSION_STAGES = [
  { id: "pending_employee", label: "En attente", tone: "amber" },
  { id: "planned", label: "Acceptées", tone: "blue" },
  { id: "trial", label: "Essai", tone: "violet" },
  { id: "active", label: "En cours", tone: "teal" },
  { id: "completed", label: "Terminées", tone: "slate" },
  { id: "cancelled", label: "Annulées", tone: "rose" },
];

const PROPOSAL_STAGES = [
  { id: "draft", label: "Brouillons", tone: "slate" },
  { id: "sent", label: "Envoyées", tone: "blue" },
  { id: "viewed", label: "Consultées", tone: "violet" },
  { id: "accepted", label: "Acceptées", tone: "emerald" },
  { id: "declined", label: "Refusées", tone: "rose" },
  { id: "expired", label: "Expirées", tone: "amber" },
];

const CONTRACT_FILTERS = [
  { id: "all", label: "Tous les contrats" },
  { id: "internship", label: "Stage" },
  { id: "apprenticeship", label: "Alternance" },
  { id: "fixed_term", label: "CDD" },
  { id: "permanent", label: "CDI" },
  { id: "sharing", label: "Partage de talent" },
];

const STAGE_COLORS = {
  amber: "bg-amber-400",
  blue: "bg-blue-400",
  violet: "bg-violet-400",
  teal: "bg-[#16B8B1]",
  emerald: "bg-emerald-400",
  slate: "bg-slate-300",
  rose: "bg-rose-400",
};

const STAGE_LIGHT = {
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  violet: "bg-violet-50 text-violet-600 border-violet-100",
  teal: "bg-teal-50 text-teal-600 border-teal-100",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  slate: "bg-slate-50 text-slate-600 border-slate-200",
  rose: "bg-rose-50 text-rose-600 border-rose-100",
};

/* Parcours visuel (stepper) */
const MISSION_FLOW = ["Attente", "Acceptée", "En cours", "Terminée"];
const MISSION_INDEX = {
  pending_employee: 0,
  planned: 1,
  trial: 2,
  active: 2,
  completed: 3,
  cancelled: 0,
};

const PROPOSAL_FLOW = ["Envoyée", "Consultée", "Acceptée"];
const PROPOSAL_INDEX = {
  draft: -1,
  sent: 0,
  viewed: 1,
  accepted: 2,
  declined: 1,
  expired: 0,
  cancelled: 0,
};

const DAY_MS = 86400000;

/* =====================================================
   UTILITAIRES
===================================================== */

const normalized = (v) =>
  String(v || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const asArray = (res) =>
  Array.isArray(res?.data) ? res.data : res?.data?.data || [];

const isCompanyToCompany = (p) =>
  Boolean(
    p.resource_offer_id || (p.proposed_by_company_id && p.to_company_id)
  );

function getMissionTitle(m) {
  if (m?.title) return m.title;
  if (m?.resource_offer?.title) return m.resource_offer.title;
  if (m?.proposal?.resource_request?.title)
    return m.proposal.resource_request.title;
  if (m?.job_offer?.title) return m.job_offer.title;
  if (m?.resource_request?.title) return m.resource_request.title;

  const company = m?.requesting_company?.name || "votre entreprise";
  const talent = m?.profile?.user?.name;

  if (talent) return `Recrutement chez ${company} · ${talent}`;

  return `Mission #${m?.id ?? "—"}`;
}

function computeProgress(startAt, endAt) {
  if (!startAt || !endAt) return null;
  const s = new Date(startAt).getTime();
  const e = new Date(endAt).getTime();
  if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return null;

  const now = Date.now();

  return {
    pct: Math.max(0, Math.min(100, Math.round(((now - s) / (e - s)) * 100))),
    notStarted: now < s,
    finished: now > e,
    daysLeft: Math.max(0, Math.ceil((e - now) / DAY_MS)),
    daysUntil: Math.max(0, Math.ceil((s - now) / DAY_MS)),
  };
}

const canStartMission = (flags, status) =>
  ((flags.isSupplier && !flags.isRequesting) ||
    (flags.isRequesting && flags.isDirectHire)) &&
  status === "planned";

/* =====================================================
   PETITS COMPOSANTS
===================================================== */

function Stepper({ steps, index, failed }) {
  return (
    <div>
      <div className="flex items-center gap-1">
        {steps.map((s, i) => {
          const done = i <= index;
          return (
            <span
              key={s}
              title={s}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                done
                  ? failed
                    ? "bg-rose-300"
                    : "bg-[#16B8B1]"
                  : "bg-slate-100"
              }`}
            />
          );
        })}
      </div>

      <div className="mt-1.5 flex justify-between gap-1">
        {steps.map((s, i) => (
          <span
            key={s}
            className={`min-w-0 flex-1 truncate text-[10px] ${
              i === index
                ? failed
                  ? "font-semibold text-rose-500"
                  : "font-semibold text-slate-700"
                : "font-medium text-slate-400"
            } ${i === 0 ? "text-left" : i === steps.length - 1 ? "text-right" : "text-center"}`}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

function TimeBar({ progress, indefinite }) {
  if (!progress && !indefinite) return null;

  if (!progress) {
    return (
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
        <Clock3 size={12} className="text-[#16B8B1]" />
        Contrat sans date de fin
      </p>
    );
  }

  const label = progress.notStarted
    ? `Démarre dans ${progress.daysUntil} j`
    : progress.finished
      ? "Période échue"
      : `${progress.daysLeft} j restants`;

  return (
    <div>
      <div className="h-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-300 transition-all duration-700"
          style={{ width: `${Math.max(progress.pct, 3)}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] font-medium text-slate-400">
        <span>{label}</span>
        <span>{progress.pct}% écoulé</span>
      </div>
    </div>
  );
}

function Identity({ r, size = 44 }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative shrink-0">
        <Avatar name={r.avatarName} path={r.avatarPath} size={size} />
        {r.unread && (
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#16B8B1]" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            to={r.href}
            className="truncate text-[13px] font-semibold text-slate-700 transition hover:text-[#0D9992]"
          >
            {r.name}
          </Link>

          {r.unread && (
            <span className="rounded-md border border-teal-100 bg-teal-50 px-1.5 py-0.5 text-[10px] font-medium text-teal-600">
              Nouveau
            </span>
          )}

          {r.tag && (
            <span className="rounded-md border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
              {r.tag}
            </span>
          )}
        </div>

        <p className="mt-0.5 truncate text-[12px] font-medium text-slate-500">
          {r.title}
        </p>

        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-slate-400">
          <Building2 size={11} className="shrink-0" />
          <span className="truncate">
            {r.direction === "received" && "De "}
            {r.direction === "sent" && "À "}
            {r.company || "—"}
          </span>
          <span className="shrink-0 text-slate-300">#{r.id}</span>
        </p>
      </div>
    </div>
  );
}

function Period({ r }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
        <CalendarDays size={15} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold text-slate-600">
          {r.period}
        </p>
        <p className="text-[10px] font-medium text-slate-400">{r.hint}</p>
      </div>
    </div>
  );
}

function Deadline({ r }) {
  if (!r.deadline) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
        r.urgent ? "bg-rose-50 text-rose-500" : "bg-slate-50 text-slate-500"
      }`}
    >
      <Clock3 size={10} />
      {r.deadline}
    </span>
  );
}

function Lifecycle({ r }) {
  return (
    <div className="space-y-2.5">
      <Stepper steps={r.flow} index={r.flowIndex} failed={r.failed} />
      <TimeBar progress={r.progress} indefinite={r.indefinite} />
    </div>
  );
}

function DetailsLink({ r, label = "Détails" }) {
  return (
    <Link
      to={r.href}
      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
    >
      {label}
      <ArrowRight size={12} />
    </Link>
  );
}

/* Carte (vue pipeline - réservée entreprise) */
function CollabCard({ r, actions, rail, dim }) {
  return (
    <article
      className={`group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3.5 transition duration-200 hover:shadow-sm ${
        dim ? "opacity-50 hover:opacity-100" : ""
      }`}
    >
      <span className={`absolute inset-y-0 left-0 w-[3px] ${rail}`} />

      <Identity r={r} size={40} />

      <div className="mt-3.5">
        <Lifecycle r={r} />
      </div>

      <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <Period r={r} />
        <Deadline r={r} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {actions}
        <span className="ml-auto">
          <DetailsLink r={r} />
        </span>
      </div>
    </article>
  );
}

/* Ligne (vue liste - pour les étudiants) */
function CollabRow({ r, actions, rail }) {
  return (
    <li className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white transition duration-200 hover:shadow-sm">
      <span className={`absolute inset-y-0 left-0 w-[3px] ${rail}`} />

      <div className="grid gap-4 px-4 py-4 pl-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] lg:items-center lg:gap-6">
        <Identity r={r} />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <Lifecycle r={r} />
          <Period r={r} />
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:min-w-[260px] lg:flex-col lg:items-end">
          <div className="flex items-center gap-2">
            <Deadline r={r} />
            <StatusPill tone={r.tone}>{r.statusLabel}</StatusPill>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {actions}
            <DetailsLink r={r} label="Voir détails" />
          </div>
        </div>
      </div>
    </li>
  );
}

function PipelineNav({ stages, stage, setStage, countOf, total }) {
  return (
    <div className="collab-scroll flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={() => setStage("all")}
        aria-pressed={stage === "all"}
        className={`relative min-w-[104px] shrink-0 overflow-hidden rounded-lg border p-3 text-left transition ${
          stage === "all"
            ? "border-slate-300 bg-slate-50 text-slate-800"
            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
        }`}
      >
        <p className="text-[11px] font-medium">Toutes</p>
        <p className="mt-1 text-[20px] font-semibold leading-none">{total}</p>
      </button>

      {stages.map((s) => {
        const n = countOf(s.id);
        const active = stage === s.id;

        return (
          <button
            key={s.id}
            type="button"
            onClick={() => setStage(active ? "all" : s.id)}
            aria-pressed={active}
            className={`relative min-w-[118px] flex-1 shrink-0 overflow-hidden rounded-lg border p-3 text-left transition ${
              active
                ? "border-slate-300 bg-white shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
              <span className={`h-2 w-2 rounded-full ${STAGE_COLORS[s.tone]}`} />
              {s.label}
            </p>
            <p className="mt-1 text-[20px] font-semibold leading-none text-slate-700">
              {n}
            </p>

            <span className="absolute inset-x-0 bottom-0 h-[3px] bg-slate-50">
              <span
                className={`block h-full ${STAGE_COLORS[s.tone]} transition-all duration-500`}
                style={{ width: total ? `${(n / total) * 100}%` : "0%" }}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* Bloc prioritaire (design adouci) */
function FocusStrip({ items }) {
  if (items.length === 0) return null;

  return (
    <section className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3 pl-4 sm:p-4 sm:pl-5">
      <span className="absolute inset-y-0 left-0 w-1 bg-amber-300" />

      <div className="mb-2.5 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
          <Zap size={14} />
        </span>

        <h2 className="text-[13px] font-semibold text-slate-700">
          À traiter en priorité
        </h2>

        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
          {items.length}
        </span>
      </div>

      <div className="collab-scroll flex gap-2 overflow-x-auto pb-1">
        {items.slice(0, 8).map((it) => (
          <Link
            key={it.key}
            to={it.href}
            className="group flex min-w-[220px] max-w-[300px] shrink-0 items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2 transition hover:border-slate-300 hover:shadow-sm"
          >
            <span
              className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium ${STAGE_LIGHT[it.tone]}`}
            >
              {it.kind}
            </span>
            <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-slate-600">
              {it.text}
            </span>
            <ArrowRight
              size={12}
              className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}

/* =====================================================
   PAGE COLLABORATIONS
===================================================== */

export default function Collaborations() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();

  const { toast, show: showToast, close: closeToast } = useToast();

  const isCompany = user?.role === "company";
  const isStudent = user?.role === "student" || user?.role === "employee";

  const [missions, setMissions] = useState([]);
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [myRequests, setMyRequests] = useState([]); // ✅ Stocke les demandes de l'entreprise

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const [stage, setStage] = useState("all");
  const [contractFilter, setContractFilter] = useState("all");
  const [search, setSearch] = useState("");
  
  // ✅ Filtre par demande spécifique
  const [requestFilter, setRequestFilter] = useState("all");

  // ✅ Vue par défaut : "list" pour les étudiants, "board" pour les entreprises
  const [view, setView] = useState(isStudent ? "list" : "board");

  const rawTab = params.get("tab") || "missions";

  // ✅ Les étudiants n'ont accès qu'à l'onglet "missions"
  const allowedTabs = isCompany
    ? ["missions", "received", "sent"]
    : ["missions"];

  const tab = allowedTabs.includes(rawTab) ? rawTab : "missions";

  const changeTab = (id) => {
    setParams({ tab: id }, { replace: true });
    setStage("all");
    setSearch("");
    setContractFilter("all");
    setRequestFilter("all"); // ✅ Réinitialise le filtre
  };

  /* =====================================================
     CHARGEMENT API
  ===================================================== */

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const calls = [api.get("/missions")];

        if (isCompany) {
          calls.push(
            api.get("/proposals/received"),
            api.get("/proposals/sent"),
            api.get("/resource-requests?my=1") // ✅ Récupère les demandes
          );
        }

        const [m, r, s, reqs] = await Promise.all(calls);

        setMissions(asArray(m));

        if (isCompany) {
          setReceived(asArray(r));
          setSent(asArray(s));
          setMyRequests(asArray(reqs)); // ✅ Stocke les demandes
        }

        setError(null);
      } catch (err) {
        console.error(
          "Erreur collaborations:",
          err.response?.data || err.message
        );

        setError(
          "Impossible de charger vos collaborations. Vérifiez votre connexion puis réessayez."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isCompany]
  );

  useEffect(() => {
    load();

    const timer = window.setInterval(() => load(true), 30000);

    return () => window.clearInterval(timer);
  }, [load]);

  /* =====================================================
     ACTIONS
  ===================================================== */

  const runAction = async (id, fn, message, type = "success") => {
    setActionLoading(id);

    try {
      await fn();
      showToast(message, type);
      await load(true);
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur serveur", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const acceptMission = (id) =>
    runAction(
      id,
      () => api.post(`/missions/${id}/accept`),
      "Mission acceptée."
    );

  const declineMission = (id) => {
    if (!window.confirm("Refuser cette mission ?")) return;

    runAction(
      id,
      () => api.post(`/missions/${id}/decline`),
      "Mission refusée.",
      "info"
    );
  };

  const updateStatus = (id, status) =>
    runAction(
      id,
      () => api.patch(`/missions/${id}/status`, { status }),
      status === "active" ? "Mission démarrée." : "Mission terminée."
    );

  /* =====================================================
     IDENTITE UTILISATEUR
  ===================================================== */

  const myProfileId =
    user?.professional_profile?.id ||
    user?.professionalProfile?.id ||
    user?.professional_profile_id;

  const myCompanyIds = (user?.companies || []).map((c) => Number(c.id));

  /* =====================================================
     NORMALISATION MISSIONS
  ===================================================== */

  const missionRows = useMemo(
    () =>
      missions.map((m) => {
        const cfg = MISSION_STATUS[m.status] || MISSION_STATUS.planned;

        const type = getContractType(m) ?? "other";
        const contract = CONTRACTS[type];

        const isEmployee =
          Boolean(myProfileId) &&
          Number(m.professional_profile_id) === Number(myProfileId);

        const isSupplier = myCompanyIds.includes(
          Number(m.supplying_company_id)
        );

        const isRequesting = myCompanyIds.includes(
          Number(m.requesting_company_id)
        );

        const isDirectHire = !m.supplying_company_id;

        const talent = m.profile?.user?.name;
        const company = m.requesting_company?.name || m.supplying_company?.name || "";

        return {
          key: `m-${m.id}`,
          id: m.id,
          href: `/missions/${m.id}`,
          stage: m.status,
          type,
          avatarName: isStudent ? company : (talent || company),
          avatarPath: isStudent 
            ? (
                m.requesting_company?.logo_url || 
                m.requesting_company?.logo_path || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(m.requesting_company?.name || "Entreprise")}&background=0B1F33&color=fff&bold=true&size=128`
              )
            : (m.profile?.avatar_path || m.profile?.user?.avatar_path),
          name: isStudent ? (company || "Entreprise") : (talent || "Talent à confirmer"),
          title: getMissionTitle(m),
          company: isStudent ? (talent || "") : company,
          tag: contract?.label,
          period: `${fmt(m.start_at, {
            day: "2-digit",
            month: "short",
          })} → ${
            m.end_at
              ? fmt(m.end_at, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : type === "permanent"
                ? "CDI"
                : "À définir"
          }`,
          hint: `${m.workload_percent ?? 100}% du temps`,
          tone: cfg.tone,
          statusLabel:
            m.status === "active" && contract
              ? activeLabel(type)
              : cfg.label,
          flow: MISSION_FLOW,
          flowIndex: MISSION_INDEX[m.status] ?? 0,
          failed: m.status === "cancelled",
          progress: ["planned", "active", "trial"].includes(m.status)
            ? computeProgress(m.start_at, m.end_at)
            : null,
          indefinite:
            m.status === "active" && type === "permanent" && !m.end_at,
          haystack: normalized(
            [getMissionTitle(m), talent, company, m.id].join(" ")
          ),
          flags: {
            isEmployee,
            isSupplier,
            isRequesting,
            isDirectHire,
          },
          status: m.status,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [missions, myProfileId, myCompanyIds.join(","), isStudent]
  );

  /* =====================================================
     NORMALISATION PROPOSITIONS
  ===================================================== */

 const proposalRows = (list, kind) =>
  list
    .filter((p) => {
      // ✅ Filtre par demande spécifique (uniquement sur l'onglet "Reçues")
      if (kind === "received" && requestFilter !== "all") {
        return String(p.resource_request_id) === String(requestFilter);
      }
      return true;
    })
    .map((p) => {
      const st = p.display_status || p.status;
      const cfg = PROPOSAL_STATUS[st] || PROPOSAL_STATUS.sent;

      const isApplication = kind === "received" && !p.proposed_by_company_id;
      const other = kind === "received" ? p.proposing_company : p.to_company;

      const title =
        p.resource_offer?.title ||
        p.resource_request?.title ||
        "Proposition directe";

      const talent = p.profile?.user?.name || "Salarié";
      const pending = ["sent", "viewed"].includes(st);

      return {
        key: `p-${kind}-${p.id}`,
        id: p.id,
        href: `/proposals/${p.id}`,
        stage: st === "cancelled" ? "expired" : st,
        avatarName: talent,
        avatarPath: p.profile?.avatar_path,
        name: talent,
        title,
        company: isApplication
          ? "Candidature talent"
          : other?.name || (kind === "sent" ? "Demande d'un talent" : "Entreprise"),
        direction: isApplication ? null : kind,
        tag: p.interview_status === "scheduled" ? "Entretien planifié" : null,
        period: p.start_at
          ? `${fmt(p.start_at, { day: "2-digit", month: "short" })} · ${
              durationText(p.start_at, p.end_at) || "Durée libre"
            }`
          : "Dates à définir",
        hint: `${p.workload_percent || 100}% du temps`,
        tone: cfg.tone,
        statusLabel: cfg.label,
        flow: PROPOSAL_FLOW,
        flowIndex: PROPOSAL_INDEX[st] ?? 0,
        failed: ["declined", "expired", "cancelled"].includes(st),
        progress: null,
        indefinite: false,
        unread: kind === "received" && p.status === "sent",
        deadline:
          pending && p.days_until_expiry != null
            ? `${p.days_until_expiry} j restants`
            : null,
        urgent: pending && p.days_until_expiry != null && p.days_until_expiry <= 3,
        haystack: normalized([title, talent, other?.name, p.id].join(" ")),
        status: st,
      };
    });

  const sentRows = useMemo(() => proposalRows(sent, "sent"), [sent]);

  const receivedRows = useMemo(
    () => proposalRows(received, "received"),
    [received, requestFilter] // ✅ Dépendance ajoutée
  );

  /* =====================================================
     FILTRES
  ===================================================== */

  const allRows =
    tab === "missions"
      ? missionRows
      : tab === "received"
        ? receivedRows
        : sentRows;

  const stages =
    tab === "missions"
      ? MISSION_STAGES
      : PROPOSAL_STAGES.filter((s) => tab !== "received" || s.id !== "draft");

  const baseRows = useMemo(() => {
    const q = normalized(search.trim());

    return allRows.filter((r) => {
      if (
        tab === "missions" &&
        contractFilter !== "all" &&
        r.type !== contractFilter
      ) {
        return false;
      }

      return !q || r.haystack.includes(q);
    });
  }, [allRows, search, contractFilter, tab]);

  const visibleRows = useMemo(
    () =>
      stage === "all" ? baseRows : baseRows.filter((r) => r.stage === stage),
    [baseRows, stage]
  );

  const countOf = (id) => baseRows.filter((r) => r.stage === id).length;

  const total = baseRows.length;

  const railOf = (r) =>
    STAGE_COLORS[stages.find((s) => s.id === r.stage)?.tone] ||
    "bg-slate-300";

  /* =====================================================
     ELEMENTS A TRAITER (déduits des vraies données)
  ===================================================== */

  const focusItems = useMemo(() => {
    const items = [];

    missionRows.forEach((r) => {
      if (r.flags.isEmployee && r.status === "pending_employee") {
        items.push({
          key: r.key,
          href: r.href,
          kind: "Réponse attendue",
          text: r.title,
          tone: "amber",
        });
      } else if (canStartMission(r.flags, r.status)) {
        items.push({
          key: r.key,
          href: r.href,
          kind: "Prête à démarrer",
          text: r.title,
          tone: "blue",
        });
      }
    });

    receivedRows.forEach((r) => {
      if (r.unread || r.urgent) {
        items.push({
          key: r.key,
          href: r.href,
          kind: r.urgent ? "Expire bientôt" : "Nouvelle",
          text: `${r.name} · ${r.company}`,
          tone: r.urgent ? "rose" : "teal",
        });
      }
    });

    sentRows.forEach((r) => {
      if (r.urgent) {
        items.push({
          key: r.key,
          href: r.href,
          kind: "Expire bientôt",
          text: `${r.name} · ${r.company}`,
          tone: "rose",
        });
      }
    });

    return items;
  }, [missionRows, receivedRows, sentRows]);

  const tabsMeta = [
    {
      id: "missions",
      label: "Mes missions",
      count: missionRows.length,
    },
    ...(isCompany
      ? [
          {
            id: "received",
            label: "Propositions reçues",
            count: receivedRows.length,
            alert: receivedRows.filter((r) => r.unread).length,
          },
          {
            id: "sent",
            label: "Propositions envoyées",
            count: sentRows.length,
          },
        ]
      : []),
  ];

  const resetFilters = () => {
    setSearch("");
    setStage("all");
    setContractFilter("all");
    setRequestFilter("all"); // ✅ Réinitialise le filtre par demande
  };

  const hasFilters =
    search.trim() !== "" || stage !== "all" || contractFilter !== "all" || requestFilter !== "all";

  /* =====================================================
     ACTIONS MISSIONS (masquées pour les étudiants)
  ===================================================== */

  const renderMissionActions = (r) => {
    if (isStudent) return [];

    const { isEmployee, isSupplier, isRequesting } = r.flags;

    const busy = actionLoading === r.id;
    const out = [];

    if (isEmployee && r.status === "pending_employee") {
      out.push(
        <button
          key="accept"
          type="button"
          disabled={busy}
          onClick={() => acceptMission(r.id)}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-teal-50 px-3 text-[11px] font-medium text-teal-600 transition hover:bg-teal-100 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Check size={13} />
          )}
          Accepter
        </button>,

        <button
          key="decline"
          type="button"
          disabled={busy}
          onClick={() => declineMission(r.id)}
          className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Refuser
        </button>
      );
    }

    if (canStartMission(r.flags, r.status)) {
      out.push(
        <button
          key="start"
          type="button"
          disabled={busy}
          onClick={() => updateStatus(r.id, "active")}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-3 text-[11px] font-medium text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Play size={12} />
          )}
          Démarrer
        </button>
      );
    }

    if ((isSupplier || isRequesting) && r.status === "active") {
      out.push(
        <button
          key="finish"
          type="button"
          disabled={busy}
          onClick={() => updateStatus(r.id, "completed")}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Flag size={12} />
          )}
          {r.type === "permanent" ? "Mettre fin" : "Terminer"}
        </button>
      );
    }

    return out;
  };

  const actionsOf = (r) => (tab === "missions" ? renderMissionActions(r) : []);

  /* =====================================================
     LOADING
  ===================================================== */

  if (
    loading &&
    missions.length === 0 &&
    received.length === 0 &&
    sent.length === 0
  ) {
    return (
      <AppShell>
        <main className="min-h-screen bg-[#F5F7FB] px-4 py-7 font-['Plus_Jakarta_Sans',sans-serif] sm:px-7">
          <div className="mx-auto max-w-[1450px] space-y-5">
            <div className="h-16 animate-pulse rounded-xl bg-white" />
            
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-[74px] flex-1 animate-pulse rounded-lg bg-white"
                />
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-xl bg-white"
                />
              ))}
            </div>
          </div>
        </main>
      </AppShell>
    );
  }

  /* =====================================================
     RENDU
  ===================================================== */

  const boardStages = stages.filter(
    (s) =>
      countOf(s.id) > 0 ||
      stage === s.id ||
      !["cancelled", "expired"].includes(s.id)
  );

  const subtitle =
    tab === "missions"
      ? "Missions et contrats en cours"
      : tab === "received"
        ? "Demandes reçues des partenaires"
        : "Demandes adressées aux partenaires";

  return (
    <AppShell>
      <main className="min-h-screen bg-[#F5F7FB] px-3 pb-12 pt-5 font-['Plus_Jakarta_Sans',sans-serif] sm:px-5 sm:pt-7 lg:px-7">
        <style>{`
          @keyframes collabIn {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .collab-scroll::-webkit-scrollbar { height: 4px; }
          .collab-scroll::-webkit-scrollbar-thumb { background: #D7E0EB; border-radius: 20px; }

          .collab-view { animation: collabIn .3s ease both; }

          @media (prefers-reduced-motion: reduce) {
            .collab-view { animation: none; }
          }
        `}</style>

        <div className="mx-auto max-w-[1450px] space-y-4">
          {/* ELEMENTS PRIORITAIRES (Design adouci) */}
          <FocusStrip items={focusItems} />

          {/* ERREUR API */}
          {error && (
            <div
              role="alert"
              className="flex flex-col justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] font-medium text-rose-700 sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-2">
                <CircleDot size={15} />
                {error}
              </div>

              <button
                type="button"
                onClick={() => load()}
                className="self-start rounded-lg border border-rose-200 bg-white px-3 py-2 text-[11px] font-medium hover:bg-rose-100 sm:self-auto"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* PIPELINE = FILTRE PAR ETAPE */}
          <PipelineNav
            stages={stages}
            stage={stage}
            setStage={setStage}
            countOf={countOf}
            total={total}
          />

          {/* BARRE D'OUTILS */}
          <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-2.5 xl:flex-row xl:items-center xl:justify-between">
            <nav
              className="collab-scroll flex min-w-0 items-center gap-1 overflow-x-auto rounded-lg bg-slate-50 p-1"
              aria-label="Sections des collaborations"
            >
              {tabsMeta.map((item) => {
                const active = tab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => changeTab(item.id)}
                    aria-current={active ? "page" : undefined}
                    className={`relative inline-flex shrink-0 items-center gap-2 rounded-md px-3.5 py-1.5 text-[12px] font-medium transition ${
                      active
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:bg-white hover:text-slate-700"
                    }`}
                  >
                    {item.label}

                    <span
                      className={`flex min-w-[20px] items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        active
                          ? "bg-slate-100 text-slate-600"
                          : "bg-slate-200/50 text-slate-400"
                      }`}
                    >
                      {item.count}
                    </span>

                    {item.alert > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#16B8B1]" />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              
              {/* ✅ NOUVEAU : Filtre par demande spécifique */}
              {tab === "received" && myRequests.length > 0 && (
                <div className="relative">
                  <select
                    value={requestFilter}
                    onChange={(e) => setRequestFilter(e.target.value)}
                    aria-label="Filtrer par demande"
                    className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white py-1 pl-3 pr-8 text-[12px] font-medium text-slate-600 outline-none transition hover:border-slate-300 focus:border-slate-300 sm:w-[220px]"
                  >
                    <option value="all">Toutes les demandes</option>
                    {myRequests.map((req) => (
                      <option key={req.id} value={req.id}>
                        {req.title}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={13}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              )}

              <label className="relative block w-full sm:w-[260px] lg:w-[300px]">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  type="search"
                  aria-label="Rechercher une collaboration"
                  placeholder={
                    tab === "missions"
                      ? "Rechercher une mission..."
                      : "Entreprise, ressource, personne..."
                  }
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[12px] font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-100"
                />
              </label>

              {tab === "missions" && (
                <div className="relative">
                  <select
                    value={contractFilter}
                    onChange={(e) => setContractFilter(e.target.value)}
                    aria-label="Type de contrat"
                    className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white py-1 pl-3 pr-8 text-[12px] font-medium text-slate-600 outline-none transition hover:border-slate-300 focus:border-slate-300 sm:w-[185px]"
                  >
                    {CONTRACT_FILTERS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={13}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              )}

              {/* ✅ SÉLECTEUR DE VUE : masqué pour les étudiants */}
              {!isStudent && (
                <div
                  className="flex h-9 items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-1"
                  role="group"
                  aria-label="Mode d'affichage"
                >
                  {[
                    { id: "board", label: "Pipeline", icon: LayoutGrid },
                    { id: "list", label: "Liste", icon: List },
                  ].map((v) => {
                    const Icon = v.icon;
                    const active = view === v.id;

                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setView(v.id)}
                        aria-pressed={active}
                        title={v.label}
                        className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition ${
                          active
                            ? "bg-white text-slate-700 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        <Icon size={13} />
                        <span className="hidden lg:inline">{v.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {hasFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  title="Réinitialiser les filtres"
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-500 transition hover:bg-slate-50"
                >
                  <RotateCcw size={12} />
                  Effacer
                </button>
              )}
            </div>
          </section>

          {/* COMPTEUR + ACTUALISATION */}
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2">
              <Inbox size={14} className="text-slate-400" />
              <span className="text-[12px] font-semibold text-slate-700">
                {visibleRows.length} résultat{visibleRows.length > 1 ? "s" : ""}
              </span>
              <span className="hidden text-[11px] font-medium text-slate-400 sm:inline">
                {subtitle}
              </span>
            </div>

            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              {refreshing ? (
                <Loader2 size={12} className="animate-spin text-[#16B8B1]" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-[#16B8B1]" />
              )}
              {refreshing ? "Actualisation…" : "Synchronisé"}
            </span>
          </div>

          {/* CONTENU */}
          {visibleRows.length === 0 ? (
            <section className="rounded-xl border border-dashed border-slate-200 bg-white px-5 py-14 text-center">
              <div className="relative mx-auto flex h-[68px] w-[68px] items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                <FileSearch size={27} strokeWidth={1.5} />

                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-white">
                  <Search size={10} />
                </span>
              </div>

              <h3 className="mt-5 text-[15px] font-semibold text-slate-700">
                {hasFilters
                  ? "Aucun résultat trouvé"
                  : tab === "missions"
                    ? "Aucune mission pour le moment"
                    : tab === "received"
                      ? "Aucune proposition reçue"
                      : "Aucune proposition envoyée"}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-[12px] leading-6 text-slate-500">
                {hasFilters
                  ? "Aucun élément ne correspond à vos critères. Modifiez votre recherche ou réinitialisez les filtres."
                  : tab === "sent"
                    ? "Explorez les ressources disponibles pour démarrer une collaboration avec une autre entreprise."
                    : "Vos prochaines collaborations apparaîtront ici et vous pourrez suivre leur évolution."}
              </p>

              {hasFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-slate-100 px-4 text-[12px] font-medium text-slate-600 transition hover:bg-slate-200"
                >
                  <RotateCcw size={13} />
                  Réinitialiser
                </button>
              )}
            </section>
          ) : view === "board" && !isStudent ? (
            /* ✅ VUE BOARD : uniquement pour les entreprises */
            <section
              key={`board-${tab}`}
              className="collab-view collab-scroll grid auto-cols-[minmax(272px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-3"
            >
              {boardStages.map((s) => {
                const col = baseRows.filter((r) => r.stage === s.id);
                const dim = stage !== "all" && stage !== s.id;

                return (
                  <div
                    key={s.id}
                    className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-slate-50/50 p-2"
                  >
                    <div className="mb-2 flex items-center justify-between px-2 pt-1">
                      <span className="flex items-center gap-2 text-[12px] font-semibold text-slate-700">
                        <span
                          className={`h-2 w-2 rounded-full ${STAGE_COLORS[s.tone]}`}
                        />
                        {s.label}
                      </span>

                      <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
                        {col.length}
                      </span>
                    </div>

                    <div className="collab-scroll flex-1 space-y-2.5 lg:max-h-[680px] lg:overflow-y-auto lg:pr-0.5">
                      {col.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-200 px-3 py-8 text-center text-[11px] font-medium text-slate-400">
                          Aucun élément
                        </div>
                      ) : (
                        col.map((r) => (
                          <CollabCard
                            key={r.key}
                            r={r}
                            actions={actionsOf(r)}
                            rail={railOf(r)}
                            dim={dim}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          ) : (
            /* ✅ VUE LISTE : par défaut pour les étudiants */
            <section key={`list-${tab}`} className="collab-view">
              <ul className="space-y-2.5">
                {visibleRows.map((r) => (
                  <CollabRow
                    key={r.key}
                    r={r}
                    actions={actionsOf(r)}
                    rail={railOf(r)}
                  />
                ))}
              </ul>

              <div className="mt-3 px-1 text-[11px] font-medium text-slate-400">
                Affichage de {visibleRows.length} élément
                {visibleRows.length > 1 ? "s" : ""}
                {hasFilters ? " après filtrage" : ""}
              </div>
            </section>
          )}

          {/* FOOTER */}
          <footer className="flex flex-col items-center justify-between gap-2 py-3 text-center sm:flex-row sm:text-left">
            <p className="text-[11px] font-medium text-slate-400">
              © {new Date().getFullYear()} TalentShare · Ensemble, créons des
              opportunités.
            </p>

            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[#16B8B1]" />
              Espace collaboratif opérationnel
            </div>
          </footer>
        </div>
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </AppShell>
  );
}