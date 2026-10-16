import React, { useEffect, useMemo, useState } from "react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  BriefcaseBusiness,
  MapPin,
  Plus,
  X,
  Loader2,
  Home,
  CalendarDays,
  Users,
  Trash2,
  CheckCircle2,
  FileText,
  ChevronRight,
  AlertCircle,
  Search,
  GraduationCap,
  Bookmark,
  SlidersHorizontal,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  ChevronLeft,
  Banknote,
  Clock,
} from "lucide-react";
import JobOfferDetail from "./JobOfferDetail";

const OFFER_TYPES = {
  internship: "Stage",
  apprenticeship: "Alternance",
  junior_mission: "Mission junior",
  first_job: "Emploi",
};

const TYPE_FILTERS = [
  { id: "all", label: "Toutes", icon: SlidersHorizontal },
  { id: "internship", label: "Stage", icon: GraduationCap },
  { id: "employment", label: "Emploi", icon: BriefcaseBusiness },
  { id: "remote", label: "Télétravail", icon: Home },
];

const ITEMS_PER_PAGE = 9;

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
  if (diffDays === 0) return "Publié aujourd'hui";
  if (diffDays === 1) return "Publié hier";
  if (diffDays < 30) return `Publié il y a ${diffDays} jours`;
  return `Publié le ${formatDate(value)}`;
};

const formatSalary = (min, max, currency = "Ar") => {
  if (!min && !max) return null;
  const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n);
  if (min && max) return `${fmt(min)} - ${fmt(max)} ${currency} / mois`;
  if (min) return `À partir de ${fmt(min)} ${currency} / mois`;
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

const isEmployment = (offer) =>
  ["first_job", "junior_mission"].includes(offer.offer_type);

export default function JobOffers() {
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
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [savedOffers, setSavedOffers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const flash = (msg, type = "success") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3500);
  };

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
    return offers.filter(
      (offer) => String(offer.company_id) === String(company?.id)
    );
  }, [offers, isCompany, company?.id]);

  const filteredOffers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const cityQuery = citySearch.trim().toLowerCase();

    const result = myOffers.filter((offer) => {
      const companyName = getCompanyName(offer);
      const matchesSearch =
        !query ||
        [offer.title, offer.description, companyName, offer.city, offer.country, OFFER_TYPES[offer.offer_type]]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesCity =
        !cityQuery ||
        [offer.city, offer.country]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(cityQuery));

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "internship" &&
          ["internship", "apprenticeship"].includes(offer.offer_type)) ||
        (activeFilter === "employment" && isEmployment(offer)) ||
        (activeFilter === "remote" && Boolean(offer.remote));

      return matchesSearch && matchesCity && matchesFilter;
    });

    if (sortBy === "title") {
      result.sort((a, b) => (a.title || "").localeCompare(b.title || "", "fr"));
    } else if (sortBy === "deadline") {
      result.sort((a, b) => {
        if (!a.application_deadline) return 1;
        if (!b.application_deadline) return -1;
        return new Date(a.application_deadline) - new Date(b.application_deadline);
      });
    } else {
      result.sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      );
    }

    return result;
  }, [myOffers, search, citySearch, activeFilter, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, citySearch, activeFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredOffers.length / ITEMS_PER_PAGE));
  const paginatedOffers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOffers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOffers, currentPage]);

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
      current.includes(id)
        ? current.filter((savedId) => savedId !== id)
        : [...current, id]
    );
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1600px] space-y-4 pb-8">

        {/* ============ TITRE COMPACT + ACTIONS ============ */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#079C94]">
              {isCompany ? "ESPACE ENTREPRISE" : "ESPACE TALENT"}
            </p>
            <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-[#102A43] sm:text-2xl">
              {isCompany ? "Mes offres d'emploi" : "Offres de stages & emplois"}
            </h1>
            <p className="mt-0.5 text-xs text-[#71849A]">
              {isCompany
                ? "Publiez vos opportunités et trouvez les bons talents."
                : "Trouvez la prochaine opportunité qui vous correspond."}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
           

            {isCompany && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                disabled={!company || companyLoading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#102A43] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#174461] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={14} />
                Créer une offre
              </button>
            )}
          </div>
        </div>

        {/* ============ RECHERCHE COMPACTE ============ */}
        <section className="rounded-2xl border border-[#E5EDF3] bg-white p-2.5 shadow-sm shadow-[#102A43]/[0.03]">
          <div className="grid gap-2 md:grid-cols-[1.4fr_1fr_auto]">
            <label className="flex min-w-0 items-center gap-2.5 rounded-xl border border-[#E0E9F0] bg-[#FBFDFE] px-3 transition focus-within:border-[#19B8AE] focus-within:ring-2 focus-within:ring-[#19B8AE]/10">
              <Search size={16} className="shrink-0 text-[#7C91A5]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Intitulé, compétence ou entreprise"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-[#102A43] outline-none placeholder:text-[#96A7B8]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Effacer"
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X size={14} />
                </button>
              )}
            </label>

            <label className="flex min-w-0 items-center gap-2.5 rounded-xl border border-[#E0E9F0] bg-[#FBFDFE] px-3 transition focus-within:border-[#19B8AE] focus-within:ring-2 focus-within:ring-[#19B8AE]/10">
              <MapPin size={16} className="shrink-0 text-[#7C91A5]" />
              <input
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="Ville"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-[#102A43] outline-none placeholder:text-[#96A7B8]"
              />
            </label>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCitySearch("");
                setActiveFilter("all");
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#102A43] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#174461]"
            >
              <Search size={15} />
              Rechercher
            </button>
          </div>
        </section>

        {/* ============ FILTRES + TRI ============ */}
        <section className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {TYPE_FILTERS.map((filter) => {
              const Icon = filter.icon;
              const active = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    active
                      ? "border-[#B8F0E8] bg-[#E6FAF6] text-[#087F73]"
                      : "border-[#E3EBF2] bg-white text-[#60778E] hover:border-[#B8F0E8] hover:text-[#087F73]"
                  }`}
                >
                  <Icon size={13} />
                  {filter.label}
                </button>
              );
            })}
          </div>

          <label className="flex items-center gap-2 self-start text-xs text-[#8192A5] sm:self-auto">
            <span>Trier par</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-[#E2EAF1] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#334B63] outline-none focus:border-[#19B8AE]"
            >
              <option value="recent">Plus récentes</option>
              <option value="deadline">Date limite</option>
              <option value="title">Ordre alphabétique</option>
            </select>
          </label>
        </section>

        {/* ============ TITRE LISTE ============ */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold text-[#102A43]">
            {isCompany
              ? "Vos opportunités"
              : `${filteredOffers.length} opportunité${filteredOffers.length > 1 ? "s" : ""} à découvrir`}
          </h2>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold text-[#557087] transition hover:bg-white hover:text-[#087F83] disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>

        {/* ============ GRILLE DES OFFRES ============ */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-[#E5EDF3] bg-white p-5"
              >
                <div className="mb-5 flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/5 rounded bg-slate-100" />
                    <div className="h-2.5 w-1/3 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="mb-3 h-4 w-3/4 rounded bg-slate-100" />
                <div className="h-3 rounded bg-slate-100" />
                <div className="mt-2 h-3 w-4/5 rounded bg-slate-100" />
                <div className="mt-6 h-9 rounded-lg bg-slate-100" />
              </div>
            ))}
          </div>
        ) : paginatedOffers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#CBD9E4] bg-white px-5 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF8F6] text-[#0F9691]">
              <BriefcaseBusiness size={29} strokeWidth={1.7} />
            </div>
            <h3 className="mt-5 text-lg font-extrabold text-[#102A43]">
              {myOffers.length === 0
                ? isCompany
                  ? "Aucune offre publiée pour le moment"
                  : "Aucune opportunité pour le moment"
                : "Aucune offre ne correspond à votre recherche"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7C8FA2]">
              {myOffers.length === 0
                ? isCompany
                  ? "Publiez votre première offre pour commencer à rencontrer de nouveaux talents."
                  : "De nouvelles opportunités apparaîtront ici dès leur publication."
                : "Essayez un autre mot-clé, une autre ville ou retirez certains filtres."}
            </p>
            {myOffers.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCitySearch("");
                  setActiveFilter("all");
                }}
                className="mt-5 rounded-xl bg-[#102A43] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#174461]"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paginatedOffers.map((offer) => {
              const companyName = getCompanyName(offer);
              const saved = savedOffers.includes(offer.id);
              const publishedDate = formatRelativeDate(offer.created_at);
              const deadline = formatDate(offer.application_deadline);
              const salary = formatSalary(
                offer.salary_min,
                offer.salary_max,
                offer.currency || offer.salary_currency
              );
              const techs = parseCriteria(offer.criteria || offer.technologies);

              return (
                <article
                  key={offer.id}
                  className="group flex min-w-0 flex-col rounded-2xl border border-[#E4ECF3] bg-white p-5 shadow-sm shadow-[#102A43]/[0.025] transition duration-200 hover:-translate-y-1 hover:border-[#B5E9E2] hover:shadow-xl hover:shadow-[#102A43]/[0.07]"
                >
                  {/* En-tête */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E5EDF3] bg-gradient-to-br from-[#EAF7FA] to-[#E1F6F0] text-sm font-extrabold text-[#087F83]">
                        {offer.company?.logo_url || offer.company?.logo ? (
                          <img
                            src={offer.company.logo_url || offer.company.logo}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          getInitials(companyName)
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-[#24435D]">
                          {companyName}
                        </p>
                        {publishedDate && (
                          <p className="mt-0.5 text-[11px] text-[#92A2B2]">
                            {publishedDate}
                          </p>
                        )}
                      </div>
                    </div>

                    {isCompany ? (
                      <button
                        type="button"
                        onClick={() => deleteOffer(offer.id)}
                        aria-label="Supprimer"
                        className="rounded-lg p-2 text-[#9AAABA] transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleSaved(offer.id)}
                        aria-label={saved ? "Retirer des favoris" : "Enregistrer"}
                        className={`rounded-lg p-2 transition ${
                          saved
                            ? "bg-[#E5F8F4] text-[#078A80]"
                            : "text-[#8AA0B4] hover:bg-[#F0F8FA] hover:text-[#087F83]"
                        }`}
                      >
                        <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
                      </button>
                    )}
                  </div>

                  {/* Titre */}
                  <h3 className="mt-4 line-clamp-2 text-base font-extrabold leading-snug text-[#102A43] transition group-hover:text-[#087F83]">
                    {offer.title}
                  </h3>

                  {/* Meta */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[#71869A]">
                    {(offer.city || offer.country) && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={13} className="shrink-0 text-[#8299AD]" />
                        {[offer.city, offer.country].filter(Boolean).join(", ")}
                      </span>
                    )}
                    {(OFFER_TYPES[offer.offer_type] || offer.contract_type) && (
                      <span className="inline-flex items-center gap-1.5">
                        <BriefcaseBusiness size={13} className="shrink-0 text-[#8299AD]" />
                        {OFFER_TYPES[offer.offer_type] || offer.contract_type}
                      </span>
                    )}
                  </div>

                  {/* Chips technos */}
                  {techs.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {techs.slice(0, 4).map((tech, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-[#E8F8F5] px-2 py-0.5 text-[10px] font-bold text-[#087F73]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Description */}
                  <p className="mt-3 line-clamp-2 min-h-[40px] text-xs leading-5 text-[#71849A]">
                    {offer.description || "Découvrez les détails de cette opportunité."}
                  </p>

                  {/* Footer */}
                  <div className="mt-auto pt-4">
                    <div className="flex items-center justify-between gap-2 border-t border-[#EDF2F6] pt-3">
                      <div className="min-w-0">
                        {salary && (
                          <p className="flex items-center gap-1.5 text-xs font-bold text-[#102A43]">
                            <Banknote size={13} className="text-[#0F9691]" />
                            <span className="truncate">{salary}</span>
                          </p>
                        )}
                        {deadline && (
                          <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[#8FA2B4]">
                            <Clock size={11} />
                            Jusqu'au {deadline}
                          </p>
                        )}
                      </div>

                      {isCompany ? (
                        <div className="flex items-center gap-1.5 rounded-lg border border-[#E8EEF3] bg-[#F8FAFC] px-2.5 py-1.5 text-xs">
                          <Users size={13} className="text-[#71849A]" />
                          <span className="font-extrabold text-[#102A43]">
                            {offer.applications_count || 0}
                          </span>
                        </div>
                      ) : (
                       <button
  type="button"
  onClick={() => setSelectedOfferId(offer.id)}
  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#102A43] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#087F83]"
>
  Voir l'offre
  
</button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ============ PAGINATION ============ */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Page précédente"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E3EBF2] bg-white text-[#60778E] transition hover:border-[#B8F0E8] hover:text-[#087F73] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                aria-current={currentPage === page ? "page" : undefined}
                className={`flex h-9 min-w-[36px] items-center justify-center rounded-lg px-3 text-xs font-bold transition ${
                  currentPage === page
                    ? "bg-[#0F9691] text-white shadow-sm"
                    : "border border-[#E3EBF2] bg-white text-[#60778E] hover:border-[#B8F0E8] hover:text-[#087F73]"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Page suivante"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E3EBF2] bg-white text-[#60778E] transition hover:border-[#B8F0E8] hover:text-[#087F73] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div
            role="status"
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${
              toast.type === "error"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-teal-200 bg-teal-50 text-teal-800"
            }`}
          >
            {toast.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{toast.msg}</span>
          </div>
        )}
      </div>

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

      {/* ✅ Modal détail offre — DANS le composant */}
      {selectedOfferId && (
        <JobOfferDetail
          offerId={selectedOfferId}
          onClose={() => setSelectedOfferId(null)}
        />
      )}
    </AppShell>
  );
}

/* ============================================================ */
/* MODAL CRÉATION OFFRE */
/* ============================================================ */
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

  const update = (key, value) => setForm((c) => ({ ...c, [key]: value }));

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

  const inputClass =
    "w-full rounded-xl border border-[#DDE7EF] bg-[#FAFCFD] px-3.5 py-3 text-sm text-[#102A43] outline-none transition placeholder:text-[#9AABBA] focus:border-[#14B8A6] focus:ring-4 focus:ring-[#14B8A6]/10";

  const Field = ({ label, icon: Icon, children }) => (
    <div>
      <label className="mb-2 flex items-center gap-2 text-xs font-bold text-[#405B73]">
        {Icon && <Icon size={14} className="text-[#0B9690]" />}
        {label}
      </label>
      {children}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#102A43]/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#E8EEF3] bg-white px-5 py-4 sm:px-7">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#079C94]">
              Espace entreprise
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-[#102A43]">
              Publier une offre
            </h2>
            <p className="mt-1 text-xs text-[#8193A5]">
              {company.name || "Votre entreprise"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-xl border border-[#E4ECF2] p-2 text-[#71849A] transition hover:bg-[#F3F7FA] hover:text-[#102A43]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-5 sm:p-7">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Field label="Intitulé de l'offre *" icon={BriefcaseBusiness}>
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
            <Field label="Type d'offre *" icon={FileText}>
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

            <Field label="Date limite" icon={CalendarDays}>
              <input
                type="date"
                value={form.application_deadline}
                onChange={(e) => update("application_deadline", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Description de la mission *" icon={FileText}>
            <textarea
              required
              minLength={20}
              rows={5}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Présentez la mission, les compétences recherchées et les conditions..."
              className={`${inputClass} resize-y`}
            />
            <p className="mt-1.5 text-right text-[11px] text-[#8799AB]">
              {form.description.length} caractères · 20 minimum
            </p>
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Ville" icon={MapPin}>
              <input
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                placeholder="Antananarivo"
                className={inputClass}
              />
            </Field>
            <Field label="Pays" icon={MapPin}>
              <input
                value={form.country}
                onChange={(e) => update("country", e.target.value)}
                placeholder="Madagascar"
                className={inputClass}
              />
            </Field>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#DFEAF0] bg-[#F8FBFC] p-4">
            <input
              type="checkbox"
              checked={form.remote}
              onChange={(e) => update("remote", e.target.checked)}
              className="h-4 w-4 accent-[#0FADA0]"
            />
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E6F8F5] text-[#078F83]">
              <Home size={17} />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-bold text-[#24435D]">
                Télétravail possible
              </span>
              <span className="mt-0.5 block text-xs text-[#8294A6]">
                Le poste peut être effectué à distance.
              </span>
            </span>
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-[#E8EEF3] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-[#DDE7EF] px-5 py-3 text-sm font-bold text-[#5E7387] transition hover:bg-[#F6F9FB] disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#102A43] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#087F83] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {saving ? "Publication..." : "Publier l'offre"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
