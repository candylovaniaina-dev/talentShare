import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, MapPin, Calendar, Clock, DollarSign, Zap, Users, Tag,
  Sliders, X, Eye, Briefcase, Building2, ShieldCheck, Filter, Plus,
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
  published: { label: "Ouverte",  badge: "bg-emerald-100 text-emerald-700" },
  filled:    { label: "Pourvue",  badge: "bg-blue-100 text-blue-700" },
  closed:    { label: "Fermée",   badge: "bg-rose-100 text-rose-700" },
  expired:   { label: "Expirée",  badge: "bg-slate-100 text-slate-500" },
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
  const [total, setTotal] = useState(0);

  // ✅ Recherche automatique (debounce 300ms)
  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      api.get("/resource-requests", {
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
      })
        .then((res) => {
          setRequests(asArray(res.data));
          setTotal(res.data.total || asArray(res.data).length);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
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

  const activeFiltersCount = [country, city, remoteOnly, urgency, budgetMin, budgetMax].filter(Boolean).length;

  // ✅ Détection : l'utilisateur peut-il publier ?
  const canPublish = user && (user.role === "company" || user.role === "employee");

  return (
    <Layout>
      {!user && (
        <div className="mx-auto max-w-6xl px-6 pt-6">
          <PublicNavbar variant="light" />
        </div>
      )}

      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-mint">
              Demandes de ressources
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
              Découvrez les besoins des entreprises.
            </h1>
            <p className="mt-2 max-w-xl text-slate-500">
              Parcourez les demandes publiées, trouvez celles qui correspondent à vos compétences
              et proposez votre profil.
            </p>
          </div>

          {/* ✅ Bouton "Publier un besoin" en haut */}
          {canPublish && (
            <Link
              to="/resource-requests/new"
              className="hidden sm:flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-light shadow-md"
            >
              <Plus size={16} /> Publier un besoin
            </Link>
          )}
        </div>

        {/* Barre de recherche */}
        <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-1 min-w-[220px] items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Compétence, poste, entreprise..."
              className="w-full text-sm focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`relative flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold ${
              showFilters ? "border-navy bg-navy text-white" : "border-slate-200 text-slate-600"
            }`}
          >
            <Sliders size={14} /> Filtres
            {activeFiltersCount > 0 && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-mint text-[10px] font-bold text-navy">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Filtres rapides */}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setUrgency(urgency === "urgent" ? "" : "urgent")}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              urgency === "urgent"
                ? "border-rose-500 bg-rose-500 text-white"
                : "border-slate-200 text-slate-600 hover:border-rose-400"
            }`}
          >
            <Zap size={12} className="inline mr-1" /> Urgent
          </button>
          <button
            onClick={() => setRemoteOnly(!remoteOnly)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              remoteOnly
                ? "border-navy bg-navy text-white"
                : "border-slate-200 text-slate-600 hover:border-navy"
            }`}
          >
            🏠 Télétravail
          </button>
        </div>

        {/* Filtres avancés */}
        {showFilters && (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Filtres avancés</p>
              {activeFiltersCount > 0 && (
                <button onClick={clearFilters} className="text-xs font-semibold text-rose-500 hover:underline flex items-center gap-1">
                  <X size={12} /> Effacer
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-xs font-semibold text-slate-500">Pays</label>
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Ex: Madagascar"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Ville</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Antananarivo"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Budget min (€/j)</label>
                <input
                  type="number"
                  min="0"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Budget max (€/j)</label>
                <input
                  type="number"
                  min="0"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Compteur */}
        <p className="mt-6 text-sm font-semibold text-slate-500">
          {loading ? "Recherche..." : `${requests.length} demande${requests.length > 1 ? "s" : ""}`}
        </p>

        {/* Résultats */}
        <div className="mt-3 grid gap-4">
          {requests.map((r) => {
            const cfg = STATUS_CFG[r.display_status] || STATUS_CFG.published;
            const daysLeft = r.days_until_expiry;
            const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && r.display_status === "published";

            return (
              <Link
                key={r.id}
                to={`/resource-requests/${r.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md group"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-lg group-hover:text-navy group-hover:underline">
                        {r.title}
                      </h3>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      {r.urgency === "urgent" && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700 flex items-center gap-1">
                          <Zap size={10} /> Urgent
                        </span>
                      )}
                      {isExpiringSoon && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                          ⚠️ Expire dans {daysLeft}j
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-500 line-clamp-2">{r.description}</p>

                    {/* Entreprise */}
                    {r.company && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                        <Building2 size={12} /> {r.company.name}
                        {r.company.is_verified && <ShieldCheck size={12} className="text-mint" />}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Eye size={12} /> {r.views_count} vues
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {r.proposals_count || 0} proposition{(r.proposals_count || 0) > 1 ? "s" : ""}
                      </span>
                      {r.budget_min && r.budget_max && (
                        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                          <DollarSign size={12} /> {r.budget_min}–{r.budget_max} €/j
                        </span>
                      )}
                      {r.city && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {r.city}{r.country ? `, ${r.country}` : ""}
                        </span>
                      )}
                      {r.start_at && r.end_at && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(r.start_at).toLocaleDateString("fr-FR")} → {new Date(r.end_at).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                      {r.workload_percent && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {r.workload_percent}%
                        </span>
                      )}
                    </div>

                    {/* Compétences */}
                    {r.skills?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {r.skills.slice(0, 5).map((s) => (
                          <span
                            key={s.id}
                            className="rounded-full bg-mint/15 px-2.5 py-1 text-xs font-medium text-navy"
                          >
                            {s.name}
                          </span>
                        ))}
                        {r.skills.length > 5 && (
                          <span className="text-xs text-slate-400 self-center">
                            +{r.skills.length - 5}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Tags */}
                    {r.tags?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {r.tags.slice(0, 4).map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-medium text-purple-700"
                          >
                            <Tag size={9} className="inline mr-0.5" /> {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {r.positions_count > 1 && (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 shrink-0 flex items-center gap-1">
                      <Briefcase size={11} /> {r.positions_count} postes
                    </span>
                  )}
                </div>
              </Link>
            );
          })}

          {!loading && requests.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <Filter size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-600">Aucune demande trouvée</p>
              <p className="mt-1 text-sm text-slate-400">Essayez d'élargir vos filtres.</p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-sm font-semibold text-navy hover:underline"
                >
                  Effacer les filtres
                </button>
              )}
              {canPublish && (
                <Link
                  to="/resource-requests/new"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-light"
                >
                  <Plus size={16} /> Publier le premier besoin
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ✅ NOUVEAU : Bulle flottante "Publier un besoin" */}
      {canPublish && (
        <Link
          to="/resource-requests/new"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-navy px-6 py-3.5 text-sm font-semibold text-white shadow-xl hover:bg-navy-light hover:scale-105 transition sm:hidden"
        >
          <Plus size={18} /> Publier
        </Link>
      )}
    </Layout>
  );
}

function PublicOnlyLayout({ children }) {
  return <div className="min-h-screen bg-slate-50 font-sans text-navy">{children}</div>;
}