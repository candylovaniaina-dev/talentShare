
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  Clock3,
  CheckCircle2,
  XCircle,
  FileText,
  SlidersHorizontal,
  BriefcaseBusiness,
  RefreshCw,
  Send,
  Inbox,
  Sparkles,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import {
  PROPOSAL_STATUS,
  StatusBadge,
  Avatar,
  EmptyState,
  Spinner,
  fmtDate,
  durationLabel,
} from "../components/resource-sharing/shared";

const FILTERS = [
  { id: "all", label: "Toutes" },
  { id: "pending", label: "En attente" },
  { id: "accepted", label: "Acceptées" },
  { id: "declined", label: "Refusées" },
  { id: "expired", label: "Expirées" },
  { id: "draft", label: "Brouillons" },
];

const matchFilter = (proposal, filter) => {
  const status = proposal.display_status || proposal.status;

  if (filter === "all") return true;
  if (filter === "pending") return ["sent", "viewed"].includes(status);
  if (filter === "expired") return ["expired", "cancelled"].includes(status);

  return status === filter;
};

const isCompanyToCompany = (proposal) =>
  Boolean(
    proposal.resource_offer_id ||
      (proposal.proposed_by_company_id && proposal.to_company_id)
  );

export default function ResourceProposals() {
  const [tab, setTab] = useState("received");
  const [data, setData] = useState({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const loadProposals = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [receivedResponse, sentResponse] = await Promise.all([
        api.get("/proposals/received"),
        api.get("/proposals/sent"),
      ]);

      const received = Array.isArray(receivedResponse.data)
        ? receivedResponse.data
        : [];

      const sent = Array.isArray(sentResponse.data)
        ? sentResponse.data
        : [];

      setData({
        received: received.filter(isCompanyToCompany),
        sent: sent.filter(isCompanyToCompany),
      });
    } catch (error) {
      console.error("Erreur de chargement des propositions :", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, []);

  const list = data[tab];

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();

    return list.filter((proposal) => {
      if (!matchFilter(proposal, filter)) return false;
      if (!query) return true;

      const text = [
        proposal.resource_offer?.title,
        proposal.resource_request?.title,
        proposal.profile?.user?.name,
        proposal.proposing_company?.name,
        proposal.to_company?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(query);
    });
  }, [list, filter, search]);

  const pendingReceived = data.received.filter((proposal) =>
    ["sent", "viewed"].includes(
      proposal.display_status || proposal.status
    )
  ).length;

  const stats = [
    {
      label: "Toutes",
      value: list.length,
      icon: FileText,
      tone: "neutral",
    },
    {
      label: "En attente",
      value: list.filter((p) =>
        ["sent", "viewed"].includes(p.display_status || p.status)
      ).length,
      icon: Clock3,
      tone: "amber",
    },
    {
      label: "Acceptées",
      value: list.filter(
        (p) => (p.display_status || p.status) === "accepted"
      ).length,
      icon: CheckCircle2,
      tone: "green",
    },
    {
      label: "Refusées",
      value: list.filter(
        (p) => (p.display_status || p.status) === "declined"
      ).length,
      icon: XCircle,
      tone: "rose",
    },
  ];

  const counts = useMemo(
    () =>
      FILTERS.reduce((result, item) => {
        result[item.id] = list.filter((p) =>
          matchFilter(p, item.id)
        ).length;
        return result;
      }, {}),
    [list]
  );

  const toneClasses = {
    neutral:
      "bg-[#eef3f5] text-[#547184] dark:bg-slate-800 dark:text-slate-300",
    amber:
      "bg-[#fff4df] text-[#b77816] dark:bg-amber-500/10 dark:text-amber-300",
    green:
      "bg-[#e8f7f2] text-[#16866d] dark:bg-emerald-500/10 dark:text-emerald-300",
    rose:
      "bg-[#fff0ef] text-[#cb5a58] dark:bg-rose-500/10 dark:text-rose-300",
  };

  const tabItems = [
    {
      id: "received",
      label: "Reçues",
      icon: Inbox,
      count: data.received.length,
    },
    {
      id: "sent",
      label: "Envoyées",
      icon: Send,
      count: data.sent.length,
    },
  ];

  return (
    <AppShell>
      <div className="min-h-screen bg-[#F3F7F8] text-[#102A43] dark:bg-[#081521] dark:text-slate-100">
        <div className="mx-auto max-w-[1380px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-7">

          {/* En-tête compact, sans grand bandeau */}
          <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0F8179] text-white shadow-lg shadow-[#0F8179]/15">
                <BriefcaseBusiness size={20} strokeWidth={1.7} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold tracking-[-.04em] text-[#102A43] dark:text-white">
                    Propositions
                  </h1>
                  <span className="rounded-full border border-[#d8ece7] bg-[#eaf7f4] px-2.5 py-1 text-[10px] font-bold text-[#0F8179] dark:border-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-300">
                    Espace professionnel
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#718594] dark:text-slate-400">
                  Gérez vos échanges et vos collaborations.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => loadProposals(true)}
                disabled={refreshing}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dfe8eb] bg-white px-3.5 text-xs font-semibold text-[#547184] transition hover:border-[#a8d7ce] hover:text-[#0F8179] disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                <RefreshCw
                  size={14}
                  className={refreshing ? "animate-spin" : ""}
                />
                Actualiser
              </button>

              <Link
                to="/resource-offers/browse"
                className="group inline-flex h-10 items-center gap-2 rounded-xl bg-[#0F8179] px-4 text-xs font-bold text-white shadow-md shadow-[#0F8179]/15 transition hover:bg-[#0B6D67]"
              >
                Explorer les ressources
                <ArrowRight
                  size={14}
                  className="transition group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </header>

          {/* Statistiques */}
          <section
            aria-label="Résumé des propositions"
            className="grid grid-cols-2 gap-3 xl:grid-cols-4"
          >
            {stats.map(({ label, value, icon: Icon, tone }) => (
              <article
                key={label}
                className="rounded-[20px] border border-[#e1e9ec] bg-white p-4 shadow-[0_8px_24px_-20px_rgba(16,42,67,.32)] transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-[#718594] dark:text-slate-400">
                    {label}
                  </p>
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClasses[tone]}`}
                  >
                    <Icon size={16} strokeWidth={1.7} />
                  </span>
                </div>
                <p className="mt-3 text-[28px] font-extrabold leading-none tracking-[-.04em] text-[#102A43] dark:text-white">
                  {value}
                </p>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#edf2f3] dark:bg-slate-800">
                  <span
                    className={`block h-full rounded-full ${
                      tone === "amber"
                        ? "w-2/3 bg-[#e5b14e]"
                        : tone === "green"
                          ? "w-3/4 bg-[#18a889]"
                          : tone === "rose"
                            ? "w-1/3 bg-[#df7772]"
                            : "w-1/2 bg-[#829aaa]"
                    }`}
                  />
                </div>
              </article>
            ))}
          </section>

          {/* Espace de travail */}
          <section className="overflow-hidden rounded-[24px] border border-[#e0e8eb] bg-white shadow-[0_16px_45px_-32px_rgba(16,42,67,.32)] dark:border-slate-800 dark:bg-slate-900">

            {/* Onglets */}
            <div className="flex flex-col justify-between gap-3 border-b border-[#edf1f2] px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:px-6">
              <div className="flex items-center gap-1 rounded-2xl bg-[#f2f6f7] p-1 dark:bg-slate-800/70">
                {tabItems.map(({ id, label, icon: Icon, count }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setTab(id);
                      setFilter("all");
                    }}
                    aria-pressed={tab === id}
                    className={`relative inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs transition sm:px-4 ${
                      tab === id
                        ? "bg-white font-bold text-[#0f8179] shadow-sm ring-1 ring-[#e4ecee] dark:bg-slate-700 dark:text-[#73d9cb] dark:ring-slate-600"
                        : "font-semibold text-[#778996] hover:text-[#314b5c] dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    <Icon size={15} />
                    {label}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                        tab === id
                          ? "bg-[#eaf7f4] text-[#0f8179] dark:bg-[#0f8179]/20 dark:text-[#8ae0d3]"
                          : "bg-[#e8eef0] text-[#768793] dark:bg-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                ))}
              </div>

              {tab === "received" && pendingReceived > 0 && (
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#f2dfb9] bg-[#fff8e9] px-3 py-1.5 text-[11px] font-bold text-[#9b6b1c] dark:border-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#dfa83e]" />
                  {pendingReceived} proposition
                  {pendingReceived > 1 ? "s" : ""} à traiter
                </span>
              )}
            </div>

            {/* Recherche et filtres */}
            <div className="border-b border-[#edf1f2] bg-[#fbfcfc] px-4 py-5 dark:border-slate-800 dark:bg-slate-900/70 sm:px-6">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-base font-extrabold tracking-tight text-[#18364b] dark:text-white">
                    {tab === "received"
                      ? "Propositions reçues"
                      : "Propositions envoyées"}
                  </h2>
                  <p className="mt-1 text-xs text-[#83929d] dark:text-slate-400">
                    Recherchez et suivez vos collaborations.
                  </p>
                </div>

                <div className="relative w-full lg:max-w-[340px]">
                  <Search
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#90a0aa]"
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Entreprise, ressource, personne..."
                    className="h-11 w-full rounded-xl border border-[#dfe8eb] bg-white pl-10 pr-4 text-xs font-medium text-[#243f53] outline-none transition placeholder:text-[#9ba9b2] focus:border-[#55b8ac] focus:ring-4 focus:ring-[#0f9691]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-0.5">
                <span className="mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#edf3f5] text-[#78909f] dark:bg-slate-800">
                  <SlidersHorizontal size={14} />
                </span>

                {FILTERS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilter(item.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold transition ${
                      filter === item.id
                        ? "bg-[#0f8179] text-white shadow-sm shadow-[#0f8179]/20"
                        : "border border-transparent bg-white text-[#748693] hover:border-[#e0e8eb] hover:text-[#304b60] dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {item.label}
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                        filter === item.id
                          ? "bg-white/15 text-white"
                          : "bg-[#f0f4f5] text-[#84939e] dark:bg-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {counts[item.id]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Liste */}
            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <Spinner />
              </div>
            ) : visible.length === 0 ? (
              <div className="px-5 py-12 sm:py-16">
                <EmptyState
                  title={
                    search || filter !== "all"
                      ? "Aucun résultat trouvé"
                      : tab === "received"
                        ? "Aucune proposition reçue"
                        : "Aucune proposition envoyée"
                  }
                  text={
                    search || filter !== "all"
                      ? "Essayez un autre mot-clé ou choisissez un autre filtre."
                      : tab === "received"
                        ? "Les propositions des autres entreprises apparaîtront ici."
                        : "Explorez les ressources disponibles pour commencer une collaboration."
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-[#edf1f2] dark:divide-slate-800">
                {visible.map((proposal) => {
                  const status =
                    proposal.display_status || proposal.status;

                  const other =
                    tab === "received"
                      ? proposal.proposing_company
                      : proposal.to_company;

                  const unread =
                    tab === "received" && proposal.status === "sent";

                  const title =
                    proposal.resource_offer?.title ||
                    proposal.resource_request?.title ||
                    "Proposition directe";

                  const pending = ["sent", "viewed"].includes(status);

                  return (
                    <Link
                      key={proposal.id}
                      to={`/proposals/${proposal.id}`}
                      className="group relative flex items-center gap-3.5 px-4 py-4 transition hover:bg-[#f7fbfa] sm:gap-4 sm:px-6 sm:py-5 dark:hover:bg-slate-800/50"
                    >
                      {unread && (
                        <span className="absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-[#13a894]" />
                      )}

                      <div className="relative shrink-0">
                        <Avatar
                          name={proposal.profile?.user?.name}
                          path={proposal.profile?.avatar_path}
                          size={46}
                        />
                        {unread && (
                          <span
                            className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#13a894] dark:border-slate-900"
                            title="Non consultée"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-bold text-[#19384c] dark:text-slate-100">
                            {proposal.profile?.user?.name || "Salarié"}
                          </p>
                          {unread && (
                            <span className="rounded-full bg-[#e8f7f3] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#0f8179] dark:bg-emerald-500/10 dark:text-emerald-300">
                              Nouveau
                            </span>
                          )}
                        </div>

                        <p className="mt-1 truncate text-[13px] font-semibold text-[#51697a] dark:text-slate-300">
                          {title}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-[#8a99a3] dark:text-slate-400">
                          <span className="inline-flex max-w-48 items-center gap-1.5 truncate">
                            {tab === "received" ? (
                              <ArrowDownLeft size={12} />
                            ) : (
                              <ArrowUpRight size={12} />
                            )}
                            {tab === "received" ? "De" : "À"}{" "}
                            {other?.name || "Entreprise"}
                          </span>

                          {proposal.start_at && proposal.end_at && (
                            <>
                              <span className="text-[#c4cdd2]">·</span>
                              <span>
                                {durationLabel(
                                  proposal.start_at,
                                  proposal.end_at
                                )}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="hidden min-w-[112px] shrink-0 text-right md:block">
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#657b8a] dark:text-slate-300">
                          <CalendarDays size={12} />
                          {fmtDate(proposal.start_at)}
                        </div>
                        <p className="mt-1 text-[10px] text-[#9aa7b0]">
                          {proposal.workload_percent || 100}% du temps
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <StatusBadge map={PROPOSAL_STATUS} status={status} />

                        {pending &&
                          proposal.days_until_expiry != null && (
                            <span
                              className={`text-[10px] font-semibold ${
                                proposal.days_until_expiry <= 3
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-[#98a5ae]"
                              }`}
                            >
                              {proposal.days_until_expiry} j restants
                            </span>
                          )}
                      </div>

                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#a2b0b8] transition group-hover:translate-x-0.5 group-hover:bg-white group-hover:text-[#0f8179] group-hover:shadow-sm dark:group-hover:bg-slate-700">
                        <ChevronRight size={16} />
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}

            {!loading && visible.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#edf1f2] bg-[#fbfcfc] px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
                <p className="text-[11px] font-medium text-[#8a99a3]">
                  {visible.length} résultat{visible.length > 1 ? "s" : ""}
                  {filter !== "all" ? " · Filtré" : ""}
                </p>
                <p className="text-[11px] font-medium text-[#8a99a3]">
                  {tab === "received"
                    ? "Vos propositions reçues"
                    : "Vos propositions envoyées"}
                </p>
              </div>
            )}
          </section>

          <div className="flex items-center justify-center gap-2 pb-2 text-[11px] font-medium text-[#91a0aa] dark:text-slate-500">
            <Sparkles size={12} className="text-[#18a995]" />
            Faites grandir vos collaborations avec TalentShare.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
