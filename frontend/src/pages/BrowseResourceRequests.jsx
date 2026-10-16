import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Search,
  MapPin,
  Plus,
  X,
  Loader2,
  Home,
  CalendarDays,
  Users,
  CheckCircle2,
  FileText,
  ChevronRight,
  AlertCircle,
  SlidersHorizontal,
  Sparkles,
  RefreshCw,
  ChevronLeft,
  Banknote,
  Clock,
  Building2,
  UserRound,
  Zap,
  Layers,
  Eye,
} from "lucide-react";

/* ============================================================
   CONFIG
============================================================ */
const REQUEST_TYPES = {
  company: "Entreprise",
  talent:  "Talent",
};

const TYPE_FILTERS = [
  { id: "all",      label: "Toutes",       icon: SlidersHorizontal },
  { id: "company",  label: "Entreprises",  icon: Building2 },
  { id: "talent",   label: "Talents",      icon: UserRound },
  { id: "urgent",   label: "Urgent",       icon: Zap },
  { id: "remote",   label: "Télétravail",  icon: Home },
];

const ITEMS_PER_PAGE = 9;

/* ============================================================
   HELPERS
============================================================ */
const asArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

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

const formatBudget = (min, max) => {
  if (!min && !max) return null;
  const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n);
  if (min && max) return `${fmt(min)} - ${fmt(max)} € / jour`;
  if (min) return `À partir de ${fmt(min)} € / jour`;
  return `Jusqu'à ${fmt(max)} € / jour`;
};

const getAuthorName = (r) =>
  r.company?.name || r.author?.name || "Utilisateur";

const getInitials = (name = "") =>
  name.split(/\s+/).filter(Boolean).slice(0, 2)
    .map((p) => p[0]?.toUpperCase()).join("") || "TS";

/* ============================================================
   PAGE PRINCIPALE
============================================================ */
export default function BrowseResourceRequests() {
  const { user } = useAuth();
  const isCompany = user?.role === "company";

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [search, setSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [currentPage, setCurrentPage] = useState(1);

  const flash = (msg, type = "success") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/resource-requests");
      const data = asArray(res.data);
      setRequests(data);
    } catch (err) {
      console.error("Erreur chargement des demandes :", err);
      setRequests([]);
      flash("Impossible de charger les demandes pour le moment.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* ============================================================
     FILTRAGE + TRI
  ============================================================ */
  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    const cityQuery = citySearch.trim().toLowerCase();

    const result = requests.filter((r) => {
      const authorName = getAuthorName(r);
      const matchesSearch =
        !query ||
        [r.title, r.description, authorName, r.city, r.country]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(query));

      const matchesCity =
        !cityQuery ||
        [r.city, r.country]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(cityQuery));

      const isTalent = r.author_type === "talent";
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "company" && !isTalent) ||
        (activeFilter === "talent"  && isTalent) ||
        (activeFilter === "urgent"  && r.urgency === "urgent") ||
        (activeFilter === "remote"  && Boolean(r.remote));

      return matchesSearch && matchesCity && matchesFilter;
    });

    if (sortBy === "title") {
      result.sort((a, b) => (a.title || "").localeCompare(b.title || "", "fr"));
    } else if (sortBy === "budget") {
      result.sort((a, b) => {
        const aMax = Number(a.budget_max || a.budget_min || 0);
        const bMax = Number(b.budget_max || b.budget_min || 0);
        return bMax - aMax;
      });
    } else {
      result.sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      );
    }

    return result;
  }, [requests, search, citySearch, activeFilter, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, citySearch, activeFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ITEMS_PER_PAGE));
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRequests, currentPage]);

  const canPublish = user && (user.role === "company" || user.role === "employee");

  /* ============================================================
     RENDU
  ============================================================ */
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
              Demandes de ressources
            </h1>
            <p className="mt-0.5 text-xs text-[#71849A]">
              Découvrez les besoins des entreprises et des talents.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {canPublish && (
              <Link
                to="/resource-requests/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#102A43] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#174461]"
              >
                <Plus size={14} />
                Publier un besoin
              </Link>
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
              <option value="budget">Budget</option>
              <option value="title">Ordre alphabétique</option>
            </select>
          </label>
        </section>

        {/* ============ TITRE LISTE ============ */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold text-[#102A43]">
            {`${filteredRequests.length} demande${filteredRequests.length > 1 ? "s" : ""} à découvrir`}
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

        {/* ============ GRILLE DES DEMANDES ============ */}
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
        ) : paginatedRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#CBD9E4] bg-white px-5 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF8F6] text-[#0F9691]">
              <Layers size={29} strokeWidth={1.7} />
            </div>
            <h3 className="mt-5 text-lg font-extrabold text-[#102A43]">
              {requests.length === 0
                ? "Aucune demande pour le moment"
                : "Aucune demande ne correspond à votre recherche"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7C8FA2]">
              {requests.length === 0
                ? "Les entreprises n'ont pas encore publié de besoins. Revenez plus tard."
                : "Essayez un autre mot-clé, une autre ville ou retirez certains filtres."}
            </p>
            {requests.length > 0 && (
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
            {paginatedRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
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
    </AppShell>
  );
}

/* ============================================================
   CARTE DEMANDE
============================================================ */
function RequestCard({ request }) {
  const isTalent = request.author_type === "talent";
  const authorName = getAuthorName(request);
  const publishedDate = formatRelativeDate(request.created_at);
  const budget = formatBudget(request.budget_min, request.budget_max);

  // Avatar : company logo OR talent avatar
  const avatarPath = isTalent
    ? (request.author?.professional_profile?.avatar_path ||
       request.author?.professionalProfile?.avatar_path ||
       request.author?.avatar_path)
    : request.company?.logo_path;

  const skills = Array.isArray(request.skills) ? request.skills : [];

  return (
    <article className="group flex min-w-0 flex-col rounded-2xl border border-[#E4ECF3] bg-white p-5 shadow-sm shadow-[#102A43]/[0.025] transition duration-200 hover:-translate-y-1 hover:border-[#B5E9E2] hover:shadow-xl hover:shadow-[#102A43]/[0.07]">

      {/* En-tête */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E5EDF3] bg-gradient-to-br from-[#EAF7FA] to-[#E1F6F0] text-sm font-extrabold text-[#087F83]">
            {avatarPath ? (
              <img
                src={`http://localhost:8001/storage/${avatarPath}`}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              getInitials(authorName)
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-[#24435D]">
              {authorName}
            </p>
            {publishedDate && (
              <p className="mt-0.5 text-[11px] text-[#92A2B2]">
                {publishedDate}
              </p>
            )}
          </div>
        </div>

        {/* Badge urgent */}
        {request.urgency === "urgent" && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
            <Zap size={9} /> URGENT
          </span>
        )}
      </div>

      {/* Titre */}
      <h3 className="mt-4 line-clamp-2 text-base font-extrabold leading-snug text-[#102A43] transition group-hover:text-[#087F83]">
        {request.title || "Demande sans titre"}
      </h3>

      {/* Meta : lieu + type */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[#71869A]">
        {(request.city || request.country) && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={13} className="shrink-0 text-[#8299AD]" />
            {[request.city, request.country].filter(Boolean).join(", ")}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          {isTalent ? (
            <>
              <UserRound size={13} className="shrink-0 text-[#8299AD]" />
              Talent
            </>
          ) : (
            <>
              <Building2 size={13} className="shrink-0 text-[#8299AD]" />
              Entreprise
            </>
          )}
        </span>
        {request.remote && (
          <span className="inline-flex items-center gap-1.5">
            <Home size={13} className="shrink-0 text-[#8299AD]" />
            Télétravail
          </span>
        )}
      </div>

      {/* Compétences */}
      {skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skills.slice(0, 4).map((skill, i) => (
            <span
              key={skill.id ?? skill.name ?? i}
              className="rounded-md bg-[#E8F8F5] px-2 py-0.5 text-[10px] font-bold text-[#087F73]"
            >
              {skill.name || skill}
            </span>
          ))}
          {skills.length > 4 && (
            <span className="self-center text-[10px] font-bold text-[#92A2B2]">
              +{skills.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Description */}
      <p className="mt-3 line-clamp-2 min-h-[40px] text-xs leading-5 text-[#71849A]">
        {request.description || "Découvrez les détails de cette demande."}
      </p>

      {/* Footer */}
      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between gap-2 border-t border-[#EDF2F6] pt-3">
          <div className="min-w-0">
            {budget && (
              <p className="flex items-center gap-1.5 text-xs font-bold text-[#102A43]">
                <Banknote size={13} className="text-[#0F9691]" />
                <span className="truncate">{budget}</span>
              </p>
            )}
            {request.start_at && request.end_at && (
              <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[#8FA2B4]">
                <Clock size={11} />
                Du {formatDate(request.start_at)} au {formatDate(request.end_at)}
              </p>
            )}
          </div>

          <Link
            to={`/resource-requests/${request.id}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#102A43] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#087F83]"
          >
            Voir la demande
          </Link>
        </div>
      </div>
    </article>
  );
}