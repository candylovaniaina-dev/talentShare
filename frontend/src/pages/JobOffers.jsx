import React, { useEffect, useMemo, useState } from "react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  X,
  Heart,
  Search,
  MapPin,
  BriefcaseBusiness,
  CalendarDays,
  ArrowUpRight,
  RefreshCw,
  Plus,
  Wifi,
  GraduationCap,
  Trash2,
  SlidersHorizontal,
  Clock3,
  CheckCircle2,
  AlertCircle,
  FileText,
  Banknote,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import JobOfferDetail from "./JobOfferDetail";

/* ============================================================
   CONFIGURATION
============================================================ */

const OFFER_TYPES = {
  internship: "Stage",
  apprenticeship: "Alternance",
  junior_mission: "Mission junior",
  first_job: "Premier emploi",
};

const TYPE_OPTIONS = [
  { id: "all", label: "Toutes les offres" },
  { id: "internship", label: "Stages et alternances" },
  { id: "employment", label: "Emplois et missions" },
];

const ITEMS_PER_PAGE = 9;

const LABEL =
  "font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[#6F877E] dark:text-slate-400";

const FIELD =
  "w-full rounded-xl border border-[#E0EAE6] bg-[#F9FCFA] py-3 pl-10 pr-9 text-sm text-[#173A39] outline-none transition " +
  "placeholder:text-[#93A6A0] focus:border-[#10B981] focus:bg-white focus:ring-4 focus:ring-[#10B981]/10 " +
  "dark:border-white/10 dark:bg-[#0B1F33] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:bg-[#112A3A]";

const inputClass =
  "w-full rounded-xl border border-[#E0EAE6] bg-[#F9FCFA] px-4 py-3 text-sm text-[#173A39] outline-none transition placeholder:text-[#93A6A0] focus:border-[#10B981] focus:bg-white focus:ring-4 focus:ring-[#10B981]/10 dark:border-white/10 dark:bg-[#0B1F33] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:bg-[#112A3A]";

/* ============================================================
   HELPERS
============================================================ */

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

const formatSalary = (min, max, currency = "Ar") => {
  const hasMin = hasValue(min);
  const hasMax = hasValue(max);
  if (!hasMin && !hasMax) return null;
  const fmt = (value) => new Intl.NumberFormat("fr-FR").format(value);
  if (hasMin && hasMax) return `${fmt(min)} – ${fmt(max)} ${currency} / mois`;
  if (hasMin) return `Dès ${fmt(min)} ${currency} / mois`;
  return `Jusqu'à ${fmt(max)} ${currency} / mois`;
};

const getCompanyName = (offer) =>
  offer.company?.name || offer.company_name || "Entreprise partenaire";

const getInitials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "TS";

const parseCriteria = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const isEmployment = (offer) => ["first_job", "junior_mission"].includes(offer.offer_type);
const isInternship = (offer) => ["internship", "apprenticeship"].includes(offer.offer_type);

/* ============================================================
   PAGE PRINCIPALE
============================================================ */

export default function JobOffers({
  embedded = false,
  sharedSearch = "",
}) {
  const Shell = embedded ? React.Fragment : AppShell;
  const ContentTag = embedded ? "div" : "main";
  const { user } = useAuth();
  const isCompany = user?.role === "company";

  const [offers, setOffers] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState(null);

  const [search, setSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [onlyRemote, setOnlyRemote] = useState(false);
  const [onlyPaid, setOnlyPaid] = useState(false);
  const [sortBy, setSortBy] = useState("recent");
  
  // ✅ FAVORIS PERSISTANTS
  const [savedOffers, setSavedOffers] = useState(() => {
    try {
      const saved = localStorage.getItem("talentshare_saved_offers");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false); 

  // Sauvegarder les favoris à chaque modification
  useEffect(() => {
    localStorage.setItem("talentshare_saved_offers", JSON.stringify(savedOffers));
  }, [savedOffers]);

  const flash = (msg, type = "success") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  /* ---------------- Entreprise (rôle company) ---------------- */

  useEffect(() => {
    if (!isCompany) return;

    let cancelled = false;
    setCompanyLoading(true);

    api
      .get("/companies/me")
      .then((res) => {
        if (!cancelled) setCompany(res.data?.data || res.data);
      })
      .catch(() => {
        if (!cancelled) flash("Impossible de charger votre entreprise.", "error");
      })
      .finally(() => {
        if (!cancelled) setCompanyLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isCompany]);

  /* ---------------- Chargement des offres ---------------- */

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/job-offers");
      const data = res.data?.data ?? res.data;
      setOffers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur chargement des offres :", err);
      setOffers([]);
      flash("Impossible de charger les offres pour le moment.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const myOffers = useMemo(() => {
    if (!isCompany) return offers;
    return offers.filter((offer) => String(offer.company_id) === String(company?.id));
  }, [offers, isCompany, company?.id]);

  /* ---------------- Filtrage et tri ---------------- */

  const filteredOffers = useMemo(() => {
    const query = embedded ? sharedSearch.trim().toLowerCase() : search.trim().toLowerCase();
    const cityQuery = citySearch.trim().toLowerCase();

    const result = myOffers.filter((offer) => {
      const companyName = getCompanyName(offer);

      const matchesSearch =
        !query ||
        [
          offer.title,
          offer.description,
          companyName,
          offer.city,
          offer.country,
          OFFER_TYPES[offer.offer_type],
          ...parseCriteria(offer.criteria || offer.technologies).map(String),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesCity =
        !cityQuery ||
        [offer.city, offer.country]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(cityQuery));

      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "internship" && isInternship(offer)) ||
        (typeFilter === "employment" && isEmployment(offer));

      const matchesRemote = !onlyRemote || Boolean(offer.remote);
      const matchesPaid = !onlyPaid || hasValue(offer.salary_min) || hasValue(offer.salary_max);
      
      // ✅ FILTRE FAVORIS
      const matchesSaved = !showSavedOnly || savedOffers.includes(offer.id);

      return matchesSearch && matchesCity && matchesType && matchesRemote && matchesPaid && matchesSaved;
    });

    if (sortBy === "title") {
      result.sort((a, b) => (a.title || "").localeCompare(b.title || "", "fr"));
    } else if (sortBy === "deadline") {
      result.sort((a, b) => {
        if (!a.application_deadline) return 1;
        if (!b.application_deadline) return -1;
        return new Date(a.application_deadline) - new Date(b.application_deadline);
      });
    } else if (sortBy === "match") {
      result.sort((a, b) => Number(b.match_score || 0) - Number(a.match_score || 0));
    } else {
      result.sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    }

    return result;
  }, [myOffers, search, sharedSearch, embedded, citySearch, typeFilter, onlyRemote, onlyPaid, sortBy, showSavedOnly, savedOffers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, citySearch, typeFilter, onlyRemote, onlyPaid, sortBy, showSavedOnly]);

  /* ---------------- Pagination ---------------- */

  const totalPages = Math.max(1, Math.ceil(filteredOffers.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedOffers = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredOffers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOffers, safePage]);

  const hasMatchScores = useMemo(
    () => myOffers.some((offer) => Number(offer.match_score || 0) > 0),
    [myOffers]
  );

  const activeFiltersCount =
    (search.trim() ? 1 : 0) +
    (citySearch.trim() ? 1 : 0) +
    (typeFilter !== "all" ? 1 : 0) +
    (onlyRemote ? 1 : 0) +
    (onlyPaid ? 1 : 0) +
    (showSavedOnly ? 1 : 0);

  const resetFilters = () => {
    setSearch("");
    setCitySearch("");
    setTypeFilter("all");
    setOnlyRemote(false);
    setOnlyPaid(false);
    setShowSavedOnly(false);
    setCurrentPage(1);
  };

  /* ---------------- Actions ---------------- */

  const deleteOffer = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette offre ?")) return;
    try {
      await api.delete(`/job-offers/${id}`);
      flash("Offre supprimée avec succès.");
      await load();
    } catch (err) {
      flash(err.response?.data?.message || "Erreur lors de la suppression.", "error");
    }
  };

  const toggleSaved = (id) => {
    setSavedOffers((current) =>
      current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id]
    );
  };

  const count = filteredOffers.length;

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <Shell>
   <ContentTag className="min-h-screen bg-[#F2F7F5] text-[#0B2A30] dark:bg-[#0B1F33] dark:text-slate-200">
        <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className="grid items-start gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">

            {/* =============== FILTRES =============== */}
            <aside className="lg:sticky lg:top-6">
             <div className="rounded-2xl border border-[#E0EAE5] bg-white p-4 shadow-[0_5px_20px_rgba(11,42,48,0.035)] dark:border-white/10 dark:bg-[#0B1F33] dark:shadow-none">
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
                    <label className="relative block">
                      <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D958A] dark:text-slate-500" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Métier, compétence…"
                        aria-label="Rechercher une offre"
                        className={FIELD}
                      />
                      {search && (
                        <button
                          type="button"
                          onClick={() => setSearch("")}
                          aria-label="Effacer la recherche"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#8AA097] transition hover:bg-[#E8F4ED] hover:text-[#0B2A30] dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </label>

                    <label className="relative block">
                      <MapPin size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D958A] dark:text-slate-500" />
                      <input
                        value={citySearch}
                        onChange={(e) => setCitySearch(e.target.value)}
                        placeholder="Ville ou pays"
                        aria-label="Filtrer par ville ou pays"
                        className={FIELD}
                      />
                      {citySearch && (
                        <button
                          type="button"
                          onClick={() => setCitySearch("")}
                          aria-label="Effacer la ville"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#8AA097] transition hover:bg-[#E8F4ED] hover:text-[#0B2A30] dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </label>
                  </div>

                  <FilterSection title="Type d'offre">
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
                    <FilterPill active={onlyRemote} onClick={() => setOnlyRemote((v) => !v)}>
                      Télétravail
                    </FilterPill>
                    <FilterPill active={onlyPaid} onClick={() => setOnlyPaid((v) => !v)}>
                      Rémunération indiquée
                    </FilterPill>
                  </FilterSection>
                </div>
              </div>
            </aside>

            {/* =============== RÉSULTATS =============== */}
            <section className="min-w-0">
              
              {/* ✅ BARRE COMPACTE AVEC FAVORIS ET TÉLÉTRAVAIL */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E0EAE5] pb-4 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <p className={LABEL} aria-live="polite">
                    {loading
                      ? "Chargement…"
                      : `${count} offre${count > 1 ? "s" : ""} trouvée${count > 1 ? "s" : ""}`}
                  </p>
                  
                <button
                  onClick={() => setShowSavedOnly(!showSavedOnly)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                    showSavedOnly 
                      ? "bg-rose-50 text-rose-600 border border-rose-200 shadow-sm dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30" // ✅ Rouge quand actif
                      : "bg-white text-slate-500 border border-[#DFEAE4] hover:bg-slate-50 dark:bg-[#112A3A] dark:text-slate-400 dark:border-white/10 dark:hover:bg-white/5"
                  }`}
                >
                  <Heart size={12} fill={showSavedOnly ? "currentColor" : "none"} />
                  Favoris ({savedOffers.length})
                </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setOnlyRemote(!onlyRemote)}
                    className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition ${
                      onlyRemote
                        ? "border-[#10B981] bg-[#EAF7EF] text-[#11875B] dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "border-[#DFEAE4] bg-white text-[#648076] hover:bg-slate-50 dark:border-white/10 dark:bg-[#112A3A] dark:text-slate-400 dark:hover:bg-white/5"
                    }`}
                  >
                    <Wifi size={14} className={onlyRemote ? "text-[#10B981] dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"} />
                    Télétravail
                  </button>

                  <div className="h-6 w-px bg-[#E0EAE5] mx-1 hidden sm:block dark:bg-white/10"></div>

                  <button
                    type="button"
                    onClick={load}
                    disabled={loading}
                    title="Actualiser les offres"
                    aria-label="Actualiser les offres"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#DFEAE4] bg-white text-[#648076] transition hover:border-[#A8D9BD] hover:text-[#0D9663] disabled:opacity-50 dark:border-white/10 dark:bg-[#112A3A] dark:text-slate-400 dark:hover:border-emerald-500/50 dark:hover:text-emerald-400"
                  >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                  </button>

                  <label className="relative">
                    <span className="sr-only">Trier par</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="h-9 appearance-none rounded-xl border border-[#DFEAE4] bg-white pl-3.5 pr-9 text-xs font-semibold text-[#294840] outline-none transition focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/10 dark:border-white/10 dark:bg-[#112A3A] dark:text-slate-200 dark:focus:border-emerald-500"
                    >
                      {hasMatchScores && <option value="match">Meilleure correspondance</option>}
                      <option value="recent">Plus récentes</option>
                      <option value="deadline">Date limite</option>
                      <option value="title">Ordre alphabétique</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7D958A] dark:text-slate-500" />
                  </label>

                  {isCompany && (
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(true)}
                      disabled={!company || companyLoading}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#0B2A30] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#16463F] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                    >
                      <Plus size={14} />
                      Créer
                    </button>
                  )}
                </div>
              </div>

              {/* Chargement */}
              {loading && (
                <div className="mt-5 grid gap-4 md:grid-cols-2 min-[1700px]:grid-cols-3">
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="animate-pulse rounded-2xl border border-[#E0EAE5] bg-white p-5 dark:border-white/10 dark:bg-[#112A3A]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-[#EAF2ED] dark:bg-white/10" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-2/5 rounded bg-[#EAF2ED] dark:bg-white/10" />
                          <div className="h-2.5 w-1/3 rounded bg-[#EAF2ED] dark:bg-white/10" />
                        </div>
                        <div className="h-9 w-9 rounded-full bg-[#EAF2ED] dark:bg-white/10" />
                      </div>
                      <div className="mt-6 h-4 w-3/4 rounded bg-[#EAF2ED] dark:bg-white/10" />
                      <div className="mt-4 h-3 rounded bg-[#EAF2ED] dark:bg-white/10" />
                      <div className="mt-2 h-3 w-4/5 rounded bg-[#EAF2ED] dark:bg-white/10" />
                      <div className="mt-6 h-12 rounded-xl bg-[#EAF2ED] dark:bg-white/10" />
                    </div>
                  ))}
                </div>
              )}

              {/* État vide */}
              {!loading && paginatedOffers.length === 0 && (
                <div className="mt-5 rounded-2xl border border-dashed border-[#CFE0D5] bg-white px-5 py-16 text-center dark:border-white/20 dark:bg-[#0B1F33]">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F7EE] text-[#139765] dark:bg-emerald-500/10 dark:text-emerald-400">
                    <BriefcaseBusiness size={24} />
                  </div>

                  <h3 className="mt-5 text-lg font-extrabold text-[#0B2A30] dark:text-white">
                    {myOffers.length === 0
                      ? isCompany
                        ? "Aucune offre publiée pour le moment"
                        : "Aucune opportunité pour le moment"
                      : "Aucun résultat trouvé"}
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7A9186] dark:text-slate-400">
                    {myOffers.length === 0
                      ? isCompany
                        ? "Publiez votre première offre pour commencer à rencontrer de nouveaux talents."
                        : "Les nouvelles opportunités apparaîtront ici dès leur publication."
                      : "Essayez un autre mot-clé, une autre ville ou retirez certains filtres."}
                  </p>

                  {myOffers.length > 0 && (
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

              {/* Cartes */}
              {!loading && paginatedOffers.length > 0 && (
                <div className="mt-5 grid items-stretch gap-4 md:grid-cols-2 min-[1700px]:grid-cols-3">
                  {paginatedOffers.map((offer) => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      isCompany={isCompany}
                      saved={savedOffers.includes(offer.id)}
                      onToggleSaved={() => toggleSaved(offer.id)}
                      onDelete={() => deleteOffer(offer.id)}
                      onOpen={() => setSelectedOfferId(offer.id)}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <nav
                  aria-label="Pagination des offres"
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

        {/* NOTIFICATION */}
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

        {/* CRÉATION D'OFFRE */}
        {showCreateModal && company && (
          <CreateOfferModal
            company={company}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              flash("Offre créée avec succès.");
              load();
            }}
          />
        )}

        {/* DÉTAIL D'UNE OFFRE */}
        {selectedOfferId && (
          <JobOfferDetail offerId={selectedOfferId} onClose={() => setSelectedOfferId(null)} />
        )}
      </ContentTag>
    </Shell>
  );
}

/* ============================================================
   FILTRES : section repliable + pastille
============================================================ */

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

/* ============================================================
   ANNEAU DE CORRESPONDANCE
============================================================ */

function MatchRing({ score }) {
  const color = score >= 70 ? "#10B981" : score >= 50 ? "#F59E0B" : "#94A3B8";
  const trackColor = "#E6EEE9";

  return (
    <div
      className="relative flex h-11 w-11 shrink-0 items-center justify-center"
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
      <span className="relative text-[10px] font-extrabold" style={{ color }}>
        {Math.round(score)}%
      </span>
    </div>
  );
}

/* ============================================================
   LOGO ENTREPRISE
============================================================ */

function CompanyLogo({ url, name }) {
  const [failed, setFailed] = useState(false);

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={`Logo ${name}`}
        onError={() => setFailed(true)}
        className="h-12 w-12 shrink-0 rounded-xl border border-[#E2EEE6] object-cover dark:border-white/10"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#E2EEE6] bg-[#EDF8F0] text-sm font-extrabold text-[#11875B] dark:border-white/10 dark:bg-emerald-500/10 dark:text-emerald-400">
      {getInitials(name)}
    </div>
  );
}

function OfferCard({ offer, isCompany, saved, onToggleSaved, onDelete, onOpen }) {
  const companyName = getCompanyName(offer);
  const publishedDate = formatRelativeDate(offer.created_at);
  const deadline = formatDate(offer.application_deadline);

  const salary = formatSalary(offer.salary_min, offer.salary_max, offer.currency || offer.salary_currency);
  const techs = parseCriteria(offer.criteria || offer.technologies);
  const offerType = OFFER_TYPES[offer.offer_type] || offer.contract_type;
  const location = [offer.city, offer.country].filter(Boolean).join(", ");

  const matchScore = Math.min(100, Math.max(0, Number(offer.match_score || 0)));
  const hasMatch = matchScore > 0;

  const logoUrl = offer.company?.logo_url || offer.company?.logo;

  // ✅ Classes pour le bouton favori (Rond, avec effet Rose/Rouge)
  const favBtnClass = `flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
    saved
      ? "border-rose-200 bg-rose-50 text-rose-500 shadow-sm dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400" // ✅ Rouge/Rose quand sauvegardé
      : "border-slate-200 bg-white text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 dark:border-white/10 dark:bg-[#112A3A] dark:text-slate-500 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
  }`;

  return (
    // ✅ CARTE COMPACTE : max-w-sm, padding réduit
    <article className="group relative flex h-full max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:border-white/10 dark:bg-[#0B1F33] dark:hover:border-emerald-500/30 dark:hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
      <div className="flex flex-1 flex-col p-4">

        {/* 1. ENTREPRISE + ACTIONS */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <CompanyLogo url={logoUrl} name={companyName} />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-slate-900 dark:text-white">{companyName}</p>
              {publishedDate && (
                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                  <Clock3 size={10} />
                  {publishedDate}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {hasMatch && !isCompany && <MatchRing score={matchScore} />}
            {isCompany ? (
              <button onClick={onDelete} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400">
                <Trash2 size={16} />
              </button>
            ) : (
              // ✅ BOUTON FAVORI STYLE PHOTO 2
              <button onClick={onToggleSaved} className={favBtnClass}>
                <Heart size={16} fill={saved ? "currentColor" : "none"} />
              </button>
            )}
          </div>
        </div>

        {/* 2. PUCES */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {offerType && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              {isInternship(offer) ? <GraduationCap size={11} /> : <BriefcaseBusiness size={11} />}
              {offerType}
            </span>
          )}
          {offer.remote && (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
              <Wifi size={11} />
              Télétravail
            </span>
          )}
        </div>

        {/* 3. TITRE */}
        <h3 className="mt-2 line-clamp-2 text-[15px] font-extrabold leading-snug text-slate-900 transition group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-400">
          {offer.title}
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
          {techs.length > 0 ? (
            <>
              {techs.slice(0, 3).map((tech, index) => (
                <span key={index} className="max-w-full truncate rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  {String(tech)}
                </span>
              ))}
              {techs.length > 3 && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-400">
                  +{techs.length - 3}
                </span>
              )}
            </>
          ) : (
             <div className="h-2"></div>
          )}
        </div>

        {/* 6. DESCRIPTION */}
        <p className="mt-2 line-clamp-2 text-[12px] leading-[1.4] text-slate-600 dark:text-slate-400">
          {offer.description || "Découvrez les détails de cette opportunité."}
        </p>

        {/* 7. ENCART RÉMUNÉRATION */}
        <div className="mt-auto pt-3">
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-white/5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-emerald-600 dark:bg-white/10 dark:text-emerald-400">
              <Banknote size={12} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400">Rémunération</p>
              <p className={`truncate text-[11px] font-extrabold ${salary ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>
                {salary || "Non précisée"}
              </p>
            </div>
          </div>
        </div>

        {/* 8. PIED DE CARTE */}
        <div className="mt-3 flex items-end justify-between gap-2 border-t border-slate-100 pt-3 dark:border-white/10">
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400">
              <CalendarDays size={10} />
              Date limite
            </p>
            <p className={`mt-0.5 text-[11px] ${deadline ? "font-bold text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>
              {deadline || "Non précisée"}
            </p>
          </div>

          <button onClick={onOpen} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0B2A30] px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500">
            {isCompany ? "Détails" : "Voir l'offre"}
          
          </button>
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   MODAL DE CRÉATION D'OFFRE
============================================================ */

function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-xs font-bold text-[#36594A] dark:text-slate-300">{label}</label>
      {children}
    </div>
  );
}

function CreateOfferModal({ company, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    offer_type: "internship",
    remote: true,
    country: "Madagascar",
    city: "",
    status: "published",
    application_deadline: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.title.trim().length < 5) {
      setError("Le titre doit contenir au moins 5 caractères.");
      return;
    }

    if (form.description.trim().length < 20) {
      setError("La description doit contenir au moins 20 caractères.");
      return;
    }

    setSaving(true);

    try {
      await api.post("/job-offers", {
        ...form,
        company_id: company.id,
        application_deadline: form.application_deadline || null,
      });

      onSuccess();
    } catch (err) {
      const errors = err.response?.data?.errors;
      const firstError = errors ? Object.values(errors).flat()[0] : null;
      setError(firstError || err.response?.data?.message || "Impossible de publier l'offre.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#092D2D]/55 p-3 backdrop-blur-sm sm:p-5 dark:bg-black/60"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-offer-title"
        className="my-auto max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#DFEBE3] bg-white shadow-[0_25px_80px_rgba(7,38,33,0.25)] dark:border-white/10 dark:bg-[#112A3A] dark:shadow-[0_25px_80px_rgba(0,0,0,0.5)]"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#E6EFE9] bg-white px-5 py-5 sm:px-7 dark:border-white/10 dark:bg-[#112A3A]">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8F7EE] text-[#118957] dark:bg-emerald-500/10 dark:text-emerald-400">
              <FileText size={21} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#159663] dark:text-emerald-400">
                Espace entreprise
              </p>
              <h2 id="create-offer-title" className="mt-1 text-xl font-extrabold text-[#0B2A30] dark:text-white">
                Publier une offre
              </h2>
              <p className="mt-1 truncate text-xs text-[#82968B] dark:text-slate-400">
                {company.name || "Votre entreprise"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Fermer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E1EBE5] text-[#698277] transition hover:border-[#B5DEC5] hover:bg-[#EFF8F2] hover:text-[#0B2A30] disabled:opacity-50 dark:border-white/10 dark:text-slate-400 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-500/10 dark:hover:text-white"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-5 sm:p-7">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400"
            >
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Field label="Intitulé de l'offre *">
            <input
              required
              minLength={5}
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Ex. : Développeur Web Junior"
              className={inputClass}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Type d'offre *">
              <select
                value={form.offer_type}
                onChange={(e) => update("offer_type", e.target.value)}
                className={inputClass}
              >
                <option value="internship">Stage</option>
                <option value="apprenticeship">Alternance</option>
                <option value="junior_mission">Mission junior</option>
                <option value="first_job">Premier emploi</option>
              </select>
            </Field>

            <Field label="Date limite de candidature">
              <input
                type="date"
                value={form.application_deadline}
                onChange={(e) => update("application_deadline", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Description de la mission *">
            <textarea
              required
              minLength={20}
              rows={5}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Présentez la mission, les compétences recherchées et les conditions..."
              className={`${inputClass} resize-y`}
            />
            <p className="mt-1.5 text-right text-[11px] text-[#8A9D92] dark:text-slate-500">
              {form.description.length} caractères · 20 minimum
            </p>
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Ville">
              <input
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                placeholder="Antananarivo"
                className={inputClass}
              />
            </Field>

            <Field label="Pays">
              <input
                value={form.country}
                onChange={(e) => update("country", e.target.value)}
                placeholder="Madagascar"
                className={inputClass}
              />
            </Field>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#DFEBE3] bg-[#F6FAF7] p-4 transition hover:border-[#B5DEC5] dark:border-white/10 dark:bg-[#0B1F33] dark:hover:border-emerald-500/30">
            <input
              type="checkbox"
              checked={form.remote}
              onChange={(e) => update("remote", e.target.checked)}
              className="h-4 w-4 accent-[#10B981]"
            />
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#139765] dark:bg-white/10 dark:text-emerald-400">
              <Wifi size={18} />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-bold text-[#23483A] dark:text-slate-200">Télétravail possible</span>
              <span className="mt-1 block text-xs leading-5 text-[#82968A] dark:text-slate-400">
                Le poste peut être effectué à distance.
              </span>
            </span>
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-[#E7EFE9] pt-5 sm:flex-row sm:justify-end dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-[#DDE9E1] px-5 py-3 text-sm font-bold text-[#5C7769] transition hover:bg-[#F5F9F6] disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B2A30] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#176348] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              {saving ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Publication...
                </>
              ) : (
                <>
                  <Plus size={17} />
                  Publier l'offre
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}