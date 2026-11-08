import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  Building2,
  User,
  Banknote,
  CalendarDays,
  ArrowUpRight,
  RefreshCw,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Wifi,
  Plus,
  AlertCircle,
  CheckCircle2,
  Bookmark,
  Flame,
} from "lucide-react";

import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const ITEMS_PER_PAGE = 9;

const TYPE_OPTIONS = [
  { id: "all", label: "Toutes les demandes" },
  { id: "company", label: "Entreprises" },
  { id: "talent", label: "Talents" },
];

const BUDGET_OPTIONS = [
  { id: "lt200", label: "Moins de 200 € / jour", test: (v) => v < 200 },
  { id: "200-400", label: "200 – 400 € / jour", test: (v) => v >= 200 && v < 400 },
  { id: "400-600", label: "400 – 600 € / jour", test: (v) => v >= 400 && v < 600 },
  { id: "gte600", label: "600 € et plus / jour", test: (v) => v >= 600 },
];

const LABEL =
  "font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[#6F877E] dark:text-slate-400";

const FIELD =
  "w-full rounded-xl border border-[#E0EAE6] bg-[#F9FCFA] py-3 pl-10 pr-9 text-sm text-[#173A39] outline-none transition " +
  "placeholder:text-[#93A6A0] focus:border-[#10B981] focus:bg-white focus:ring-4 focus:ring-[#10B981]/10 " +
  "dark:border-white/10 dark:bg-[#0B1F33] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:bg-[#112A3A]";

const asArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

const hasValue = (v) => v !== null && v !== undefined && v !== "";

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatRelativeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 30) return `Il y a ${diffDays} jours`;
  return formatDate(value);
};

const formatBudget = (min, max) => {
  const hasMin = hasValue(min);
  const hasMax = hasValue(max);
  if (!hasMin && !hasMax) return null;

  const fmt = (value) =>
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(Number(value));

  if (hasMin && hasMax) return `${fmt(min)} – ${fmt(max)} € / jour`;
  if (hasMin) return `Dès ${fmt(min)} € / jour`;
  return `Jusqu'à ${fmt(max)} € / jour`;
};

const getBudgetValue = (request) => {
  if (hasValue(request.budget_max)) return Number(request.budget_max);
  if (hasValue(request.budget_min)) return Number(request.budget_min);
  return null;
};

const getAuthorName = (request) =>
  request.company?.name || request.author?.name || "Utilisateur";

const getInitials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "TS";

const getAvatarPath = (request, isTalent) =>
  isTalent
    ? request.author?.professional_profile?.avatar_path ||
      request.author?.professionalProfile?.avatar_path ||
      request.professional_profile?.avatar_path ||
      request.professionalProfile?.avatar_path ||
      request.author?.avatar_path
    : request.company?.logo_path;

const getAvatarUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `http://localhost:8001/storage/${path.replace(/^\/+/, "")}`;
};

const getSkillName = (skill) =>
  typeof skill === "string" ? skill : skill?.name || skill?.label || "";

export default function BrowseResourceRequests({
  embedded = false,
  sharedSearch = "",
} = {}) {
  const Shell = embedded ? React.Fragment : AppShell;
  const ContentTag = embedded ? "div" : "main";
  const { user } = useAuth();

  const isTalent = user?.role === "employee" || user?.role === "student";
  const canPublish = user && (user.role === "company" || user.role === "employee");

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [matchCount, setMatchCount] = useState(0);

  const [search, setSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [onlyUrgent, setOnlyUrgent] = useState(false);
  const [onlyRemote, setOnlyRemote] = useState(false);
  const [budgetFilter, setBudgetFilter] = useState("");
  const [sortBy, setSortBy] = useState(isTalent ? "match" : "recent");
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ✅ SAUVEGARDE PERSISTANTE DES DEMANDES
  const [savedRequests, setSavedRequests] = useState(() => {
    try {
      const saved = localStorage.getItem("talentshare_saved_requests");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  useEffect(() => {
    localStorage.setItem("talentshare_saved_requests", JSON.stringify(savedRequests));
  }, [savedRequests]);

  const toggleSaved = (id) => {
    setSavedRequests((current) =>
      current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id]
    );
  };

  const flash = (msg, type = "success") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      if (isTalent) {
        const res = await api.get("/resource-requests/matching-for-me");
        setRequests(asArray(res.data));
        setMatchCount(res.data?.match_count || 0);
      } else {
        const res = await api.get("/resource-requests");
        setRequests(asArray(res.data));
        setMatchCount(0);
      }
    } catch (error) {
      console.error("Erreur chargement :", error);
      setRequests([]);
      setMatchCount(0);
      flash("Impossible de charger les demandes pour le moment.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredRequests = useMemo(() => {
    const query = embedded
      ? sharedSearch.trim().toLowerCase()
      : search.trim().toLowerCase();
    const cityQuery = citySearch.trim().toLowerCase();
    const budgetRule = BUDGET_OPTIONS.find((option) => option.id === budgetFilter);

    const result = requests.filter((request) => {
      const searchableFields = [
        request.title,
        request.description,
        getAuthorName(request),
        request.city,
        request.country,
        ...asArray(request.skills).map(getSkillName),
      ];

      const matchesSearch =
        !query ||
        searchableFields
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesCity =
        !cityQuery ||
        [request.city, request.country]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(cityQuery));

      const isTalentRequest = request.author_type === "talent";

      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "company" && !isTalentRequest) ||
        (typeFilter === "talent" && isTalentRequest);

      const matchesUrgent = !onlyUrgent || request.urgency === "urgent";
      const matchesRemote = !onlyRemote || Boolean(request.remote);

      const budgetValue = getBudgetValue(request);
      const matchesBudget =
        !budgetRule || (budgetValue !== null && budgetRule.test(budgetValue));

      const matchesSaved = !showSavedOnly || savedRequests.includes(request.id);

      return (
        matchesSearch &&
        matchesCity &&
        matchesType &&
        matchesUrgent &&
        matchesRemote &&
        matchesBudget &&
        matchesSaved
      );
    });

    if (sortBy === "match") {
      result.sort((a, b) => Number(b.match_score || 0) - Number(a.match_score || 0));
    } else if (sortBy === "title") {
      result.sort((a, b) => (a.title || "").localeCompare(b.title || "", "fr"));
    } else if (sortBy === "budget") {
      result.sort((a, b) => (getBudgetValue(b) || 0) - (getBudgetValue(a) || 0));
    } else {
      result.sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    }

    return result;
  }, [
    requests,
    search,
    sharedSearch,
    embedded,
    citySearch,
    typeFilter,
    onlyUrgent,
    onlyRemote,
    budgetFilter,
    sortBy,
    showSavedOnly,
    savedRequests,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    sharedSearch,
    citySearch,
    typeFilter,
    onlyUrgent,
    onlyRemote,
    budgetFilter,
    sortBy,
    showSavedOnly,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedRequests = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRequests, safePage]);

  const activeFiltersCount =
    (search.trim() ? 1 : 0) +
    (citySearch.trim() ? 1 : 0) +
    (typeFilter !== "all" ? 1 : 0) +
    (onlyUrgent ? 1 : 0) +
    (onlyRemote ? 1 : 0) +
    (budgetFilter ? 1 : 0) +
    (showSavedOnly ? 1 : 0);

  const resetFilters = () => {
    setSearch("");
    setCitySearch("");
    setTypeFilter("all");
    setOnlyUrgent(false);
    setOnlyRemote(false);
    setBudgetFilter("");
    setSortBy(isTalent ? "match" : "recent");
    setShowSavedOnly(false);
    setCurrentPage(1);
  };

  const count = filteredRequests.length;

  return (
    <Shell>
      <ContentTag className="min-h-screen bg-[#F2F7F5] text-[#0B2A30] dark:bg-[#0B1F33] dark:text-slate-200">
        <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className="grid items-start gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-6">
              <div className="rounded-2xl border border-[#E0EAE5] bg-white p-4 shadow-[0_5px_20px_rgba(11,42,48,0.035)] dark:border-white/10 dark:bg-[#112A3A] dark:shadow-none">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setFiltersOpen((open) => !open)}
                    aria-expanded={filtersOpen}
                    className={`inline-flex items-center gap-2 lg:pointer-events-none ${LABEL}`}
                  >
                    <SlidersHorizontal size={14} className="text-[#10A66A] dark:text-emerald-400" />
                    Filtres
                    {activeFiltersCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#10B981] px-1 font-sans text-[11px] font-bold text-white">
                        {activeFiltersCount}
                      </span>
                    )}
                    <ChevronDown
                      size={14}
                      className={`transition lg:hidden ${filtersOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="text-xs font-bold text-[#0D9663] transition hover:text-[#08754D] dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>

                <div className={`${filtersOpen ? "block" : "hidden"} lg:block`}>
                  <div className="mt-4 space-y-2.5">
                    {!embedded && (
                      <label className="relative block">
                        <Search
                          size={16}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D958A] dark:text-slate-500"
                        />
                        <input
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Intitulé, compétence…"
                          aria-label="Rechercher une demande"
                          className={FIELD}
                        />
                        {search && (
                          <button
                            type="button"
                            onClick={() => setSearch("")}
                            aria-label="Effacer la recherche"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#8AA097] hover:bg-[#E8F4ED] dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </label>
                    )}

                    <label className="relative block">
                      <MapPin
                        size={16}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D958A] dark:text-slate-500"
                      />
                      <input
                        value={citySearch}
                        onChange={(event) => setCitySearch(event.target.value)}
                        placeholder="Ville ou pays"
                        aria-label="Filtrer par ville ou pays"
                        className={FIELD}
                      />
                      {citySearch && (
                        <button
                          type="button"
                          onClick={() => setCitySearch("")}
                          aria-label="Effacer la ville"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#8AA097] hover:bg-[#E8F4ED] dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </label>
                  </div>

                  <FilterSection title="Type de demande">
                    {TYPE_OPTIONS.map((option) => (
                      <FilterPill
                        key={option.id}
                        active={typeFilter === option.id}
                        onClick={() => setTypeFilter(option.id)}
                      >
                        {option.label}
                      </FilterPill>
                    ))}
                  </FilterSection>

                  <FilterSection title="Critères">
                    <FilterPill active={onlyUrgent} onClick={() => setOnlyUrgent((v) => !v)}>
                      Urgent
                    </FilterPill>
                    <FilterPill active={onlyRemote} onClick={() => setOnlyRemote((v) => !v)}>
                      Télétravail
                    </FilterPill>
                  </FilterSection>

                  <FilterSection title="Budget journalier">
                    {BUDGET_OPTIONS.map((option) => (
                      <FilterPill
                        key={option.id}
                        active={budgetFilter === option.id}
                        onClick={() =>
                          setBudgetFilter((current) => (current === option.id ? "" : option.id))
                        }
                      >
                        {option.label}
                      </FilterPill>
                    ))}
                  </FilterSection>
                </div>
              </div>
            </aside>

            <section className="min-w-0">
              {/* ✅ BARRE COMPACTE AVEC SAUVEGARDES ET URGENT */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E0EAE5] pb-4 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <p className={LABEL} aria-live="polite">
                    {loading
                      ? "Chargement…"
                      : `${count} demande${count > 1 ? "s" : ""} trouvée${count > 1 ? "s" : ""}`}
                  </p>
                  
                  <button
                    onClick={() => setShowSavedOnly(!showSavedOnly)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                      showSavedOnly 
                        ? "bg-[#0B2A30] text-white border border-[#0B2A30] dark:bg-emerald-600 dark:border-emerald-600" 
                        : "bg-white text-slate-500 border border-[#DFEAE4] hover:bg-slate-50 dark:bg-[#112A3A] dark:text-slate-400 dark:border-white/10 dark:hover:bg-white/5"
                    }`}
                  >
                    <Bookmark size={12} fill={showSavedOnly ? "currentColor" : "none"} />
                    Sauvegardées ({savedRequests.length})
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setOnlyUrgent(!onlyUrgent)}
                    className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition ${
                      onlyUrgent
                        ? "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400"
                        : "border-[#DFEAE4] bg-white text-[#648076] hover:bg-slate-50 dark:border-white/10 dark:bg-[#112A3A] dark:text-slate-400 dark:hover:bg-white/5"
                    }`}
                  >
                    <Flame size={14} className={onlyUrgent ? "text-rose-500 dark:text-rose-400" : "text-slate-400 dark:text-slate-500"} />
                    Urgent
                  </button>

                  <div className="h-6 w-px bg-[#E0EAE5] mx-1 hidden sm:block dark:bg-white/10"></div>

                  <button
                    type="button"
                    onClick={() => load(true)}
                    disabled={loading || refreshing}
                    title="Actualiser les demandes"
                    aria-label="Actualiser les demandes"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DFEAE4] bg-white text-[#648076] transition hover:border-[#A8D9BD] hover:text-[#0D9663] disabled:opacity-50 dark:border-white/10 dark:bg-[#112A3A] dark:text-slate-400 dark:hover:border-emerald-500/50 dark:hover:text-emerald-400"
                  >
                    <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                  </button>

                  <label className="relative">
                    <span className="sr-only">Trier par</span>
                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                      className="h-9 appearance-none rounded-xl border border-[#DFEAE4] bg-white pl-3.5 pr-9 text-xs font-semibold text-[#294840] outline-none transition focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/10 dark:border-white/10 dark:bg-[#112A3A] dark:text-slate-200 dark:focus:border-emerald-500"
                    >
                      {isTalent && <option value="match">Meilleure correspondance</option>}
                      <option value="recent">Plus récentes</option>
                      <option value="budget">Budget décroissant</option>
                      <option value="title">Ordre alphabétique</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7D958A] dark:text-slate-500" />
                  </label>

                  {canPublish && (
                    <Link
                      to="/resource-requests/new"
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#0B2A30] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#16463F] dark:bg-emerald-600 dark:hover:bg-emerald-500"
                    >
                      <Plus size={14} />
                      Publier
                    </Link>
                  )}
                </div>
              </div>

              {loading && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div
                      key={item}
                      className="animate-pulse rounded-2xl border border-[#E0EAE5] bg-white p-4 dark:border-white/10 dark:bg-[#112A3A]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[#EAF2ED] dark:bg-white/10" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-2/5 rounded bg-[#EAF2ED] dark:bg-white/10" />
                          <div className="h-2.5 w-1/3 rounded bg-[#EAF2ED] dark:bg-white/10" />
                        </div>
                        <div className="h-9 w-9 rounded-full bg-[#EAF2ED] dark:bg-white/10" />
                      </div>
                      <div className="mt-4 h-4 w-3/4 rounded bg-[#EAF2ED] dark:bg-white/10" />
                      <div className="mt-3 h-3 rounded bg-[#EAF2ED] dark:bg-white/10" />
                      <div className="mt-2 h-3 w-4/5 rounded bg-[#EAF2ED] dark:bg-white/10" />
                      <div className="mt-4 h-10 rounded-xl bg-[#EAF2ED] dark:bg-white/10" />
                    </div>
                  ))}
                </div>
              )}

              {!loading && paginatedRequests.length === 0 && (
                <div className="mt-5 rounded-2xl border border-dashed border-[#CFE0D5] bg-white px-5 py-16 text-center dark:border-white/20 dark:bg-[#0B1F33]">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F7EE] text-[#139765] dark:bg-emerald-500/10 dark:text-emerald-400">
                    <Search size={24} />
                  </div>
                  <h3 className="mt-5 text-lg font-extrabold text-[#0B2A30] dark:text-white">
                    {requests.length === 0 ? "Aucune demande disponible" : "Aucun résultat trouvé"}
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7A9186] dark:text-slate-400">
                    {requests.length === 0
                      ? "Les demandes publiées apparaîtront ici dès qu'elles seront disponibles."
                      : "Essayez d'autres mots-clés ou retirez certains filtres pour élargir votre recherche."}
                  </p>
                  {requests.length > 0 && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0B2A30] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#16463F] dark:bg-emerald-600 dark:hover:bg-emerald-500"
                    >
                      <X size={15} />
                      Effacer les filtres
                    </button>
                  )}
                </div>
              )}

              {/* ✅ GRILLE */}
              {!loading && paginatedRequests.length > 0 && (
                <div className="mt-5 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedRequests.map((request) => (
                    <RequestCard 
                      key={request.id} 
                      request={request} 
                      saved={savedRequests.includes(request.id)}
                      onToggleSaved={() => toggleSaved(request.id)}
                    />
                  ))}
                </div>
              )}

              {!loading && totalPages > 1 && (
                <nav
                  aria-label="Pagination des demandes"
                  className="flex flex-wrap items-center justify-center gap-2 pt-8"
                >
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={safePage === 1}
                    aria-label="Page précédente"
                    className="flex h-10 items-center gap-1 rounded-xl border border-[#DFEAE4] bg-white px-3 text-xs font-bold text-[#5C786A] transition hover:border-[#B4DEC3] hover:text-[#148052] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-[#112A3A] dark:text-slate-300 dark:hover:border-emerald-500/50 dark:hover:text-emerald-400"
                  >
                    <ChevronLeft size={15} />
                    Précédent
                  </button>

                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      aria-current={safePage === page ? "page" : undefined}
                      className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-xs font-bold transition ${
                        safePage === page
                          ? "bg-[#0B2A30] text-white shadow-sm dark:bg-emerald-600"
                          : "border border-[#DFEAE4] bg-white text-[#648074] hover:border-[#B4DEC3] hover:text-[#148052] dark:border-white/10 dark:bg-[#112A3A] dark:text-slate-300 dark:hover:border-emerald-500/50 dark:hover:text-emerald-400"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={safePage === totalPages}
                    aria-label="Page suivante"
                    className="flex h-10 items-center gap-1 rounded-xl border border-[#DFEAE4] bg-white px-3 text-xs font-bold text-[#5C786A] transition hover:border-[#B4DEC3] hover:text-[#148052] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-[#112A3A] dark:text-slate-300 dark:hover:border-emerald-500/50 dark:hover:text-emerald-400"
                  >
                    Suivant
                    <ChevronRight size={15} />
                  </button>
                </nav>
              )}
            </section>
          </div>
        </div>

        {toast && (
          <div
            role="status"
            className={`fixed bottom-5 right-5 z-[120] flex max-w-[calc(100vw-2.5rem)] items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 text-sm shadow-[0_12px_40px_rgba(11,42,48,0.15)] dark:bg-[#112A3A] ${
              toast.type === "error"
                ? "border-rose-200 text-rose-700 dark:border-rose-500/30 dark:text-rose-400"
                : "border-[#CDEBDD] text-[#176E4B] dark:border-emerald-500/30 dark:text-emerald-400"
            }`}
          >
            {toast.type === "error" ? (
              <AlertCircle size={18} className="shrink-0" />
            ) : (
              <CheckCircle2 size={18} className="shrink-0" />
            )}
            <span className="font-semibold">{toast.msg}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Fermer la notification"
              className="ml-1 rounded-lg p-1 text-[#8BA096] hover:bg-[#F0F6F2] dark:text-slate-500 dark:hover:bg-white/10"
            >
              <X size={15} />
            </button>
          </div>
        )}
      </ContentTag>
    </Shell>
  );
}

function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mt-5 border-t border-[#EAF0EC] pt-4 dark:border-white/10">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={`flex w-full items-center justify-between ${LABEL}`}
      >
        {title}
        <ChevronDown size={14} className={`transition ${open ? "" : "rotate-180"}`} />
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
}

function FilterPill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`w-full rounded-full border px-4 py-2 text-center font-mono text-xs transition ${
        active
          ? "border-[#10B981] bg-[#EAF7EF] font-semibold text-[#11875B] dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "border-[#DFEAE4] bg-white text-[#5C786A] hover:border-[#A8D9BD] hover:text-[#167C52] dark:border-white/10 dark:bg-[#112A3A] dark:text-slate-400 dark:hover:border-emerald-500/30 dark:hover:text-emerald-400"
      }`}
    >
      {children}
    </button>
  );
}

function MatchRing({ score }) {
  const color = score >= 70 ? "#10B981" : score >= 50 ? "#F59E0B" : "#94A3B8";

  return (
    <div
      className="relative flex h-10 w-10 shrink-0 items-center justify-center"
      title={`${Math.round(score)}% de correspondance avec votre profil`}
      role="img"
      aria-label={`${Math.round(score)}% de correspondance avec votre profil`}
    >
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-[#E6EEE9] dark:text-white/10" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="94.25"
          strokeDashoffset={94.25 - (94.25 * score) / 100}
        />
      </svg>
      <span className="relative text-[9px] font-extrabold" style={{ color }}>
        {Math.round(score)}%
      </span>
    </div>
  );
}

function Avatar({ url, name, isTalent }) {
  const [failed, setFailed] = useState(false);

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={name}
        onError={() => setFailed(true)}
        className="h-10 w-10 shrink-0 rounded-xl border border-[#E2EEE6] object-cover dark:border-white/10"
      />
    );
  }

  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-extrabold ${
        isTalent
          ? "border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400"
          : "border-[#E2EEE6] bg-[#EDF8F0] text-[#11875B] dark:border-white/10 dark:bg-emerald-500/10 dark:text-emerald-400"
      }`}
    >
      {getInitials(name)}
    </div>
  );
}

function RequestCard({ request, saved, onToggleSaved }) {
  const isTalent = request.author_type === "talent";
  const isUrgent = request.urgency === "urgent";
  const isRemote = Boolean(request.remote);

  const authorName = getAuthorName(request);
  const publishedDate = formatRelativeDate(request.created_at);
  const budget = formatBudget(request.budget_min, request.budget_max);
  const avatarUrl = getAvatarUrl(getAvatarPath(request, isTalent));

  const skills = asArray(request.skills).map(getSkillName).filter(Boolean);
  const matchScore = Math.min(100, Math.max(0, Number(request.match_score || 0)));
  const hasMatch = matchScore > 0;

  const location = [request.city, request.country].filter(Boolean).join(", ");
  const startDate = formatDate(request.start_at);
  const endDate = formatDate(request.end_at);

  const period =
    startDate && endDate
      ? `${startDate} → ${endDate}`
      : startDate
        ? `Dès le ${startDate}`
        : endDate
          ? `Jusqu'au ${endDate}`
          : null;

  // ✅ Classes pour le bouton favori (Rond, avec effet Jaune)
  const favBtnClass = `flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
    saved
      ? "border-amber-200 bg-amber-50 text-amber-500 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400" // ✅ Jaune quand sauvegardé
      : "border-slate-200 bg-white text-slate-400 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-500 dark:border-white/10 dark:bg-[#112A3A] dark:text-slate-500 dark:hover:border-amber-500/30 dark:hover:bg-amber-500/10 dark:hover:text-amber-400"
  }`;

  return (
    // ✅ CARTE COMPACTE : max-w-sm, padding réduit
    <article className="group relative flex h-full max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:border-white/10 dark:bg-[#0B1F33] dark:hover:border-emerald-500/30 dark:hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
      <div className="flex flex-1 flex-col p-4">

        {/* 1. AUTEUR + ANNEAU + BOUTON SAUVEGARDER */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar url={avatarUrl} name={authorName} isTalent={isTalent} />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-slate-900 dark:text-white">{authorName}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                <Clock3 size={10} />
                {isTalent ? "Talent" : "Entreprise"}
                {publishedDate ? ` · ${publishedDate}` : ""}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {hasMatch && <MatchRing score={matchScore} />}
            {/* ✅ BOUTON FAVORI STYLE PHOTO 2 */}
            <button onClick={onToggleSaved} className={favBtnClass}>
              <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        {/* 2. PUCES DE STATUT */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ${isTalent ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"}`}>
            {isTalent ? <User size={11} /> : <Building2 size={11} />}
            {isTalent ? "Talent" : "Entreprise"}
          </span>
          {isUrgent && (
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
              <span className="h-1 w-1 rounded-full bg-rose-500" />
              Urgent
            </span>
          )}
          {isRemote && (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
              <Wifi size={11} />
              Télétravail
            </span>
          )}
        </div>

        {/* 3. TITRE */}
        <h3 className="mt-2 line-clamp-2 text-[15px] font-extrabold leading-snug text-slate-900 transition group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-400">
          {request.title || "Demande sans titre"}
        </h3>

        {/* 4. LIEU */}
        {location && (
          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} className="text-emerald-600 dark:text-emerald-500" />
              {location}
            </span>
          </div>
        )}

        {/* 5. COMPÉTENCES */}
        <div className="mt-2 flex flex-wrap gap-1">
          {skills.length > 0 ? (
            <>
              {skills.slice(0, 3).map((skill) => (
                <span key={skill} className="max-w-full truncate rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  {skill}
                </span>
              ))}
              {skills.length > 3 && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-400">
                  +{skills.length - 3}
                </span>
              )}
            </>
          ) : (
             <div className="h-2"></div>
          )}
        </div>

        {/* 6. DESCRIPTION */}
        <p className="mt-2 line-clamp-2 text-[12px] leading-[1.4] text-slate-600 dark:text-slate-400">
          {request.description || "Consultez les détails de cette demande."}
        </p>

        {/* 7. ENCART BUDGET */}
        <div className="mt-auto pt-3">
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-white/5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-emerald-600 dark:bg-white/10 dark:text-emerald-400">
              <Banknote size={12} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400">Budget journalier</p>
              <p className={`truncate text-[11px] font-extrabold ${budget ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>
                {budget || "À définir"}
              </p>
            </div>
          </div>
        </div>

        {/* 8. PIED DE CARTE */}
        <div className="mt-3 flex items-end justify-between gap-2 border-t border-slate-100 pt-3 dark:border-white/10">
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400">
              <CalendarDays size={10} />
              Période
            </p>
            <p className={`mt-0.5 text-[11px] ${period ? "font-bold text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>
              {period || "Non précisée"}
            </p>
          </div>

          <Link
            to={`/resource-requests/${request.id}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0B2A30] px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            Voir
            <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
    </article>
  );
}