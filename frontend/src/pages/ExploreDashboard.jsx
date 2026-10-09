import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Briefcase, FileText, Search, MapPin, Clock, Building2, Euro,
  X, Check, ChevronDown, Calendar, Users, Zap,
  ShieldCheck, Loader2, Sparkles, Bookmark, ArrowUpRight,
  Home, MapPinned, Wallet, SlidersHorizontal, TrendingUp,
  Award, GraduationCap, Sparkle, ExternalLink,
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
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [sort, setSort] = useState("recent");
  const [showFilters, setShowFilters] = useState(false);

  const [jobs, setJobs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState(null);

  // ✅ Modales
  const [applyOffer, setApplyOffer] = useState(null);
  const [detailOffer, setDetailOffer] = useState(null);

  const activeFiltersCount = [country, city, remoteOnly, urgentOnly, budgetMin, budgetMax].filter(Boolean).length;

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
      budget_min: budgetMin || undefined,
      budget_max: budgetMax || undefined,
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
  }, [tab, debouncedSearch, country, city, remoteOnly, urgentOnly, budgetMin, budgetMax]);

  const clearFilters = () => {
    setCountry(""); setCity(""); setRemoteOnly(false);
    setUrgentOnly(false); setBudgetMin(""); setBudgetMax("");
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
      <div className="grid gap-5 lg:grid-cols-[240px_1fr_280px]">

        {/* COLONNE GAUCHE */}
        <aside className="hidden space-y-4 lg:block">
          <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-4">
            <div className="flex justify-center">
              {profile?.avatar_path ? (
                <img
                  src={`http://localhost:8000/storage/${profile.avatar_path}`}
                  alt={profile?.user?.name || user?.name}
                  className="h-20 w-20 rounded-full border-4 border-[var(--bg-surface)] object-cover shadow-lg"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-[var(--bg-surface)] bg-gradient-to-br from-emerald-400 to-emerald-600 text-xl font-bold text-white shadow-lg">
                  {initials}
                </div>
              )}
            </div>

            <div className="mt-3 text-center">
              <p className="truncate text-sm font-bold text-[var(--text-app)]">
                {profile?.user?.name || user?.name}
              </p>
              {profile?.headline && (
                <p className="mt-0.5 truncate text-xs font-medium text-emerald-400">
                  {profile.headline}
                </p>
              )}
            </div>

            <div className="mt-3 space-y-1.5 border-t border-[var(--border-app)] pt-3">
              {profile?.city && (
                <p className="flex items-center justify-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                  <MapPin size={10} className="shrink-0 text-[var(--text-faint)]" />
                  <span className="truncate">
                    {profile.city}
                    {profile.country && `, ${profile.country}`}
                  </span>
                </p>
              )}
              {profile?.university && (
                <p className="flex items-center justify-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                  <GraduationCap size={10} className="shrink-0 text-[var(--text-faint)]" />
                  <span className="truncate">
                    {profile.study_level && `${profile.study_level} · `}
                    {profile.field_of_study || profile.university}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-app)]">
              <TrendingUp size={13} className="text-emerald-400" /> Résultats
            </p>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Offres d'emploi</span>
                <span className="font-bold text-[var(--text-app)]">{jobs.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Demandes</span>
                <span className="font-bold text-[var(--text-app)]">{requests.length}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* COLONNE CENTRALE */}
        <div className="min-w-0 space-y-4">
          <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-4">
            <div className="flex items-center gap-2 rounded-full border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-4 py-2.5">
              <Search size={16} className="shrink-0 text-[var(--text-faint)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une offre, une entreprise, une compétence..."
                className="w-full bg-transparent text-sm text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")} className="shrink-0 text-[var(--text-faint)] hover:text-rose-400">
                  <X size={14} />
                </button>
              )}
              <button
                onClick={() => setShowFilters((s) => !s)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  showFilters || activeFiltersCount > 0
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-[var(--border-app)] text-[var(--text-muted)] hover:text-[var(--text-app)]"
                }`}
              >
                <SlidersHorizontal size={12} /> Filtres
                {activeFiltersCount > 0 && (
                  <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-[#0A1229]">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            <div className="mt-4 flex gap-1 border-b border-[var(--border-app)]">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition ${
                      active ? "text-emerald-400" : "text-[var(--text-muted)] hover:text-[var(--text-app)]"
                    }`}
                  >
                    <Icon size={15} />
                    {t.label}
                    {active && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-emerald-400" />}
                  </button>
                );
              })}
            </div>

            {showFilters && (
              <div className="mt-4 grid gap-3 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] p-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-2 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface)] px-3 py-2">
                  <MapPinned size={12} className="shrink-0 text-[var(--text-faint)]" />
                  <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Pays"
                    className="w-full bg-transparent text-xs text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus:outline-none" />
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface)] px-3 py-2">
                  <MapPin size={12} className="shrink-0 text-[var(--text-faint)]" />
                  <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ville"
                    className="w-full bg-transparent text-xs text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus:outline-none" />
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface)] px-3 py-2">
                  <Wallet size={11} className="shrink-0 text-[var(--text-faint)]" />
                  <input type="number" min="0" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="Budget min"
                    className="w-full bg-transparent text-xs text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus:outline-none" />
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface)] px-3 py-2">
                  <Wallet size={11} className="shrink-0 text-[var(--text-faint)]" />
                  <input type="number" min="0" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="Budget max"
                    className="w-full bg-transparent text-xs text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus:outline-none" />
                </div>

                <button
                  onClick={() => setRemoteOnly(!remoteOnly)}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 transition ${
                    remoteOnly ? "border-blue-500/40 bg-blue-500/10" : "border-[var(--border-app)] bg-[var(--bg-surface)]"
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-semibold">
                    <Home size={13} className={remoteOnly ? "text-blue-400" : "text-[var(--text-muted)]"} />
                    <span className={remoteOnly ? "text-blue-400" : "text-[var(--text-app)]"}>Télétravail</span>
                  </span>
                  {remoteOnly && <Check size={12} className="text-blue-400" />}
                </button>

                <button
                  onClick={() => setUrgentOnly(!urgentOnly)}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 transition ${
                    urgentOnly ? "border-rose-500/40 bg-rose-500/10" : "border-[var(--border-app)] bg-[var(--bg-surface)]"
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-semibold">
                    <Zap size={13} className={urgentOnly ? "text-rose-400" : "text-[var(--text-muted)]"} />
                    <span className={urgentOnly ? "text-rose-400" : "text-[var(--text-app)]"}>Urgent</span>
                  </span>
                  {urgentOnly && <Check size={12} className="text-rose-400" />}
                </button>

                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center justify-center rounded-lg border border-rose-500/30 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10"
                  >
                    Effacer les filtres
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-[var(--text-muted)]">
              {loading ? (
                <span className="flex items-center gap-1.5"><Loader2 size={11} className="animate-spin" /> Chargement...</span>
              ) : (
                <><b className="text-[var(--text-app)]">{totalCount}</b> résultat{totalCount > 1 ? "s" : ""}</>
              )}
            </p>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-1.5 pr-7 text-xs font-medium text-[var(--text-app)] focus:border-emerald-500/50 focus:outline-none"
              >
                {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <ChevronDown size={11} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-[var(--bg-surface)]" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border-app)] bg-[var(--bg-surface)] p-12 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-surface-hover)] text-[var(--text-faint)]">
                <Search size={20} />
              </span>
              <p className="mt-3 text-sm font-semibold text-[var(--text-app)]">
                Aucun{tab === "jobs" ? "e offre" : "e demande"} pour le moment
              </p>
              <p className="mt-1 text-xs text-[var(--text-faint)]">Essayez d'élargir vos filtres.</p>
              {activeFiltersCount > 0 && (
                <button onClick={clearFilters} className="mt-3 text-xs font-semibold text-emerald-400 hover:text-emerald-300">
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) =>
                tab === "jobs"
                  ? (
                    <JobCard
                      key={item.id}
                      job={item}
                      onApply={(o) => setApplyOffer(o)}
                      onDetails={(o) => setDetailOffer(o)}
                    />
                  )
                  : <RequestCard key={item.id} request={item} />
              )}
            </div>
          )}
        </div>

        {/* COLONNE DROITE */}
        <aside className="hidden space-y-4 lg:block">
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] to-transparent p-4">
  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
    <Sparkles size={14} />
  </span>
  <p className="mt-3 text-sm font-bold text-[var(--text-app)]">
    {user?.role === "company"
      ? "Une compétence à trouver ?"
      : "Vous cherchez un stage ?"}
  </p>
  <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
    {user?.role === "company"
      ? "Publiez votre besoin en 2 minutes et laissez les talents venir à vous."
      : "Publiez votre recherche et laissez les entreprises vous découvrir."}
  </p>
  <button
  onClick={() => setShowCreateRequest(true)}
  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-[#0A1229] transition hover:bg-emerald-400"
>
  Publier un besoin <ArrowUpRight size={12} />
</button>
</div>

          <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-4">
            <p className="text-xs font-bold text-[var(--text-app)]">Conseils rapides</p>
            <ul className="mt-3 space-y-2 text-[11px] text-[var(--text-muted)]">
              <li className="flex gap-2"><span className="text-emerald-400">•</span> Complétez votre profil pour apparaître dans plus de recherches.</li>
              <li className="flex gap-2"><span className="text-emerald-400">•</span> Activez les alertes pour ne manquer aucune opportunité.</li>
              <li className="flex gap-2"><span className="text-emerald-400">•</span> Sauvegardez les offres qui vous intéressent.</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* ✅ MODAL : Postuler */}
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

      {/* ✅ MODAL : Détails de l'offre */}
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
      // Optionnel : rediriger vers le détail
      // navigate(`/resource-requests/${data.id}`);
    }}
  />
)}
    </AppShell>
  );
}

/* ============================================================
   CARTE : OFFRE D'EMPLOI
============================================================ */
function JobCard({ job, onApply, onDetails }) {
  const [saved, setSaved] = useState(false);
  const initials = job.company?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="group rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-4 transition hover:border-emerald-500/40 hover:shadow-md hover:shadow-emerald-500/5">
      <div className="flex items-start gap-3">
        {job.company?.logo_path ? (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--border-app)] bg-white">
            <img src={`http://localhost:8000/storage/${job.company.logo_path}`} alt={job.company.name} className="h-full w-full object-contain" />
          </div>
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[var(--border-app)] bg-gradient-to-br from-emerald-400 to-blue-500 text-sm font-bold text-white">
            {initials || <Building2 size={18} />}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <button
              onClick={() => onDetails?.(job)}
              className="block truncate text-left text-sm font-bold text-[var(--text-app)] transition group-hover:text-emerald-400"
            >
              {job.title}
            </button>
            <button
              onClick={(e) => { e.preventDefault(); setSaved(!saved); }}
              className={`shrink-0 rounded-lg p-1.5 transition ${saved ? "text-emerald-400" : "text-[var(--text-faint)] hover:text-[var(--text-app)]"}`}
            >
              <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
          {job.company && (
            <span className="mt-0.5 flex items-center gap-1 text-xs text-[var(--text-muted)]">
              {job.company.name}
              {job.company.is_verified && <ShieldCheck size={11} className="text-emerald-400" />}
            </span>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {job.city && (
              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                <MapPin size={10} /> {job.city}{job.country && `, ${job.country}`}
              </span>
            )}
            {job.remote && (
              <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                <Home size={10} /> Télétravail
              </span>
            )}
            {job.offer_type && (
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                {OFFER_TYPES[job.offer_type] || job.offer_type}
              </span>
            )}
          </div>

          {job.description && <p className="mt-2 line-clamp-2 text-xs text-[var(--text-muted)]">{job.description}</p>}

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => onApply?.(job)}
              className="rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-[#0A1229] transition hover:bg-emerald-400"
            >
              Postuler
            </button>
            <button
              onClick={() => onDetails?.(job)}
              className="rounded-lg border border-[var(--border-app)] px-3 py-1.5 text-xs font-medium text-[var(--text-app)] transition hover:border-emerald-500/40 hover:text-emerald-400"
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
   CARTE : DEMANDE
============================================================ */
function RequestCard({ request }) {
  const isUrgent = request.urgency === "urgent";
  const initials = request.company?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="group rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-4 transition hover:border-emerald-500/40 hover:shadow-md hover:shadow-emerald-500/5">
      <div className="flex items-start gap-3">
        {request.company?.logo_path ? (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--border-app)] bg-white">
            <img src={`http://localhost:8000/storage/${request.company.logo_path}`} alt={request.company.name} className="h-full w-full object-contain" />
          </div>
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[var(--border-app)] bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-bold text-white">
            {initials || <Building2 size={18} />}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/resource-requests/${request.id}`} className="truncate text-sm font-bold text-[var(--text-app)] transition group-hover:text-emerald-400">
              {request.title}
            </Link>
            {isUrgent && (
              <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/40 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-rose-400">
                <Zap size={8} /> Urgent
              </span>
            )}
          </div>
          {request.company && (
            <span className="mt-0.5 flex items-center gap-1 text-xs text-[var(--text-muted)]">
              {request.company.name}
              {request.company.is_verified && <ShieldCheck size={11} className="text-emerald-400" />}
            </span>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {request.city && (
              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                <MapPin size={10} /> {request.city}
              </span>
            )}
            {request.budget_min && request.budget_max && (
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                <Euro size={10} /> {request.budget_min}–{request.budget_max} €/j
              </span>
            )}
            {request.proposals_count > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                <Users size={10} /> {request.proposals_count}
              </span>
            )}
          </div>

          {request.description && <p className="mt-2 line-clamp-2 text-xs text-[var(--text-muted)]">{request.description}</p>}

          <div className="mt-3 flex items-center gap-2">
            <Link to={`/resource-requests/${request.id}`} className="rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-[#0A1229] transition hover:bg-emerald-400">
              Proposer un profil
            </Link>
            <Link to={`/resource-requests/${request.id}`} className="rounded-lg border border-[var(--border-app)] px-3 py-1.5 text-xs font-medium text-[var(--text-app)] transition hover:border-emerald-500/40 hover:text-emerald-400">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-2xl" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-app)] px-6 py-5">
          <div className="flex items-start gap-3 min-w-0">
            {offer.company?.logo_path ? (
              <img
                src={`http://localhost:8000/storage/${offer.company.logo_path}`}
                alt={offer.company.name}
                className="h-12 w-12 shrink-0 rounded-lg border border-[var(--border-app)] object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-base font-bold text-white">
                {offer.company?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[var(--text-app)]">
                {offer.company?.name || "Entreprise"}
              </p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {offer.city}
                {offer.remote && " · Télétravail"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-faint)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <span className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
            {OFFER_TYPES[offer.offer_type] || offer.offer_type}
          </span>
          <h1 className="mt-3 text-xl font-bold text-[var(--text-app)]">
            {offer.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
            {offer.city && (
              <span className="flex items-center gap-1"><MapPin size={12} /> {offer.city}{offer.country && `, ${offer.country}`}</span>
            )}
            {offer.remote && (
              <span className="flex items-center gap-1 rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 font-semibold text-blue-400">
                <Home size={11} /> Télétravail
              </span>
            )}
            {offer.application_deadline && (
              <span className="flex items-center gap-1">
                <Calendar size={12} /> Avant le {new Date(offer.application_deadline).toLocaleDateString("fr-FR")}
              </span>
            )}
            {offer.created_at && (
              <span className="flex items-center gap-1">
                <Clock size={12} /> Publié le {new Date(offer.created_at).toLocaleDateString("fr-FR")}
              </span>
            )}
          </div>

          <div className="mt-6 border-t border-[var(--border-app)] pt-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Description
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-app)]">
              {offer.description || "Aucune description fournie."}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-[var(--border-app)] bg-[var(--bg-surface)] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--border-app)] px-4 py-2 text-sm font-medium text-[var(--text-app)] transition hover:bg-[var(--bg-surface-hover)]"
          >
            Fermer
          </button>

          {!isOwner && user?.role !== "company" && (
            <button
              onClick={onApply}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400"
            >
              Postuler
            </button>
          )}

          {isOwner && (
            <span className="text-xs text-[var(--text-muted)]">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-2xl" onClick={(e) => e.stopPropagation()}>

        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-app)] px-6 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Postuler</p>
            <h2 className="mt-0.5 text-base font-bold text-[var(--text-app)]">{offer.title}</h2>
            <p className="text-xs text-[var(--text-muted)]">chez {offer.company?.name}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--text-faint)] hover:bg-[var(--bg-surface-hover)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 space-y-4 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-emerald-400" size={24} />
            </div>
          ) : (
            <>
              {error && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                  {error}
                </div>
              )}
              {!profile && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
                  Vous n'avez pas de profil. <a href="/profile" className="font-semibold underline">Créez-le d'abord</a>.
                </div>
              )}

              {/* Lettre de motivation + compteur */}
              <div>
                <label className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                  <span>Lettre de motivation *</span>
                  <span className={tooShort ? "text-amber-400" : coverLetter.length >= MIN_LENGTH ? "text-emerald-400" : "text-[var(--text-faint)]"}>
                    {coverLetter.length} / {MIN_LENGTH} car. min
                  </span>
                </label>
                <textarea
                  rows={5}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Expliquez pourquoi cette offre vous intéresse..."
                  className={`w-full rounded-lg border bg-[var(--bg-surface-hover)] px-3 py-2 text-sm text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus:outline-none ${
                    tooShort
                      ? "border-amber-500/50 focus:border-amber-500"
                      : coverLetter.length >= MIN_LENGTH
                      ? "border-emerald-500/50 focus:border-emerald-500"
                      : "border-[var(--border-app)] focus:border-emerald-500/50"
                  }`}
                />
                {tooShort && (
                  <p className="mt-1 text-[10px] text-amber-400">
                    Encore {MIN_LENGTH - coverLetter.trim().length} caractère{MIN_LENGTH - coverLetter.trim().length > 1 ? "s" : ""} minimum
                  </p>
                )}
              </div>

              {profile?.cv_path && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                  CV joint automatiquement
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-[var(--border-app)] pt-4">
                <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving || !canSubmit}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
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