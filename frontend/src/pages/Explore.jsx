import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, MapPin, Sparkles, ShieldCheck, CalendarCheck,
  Sliders, X, Briefcase, User, Clock, Euro, Filter,
  ArrowRight, TrendingUp, Check,
} from "lucide-react";
import PublicNavbar from "../components/layout/PublicNavbar";
import AppShell from "../components/layout/AppShell";
import ExploreMap from "../components/ExploreMap";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const MISSION_TYPES = {
  full_time: "Temps plein", part_time: "Temps partiel", freelance: "Freelance",
  mission: "Mission", loan: "Mise à disposition",
};

const LEVEL_LABELS = {
  beginner: "Débutant", intermediate: "Intermédiaire",
  advanced: "Avancé", expert: "Expert",
};

const scoreColor = (score) => {
  if (score === null || score === undefined) return "bg-slate-100 text-slate-700 border-slate-200";
  if (score >= 80) return "bg-emerald-500/20 text-emerald-700 border-emerald-500/30";
  if (score >= 60) return "bg-blue-500/20 text-blue-700 border-blue-500/30";
  if (score >= 40) return "bg-amber-50 text-amber-800 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
};

const asArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export default function Explore() {
  const { user } = useAuth();
  const Layout = user ? AppShell : PublicOnlyLayout;

  // === Recherche ===
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("all");

  // === Filtres rapides ===
  const [filters, setFilters] = useState({
    available: false,
    remote: false,
    verified: false,
    advanced: false,
  });

  // === Résultats ===
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // ✅ Recherche automatique (debounce 300ms) avec filtres
  useEffect(() => {
    setLoading(true);
    setError("");
    const timeout = setTimeout(() => {
      api.get("/talents/search", {
        params: {
          search: search || undefined,
          availability_status: filters.available ? "available" : undefined,
          location_type: filters.remote ? "remote" : undefined,
          verified_only: filters.verified || undefined,
          min_level: filters.advanced ? "advanced" : undefined,
        },
      })
        .then((res) => setResults(res.data.data || []))
        .catch((err) => {
          console.error(err);
          setError(err.response?.data?.message || "La recherche est momentanément indisponible. Réessayez dans un instant.");
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, filters]);

  // ✅ Toggle filtre
  const toggleFilter = (key) => {
    setFilters((f) => ({ ...f, [key]: !f[key] }));
  };

  // ✅ Compteur filtres actifs
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  // ✅ Filtrage par onglet
  const filteredResults = resultFilter === "all"
    ? results
    : results.filter((r) => r.result_type === resultFilter);

  const countProfiles = results.filter((r) => r.result_type === "profile").length;
  const countOffers = results.filter((r) => r.result_type === "offer").length;

  // ✅ Profils pour la carte (seulement les profils, pas les offres)
  const profilesForMap = filteredResults.filter((r) => r.result_type === "profile");

  // ✅ Config des chips
  const CHIPS = [
    { key: "available", label: "Disponibles", icon: "🟢" },
    { key: "remote",    label: "Télétravail", icon: "🏠" },
    { key: "verified",  label: "Vérifiés",    icon: "✅" },
    { key: "advanced",  label: "Niveau avancé+", icon: "🚀" },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-[#F5F8FA] font-sans text-[#102A43]">

        {/* PublicNavbar pour les visiteurs */}
        {!user && <PublicNavbar variant="dark" />}

        {/* ============ HERO ============ */}
        <div className="relative overflow-hidden rounded-b-[2rem] bg-[#0B1F33] text-white">
          <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute top-20 right-1/4 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Explorer le réseau
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Les bonnes compétences
              <br />
              <span className="text-emerald-700">sont déjà là.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-slate-400">
              Trouvez un talent, une équipe ou une opportunité à partir de critères concrets.
              Les localisations sont affichées par zone pour protéger la vie privée.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                <ShieldCheck size={16} /> Données de localisation protégées
              </span>
              <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300">
                <TrendingUp size={16} /> Matching expliqué
              </span>
            </div>
          </div>
        </div>

        {/* ============ GRILLE PRINCIPALE ============ */}
        <div className="mx-auto max-w-7xl px-6 pb-16">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px]">

            {/* ========== COLONNE GAUCHE : Recherche + Résultats ========== */}
            <div className="min-w-0">

              {/* Barre de recherche */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 focus-within:border-[#16B8B1] focus-within:ring-4 focus-within:ring-teal-100">
                    <Search size={18} className="text-[#0F9691]" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Compétence, métier, organisation..."
                      aria-label="Rechercher un talent, une compétence ou une organisation"
                      className="w-full bg-transparent text-sm text-[#102A43] placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    aria-expanded={showFilters}
                    className={`flex items-center gap-1.5 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      showFilters
                        ? "border-teal-200 bg-teal-50 text-teal-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-teal-300"
                    }`}
                  >
                    <Sliders size={14} /> Filtres
                    {activeFiltersCount > 0 && (
                      <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Filtres rapides */}
                {showFilters && <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2">
                    Filtres rapides
                  </p>
                  {CHIPS.map((chip) => {
                    const active = filters[chip.key];
                    return (
                      <button
                        key={chip.key}
                        onClick={() => toggleFilter(chip.key)}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          active
                            ? "border-teal-600 bg-teal-600 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-800"
                        }`}
                      >
                        <span>{chip.icon}</span> {chip.label}
                        {active && <Check size={12} />}
                      </button>
                    );
                  })}
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={() => setFilters({ available: false, remote: false, verified: false, advanced: false })}
                      className="flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      <X size={12} /> Effacer
                    </button>
                  )}
                </div>}
              </div>

              {/* Onglets */}
              <div className="mt-6 flex gap-2">
                {[
                  { id: "all",     label: `Tout (${results.length})` },
                  { id: "profile", label: `Talents (${countProfiles})` },
                  { id: "offer",   label: `Offres (${countOffers})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setResultFilter(tab.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      resultFilter === tab.id
                        ? "bg-teal-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-[#102A43]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Compteur */}
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                      Recherche...
                    </span>
                  ) : (
                    <>
                      <b className="text-[#102A43]">{filteredResults.length}</b> résultat{filteredResults.length > 1 ? "s" : ""} · correspondance par critères
                    </>
                  )}
                </p>


              </div>

              {error && (
                <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {error}
                </div>
              )}

              {/* Résultats */}
              <div className="mt-4 space-y-4">
                {filteredResults.map((item) =>
                  item.result_type === "profile" ? (
                    <TalentCard key={`p-${item.id}`} profile={item} />
                  ) : (
                    <OfferCard key={`o-${item.id}`} offer={item} />
                  )
                )}

                {!loading && filteredResults.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
                    <Filter size={40} className="mx-auto text-slate-600 mb-3" />
                    <p className="font-semibold text-slate-700">Aucun résultat</p>
                    <p className="mt-1 text-sm text-slate-500">Essayez d'élargir vos filtres.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ========== COLONNE DROITE : Carte + CTA ========== */}
            <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">

              {/* Carte */}
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                    Vue réseau
                  </p>
                  <MapPin size={18} className="text-teal-700" />
                </div>

                <ExploreMap profiles={profilesForMap} />

                <p className="mt-4 text-xs leading-relaxed text-slate-500">
                  La carte indique des zones d'activité, jamais une adresse personnelle précise.
                </p>
              </div>

              {/* CTA */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                    <Sparkles size={18} />
                  </span>
                  <div>
                    <p className="font-bold text-white">Vous cherchez une compétence ?</p>
                    <p className="mt-1 text-sm text-slate-400">Décrivez votre besoin</p>
                  </div>
                </div>

                <Link
                  to="/resource-requests/new"
                  className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#0F9691] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0B7D79]"
                >
                  Créer une demande <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// ============================================
// CARTE TALENT
// ============================================
function TalentCard({ profile: p }) {
  const nextAvail = p.availability_windows?.[0];
  const isPrivate = p.visibility === "private";

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-teal-200 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Avatar */}
          <div className="relative shrink-0">
            {p.avatar_path ? (
              <img
                src={`/storage/${p.avatar_path}`}
                alt={p.user?.name}
                className={`h-16 w-16 rounded-2xl object-cover border border-white/10 ${isPrivate ? "opacity-60" : ""}`}
              />
            ) : (
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0F9691] to-[#0B1F33] text-xl font-bold text-white ${isPrivate ? "opacity-60" : ""}`}>
                {p.user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
            )}
            {p.is_verified && (
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                <ShieldCheck size={12} />
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                <User size={10} /> Talent
              </span>
              <h3 className="text-lg font-bold text-[#102A43]">{p.user?.name}</h3>
              {p.is_verified && <Check size={14} className="text-emerald-700" />}
              {isPrivate && (
                <span className="rounded-full border border-slate-500/30 bg-slate-500/10 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                  🔒 Privé
                </span>
              )}
            </div>

            {p.headline && (
              <p className="text-sm text-teal-700 mt-1">{p.headline}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              {p.city && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} /> {p.city}{p.country ? `, ${p.country}` : ""}
                </span>
              )}
              {nextAvail && !isPrivate && (
                <span className="flex items-center gap-1 text-teal-700">
                  <CalendarCheck size={12} />
                  Disponible dès {new Date(nextAvail.start_at).toLocaleDateString("fr-FR", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>

            {/* Compétences */}
            {!isPrivate && p.skills?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.skills.slice(0, 5).map((s) => (
                  <span
                    key={s.id}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                  >
                    {s.name}
                    {s.pivot?.level && (
                      <span className="text-[10px] text-slate-500 ml-1">· {LEVEL_LABELS[s.pivot.level]}</span>
                    )}
                  </span>
                ))}
                {p.skills.length > 5 && (
                  <span className="text-xs text-slate-500 self-center">+{p.skills.length - 5}</span>
                )}
              </div>
            )}

            {isPrivate && (
              <div className="mt-3 rounded-xl bg-slate-500/10 border border-slate-500/20 px-3 py-2 text-xs text-slate-500">
                Ce profil est privé — infos détaillées masquées.
              </div>
            )}
          </div>
        </div>

        {/* Score */}
        {p.match_score != null && (
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`rounded-full border px-3 py-1.5 text-sm font-bold ${scoreColor(p.match_score)}`}>
              {p.match_score}% match
            </span>
            <span className="text-[10px] text-slate-500">qualité du profil</span>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-100 pt-5">
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck size={13} className="text-emerald-700" />
          {isPrivate ? "Certaines infos masquées" : "Coordonnées après accord"}
        </span>
        <div className="flex gap-2">
          <Link
            to={`/talents/${p.id}`}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#102A43] hover:border-teal-300 hover:text-teal-800 transition"
          >
            Voir le profil
          </Link>
          {!isPrivate && (
            <Link
              to={`/talents/${p.id}`}
              className="rounded-full bg-[#16B8B1] px-5 py-2 text-sm font-semibold text-[#0B1F33] hover:bg-[#39cbc4] transition flex items-center gap-1"
            >
              Proposer <ArrowRight size={12} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// CARTE OFFRE
// ============================================
function OfferCard({ offer: o }) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-teal-200 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1F33] to-[#16B8B1] text-xl font-bold text-white shrink-0">
            {o.profile?.user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                <Briefcase size={10} /> Offre
              </span>
              <h3 className="text-lg font-bold text-[#102A43]">{o.title}</h3>
            </div>

            {o.profile?.user && (
              <p className="text-sm text-slate-500 mt-1">
                {o.profile.user.name}
                {o.profile.headline && ` · ${o.profile.headline}`}
              </p>
            )}

            {o.description && (
              <p className="mt-2 text-sm text-slate-500 line-clamp-2">{o.description}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              {o.location_city && (
                <span className="flex items-center gap-1"><MapPin size={12} />{o.location_city}</span>
              )}
              <span className="flex items-center gap-1">
                <Clock size={12} /> {o.workload_value}
                {o.workload_unit === "percentage" ? "%" : o.workload_unit === "hours_per_week" ? "h/sem" : "j/sem"}
              </span>
              {o.daily_rate && (
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <Euro size={12} />{o.daily_rate}/jour
                </span>
              )}
            </div>
          </div>
        </div>

        {o.match_score != null && (
          <span className={`rounded-full border px-3 py-1.5 text-sm font-bold shrink-0 ${scoreColor(o.match_score)}`}>
            {o.match_score}% match
          </span>
        )}
      </div>

      <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-100 pt-5">
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <Sparkles size={13} className="text-emerald-700" /> Mise à disposition
        </span>
        <Link
          to={`/resource-offers/${o.id}`}
          className="rounded-full bg-[#16B8B1] px-5 py-2 text-sm font-semibold text-[#0B1F33] hover:bg-[#39cbc4] transition"
        >
          Voir le détail
        </Link>
      </div>
    </div>
  );
}

// ============================================
// LAYOUT VISITEUR
// ============================================
function PublicOnlyLayout({ children }) {
  return <div className="min-h-screen bg-[#0B1F33] font-sans text-white">{children}</div>;
}
