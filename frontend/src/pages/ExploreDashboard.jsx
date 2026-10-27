import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Briefcase, FileText, Search, MapPin, Clock, Building2,
  X, Check, ChevronDown, Calendar, Users, Zap,
  ShieldCheck, Loader2, Sparkles, Bookmark,
  Home, SlidersHorizontal, GraduationCap, ArrowRight,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import CreateResourceRequestModal from "./CreateResourceRequest";
import useDebounce from "../hooks/useDebounce";
import api from "../services/api";

/* ============================================================
   CONFIG
============================================================ */
const TABS = [
  { id: "jobs",     label: "Offres d'emploi", icon: Briefcase },
  { id: "requests", label: "Demandes",        icon: FileText },
];

const OFFER_TYPES = {
  internship: "Stage", apprenticeship: "Alternance",
  junior_mission: "Mission junior", first_job: "Premier emploi",
  full_time: "Temps plein", part_time: "Temps partiel",
  freelance: "Freelance", mission: "Mission",
};

const SORTS = [
  { id: "recent",   label: "Plus récents" },
  { id: "relevant", label: "Pertinence" },
];

const asArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

/* ============================================================
   PAGE PRINCIPALE
============================================================ */
export default function ExploreDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const [tab, setTab] = useState(searchParams.get("tab") || "jobs");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);

  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [sort, setSort] = useState("recent");
  const [showFilters, setShowFilters] = useState(false);

  const [jobs, setJobs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const [applyOffer, setApplyOffer] = useState(null);
  const [detailOffer, setDetailOffer] = useState(null);

  const activeFiltersCount = [country, city, remoteOnly, urgentOnly].filter(Boolean).length;

  useEffect(() => {
    setSearchParams({ tab }, { replace: true });
  }, [tab, setSearchParams]);

  useEffect(() => {
    api.get("/profile/me")
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {
      search: debouncedSearch || undefined,
      country: country || undefined,
      city: city || undefined,
      remote: remoteOnly || undefined,
      urgency: urgentOnly ? "urgent" : undefined,
      per_page: 30,
    };

    const promises = [
      tab === "jobs"
        ? api.get("/job-offers", { params }).catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] }),
      tab === "requests"
        ? api.get("/resource-requests", { params }).catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] }),
    ];

    Promise.all(promises)
      .then(([jobsRes, reqRes]) => {
        setJobs(asArray(jobsRes.data));
        setRequests(asArray(reqRes.data));
      })
      .finally(() => setLoading(false));
  }, [tab, debouncedSearch, country, city, remoteOnly, urgentOnly]);

  const clearFilters = () => {
    setCountry(""); setCity(""); setRemoteOnly(false); setUrgentOnly(false);
  };

  const items = tab === "jobs" ? jobs : requests;
  const totalCount = tab === "jobs" ? jobs.length : requests.length;

  const initials = (user?.name || profile?.user?.name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const refreshJobs = () => {
    const params = { per_page: 30 };
    api.get("/job-offers", { params }).then((res) => setJobs(asArray(res.data)));
  };

  return (
    <AppShell>
      {/* Conteneur global calqué sur le style de la Landing */}
      <div className="min-h-screen bg-[#F5F8FA] dark:bg-[#0B253B] text-[#102A43] dark:text-white transition-colors duration-300">
        
        {/* Header de page */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#0B253B] dark:text-white">
            Explorer
          </h1>
          <p className="mt-2 text-sm text-[#637487] dark:text-slate-400">
            Découvrez les opportunités et les besoins qui correspondent à votre profil.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          
          {/* COLONNE PRINCIPALE */}
          <div className="min-w-0 space-y-6">
            
            {/* Barre de recherche & Filtres */}
            <div className="rounded-2xl border border-[#E5ECEF] dark:border-slate-800 bg-white dark:bg-[#102A43] p-2 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#82919D] dark:text-slate-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher une offre, une entreprise, une compétence..."
                    className="w-full rounded-xl bg-transparent py-3 pl-11 pr-4 text-sm text-[#0B253B] dark:text-white placeholder:text-[#82919D] dark:placeholder:text-slate-500 focus:outline-none"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#82919D] hover:text-rose-500">
                      <X size={16} />
                    </button>
                  )}
                </div>
                <div className="h-px w-full sm:h-8 sm:w-px bg-[#E5ECEF] dark:bg-slate-700" />
                <button
                  onClick={() => setShowFilters((s) => !s)}
                  className={`flex w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    showFilters || activeFiltersCount > 0
                      ? "bg-[#16B8B1]/10 text-[#0F9691] dark:text-[#55E0D0]"
                      : "text-[#637487] dark:text-slate-400 hover:bg-[#F5F8FA] dark:hover:bg-slate-800"
                  }`}
                >
                  <SlidersHorizontal size={16} /> 
                  Filtres
                  {activeFiltersCount > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#16B8B1] px-1 text-[10px] font-bold text-[#0B253B]">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Panneau de filtres */}
              {showFilters && (
                <div className="mt-2 grid gap-3 rounded-xl border border-[#E5ECEF] dark:border-slate-700 bg-[#F9FBFD] dark:bg-[#0B253B] p-4 sm:grid-cols-2">
                  <div className="flex items-center gap-2 rounded-lg border border-[#E5ECEF] dark:border-slate-700 bg-white dark:bg-[#102A43] px-3 py-2">
                    <MapPin size={14} className="text-[#82919D]" />
                    <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Pays"
                      className="w-full bg-transparent text-sm text-[#0B253B] dark:text-white placeholder:text-[#82919D] focus:outline-none" />
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-[#E5ECEF] dark:border-slate-700 bg-white dark:bg-[#102A43] px-3 py-2">
                    <MapPin size={14} className="text-[#82919D]" />
                    <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ville"
                      className="w-full bg-transparent text-sm text-[#0B253B] dark:text-white placeholder:text-[#82919D] focus:outline-none" />
                  </div>
                  
                  <button
                    onClick={() => setRemoteOnly(!remoteOnly)}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 transition ${
                      remoteOnly ? "border-[#16B8B1] bg-[#16B8B1]/10" : "border-[#E5ECEF] dark:border-slate-700 bg-white dark:bg-[#102A43]"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <Home size={14} className={remoteOnly ? "text-[#0F9691] dark:text-[#55E0D0]" : "text-[#82919D]"} />
                      <span className={remoteOnly ? "text-[#0F9691] dark:text-[#55E0D0]" : "text-[#637487] dark:text-slate-400"}>Télétravail</span>
                    </span>
                    {remoteOnly && <Check size={14} className="text-[#0F9691] dark:text-[#55E0D0]" />}
                  </button>

                  <button
                    onClick={() => setUrgentOnly(!urgentOnly)}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 transition ${
                      urgentOnly ? "border-rose-500 bg-rose-500/10" : "border-[#E5ECEF] dark:border-slate-700 bg-white dark:bg-[#102A43]"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <Zap size={14} className={urgentOnly ? "text-rose-500" : "text-[#82919D]"} />
                      <span className={urgentOnly ? "text-rose-500" : "text-[#637487] dark:text-slate-400"}>Urgent</span>
                    </span>
                    {urgentOnly && <Check size={14} className="text-rose-500" />}
                  </button>

                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="sm:col-span-2 flex justify-center rounded-lg border border-rose-200 dark:border-rose-900/30 px-3 py-2 text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    >
                      Effacer les filtres
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Onglets */}
            <div className="flex items-center gap-2 border-b border-[#E5ECEF] dark:border-slate-800">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                      active 
                        ? "border-[#16B8B1] text-[#0B253B] dark:text-white" 
                        : "border-transparent text-[#637487] dark:text-slate-400 hover:text-[#0B253B] dark:hover:text-white"
                    }`}
                  >
                    <Icon size={16} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Compteur et Tri */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#637487] dark:text-slate-400">
                {loading ? (
                  <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Chargement...</span>
                ) : (
                  <><b className="text-[#0B253B] dark:text-white">{totalCount}</b> résultat{totalCount > 1 ? "s" : ""}</>
                )}
              </p>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="appearance-none rounded-xl border border-[#E5ECEF] dark:border-slate-700 bg-white dark:bg-[#102A43] px-4 py-2 pr-10 text-sm font-medium text-[#0B253B] dark:text-white focus:border-[#16B8B1] focus:outline-none"
                >
                  {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#82919D]" />
              </div>
            </div>

            {/* Liste des résultats */}
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-white dark:bg-[#102A43]" />)}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#E5ECEF] dark:border-slate-700 bg-white dark:bg-[#102A43] p-12 text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F8FA] dark:bg-[#0B253B] text-[#82919D]">
                  <Search size={28} />
                </span>
                <p className="mt-4 text-base font-bold text-[#0B253B] dark:text-white">
                  Aucun résultat
                </p>
                <p className="mt-1 text-sm text-[#637487] dark:text-slate-400">
                  Essayez de modifier vos critères de recherche.
                </p>
                {activeFiltersCount > 0 && (
                  <button onClick={clearFilters} className="mt-4 text-sm font-semibold text-[#0F9691] dark:text-[#55E0D0] hover:underline">
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) =>
                  tab === "jobs" ? (
                    <JobCard
                      key={item.id}
                      job={item}
                      onApply={(o) => setApplyOffer(o)}
                      onDetails={(o) => setDetailOffer(o)}
                    />
                  ) : <RequestCard key={item.id} request={item} />
                )}
              </div>
            )}
          </div>

          {/* COLONNE LATÉRALE */}
          <aside className="space-y-6">
            
            {/* Carte Profil */}
            {profile && (
              <div className="rounded-2xl border border-[#E5ECEF] dark:border-slate-800 bg-white dark:bg-[#102A43] p-6 text-center shadow-sm">
                {profile?.avatar_path ? (
                  <img
                    src={`/storage/${profile.avatar_path}`}
                    alt={profile?.user?.name || user?.name}
                    className="mx-auto h-24 w-24 rounded-full border-4 border-[#F5F8FA] dark:border-[#0B253B] object-cover shadow-sm"
                  />
                ) : (
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#F5F8FA] dark:border-[#0B253B] bg-[#16B8B1] text-2xl font-bold text-[#0B253B] shadow-sm">
                    {initials}
                  </div>
                )}
                <p className="mt-4 text-base font-bold text-[#0B253B] dark:text-white">
                  {profile?.user?.name || user?.name}
                </p>
                {profile?.headline && (
                  <p className="mt-1 text-sm font-medium text-[#0F9691] dark:text-[#55E0D0]">
                    {profile.headline}
                  </p>
                )}
                <div className="mt-4 space-y-2 border-t border-[#E5ECEF] dark:border-slate-800 pt-4 text-sm text-[#637487] dark:text-slate-400">
                  {profile?.city && (
                    <p className="flex items-center justify-center gap-2">
                      <MapPin size={14} className="text-[#82919D]" />
                      {profile.city}
                    </p>
                  )}
                  {profile?.university && (
                    <p className="flex items-center justify-center gap-2">
                      <GraduationCap size={14} className="text-[#82919D]" />
                      {profile.university}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Carte Action (Publier) */}
            <div className="rounded-2xl border border-[#16B8B1]/30 bg-[#E8FAF6] dark:bg-[#16B8B1]/10 p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16B8B1] text-[#0B253B]">
                <Sparkles size={20} />
              </span>
              <p className="mt-4 text-base font-bold text-[#0B253B] dark:text-white">
                {user?.role === "company" ? "Besoin d'un talent ?" : "Cherchez-vous un stage ?"}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#637487] dark:text-slate-300">
                {user?.role === "company" 
                  ? "Publiez votre besoin en 2 minutes et laissez les talents venir à vous."
                  : "Publiez votre recherche et laissez les entreprises vous découvrir."}
              </p>
              <button
                onClick={() => setShowCreateRequest(true)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B253B] dark:bg-[#16B8B1] px-4 py-3 text-sm font-bold text-white dark:text-[#0B253B] transition hover:bg-[#12344B] dark:hover:bg-[#50D6C5]"
              >
                Publier un besoin <ArrowRight size={16} />
              </button>
            </div>

          </aside>
        </div>
      </div>

      {/* MODALES (inchangées visuellement mais fonctionnelles) */}
      {applyOffer && (
        <ApplyModal
          offer={applyOffer}
          onClose={() => setApplyOffer(null)}
          onSuccess={() => {
            setApplyOffer(null);
            showToast("Candidature envoyée ✅", "success");
            refreshJobs();
          }}
        />
      )}

      {detailOffer && (
        <OfferDetailModal
          offer={detailOffer}
          onClose={() => setDetailOffer(null)}
          onApply={() => {
            const o = detailOffer;
            setDetailOffer(null);
            setApplyOffer(o);
          }}
        />
      )}

      {showCreateRequest && (
        <CreateResourceRequestModal
          onClose={() => setShowCreateRequest(false)}
          onSuccess={(data) => {
            setShowCreateRequest(false);
            showToast("✅ Besoin publié", "success");
          }}
        />
      )}
    </AppShell>
  );
}

/* ============================================================
   CARTE : OFFRE D'EMPLOI (Moderne)
============================================================ */
function JobCard({ job, onApply, onDetails }) {
  const [saved, setSaved] = useState(false);
  const initials = job.company?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="group rounded-2xl border border-[#E5ECEF] dark:border-slate-800 bg-white dark:bg-[#102A43] p-5 transition duration-200 hover:border-[#16B8B1]/50 dark:hover:border-[#55E0D0]/50 hover:shadow-[0_8px_30px_rgba(11,37,59,0.06)] dark:hover:shadow-none">
      <div className="flex items-start gap-4">
        
        {/* Logo */}
        {job.company?.logo_path ? (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E5ECEF] dark:border-slate-700 bg-white">
            <img src={`/storage/${job.company.logo_path}`} alt={job.company.name} className="h-full w-full object-contain p-1" />
          </div>
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#0B253B] dark:bg-[#16B8B1] text-base font-bold text-white dark:text-[#0B253B]">
            {initials || <Building2 size={20} />}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <button
              onClick={() => onDetails?.(job)}
              className="block truncate text-left text-base font-bold text-[#0B253B] dark:text-white transition group-hover:text-[#0F9691] dark:group-hover:text-[#55E0D0]"
            >
              {job.title}
            </button>
            <button
              onClick={(e) => { e.preventDefault(); setSaved(!saved); }}
              className={`shrink-0 rounded-lg p-2 transition ${saved ? "text-[#0F9691] dark:text-[#55E0D0]" : "text-[#82919D] hover:bg-[#F5F8FA] dark:hover:bg-slate-800"}`}
            >
              <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
          
          <div className="mt-1 flex items-center gap-2 text-sm text-[#637487] dark:text-slate-400">
            <span className="font-medium">{job.company?.name}</span>
            {job.company?.is_verified && <ShieldCheck size={14} className="text-[#0F9691] dark:text-[#55E0D0]" />}
          </div>

          {/* Tags */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {job.city && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F5F8FA] dark:bg-[#0B253B] px-2.5 py-1 text-xs font-medium text-[#637487] dark:text-slate-300">
                <MapPin size={12} /> {job.city}{job.country && `, ${job.country}`}
              </span>
            )}
            {job.remote && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                <Home size={12} /> Télétravail
              </span>
            )}
            {job.offer_type && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#16B8B1]/10 dark:bg-[#16B8B1]/20 px-2.5 py-1 text-xs font-medium text-[#0F9691] dark:text-[#55E0D0]">
                {OFFER_TYPES[job.offer_type] || job.offer_type}
              </span>
            )}
          </div>

          {job.description && (
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[#637487] dark:text-slate-400">
              {job.description}
            </p>
          )}

          {/* Actions */}
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={() => onApply?.(job)}
              className="rounded-xl bg-[#16B8B1] px-5 py-2.5 text-sm font-bold text-[#0B253B] transition hover:bg-[#50D6C5]"
            >
              Postuler
            </button>
            <button
              onClick={() => onDetails?.(job)}
              className="rounded-xl border border-[#E5ECEF] dark:border-slate-700 px-5 py-2.5 text-sm font-semibold text-[#0B253B] dark:text-white transition hover:bg-[#F5F8FA] dark:hover:bg-slate-800"
            >
              Détails
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CARTE : DEMANDE (Moderne)
============================================================ */
function RequestCard({ request }) {
  const isUrgent = request.urgency === "urgent";
  const initials = request.company?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="group rounded-2xl border border-[#E5ECEF] dark:border-slate-800 bg-white dark:bg-[#102A43] p-5 transition duration-200 hover:border-[#16B8B1]/50 dark:hover:border-[#55E0D0]/50 hover:shadow-[0_8px_30px_rgba(11,37,59,0.06)] dark:hover:shadow-none">
      <div className="flex items-start gap-4">
        
        {request.company?.logo_path ? (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E5ECEF] dark:border-slate-700 bg-white">
            <img src={`/storage/${request.company.logo_path}`} alt={request.company.name} className="h-full w-full object-contain p-1" />
          </div>
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#0B253B] dark:bg-[#16B8B1] text-base font-bold text-white dark:text-[#0B253B]">
            {initials || <Building2 size={20} />}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <Link to={`/resource-requests/${request.id}`} className="truncate text-base font-bold text-[#0B253B] dark:text-white transition group-hover:text-[#0F9691] dark:group-hover:text-[#55E0D0]">
              {request.title}
            </Link>
            {isUrgent && (
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 dark:bg-rose-900/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                <Zap size={10} /> Urgent
              </span>
            )}
          </div>
          
          <div className="mt-1 flex items-center gap-2 text-sm text-[#637487] dark:text-slate-400">
            <span className="font-medium">{request.company?.name}</span>
            {request.company?.is_verified && <ShieldCheck size={14} className="text-[#0F9691] dark:text-[#55E0D0]" />}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {request.city && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F5F8FA] dark:bg-[#0B253B] px-2.5 py-1 text-xs font-medium text-[#637487] dark:text-slate-300">
                <MapPin size={12} /> {request.city}
              </span>
            )}
            {request.proposals_count > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F5F8FA] dark:bg-[#0B253B] px-2.5 py-1 text-xs font-medium text-[#637487] dark:text-slate-300">
                <Users size={12} /> {request.proposals_count} proposition{request.proposals_count > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {request.description && (
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[#637487] dark:text-slate-400">
              {request.description}
            </p>
          )}

          <div className="mt-5 flex items-center gap-3">
            <Link to={`/resource-requests/${request.id}`} className="rounded-xl bg-[#16B8B1] px-5 py-2.5 text-sm font-bold text-[#0B253B] transition hover:bg-[#50D6C5]">
              Proposer un profil
            </Link>
            <Link to={`/resource-requests/${request.id}`} className="rounded-xl border border-[#E5ECEF] dark:border-slate-700 px-5 py-2.5 text-sm font-semibold text-[#0B253B] dark:text-white transition hover:bg-[#F5F8FA] dark:hover:bg-slate-800">
              Détails
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MODAL : DÉTAILS DE L'OFFRE
============================================================ */
function OfferDetailModal({ offer, onClose, onApply }) {
  const { user } = useAuth();
  const isOwner = user?.id === offer.company?.owner_user_id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B253B]/60 dark:bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[#E5ECEF] dark:border-slate-800 bg-white dark:bg-[#102A43] shadow-2xl" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#E5ECEF] dark:border-slate-800 px-6 py-6">
          <div className="flex items-start gap-4 min-w-0">
            {offer.company?.logo_path ? (
              <img
                src={`/storage/${offer.company.logo_path}`}
                alt={offer.company.name}
                className="h-14 w-14 shrink-0 rounded-xl border border-[#E5ECEF] dark:border-slate-700 bg-white object-contain p-1"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#0B253B] dark:bg-[#16B8B1] text-xl font-bold text-white dark:text-[#0B253B]">
                {offer.company?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-[#0B253B] dark:text-white">
                {offer.company?.name || "Entreprise"}
              </p>
              <p className="mt-1 text-sm text-[#637487] dark:text-slate-400">
                {offer.city}
                {offer.remote && " · Télétravail"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-[#82919D] transition hover:bg-[#F5F8FA] dark:hover:bg-slate-800 hover:text-[#0B253B] dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <span className="inline-block rounded-full bg-[#16B8B1]/10 dark:bg-[#16B8B1]/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#0F9691] dark:text-[#55E0D0]">
            {OFFER_TYPES[offer.offer_type] || offer.offer_type}
          </span>
          <h1 className="mt-4 text-2xl font-bold text-[#0B253B] dark:text-white">
            {offer.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[#637487] dark:text-slate-400">
            {offer.city && (
              <span className="flex items-center gap-2"><MapPin size={16} /> {offer.city}{offer.country && `, ${offer.country}`}</span>
            )}
            {offer.remote && (
              <span className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 font-semibold text-blue-600 dark:text-blue-400">
                <Home size={14} /> Télétravail
              </span>
            )}
            {offer.application_deadline && (
              <span className="flex items-center gap-2">
                <Calendar size={16} /> Avant le {new Date(offer.application_deadline).toLocaleDateString("fr-FR")}
              </span>
            )}
            {offer.created_at && (
              <span className="flex items-center gap-2">
                <Clock size={16} /> Publié le {new Date(offer.created_at).toLocaleDateString("fr-FR")}
              </span>
            )}
          </div>

          <div className="mt-8 border-t border-[#E5ECEF] dark:border-slate-800 pt-6">
            <h3 className="mb-3 text-sm font-bold text-[#0B253B] dark:text-white">
              Description du poste
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#637487] dark:text-slate-300">
              {offer.description || "Aucune description fournie."}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 border-t border-[#E5ECEF] dark:border-slate-800 bg-[#F9FBFD] dark:bg-[#0B253B] px-6 py-5">
          <button
            onClick={onClose}
            className="rounded-xl border border-[#E5ECEF] dark:border-slate-700 bg-white dark:bg-[#102A43] px-5 py-2.5 text-sm font-semibold text-[#0B253B] dark:text-white transition hover:bg-[#F5F8FA] dark:hover:bg-slate-800"
          >
            Fermer
          </button>

          {!isOwner && user?.role !== "company" && (
            <button
              onClick={onApply}
              className="rounded-xl bg-[#16B8B1] px-6 py-2.5 text-sm font-bold text-[#0B253B] transition hover:bg-[#50D6C5]"
            >
              Postuler
            </button>
          )}

          {isOwner && (
            <span className="text-sm font-medium text-[#82919D]">
              C'est votre publication
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MODAL : POSTULER
============================================================ */
function ApplyModal({ offer, onClose, onSuccess }) {
  const [profile, setProfile] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");

  const MIN_LENGTH = 20;

  useEffect(() => {
    Promise.all([
      api.get("/profile/me").then(r => r.data).catch(() => null),
      api.get("/portfolio/my").then(r => r.data).catch(() => null),
    ]).then(([p, pf]) => {
      setProfile(p);
      setPortfolio(pf);
      setLoading(false);
    });
  }, []);

  const tooShort = coverLetter.trim().length > 0 && coverLetter.trim().length < MIN_LENGTH;
  const canSubmit = profile && coverLetter.trim().length >= MIN_LENGTH;

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!profile) {
      setError("Vous devez d'abord créer votre profil professionnel.");
      return;
    }
    if (coverLetter.trim().length < MIN_LENGTH) {
      setError(`La lettre de motivation doit contenir au moins ${MIN_LENGTH} caractères.`);
      return;
    }
    setSaving(true);
    try {
      await api.post("/applications", {
        job_offer_id: offer.id,
        cover_letter: coverLetter.trim(),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B253B]/60 dark:bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-[#E5ECEF] dark:border-slate-800 bg-white dark:bg-[#102A43] shadow-2xl" onClick={(e) => e.stopPropagation()}>

        <div className="flex items-start justify-between gap-4 border-b border-[#E5ECEF] dark:border-slate-800 px-6 py-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0F9691] dark:text-[#55E0D0]">Postuler</p>
            <h2 className="mt-1 text-lg font-bold text-[#0B253B] dark:text-white">{offer.title}</h2>
            <p className="text-sm text-[#637487] dark:text-slate-400">chez {offer.company?.name}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-[#82919D] hover:bg-[#F5F8FA] dark:hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 space-y-5 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-[#0F9691] dark:text-[#55E0D0]" size={28} />
            </div>
          ) : (
            <>
              {error && (
                <div className="rounded-xl border border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-900/10 p-4 text-sm text-rose-600 dark:text-rose-400">
                  {error}
                </div>
              )}
              {!profile && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 p-4 text-sm text-amber-600 dark:text-amber-400">
                  Vous n'avez pas de profil. <Link to="/profile" className="font-semibold underline">Créez-le d'abord</Link>.
                </div>
              )}

              <div>
                <label className="mb-2 flex items-center justify-between text-xs font-bold text-[#0B253B] dark:text-white">
                  <span>Lettre de motivation *</span>
                  <span className={tooShort ? "text-amber-500" : coverLetter.length >= MIN_LENGTH ? "text-[#0F9691] dark:text-[#55E0D0]" : "text-[#82919D]"}>
                    {coverLetter.length} / {MIN_LENGTH} car. min
                  </span>
                </label>
                <textarea
                  rows={5}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Expliquez pourquoi cette offre vous intéresse..."
                  className={`w-full rounded-xl border bg-[#F9FBFD] dark:bg-[#0B253B] px-4 py-3 text-sm text-[#0B253B] dark:text-white placeholder:text-[#82919D] focus:outline-none ${
                    tooShort
                      ? "border-amber-400 focus:border-amber-500"
                      : coverLetter.length >= MIN_LENGTH
                      ? "border-[#16B8B1]/50 focus:border-[#16B8B1]"
                      : "border-[#E5ECEF] dark:border-slate-700 focus:border-[#16B8B1]/50"
                  }`}
                />
                {tooShort && (
                  <p className="mt-1.5 text-xs text-amber-500 font-medium">
                    Encore {MIN_LENGTH - coverLetter.trim().length} caractère{MIN_LENGTH - coverLetter.trim().length > 1 ? "s" : ""} minimum
                  </p>
                )}
              </div>

              {profile?.cv_path && (
                <div className="rounded-xl border border-[#16B8B1]/30 bg-[#16B8B1]/10 p-4 text-sm font-medium text-[#0F9691] dark:text-[#55E0D0]">
                  Votre CV sera joint automatiquement.
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-[#E5ECEF] dark:border-slate-800 pt-5">
                <button type="button" onClick={onClose} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#637487] hover:bg-[#F5F8FA] dark:hover:bg-slate-800">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving || !canSubmit}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#16B8B1] px-6 py-2.5 text-sm font-bold text-[#0B253B] transition hover:bg-[#50D6C5] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                  {saving ? "Envoi..." : "Envoyer ma candidature"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}