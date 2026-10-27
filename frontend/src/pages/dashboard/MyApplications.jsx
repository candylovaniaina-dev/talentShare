
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase, Clock, Eye, Check, X, Loader2, FileText, Building2,
  UserCheck, Video, ChevronRight, Plus, RefreshCw, Search,
  SlidersHorizontal, CalendarDays, ArrowUpRight, Inbox, FolderOpen,
  FileCheck2, Download
} from "lucide-react";

import AppShell from "../../components/layout/AppShell";
import api from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

const STATUS_CFG = {
  sent: {
    label: "Envoyée", icon: Clock,
    color: "text-slate-600 dark:text-slate-300",
    bg: "bg-slate-100 dark:bg-slate-800",
    border: "border-slate-200 dark:border-slate-700",
  },
  viewed: {
    label: "Consultée", icon: Eye,
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-50 dark:bg-blue-950/50",
    border: "border-blue-200 dark:border-blue-800",
  },
  shortlisted: {
    label: "Présélectionnée", icon: UserCheck,
    color: "text-violet-700 dark:text-violet-300",
    bg: "bg-violet-50 dark:bg-violet-950/50",
    border: "border-violet-200 dark:border-violet-800",
  },
  interview: {
    label: "Entretien", icon: Video,
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    border: "border-amber-200 dark:border-amber-800",
  },
  accepted: {
    label: "Acceptée", icon: Check,
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  rejected: {
    label: "Refusée", icon: X,
    color: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-50 dark:bg-rose-950/50",
    border: "border-rose-200 dark:border-rose-800",
  },
};

const FILTERS = [
  { key: "all", label: "Toutes" },
  { key: "sent", label: "Envoyées" },
  { key: "viewed", label: "Consultées" },
  { key: "shortlisted", label: "Présélectionnées" },
  { key: "interview", label: "Entretiens" },
  { key: "accepted", label: "Acceptées" },
  { key: "rejected", label: "Refusées" },
];

const STAT_ITEMS = [
  { key: "total", label: "Total", icon: FileText, color: "text-[#0B1F33] dark:text-white", iconBg: "bg-slate-100 dark:bg-slate-800", iconColor: "text-slate-600 dark:text-slate-300" },
  { key: "sent", label: "Envoyées", icon: Clock, color: "text-slate-700 dark:text-slate-200", iconBg: "bg-slate-100 dark:bg-slate-800", iconColor: "text-slate-600 dark:text-slate-300" },
  { key: "viewed", label: "Consultées", icon: Eye, color: "text-blue-700 dark:text-blue-300", iconBg: "bg-blue-50 dark:bg-blue-950/50", iconColor: "text-blue-600 dark:text-blue-300" },
  { key: "shortlisted", label: "Présélectionnées", icon: UserCheck, color: "text-violet-700 dark:text-violet-300", iconBg: "bg-violet-50 dark:bg-violet-950/50", iconColor: "text-violet-600 dark:text-violet-300" },
  { key: "interview", label: "Entretiens", icon: Video, color: "text-amber-700 dark:text-amber-300", iconBg: "bg-amber-50 dark:bg-amber-950/50", iconColor: "text-amber-600 dark:text-amber-300" },
  { key: "accepted", label: "Acceptées", icon: Check, color: "text-emerald-700 dark:text-emerald-300", iconBg: "bg-emerald-50 dark:bg-emerald-950/50", iconColor: "text-emerald-600 dark:text-emerald-300" },
];

function formatDate(date) {
  if (!date) return "Date inconnue";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Date inconnue";
  return parsed.toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function getCompanyName(application) {
  return application?.job_offer?.company?.name ||
    application?.job_offer?.company_name || "";
}

function getOfferTitle(application) {
  return application?.job_offer?.title || "Offre supprimée";
}

function getPortfolioSlug(portfolio) {
  return portfolio?.public_slug ||
    portfolio?.slug ||
    portfolio?.profile_data?.public_slug ||
    "";
}

/*
 * Convertit un chemin de fichier en URL.
 * Les URL absolues sont conservées.
 * Les chemins relatifs sont résolus à partir de la base API.
 */
function getDocumentUrl(path) {
  if (!path || typeof path !== "string") return "";

  const value = path.trim();
  if (!value) return "";

  if (/^(https?:|blob:|data:)/i.test(value)) return value;

  const base = api.defaults?.baseURL || window.location.origin;
  const cleanBase = base.replace(/\/+$/, "").replace(/\/api\/?$/i, "");
  const cleanPath = value.replace(/^\/+/, "");

  if (cleanPath.startsWith("storage/")) {
    return `${cleanBase}/${cleanPath}`;
  }

  return `${cleanBase}/storage/${cleanPath}`;
}

function StatCard({ item, value }) {
  const Icon = item.icon;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.iconBg} ${item.iconColor}`}>
          <Icon size={17} />
        </div>
        <span className={`text-2xl font-bold tracking-tight ${item.color}`}>
          {Number(value || 0).toLocaleString("fr-FR")}
        </span>
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
        {item.label}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = STATUS_CFG[status] || STATUS_CFG.sent;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${config.bg} ${config.color} ${config.border}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
}

function DocumentLink({ href, icon: Icon, label, tone = "emerald", download = false }) {
  if (!href) return null;

  const styles = tone === "violet"
    ? "bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-950/70"
    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      download={download || undefined}
      onClick={(event) => event.stopPropagation()}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${styles}`}
    >
      <Icon size={14} />
      {label}
      {download ? <Download size={12} /> : <ArrowUpRight size={12} />}
    </a>
  );
}

function ApplicationCard({ application }) {
  const companyName = getCompanyName(application);
  const offerTitle = getOfferTitle(application);
  const portfolio = application?.portfolio;
  const portfolioSlug = getPortfolioSlug(portfolio);

  const cvPath =
    application?.cv_url ||
    application?.cv_path ||
    application?.cv?.url ||
    application?.cv?.path ||
    "";

  const cvUrl = getDocumentUrl(cvPath);

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-200 hover:border-emerald-300 hover:shadow-md sm:p-5 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-700">
      <div className="flex items-start gap-4">
        <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0B1F33] text-emerald-300 sm:flex">
          <Briefcase size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={application.status} />
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
              <CalendarDays size={12} />
              {formatDate(application.created_at)}
            </span>
          </div>

          <Link
            to={`/applications/${application.id}`}
            className="break-words text-base font-bold text-[#0B1F33] transition hover:text-emerald-700 sm:text-lg dark:text-slate-100 dark:hover:text-emerald-400"
          >
            {offerTitle}
          </Link>

          {companyName && (
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
              <Building2 size={14} className="shrink-0 text-slate-400" />
              <span>{companyName}</span>
              {application?.job_offer?.city && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span>{application.job_offer.city}</span>
                </>
              )}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {application?.job_offer?.employment_type && (
              <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                {application.job_offer.employment_type}
              </span>
            )}

            {portfolio && (
              portfolioSlug ? (
                <Link
                  to={`/portfolio/${encodeURIComponent(portfolioSlug)}`}
                  onClick={(event) => event.stopPropagation()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-950/70"
                >
                  <FolderOpen size={14} />
                  Voir le portfolio
                  <ArrowUpRight size={12} />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-medium text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                  <FolderOpen size={14} />
                  Portfolio joint
                </span>
              )
            )}

            {cvUrl ? (
              <DocumentLink href={cvUrl} icon={FileCheck2} label="Voir le CV" />
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <FileCheck2 size={14} />
                CV non disponible
              </span>
            )}
          </div>
        </div>

        <Link
          to={`/applications/${application.id}`}
          aria-label={`Consulter la candidature : ${offerTitle}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600 dark:text-slate-500 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400"
        >
          <ChevronRight size={20} />
        </Link>
      </div>
    </article>
  );
}

function EmptyState({ filter, search }) {
  const hasSearch = search.trim().length > 0;
  const filteredByStatus = filter !== "all";

  let title = "Aucune candidature pour le moment";
  let description = "Découvre les opportunités disponibles et envoie ta première candidature.";

  if (hasSearch) {
    title = "Aucun résultat trouvé";
    description = "Essaie avec un autre mot-clé ou vérifie l'orthographe de ta recherche.";
  } else if (filteredByStatus) {
    title = "Aucune candidature dans cette catégorie";
    description = "Tes candidatures correspondant à ce statut apparaîtront ici.";
  }

  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-12 text-center dark:border-slate-700 dark:bg-slate-900 sm:px-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
        {hasSearch ? <Search size={28} /> : <Inbox size={28} />}
      </div>
      <h3 className="mt-5 text-lg font-bold text-[#0B1F33] dark:text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
      {!hasSearch && !filteredByStatus && (
        <Link to="/opportunites" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-[#0B1F33] transition hover:bg-emerald-300">
          <Plus size={17} /> Voir les opportunités <ArrowUpRight size={15} />
        </Link>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <AppShell>
      <main className="min-h-screen bg-[#F5F8FA] px-4 py-8 dark:bg-[#071521] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-40 rounded-3xl bg-[#0B1F33]" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {STAT_ITEMS.map((item) => <div key={item.key} className="h-28 rounded-2xl bg-white dark:bg-slate-900" />)}
          </div>
          <div className="h-16 rounded-2xl bg-white dark:bg-slate-900" />
          {[1, 2, 3].map((item) => <div key={item} className="h-36 rounded-2xl bg-white dark:bg-slate-900" />)}
          <div className="flex items-center justify-center gap-2 py-3 text-sm text-slate-400">
            <Loader2 size={17} className="animate-spin" /> Chargement de tes candidatures...
          </div>
        </div>
      </main>
    </AppShell>
  );
}

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { theme } = useTheme();
  const isDark = theme === "dark";

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
      const statsData = statsRes?.data;

      setApplications(
        Array.isArray(appData) ? appData :
        Array.isArray(appData?.data) ? appData.data : []
      );
      setStats(statsData || null);
    } catch (err) {
      console.error("Erreur lors du chargement des candidatures :", err);
      setError(err?.response?.data?.message ||
        "Impossible de charger les candidatures. Vérifie ta connexion et réessaie.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus = filter === "all" || application.status === filter;
      const searchable = [
        getOfferTitle(application),
        getCompanyName(application),
        application?.job_offer?.city || "",
        application?.job_offer?.employment_type || "",
      ].join(" ").toLowerCase();

      return matchesStatus && (!query || searchable.includes(query));
    });
  }, [applications, filter, search]);

  const counts = useMemo(() => applications.reduce((result, application) => {
    result.total += 1;
    if (Object.prototype.hasOwnProperty.call(result, application.status)) {
      result[application.status] += 1;
    }
    return result;
  }, {
    total: 0, sent: 0, viewed: 0, shortlisted: 0,
    interview: 0, accepted: 0, rejected: 0,
  }), [applications]);

  if (loading) return <LoadingState />;

  return (
    <AppShell>
      <main className={`min-h-screen px-4 py-6 transition-colors duration-300 sm:px-6 sm:py-8 lg:px-8 ${isDark ? "bg-[#071521] text-slate-100" : "bg-[#F5F8FA] text-slate-800"}`}>
        <div className="mx-auto max-w-6xl space-y-6">
          <section className="relative overflow-hidden rounded-3xl bg-[#0B1F33] p-6 text-white shadow-lg sm:p-8 lg:p-9">
            <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl" />

            <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-emerald-300">
                  <FileText size={14} /> Espace candidat
                </div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">Mes candidatures</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                  Suis l'évolution de tes candidatures et retrouve toutes tes opportunités au même endroit.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    {applications.length} candidature(s)
                  </span>
                  <span className="text-slate-600">·</span>
                  <span>{counts.accepted} candidature(s) acceptée(s)</span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <button type="button" onClick={() => load(true)} disabled={refreshing} aria-label="Actualiser les candidatures" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60">
                  <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                  <span className="hidden sm:inline">Actualiser</span>
                </button>
                <Link to="/opportunites" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-bold text-[#07172A] transition hover:bg-emerald-300">
                  <Plus size={17} /> Explorer
                </Link>
              </div>
            </div>
          </section>

          {error && (
            <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/40 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-300"><X size={18} /></div>
                <div>
                  <p className="text-sm font-bold text-rose-800 dark:text-rose-200">Une erreur est survenue</p>
                  <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">{error}</p>
                </div>
              </div>
              <button type="button" onClick={() => load(true)} disabled={refreshing} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300">
                <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Réessayer
              </button>
            </div>
          )}

          <section>
            <div className="mb-3">
              <h2 className="text-base font-bold text-[#0B1F33] dark:text-white">Vue d'ensemble</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Résumé de tes candidatures</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {STAT_ITEMS.map((item) => (
                <StatCard key={item.key} item={item} value={stats?.[item.key] ?? counts[item.key] ?? 0} />
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-lg font-bold text-[#0B1F33] dark:text-white">Toutes mes candidatures</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Consulte chaque dossier et ouvre directement les documents joints.</p>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une offre..." aria-label="Rechercher une candidature" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-[#0B1F33] outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-600" />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <SlidersHorizontal size={14} /> Filtrer par statut
              </div>
              <div className="flex flex-wrap gap-2">
                {FILTERS.map((item) => {
                  const count = item.key === "all" ? applications.length : counts[item.key] || 0;
                  const active = filter === item.key;

                  return (
                    <button key={item.key} type="button" onClick={() => setFilter(item.key)} aria-pressed={active} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition sm:text-sm ${active ? "border-[#0B1F33] bg-[#0B1F33] text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-[#071521]" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"}`}>
                      {item.label}
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-white/15 text-white dark:bg-black/10 dark:text-[#071521]" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                <span className="font-bold text-[#0B1F33] dark:text-white">{filtered.length}</span> résultat(s)
              </p>
              {(filter !== "all" || search) && (
                <button type="button" onClick={() => { setFilter("all"); setSearch(""); }} className="text-xs font-semibold text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-400">
                  Réinitialiser les filtres
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <EmptyState filter={filter} search={search} />
            ) : (
              <div className="space-y-3">
                {filtered.map((application) => (
                  <ApplicationCard key={application.id} application={application} />
                ))}
              </div>
            )}
          </section>

          {applications.length > 0 && (
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"><Eye size={17} /></div>
              <div>
                <p className="text-sm font-semibold text-[#0B1F33] dark:text-slate-100">Garde un œil sur tes candidatures</p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Le statut affiché correspond aux informations disponibles dans ton espace. Ouvre une candidature pour consulter ses détails.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
