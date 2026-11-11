import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Building2,
  User,
  Banknote,
  CalendarDays,
  ArrowUpRight,
  Plus,
  Wifi,
  Clock3,
  Bookmark,
  Flame,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
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
  asArray,
  daysSince,
  formatDate,
  formatRelativeDate,
  hasValue,
  useSavedIds,
  useToast,
} from "../components/explorer/ExplorerKit";

/* ============================================================
   CONFIGURATION
============================================================ */

const ITEMS_PER_PAGE = 9;

const MISSION_LABELS = {
  mission: "Mission ponctuelle",
  staffing: "Mise à disposition",
  freelance: "Prestation freelance",
};

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

/* ============================================================
   HELPERS
============================================================ */

const formatBudget = (min, max) => {
  const hasMin = hasValue(min);
  const hasMax = hasValue(max);
  if (!hasMin && !hasMax) return null;

  const fmt = (value) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(Number(value));

  if (hasMin && hasMax) return `${fmt(min)} – ${fmt(max)} € / jour`;
  if (hasMin) return `Dès ${fmt(min)} € / jour`;
  return `Jusqu'à ${fmt(max)} € / jour`;
};

const getBudgetValue = (request) => {
  if (hasValue(request.budget_max)) return Number(request.budget_max);
  if (hasValue(request.budget_min)) return Number(request.budget_min);
  return null;
};

const getAuthorName = (request) => request.company?.name || request.author?.name || "Utilisateur";

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

const getSkillName = (skill) => (typeof skill === "string" ? skill : skill?.name || skill?.label || "");

/* ============================================================
   PAGE PRINCIPALE
============================================================ */

export default function BrowseResourceRequests({ embedded = false, sharedSearch = "", onCountChange } = {}) {
  const Shell = embedded ? React.Fragment : AppShell;
  const ContentTag = embedded ? "div" : "main";
  const { user } = useAuth();

  const isTalent = user?.role === "employee" || user?.role === "student";
  const canPublish = user && (user.role === "company" || user.role === "employee");

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, flash, closeToast] = useToast();

  const [search, setSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [onlyUrgent, setOnlyUrgent] = useState(false);
  const [onlyRemote, setOnlyRemote] = useState(false);
  const [budgetFilter, setBudgetFilter] = useState("");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [sortBy, setSortBy] = useState(isTalent ? "match" : "recent");
  const [view, setView] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [savedRequests, toggleSaved] = useSavedIds(`talentshare_saved_requests_${user?.id || "guest"}`);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get(isTalent ? "/resource-requests/matching-for-me" : "/resource-requests");
      setRequests(asArray(res.data));
    } catch (error) {
      console.error("Erreur chargement :", error);
      setRequests([]);
      flash("Impossible de charger les demandes pour le moment.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const activeQuery = embedded ? sharedSearch : search;

  const filteredRequests = useMemo(() => {
    const query = activeQuery.trim().toLowerCase();
    const cityQuery = citySearch.trim().toLowerCase();
    const budgetRule = BUDGET_OPTIONS.find((option) => option.id === budgetFilter);

    const result = requests.filter((request) => {
      if (request.display_status === 'filled') return false;

      const searchableFields = [
        request.title,
        request.description,
        getAuthorName(request),
        request.city,
        request.country,
        MISSION_LABELS[request.mission_type],
        ...asArray(request.skills).map(getSkillName),
      ];

      const matchesSearch =
        !query || searchableFields.filter(Boolean).some((value) => String(value).toLowerCase().includes(query));

      const matchesCity =
        !cityQuery ||
        [request.city, request.country].filter(Boolean).some((value) => String(value).toLowerCase().includes(cityQuery));

      const isTalentRequest = request.author_type === "talent";
      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "company" && !isTalentRequest) ||
        (typeFilter === "talent" && isTalentRequest);

      const matchesUrgent = !onlyUrgent || request.urgency === "urgent";
      const matchesRemote = !onlyRemote || Boolean(request.remote);

      const budgetValue = getBudgetValue(request);
      const matchesBudget = !budgetRule || (budgetValue !== null && budgetRule.test(budgetValue));

      const matchesSaved = !showSavedOnly || savedRequests.includes(request.id);

      return matchesSearch && matchesCity && matchesType && matchesUrgent && matchesRemote && matchesBudget && matchesSaved;
    });

    if (sortBy === "match") {
      result.sort((a, b) => Number(b.match_score || 0) - Number(a.match_score || 0));
    } else if (sortBy === "title") {
      result.sort((a, b) => (a.title || "").localeCompare(b.title || "", "fr"));
    } else if (sortBy === "budget") {
      result.sort((a, b) => (getBudgetValue(b) || 0) - (getBudgetValue(a) || 0));
    } else {
      result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }

    return result;
  }, [requests, activeQuery, citySearch, typeFilter, onlyUrgent, onlyRemote, budgetFilter, sortBy, showSavedOnly, savedRequests]);

  useEffect(() => {
    onCountChange?.(loading ? null : filteredRequests.length);
  }, [filteredRequests.length, loading, onCountChange]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeQuery, citySearch, typeFilter, onlyUrgent, onlyRemote, budgetFilter, sortBy, showSavedOnly]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedRequests = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRequests, safePage]);

  const activeItems = [
    !embedded && search.trim() && { label: `« ${search.trim()} »`, onRemove: () => setSearch("") },
    citySearch.trim() && { label: citySearch.trim(), onRemove: () => setCitySearch("") },
    typeFilter !== "all" && {
      label: TYPE_OPTIONS.find((o) => o.id === typeFilter)?.label,
      onRemove: () => setTypeFilter("all"),
    },
    onlyUrgent && { label: "Urgent", onRemove: () => setOnlyUrgent(false) },
    onlyRemote && { label: "Télétravail", onRemove: () => setOnlyRemote(false) },
    budgetFilter && {
      label: BUDGET_OPTIONS.find((o) => o.id === budgetFilter)?.label,
      onRemove: () => setBudgetFilter(""),
    },
    showSavedOnly && { label: "Sauvegardées", onRemove: () => setShowSavedOnly(false) },
  ].filter(Boolean);

  const resetFilters = () => {
    setSearch("");
    setCitySearch("");
    setTypeFilter("all");
    setOnlyUrgent(false);
    setOnlyRemote(false);
    setBudgetFilter("");
    setShowSavedOnly(false);
    setSortBy(isTalent ? "match" : "recent");
    setCurrentPage(1);
  };

  const count = filteredRequests.length;

  return (
    <Shell>
      {!embedded && <ExplorerStyles />}
      <ContentTag className={`${FONT} bg-transparent text-[#131E47] dark:text-slate-200 ${embedded ? "" : "min-h-screen"}`}>
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
                  active={onlyUrgent}
                  onClick={() => setOnlyUrgent((value) => !value)}
                  icon={Flame}
                  tone="rose"
                >
                  Urgent
                </QuickChip>

                <QuickChip
                  active={onlyRemote}
                  onClick={() => setOnlyRemote((value) => !value)}
                  icon={Wifi}
                >
                  Télétravail
                </QuickChip>

                <QuickChip
                  active={showSavedOnly}
                  onClick={() => setShowSavedOnly((value) => !value)}
                  icon={Bookmark}
                  tone="amber"
                >
                  Sauvegardées ({savedRequests.length})
                </QuickChip>
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
                  {isTalent && (
                    <option value="match">Meilleure correspondance</option>
                  )}
                  <option value="recent">Plus récentes</option>
                  <option value="budget">Budget décroissant</option>
                  <option value="title">Ordre alphabétique</option>
                </SelectBox>

                <ViewToggle value={view} onChange={setView} />

                <IconButton
                  onClick={() => load(true)}
                  disabled={loading || refreshing}
                  spinning={refreshing}
                  label="Actualiser les demandes"
                />

                {canPublish && (
                  <Link
                    to="/resource-requests/new"
                    className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-xl bg-[#102B43] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#0F9691] dark:bg-[#0F9691] dark:hover:bg-[#16B8B1]"
                  >
                    <Plus size={14} className="mr-2" />
                    Nouvelle demande
                  </Link>
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
                  demande{count > 1 ? "s" : ""} trouvée{count > 1 ? "s" : ""}
                </>
              )}
            </p>
            <ActiveFilters items={activeItems} onReset={resetFilters} />
          </div>

          {/* =============== CONTENU =============== */}
          {loading && <SkeletonCards view={view} />}

          {!loading && paginatedRequests.length === 0 && (
            <EmptyState
              icon={Search}
              title={requests.length === 0 ? "Aucune demande disponible" : "Aucun résultat trouvé"}
              text={
                requests.length === 0
                  ? "Les demandes publiées apparaîtront ici dès qu'elles seront disponibles."
                  : "Essayez d'autres mots-clés ou retirez certains filtres pour élargir votre recherche."
              }
              actionLabel="Effacer les filtres"
              onAction={requests.length > 0 ? resetFilters : undefined}
            />
          )}

          {!loading && paginatedRequests.length > 0 && (
            <ResultsGrid view={view}>
              {paginatedRequests.map((request, index) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  view={view}
                  index={index}
                  saved={savedRequests.includes(request.id)}
                  onToggleSaved={() => toggleSaved(request.id)}
                />
              ))}
            </ResultsGrid>
          )}

          {!loading && (
            <Pagination page={safePage} totalPages={totalPages} onChange={setCurrentPage} label="Pagination des demandes" />
          )}
        </div>

        <FilterDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          activeCount={activeItems.length}
          onReset={resetFilters}
          resultCount={count}
        >
          <DrawerSection title="Type de demande">
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
              <OptionPill active={onlyUrgent} onClick={() => setOnlyUrgent((v) => !v)}>
                Urgent
              </OptionPill>
              <OptionPill active={onlyRemote} onClick={() => setOnlyRemote((v) => !v)}>
                Télétravail
              </OptionPill>
              <OptionPill active={showSavedOnly} onClick={() => setShowSavedOnly((v) => !v)}>
                Mes sauvegardes
              </OptionPill>
            </div>
          </DrawerSection>

          <DrawerSection title="Budget journalier">
            <div className="flex flex-wrap gap-2">
              {BUDGET_OPTIONS.map((option) => (
                <OptionPill
                  key={option.id}
                  active={budgetFilter === option.id}
                  onClick={() => setBudgetFilter((current) => (current === option.id ? "" : option.id))}
                >
                  {option.label}
                </OptionPill>
              ))}
            </div>
          </DrawerSection>

          <DrawerSection title="Localisation">
            <SearchField value={citySearch} onChange={setCitySearch} placeholder="Ville ou pays" icon={MapPin} />
          </DrawerSection>
        </FilterDrawer>

        <Toast toast={toast} onClose={closeToast} />
      </ContentTag>
    </Shell>
  );
}

const MISSION_ICON_TONE = "slate";

function RequestCard({ request, view, index, saved, onToggleSaved }) {
  const list = view === "list";

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

  const positionsLeft = request.remaining_positions !== undefined 
    ? request.remaining_positions 
    : (request.positions_count || 1);

  const period =
    startDate && endDate
      ? `${startDate} → ${endDate}`
      : startDate
        ? `Dès le ${startDate}`
        : endDate
          ? `Jusqu'au ${endDate}`
          : null;

  const age = daysSince(request.created_at);
  const isNew = age !== null && age <= 3;

  const delay = { animationDelay: `${Math.min(index, 8) * 45}ms` };

  const accent = isTalent ? "from-indigo-400 to-indigo-600" : "from-[#16B8B1] to-[#0F9691]";

  const saveButton = (
    <button
      type="button"
      onClick={onToggleSaved}
      aria-pressed={saved}
      aria-label={saved ? "Retirer des sauvegardes" : "Sauvegarder la demande"}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-200 active:scale-90 ${
        saved
          ? "border-amber-200 bg-amber-50 text-amber-500 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400"
          : "border-slate-200 bg-white text-slate-400 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-500 dark:border-white/10 dark:bg-[#1A2650] dark:text-slate-500 dark:hover:border-amber-500/30 dark:hover:bg-amber-500/10 dark:hover:text-amber-400"
      }`}
    >
      <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
    </button>
  );

  const badges = (
    <div className="flex flex-wrap gap-1.5">
      <StatusBadge tone={isTalent ? "indigo" : "teal"}>
        {isTalent ? <User size={11} /> : <Building2 size={11} />}
        {isTalent ? "Talent" : "Entreprise"}
      </StatusBadge>
      {request.mission_type && MISSION_LABELS[request.mission_type] && (
        <StatusBadge tone={MISSION_ICON_TONE}>{MISSION_LABELS[request.mission_type]}</StatusBadge>
      )}
      {isUrgent && (
        <StatusBadge tone="rose">
          <span className="h-1 w-1 rounded-full bg-rose-500" />
          Urgent
        </StatusBadge>
      )}
      {isRemote && (
        <StatusBadge tone="slate">
          <Wifi size={11} />
          Télétravail
        </StatusBadge>
      )}
      {positionsLeft > 0 && (
        <StatusBadge tone="amber">
          <Users size={11} />
          {positionsLeft} poste{positionsLeft > 1 ? "s" : ""} dispo
        </StatusBadge>
      )}
    </div>
  );

  const openLink = (
    <Link
      to={`/resource-requests/${request.id}`}
      className={`group/btn inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#0B1F33] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#0F9691] dark:bg-[#0F9691] dark:hover:bg-[#16B8B1] ${
        list ? "" : "w-full"
      }`}
    >
      Voir la demande
      <ArrowUpRight size={14} className="transition group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
    </Link>
  );

  const articleBase =
    "ts-rise group relative overflow-hidden rounded-2xl border border-[#E4EBF1] bg-white shadow-sm transition-all duration-200 hover:border-[#A9E3E0] hover:shadow-md dark:border-white/10 dark:bg-[#131E47] dark:hover:border-[#16B8B1]/30 dark:hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]";

  if (list) {
    return (
      <article style={delay} className={`${articleBase} flex flex-col gap-4 p-4 md:flex-row md:items-center`}>
        <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${accent}`} />

        <div className="flex min-w-0 flex-1 items-center gap-3.5 pl-1.5">
          <Avatar url={avatarUrl} name={authorName} tone={isTalent ? "indigo" : "teal"} />
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-[#6B7F95] dark:text-slate-400">
              <span className="truncate font-bold text-slate-900 dark:text-white">{authorName}</span>
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
              {request.title || "Demande sans titre"}
            </h3>
            <div className="mt-1.5">{badges}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:w-[400px]">
          <InfoTile icon={Banknote} label="Budget journalier" value={budget || "À définir"} muted={!budget} />
          <InfoTile icon={CalendarDays} label="Période" value={period || "Non précisée"} muted={!period} />
        </div>

        <div className="flex items-center justify-between gap-2 md:justify-end">
          {hasMatch && <MatchRing score={matchScore} />}
          {saveButton}
          {openLink}
        </div>
      </article>
    );
  }

  return (
    <article style={delay} className={`${articleBase} flex h-full flex-col`}>
      <span aria-hidden="true" className={`h-1 w-full bg-gradient-to-r ${accent}`} />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar url={avatarUrl} name={authorName} tone={isTalent ? "indigo" : "teal"} />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-slate-900 dark:text-white">{authorName}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <Clock3 size={10} />
                {isTalent ? "Talent" : "Entreprise"}
                {publishedDate ? ` · ${publishedDate}` : ""}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {hasMatch && <MatchRing score={matchScore} />}
            {saveButton}
          </div>
        </div>

        <div className="mt-4">{badges}</div>

        <h3 className="mt-3 line-clamp-2 text-base font-extrabold leading-snug text-slate-900 transition group-hover:text-[#0F9691] dark:text-white dark:group-hover:text-[#16B8B1]">
          {request.title || "Demande sans titre"}
        </h3>

        {location && (
          <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <MapPin size={12} className="text-[#0F9691] dark:text-[#16B8B1]" />
            {location}
          </p>
        )}

        {skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="max-w-full truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              >
                {skill}
              </span>
            ))}
            {skills.length > 3 && (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-400">
                +{skills.length - 3}
              </span>
            )}
          </div>
        )}

        <p className="mt-3 line-clamp-2 text-[13px] leading-5 text-slate-600 dark:text-slate-400">
          {request.description || "Consultez les détails de cette demande."}
        </p>

        <div className="mt-auto grid grid-cols-1 gap-2 pt-4 min-[420px]:grid-cols-2">
          <InfoTile icon={Banknote} label="Budget journalier" value={budget || "À définir"} muted={!budget} />
          <InfoTile icon={CalendarDays} label="Période" value={period || "Non précisée"} muted={!period} />
        </div>

        <div className="mt-4">{openLink}</div>
      </div>
    </article>
  );
}