import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileSearch,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";

import AppShell from "../components/layout/AppShell";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const STATUS_CONFIG = {
  pending_employee: {
    label: "En attente",
    badge: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300",
    dot: "bg-amber-500",
    soft: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  },
  trial: {
    label: "Période d'essai",
    badge: "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-300",
    dot: "bg-violet-500",
    soft: "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300",
  },
  planned: {
    label: "Acceptée",
    badge: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300",
    dot: "bg-blue-500",
    soft: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
  },
  active: {
    label: "En cours",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300",
    dot: "bg-emerald-500",
    soft: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
  },
  completed: {
    label: "Terminée",
    badge: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    dot: "bg-slate-400",
    soft: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
  cancelled: {
    label: "Annulée",
    badge: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300",
    dot: "bg-rose-500",
    soft: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
  },
};

const TABS = [
  { id: "all", label: "Toutes" },
  { id: "pending", label: "En attente", statuses: ["pending_employee"] },
  { id: "planned", label: "Acceptées", statuses: ["planned"] },
  { id: "trial", label: "Période d'essai", statuses: ["trial"] },
  { id: "active", label: "En cours", statuses: ["active"] },
  { id: "completed", label: "Terminées", statuses: ["completed"] },
  { id: "cancelled", label: "Annulées", statuses: ["cancelled"] },
];

function formatDate(value) {
  if (!value) return "À définir";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "À définir";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function getMissionTitle(mission) {
  return (
    mission?.resource_offer?.title ||
    mission?.proposal?.resource_request?.title ||
    mission?.resource_request?.title ||
    `Mission de ${mission?.profile?.user?.name || "Talent"}`
  );
}

function normalized(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function isEmploymentMission(mission) {
  return (
    mission?.proposal?.contract_kind === "job" ||
    Boolean(mission?.is_trial) ||
    mission?.status === "trial"
  );
}

export default function Missions() {
  const { user } = useAuth();

  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const { toast, show: showToast, close: closeToast } = useToast();

  const load = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await api.get("/missions");
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setMissions(data);
      setError(null);
    } catch (err) {
      console.error("Erreur missions:", err.response?.data || err.message);
      setError("Impossible de charger les missions. Vérifiez votre connexion puis réessayez.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    const interval = window.setInterval(() => {
      load(true);
    }, 30000);
    return () => window.clearInterval(interval);
  }, []);

  const acceptMission = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`/missions/${id}/accept`);
      showToast("Mission acceptée.", "success");
      await load(true);
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur serveur", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const declineMission = async (id) => {
    if (!window.confirm("Refuser cette mission ?")) return;
    setActionLoading(id);
    try {
      await api.post(`/missions/${id}/decline`);
      showToast("Mission refusée.", "info");
      await load(true);
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur serveur", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const updateStatus = async (id, status) => {
    setActionLoading(id);
    try {
      await api.patch(`/missions/${id}/status`, { status });
      showToast(status === "active" ? "Mission démarrée." : "Mission terminée.", "success");
      await load(true);
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur serveur", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const countByTab = (tabId) => {
    if (tabId === "all") return missions.length;
    const statuses = TABS.find((tab) => tab.id === tabId)?.statuses || [];
    return missions.filter((mission) => statuses.includes(mission.status)).length;
  };

  const filteredMissions = useMemo(() => {
    const tab = TABS.find((item) => item.id === activeTab);
    const query = normalized(search.trim());

    return missions.filter((mission) => {
      const matchesStatus = activeTab === "all" || (tab?.statuses || []).includes(mission.status);
      const companyNames = [mission.supplying_company?.name, mission.requesting_company?.name].filter(Boolean).join(" ");
      const haystack = normalized([getMissionTitle(mission), mission.profile?.user?.name, companyNames, mission.id].join(" "));
      return matchesStatus && (!query || haystack.includes(query));
    });
  }, [missions, activeTab, search]);

  const activeCount = missions.filter((mission) => mission.status === "active").length;
  const pendingCount = missions.filter((mission) => mission.status === "pending_employee").length;
  const completedCount = missions.filter((mission) => mission.status === "completed").length;

  const myProfileId = user?.professional_profile?.id || user?.professionalProfile?.id || user?.professional_profile_id;
  const myCompanyIds = (user?.companies || []).map((company) => Number(company.id));

  if (loading && missions.length === 0) {
    return (
      <AppShell>
        <main className="min-h-screen bg-[#F5F8FA] px-4 py-6 dark:bg-transparent sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl animate-pulse space-y-6">
            <div className="h-8 w-52 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-80 max-w-full rounded bg-slate-200 dark:bg-slate-800" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-32 rounded-2xl bg-white dark:bg-slate-900" />
              ))}
            </div>
            <div className="h-16 rounded-2xl bg-white dark:bg-slate-900" />
            <div className="h-44 rounded-2xl bg-white dark:bg-slate-900" />
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* ✅ dark:bg-transparent permet de prendre la couleur de l'AppShell sans bande blanche */}
      <main className="min-h-screen bg-[#F5F8FA] px-3 py-6 transition-colors dark:bg-transparent sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          
          <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
              <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Actualisation automatique toutes les 30 secondes
          </div>

          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Synthèse des missions">
            <SummaryCard label="Total des missions" value={missions.length} caption="Toutes vos collaborations" icon={BriefcaseBusiness} tone="navy" />
            <SummaryCard label="En cours" value={activeCount} caption="Missions actives" icon={Activity} tone="teal" />
            <SummaryCard label="En attente" value={pendingCount} caption="Réponse attendue" icon={Clock3} tone="amber" />
            <SummaryCard label="Terminées" value={completedCount} caption="Collaborations finalisées" icon={CheckCircle2} tone="slate" />
          </section>

          {error && (
            <div role="alert" className="flex flex-col justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <X size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
              <button type="button" onClick={() => load()} className="self-start rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-bold transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 sm:self-auto">
                Réessayer
              </button>
            </div>
          )}

          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.025] dark:border-slate-800 dark:bg-[#0D2030]">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <BriefcaseBusiness size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#0B253B] dark:text-white">Toutes vos missions</h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {filteredMissions.length} résultat{filteredMissions.length !== 1 ? "s" : ""} affiché{filteredMissions.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <label className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 dark:border-slate-700 dark:bg-[#091B29] dark:focus-within:bg-[#0B2030] lg:max-w-md">
                <Search size={17} className="shrink-0 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  type="search"
                  placeholder="Rechercher une mission, un talent..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
                  aria-label="Rechercher une mission"
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")} aria-label="Effacer la recherche" className="rounded-md p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white">
                    <X size={15} />
                  </button>
                )}
              </label>
            </div>

            <nav className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 pt-2 dark:border-slate-800 sm:px-4 [scrollbar-width:none]" aria-label="Filtrer les missions">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    aria-pressed={isActive}
                    className={`relative inline-flex shrink-0 items-center gap-2 rounded-t-xl px-3.5 py-3 text-xs font-semibold transition sm:px-4 ${
                      isActive
                        ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
                    }`}
                  >
                    {tab.label}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive ? "bg-emerald-700 text-white dark:bg-emerald-500 dark:text-[#06251F]" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                      {countByTab(tab.id)}
                    </span>
                    {isActive && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-emerald-500" />}
                  </button>
                );
              })}
            </nav>

            <div className="space-y-3 p-3 sm:p-4">
              {refreshing && missions.length > 0 && (
                <div className="flex items-center gap-2 px-1 py-1 text-xs text-slate-400 dark:text-slate-500">
                  <Loader2 size={13} className="animate-spin" />
                  Mise à jour des données…
                </div>
              )}

              {!error && filteredMissions.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-14 text-center dark:border-slate-700 dark:bg-[#091B29]">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-[#0D2030] dark:text-slate-500">
                    <FileSearch size={24} />
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-100">
                    {search ? "Aucun résultat trouvé" : activeTab === "all" ? "Aucune mission pour le moment" : `Aucune mission « ${TABS.find((tab) => tab.id === activeTab)?.label} »`}
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {search ? "Essayez avec un autre mot-clé ou vérifiez l'orthographe." : "Les missions correspondant à ce filtre apparaîtront ici."}
                  </p>
                  {(search || activeTab !== "all") && (
                    <button
                      type="button"
                      onClick={() => { setSearch(""); setActiveTab("all"); }}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                    >
                      <X size={14} /> Réinitialiser les filtres
                    </button>
                  )}
                </div>
              )}

              {filteredMissions.map((mission, index) => {
                const cfg = STATUS_CONFIG[mission.status] || STATUS_CONFIG.planned;
                const isEmployee = Boolean(myProfileId && Number(mission.professional_profile_id) === Number(myProfileId));
                const isSupplier = myCompanyIds.includes(Number(mission.supplying_company_id));
                const isRequesting = myCompanyIds.includes(Number(mission.requesting_company_id));
                const isDirectHire = !mission.supplying_company_id;
                const busy = actionLoading === mission.id;
                const talentName = mission.profile?.user?.name;
                const employment = isEmploymentMission(mission);
                const badgeLabel = employment && mission.status === "active" ? "CDI" : cfg.label;

                return (
                  <article
                    key={mission.id}
                    className="mission-card group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-200 hover:border-emerald-200 hover:shadow-md hover:shadow-slate-900/[0.04] dark:border-slate-800 dark:bg-[#0B1D2C] dark:hover:border-emerald-900/70"
                    style={{ animationDelay: `${Math.min(index * 40, 240)}ms` }}
                  >
                    <div className={`absolute inset-y-0 left-0 w-1 ${cfg.dot}`} />
                    <div className="p-4 pl-5 sm:p-5 sm:pl-6">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[10px] font-semibold ${cfg.badge}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                              {badgeLabel}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              Réf. #{mission.id}
                            </span>
                            {employment && (
                              <span className="rounded-full bg-violet-50 px-2.5 py-1.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
                                Emploi
                              </span>
                            )}
                            {isEmployee && <RoleBadge tone="violet">Talent</RoleBadge>}
                            {isSupplier && !isEmployee && <RoleBadge tone="blue">Prêteur</RoleBadge>}
                            {isRequesting && <RoleBadge tone="green">{isDirectHire ? "Recruteur" : "Bénéficiaire"}</RoleBadge>}
                          </div>

                          <Link to={`/missions/${mission.id}`} className="mt-3 inline-block max-w-full break-words text-base font-bold tracking-tight text-[#0B253B] transition hover:text-emerald-700 dark:text-white dark:hover:text-emerald-400 sm:text-lg">
                            {getMissionTitle(mission)}
                          </Link>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                            {talentName && <MetaItem icon={Users} label="Talent" value={talentName} />}
                            <MetaItem
                              icon={CalendarDays}
                              label={employment ? "Contrat" : "Période"}
                              value={`${formatDate(mission.start_at)} — ${mission.end_at ? formatDate(mission.end_at) : "Sans date de fin"}`}
                            />
                            <MetaItem icon={Activity} label="Charge" value={`${mission.workload_percent ?? 100}%`} />
                            {(mission.supplying_company?.name || mission.requesting_company?.name) && (
                              <MetaItem icon={Building2} label={isDirectHire ? "Entreprise" : "Organisation"} value={mission.requesting_company?.name || mission.supplying_company?.name} />
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800 xl:max-w-[360px] xl:justify-end xl:border-0 xl:pt-0">
                          {isEmployee && mission.status === "pending_employee" && (
                            <>
                              <button type="button" onClick={() => acceptMission(mission.id)} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60">
                                {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Accepter
                              </button>
                              <button type="button" onClick={() => declineMission(mission.id)} disabled={busy} className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900/50 dark:bg-transparent dark:text-rose-300 dark:hover:bg-rose-950/30">
                                Refuser
                              </button>
                            </>
                          )}

                          {isEmployee && mission.status === "planned" && <StatusNote>En attente du démarrage</StatusNote>}
                          {isEmployee && mission.status === "active" && <StatusNote tone="teal"><Activity size={13} /> Mission en cours</StatusNote>}

                          {((isSupplier && !isRequesting) || (isRequesting && isDirectHire)) && mission.status === "planned" && (
                            <button type="button" onClick={() => updateStatus(mission.id, "active")} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B253B] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#153D57] disabled:opacity-60 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-500">
                              {busy ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />} Démarrer
                            </button>
                          )}

                          {(isSupplier || isRequesting) && mission.status === "active" && (
                            <button type="button" onClick={() => updateStatus(mission.id, "completed")} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B253B] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#153D57] disabled:opacity-60 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-500">
                              {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Terminer
                            </button>
                          )}

                          {!isEmployee && isRequesting && !isSupplier && !isDirectHire && mission.status === "planned" && (
                            <StatusNote tone="blue">En attente du prêteur</StatusNote>
                          )}
                          {mission.status === "trial" && isEmployee && <StatusNote tone="blue">Période d'essai en cours</StatusNote>}
                          {mission.status === "trial" && isRequesting && !isEmployee && <StatusNote tone="blue">Essai à valider</StatusNote>}

                          <Link to={`/missions/${mission.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 dark:border-slate-700 dark:bg-transparent dark:text-slate-200 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300">
                            Détails <ChevronRight size={14} />
                          </Link>
                        </div>

                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <footer className="flex flex-col gap-2 border-t border-slate-200/80 pt-4 text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>TalentShare · Gestion des missions</span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Vos données sont actualisées automatiquement
            </span>
          </footer>
        </div>

        <style>{`
          .mission-card {
            animation: mission-enter 320ms cubic-bezier(.2,.7,.2,1) both;
          }
          @keyframes mission-enter {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
              animation-duration: 0.01ms !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}</style>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </AppShell>
  );
}

function SummaryCard({ label, value, caption, icon: Icon, tone }) {
  const styles = {
    navy: { card: "border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0D2030]", label: "text-slate-500 dark:text-slate-400", value: "text-[#0B253B] dark:text-white", icon: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
    teal: { card: "border-emerald-100 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20", label: "text-emerald-800 dark:text-emerald-300", value: "text-emerald-900 dark:text-emerald-300", icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
    amber: { card: "border-amber-100 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20", label: "text-amber-800 dark:text-amber-300", value: "text-amber-900 dark:text-amber-300", icon: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
    slate: { card: "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-[#0D2030]", label: "text-slate-500 dark:text-slate-400", value: "text-slate-800 dark:text-slate-100", icon: "bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  };
  const style = styles[tone] || styles.navy;

  return (
    <article className={`rounded-2xl border p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-sm sm:p-5 ${style.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold ${style.label}`}>{label}</p>
          <p className={`mt-3 text-3xl font-bold leading-none tracking-tight ${style.value}`}>{value}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.icon}`}>
          <Icon size={19} />
        </div>
      </div>
      <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">{caption}</p>
    </article>
  );
}

function RoleBadge({ children, tone }) {
  const styles = {
    violet: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-300",
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300",
  };
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${styles[tone] || styles.blue}`}>{children}</span>;
}

function MetaItem({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
        <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-700 dark:text-slate-200">{value}</p>
      </div>
    </div>
  );
}

function StatusNote({ children, tone = "amber" }) {
  const styles = {
    amber: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300",
    teal: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300",
    blue: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300",
  };
  return <span className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-medium ${styles[tone] || styles.amber}`}>{children}</span>;
}