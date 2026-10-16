import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  Building2,
  SlidersHorizontal,
  X,
  Eye,
  Loader2,
  RefreshCw,
  BriefcaseBusiness,
  ArrowRight,
  Laptop,
  AlertCircle,
} from "lucide-react";
import PublicNavbar from "../components/layout/PublicNavbar";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const MISSION_TYPES = {
  full_time: "Temps plein",
  part_time: "Temps partiel",
  freelance: "Freelance",
  mission: "Mission",
  loan: "Mise à disposition",
};

const LOCATION_TYPES = {
  onsite: "Sur site",
  remote: "Télétravail",
  hybrid: "Hybride",
};

const getArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const formatDate = (date) => {
  if (!date) return "Non précisée";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Non précisée";

  return parsed.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function BrowseResourceOffers() {
  const { user } = useAuth();
  const Layout = user ? AppShell : PublicOnlyLayout;

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [missionType, setMissionType] = useState("");
  const [locationType, setLocationType] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const activeFilters = [
    missionType,
    locationType,
    startAt,
    endAt,
  ].filter(Boolean).length;

  const load = useCallback(
    async (overrides = {}) => {
      const filters = {
        search,
        missionType,
        locationType,
        startAt,
        endAt,
        ...overrides,
      };

      setLoading(true);
      setError("");

      try {
        const res = await api.get("/resource-offers", {
          params: {
            search: filters.search || undefined,
            mission_type: filters.missionType || undefined,
            location_type: filters.locationType || undefined,
            start_at: filters.startAt || undefined,
            end_at: filters.endAt || undefined,
          },
        });

        setOffers(getArray(res.data));
      } catch (err) {
        console.error("Erreur de chargement des offres :", err);
        setOffers([]);
        setError(
          err.response?.data?.message ||
            "Impossible de charger les offres pour le moment."
        );
      } finally {
        setLoading(false);
      }
    },
    [search, missionType, locationType, startAt, endAt]
  );

  useEffect(() => {
    load();
  }, [load]);

  const clearFilters = () => {
    setSearch("");
    setMissionType("");
    setLocationType("");
    setStartAt("");
    setEndAt("");

    load({
      search: "",
      missionType: "",
      locationType: "",
      startAt: "",
      endAt: "",
    });
  };

  return (
    <Layout>
      {!user && (
        <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
          <PublicNavbar variant="light" />
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* En-tête */}
        <section className="relative overflow-hidden rounded-3xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-6 sm:p-9">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-1/3 h-32 w-32 rounded-full bg-cyan-500/5 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                <BriefcaseBusiness size={14} />
                Mobilité professionnelle
              </span>

              <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-[var(--text-app)] sm:text-4xl">
                Les bonnes compétences,
                <span className="block text-emerald-400">
                  au bon moment.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--text-muted)] sm:text-base">
                Découvrez les ressources proposées par d'autres entreprises,
                identifiez les profils adaptés à vos besoins et contactez
                directement les organisations.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface-hover)] p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <BriefcaseBusiness size={21} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-app)]">
                  {loading ? "—" : offers.length}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  offres affichées
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Recherche */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            load();
          }}
          className="mt-6 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-3 sm:p-4"
        >
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-4 py-3 focus-within:border-emerald-500/50">
              <Search size={18} className="shrink-0 text-[var(--text-faint)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Compétence, poste, entreprise..."
                className="w-full bg-transparent text-sm text-[var(--text-app)] outline-none placeholder:text-[var(--text-faint)]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    load({ search: "" });
                  }}
                  aria-label="Effacer la recherche"
                  className="text-[var(--text-faint)] transition hover:text-[var(--text-app)]"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              aria-expanded={showFilters}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                showFilters
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "border-[var(--border-app)] text-[var(--text-app)] hover:border-emerald-500/30"
              }`}
            >
              <SlidersHorizontal size={16} />
              Filtres
              {activeFilters > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1 text-[10px] font-bold text-[#0B1F33]">
                  {activeFilters}
                </span>
              )}
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-6 py-3 text-sm font-bold text-[#0B1F33] transition hover:bg-emerald-300 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              Rechercher
            </button>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="mt-4 border-t border-[var(--border-app)] pt-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-[var(--text-app)]">
                    Affiner les résultats
                  </h2>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Combinez les critères pour trouver la bonne ressource.
                  </p>
                </div>

                {activeFilters > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300"
                  >
                    <X size={13} />
                    Réinitialiser
                  </button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <FilterField label="Type de mission">
                  <select
                    value={missionType}
                    onChange={(event) => setMissionType(event.target.value)}
                    className={inputClass}
                  >
                    <option value="">Tous les types</option>
                    {Object.entries(MISSION_TYPES).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </FilterField>

                <FilterField label="Lieu de travail">
                  <select
                    value={locationType}
                    onChange={(event) => setLocationType(event.target.value)}
                    className={inputClass}
                  >
                    <option value="">Tous les lieux</option>
                    {Object.entries(LOCATION_TYPES).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </FilterField>

                <FilterField label="Disponible à partir du">
                  <input
                    type="date"
                    value={startAt}
                    onChange={(event) => setStartAt(event.target.value)}
                    className={inputClass}
                  />
                </FilterField>

                <FilterField label="Disponible jusqu'au">
                  <input
                    type="date"
                    value={endAt}
                    min={startAt || undefined}
                    onChange={(event) => setEndAt(event.target.value)}
                    className={inputClass}
                  />
                </FilterField>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    load();
                    setShowFilters(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-bold text-[#0B1F33] transition hover:bg-emerald-300"
                >
                  Appliquer les filtres
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Résultats */}
        <div className="mb-4 mt-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-app)]">
              Ressources disponibles
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {loading
                ? "Recherche des offres..."
                : `${offers.length} offre${offers.length !== 1 ? "s" : ""} trouvée${offers.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {!loading && (
            <button
              type="button"
              onClick={() => load()}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] transition hover:text-emerald-400"
            >
              <RefreshCw size={13} />
              Actualiser
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-400" />
            <div className="flex-1">
              <p className="text-sm text-[var(--text-app)]">{error}</p>
              <button
                type="button"
                onClick={() => load()}
                className="mt-2 text-xs font-semibold text-emerald-400 hover:underline"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-5"
              >
                <div className="flex gap-3">
                  <div className="h-12 w-12 rounded-xl bg-[var(--bg-surface-hover)]" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 w-2/3 rounded bg-[var(--bg-surface-hover)]" />
                    <div className="h-3 w-1/2 rounded bg-[var(--bg-surface-hover)]" />
                  </div>
                </div>
                <div className="mt-5 h-3 w-full rounded bg-[var(--bg-surface-hover)]" />
                <div className="mt-2 h-3 w-3/4 rounded bg-[var(--bg-surface-hover)]" />
                <div className="mt-5 h-9 rounded-xl bg-[var(--bg-surface-hover)]" />
              </div>
            ))}
          </div>
        ) : !error && offers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--border-app)] bg-[var(--bg-surface)] px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <Search size={25} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-[var(--text-app)]">
              Aucune offre trouvée
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-muted)]">
              Aucune ressource ne correspond à vos critères. Essayez d'autres
              mots-clés ou réinitialisez les filtres.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-bold text-[#0B1F33] transition hover:bg-emerald-300"
            >
              Effacer les filtres
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {offers.map((offer) => (
              <ResourceOfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        )}
      </main>
    </Layout>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2.5 text-sm text-[var(--text-app)] outline-none transition focus:border-emerald-500/50";

function FilterField({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className="text-xs font-semibold text-[var(--text-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function ResourceOfferCard({ offer }) {
  const profile = offer.profile;
  const person = profile?.user;
  const initials =
    person?.name
      ?.trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "TS";

  const mission = MISSION_TYPES[offer.mission_type] || offer.mission_type;
  const location = LOCATION_TYPES[offer.location_type] || offer.location_type;

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-black/5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-500/15 bg-emerald-500/10 text-sm font-bold text-emerald-400">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-base font-bold leading-6 text-[var(--text-app)] transition group-hover:text-emerald-400">
            {offer.title || "Offre sans titre"}
          </h3>
          {person?.name && (
            <p className="mt-1 truncate text-sm text-[var(--text-muted)]">
              {person.name}
            </p>
          )}
          {profile?.headline && (
            <p className="mt-1 line-clamp-1 text-xs text-[var(--text-faint)]">
              {profile.headline}
            </p>
          )}
        </div>
      </div>

      {offer.description && (
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-[var(--text-muted)]">
          {offer.description}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {mission && (
          <span className="rounded-full border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)]">
            {mission}
          </span>
        )}

        {location && (
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/15 bg-blue-500/5 px-3 py-1 text-xs font-semibold text-blue-400">
            {offer.location_type === "remote" ? (
              <Laptop size={12} />
            ) : (
              <MapPin size={12} />
            )}
            {location}
          </span>
        )}

        {offer.daily_rate !== null &&
          offer.daily_rate !== undefined &&
          offer.daily_rate !== "" && (
            <span className="rounded-full border border-emerald-500/15 bg-emerald-500/5 px-3 py-1 text-xs font-bold text-emerald-400">
              {offer.daily_rate} €/j
            </span>
          )}
      </div>

      <div className="mt-5 space-y-3 border-t border-[var(--border-app)] pt-4">
        <div className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
          <Calendar size={14} className="mt-0.5 shrink-0 text-[var(--text-faint)]" />
          <span>
            {formatDate(offer.start_at)}
            <span className="mx-2 text-[var(--text-faint)]">→</span>
            {formatDate(offer.end_at)}
          </span>
        </div>

        {offer.workload_value !== null &&
          offer.workload_value !== undefined &&
          offer.workload_value !== "" && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <Clock size={14} className="shrink-0 text-[var(--text-faint)]" />
              <span>
                {offer.workload_value}
                {offer.workload_unit === "percentage"
                  ? "%"
                  : offer.workload_unit === "hours_per_week"
                    ? " h/semaine"
                    : " j/semaine"}
              </span>
            </div>
          )}

        {offer.location_city && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <MapPin size={14} className="shrink-0 text-[var(--text-faint)]" />
            <span>{offer.location_city}</span>
          </div>
        )}

        {offer.company?.name && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Building2 size={14} className="shrink-0 text-[var(--text-faint)]" />
            <span className="truncate">
              Proposé par{" "}
              <span className="font-semibold text-[var(--text-app)]">
                {offer.company.name}
              </span>
            </span>
          </div>
        )}
      </div>

      <Link
        to={`/resource-offers/${offer.id}`}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-[#0B1F33] transition hover:bg-emerald-300"
      >
        <Eye size={16} />
        Voir le détail
        <ArrowRight size={15} className="ml-auto" />
      </Link>
    </article>
  );
}

function PublicOnlyLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-[#0B1F33]">
      {children}
    </div>
  );
}