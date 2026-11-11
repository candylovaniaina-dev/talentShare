import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  History, MessageSquare, Eye, Sparkles, Handshake, CheckCircle,
  Target, XCircle, Clock, UserPlus, AlertCircle, FileText,
  Video, UserCheck, Heart, MessageCircle, Inbox, LoaderCircle,
  CalendarDays, RefreshCw, ArrowUpRight, Activity, BriefcaseBusiness,
  ChevronRight, Search, Filter, X, RotateCcw, ArrowRight
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

/* ============================================================
   CONFIGURATION DES ÉVÉNEMENTS
============================================================ */
const ICONS = {
  new_message: { icon: MessageSquare, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", ring: "ring-blue-100 dark:ring-blue-500/20" },
  offer_viewed: { icon: Eye, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", ring: "ring-amber-100 dark:ring-amber-500/20" },
  proposal_accepted: { icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", ring: "ring-emerald-100 dark:ring-emerald-500/20" },
  proposal_declined: { icon: XCircle, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10", ring: "ring-rose-100 dark:ring-rose-500/20" },
  mission_accepted: { icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", ring: "ring-emerald-100 dark:ring-emerald-500/20" },
  mission_declined: { icon: XCircle, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10", ring: "ring-rose-100 dark:ring-rose-500/20" },
  new_application: { icon: FileText, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", ring: "ring-emerald-100 dark:ring-emerald-500/20" },
  proposal_sent: { icon: FileText, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", ring: "ring-emerald-100 dark:ring-emerald-500/20" },
  application_viewed: { icon: Eye, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", ring: "ring-blue-100 dark:ring-blue-500/20" },
  application_shortlisted: { icon: UserCheck, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10", ring: "ring-violet-100 dark:ring-violet-500/20" },
  application_interview: { icon: Video, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", ring: "ring-amber-100 dark:ring-amber-500/20" },
  application_accepted: { icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", ring: "ring-emerald-100 dark:ring-emerald-500/20" },
  application_rejected: { icon: XCircle, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10", ring: "ring-rose-100 dark:ring-rose-500/20" },
  offer_liked: { icon: Heart, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10", ring: "ring-rose-100 dark:ring-rose-500/20" },
  offer_commented: { icon: MessageCircle, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", ring: "ring-blue-100 dark:ring-blue-500/20" },
  default: { icon: History, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-white/10", ring: "ring-slate-200 dark:ring-white/20" },
};

const API_BASE = "http://127.0.0.1:8001";
const STORAGE_URL = `${API_BASE}/storage`;

const FILTERS = [
  { key: "all", label: "Tout", icon: Activity, types: null },
  { key: "applications", label: "Candidatures", icon: FileText, types: ["new_application", "proposal_sent", "application_viewed", "application_shortlisted", "application_interview", "application_accepted", "application_rejected", "proposal_accepted", "proposal_declined"] },
  { key: "missions", label: "Missions", icon: BriefcaseBusiness, types: ["mission_accepted", "mission_declined"] },
  { key: "messages", label: "Messages", icon: MessageSquare, types: ["new_message"] },
  { key: "social", label: "Interactions", icon: Heart, types: ["offer_liked", "offer_commented"] },
];

const PERIODS = [
  { key: "all", label: "Tout" },
  { key: "today", label: "Aujourd'hui" },
  { key: "week", label: "7 derniers jours" },
  { key: "month", label: "Ce mois-ci" },
];

function formatTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function buildImageUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${STORAGE_URL}/${String(pathOrUrl).replace(/^\/+/, "")}`;
}

function ActorAvatar({ actor, size = 48, typeConfig }) {
  const [error, setError] = useState(false);
  const Icon = typeConfig?.icon || History;
  const initials = actor?.name ? actor.name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() : null;
  const imageUrl = buildImageUrl(actor?.avatar_path);

  useEffect(() => {
    setError(false);
  }, [actor?.avatar_path]);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {imageUrl && !error ? (
        <img src={imageUrl} alt={actor?.name || "Profil"} onError={() => setError(true)} className="h-full w-full rounded-xl border border-slate-200 object-cover shadow-sm dark:border-white/10" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
          {initials || <Icon size={20} />}
        </div>
      )}
      <span className={`absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-sm dark:border-[#112A3A] ${typeConfig?.bg || "bg-slate-100"} ${typeConfig?.color || "text-slate-600"}`}>
        <Icon size={12} strokeWidth={2.5} />
      </span>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent = "teal", note }) {
  const accents = { 
    teal: "bg-teal-50 text-teal-600 ring-teal-100 dark:bg-teal-500/10 dark:text-teal-400 dark:ring-teal-500/20", 
    blue: "bg-blue-50 text-blue-600 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20", 
    violet: "bg-violet-50 text-violet-600 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20", 
    amber: "bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20" 
  };
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#112A3A]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-800 dark:text-white">{value}</p>
          {note && <p className="mt-1 text-xs text-slate-400 truncate dark:text-slate-500">{note}</p>}
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${accents[accent] || accents.teal}`}>
          <Icon size={20} />
        </span>
      </div>
    </div>
  );
}

function getTargetUrl(item) {
  if (item.url) return item.url;
  if (item.action_url) return item.action_url;

  const safeId = String(item.id || "");
  
  if (item.subject_type && item.subject_id) {
    if (item.subject_type.includes("Application")) return `/applications/${item.subject_id}`;
    if (item.subject_type.includes("Proposal")) return `/proposals/${item.subject_id}`;
    if (item.subject_type.includes("Mission")) return `/missions/${item.subject_id}`;
  }

  if (item.type.includes("mission")) return `/missions/${safeId.replace("mission-", "")}`;
  if (item.type.includes("application")) return `/applications/${safeId.replace("app-", "")}`;
  if (item.type.includes("proposal")) return `/proposals/${safeId.replace("proposal-", "")}`;
  
  return null;
}

export default function ActivityHistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCompany = user?.role === "company";

  const [history, setHistory] = useState([]);
  const [sentProposals, setSentProposals] = useState([]);
  const [sentApplications, setSentApplications] = useState([]);
  const [missions, setMissions] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  
  const [activeFilter, setActiveFilter] = useState("all");
  const [activePeriod, setActivePeriod] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const [histRes, proposalsRes, applicationsRes, missionsRes] = await Promise.all([
        api.get("/notifications/history").catch(() => ({ data: { history: [] } })),
        api.get("/proposals/sent").catch(() => ({ data: [] })),
        api.get("/applications").catch(() => ({ data: [] })),
        api.get("/missions").catch(() => ({ data: [] })),
      ]);

      const histData = Array.isArray(histRes.data?.history) ? histRes.data.history : [];
      const proposalsData = Array.isArray(proposalsRes.data) ? proposalsRes.data : [];
      let applicationsData = [];
      if (applicationsRes.data && Array.isArray(applicationsRes.data)) applicationsData = applicationsRes.data;
      else if (applicationsRes.data && Array.isArray(applicationsRes.data.data)) applicationsData = applicationsRes.data.data;
      
      let missionsData = [];
      if (missionsRes.data && Array.isArray(missionsRes.data)) missionsData = missionsRes.data;
      else if (missionsRes.data && Array.isArray(missionsRes.data.data)) missionsData = missionsRes.data.data;

      setHistory(histData);
      setSentProposals(proposalsData);
      setSentApplications(applicationsData);
      setMissions(missionsData);
    } catch {
      setError("Impossible de charger l'historique.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const mergedItems = useMemo(() => {
    const items = [];
    
    sentApplications.forEach((app) => {
      const talentName = app.user?.name || app.professional_profile?.user?.name || "le talent";
      const talentAvatar = app.user?.avatar_path || app.professional_profile?.user?.avatar_path || app.professional_profile?.avatar_path;
      const companyName = app.job_offer?.company?.name || app.company?.name || "l'entreprise";
      const companyAvatar = app.job_offer?.company?.logo_path || app.company?.logo_path;
      const offerTitle = app.job_offer?.title || app.offer?.title || "une offre";
      
      items.push({ 
        id: `app-${app.id}`, 
        type: "new_application", 
        title: isCompany ? "Candidature reçue" : "Candidature envoyée", 
        body: isCompany 
          ? `${talentName} a postulé à votre offre « ${offerTitle} »`
          : `Vous avez postulé pour « ${offerTitle} »`, 
        created_at: app.created_at, 
        url: `/applications/${app.id}`,
        actor: { 
          name: isCompany ? talentName : companyName, 
          avatar_path: isCompany ? talentAvatar : companyAvatar 
        } 
      });
    });

    sentProposals.forEach((p) => {
      const talentName = p.profile?.user?.name || "le talent";
      const talentAvatar = p.profile?.user?.avatar_path || p.profile?.avatar_path;
      const companyName = p.to_company?.name || p.resource_request?.company?.name || "l'entreprise";
      const companyAvatar = p.to_company?.logo_path || p.resource_request?.company?.logo_path;
      const reqTitle = p.resource_request?.title || "une demande";
      
      items.push({ 
        id: `proposal-${p.id}`, 
        type: "proposal_sent", 
        title: isCompany ? "Proposition envoyée" : "Candidature (Demande)", 
        body: isCompany 
          ? `Vous avez proposé une offre à ${talentName} pour « ${reqTitle} »`
          : `Vous avez postulé à « ${reqTitle} »`, 
        created_at: p.created_at, 
        url: `/proposals/${p.id}`, 
        actor: { 
          name: isCompany ? talentName : companyName, 
          avatar_path: isCompany ? talentAvatar : companyAvatar 
        } 
      });
    });

    missions.forEach((m) => {
      const talentName = m.profile?.user?.name || "le talent";
      const talentAvatar = m.profile?.user?.avatar_path || m.profile?.avatar_path;
      const companyName = m.requesting_company?.name || "l'entreprise";
      const companyAvatar = m.requesting_company?.logo_path || m.requesting_company?.logo_url;
      const missionTitle = m.title || m.proposal?.resource_request?.title || m.resource_offer?.title || m.job_offer?.title || `Mission de ${talentName}`;

      let title = "Mission créée";
      let body = "";

      if (m.status === "planned") {
        title = isCompany ? "Mission planifiée" : "Mission acceptée";
        body = isCompany ? `La mission « ${missionTitle} » est prête à démarrer avec ${talentName}.` : `Mission « ${missionTitle} » chez ${companyName}.`;
      } else if (m.status === "active") {
        title = isCompany ? "Mission démarrée" : "Mission en cours";
        body = isCompany ? `La mission « ${missionTitle} » a démarré avec ${talentName}.` : `Mission « ${missionTitle} » chez ${companyName}.`;
      } else if (m.status === "completed") {
        title = "Mission terminée";
        body = isCompany ? `La mission « ${missionTitle} » avec ${talentName} est terminée.` : `Mission « ${missionTitle} » chez ${companyName} terminée.`;
      } else if (m.status === "cancelled") {
        title = "Mission annulée";
        body = `La mission « ${missionTitle} » a été annulée.`;
      } else if (m.status === "trial") {
        title = "Période d'essai";
        body = `La mission « ${missionTitle} » est en période d'essai.`;
      } else if (m.status === "pending_employee") {
        title = "En attente du talent";
        body = `En attente de la réponse de ${talentName} pour « ${missionTitle} ».`;
      }

      items.push({ 
        id: `mission-${m.id}`, 
        type: "mission_accepted", 
        title: title, 
        body: body, 
        created_at: m.created_at, 
        url: `/missions/${m.id}`, 
        actor: { 
          name: isCompany ? talentName : companyName, 
          avatar_path: isCompany ? talentAvatar : companyAvatar 
        } 
      });
    });

    history.forEach((group) => {
      if (Array.isArray(group.items)) {
        group.items.forEach((it) => { 
          if (!items.find(existing => existing.id === it.id)) {
            items.push(it); 
          }
        });
      }
    });

    return items.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [history, sentProposals, sentApplications, missions, isCompany]);

  const filteredHistory = useMemo(() => {
    const filterConfig = FILTERS.find((filter) => filter.key === activeFilter);
    const query = searchTerm.trim().toLocaleLowerCase("fr");
    const now = new Date();
    
    const groups = {};
    mergedItems.forEach((item) => {
      const matchesType = !filterConfig?.types || filterConfig.types.includes(item.type);
      const searchableText = [item.title, item.body, item.actor?.name, item.type].filter(Boolean).join(" ").toLocaleLowerCase("fr");
      
      let matchesPeriod = true;
      const itemDate = new Date(item.created_at);
      if (activePeriod === "today") matchesPeriod = itemDate.toDateString() === now.toDateString();
      else if (activePeriod === "week") matchesPeriod = itemDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      else if (activePeriod === "month") matchesPeriod = itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();

      if (matchesType && matchesPeriod && (!query || searchableText.includes(query))) {
        const dateKey = itemDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
        if (!groups[dateKey]) groups[dateKey] = { date: dateKey, label: dateKey, items: [] };
        groups[dateKey].items.push(item);
      }
    });

    return Object.values(groups);
  }, [mergedItems, activeFilter, activePeriod, searchTerm]);

  const allItems = useMemo(() => mergedItems, [mergedItems]);
  const countsByFilter = useMemo(() => {
    const counts = {};
    FILTERS.forEach((filter) => { counts[filter.key] = allItems.filter((item) => !filter.types || filter.types.includes(item.type)).length; });
    return counts;
  }, [allItems]);

  const activityTypes = useMemo(() => ({
    applications: allItems.filter((item) => FILTERS[1].types.includes(item.type)).length,
    missions: allItems.filter((item) => FILTERS[2].types.includes(item.type)).length,
    messages: allItems.filter((item) => FILTERS[3].types.includes(item.type)).length,
    social: allItems.filter((item) => FILTERS[4].types.includes(item.type)).length,
  }), [allItems]);

  const recentActivities = allItems.slice(0, 5);
  
  const resetFilters = () => {
    setActiveFilter("all");
    setActivePeriod("all");
    setSearchTerm("");
  };
  const hasActiveFilters = activeFilter !== "all" || activePeriod !== "all" || searchTerm.trim() !== "";

  return (
    <AppShell>
      {/* ✅ APPLICATION DE LA POLICE JAKARTA SANS */}
      <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC] font-['Plus_Jakarta_Sans',sans-serif] dark:bg-[#081D2D]">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          
          {/* ✅ CARTES STATS PLUS GRANDES */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={isCompany ? "Candidatures reçues" : "Candidatures"} value={activityTypes.applications} icon={FileText} accent="blue" note="Offres & demandes" />
            <StatCard label="Missions" value={activityTypes.missions} icon={BriefcaseBusiness} accent="teal" note="Suivi des missions" />
            <StatCard label="Messages" value={activityTypes.messages} icon={MessageSquare} accent="violet" note="Nouveaux messages" />
            <StatCard label="Interactions" value={activityTypes.social} icon={Heart} accent="amber" note="J'aime et commentaires" />
          </div>

          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
            <main className="min-w-0">
              
              {/* BARRE DE FILTRES */}
              <div className="mb-6 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#112A3A]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 px-1 dark:text-slate-300">
                    <Filter size={16} className="text-teal-500 dark:text-teal-400" />
                    Filtrer
                  </div>
                  <div className="relative w-full lg:max-w-xs">
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Rechercher..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500" />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {FILTERS.map((filter) => {
                      const Icon = filter.icon;
                      const active = activeFilter === filter.key;
                      return (
                        <button key={filter.key} type="button" onClick={() => setActiveFilter(filter.key)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${active ? "border-slate-300 bg-slate-100 text-slate-800 dark:border-white/20 dark:bg-white/10 dark:text-white" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10"}`}>
                          <Icon size={14} />
                          {filter.label}
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-slate-200 text-slate-700 dark:bg-white/20 dark:text-white" : "bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-slate-500"}`}>{countsByFilter[filter.key]}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="h-5 w-px bg-slate-200 hidden sm:block dark:bg-white/10"></div>
                  
                  <select value={activePeriod} onChange={(e) => setActivePeriod(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 outline-none focus:border-teal-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                    {PERIODS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                  </select>

                  {hasActiveFilters && (
                    <button onClick={resetFilters} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10">
                      <RotateCcw size={14} /> Effacer
                    </button>
                  )}
                </div>
              </div>

              {/* LISTE DE L'HISTORIQUE */}
              <section className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-white/10 dark:bg-[#112A3A]">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/10">
                  <div><h2 className="text-base font-bold text-slate-800 dark:text-white">Activité récente</h2></div>
                  
                  {activeFilter === "missions" && (
                    <Link 
                      to="/missions" 
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                    >
                      Voir tout
                      <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
                <div className="p-4 sm:p-5">
                  {error ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-500/20 dark:bg-rose-500/10">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" size={18} />
                        <div>
                          <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">Chargement impossible</p>
                          <button type="button" onClick={() => load()} className="mt-2 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700"><RefreshCw size={12} /> Réessayer</button>
                        </div>
                      </div>
                    </div>
                  ) : loading ? (
                    <div className="flex flex-col items-center justify-center py-16"><LoaderCircle size={28} className="animate-spin text-teal-500" /><p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">Chargement...</p></div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-50 text-slate-400 dark:bg-white/5 dark:text-slate-500">{searchTerm ? <Search size={24} /> : <Inbox size={26} strokeWidth={1.6} />}</span>
                      <h3 className="mt-4 text-base font-semibold text-slate-700 dark:text-white">{searchTerm ? "Aucun résultat" : "Aucune activité"}</h3>
                      {(searchTerm || activeFilter !== "all" || activePeriod !== "all") && (
                        <button onClick={resetFilters} className="mt-4 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10">Réinitialiser</button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {filteredHistory.map((group, groupIndex) => (
                        <div key={group.date || group.label || groupIndex}>
                          <div className="mb-3 flex items-center gap-2.5">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400"><CalendarDays size={14} /></span>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{group.label || group.date}</h3>
                            <div className="h-px flex-1 bg-slate-100 dark:bg-white/10" />
                          </div>
                          <div className="relative ml-3.5 space-y-3 border-l-2 border-slate-100 pl-4 sm:ml-4 sm:pl-6 dark:border-white/5">
                            {group.items.map((item, itemIndex) => {
                              const cfg = ICONS[item.type] || ICONS.default;
                              const targetUrl = getTargetUrl(item);
                              
                              return (
                                <div 
                                  key={item.id ?? `${group.date}-${item.type}-${itemIndex}`} 
                                  onClick={() => targetUrl && navigate(targetUrl)}
                                  className="group relative cursor-pointer rounded-xl border border-slate-100 bg-white p-4 transition duration-200 hover:border-slate-300 hover:shadow-md dark:border-white/5 dark:bg-white/5 dark:hover:border-white/20"
                                >
                                  <span className={`absolute -left-[22px] top-6 h-2.5 w-2.5 rounded-full border-2 border-white ${cfg.bg} ring-2 ${cfg.ring} sm:-left-[32px] dark:border-[#112A3A]`} />
                                  <div className="flex items-start gap-3.5">
                                    <ActorAvatar actor={item.actor} typeConfig={cfg} size={40} />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                          <h4 className="text-sm font-semibold leading-tight text-slate-800 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400">{item.title || "Activité"}</h4>
                                          {item.body && <p className="mt-1 text-[13px] leading-relaxed text-slate-500 line-clamp-2 dark:text-slate-400">{item.body}</p>}
                                        </div>
                                        <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-400 ring-1 ring-slate-100 dark:bg-white/5 dark:text-slate-500 dark:ring-white/10"><Clock size={12} />{formatTime(item.created_at) || "—"}</span>
                                      </div>
                                    </div>
                                    <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition group-hover:bg-teal-50 group-hover:text-teal-600 sm:flex dark:bg-white/5 dark:text-slate-500 dark:group-hover:bg-teal-500/20 dark:group-hover:text-teal-400">
                                      <ChevronRight size={16} />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </main>

            {/* SIDEBAR */}
            <aside className="space-y-4">
              <section className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#112A3A]">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400"><Activity size={16} /></span>
                  <div><h2 className="text-sm font-bold text-slate-800 dark:text-white">Dernières activités</h2></div>
                </div>
                <div className="mt-4 space-y-3">
                  {recentActivities.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500">Aucune activité.</p>
                  ) : (
                    recentActivities.map((item, i) => {
                       const cfg = ICONS[item.type] || ICONS.default;
                       return (
                        <div key={i} className="flex items-center gap-2.5 text-xs">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${cfg.color.replace('text-', 'bg-')}`} />
                          <p className="truncate text-slate-600 font-medium dark:text-slate-300">{item.title}</p>
                        </div>
                       );
                    })
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#112A3A]">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400"><BriefcaseBusiness size={16} /></span>
                  <div><h2 className="text-sm font-bold text-slate-800 dark:text-white">Vue d'ensemble</h2></div>
                </div>
                <div className="mt-4 space-y-3.5">
                  {[
                    { label: isCompany ? "Candidatures reçues" : "Candidatures", value: activityTypes.applications, color: "bg-blue-400" },
                    { label: "Missions", value: activityTypes.missions, color: "bg-teal-400" },
                    { label: "Messages", value: activityTypes.messages, color: "bg-violet-400" },
                    { label: "Interactions", value: activityTypes.social, color: "bg-amber-400" },
                  ].map((row) => {
                    const percent = allItems.length ? Math.round((row.value / allItems.length) * 100) : 0;
                    return (
                      <div key={row.label}>
                        <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-slate-500 dark:text-slate-400">{row.label}</span>
                          <span className="font-bold text-slate-800 dark:text-white">{row.value}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"><div className={`h-full rounded-full ${row.color} transition-all duration-500`} style={{ width: `${percent}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </AppShell>
  );
}