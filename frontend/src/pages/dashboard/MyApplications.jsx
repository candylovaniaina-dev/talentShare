import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Clock,
  Eye,
  Check,
  X,
  Loader2,
  FileText,
  Building2,
  UserCheck,
  Video,
  ChevronRight,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  CalendarDays,
  ArrowUpRight,
  Inbox,
} from "lucide-react";

import AppShell from "../../components/layout/AppShell";
import api from "../../services/api";

const STATUS_CFG = {
  sent: {
    label: "Envoyée",
    icon: Clock,
    color: "text-slate-600",
    bg: "bg-slate-100",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  viewed: {
    label: "Consultée",
    icon: Eye,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  shortlisted: {
    label: "Présélectionnée",
    icon: UserCheck,
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
    dot: "bg-violet-500",
  },
  interview: {
    label: "Entretien",
    icon: Video,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  accepted: {
    label: "Acceptée",
    icon: Check,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Refusée",
    icon: X,
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    dot: "bg-rose-500",
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
  {
    key: "total",
    label: "Total",
    color: "text-[#0A1229]",
    icon: FileText,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
  },
  {
    key: "sent",
    label: "Envoyées",
    color: "text-slate-700",
    icon: Clock,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
  },
  {
    key: "viewed",
    label: "Consultées",
    color: "text-blue-700",
    icon: Eye,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    key: "shortlisted",
    label: "Présélectionnées",
    color: "text-violet-700",
    icon: UserCheck,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    key: "interview",
    label: "Entretiens",
    color: "text-amber-700",
    icon: Video,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    key: "accepted",
    label: "Acceptées",
    color: "text-emerald-700",
    icon: Check,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
];

function formatDate(date) {
  if (!date) return "Date inconnue";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date inconnue";
  }

  return parsedDate.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getCompanyName(application) {
  return (
    application?.job_offer?.company?.name ||
    application?.job_offer?.company_name ||
    ""
  );
}

function getOfferTitle(application) {
  return application?.job_offer?.title || "Offre supprimée";
}

function StatCard({ item, value }) {
  const Icon = item.icon;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.iconBg} ${item.iconColor}`}
        >
          <Icon size={17} />
        </div>

        <span className={`text-2xl font-bold tracking-tight ${item.color}`}>
          {Number(value || 0).toLocaleString("fr-FR")}
        </span>
      </div>

      <p className="mt-3 text-xs font-semibold text-slate-500">
        {item.label}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = STATUS_CFG[status] || STATUS_CFG.sent;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${config.bg} ${config.color} ${config.border}`}
    >
      <Icon size={12} />
      {config.label}
    </span>
  );
}

function ApplicationCard({ application }) {
  const companyName = getCompanyName(application);
  const offerTitle = getOfferTitle(application);
  const city = application?.job_offer?.city;
  const jobType = application?.job_offer?.employment_type;
  const createdAt = formatDate(application?.created_at);

  return (
    <Link
      to={`/applications/${application.id}`}
      className="group block rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md sm:p-5"
    >
      <div className="flex items-start gap-4">
        <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0A1229] text-emerald-300 sm:flex">
          <Briefcase size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={application.status} />

            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <CalendarDays size={12} />
              {createdAt}
            </span>
          </div>

          <h3 className="break-words text-base font-bold text-[#0A1229] transition group-hover:text-emerald-700 sm:text-lg">
            {offerTitle}
          </h3>

          {companyName && (
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
              <Building2 size={14} className="shrink-0 text-slate-400" />
              <span>{companyName}</span>

              {city && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>{city}</span>
                </>
              )}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            {jobType && (
              <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
                {jobType}
              </span>
            )}

            {application.portfolio && (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <Briefcase size={13} />
                Portfolio joint
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <FileText size={13} />
              CV joint
            </span>
          </div>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-300 transition group-hover:bg-emerald-50 group-hover:text-emerald-600">
          <ChevronRight size={20} />
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ filter, search }) {
  const hasSearch = search.trim().length > 0;
  const filteredByStatus = filter !== "all";

  let title = "Aucune candidature pour le moment";
  let description =
    "Découvre les opportunités disponibles et envoie ta première candidature.";

  if (hasSearch) {
    title = "Aucun résultat trouvé";
    description =
      "Essaie avec un autre mot-clé ou vérifie l'orthographe de ta recherche.";
  } else if (filteredByStatus) {
    title = "Aucune candidature dans cette catégorie";
    description =
      "Tes candidatures correspondant à ce statut apparaîtront ici.";
  }

  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-12 text-center sm:px-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
        {hasSearch ? <Search size={28} /> : <Inbox size={28} />}
      </div>

      <h3 className="mt-5 text-lg font-bold text-[#0A1229]">{title}</h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>

      {!hasSearch && !filteredByStatus && (
        <Link
          to="/opportunites"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-300"
        >
          <Plus size={17} />
          Voir les opportunités
          <ArrowUpRight size={15} />
        </Link>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <AppShell>
      <main className="min-h-screen bg-[#F5F7FB] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-40 rounded-3xl bg-[#0A1229]" />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {STAT_ITEMS.map((item) => (
              <div
                key={item.key}
                className="h-28 rounded-2xl border border-slate-100 bg-white"
              />
            ))}
          </div>

          <div className="h-16 rounded-2xl bg-white" />

          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-36 rounded-2xl border border-slate-100 bg-white"
              />
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 py-3 text-sm text-slate-400">
            <Loader2 size={17} className="animate-spin" />
            Chargement de tes candidatures...
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

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [appsRes, statsRes] = await Promise.all([
        api.get("/applications"),
        api.get("/applications/stats"),
      ]);

      const appData = appsRes?.data;
      const statsData = statsRes?.data;

      setApplications(
        Array.isArray(appData)
          ? appData
          : Array.isArray(appData?.data)
            ? appData.data
            : []
      );

      setStats(statsData || null);
    } catch (err) {
      console.error("Erreur lors du chargement des candidatures :", err);
      setError(
        err?.response?.data?.message ||
          "Impossible de charger les candidatures. Vérifie ta connexion et réessaie."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus =
        filter === "all" || application.status === filter;

      const searchableText = [
        getOfferTitle(application),
        getCompanyName(application),
        application?.job_offer?.city || "",
        application?.job_offer?.employment_type || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [applications, filter, search]);

  const counts = useMemo(() => {
    return applications.reduce(
      (result, application) => {
        result.total += 1;

        if (Object.prototype.hasOwnProperty.call(result, application.status)) {
          result[application.status] += 1;
        }

        return result;
      },
      {
        total: 0,
        sent: 0,
        viewed: 0,
        shortlisted: 0,
        interview: 0,
        accepted: 0,
        rejected: 0,
      }
    );
  }, [applications]);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <AppShell>
      <main className="min-h-screen bg-[#F5F7FB] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* En-tête */}
          <section className="relative overflow-hidden rounded-3xl bg-[#0A1229] p-6 text-white shadow-lg sm:p-8 lg:p-9">
            <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl" />

            <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-emerald-300">
                  <FileText size={14} />
                  Espace candidat
                </div>

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                  Mes candidatures
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                  Suis l'évolution de tes candidatures et retrouve toutes tes
                  opportunités au même endroit.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    {applications.length} candidature(s)
                  </span>
                  <span className="text-slate-600">·</span>
                  <span>
                    {counts.accepted} candidature(s) acceptée(s)
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => load(true)}
                  disabled={refreshing}
                  aria-label="Actualiser les candidatures"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
                >
                  <RefreshCw
                    size={16}
                    className={refreshing ? "animate-spin" : ""}
                  />
                  <span className="hidden sm:inline">Actualiser</span>
                </button>

                <Link
                  to="/opportunites"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-bold text-[#07172A] transition hover:bg-emerald-300"
                >
                  <Plus size={17} />
                  <span>Explorer</span>
                </Link>
              </div>
            </div>
          </section>

          {/* Erreur de chargement */}
          {error && (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                  <X size={18} />
                </div>

                <div>
                  <p className="text-sm font-bold text-rose-800">
                    Une erreur est survenue
                  </p>
                  <p className="mt-1 text-sm text-rose-700">{error}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => load(true)}
                disabled={refreshing}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? "animate-spin" : ""}
                />
                Réessayer
              </button>
            </div>
          )}

          {/* Statistiques */}
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#0A1229]">
                  Vue d'ensemble
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Résumé de tes candidatures
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {STAT_ITEMS.map((item) => (
                <StatCard
                  key={item.key}
                  item={item}
                  value={stats?.[item.key] ?? counts[item.key] ?? 0}
                />
              ))}
            </div>
          </section>

          {/* Liste des candidatures */}
          <section className="space-y-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-lg font-bold text-[#0A1229]">
                  Toutes mes candidatures
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Consulte chaque dossier pour voir ses détails.
                </p>
              </div>

              <div className="relative w-full sm:max-w-xs">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher une offre..."
                  aria-label="Rechercher une candidature"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-[#0A1229] outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10"
                />
              </div>
            </div>

            {/* Filtres */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <SlidersHorizontal size={14} />
                Filtrer par statut
              </div>

              <div className="flex flex-wrap gap-2">
                {FILTERS.map((item) => {
                  const count =
                    item.key === "all"
                      ? applications.length
                      : counts[item.key] || 0;

                  const active = filter === item.key;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setFilter(item.key)}
                      aria-pressed={active}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                        active
                          ? "border-[#0A1229] bg-[#0A1229] text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-800"
                      }`}
                    >
                      {item.label}

                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          active
                            ? "bg-white/15 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Résultats */}
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                <span className="font-bold text-[#0A1229]">
                  {filtered.length}
                </span>{" "}
                résultat(s)
              </p>

              {(filter !== "all" || search) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilter("all");
                    setSearch("");
                  }}
                  className="text-xs font-semibold text-emerald-700 transition hover:text-emerald-800"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <EmptyState filter={filter} search={search} />
            ) : (
              <div className="space-y-3">
                {filtered.map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Pied de page */}
          {applications.length > 0 && (
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Eye size={17} />
              </div>

              <div>
                <p className="text-sm font-semibold text-[#0A1229]">
                  Garde un œil sur tes candidatures
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Le statut affiché correspond aux informations disponibles
                  dans ton espace. Ouvre une candidature pour consulter ses
                  détails.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}