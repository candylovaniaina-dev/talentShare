import React, { useEffect, useMemo, useState } from "react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  X,
  Heart,
  MapPin,
  BriefcaseBusiness,
  CalendarDays,
  ArrowUpRight,
  Plus,
  Wifi,
  GraduationCap,
  Trash2,
  Clock3,
  Banknote,
  Sparkles,
  Hourglass,
} from "lucide-react";
import JobOfferDetail from "./JobOfferDetail";
import CreateOfferModal from "../components/publications/CreateJobOfferModal";
import {
  ExplorerStyles,
  FONT,
  LABEL,
  AnimatedNumber,
  ActiveFilters,
  Avatar,
  DrawerSection,
  EmptyState,
  FilterDrawer,
  FiltersButton,
  IconButton,
  InfoTile,
  MatchRing,
  OptionPill,
  Pagination,
  QuickChip,
  ResultsGrid,
  SearchField,
  SelectBox,
  SkeletonCards,
  StatusBadge,
  Toast,
  ViewToggle,
  daysSince,
  daysUntil,
  formatDate,
  formatRelativeDate,
  hasValue,
  useSavedIds,
  useToast,
} from "../components/explorer/ExplorerKit";

/* ============================================================
   CONFIGURATION
============================================================ */

const OFFER_TYPES = {
  internship: "Stage",
  apprenticeship: "Alternance",
  fixed_term: "CDD",
  permanent: "Recrutement permanent",
  first_job: "Recrutement permanent",
  junior_mission: "Mission junior",
  freelance: "Freelance",
  student_project: "Projet étudiant",
};

const TYPE_OPTIONS = [
  { id: "all", label: "Tous les recrutements" },
  { id: "internship", label: "Stages et alternances" },
  { id: "employment", label: "Emplois permanents" },
];

const ITEMS_PER_PAGE = 9;

/* ============================================================
   HELPERS
============================================================ */

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

const getCompanyName = (offer) => offer.company?.name || offer.company_name || "Entreprise partenaire";

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

export default function JobOffers({ embedded = false, sharedSearch = "", onCountChange }) {
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
  const [toast, flash, closeToast] = useToast();

  const [search, setSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [onlyRemote, setOnlyRemote] = useState(false);
  const [onlyPaid, setOnlyPaid] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("recent");
  const [view, setView] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Favoris persistants par utilisateur
  const [savedOffers, toggleSaved] = useSavedIds(`talentshare_saved_offers_${user?.id || "guest"}`);

  /* ---------------- Entreprise (rôle company) ---------------- */

  useEffect(() => {
    if (!isCompany) return undefined;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myOffers = useMemo(() => {
    if (!isCompany) return offers;
    return offers.filter((offer) => String(offer.company_id) === String(company?.id));
  }, [offers, isCompany, company?.id]);

  /* ---------------- Filtrage et tri ---------------- */

  const activeQuery = embedded ? sharedSearch : search;

  const filteredOffers = useMemo(() => {
    const query = activeQuery.trim().toLowerCase();
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
        [offer.city, offer.country].filter(Boolean).some((value) => String(value).toLowerCase().includes(cityQuery));

      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "internship" && isInternship(offer)) ||
        (typeFilter === "employment" && isEmployment(offer));

      const matchesRemote = !onlyRemote || Boolean(offer.remote);
      const matchesPaid = !onlyPaid || hasValue(offer.salary_min) || hasValue(offer.salary_max);
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
      result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }

    return result;
  }, [myOffers, activeQuery, citySearch, typeFilter, onlyRemote, onlyPaid, sortBy, showSavedOnly, savedOffers]);

  // Remonte le nombre de résultats à la page Explorer (compteur de l'onglet)
  useEffect(() => {
    onCountChange?.(loading ? null : filteredOffers.length);
  }, [filteredOffers.length, loading, onCountChange]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeQuery, citySearch, typeFilter, onlyRemote, onlyPaid, sortBy, showSavedOnly]);

  /* ---------------- Pagination ---------------- */

  const totalPages = Math.max(1, Math.ceil(filteredOffers.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedOffers = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredOffers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOffers, safePage]);

  const hasMatchScores = useMemo(() => myOffers.some((offer) => Number(offer.match_score || 0) > 0), [myOffers]);

  /* ---------------- Filtres actifs ---------------- */

  const activeItems = [
    !embedded && search.trim() && { label: `« ${search.trim()} »`, onRemove: () => setSearch("") },
    citySearch.trim() && { label: citySearch.trim(), onRemove: () => setCitySearch("") },
    typeFilter !== "all" && {
      label: TYPE_OPTIONS.find((o) => o.id === typeFilter)?.label,
      onRemove: () => setTypeFilter("all"),
    },
    onlyRemote && { label: "Télétravail", onRemove: () => setOnlyRemote(false) },
    onlyPaid && { label: "Rémunérée", onRemove: () => setOnlyPaid(false) },
    showSavedOnly && { label: "Favoris", onRemove: () => setShowSavedOnly(false) },
  ].filter(Boolean);

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

  const count = filteredOffers.length;

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <Shell>
      {!embedded && <ExplorerStyles />}
      <ContentTag
        className={`${FONT} bg-transparent text-[#131E47] dark:text-slate-200 ${embedded ? "" : "min-h-screen"}`}
      >
               <div className={`mx-auto w-full max-w-[1680px] ${embedded ? "" : "px-4 py-6 sm:px-7 lg:px-10"}`}>
       {/* =============== BARRE D'OUTILS UNIFIÉE =============== */}
<div
  className={
    embedded
      ? "pb-3"
      : "rounded-2xl border border-[#DCE5EF] bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#112A3A]"
  }
>
  <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">

    {/* FILTRES RAPIDES */}
    <div className="flex shrink-0 items-center gap-2">
      <QuickChip
        active={onlyRemote}
        onClick={() => setOnlyRemote((value) => !value)}
        icon={Wifi}
      >
        Télétravail
      </QuickChip>

      <QuickChip
        active={onlyPaid}
        onClick={() => setOnlyPaid((value) => !value)}
        icon={Banknote}
      >
        Rémunérée
      </QuickChip>

      {!isCompany && (
        <QuickChip
          active={showSavedOnly}
          onClick={() => setShowSavedOnly((value) => !value)}
          icon={Heart}
          tone="rose"
        >
          Favoris ({savedOffers.length})
        </QuickChip>
      )}
    </div>

    <div className="mx-1 h-7 w-px shrink-0 bg-[#E5EBF2] dark:bg-white/10" />

    {/* FILTRES AVANCÉS ET TRI */}
    <div className="ml-auto flex shrink-0 items-center gap-2">
      <FiltersButton
        count={activeItems.length}
        onClick={() => setDrawerOpen(true)}
      />

      <SelectBox
        value={sortBy}
        onChange={setSortBy}
        label="Trier par"
      >
        {hasMatchScores && (
          <option value="match">Meilleure correspondance</option>
        )}
        <option value="recent">Plus récentes</option>
        <option value="deadline">Date limite</option>
        <option value="title">Ordre alphabétique</option>
      </SelectBox>

      <ViewToggle value={view} onChange={setView} />

      <IconButton
        onClick={load}
        disabled={loading}
        spinning={loading}
        label="Actualiser les offres"
      />

      {isCompany && (
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          disabled={!company || companyLoading}
          className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-xl bg-[#102B43] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#0F9691] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#0F9691] dark:hover:bg-[#16B8B1]"
        >
          <Plus size={14} className="mr-2" />
          Publier une offre
        </button>
      )}
    </div>
  </div>
</div>

          {/* =============== RÉSUMÉ =============== */}
          <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-1 ${embedded ? "mb-3" : "mt-4"}`}>
            <p className={LABEL} aria-live="polite">
              {loading ? (
                "Chargement…"
              ) : (
                <>
                  <span className="text-sm font-extrabold normal-case tracking-normal text-[#0B1F33] dark:text-white">
                    <AnimatedNumber value={count} />
                  </span>{" "}
                  offre{count > 1 ? "s" : ""} trouvée{count > 1 ? "s" : ""}
                </>
              )}
            </p>
            <ActiveFilters items={activeItems} onReset={resetFilters} />
          </div>

          {/* =============== CONTENU =============== */}
          {loading && <SkeletonCards view={view} />}

          {!loading && paginatedOffers.length === 0 && (
            <EmptyState
              icon={BriefcaseBusiness}
              title={
                myOffers.length === 0
                  ? isCompany
                    ? "Aucune offre publiée pour le moment"
                    : "Aucune opportunité pour le moment"
                  : "Aucun résultat trouvé"
              }
              text={
                myOffers.length === 0
                  ? isCompany
                    ? "Publiez votre première offre pour commencer à rencontrer de nouveaux talents."
                    : "Les nouvelles opportunités apparaîtront ici dès leur publication."
                  : "Essayez un autre mot-clé, une autre ville ou retirez certains filtres."
              }
              actionLabel="Effacer les filtres"
              onAction={myOffers.length > 0 ? resetFilters : undefined}
            />
          )}

          {!loading && paginatedOffers.length > 0 && (
            <ResultsGrid view={view}>
              {paginatedOffers.map((offer, index) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  view={view}
                  index={index}
                  isCompany={isCompany}
                  saved={savedOffers.includes(offer.id)}
                  onToggleSaved={() => toggleSaved(offer.id)}
                  onDelete={() => deleteOffer(offer.id)}
                  onOpen={() => setSelectedOfferId(offer.id)}
                />
              ))}
            </ResultsGrid>
          )}

          {!loading && <Pagination page={safePage} totalPages={totalPages} onChange={setCurrentPage} label="Pagination des offres" />}
        </div>

        {/* TIROIR DE FILTRES */}
        <FilterDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          activeCount={activeItems.length}
          onReset={resetFilters}
          resultCount={count}
        >
          <DrawerSection title="Type de recrutement">
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((option) => (
                <OptionPill key={option.id} active={typeFilter === option.id} onClick={() => setTypeFilter(option.id)}>
                  {option.label}
                </OptionPill>
              ))}
            </div>
          </DrawerSection>

          <DrawerSection title="Critères">
            <div className="flex flex-wrap gap-2">
              <OptionPill active={onlyRemote} onClick={() => setOnlyRemote((v) => !v)}>
                Télétravail
              </OptionPill>
              <OptionPill active={onlyPaid} onClick={() => setOnlyPaid((v) => !v)}>
                Rémunération indiquée
              </OptionPill>
              {!isCompany && (
                <OptionPill active={showSavedOnly} onClick={() => setShowSavedOnly((v) => !v)}>
                  Mes favoris
                </OptionPill>
              )}
            </div>
          </DrawerSection>

          <DrawerSection title="Localisation">
            <SearchField value={citySearch} onChange={setCitySearch} placeholder="Ville ou pays" icon={MapPin} />
          </DrawerSection>
        </FilterDrawer>

        <Toast toast={toast} onClose={closeToast} />

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
        {selectedOfferId && <JobOfferDetail offerId={selectedOfferId} onClose={() => setSelectedOfferId(null)} />}
      </ContentTag>
    </Shell>
  );
}

/* ============================================================
   CARTE D'OFFRE (grille ou liste)
============================================================ */

function OfferCard({ offer, view, index, isCompany, saved, onToggleSaved, onDelete, onOpen }) {
  const list = view === "list";

  const companyName = getCompanyName(offer);
  const publishedDate = formatRelativeDate(offer.created_at);
  const deadline = formatDate(offer.application_deadline);
  const salary = formatSalary(offer.salary_min, offer.salary_max, offer.currency || offer.salary_currency);
  const techs = parseCriteria(offer.criteria || offer.technologies);
  const offerType = OFFER_TYPES[offer.offer_type] || offer.contract_type;
  const location = [offer.city, offer.country].filter(Boolean).join(", ");
  const logoUrl = offer.company?.logo_url || offer.company?.logo;

  const matchScore = Math.min(100, Math.max(0, Number(offer.match_score || 0)));
  const hasMatch = matchScore > 0 && !isCompany;

  // Statuts calculés automatiquement
  const age = daysSince(offer.created_at);
  const isNew = age !== null && age <= 3;
  const daysLeft = daysUntil(offer.application_deadline);
  const closingSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
  const expired = daysLeft !== null && daysLeft < 0;
  const deadlineHint = closingSoon
    ? daysLeft === 0
      ? "Dernier jour"
      : `Plus que ${daysLeft} j`
    : null;

  const delay = { animationDelay: `${Math.min(index, 8) * 45}ms` };

  const favButton = isCompany ? (
    <button
      type="button"
      onClick={onDelete}
      aria-label="Supprimer l'offre"
      className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
    >
      <Trash2 size={16} />
    </button>
  ) : (
    <button
      type="button"
      onClick={onToggleSaved}
      aria-pressed={saved}
      aria-label={saved ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-200 active:scale-90 ${
        saved
          ? "border-rose-200 bg-rose-50 text-rose-500 shadow-sm dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400"
          : "border-slate-200 bg-white text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 dark:border-white/10 dark:bg-[#1A2650] dark:text-slate-500 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
      }`}
    >
      <Heart size={16} fill={saved ? "currentColor" : "none"} />
    </button>
  );

  const badges = (
    <div className="flex flex-wrap gap-1.5">
      {offerType && (
        <StatusBadge tone="teal">
          {isInternship(offer) ? <GraduationCap size={11} /> : <BriefcaseBusiness size={11} />}
          {offerType}
        </StatusBadge>
      )}
      {offer.remote && (
        <StatusBadge tone="slate">
          <Wifi size={11} />
          Télétravail
        </StatusBadge>
      )}
      {isNew && (
        <StatusBadge tone="indigo">
       
          Nouveau
        </StatusBadge>
      )}
      {closingSoon && (
        <StatusBadge tone="amber">
          <Hourglass size={11} />
          {deadlineHint}
        </StatusBadge>
      )}
      {expired && <StatusBadge tone="rose">Clôturée</StatusBadge>}
    </div>
  );

  const openButton = (
    <button
      type="button"
      onClick={onOpen}
      className={`group/btn inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#0B1F33] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#0F9691] dark:bg-[#0F9691] dark:hover:bg-[#16B8B1] ${
        list ? "" : "w-full"
      }`}
    >
      {isCompany ? "Détails" : "Voir l'offre"}
      <ArrowUpRight size={14} className="transition group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
    </button>
  );

  const articleBase =
    "ts-rise group relative overflow-hidden rounded-2xl border border-[#E4EBF1] bg-white shadow-sm transition-all duration-200 hover:border-[#A9E3E0] hover:shadow-md dark:border-white/10 dark:bg-[#131E47] dark:hover:border-[#16B8B1]/30 dark:hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]";

  /* ---------------- VUE LISTE ---------------- */
  if (list) {
    return (
      <article style={delay} className={`${articleBase} flex flex-col gap-4 p-4 md:flex-row md:items-center`}>
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#16B8B1] to-[#0F9691]" />

        <div className="flex min-w-0 flex-1 items-center gap-3.5 pl-1.5">
          <Avatar url={logoUrl} name={companyName} />
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-[#6B7F95] dark:text-slate-400">
              <span className="truncate font-bold text-slate-900 dark:text-white">{companyName}</span>
              {publishedDate && (
                <span className="inline-flex items-center gap-1">
                  <Clock3 size={10} />
                  {publishedDate}
                </span>
              )}
              {location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={11} className="text-[#0F9691] dark:text-[#16B8B1]" />
                  {location}
                </span>
              )}
            </p>
            <h3 className="mt-0.5 truncate text-[15px] font-extrabold text-slate-900 transition group-hover:text-[#0F9691] dark:text-white dark:group-hover:text-[#16B8B1]">
              {offer.title}
            </h3>
            <div className="mt-1.5">{badges}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:w-[360px]">
          <InfoTile icon={Banknote} label="Rémunération" value={salary || "Non précisée"} muted={!salary} />
          <InfoTile icon={CalendarDays} label="Date limite" value={deadline || "Non précisée"} muted={!deadline} tone={closingSoon ? "amber" : undefined} />
        </div>

        <div className="flex items-center justify-between gap-2 md:justify-end">
          {hasMatch && <MatchRing score={matchScore} />}
          {favButton}
          {openButton}
        </div>
      </article>
    );
  }

  /* ---------------- VUE GRILLE ---------------- */
  return (
    <article style={delay} className={`${articleBase} flex h-full flex-col`}>
      <span aria-hidden="true" className="h-1 w-full bg-gradient-to-r from-[#16B8B1] to-[#0F9691]" />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar url={logoUrl} name={companyName} />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-slate-900 dark:text-white">{companyName}</p>
              {publishedDate && (
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <Clock3 size={10} />
                  {publishedDate}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {hasMatch && <MatchRing score={matchScore} />}
            {favButton}
          </div>
        </div>

        <div className="mt-4">{badges}</div>

        <h3 className="mt-3 line-clamp-2 text-base font-extrabold leading-snug text-slate-900 transition group-hover:text-[#0F9691] dark:text-white dark:group-hover:text-[#16B8B1]">
          {offer.title}
        </h3>

        {location && (
          <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <MapPin size={12} className="text-[#0F9691] dark:text-[#16B8B1]" />
            {location}
          </p>
        )}

        {techs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {techs.slice(0, 3).map((tech, i) => (
              <span
                key={`${tech}-${i}`}
                className="max-w-full truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              >
                {String(tech)}
              </span>
            ))}
            {techs.length > 3 && (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-400">
                +{techs.length - 3}
              </span>
            )}
          </div>
        )}

        <p className="mt-3 line-clamp-2 text-[13px] leading-5 text-slate-600 dark:text-slate-400">
          {offer.description || "Découvrez les détails de cette opportunité."}
        </p>

        <div className="mt-auto grid grid-cols-1 gap-2 pt-4 min-[420px]:grid-cols-2">
          <InfoTile icon={Banknote} label="Rémunération" value={salary || "Non précisée"} muted={!salary} />
          <InfoTile icon={CalendarDays} label="Date limite" value={deadline || "Non précisée"} muted={!deadline} tone={closingSoon ? "amber" : undefined} />
        </div>

        <div className="mt-4">{openButton}</div>
      </div>
    </article>
  );
}