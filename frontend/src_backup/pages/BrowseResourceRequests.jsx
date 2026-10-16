import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Zap,
  Users,
  Tag,
  SlidersHorizontal,
  X,
  Eye,
  Briefcase,
  Building2,
  ShieldCheck,
  Filter,
  Plus,
  Loader2,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import PublicNavbar from "../components/layout/PublicNavbar";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const asArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

const STATUS_CFG = {
  published: {
    label: "Ouverte",
    badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  },
  filled: {
    label: "Pourvue",
    badge: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  },
  closed: {
    label: "Fermée",
    badge: "border-rose-500/20 bg-rose-500/10 text-rose-400",
  },
  expired: {
    label: "Expirée",
    badge: "border-[var(--border-app)] bg-[var(--bg-surface-hover)] text-[var(--text-muted)]",
  },
};

const formatDate = (date) => {
  if (!date) return null;

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function BrowseResourceRequests() {
  const { user } = useAuth();
  const Layout = user ? AppShell : PublicOnlyLayout;

  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [urgency, setUrgency] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");

    const timeout = setTimeout(async () => {
      try {
        const res = await api.get("/resource-requests", {
          params: {
            search: search || undefined,
            country: country || undefined,
            city: city || undefined,
            remote: remoteOnly || undefined,
            urgency: urgency || undefined,
            budget_min: budgetMin || undefined,
            budget_max: budgetMax || undefined,
            per_page: 20,
          },
        });

        if (cancelled) return;

        const result = asArray(res.data);
        setRequests(result);
        setTotal(
          Number(res.data?.total ?? res.data?.meta?.total ?? result.length)
        );
      } catch (err) {
        if (cancelled) return;

        console.error("Erreur de chargement des demandes :", err);
        setRequests([]);
        setTotal(0);
        setError(
          err.response?.data?.message ||
            "Impossible de charger les demandes pour le moment."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [search, country, city, remoteOnly, urgency, budgetMin, budgetMax]);

  const clearFilters = () => {
    setSearch("");
    setCountry("");
    setCity("");
    setRemoteOnly(false);
    setUrgency("");
    setBudgetMin("");
    setBudgetMax("");
  };

  const activeFiltersCount = [
    country,
    city,
    remoteOnly,
    urgency,
    budgetMin,
    budgetMax,
  ].filter(Boolean).length;

  const canPublish =
    user && (user.role === "company" || user.role === "employee");

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

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                <Briefcase size={14} />
                Opportunités de collaboration
              </span>

              <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-[var(--text-app)] sm:text-4xl">
                Les besoins des entreprises,
                <span className="block text-emerald-400">
                  vos prochaines opportunités.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--text-muted)] sm:text-base">
                Explorez les demandes de ressources, identifiez les missions
                qui correspondent à vos compétences et proposez votre profil.
              </p>
            </div>

            {canPublish && (
              <Link
                to="/resource-requests/new"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-[#0B1F33] transition hover:bg-emerald-300"
              >
                <Plus size={17} />
                Publier un besoin
              </Link>
            )}
          </div>
        </section>

        {/* Barre de recherche */}
        <section className="mt-6 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-3 sm:p-4">
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-4 py-3 focus-within:border-emerald-500/50">
            <Search size={18} className="shrink-0 text-[var(--text-faint)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un poste, une compétence..."
              className="w-full bg-transparent text-sm text-[var(--text-app)] outline-none placeholder:text-[var(--text-faint)]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Effacer la recherche"
                className="text-[var(--text-faint)] transition hover:text-[var(--text-app)]"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setUrgency((value) => (value === "urgent" ? "" : "urgent"))
              }
              aria-pressed={urgency === "urgent"}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                urgency === "urgent"
                  ? "border-rose-500/40 bg-rose-500/10 text-rose-400"
                  : "border-[var(--border-app)] text-[var(--text-muted)] hover:border-rose-500/30 hover:text-rose-400"
              }`}
            >
              <Zap size={13} />
              Besoins urgents
            </button>

            <button
              type="button"
              onClick={() => setRemoteOnly((value) => !value)}
              aria-pressed={remoteOnly}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                remoteOnly
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "border-[var(--border-app)] text-[var(--text-muted)] hover:border-emerald-500/30 hover:text-emerald-400"
              }`}
            >
              <MapPin size={13} />
              Télétravail
            </button>

            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              aria-expanded={showFilters}
              className={`ml-auto inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
                showFilters
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "border-[var(--border-app)] text-[var(--text-app)] hover:border-emerald-500/30"
              }`}
            >
              <SlidersHorizontal size={15} />
              Tous les filtres
              {activeFiltersCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1 text-[10px] font-bold text-[#0B1F33]">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="mt-5 border-t border-[var(--border-app)] pt-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-[var(--text-app)]">
                    Filtres avancés
                  </h2>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Précisez votre recherche.
                  </p>
                </div>

                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300"
                  >
                    <X size={13} />
                    Effacer les filtres
                  </button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <FilterField label="Pays">
                  <input
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    placeholder="Ex. : Madagascar"
                    className={inputClass}
                  />
                </FilterField>

                <FilterField label="Ville">
                  <input
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder="Ex. : Antananarivo"
                    className={inputClass}
                  />
                </FilterField>

                <FilterField label="Budget minimum (€/jour)">
                  <input
                    type="number"
                    min="0"
                    value={budgetMin}
                    onChange={(event) => setBudgetMin(event.target.value)}
                    placeholder="0"
                    className={inputClass}
                  />
                </FilterField>

                <FilterField label="Budget maximum (€/jour)">
                  <input
                    type="number"
                    min="0"
                    value={budgetMax}
                    onChange={(event) => setBudgetMax(event.target.value)}
                    placeholder="Sans limite"
                    className={inputClass}
                  />
                </FilterField>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-bold text-[#0B1F33] transition hover:bg-emerald-300"
                >
                  Afficher les résultats
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Compteur */}
        <div className="mb-4 mt-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-app)]">
              Demandes de ressources
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {loading
                ? "Recherche des demandes..."
                : `${total} résultat${total !== 1 ? "s" : ""} disponible${total !== 1 ? "s" : ""}`}
            </p>
          </div>

          {!loading && (
            <button
              type="button"
              onClick={() => {
                setSearch((value) => value);
                setCountry((value) => value);
              }}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] transition hover:text-emerald-400"
            >
              <RefreshCw size={13} />
              Actualisation automatique
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-400" />
            <div>
              <p className="text-sm text-[var(--text-app)]">{error}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Vérifiez votre connexion puis réessayez.
              </p>
            </div>
          </div>
        )}

        {/* Résultats */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-5 sm:p-6"
              >
                <div className="h-5 w-2/3 rounded bg-[var(--bg-surface-hover)]" />
                <div className="mt-4 h-3 w-full rounded bg-[var(--bg-surface-hover)]" />
                <div className="mt-2 h-3 w-4/5 rounded bg-[var(--bg-surface-hover)]" />
                <div className="mt-5 flex gap-2">
                  <div className="h-6 w-20 rounded-full bg-[var(--bg-surface-hover)]" />
                  <div className="h-6 w-24 rounded-full bg-[var(--bg-surface-hover)]" />
                </div>
              </div>
            ))}
          </div>
        ) : !error && requests.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--border-app)] bg-[var(--bg-surface)] px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <Filter size={25} />
            </div>

            <h3 className="mt-4 text-lg font-bold text-[var(--text-app)]">
              Aucune demande trouvée
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-muted)]">
              Essayez d'élargir votre recherche ou de supprimer certains
              filtres pour découvrir d'autres opportunités.
            </p>

            {activeFiltersCount > 0 || search ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-bold text-[#0B1F33] transition hover:bg-emerald-300"
              >
                Effacer les filtres
              </button>
            ) : null}

            {canPublish && (
              <div>
                <Link
                  to="/resource-requests/new"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[var(--border-app)] px-5 py-2.5 text-sm font-semibold text-[var(--text-app)] transition hover:border-emerald-500/30"
                >
                  <Plus size={16} />
                  Publier un besoin
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <ResourceRequestCard key={request.id} request={request} />
            ))}
          </div>
        )}

        {/* Bouton flottant sur mobile */}
        {canPublish && (
          <Link
            to="/resource-requests/new"
            className="fixed bottom-5 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-3.5 text-sm font-bold text-[#0B1F33] shadow-xl shadow-black/20 transition hover:bg-emerald-300 sm:hidden"
          >
            <Plus size={18} />
            Publier un besoin
          </Link>
        )}
      </main>
    </Layout>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2.5 text-sm text-[var(--text-app)] outline-none transition focus:border-emerald-500/50 placeholder:text-[var(--text-faint)]";

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

function ResourceRequestCard({ request }) {
  const status =
    STATUS_CFG[request.display_status] || STATUS_CFG.published;

  const daysLeft = request.days_until_expiry;
  const isExpiringSoon =
    daysLeft !== null &&
    daysLeft !== undefined &&
    Number(daysLeft) >= 0 &&
    Number(daysLeft) <= 7 &&
    request.display_status === "published";

  const budgetAvailable =
    request.budget_min !== null &&
    request.budget_min !== undefined &&
    request.budget_min !== "" &&
    request.budget_max !== null &&
    request.budget_max !== undefined &&
    request.budget_max !== "";

  const startDate = formatDate(request.start_at);
  const endDate = formatDate(request.end_at);

  return (
    <Link
      to={`/resource-requests/${request.id}`}
      className="group block rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-black/5 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold leading-6 text-[var(--text-app)] transition group-hover:text-emerald-400 sm:text-lg">
              {request.title || "Demande sans titre"}
            </h3>

            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${status.badge}`}
            >
              {status.label}
            </span>

            {request.urgency === "urgent" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold text-rose-400">
                <Zap size={11} />
                Urgent
              </span>
            )}

            {isExpiringSoon && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-400">
                Expire dans {daysLeft} j
              </span>
            )}
          </div>

          {request.description && (
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--text-muted)]">
              {request.description}
            </p>
          )}

          {request.company && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
              <Building2 size={14} className="shrink-0 text-[var(--text-faint)]" />
              <span>{request.company.name}</span>
              {request.company.is_verified && (
                <span
                  title="Organisation vérifiée"
                  className="inline-flex items-center gap-1 text-emerald-400"
                >
                  <ShieldCheck size={14} />
                  Vérifiée
                </span>
              )}
            </div>
          )}
        </div>

        {Number(request.positions_count) > 1 && (
          <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-blue-500/20 bg-blue-500/5 px-3 py-2 text-xs font-semibold text-blue-400">
            <Briefcase size={13} />
            {request.positions_count} postes
          </span>
        )}
      </div>

      {/* Informations */}
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 border-t border-[var(--border-app)] pt-4">
        <MetaItem icon={Eye}>
          {request.views_count ?? 0} vues
        </MetaItem>

        <MetaItem icon={Users}>
          {request.proposals_count ?? 0} proposition
          {Number(request.proposals_count ?? 0) !== 1 ? "s" : ""}
        </MetaItem>

        {budgetAvailable && (
          <MetaItem icon={DollarSign} accent>
            {request.budget_min}–{request.budget_max} €/jour
          </MetaItem>
        )}

        {(request.city || request.country) && (
          <MetaItem icon={MapPin}>
            {[request.city, request.country].filter(Boolean).join(", ")}
          </MetaItem>
        )}

        {startDate && endDate && (
          <MetaItem icon={Calendar}>
            {startDate} – {endDate}
          </MetaItem>
        )}

        {request.workload_percent !== null &&
          request.workload_percent !== undefined &&
          request.workload_percent !== "" && (
            <MetaItem icon={Clock}>
              {request.workload_percent} %
            </MetaItem>
          )}
      </div>

      {/* Compétences */}
      {Array.isArray(request.skills) && request.skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {request.skills.slice(0, 5).map((skill, index) => (
            <span
              key={skill.id ?? skill.name ?? index}
              className="rounded-full border border-emerald-500/15 bg-emerald-500/5 px-3 py-1 text-xs font-medium text-emerald-400"
            >
              {skill.name || skill}
            </span>
          ))}

          {request.skills.length > 5 && (
            <span className="self-center text-xs text-[var(--text-faint)]">
              +{request.skills.length - 5} compétences
            </span>
          )}
        </div>
      )}

      {/* Tags */}
      {Array.isArray(request.tags) && request.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {request.tags.slice(0, 4).map((tag, index) => {
            const tagLabel =
              typeof tag === "string" ? tag : tag?.name || "";

            if (!tagLabel) return null;

            return (
              <span
                key={tag.id ?? tagLabel ?? index}
                className="inline-flex items-center gap-1 rounded-full border border-violet-500/15 bg-violet-500/5 px-2.5 py-1 text-[10px] font-medium text-violet-400"
              >
                <Tag size={10} />
                {tagLabel}
              </span>
            );
          })}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--border-app)] pt-4">
        <span className="text-xs text-[var(--text-faint)]">
          Consulter les détails de la demande
        </span>

        <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-400 transition group-hover:gap-3">
          Voir le détail
          <ArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
}

function MetaItem({ icon: Icon, children, accent = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs ${
        accent
          ? "font-semibold text-emerald-400"
          : "text-[var(--text-muted)]"
      }`}
    >
      <Icon size={13} className="shrink-0" />
      {children}
    </span>
  );
}

function PublicOnlyLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-[#0B1F33]">
      {children}
    </div>
  );
}