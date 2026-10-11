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
  if (score === null || score === undefined) return "bg-[var(--bg-surface-hover)] text-[var(--text-muted)] border-[var(--border-app)]";
  if (score >= 80) return "bg-mint/10 text-mint border-mint/25";
  if (score >= 60) return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25";
  if (score >= 40) return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25";
  return "bg-[var(--bg-surface-hover)] text-[var(--text-muted)] border-[var(--border-app)]";
};

const asArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export default function Explore() {
  const { user } = useAuth();
  const Layout = user ? AppShell : PublicOnlyLayout;

  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("all");
  const [filters, setFilters] = useState({
    available: false, remote: false, verified: false, advanced: false,
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLoading(true);
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
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, filters]);

  const toggleFilter = (key) => setFilters((f) => ({ ...f, [key]: !f[key] }));
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const filteredResults = resultFilter === "all"
    ? results
    : results.filter((r) => r.result_type === resultFilter);

  const countProfiles = results.filter((r) => r.result_type === "profile").length;
  const countOffers = results.filter((r) => r.result_type === "offer").length;
  const profilesForMap = filteredResults.filter((r) => r.result_type === "profile");

  const CHIPS = [
    { key: "available", label: "Disponibles", icon: "🟢" },
    { key: "remote",    label: "Télétravail", icon: "🏠" },
    { key: "verified",  label: "Vérifiés",    icon: "✅" },
    { key: "advanced",  label: "Niveau avancé+", icon: "🚀" },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-app)] font-sans">

        {!user && <PublicNavbar variant="dark" />}

        {/* ============ HERO ============ */}
        <div className="relative overflow-hidden">
          <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-mint/10 blur-3xl" />
          <div className="absolute top-20 right-1/4 h-80 w-80 rounded-full bg-navy-500/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mint">
              Explorer le réseau
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Les bonnes compétences
              <br />
              <span className="text-mint">sont déjà là.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-[var(--text-muted)]">
              Trouvez un talent, une équipe ou une opportunité à partir de critères concrets.
              Les localisations sont affichées par zone pour protéger la vie privée.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-2 rounded-xl2 border border-mint/25 bg-mint/10 px-4 py-2 text-sm font-semibold text-mint">
                <ShieldCheck size={16} strokeWidth={1.5} /> Données de localisation protégées
              </span>
              <span className="flex items-center gap-2 rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface)] px-4 py-2 text-sm font-semibold text-[var(--text-muted)]">
                <TrendingUp size={16} strokeWidth={1.5} /> Matching expliqué
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
              <div className="rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-card p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-app)] px-4 py-3">
                    <Search size={18} strokeWidth={1.5} className="text-mint" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Compétence, métier, organisation..."
                      className="w-full bg-transparent text-sm text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-1.5 rounded-xl2 border px-4 py-3 text-sm font-semibold transition ${
                      showFilters
                        ? "border-mint/40 bg-mint/10 text-mint"
                        : "border-[var(--border-app)] bg-[var(--bg-surface-2)] text-[var(--text-muted)] hover:border-mint/30"
                    }`}
                  >
                    <Sliders size={14} strokeWidth={1.5} /> Filtres
                    {activeFiltersCount > 0 && (
                      <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-md bg-mint text-[10px] font-bold text-navy-900">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Filtres rapides */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border-app)] pt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-faint)] mr-2">
                    Filtres rapides
                  </p>
                  {CHIPS.map((chip) => {
                    const active = filters[chip.key];
                    return (
                      <button
                        key={chip.key}
                        onClick={() => toggleFilter(chip.key)}
                        className={`flex items-center gap-1.5 rounded-xl2 border px-3 py-1.5 text-xs font-semibold transition ${
                          active
                            ? "border-mint bg-mint text-navy-900"
                            : "border-[var(--border-app)] bg-[var(--bg-surface-2)] text-[var(--text-muted)] hover:border-mint/30 hover:text-mint"
                        }`}
                      >
                        <span>{chip.icon}</span> {chip.label}
                        {active && <Check size={12} strokeWidth={2} />}
                      </button>
                    );
                  })}
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={() => setFilters({ available: false, remote: false, verified: false, advanced: false })}
                      className="flex items-center gap-1 rounded-xl2 border border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20"
                    >
                      <X size={12} strokeWidth={2} /> Effacer
                    </button>
                  )}
                </div>
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
                    className={`rounded-xl2 px-3 py-1.5 text-xs font-semibold transition ${
                      resultFilter === tab.id
                        ? "bg-mint text-navy-900"
                        : "bg-[var(--bg-surface-2)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Compteur */}
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-[var(--text-muted)]">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-mint border-t-transparent" />
                      Recherche...
                    </span>
                  ) : (
                    <>
                      <b className="text-[var(--text-app)]">{filteredResults.length}</b> résultat{filteredResults.length > 1 ? "s" : ""} · correspondance par critères
                    </>
                  )}
                </p>

                <button className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-app)]">
                  <Filter size={14} strokeWidth={1.5} /> Plus de filtres
                </button>
              </div>

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
                  <div className="rounded-xl2 border border-dashed border-[var(--border-app)] bg-[var(--bg-surface-2)] p-12 text-center">
                    <Filter size={40} strokeWidth={1.5} className="mx-auto mb-3 text-[var(--text-faint)]" />
                    <p className="font-semibold text-[var(--text-muted)]">Aucun résultat</p>
                    <p className="mt-1 text-sm text-[var(--text-faint)]">Essayez d'élargir vos filtres.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ========== COLONNE DROITE : Carte + CTA ========== */}
            <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">

              {/* Carte */}
              <div className="rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-card p-5 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-mint">
                    Vue réseau
                  </p>
                  <MapPin size={18} strokeWidth={1.5} className="text-mint" />
                </div>

                <ExploreMap profiles={profilesForMap} />

                <p className="mt-4 text-xs text-[var(--text-muted)] leading-relaxed">
                  La carte indique des zones d'activité, jamais une adresse personnelle précise.
                </p>
              </div>

              {/* CTA */}
              <div className="rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface)] p-6 shadow-card">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl2 bg-mint/10 text-mint">
                    <Sparkles size={18} strokeWidth={1.5} />
                  </span>
                  <div>
                    <p className="font-bold text-[var(--text-app)]">Vous cherchez une compétence ?</p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">Décrivez votre besoin</p>
                  </div>
                </div>

                <Link
                  to="/resource-requests/new"
                  className="mt-4 flex items-center justify-center gap-2 rounded-xl2 bg-mint/10 px-4 py-3 text-sm font-semibold text-mint hover:bg-mint/20 transition"
                >
                  Créer une demande <ArrowRight size={14} strokeWidth={1.75} />
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
    <div className="group rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-card p-6 hover:border-mint/30 hover:shadow-cardHover transition-all">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Avatar */}
          <div className="relative shrink-0">
            {p.avatar_path ? (
              <img
                src={`http://localhost:8000/storage/${p.avatar_path}`}
                alt={p.user?.name}
                className={`h-16 w-16 rounded-xl2 object-cover border border-[var(--border-app)] ${isPrivate ? "opacity-60" : ""}`}
              />
            ) : (
              <div className={`flex h-16 w-16 items-center justify-center rounded-xl2 bg-navy-800 text-xl font-bold text-white ${isPrivate ? "opacity-60" : ""}`}>
                {p.user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
            )}
            {p.is_verified && (
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-md bg-mint text-navy-900">
                <ShieldCheck size={12} strokeWidth={2} />
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-md border border-blue-500/25 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <User size={10} strokeWidth={1.5} /> Talent
              </span>
              <h3 className="text-lg font-bold text-[var(--text-app)]">{p.user?.name}</h3>
              {p.is_verified && <Check size={14} strokeWidth={2} className="text-mint" />}
              {isPrivate && (
                <span className="rounded-md border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-2 py-0.5 text-[10px] font-bold text-[var(--text-muted)]">
                  Privé
                </span>
              )}
            </div>

            {p.headline && (
              <p className="text-sm text-mint mt-1">{p.headline}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
              {p.city && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} strokeWidth={1.5} /> {p.city}{p.country ? `, ${p.country}` : ""}
                </span>
              )}
              {nextAvail && !isPrivate && (
                <span className="flex items-center gap-1 text-mint">
                  <CalendarCheck size={12} strokeWidth={1.5} />
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
                    className="rounded-md border border-[var(--border-app)] bg-[var(--bg-surface-2)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)]"
                  >
                    {s.name}
                    {s.pivot?.level && (
                      <span className="text-[10px] text-[var(--text-faint)] ml-1">· {LEVEL_LABELS[s.pivot.level]}</span>
                    )}
                  </span>
                ))}
                {p.skills.length > 5 && (
                  <span className="text-xs text-[var(--text-faint)] self-center">+{p.skills.length - 5}</span>
                )}
              </div>
            )}

            {isPrivate && (
              <div className="mt-3 rounded-xl2 bg-[var(--bg-surface-hover)] border border-[var(--border-app)] px-3 py-2 text-xs text-[var(--text-muted)]">
                Ce profil est privé — infos détaillées masquées.
              </div>
            )}
          </div>
        </div>

        {/* Score */}
        {p.match_score != null && (
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`rounded-md border px-3 py-1.5 text-sm font-bold ${scoreColor(p.match_score)}`}>
              {p.match_score}% match
            </span>
            <span className="text-[10px] text-[var(--text-faint)]">qualité du profil</span>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-[var(--border-app)] pt-5">
        <span className="flex items-center gap-1.5 text-xs text-[var(--text-faint)]">
          <ShieldCheck size={13} strokeWidth={1.5} className="text-mint" />
          {isPrivate ? "Certaines infos masquées" : "Coordonnées après accord"}
        </span>
        <div className="flex gap-2">
          <Link
            to={`/talents/${p.id}`}
            className="rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface-2)] px-4 py-2 text-sm font-semibold text-[var(--text-muted)] hover:border-mint hover:text-mint transition"
          >
            Voir le profil
          </Link>
          {!isPrivate && (
            <Link
              to={`/talents/${p.id}`}
              className="rounded-xl2 bg-mint px-5 py-2 text-sm font-semibold text-navy-900 hover:bg-mint-light transition flex items-center gap-1"
            >
              Proposer <ArrowRight size={12} strokeWidth={2} />
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
    <div className="group rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-card p-6 hover:border-mint/30 hover:shadow-cardHover transition-all">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl2 bg-navy-800 text-xl font-bold text-white shrink-0">
            {o.profile?.user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-md border border-mint/25 bg-mint/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-mint flex items-center gap-1">
                <Briefcase size={10} strokeWidth={1.5} /> Offre
              </span>
              <h3 className="text-lg font-bold text-[var(--text-app)]">{o.title}</h3>
            </div>

            {o.profile?.user && (
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {o.profile.user.name}
                {o.profile.headline && ` · ${o.profile.headline}`}
              </p>
            )}

            {o.description && (
              <p className="mt-2 text-sm text-[var(--text-muted)] line-clamp-2">{o.description}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
              {o.location_city && (
                <span className="flex items-center gap-1"><MapPin size={12} strokeWidth={1.5} />{o.location_city}</span>
              )}
              <span className="flex items-center gap-1">
                <Clock size={12} strokeWidth={1.5} /> {o.workload_value}
                {o.workload_unit === "percentage" ? "%" : o.workload_unit === "hours_per_week" ? "h/sem" : "j/sem"}
              </span>
              {o.daily_rate && (
                <span className="flex items-center gap-1 text-mint font-semibold">
                  <Euro size={12} strokeWidth={1.5} />{o.daily_rate}/jour
                </span>
              )}
            </div>
          </div>
        </div>

        {o.match_score != null && (
          <span className={`rounded-md border px-3 py-1.5 text-sm font-bold shrink-0 ${scoreColor(o.match_score)}`}>
            {o.match_score}% match
          </span>
        )}
      </div>

      <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-[var(--border-app)] pt-5">
        <span className="flex items-center gap-1.5 text-xs text-[var(--text-faint)]">
          <Sparkles size={13} strokeWidth={1.5} className="text-mint" /> Mise à disposition
        </span>
        <Link
          to={`/resource-offers/${o.id}`}
          className="rounded-xl2 bg-mint px-5 py-2 text-sm font-semibold text-navy-900 hover:bg-mint-light transition"
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
  return <div className="min-h-screen bg-[var(--bg-app)] font-sans text-[var(--text-app)]">{children}</div>;
}
