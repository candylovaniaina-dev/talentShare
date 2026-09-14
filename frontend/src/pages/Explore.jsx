import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, MapPin, Sparkles, ShieldCheck, CalendarCheck,
  ShieldAlert, Sliders, X, Briefcase, User, Building2,
  Clock, Euro, Star, Lock,
} from "lucide-react";
import PublicNavbar from "../components/layout/PublicNavbar";
import AppShell from "../components/layout/AppShell";
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
  if (score === null || score === undefined) return "";
  if (score >= 80) return "bg-emerald-100 text-emerald-700";
  if (score >= 60) return "bg-blue-100 text-blue-700";
  if (score >= 40) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
};

const asArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export default function Explore() {
  const { user } = useAuth();
  const Layout = user ? AppShell : PublicOnlyLayout;

  // Recherche + filtres
  const [search, setSearch] = useState("");
  const [profileType, setProfileType] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState("");
  const [locationType, setLocationType] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableTo, setAvailableTo] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [missionType, setMissionType] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [rateMin, setRateMin] = useState("");
  const [rateMax, setRateMax] = useState("");
  const [minLevel, setMinLevel] = useState("");
  const [minYears, setMinYears] = useState("");

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [languageOptions, setLanguageOptions] = useState([]);

  // Résultats
  const [resultFilter, setResultFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Recherches sauvegardées
  const [savedSearches, setSavedSearches] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [searchName, setSearchName] = useState("");

  // ============================================
  // Chargement initial : langues + saved searches
  // ============================================
  useEffect(() => {
    // Langues disponibles
    api.get("/languages")
      .then((res) => setLanguageOptions(asArray(res.data)))
      .catch(() => setLanguageOptions([]));
  }, []);

  useEffect(() => {
    if (user) {
      api.get("/saved-searches")
        .then((res) => setSavedSearches(res.data))
        .catch(() => {});
    }
  }, [user]);

  // ============================================
  // Suggestions de compétences (debounce 300ms)
  // ============================================
  useEffect(() => {
    if (skillSearch.length < 2) { setSkillSuggestions([]); return; }
    const timeout = setTimeout(() => {
      api.get("/skills", { params: { search: skillSearch, limit: 10 } })
        .then((res) => setSkillSuggestions(asArray(res.data)))
        .catch(() => setSkillSuggestions([]));
    }, 300);
    return () => clearTimeout(timeout);
  }, [skillSearch]);

  // ============================================
  // ✅ RECHERCHE AUTOMATIQUE (debounce 300ms)
  // ============================================
  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      api.get("/talents/search", {
        params: {
          search: search || undefined,
          profile_type: profileType || undefined,
          availability_status: availabilityStatus || undefined,
          location_type: locationType || undefined,
          available_from: availableFrom || undefined,
          available_to: availableTo || undefined,
          country: country || undefined,
          city: city || undefined,
          mission_type: missionType || undefined,
          verified_only: verifiedOnly || undefined,
          rate_min: rateMin || undefined,
          rate_max: rateMax || undefined,
          min_level: minLevel || undefined,
          min_years: minYears || undefined,
          skill_ids: selectedSkills.length > 0 ? selectedSkills.map((s) => s.id).join(",") : undefined,
          language_names: languages.length > 0 ? languages.join(",") : undefined,
        },
      })
        .then((res) => {
          setResults(res.data.data || []);
          setTotal(res.data.total || 0);
        })
        .catch((err) => console.error("Erreur recherche:", err))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [
    search, profileType, availabilityStatus, locationType,
    availableFrom, availableTo, country, city, missionType,
    verifiedOnly, rateMin, rateMax, minLevel, minYears,
    selectedSkills, languages,
  ]);

  // ============================================
  // Actions
  // ============================================
  const clearFilters = () => {
    setSearch(""); setProfileType(""); setAvailabilityStatus("");
    setLocationType(""); setAvailableFrom(""); setAvailableTo("");
    setCountry(""); setCity(""); setMissionType("");
    setVerifiedOnly(false); setRateMin(""); setRateMax("");
    setMinLevel(""); setMinYears("");
    setSelectedSkills([]); setLanguages([]);
  };

  const addSkill = (s) => {
    if (!selectedSkills.find((x) => x.id === s.id)) {
      setSelectedSkills([...selectedSkills, s]);
    }
    setSkillSearch("");
    setSkillSuggestions([]);
  };

  const removeSkill = (id) => {
    setSelectedSkills(selectedSkills.filter((s) => s.id !== id));
  };

  const toggleLanguage = (lang) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const saveCurrentSearch = async () => {
    if (!searchName.trim()) return;
    try {
      await api.post("/saved-searches", {
        name: searchName,
        criteria: {
          search, profile_type: profileType, availability_status: availabilityStatus,
          location_type: locationType, available_from: availableFrom, available_to: availableTo,
          country, city, mission_type: missionType, verified_only: verifiedOnly,
          rate_min: rateMin, rate_max: rateMax, min_level: minLevel,
          min_years: minYears, skill_ids: selectedSkills.map((s) => s.id),
          languages,
        },
        notify_on_match: true,
      });
      setShowSaveModal(false);
      setSearchName("");
      api.get("/saved-searches").then((res) => setSavedSearches(res.data));
    } catch (err) {
      alert("Erreur lors de la sauvegarde");
    }
  };

  const loadSavedSearch = (s) => {
    const c = s.criteria || {};
    if (c.search !== undefined) setSearch(c.search);
    if (c.profile_type !== undefined) setProfileType(c.profile_type);
    if (c.availability_status !== undefined) setAvailabilityStatus(c.availability_status);
    if (c.location_type !== undefined) setLocationType(c.location_type);
    if (c.available_from !== undefined) setAvailableFrom(c.available_from);
    if (c.available_to !== undefined) setAvailableTo(c.available_to);
    if (c.country !== undefined) setCountry(c.country);
    if (c.city !== undefined) setCity(c.city);
    if (c.mission_type !== undefined) setMissionType(c.mission_type);
    if (c.verified_only !== undefined) setVerifiedOnly(c.verified_only);
    if (c.rate_min !== undefined) setRateMin(c.rate_min);
    if (c.rate_max !== undefined) setRateMax(c.rate_max);
    if (c.min_level !== undefined) setMinLevel(c.min_level);
    if (c.min_years !== undefined) setMinYears(c.min_years);
    if (c.languages !== undefined) setLanguages(c.languages);
  };

  const deleteSavedSearch = async (id) => {
    if (!confirm("Supprimer cette recherche ?")) return;
    await api.delete(`/saved-searches/${id}`);
    setSavedSearches(savedSearches.filter((x) => x.id !== id));
  };

  const trackInteraction = async (targetType, targetId, action, score) => {
    if (!user) return;
    try {
      await api.post("/match-interactions", {
        target_type: targetType,
        target_id: targetId,
        action,
        match_score_at_action: score,
        search_criteria: {
          search, profile_type: profileType, city, country,
          availability_status: availabilityStatus,
          location_type: locationType,
          skill_ids: selectedSkills.map((s) => s.id),
        },
      });
    } catch (err) { /* silent */ }
  };

  const activeFiltersCount = [
    availabilityStatus, locationType, availableFrom, availableTo,
    country, city, missionType, verifiedOnly, rateMin, rateMax,
    minLevel, minYears,
  ].filter(Boolean).length + selectedSkills.length + languages.length;

  const filteredResults = resultFilter === "all"
    ? results
    : results.filter((r) => r.result_type === resultFilter);

  const countProfiles = results.filter((r) => r.result_type === "profile").length;
  const countOffers = results.filter((r) => r.result_type === "offer").length;

  return (
    <Layout>
      {!user && (
        <div className="mx-auto max-w-6xl px-6 pt-6">
          <PublicNavbar variant="light" />
        </div>
      )}

      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-mint">Explorer le réseau</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
              Les bonnes compétences sont déjà là.
            </h1>
            <p className="mt-2 max-w-xl text-slate-500">
              Trouvez les talents disponibles ou les offres de mise à disposition.
              Filtrez par compétence, disponibilité, localisation et bien plus.
            </p>
          </div>
          <span className="hidden shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 sm:flex">
            <ShieldAlert size={14} className="text-mint" /> Données protégées
          </span>
        </div>

        {/* ============================================
            BARRE DE RECHERCHE (sans bouton "Rechercher")
            ============================================ */}
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

          <div className="flex rounded-xl border border-slate-200 p-0.5">
            {[
              { id: "all",     label: `Tout (${results.length})` },
              { id: "profile", label: `Talents (${countProfiles})` },
              { id: "offer",   label: `Offres (${countOffers})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setResultFilter(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  resultFilter === tab.id ? "bg-navy text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
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

          {user && (
            <button
              type="button"
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-navy"
            >
              <Star size={14} /> Sauvegarder
            </button>
          )}
        </div>

        {/* Filtres rapides (chips) */}
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { label: "🟢 Disponibles", key: "available" },
            { label: "🏠 Télétravail", key: "remote" },
            { label: "✅ Vérifiés", key: "verified" },
            { label: "🚀 Niveau avancé+", key: "advanced" },
          ].map((chip) => {
            const isActive =
              chip.key === "available" ? availabilityStatus === "available"
              : chip.key === "remote" ? locationType === "remote"
              : chip.key === "verified" ? verifiedOnly
              : chip.key === "advanced" ? minLevel === "advanced"
              : false;

            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => {
                  if (chip.key === "available") setAvailabilityStatus(isActive ? "" : "available");
                  if (chip.key === "remote") setLocationType(isActive ? "" : "remote");
                  if (chip.key === "verified") setVerifiedOnly(!verifiedOnly);
                  if (chip.key === "advanced") setMinLevel(isActive ? "" : "advanced");
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  isActive ? "border-navy bg-navy text-white" : "border-slate-200 text-slate-600 hover:border-navy"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Recherches sauvegardées */}
        {savedSearches.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <p className="text-xs font-semibold uppercase text-slate-400">⭐ Mes recherches</p>
            {savedSearches.map((s) => (
              <div key={s.id} className="flex items-center gap-1 rounded-full border border-slate-200 bg-white pl-3 pr-1 py-1">
                <button onClick={() => loadSavedSearch(s)} className="text-xs font-semibold hover:text-navy">
                  {s.name}
                </button>
                <button onClick={() => deleteSavedSearch(s.id)} className="text-slate-400 hover:text-rose-500 px-1">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Filtres avancés */}
        {showFilters && (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Filtres avancés</p>
              {activeFiltersCount > 0 && (
                <button onClick={clearFilters} className="text-xs font-semibold text-rose-500 hover:underline flex items-center gap-1">
                  <X size={12} /> Effacer tout
                </button>
              )}
            </div>

            {/* Compétences */}
            <div className="relative">
              <label className="text-xs font-semibold text-slate-500">Compétences recherchées</label>
              <div className="mt-1 flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 min-h-[42px]">
                {selectedSkills.map((s) => (
                  <span key={s.id} className="flex items-center gap-1 rounded-full bg-mint/15 px-2.5 py-1 text-xs font-medium text-navy">
                    {s.name}
                    <button type="button" onClick={() => removeSkill(s.id)} className="text-slate-400 hover:text-rose-500">
                      <X size={11} />
                    </button>
                  </span>
                ))}
                <input
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  placeholder={selectedSkills.length === 0 ? "Ex: Python, React, Laravel..." : ""}
                  className="flex-1 min-w-[150px] bg-transparent text-sm focus:outline-none"
                />
              </div>
              {skillSearch.length >= 2 && skillSuggestions.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg z-20 max-h-60 overflow-y-auto">
                  {skillSuggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => addSkill(s)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                    >
                      <span>{s.category?.parent?.icon || "🏷️"}</span>
                      <span className="font-medium">{s.name}</span>
                      {s.category?.parent?.name && (
                        <span className="text-xs text-slate-400">· {s.category.parent.name}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Niveau + Années + Type profil */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="text-xs font-semibold text-slate-500">Niveau minimum</label>
                <select value={minLevel} onChange={(e) => setMinLevel(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <option value="">Tous</option>
                  <option value="beginner">🌱 Débutant</option>
                  <option value="intermediate">📘 Intermédiaire</option>
                  <option value="advanced">🚀 Avancé</option>
                  <option value="expert">🏆 Expert</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Années d'expérience min</label>
                <input type="number" min="0" max="60" value={minYears}
                  onChange={(e) => setMinYears(e.target.value)}
                  placeholder="Ex: 2"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Type de profil</label>
                <select value={profileType} onChange={(e) => setProfileType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <option value="">Tous</option>
                  <option value="employee">Salariés</option>
                  <option value="student">Étudiants</option>
                </select>
              </div>
            </div>

            {/* Type mission + Loc + Statut */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="text-xs font-semibold text-slate-500">Type de mission</label>
                <select value={missionType} onChange={(e) => setMissionType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <option value="">Tous</option>
                  {Object.entries(MISSION_TYPES).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Localisation</label>
                <select value={locationType} onChange={(e) => setLocationType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <option value="">Toutes</option>
                  <option value="onsite">🏢 Sur site</option>
                  <option value="remote">🏠 Télétravail</option>
                  <option value="hybrid">🔄 Hybride</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Statut de disponibilité</label>
                <select value={availabilityStatus} onChange={(e) => setAvailabilityStatus(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <option value="">Tous</option>
                  <option value="available">🟢 Disponibles</option>
                  <option value="partially_available">🟡 Partiels</option>
                  <option value="on_mission">🔵 En mission</option>
                </select>
              </div>
            </div>

            {/* Pays + Ville */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-500">Pays</label>
                <input value={country} onChange={(e) => setCountry(e.target.value)}
                  placeholder="Ex: Madagascar"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Ville</label>
                <input value={city} onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Antananarivo"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>

            {/* Période + taux */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-xs font-semibold text-slate-500">Disponible du</label>
                <input type="date" value={availableFrom}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setAvailableFrom(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Au</label>
                <input type="date" value={availableTo}
                  min={availableFrom || new Date().toISOString().split("T")[0]}
                  onChange={(e) => setAvailableTo(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Taux/jour min (€)</label>
                <input type="number" min="0" value={rateMin}
                  onChange={(e) => setRateMin(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Taux/jour max (€)</label>
                <input type="number" min="0" value={rateMax}
                  onChange={(e) => setRateMax(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>

            {/* Langues */}
            <div>
              <label className="text-xs font-semibold text-slate-500">Langues parlées</label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {languageOptions.length === 0 && (
                  <span className="text-xs text-slate-400">Chargement des langues...</span>
                )}
                {languageOptions.map((lang) => {
                  const active = languages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        active ? "bg-navy text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <input type="checkbox" checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)} />
              ✅ Uniquement les profils vérifiés
            </label>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={clearFilters}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
                Réinitialiser
              </button>
              <button onClick={() => setShowFilters(false)}
                className="rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* ============================================
            COMPTEUR + INDICATEUR DE RECHERCHE
            ============================================ */}
        <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm font-semibold text-slate-500 flex items-center gap-2">
            {loading ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-navy border-t-transparent" />
                Recherche en cours...
              </>
            ) : (
              `${filteredResults.length} résultat${filteredResults.length > 1 ? "s" : ""}`
            )}
          </p>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-rose-500 hover:underline flex items-center gap-1"
            >
              <X size={12} /> Effacer les filtres ({activeFiltersCount})
            </button>
          )}
        </div>

        {/* Résultats */}
        <div className="mt-3 grid gap-4">
          {filteredResults.map((item) =>
            item.result_type === "profile" ? (
              <ProfileCard
                key={`p-${item.id}`}
                profile={item}
                onView={() => trackInteraction("App\\Models\\ProfessionalProfile", item.id, "viewed", item.match_score)}
                onPropose={() => trackInteraction("App\\Models\\ProfessionalProfile", item.id, "proposed", item.match_score)}
              />
            ) : (
              <OfferCard
                key={`o-${item.id}`}
                offer={item}
                onView={() => trackInteraction("App\\Models\\ResourceOffer", item.id, "viewed", item.match_score)}
              />
            )
          )}

          {!loading && filteredResults.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <p className="font-semibold text-slate-600">Aucun résultat</p>
              <p className="mt-1 text-sm text-slate-400">Essayez d'élargir vos filtres.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal sauvegarde */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowSaveModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Star size={20} className="text-amber-500" /> Sauvegarder cette recherche
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Vous serez notifié quand de nouveaux profils correspondront à ces critères.
            </p>
            <input
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Ex: Développeur Laravel senior"
              autoFocus
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={saveCurrentSearch}
                disabled={!searchName.trim()}
                className="flex-1 rounded-xl bg-navy py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                Sauvegarder
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

// ============================================
// CARTE PROFIL
// ============================================
function ProfileCard({ profile: p, onView, onPropose }) {
  const nextAvail = p.availability_windows?.[0];
  const isPrivate = p.visibility === "private";

  const statusCfg = isPrivate
    ? { emoji: "🔒", label: "Profil privé" }
    : {
        available: { emoji: "🟢", label: "Disponible" },
        partially_available: { emoji: "🟡", label: "Partiel" },
        on_mission: { emoji: "🔵", label: "En mission" },
      }[nextAvail?.status] || null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {p.avatar_path ? (
            <img
              src={`http://localhost:8000/storage/${p.avatar_path}`}
              alt={p.user?.name}
              className={`h-16 w-16 rounded-2xl object-cover ${isPrivate ? "opacity-60" : ""}`}
            />
          ) : (
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-mint text-xl font-bold text-white ${isPrivate ? "opacity-60" : ""}`}>
              {p.user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                <User size={10} /> Talent
              </span>
              <p className="font-bold">{p.user?.name}</p>
              {p.is_verified && <ShieldCheck size={14} className="text-mint" />}

              {statusCfg && (
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  isPrivate ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-700"
                }`}>
                  {statusCfg.emoji} {statusCfg.label}
                </span>
              )}
            </div>

            {p.headline && <p className="text-sm text-slate-500 mt-0.5">{p.headline}</p>}

            {p.city && (
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {p.city}{p.country ? `, ${p.country}` : ""}
                </span>
                {nextAvail && !isPrivate && (
                  <span className="flex items-center gap-1">
                    <CalendarCheck size={12} />
                    Dès {new Date(nextAvail.start_at).toLocaleDateString("fr-FR", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            )}

            {!isPrivate && p.skills?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {p.skills.slice(0, 5).map((s) => (
                  <span key={s.id} className="rounded-full bg-mint/15 px-2.5 py-1 text-xs font-medium text-navy">
                    {s.name}
                    {s.pivot?.level && (
                      <span className="text-[10px] text-slate-400 ml-1">· {LEVEL_LABELS[s.pivot.level]}</span>
                    )}
                  </span>
                ))}
                {p.skills.length > 5 && (
                  <span className="text-xs text-slate-400 self-center">+{p.skills.length - 5}</span>
                )}
              </div>
            )}

            {isPrivate && (
              <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-500 flex items-center gap-2">
                <Lock size={13} className="text-slate-400" />
                <span>Ce profil est privé — infos détaillées masquées.</span>
              </div>
            )}
          </div>
        </div>

        {p.match_score !== null && p.match_score !== undefined && (
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${scoreColor(p.match_score)}`}>
              {p.match_score}% match
            </span>
            <span className="text-[10px] text-slate-400">qualité du profil</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck size={13} className="text-mint" />
          {isPrivate ? "Certaines infos masquées" : "Coordonnées après accord"}
        </span>
        <div className="flex gap-2">
          <Link
            to={`/talents/${p.id}`}
            onClick={onView}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold hover:border-navy"
          >
            Voir le profil
          </Link>
          {!isPrivate && (
            <Link
              to={`/talents/${p.id}`}
              onClick={onPropose}
              className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light"
            >
              Proposer
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
function OfferCard({ offer: o, onView }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {o.profile?.avatar_path ? (
            <img src={`http://localhost:8000/storage/${o.profile.avatar_path}`} alt={o.profile.user?.name}
              className="h-16 w-16 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-mint text-xl font-bold text-white">
              {o.profile?.user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                <Briefcase size={10} /> Offre
              </span>
              <p className="font-bold">{o.title}</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {MISSION_TYPES[o.mission_type] || o.mission_type}
              </span>
            </div>

            {o.profile?.user && (
              <p className="text-sm text-slate-500 mt-0.5">
                {o.profile.user.name}
                {o.profile.headline && ` · ${o.profile.headline}`}
              </p>
            )}

            {o.description && (
              <p className="mt-1 text-sm text-slate-500 line-clamp-2">{o.description}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              {o.location_city && <span className="flex items-center gap-1"><MapPin size={12} />{o.location_city}</span>}
              <span className="flex items-center gap-1">
                <Clock size={12} />{o.workload_value}
                {o.workload_unit === "percentage" ? "%" : o.workload_unit === "hours_per_week" ? "h/sem" : "j/sem"}
              </span>
              {o.daily_rate && (
                <span className="flex items-center gap-1 text-navy font-semibold">
                  <Euro size={12} />{o.daily_rate}/jour
                </span>
              )}
            </div>

            {o.skills?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {o.skills.slice(0, 4).map((s) => (
                  <span key={s.id} className="rounded-full bg-mint/15 px-2.5 py-1 text-xs font-medium text-navy">
                    {s.name}
                  </span>
                ))}
              </div>
            )}

            {o.company && (
              <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                <Building2 size={12} /> Proposé par {o.company.name}
              </p>
            )}
          </div>
        </div>

        {o.match_score !== null && o.match_score !== undefined && (
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${scoreColor(o.match_score)}`}>
              {o.match_score}% match
            </span>
            <span className="text-[10px] text-slate-400">qualité de l'offre</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <Sparkles size={13} className="text-mint" /> Mise à disposition
        </span>
        <Link
          to={`/resource-offers/${o.id}`}
          onClick={onView}
          className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light"
        >
          Voir le détail
        </Link>
      </div>
    </div>
  );
}

// Layout visiteur non connecté
function PublicOnlyLayout({ children }) {
  return <div className="min-h-screen bg-slate-50 font-sans text-navy">{children}</div>;
}