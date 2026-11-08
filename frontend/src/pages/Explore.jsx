import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, MapPin, ShieldCheck, CalendarCheck,
  SlidersHorizontal, X, Briefcase, User, Clock, Euro,
  ArrowRight, TrendingUp, Check, LockKeyhole, Compass,
  Users, Layers3, ChevronRight, MessageCircle,
} from "lucide-react";
import PublicNavbar from "../components/layout/PublicNavbar";
import AppShell from "../components/layout/AppShell";
import ExploreMap from "../components/ExploreMap";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const LEVEL_LABELS = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
  expert: "Expert",
};

/* ---------- Jetons de style ---------- */
const PAGE = "bg-[#F3F6FC] text-[#0B1437] dark:bg-[#0A1230] dark:text-white transition-colors duration-300 font-sans";

const CARD =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(11,34,41,0.04),0_10px_30px_-12px_rgba(11,34,41,0.12)] " +
  "dark:border-white/10 dark:bg-[#131E47] dark:shadow-none transition-colors duration-300";

const INK = "text-[#0B1437] dark:text-white";
const MUTED = "text-[#5B6785] dark:text-[#A6B2D1]";

// ✅ BOUTON PRINCIPAL : Vert menthe
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-br from-[#8DF0DC] to-[#5EDCC4] px-4 py-2.5 text-sm font-bold text-[#0A1230] " +
  "shadow-[0_8px_22px_-8px_rgba(94,220,196,0.55)] transition hover:brightness-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7BE9D3]/40";

// ✅ BOUTON SECONDAIRE : Bordure fine
const BTN_SECONDARY =
  "inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0B1437] transition " +
  "hover:border-[#0B1437]/30 hover:text-[#0B1437] " +
  "dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:border-[#7BE9D3]/40 dark:hover:text-[#7BE9D3]";

const scoreColor = (score) => {
  if (score == null) return "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300";
  if (score >= 80) return "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300";
  if (score >= 60) return "border-teal-300 bg-teal-50 text-teal-800 dark:border-teal-400/30 dark:bg-teal-400/10 dark:text-teal-300";
  if (score >= 40) return "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300";
  return "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300";
};

const EMPTY_FILTERS = { available: false, remote: false, verified: false, advanced: false };

const asArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

const norm = (value) => String(value || "").trim().toLowerCase();

function buildCompanyIndex(list) {
  const byOwner = new Map();
  const byName = new Map();

  list.forEach((company) => {
    if (company?.owner_user_id != null) byOwner.set(String(company.owner_user_id), company);
    if (company?.name) byName.set(norm(company.name), company);
  });

  return { byOwner, byName };
}

// ✅ FONCTION CORRIGÉE : Détection infaillible
function resolveCompany(item, index) {
  if (item.result_type !== "profile") return null;

  const userId = item.user_id ?? item.user?.id;
  const userName = item.user?.name;
  
  // 1. On cherche l'entreprise par l'ID du propriétaire (le plus fiable)
  let matched = userId != null ? index.byOwner.get(String(userId)) : null;

  // 2. Si on ne trouve pas, on cherche par nom
  if (!matched && userName) {
    matched = index.byName.get(norm(userName));
  }

  // 3. Si on a trouvé l'entreprise, c'est définitivement une entreprise
  if (matched) return matched;

  // 4. Si le rôle dit explicitement "company", on le croit
  const role = item.user?.role || item.role || item.type;
  if (role === "company") {
    return { id: null, name: item.company_name || userName || "Entreprise", isFallback: true };
  }

  return null;
}

const companyLogo = (company, fallbackPath) => {
  if (company?.logo_url) return company.logo_url;
  if (company?.logo_path) return `/storage/${company.logo_path}`;
  if (fallbackPath) return `/storage/${fallbackPath}`;
  return null;
};

export default function Explore() {
  const { user } = useAuth();
  const Layout = user ? AppShell : PublicOnlyLayout;

  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("all");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [results, setResults] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get("/companies", { params: { per_page: 200 } })
      .then((res) => { if (!cancelled) setCompanies(asArray(res.data)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

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

  const companyIndex = useMemo(() => buildCompanyIndex(companies), [companies]);

  const enriched = useMemo(
    () => results.map((item) => ({ ...item, _company: resolveCompany(item, companyIndex) })),
    [results, companyIndex]
  );

  const toggleFilter = (key) => setFilters((current) => ({ ...current, [key]: !current[key] }));
  const resetAll = () => { setSearch(""); setFilters(EMPTY_FILTERS); };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const isTalentItem = (item) => item.result_type === "profile" && !item._company;
  const isCompanyItem = (item) => item.result_type === "profile" && Boolean(item._company);

  const filteredResults =
    resultFilter === "all"
      ? enriched
      : enriched.filter((item) => {
          if (resultFilter === "company") return isCompanyItem(item);
          if (resultFilter === "profile") return isTalentItem(item);
          return item.result_type === resultFilter;
        });

  const countTalents = enriched.filter(isTalentItem).length;
  const countCompanies = enriched.filter(isCompanyItem).length;
  const countOffers = enriched.filter((item) => item.result_type === "offer").length;

  const profilesForMap = filteredResults
    .filter((item) => item.result_type === "profile")
    .map((item) => ({
      ...item,
      city: item.city || item._company?.city,
      country: item.country || item._company?.country,
    }));

  const chips = [
    { key: "available", label: "Disponibles" },
    { key: "remote", label: "Télétravail" },
    { key: "verified", label: "Profils vérifiés" },
    { key: "advanced", label: "Niveau avancé +" },
  ];

  const tabs = [
    { id: "all", label: "Tout", count: enriched.length },
    { id: "profile", label: "Talents", count: countTalents },
    { id: "company", label: "Entreprises", count: countCompanies },
    { id: "offer", label: "Offres", count: countOffers },
  ];

  return (
    <Layout>
      <div className={`min-h-screen font-sans ${PAGE}`}>
        {!user && <PublicNavbar />}

        {/* Intro */}
        <section className="relative isolate overflow-hidden border-b border-slate-200/70 bg-white dark:border-white/5 dark:bg-[#0A1230]">
          <div className="pointer-events-none absolute -right-24 -top-40 -z-10 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-400/5" />
          <div className="pointer-events-none absolute left-1/4 top-24 -z-10 h-56 w-56 rounded-full bg-teal-300/10 blur-3xl dark:bg-teal-400/5" />
          <div className={`mx-auto max-w-7xl px-5 pb-9 sm:px-8 sm:pb-11 ${user ? "pt-10 sm:pt-12" : "pt-28 sm:pt-32"}`}>
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-[#0B1437] dark:border-white/10 dark:bg-white/5 dark:text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5EDCC4]" /> Explorer le réseau
              </p>
              <h1 className={`mt-5 max-w-2xl text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1] ${INK}`}>
                Les bonnes compétences sont déjà là.
              </h1>
              <p className={`mt-4 max-w-2xl text-base leading-7 sm:text-lg ${MUTED}`}>
                Trouvez un talent, une équipe ou une opportunité à partir de critères concrets.
                Les localisations sont affichées par zone pour protéger la vie privée.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <TrustPill icon={ShieldCheck}>Localisation protégée</TrustPill>
                <TrustPill icon={TrendingUp}>Matching expliqué</TrustPill>
              </div>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-9">
          <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-9">
            <section className="min-w-0">
              {/* Recherche */}
              <div className={`${CARD} p-3 sm:p-4`}>
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <label className="flex min-h-12 flex-1 items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-5 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5 dark:focus-within:border-emerald-400 dark:focus-within:bg-white/[0.07]">
                    <Search size={18} className="shrink-0 text-[#0B1437] dark:text-[#7BE9D3]" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Compétence, métier, organisation…"
                      aria-label="Rechercher un talent, une compétence ou une organisation"
                      className={`w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 ${INK}`}
                    />
                    {search && (
                      <button type="button" onClick={() => setSearch("")} aria-label="Effacer la recherche" className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white">
                        <X size={15} />
                      </button>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowFilters((visible) => !visible)}
                    aria-expanded={showFilters}
                    className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-5 text-sm font-semibold transition ${
                      showFilters
                        ? "border-[#0B1437]/30 bg-[#0B1437]/10 text-[#0B1437] dark:border-[#7BE9D3]/30 dark:bg-[#7BE9D3]/10 dark:text-[#7BE9D3]"
                        : "border-slate-200 bg-white text-[#0B1437] hover:border-[#0B1437]/30 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:border-[#7BE9D3]/40"
                    }`}
                  >
                    <SlidersHorizontal size={16} /> Filtres
                    {activeFiltersCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0B1437] px-1 text-[11px] font-bold text-white dark:bg-[#7BE9D3] dark:text-[#0A1230]">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                </div>

                {showFilters && (
                  <div className="mt-4 border-t border-slate-100 pt-4 dark:border-white/10">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className={`text-xs font-bold ${MUTED}`}>Affiner les résultats</p>
                      {activeFiltersCount > 0 && (
                        <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400">
                          <X size={13} /> Tout effacer
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {chips.map((chip) => {
                        const active = filters[chip.key];
                        return (
                          <button
                            key={chip.key}
                            type="button"
                            onClick={() => toggleFilter(chip.key)}
                            aria-pressed={active}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                              active
                                ? "border-[#0B1437] bg-[#0B1437] text-white shadow-sm dark:border-[#7BE9D3] dark:bg-[#7BE9D3] dark:text-[#0A1230]"
                                : "border-slate-200 bg-white text-[#0B1437] hover:border-[#0B1437]/40 dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:border-[#7BE9D3]/40 dark:hover:text-white"
                            }`}
                          >
                            {active && <Check size={13} />}{chip.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Onglets + compteur */}
              <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div role="tablist" aria-label="Type de résultat" className="flex w-fit flex-wrap items-center gap-1 rounded-full border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-[#131E47]">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={resultFilter === tab.id}
                      onClick={() => setResultFilter(tab.id)}
                      className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                        resultFilter === tab.id
                          ? "bg-[#0B1437] text-white shadow-sm dark:bg-[#7BE9D3] dark:text-[#0A1230]"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                      }`}
                    >
                      {tab.label}
                      <span className={`ml-1.5 ${resultFilter === tab.id ? "text-white/60 dark:text-[#0A1230]/60" : "text-slate-400"}`}>{tab.count}</span>
                    </button>
                  ))}
                </div>
                <p className={`min-h-5 text-sm ${MUTED}`} aria-live="polite">
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0B1437] border-t-transparent dark:border-[#7BE9D3]" />
                      Recherche en cours…
                    </span>
                  ) : (
                    <>
                      <strong className={`font-semibold ${INK}`}>{filteredResults.length}</strong>{" "}
                      résultat{filteredResults.length === 1 ? "" : "s"}
                      <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
                      correspondance par critères
                    </>
                  )}
                </p>
              </div>

              {error && (
                <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-300">
                  {error}
                </div>
              )}

              <div className="mt-4 space-y-4">
                {filteredResults.map((item) =>
                  item.result_type === "profile"
                    ? <TalentCard key={`p-${item.id}`} profile={item} viewer={user} />
                    : <OfferCard key={`o-${item.id}`} offer={item} />
                )}
                {!loading && filteredResults.length === 0 && (
                  <EmptyState hasSearch={Boolean(search || activeFiltersCount)} onReset={resetAll} />
                )}
                {loading && filteredResults.length === 0 && <LoadingState />}
              </div>
            </section>

            {/* Colonne latérale */}
            <aside className="space-y-4 lg:sticky lg:top-24">
              <div className={`${CARD} overflow-hidden`}>
                <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 dark:border-white/10">
                  <div>
                    <p className={`text-sm font-bold ${INK}`}>Le réseau près de vous</p>
                    <p className={`mt-1 text-xs ${MUTED}`}>Répartition géographique</p>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0B1437]/5 text-[#0B1437] dark:bg-[#7BE9D3]/10 dark:text-[#7BE9D3]">
                    <Compass size={18} />
                  </span>
                </div>
                <div className="p-3">
                  <ExploreMap profiles={profilesForMap} />
                </div>
                <div className={`flex items-start gap-2 border-t border-slate-100 px-5 py-3.5 text-xs leading-5 dark:border-white/10 ${MUTED}`}>
                  <LockKeyhole size={14} className="mt-0.5 shrink-0 text-[#0B1437] dark:text-[#7BE9D3]" />
                  Les zones sont approximatives : aucune adresse personnelle n’est affichée.
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A1230] via-[#0D1740] to-[#111A4E] p-5 text-white shadow-[0_16px_40px_-16px_rgba(10,18,48,0.7)]">
                <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#7BE9D3]/20 blur-2xl" />
                <div className="relative">
                  <h2 className="text-base font-bold">Vous cherchez une compétence ?</h2>
                  <p className="mt-1.5 text-sm leading-6 text-slate-300">Décrivez votre besoin et trouvez le bon profil dans le réseau.</p>
                  <Link to="/resource-requests/new" className={`mt-4 inline-flex w-full items-center justify-center gap-2 ${BTN_PRIMARY}`}>
                    Créer une demande <ArrowRight size={15} />
                  </Link>
                </div>
              </div>

              <div className={`${CARD} flex items-center gap-3 px-4 py-3.5 text-xs`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#0B1437] dark:bg-white/10 dark:text-[#7BE9D3]">
                  <Users size={17} />
                </span>
                <span>
                  <strong className={`block ${INK}`}>Un réseau, des opportunités</strong>
                  <span className={`mt-0.5 block ${MUTED}`}>Talents et organisations réunis.</span>
                </span>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </Layout>
  );
}

function TrustPill({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-[#0B1437] shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:shadow-none">
      <Icon size={14} className="text-[#0B1437] dark:text-[#7BE9D3]" />{children}
    </span>
  );
}

/* ============================================================
   CARTE TALENT / ENTREPRISE
============================================================ */
function TalentCard({ profile: p, viewer }) {
  const company = p._company || null;
  const isCompany = Boolean(company);

  const nextAvail = p.availability_windows?.[0];
  const isPrivate = p.visibility === "private";

  const displayName = isCompany
    ? company.name || p.user?.name || "Entreprise"
    : p.user?.name || "Talent";

  const initials =
    displayName.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "TS";

  const imageSrc = isCompany
    ? companyLogo(company, p.avatar_path)
    : p.avatar_path
      ? `/storage/${p.avatar_path}`
      : null;

  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(imageSrc) && !imageFailed;

  const headline = isCompany
    ? company.industry || (p.headline && norm(p.headline) !== norm(displayName) ? p.headline : "")
    : p.headline;

  const city = p.city || company?.city;
  const country = p.country || company?.country;
  const verified = isCompany ? Boolean(company.is_verified ?? p.is_verified) : Boolean(p.is_verified);

  const companyPage = isCompany && company.id ? `/entreprises/${company.id}` : null;
  const profilePage = isCompany ? companyPage : `/talents/${p.id}`;

  const ownerId = company?.owner_user_id;
  const canContact = Boolean(isCompany && viewer?.id && ownerId && String(ownerId) !== String(viewer.id));

  return (
    <article className={`${CARD} group p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#0B1437]/20 dark:hover:border-[#7BE9D3]/30 sm:p-6`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="relative shrink-0">
            {showImage ? (
              <img
                src={imageSrc}
                alt={displayName}
                onError={() => setImageFailed(true)}
                className={`h-14 w-14 rounded-2xl ring-1 ring-slate-200 dark:ring-white/10 ${isPrivate ? "opacity-70" : ""} ${
                  isCompany ? "bg-white object-contain p-1.5 dark:bg-[#0A1230]" : "object-cover"
                }`}
              />
            ) : (
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl text-base font-bold ${
                  isCompany
                    ? "bg-gradient-to-br from-indigo-500 to-indigo-800 text-white"
                    : "bg-gradient-to-br from-[#8DF0DC] to-[#5EDCC4] text-[#0A1230]"
                } ${isPrivate ? "opacity-70" : ""}`}
              >
                {initials}
              </div>
            )}
            {verified && (
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#0B1437] text-white dark:border-[#0A1230] dark:bg-[#7BE9D3] dark:text-[#0A1230]">
                <ShieldCheck size={11} />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {isCompany ? (
                <span className="inline-flex items-center rounded-full bg-[#0B1437]/5 px-2.5 py-1 text-[11px] font-bold text-[#0B1437] dark:bg-indigo-400/10 dark:text-indigo-300">
                  Entreprise
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-[#0B1437]/5 px-2.5 py-1 text-[11px] font-bold text-[#0B1437] dark:bg-[#7BE9D3]/10 dark:text-[#7BE9D3]">
                  Talent
                </span>
              )}

              {isPrivate && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                  Privé
                </span>
              )}
              <h3 className={`w-full truncate text-base font-bold sm:w-auto sm:text-lg ${INK}`}>{displayName}</h3>
              {verified && (
                <span className="inline-flex items-center text-xs font-medium text-[#0B1437] dark:text-[#7BE9D3]">
                  Vérifié
                </span>
              )}
            </div>

            {headline && (
              <p className={`mt-1.5 text-sm font-medium ${isCompany ? "text-indigo-800 dark:text-indigo-300" : "text-[#0B1437] dark:text-[#7BE9D3]"}`}>
                {headline}
              </p>
            )}

            <div className={`mt-2.5 flex flex-wrap gap-x-4 gap-y-2 text-xs ${MUTED}`}>
              {city && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={13} className="text-slate-400" />
                  {city}{country ? `, ${country}` : ""}
                </span>
              )}
              {nextAvail && !isPrivate && !isCompany && (
                <span className="inline-flex items-center gap-1.5 font-medium text-[#0B1437] dark:text-[#7BE9D3]">
                  <CalendarCheck size={13} />Disponible dès {new Date(nextAvail.start_at).toLocaleDateString("fr-FR", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>

            {!isPrivate && !isCompany && p.skills?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.skills.slice(0, 5).map((skill) => (
                  <span key={skill.id} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                    {skill.name}
                    {skill.pivot?.level && <span className="ml-1 text-slate-400">· {LEVEL_LABELS[skill.pivot.level]}</span>}
                  </span>
                ))}
                {p.skills.length > 5 && <span className="self-center px-1 text-xs font-semibold text-slate-500 dark:text-slate-400">+{p.skills.length - 5}</span>}
              </div>
            )}

            {isPrivate && !isCompany && (
              <p className={`mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/5 ${MUTED}`}>
                Les informations détaillées de ce profil sont masquées.
              </p>
            )}
          </div>
        </div>

        {p.match_score != null && (
          <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
            <span className={`rounded-full border px-3 py-1.5 text-sm font-bold ${scoreColor(p.match_score)}`}>{p.match_score}% match</span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">score de correspondance</span>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <span className={`inline-flex items-center gap-1.5 text-xs ${MUTED}`}>
          <ShieldCheck size={14} className="text-[#0B1437] dark:text-[#7BE9D3]" />
          {isCompany ? "Organisation du réseau" : isPrivate ? "Informations protégées" : "Coordonnées après accord"}
        </span>

        <div className="flex flex-wrap gap-2">
          {isCompany ? (
            <>
              {canContact && (
                <Link to={`/messages?to=${ownerId}`} className={`${BTN_SECONDARY} flex-1 gap-1.5 sm:flex-none`}>
                  <MessageCircle size={14} /> Contacter
                </Link>
              )}
              {companyPage && (
                <Link to={companyPage} className={`${BTN_PRIMARY} flex-1 sm:flex-none`}>
                  Voir l'entreprise <ArrowRight size={14} />
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to={profilePage} className={`${BTN_SECONDARY} flex-1 sm:flex-none`}>
                Voir le profil
              </Link>
              {!isPrivate && (
                <Link to={profilePage} className={`${BTN_PRIMARY} flex-1 sm:flex-none`}>
                  Proposer <ArrowRight size={14} />
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function OfferCard({ offer: o }) {
  const initials = o.profile?.user?.name?.split(" ").map((part) => part[0]).join("").slice(0, 2) || "TS";

  return (
    <article className={`${CARD} group p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#0B1437]/20 dark:hover:border-[#7BE9D3]/30 sm:p-6`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0A1230] to-[#0D1740] text-base font-bold text-white dark:from-[#7BE9D3] dark:to-[#5EDCC4] dark:text-[#0A1230]">{initials}</div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300">Offre</span>
              <h3 className={`w-full text-base font-bold sm:w-auto sm:text-lg ${INK}`}>{o.title}</h3>
            </div>
            {o.profile?.user && (
              <p className={`mt-1.5 text-sm ${MUTED}`}>
                {o.profile.user.name}{o.profile.headline && ` · ${o.profile.headline}`}
              </p>
            )}
            {o.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{o.description}</p>}
            <div className={`mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs ${MUTED}`}>
              {o.location_city && <span className="inline-flex items-center gap-1.5"><MapPin size={13} />{o.location_city}</span>}
              <span className="inline-flex items-center gap-1.5">
                <Clock size={13} />{o.workload_value}{o.workload_unit === "percentage" ? "%" : o.workload_unit === "hours_per_week" ? " h/sem" : " j/sem"}
              </span>
              {o.daily_rate && <span className="inline-flex items-center gap-1.5 font-semibold text-[#0B1437] dark:text-[#7BE9D3]"><Euro size={13} />{o.daily_rate}/jour</span>}
            </div>
          </div>
        </div>
        {o.match_score != null && <span className={`w-fit shrink-0 rounded-full border px-3 py-1.5 text-sm font-bold ${scoreColor(o.match_score)}`}>{o.match_score}% match</span>}
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <span className={`inline-flex items-center gap-1.5 text-xs ${MUTED}`}><Layers3 size={14} className="text-[#0B1437] dark:text-[#7BE9D3]" />Mise à disposition</span>
        <Link to={`/resource-offers/${o.id}`} className={BTN_PRIMARY}>Voir le détail <ChevronRight size={15} /></Link>
      </div>
    </article>
  );
}

function EmptyState({ hasSearch, onReset }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-white/15 dark:bg-[#131E47]">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300"><Search size={21} /></span>
      <h3 className={`mt-4 text-base font-bold ${INK}`}>Aucun résultat pour le moment</h3>
      <p className={`mx-auto mt-1.5 max-w-sm text-sm leading-6 ${MUTED}`}>Essayez d’élargir vos critères ou de modifier votre recherche pour découvrir d’autres profils.</p>
      {hasSearch && (
        <button type="button" onClick={onReset} className={`${BTN_SECONDARY} mt-4 gap-2`}>
          <X size={14} />Effacer les critères
        </button>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4" aria-label="Chargement des résultats">
      {[1, 2].map((item) => (
        <div key={item} className={`${CARD} animate-pulse p-6`}>
          <div className="flex gap-4">
            <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-white/10" />
            <div className="flex-1 space-y-3 py-1">
              <div className="h-4 w-1/3 rounded bg-slate-100 dark:bg-white/10" />
              <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-white/10" />
              <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-white/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PublicOnlyLayout({ children }) {
  return <div className={`min-h-screen font-sans ${PAGE}`}>{children}</div>;
}