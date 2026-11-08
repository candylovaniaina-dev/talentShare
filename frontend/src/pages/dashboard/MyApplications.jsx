import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock, Eye, Check, X, Loader2, FileText, Building2, UserCheck, Video,
  Plus, RefreshCw, Search, CalendarDays, ArrowUpRight, Inbox, FolderOpen,
  MapPin, ChevronRight, Calendar,
} from "lucide-react";

import AppShell from "../../components/layout/AppShell";
import api from "../../services/api";

/* ============================================
   Configuration
============================================ */
const ORDER = ["sent", "viewed", "shortlisted", "interview", "accepted", "rejected"];
const STEPS = ["sent", "viewed", "shortlisted", "interview", "accepted"];

const STATUS = {
  sent: {
    label: "Envoyée", plural: "Envoyées", icon: Clock, step: 1,
    dot: "bg-slate-400", bar: "bg-slate-300 dark:bg-slate-500",
    pill: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  },
  viewed: {
    label: "Consultée", plural: "Consultées", icon: Eye, step: 2,
    dot: "bg-sky-500", bar: "bg-sky-400",
    pill: "bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:ring-sky-900",
  },
  shortlisted: {
    label: "Présélectionnée", plural: "Présélectionnées", icon: UserCheck, step: 3,
    dot: "bg-violet-500", bar: "bg-violet-400",
    pill: "bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:ring-violet-900",
  },
  interview: {
    label: "Entretien", plural: "Entretiens", icon: Video, step: 4,
    dot: "bg-amber-500", bar: "bg-amber-400",
    pill: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-900",
  },
  accepted: {
    label: "Acceptée", plural: "Acceptées", icon: Check, step: 5,
    dot: "bg-emerald-500", bar: "bg-emerald-400",
    pill: "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900",
  },
  rejected: {
    label: "Refusée", plural: "Refusées", icon: X, step: 0,
    dot: "bg-rose-500", bar: "bg-rose-400",
    pill: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:ring-rose-900",
  },
};

const FILTERS = [{ key: "all", label: "Toutes" }, ...ORDER.map((k) => ({ key: k, label: STATUS[k].plural }))];

const surface =
  "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700/70 dark:bg-slate-900";

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:focus-visible:ring-teal-400";

const TONES = [
  "from-teal-500 to-emerald-600",
  "from-sky-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-slate-600 to-slate-800",
];
const toneOf = (s = "") => TONES[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];

/* ============================================
   Utilitaires
============================================ */
const toDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDate = (v) => {
  const d = toDate(v);
  if (!d) return "Date inconnue";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
};

const fmtInterview = (v) => {
  const d = toDate(v);
  if (!d) return "";
  const day = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${day} à ${time}`;
};

const getInitials = (name) =>
  (name || "?").trim().split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();

const getCompanyName = (a) => a?.job_offer?.company?.name || a?.job_offer?.company_name || "";
const getOfferTitle = (a) => a?.job_offer?.title || "Offre supprimée";
const getPortfolioSlug = (p) => p?.public_slug || p?.slug || p?.profile_data?.public_slug || "";

/*
 * Convertit un chemin de fichier en URL.
 * Les URL absolues sont conservées, les chemins relatifs sont résolus
 * à partir de la base de l'API.
 */
function getDocumentUrl(path) {
  if (!path || typeof path !== "string") return "";
  const value = path.trim();
  if (!value) return "";
  if (/^(https?:|blob:|data:)/i.test(value)) return value;

  const base = api.defaults?.baseURL || window.location.origin;
  const cleanBase = base.replace(/\/+$/, "").replace(/\/api\/?$/i, "");
  const cleanPath = value.replace(/^\/+/, "");

  return cleanPath.startsWith("storage/")
    ? `${cleanBase}/${cleanPath}`
    : `${cleanBase}/storage/${cleanPath}`;
}

/* ============================================
   Composants
============================================ */
function StatusPill({ status }) {
  const cfg = STATUS[status] || STATUS.sent;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${cfg.pill}`}>
      <Icon size={12} /> {cfg.label}
    </span>
  );
}

function Stat({ label, value, accent = "" }) {
  return (
    <div>
      <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className={`mt-1 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white ${accent}`}>{value}</dd>
    </div>
  );
}

function FunnelBar({ counts, total }) {
  return (
    <div className="mt-3">
      <div className="flex h-3 w-full gap-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" aria-hidden="true">
        {total > 0 &&
          ORDER.filter((s) => counts[s] > 0).map((s) => (
            <span
              key={s}
              className={`${STATUS[s].bar} transition-all duration-500 first:rounded-l-full last:rounded-r-full`}
              style={{ flexGrow: counts[s], flexBasis: 0 }}
            />
          ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
        {ORDER.map((s) => (
          <li key={s} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${STATUS[s].dot}`} />
            {STATUS[s].plural}
            <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">{counts[s]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Suivi par étapes : l'élément signature de la page */
function Tracker({ status }) {
  const rejected = status === "rejected";
  const current = STATUS[status]?.step || 1;

  if (rejected) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900">
        <X size={15} className="shrink-0" />
        Cette entreprise n’a pas retenu votre candidature.
      </div>
    );
  }

  return (
    <ol className="flex" aria-label={`Étape actuelle : ${STATUS[status]?.label || "Envoyée"}`}>
      {STEPS.map((s, i) => {
        const st = STATUS[s];
        const done = st.step <= current;
        const isCurrent = s === status;
        const Icon = st.icon;
        return (
          <li key={s} className="min-w-0 flex-1">
            <div className="flex items-center">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${
                  done ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                } ${isCurrent ? "ring-4 ring-teal-500/20" : ""}`}
              >
                <Icon size={13} />
              </span>
              {i < STEPS.length - 1 && (
                <span
                  className={`mx-1 h-0.5 flex-1 rounded ${
                    st.step < current ? "bg-teal-500" : "bg-slate-200 dark:bg-slate-700"
                  }`}
                />
              )}
            </div>
            <p
              className={`mt-1.5 hidden truncate pr-1 text-[11px] sm:block ${
                isCurrent ? "font-semibold text-slate-900 dark:text-white" : "text-slate-400"
              }`}
            >
              {st.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function DocLink({ href, icon: Icon, children, external = true }) {
  const cls = `inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition hover:text-teal-800 hover:ring-teal-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:text-teal-300 ${focusRing}`;
  const content = (
    <>
      <Icon size={13} /> {children} <ArrowUpRight size={11} className="text-slate-400" />
    </>
  );

  if (!external) {
    return <Link to={href} onClick={(e) => e.stopPropagation()} className={cls}>{content}</Link>;
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className={cls}>
      {content}
    </a>
  );
}

function ApplicationCard({ application }) {
  const company = getCompanyName(application);
  const title = getOfferTitle(application);
  const offer = application?.job_offer || {};
  const portfolio = application?.portfolio;
  const slug = getPortfolioSlug(portfolio);
  const cvUrl = getDocumentUrl(
    application?.cv_url || application?.cv_path || application?.cv?.url || application?.cv?.path || ""
  );
  const interview = application.status === "interview" ? toDate(application.interview_at) : null;

  return (
    <article className={`${surface} p-5 transition hover:border-teal-300 hover:shadow-md dark:hover:border-teal-700 sm:p-6`}>
      <div className="flex items-start gap-4">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${toneOf(company || title)} text-sm font-semibold text-white`}
          aria-hidden="true"
        >
          {getInitials(company || title)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">
              <Link
                to={`/applications/${application.id}`}
                className={`break-words rounded text-base font-semibold text-slate-900 transition hover:text-teal-700 dark:text-slate-100 dark:hover:text-teal-300 sm:text-lg ${focusRing}`}
              >
                {title}
              </Link>
              <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                {company && (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 size={14} className="text-slate-400" /> {company}
                  </span>
                )}
                {offer.city && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} className="text-slate-400" /> {offer.city}
                  </span>
                )}
                {offer.employment_type && <span>{offer.employment_type}</span>}
              </p>
            </div>

            <div className="flex flex-col items-start gap-1 sm:items-end">
              <StatusPill status={application.status} />
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                <CalendarDays size={12} /> Envoyée le {formatDate(application.created_at)}
              </span>
            </div>
          </div>

          <div className="mt-5">
            <Tracker status={application.status} />
          </div>

          {interview && (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-100 dark:bg-amber-950/40 dark:ring-amber-900">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm dark:bg-slate-800 dark:text-amber-400">
                <Calendar size={16} />
              </span>
              <p className="text-sm capitalize text-amber-900 dark:text-amber-200">
                Entretien le <strong className="font-semibold">{fmtInterview(application.interview_at)}</strong>
              </p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            {portfolio &&
              (slug ? (
                <DocLink href={`/portfolio/${encodeURIComponent(slug)}`} icon={FolderOpen} external={false}>
                  Portfolio
                </DocLink>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500 ring-1 ring-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
                  <FolderOpen size={13} /> Portfolio joint
                </span>
              ))}

            {cvUrl ? (
              <DocLink href={cvUrl} icon={FileText}>CV</DocLink>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-400 ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700">
                <FileText size={13} /> CV non disponible
              </span>
            )}

            <Link
              to={`/applications/${application.id}`}
              className={`ml-auto inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-slate-700 dark:bg-teal-600 dark:hover:bg-teal-500 ${focusRing}`}
            >
              Voir le détail <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ filter, search }) {
  const hasSearch = search.trim().length > 0;
  const byStatus = filter !== "all";

  let title = "Vous n’avez pas encore postulé";
  let text = "Parcourez les offres disponibles et envoyez votre première candidature.";
  if (hasSearch) {
    title = "Aucun résultat";
    text = "Essayez un autre mot-clé ou vérifiez l’orthographe.";
  } else if (byStatus) {
    title = "Aucune candidature dans cette catégorie";
    text = "Les candidatures qui ont ce statut apparaîtront ici.";
  }

  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/60">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 ring-8 ring-teal-50/50 dark:bg-teal-950/50 dark:text-teal-300 dark:ring-teal-950/30">
        {hasSearch ? <Search size={24} /> : <Inbox size={24} />}
      </span>
      <h3 className="mt-5 text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">{text}</p>
      {!hasSearch && !byStatus && (
        <Link
          to="/opportunites"
          className={`mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 ${focusRing}`}
        >
          <Plus size={16} /> Explorer les offres
        </Link>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-5 py-2" aria-busy="true">
        <div className="h-16 w-72 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900" />
        <div className="h-11 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900" />
        ))}
        <div className="flex items-center justify-center gap-2 py-3 text-sm text-slate-400">
          <Loader2 size={17} className="animate-spin" /> Chargement de vos candidatures…
        </div>
      </div>
    </AppShell>
  );
}

/* ============================================
   Page
============================================ */
export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const [appsRes, statsRes] = await Promise.all([
        api.get("/applications"),
        api.get("/applications/stats"),
      ]);

      const appData = appsRes?.data;
      setApplications(
        Array.isArray(appData) ? appData : Array.isArray(appData?.data) ? appData.data : []
      );
      setStats(statsRes?.data || null);
    } catch (err) {
      console.error("Erreur lors du chargement des candidatures :", err);
      setError(
        err?.response?.data?.message ||
          "Impossible de charger les candidatures. Vérifiez votre connexion et réessayez."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const local = useMemo(() => {
    const result = { total: applications.length };
    ORDER.forEach((s) => (result[s] = applications.filter((a) => a.status === s).length));
    return result;
  }, [applications]);

  // Les chiffres de l'API priment (la liste peut être paginée)
  const counts = useMemo(() => {
    const result = { total: stats?.total ?? local.total };
    ORDER.forEach((s) => (result[s] = stats?.[s] ?? local[s] ?? 0));
    result.waiting = result.sent + result.viewed;
    result.progress = result.shortlisted + result.interview;
    result.rate = result.total ? Math.round((result.accepted / result.total) * 100) : 0;
    return result;
  }, [stats, local]);

  const nextInterview = useMemo(() => {
    const now = Date.now();
    return applications
      .filter((a) => a.status === "interview" && toDate(a.interview_at) && toDate(a.interview_at).getTime() >= now)
      .sort((a, b) => toDate(a.interview_at) - toDate(b.interview_at))[0];
  }, [applications]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications.filter((a) => {
      const matchesStatus = filter === "all" || a.status === filter;
      const haystack = [
        getOfferTitle(a), getCompanyName(a), a?.job_offer?.city || "", a?.job_offer?.employment_type || "",
      ].join(" ").toLowerCase();
      return matchesStatus && (!q || haystack.includes(q));
    });
  }, [applications, filter, search]);

  if (loading) return <LoadingState />;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-5 py-2">
        {/* ============ EN-TÊTE ============ */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Mes candidatures
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Suivez chaque candidature, de l’envoi à la décision de l’entreprise.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => load(true)}
              disabled={refreshing}
              aria-label="Actualiser les candidatures"
              className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-teal-300 hover:text-teal-800 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-teal-300 ${focusRing}`}
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Actualiser
            </button>
            <Link
              to="/opportunites"
              className={`inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 ${focusRing}`}
            >
              <Plus size={16} /> Explorer les offres
            </Link>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/40 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-300">
                <X size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">Le chargement a échoué</p>
                <p className="mt-0.5 text-sm text-rose-700 dark:text-rose-300">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => load(true)}
              disabled={refreshing}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Réessayer
            </button>
          </div>
        )}

        {/* ============ PROCHAIN ENTRETIEN ============ */}
        {nextInterview && (
          <Link
            to={`/applications/${nextInterview.id}`}
            className={`flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 transition hover:shadow-md dark:border-amber-900 dark:bg-amber-950/30 sm:p-5 ${focusRing}`}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm dark:bg-slate-900 dark:text-amber-400">
              <Video size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Votre prochain entretien</p>
              <p className="mt-0.5 truncate text-sm capitalize text-amber-800 dark:text-amber-300">
                {fmtInterview(nextInterview.interview_at)}
              </p>
              <p className="truncate text-xs text-amber-700/80 dark:text-amber-300/70">
                {getOfferTitle(nextInterview)}
                {getCompanyName(nextInterview) ? `, ${getCompanyName(nextInterview)}` : ""}
              </p>
            </div>
            <ChevronRight size={20} className="shrink-0 text-amber-500" />
          </Link>
        )}

        {/* ============ VUE D'ENSEMBLE ============ */}
        <section className={`${surface} p-5 sm:p-6`}>
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Où en sont vos candidatures</p>
              <FunnelBar counts={counts} total={counts.total} />
            </div>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4 lg:min-w-[480px]">
              <Stat label="Candidatures" value={counts.total} />
              <Stat label="En attente" value={counts.waiting} />
              <Stat label="En cours" value={counts.progress} />
              <Stat label="Acceptées" value={counts.accepted} accent={counts.accepted > 0 ? "!text-teal-700 dark:!text-teal-300" : ""} />
            </dl>
          </div>
        </section>

        {/* ============ FILTRES ============ */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filtrer par statut">
            {FILTERS.map((item) => {
              const count = item.key === "all" ? counts.total : counts[item.key] || 0;
              const active = filter === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(item.key)}
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition ${focusRing} ${
                    active
                      ? "bg-slate-900 text-white shadow-sm dark:bg-teal-600"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-900 hover:ring-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:text-white"
                  }`}
                >
                  {item.label}
                  <span
                    className={`rounded-full px-1.5 text-xs tabular-nums ${
                      active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <label className="relative block w-full lg:w-72">
            <span className="sr-only">Rechercher une candidature</span>
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une offre ou une entreprise"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
        </div>

        {(filter !== "all" || search) && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-white">{filtered.length}</span> résultat(s)
            </p>
            <button
              type="button"
              onClick={() => {
                setFilter("all");
                setSearch("");
              }}
              className="text-xs font-medium text-teal-700 transition hover:text-teal-900 dark:text-teal-400"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {/* ============ LISTE ============ */}
        {filtered.length === 0 ? (
          <EmptyState filter={filter} search={search} />
        ) : (
          <div className="space-y-3">
            {filtered.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}