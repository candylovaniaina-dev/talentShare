import React, { useEffect, useMemo, useState } from "react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Heart, MapPin, BriefcaseBusiness, CalendarDays, ArrowUpRight,
  Wifi, GraduationCap, Trash2, Clock3, Banknote, Hourglass
} from "lucide-react";
import JobOfferDetail from "./JobOfferDetail";
import {
  ExplorerStyles, FONT, LABEL, AnimatedNumber, Avatar,
  EmptyState, InfoTile, MatchRing, Pagination, ResultsGrid, SkeletonCards, StatusBadge,
  Toast, daysSince, daysUntil, formatDate, formatRelativeDate, hasValue, useSavedIds, useToast
} from "../components/explorer/ExplorerKit";

const OFFER_TYPES = {
  internship: "Stage", apprenticeship: "Alternance", fixed_term: "CDD",
  permanent: "Recrutement permanent", first_job: "Recrutement permanent",
  junior_mission: "Mission junior", freelance: "Freelance", student_project: "Projet étudiant",
};
const ITEMS_PER_PAGE = 9;

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
    try { const p = JSON.parse(value || "[]"); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  return [];
};
const isInternship = (offer) => ["internship", "apprenticeship"].includes(offer.offer_type);

export default function JobOffers({ 
  embedded = false, 
  sharedSearch = "", 
  externalView = "grid", 
  externalSort = "recent", 
  refreshKey = 0,
  // ✅ RÉCEPTION DES FILTRES
  externalCitySearch = "",
  externalOnlyRemote = false,
  externalOnlyPaid = false,
  externalShowSavedOnly = false,
  onCountChange
}) {
  const Shell = embedded ? React.Fragment : AppShell;
  const ContentTag = embedded ? "div" : "main";
  const { user } = useAuth();
  const isCompany = user?.role === "company";

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [toast, flash, closeToast] = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [savedOffers, toggleSaved] = useSavedIds(`talentshare_saved_offers_${user?.id || "guest"}`);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/job-offers");
      setOffers(Array.isArray(res.data?.data ?? res.data) ? (res.data?.data ?? res.data) : []);
    } catch { 
      setOffers([]); 
      flash("Erreur de chargement.", "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, [refreshKey]);

  const myOffers = useMemo(() => offers, [offers]);

  // ✅ LOGIQUE DE FILTRAGE COMPLÈTE
  const filteredOffers = useMemo(() => {
    const query = sharedSearch.trim().toLowerCase();
    const cityQuery = externalCitySearch.trim().toLowerCase();

    const result = myOffers.filter((offer) => {
      const companyName = getCompanyName(offer);
      const matchesSearch = !query || [offer.title, offer.description, companyName, offer.city, offer.country].filter(Boolean).some((v) => String(v).toLowerCase().includes(query));
      const matchesCity = !cityQuery || [offer.city, offer.country].filter(Boolean).some((v) => String(v).toLowerCase().includes(cityQuery));
      const matchesRemote = !externalOnlyRemote || Boolean(offer.remote);
      const matchesPaid = !externalOnlyPaid || hasValue(offer.salary_min) || hasValue(offer.salary_max);
      const matchesSaved = !externalShowSavedOnly || savedOffers.includes(offer.id);
      
      return matchesSearch && matchesCity && matchesRemote && matchesPaid && matchesSaved;
    });

    if (externalSort === "title") result.sort((a, b) => (a.title || "").localeCompare(b.title || "", "fr"));
    else if (externalSort === "deadline") result.sort((a, b) => (!a.application_deadline ? 1 : !b.application_deadline ? -1 : new Date(a.application_deadline) - new Date(b.application_deadline)));
    else result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    return result;
  }, [myOffers, sharedSearch, externalCitySearch, externalOnlyRemote, externalOnlyPaid, externalShowSavedOnly, externalSort, savedOffers]);

  // Remonte le nombre de résultats
  useEffect(() => { onCountChange?.(loading ? 0 : filteredOffers.length); }, [filteredOffers.length, loading, onCountChange]);
  useEffect(() => { setCurrentPage(1); }, [sharedSearch, externalCitySearch, externalOnlyRemote, externalOnlyPaid, externalShowSavedOnly, externalSort]);

  const totalPages = Math.max(1, Math.ceil(filteredOffers.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedOffers = useMemo(() => filteredOffers.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE), [filteredOffers, safePage]);

  const deleteOffer = async (id) => {
    if (!window.confirm("Supprimer cette offre ?")) return;
    try { await api.delete(`/job-offers/${id}`); flash("Offre supprimée."); await load(); } catch (err) { flash("Erreur.", "error"); }
  };

  const count = filteredOffers.length;

  return (
    <Shell>
      {!embedded && <ExplorerStyles />}
      <ContentTag className={`${FONT} bg-transparent text-[#131E47] dark:text-slate-200 ${embedded ? "" : "min-h-screen"}`}>
        <div className={`mx-auto w-full max-w-[1680px] ${embedded ? "" : "px-4 py-6 sm:px-7 lg:px-10"}`}>
          
          <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-1 ${embedded ? "mb-3" : "mt-4"}`}>
            <p className={LABEL} aria-live="polite">
              {loading ? "Chargement…" : <><span className="text-sm font-extrabold normal-case tracking-normal text-[#0B1F33] dark:text-white"><AnimatedNumber value={count} /></span> offre{count > 1 ? "s" : ""} trouvée{count > 1 ? "s" : ""}</>}
            </p>
          </div>

          {loading && <SkeletonCards view={externalView} />}
          {!loading && paginatedOffers.length === 0 && <EmptyState icon={BriefcaseBusiness} title="Aucun résultat" text="Essayez d'autres mots-clés." />}
          {!loading && paginatedOffers.length > 0 && (
            <ResultsGrid view={externalView}>
              {paginatedOffers.map((offer, index) => (
                <OfferCard key={offer.id} offer={offer} view={externalView} index={index} isCompany={isCompany} saved={savedOffers.includes(offer.id)} onToggleSaved={() => toggleSaved(offer.id)} onDelete={() => deleteOffer(offer.id)} onOpen={() => setSelectedOfferId(offer.id)} />
              ))}
            </ResultsGrid>
          )}
          {!loading && <Pagination page={safePage} totalPages={totalPages} onChange={setCurrentPage} label="Pagination" />}
        </div>

        <Toast toast={toast} onClose={closeToast} />
        {selectedOfferId && <JobOfferDetail offerId={selectedOfferId} onClose={() => setSelectedOfferId(null)} />}
      </ContentTag>
    </Shell>
  );
}

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

  const age = daysSince(offer.created_at);
  const isNew = age !== null && age <= 3;
  const daysLeft = daysUntil(offer.application_deadline);
  const closingSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
  const expired = daysLeft !== null && daysLeft < 0;
  const deadlineHint = closingSoon ? (daysLeft === 0 ? "Dernier jour" : `Plus que ${daysLeft} j`) : null;

  const delay = { animationDelay: `${Math.min(index, 8) * 45}ms` };

  const favButton = isCompany ? (
    <button type="button" onClick={onDelete} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"><Trash2 size={16} /></button>
  ) : (
    <button type="button" onClick={onToggleSaved} aria-pressed={saved} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-200 active:scale-90 ${saved ? "border-rose-200 bg-rose-50 text-rose-500 shadow-sm dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400" : "border-slate-200 bg-white text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 dark:border-white/10 dark:bg-[#1A2650] dark:text-slate-500"}`}><Heart size={16} fill={saved ? "currentColor" : "none"} /></button>
  );

  const badges = (
    <div className="flex flex-wrap gap-1.5">
      {offerType && <StatusBadge tone="teal">{isInternship(offer) ? <GraduationCap size={11} /> : <BriefcaseBusiness size={11} />}{offerType}</StatusBadge>}
      {offer.remote && <StatusBadge tone="slate"><Wifi size={11} />Télétravail</StatusBadge>}
      {isNew && <StatusBadge tone="indigo">Nouveau</StatusBadge>}
      {closingSoon && <StatusBadge tone="amber"><Hourglass size={11} />{deadlineHint}</StatusBadge>}
      {expired && <StatusBadge tone="rose">Clôturée</StatusBadge>}
    </div>
  );

  const openButton = (
    <button type="button" onClick={onOpen} className={`group/btn inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#0B1F33] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#0F9691] dark:bg-[#0F9691] dark:hover:bg-[#16B8B1] ${list ? "" : "w-full"}`}>
      {isCompany ? "Détails" : "Voir l'offre"} 
    </button>
  );

  const articleBase = "ts-rise group relative overflow-hidden rounded-2xl border border-[#E4EBF1] bg-white shadow-sm transition-all duration-200 hover:border-[#A9E3E0] hover:shadow-md dark:border-white/10 dark:bg-[#131E47] dark:hover:border-[#16B8B1]/30 dark:hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]";

  if (list) {
    return (
      <article style={delay} className={`${articleBase} flex flex-col gap-4 p-4 md:flex-row md:items-center`}>
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#16B8B1] to-[#0F9691]" />
        <div className="flex min-w-0 flex-1 items-center gap-3.5 pl-1.5">
          <Avatar url={logoUrl} name={companyName} />
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-[#6B7F95] dark:text-slate-400">
              <span className="truncate font-bold text-slate-900 dark:text-white">{companyName}</span>
              {publishedDate && <span className="inline-flex items-center gap-1"><Clock3 size={10} />{publishedDate}</span>}
              {location && <span className="inline-flex items-center gap-1"><MapPin size={11} className="text-[#0F9691] dark:text-[#16B8B1]" />{location}</span>}
            </p>
            <h3 className="mt-0.5 truncate text-[15px] font-extrabold text-slate-900 transition group-hover:text-[#0F9691] dark:text-white dark:group-hover:text-[#16B8B1]">{offer.title}</h3>
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

  return (
    <article style={delay} className={`${articleBase} flex h-full flex-col`}>
      <span aria-hidden="true" className="h-1 w-full bg-gradient-to-r from-[#16B8B1] to-[#0F9691]" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar url={logoUrl} name={companyName} />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-slate-900 dark:text-white">{companyName}</p>
              {publishedDate && <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400"><Clock3 size={10} />{publishedDate}</p>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {hasMatch && <MatchRing score={matchScore} />}
            {favButton}
          </div>
        </div>
        <div className="mt-4">{badges}</div>
        <h3 className="mt-3 line-clamp-2 text-base font-extrabold leading-snug text-slate-900 transition group-hover:text-[#0F9691] dark:text-white dark:group-hover:text-[#16B8B1]">{offer.title}</h3>
        {location && <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"><MapPin size={12} className="text-[#0F9691] dark:text-[#16B8B1]" />{location}</p>}
        {techs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {techs.slice(0, 3).map((tech, i) => <span key={`${tech}-${i}`} className="max-w-full truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">{String(tech)}</span>)}
            {techs.length > 3 && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-400">+{techs.length - 3}</span>}
          </div>
        )}
        <p className="mt-3 line-clamp-2 text-[13px] leading-5 text-slate-600 dark:text-slate-400">{offer.description || "Découvrez les détails de cette opportunité."}</p>
        <div className="mt-auto grid grid-cols-1 gap-2 pt-4 min-[420px]:grid-cols-2">
          <InfoTile icon={Banknote} label="Rémunération" value={salary || "Non précisée"} muted={!salary} />
          <InfoTile icon={CalendarDays} label="Date limite" value={deadline || "Non précisée"} muted={!deadline} tone={closingSoon ? "amber" : undefined} />
        </div>
        <div className="mt-4">{openButton}</div>
      </div>
    </article>
  );
}