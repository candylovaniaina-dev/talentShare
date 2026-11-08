/* navy-theme */
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
import CreateOfferModal from "../components/publications/CreateJobOfferModal";

/* ============================================================
   CONFIGURATION
============================================================ */

const OFFER_TYPES = {
  internship: "Stage", apprenticeship: "Alternance", fixed_term: "CDD",
  permanent: "Recrutement permanent", first_job: "Recrutement permanent",
  junior_mission: "Mission junior", freelance: "Freelance", student_project: "Projet étudiant",
};
const TYPE_OPTIONS = [
  { id: "all", label: "Tous les recrutements" },
  { id: "internship", label: "Stages et alternances" },
  { id: "employment", label: "Emplois permanents" },
];

const ITEMS_PER_PAGE = 9;

const LABEL =
  "text-[11px] font-medium uppercase tracking-[0.14em] text-[#6B7F95] dark:text-slate-400";

const FIELD =
  "w-full rounded-xl border border-[#E4EBF1] bg-[#F5F8FC] py-3 pl-10 pr-9 text-sm text-[#0B1F33] outline-none transition " +
  "placeholder:text-[#94A3B8] focus:border-[#16B8B1] focus:bg-white focus:ring-4 focus:ring-[#16B8B1]/10 " +
  "dark:border-white/10 dark:bg-[#131E47] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#16B8B1] dark:focus:bg-[#1A2650]";

const inputClass =
  "w-full rounded-xl border border-[#E4EBF1] bg-[#F5F8FC] px-4 py-3 text-sm text-[#0B1F33] outline-none transition placeholder:text-[#94A3B8] focus:border-[#16B8B1] focus:bg-white focus:ring-4 focus:ring-[#16B8B1]/10 dark:border-white/10 dark:bg-[#131E47] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#16B8B1] dark:focus:bg-[#1A2650]";

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

const formatSalary = (min, max, rawCurrency = "Ar") => {
  const currency = rawCurrency === "MGA" ? "Ar" : rawCurrency;
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
  
  // ✅ FAVORIS PERSISTANTS PAR UTILISATEUR
  const [savedOffers, setSavedOffers] = useState(() => {
    try {
      // 👇 On ajoute l'ID de l'utilisateur à la clé
      const key = `talentshare_saved_offers_${user?.id || "guest"}`;
      const saved = localStorage.getItem(key);
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
    try {
      // 👇 On utilise la même clé avec l'ID utilisateur
      const key = `talentshare_saved_offers_${user?.id || "guest"}`;
      localStorage.setItem(key, JSON.stringify(savedOffers));
    } catch {}
  }, [savedOffers, user?.id]);
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
   <ContentTag className="min-h-screen bg-transparent text-[#131E47] dark:bg-transparent dark:text-slate-200">
        <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className="grid items-start gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">

            {/* =============== FILTRES =============== */}
            <aside className="lg:sticky lg:top-6">
             <div className="rounded-2xl border border-[#E4EBF1] bg-white p-4 shadow-[0_5px_20px_rgba(11,42,48,0.035)] dark:border-white/10 dark:bg-[#131E47] dark:shadow-none">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setFiltersOpen((open) => !open)}
                    aria-expanded={filtersOpen}
                    className={`inline-flex items-center gap-2 lg:pointer-events-none ${LABEL}`}
                  >
                    <SlidersHorizontal size={14} className="text-[#0F9691] dark:text-[#16B8B1]" />
                    Filtres
                    {activeFiltersCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#16B8B1] px-1 font-sans text-[11px] font-bold text-white">
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
                      className="text-xs font-bold text-[#0F9691] transition hover:text-[#0B6F6B] dark:text-[#16B8B1] dark:hover:text-[#7FD3CF]"
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>

                <div className={`${filtersOpen ? "block" : "hidden"} lg:block`}>
                  <div className="mt-4 space-y-2.5">
                    <label className="relative block">
                      <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7F95] dark:text-slate-500" />
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
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#6B7F95] transition hover:bg-[#E8F8F7] hover:text-[#0B1F33] dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </label>

                    <label className="relative block">
                      <MapPin size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7F95] dark:text-slate-500" />
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
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#6B7F95] transition hover:bg-[#E8F8F7] hover:text-[#0B1F33] dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </label>
                  </div>

                  <FilterSection title="Type de recrutement">
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
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4EBF1] pb-4 dark:border-white/10">
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
                      : "bg-white text-slate-500 border border-[#E4EBF1] hover:bg-slate-50 dark:bg-[#1A2650] dark:text-slate-400 dark:border-white/10 dark:hover:bg-white/5"
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
                        ? "border-[#16B8B1] bg-[#E8F8F7] text-[#0F9691] dark:border-[#16B8B1]/50 dark:bg-[#16B8B1]/10 dark:text-[#7FD3CF]"
                        : "border-[#E4EBF1] bg-white text-[#6B7F95] hover:bg-slate-50 dark:border-white/10 dark:bg-[#1A2650] dark:text-slate-400 dark:hover:bg-white/5"
                    }`}
                  >
                    <Wifi size={14} className={onlyRemote ? "text-[#16B8B1] dark:text-[#16B8B1]" : "text-slate-400 dark:text-slate-500"} />
                    Télétravail
                  </button>

                  <div className="h-6 w-px bg-[#E4EBF1] mx-1 hidden sm:block dark:bg-white/10"></div>

                  <button
                    type="button"
                    onClick={load}
                    disabled={loading}
                    title="Actualiser les offres"
                    aria-label="Actualiser les offres"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E4EBF1] bg-white text-[#6B7F95] transition hover:border-[#BFE3E0] hover:text-[#0F9691] disabled:opacity-50 dark:border-white/10 dark:bg-[#1A2650] dark:text-slate-400 dark:hover:border-[#16B8B1]/50 dark:hover:text-[#16B8B1]"
                  >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                  </button>

                  <label className="relative">
                    <span className="sr-only">Trier par</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="h-9 appearance-none rounded-xl border border-[#E4EBF1] bg-white pl-3.5 pr-9 text-xs font-semibold text-[#1F3550] outline-none transition focus:border-[#16B8B1] focus:ring-4 focus:ring-[#16B8B1]/10 dark:border-white/10 dark:bg-[#1A2650] dark:text-slate-200 dark:focus:border-[#16B8B1]"
                    >
                      {hasMatchScores && <option value="match">Meilleure correspondance</option>}
                      <option value="recent">Plus récentes</option>
                      <option value="deadline">Date limite</option>
                      <option value="title">Ordre alphabétique</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7F95] dark:text-slate-500" />
                  </label>

                  {isCompany && (
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(true)}
                      disabled={!company || companyLoading}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#0B1F33] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#16324F] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#0F9691] dark:hover:bg-[#16B8B1]"
                    >
                      <Plus size={14} />
                      Publier une offre
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
                      className="animate-pulse rounded-2xl border border-[#E4EBF1] bg-white p-5 dark:border-white/10 dark:bg-[#1A2650]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-[#E4EBF1] dark:bg-white/10" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-2/5 rounded bg-[#E4EBF1] dark:bg-white/10" />
                          <div className="h-2.5 w-1/3 rounded bg-[#E4EBF1] dark:bg-white/10" />
                        </div>
                        <div className="h-9 w-9 rounded-full bg-[#E4EBF1] dark:bg-white/10" />
                      </div>
                      <div className="mt-6 h-4 w-3/4 rounded bg-[#E4EBF1] dark:bg-white/10" />
                      <div className="mt-4 h-3 rounded bg-[#E4EBF1] dark:bg-white/10" />
                      <div className="mt-2 h-3 w-4/5 rounded bg-[#E4EBF1] dark:bg-white/10" />
                      <div className="mt-6 h-12 rounded-xl bg-[#E4EBF1] dark:bg-white/10" />
                    </div>
                  ))}
                </div>
              )}

              {/* État vide */}
              {!loading && paginatedOffers.length === 0 && (
                <div className="mt-5 rounded-2xl border border-dashed border-[#BFE3E0] bg-white px-5 py-16 text-center dark:border-white/20 dark:bg-[#131E47]">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F8F7] text-[#0F9691] dark:bg-[#16B8B1]/10 dark:text-[#16B8B1]">
                    <BriefcaseBusiness size={24} />
                  </div>

                  <h3 className="mt-5 text-lg font-extrabold text-[#0B1F33] dark:text-white">
                    {myOffers.length === 0
                      ? isCompany
                        ? "Aucune offre publiée pour le moment"
                        : "Aucune opportunité pour le moment"
                      : "Aucun résultat trouvé"}
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6B7F95] dark:text-slate-400">
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
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0B1F33] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#16324F] dark:bg-[#0F9691] dark:hover:bg-[#16B8B1]"
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
                    className="flex h-10 items-center gap-1 rounded-xl border border-[#E4EBF1] bg-white px-3 text-xs font-bold text-[#6B7F95] transition hover:border-[#BFE3E0] hover:text-[#0F9691] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-[#1A2650] dark:text-slate-300 dark:hover:border-[#16B8B1]/50 dark:hover:text-[#16B8B1]"
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
                          ? "bg-[#0B1F33] text-white shadow-sm dark:bg-[#0F9691]"
                          : "border border-[#E4EBF1] bg-white text-[#6B7F95] hover:border-[#BFE3E0] hover:text-[#0F9691] dark:border-white/10 dark:bg-[#1A2650] dark:text-slate-300 dark:hover:border-[#16B8B1]/50 dark:hover:text-[#16B8B1]"
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
                    className="flex h-10 items-center gap-1 rounded-xl border border-[#E4EBF1] bg-white px-3 text-xs font-bold text-[#6B7F95] transition hover:border-[#BFE3E0] hover:text-[#0F9691] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-[#1A2650] dark:text-slate-300 dark:hover:border-[#16B8B1]/50 dark:hover:text-[#16B8B1]"
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
            className={`fixed bottom-5 right-5 z-[120] flex max-w-[calc(100vw-2.5rem)] items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 text-sm shadow-[0_12px_40px_rgba(11,42,48,0.15)] dark:bg-[#1A2650] ${
              toast.type === "error"
                ? "border-rose-200 text-rose-700 dark:border-rose-500/30 dark:text-rose-400"
                : "border-[#BFE3E0] text-[#0F9691] dark:border-[#16B8B1]/30 dark:text-[#16B8B1]"
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
              className="ml-1 rounded-lg p-1 text-[#6B7F95] hover:bg-[#F5F8FC] dark:text-slate-500 dark:hover:bg-white/10"
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
    <div className="mt-5 border-t border-[#E4EBF1] pt-4 dark:border-white/10">
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
      className={`w-full rounded-full border px-4 py-2 text-center text-xs transition ${
        active
          ? "border-[#16B8B1] bg-[#E8F8F7] font-semibold text-[#0F9691] dark:border-[#16B8B1]/50 dark:bg-[#16B8B1]/10 dark:text-[#7FD3CF]"
          : "border-[#E4EBF1] bg-white text-[#6B7F95] hover:border-[#BFE3E0] hover:text-[#0F9691] dark:border-white/10 dark:bg-[#1A2650] dark:text-slate-400 dark:hover:border-[#16B8B1]/30 dark:hover:text-[#16B8B1]"
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
  const color = score >= 70 ? "#16B8B1" : score >= 50 ? "#F59E0B" : "#94A3B8";
  const trackColor = "#E4EBF1";

  return (
    <div
      className="relative flex h-11 w-11 shrink-0 items-center justify-center"
      title={`${Math.round(score)}% de correspondance avec votre profil`}
      role="img"
      aria-label={`${Math.round(score)}% de correspondance avec votre profil`}
    >
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-[#E4EBF1] dark:text-white/10" strokeWidth="3" />
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
        className="h-12 w-12 shrink-0 rounded-xl border border-[#E4EBF1] object-cover dark:border-white/10"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#E4EBF1] bg-[#E8F8F7] text-sm font-extrabold text-[#0F9691] dark:border-white/10 dark:bg-[#16B8B1]/10 dark:text-[#16B8B1]">
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
      : "border-slate-200 bg-white text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 dark:border-white/10 dark:bg-[#1A2650] dark:text-slate-500 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
  }`;

  return (
    // ✅ CARTE COMPACTE : max-w-sm, padding réduit
    <article className="group relative flex h-full max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#A9E3E0] hover:shadow-md dark:border-white/10 dark:bg-[#131E47] dark:hover:border-[#16B8B1]/30 dark:hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
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
            <span className="inline-flex items-center gap-1 rounded-md bg-[#E8F8F7] px-2 py-1 text-[10px] font-bold text-[#0F9691] dark:bg-[#16B8B1]/10 dark:text-[#7FD3CF]">
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
        <h3 className="mt-2 line-clamp-2 text-[15px] font-extrabold leading-snug text-slate-900 transition group-hover:text-[#0F9691] dark:text-white dark:group-hover:text-[#16B8B1]">
          {offer.title}
        </h3>

        {/* 4. LIEU */}
        {location && (
          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} className="text-[#0F9691] dark:text-[#16B8B1]" />
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
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-[#0F9691] dark:bg-white/10 dark:text-[#16B8B1]">
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

          <button onClick={onOpen} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0B1F33] px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#0F9691] dark:bg-[#0F9691] dark:hover:bg-[#16B8B1]">
            {isCompany ? "Détails" : "Voir l'offre"}
          
          </button>
        </div>
      </div>
    </article>
  );
}
