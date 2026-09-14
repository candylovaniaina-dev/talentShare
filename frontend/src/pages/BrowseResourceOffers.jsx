import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Calendar, Clock, Building2, Sliders, X, Eye } from "lucide-react";
import PublicNavbar from "../components/layout/PublicNavbar";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const MISSION_TYPES = {
  full_time: "Temps plein",
  part_time: "Temps partiel",
  freelance: "Freelance",
  mission:   "Mission",
  loan:      "Mise à disposition",
};

export default function BrowseResourceOffers() {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [missionType, setMissionType] = useState("");
  const [locationType, setLocationType] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // ✅ Choisir le layout : AppShell si connecté, sinon page publique
  const Layout = user ? AppShell : PublicOnlyLayout;

  const load = () => {
    setLoading(true);
    api.get("/resource-offers", {
      params: {
        search: search || undefined,
        mission_type: missionType || undefined,
        location_type: locationType || undefined,
        start_at: startAt || undefined,
        end_at: endAt || undefined,
      },
    })
      .then((res) => setOffers(res.data.data || res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const clearFilters = () => {
    setSearch("");
    setMissionType("");
    setLocationType("");
    setStartAt("");
    setEndAt("");
    setTimeout(load, 100);
  };

  const activeFilters = [missionType, locationType, startAt, endAt].filter(Boolean).length;

  return (
    <Layout>
      {/* PublicNavbar : SEULEMENT pour les visiteurs non connectés */}
      {!user && (
        <div className="mx-auto max-w-6xl px-6 pt-6">
          <PublicNavbar variant="light" />
        </div>
      )}

      <div className="mx-auto max-w-6xl px-6 py-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-mint">
            Ressources disponibles
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            Trouvez la perle rare prête à emprunter.
          </h1>
          <p className="mt-2 max-w-xl text-slate-500">
            Parcourez les salariés que d'autres entreprises proposent en mise à disposition.
            Contactez directement le prêteur.
          </p>
        </div>

        {/* Recherche */}
        <form
          onSubmit={(e) => { e.preventDefault(); load(); }}
          className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"
        >
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
            {activeFilters > 0 && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-mint text-[10px] font-bold text-navy">
                {activeFilters}
              </span>
            )}
          </button>
          <button className="rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white">
            Rechercher
          </button>
        </form>

        {/* Filtres avancés */}
        {showFilters && (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Filtres avancés</p>
              {activeFilters > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-semibold text-rose-500 hover:underline flex items-center gap-1"
                >
                  <X size={12} /> Effacer
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-500">Type de mission</label>
                <select
                  value={missionType}
                  onChange={(e) => setMissionType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Tous</option>
                  {Object.entries(MISSION_TYPES).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Localisation</label>
                <select
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Toutes</option>
                  <option value="onsite">🏢 Sur site</option>
                  <option value="remote">🏠 Télétravail</option>
                  <option value="hybrid">🔄 Hybride</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Disponible à partir du</label>
                <input
                  type="date"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Jusqu'au</label>
                <input
                  type="date"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={clearFilters}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
              >
                Réinitialiser
              </button>
              <button
                onClick={() => { load(); setShowFilters(false); }}
                className="rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light"
              >
                Appliquer
              </button>
            </div>
          </div>
        )}

        <p className="mt-6 text-sm font-semibold text-slate-500">
          {loading ? "Recherche..." : `${offers.length} offre${offers.length > 1 ? "s" : ""}`}
        </p>

        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {offers.map((offer) => (
            <div key={offer.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start gap-3">
                {offer.profile?.user && (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mint/20 font-bold text-navy">
                    {offer.profile.user.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold">{offer.title}</h3>
                  {offer.profile?.user && (
                    <p className="text-sm text-slate-500">
                      {offer.profile.user.name}
                      {offer.profile.headline && ` · ${offer.profile.headline}`}
                    </p>
                  )}
                </div>
              </div>

              {offer.description && (
                <p className="mt-2 text-sm text-slate-500 line-clamp-2">{offer.description}</p>
              )}

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                  {MISSION_TYPES[offer.mission_type] || offer.mission_type}
                </span>
                {offer.location_type === "remote" && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 font-semibold text-blue-700">
                    🏠 Télétravail
                  </span>
                )}
                {offer.daily_rate && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
                    💰 {offer.daily_rate}€/j
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(offer.start_at).toLocaleDateString("fr-FR")} → {new Date(offer.end_at).toLocaleDateString("fr-FR")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {offer.workload_value}
                  {offer.workload_unit === "percentage" ? "%" :
                   offer.workload_unit === "hours_per_week" ? "h/sem" : "j/sem"}
                </span>
                {offer.location_city && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />{offer.location_city}
                  </span>
                )}
              </div>

              {offer.company && (
                <p className="mt-3 flex items-center gap-1 text-xs text-slate-400">
                  <Building2 size={12} /> Proposé par {offer.company.name}
                </p>
              )}

              <Link
                to={`/resource-offers/${offer.id}`}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light"
              >
                <Eye size={14} /> Voir le détail
              </Link>
            </div>
          ))}

          {!loading && offers.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <p className="font-semibold text-slate-600">Aucune offre disponible</p>
              <p className="mt-1 text-sm text-slate-400">Essayez d'élargir vos filtres.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// Layout simple pour les visiteurs non connectés
function PublicOnlyLayout({ children }) {
  return <div className="min-h-screen bg-slate-50 font-sans text-navy">{children}</div>;
}