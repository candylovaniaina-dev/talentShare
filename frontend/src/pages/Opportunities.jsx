import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, MapPin, Home, Heart, X, Send, CheckCircle, Loader2, RotateCcw, Banknote,
  Bookmark, Trash2, ShieldCheck, Target, ChevronDown,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import JobOfferDetail from "./JobOfferDetail";
import ApplyToRequestModal from "../components/requests/ApplyToRequestModal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import { MatchRing, Logo, TYPE_LABELS, fileUrl, timeAgo, matchTone } from "../components/radar/radarUi";

/* ============================================================
   CONFIG
============================================================ */
const card = "rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-white/10 dark:bg-[#112A3A] dark:shadow-none";
const TYPES = [
  { id: "stage", label: "Stage" },
  { id: "alternance", label: "Alternance" },
  { id: "emploi", label: "Emploi" },
  { id: "mission", label: "Mission freelance" },
];
const KINDS = [["all", "Tout"], ["offers", "Recrutement"], ["requests", "Demandes"]];
const MIN_SCORES = [[0, "Tous"], [50, "50 %+"], [70, "70 %+"]];

const asArray = (d) => (Array.isArray(d) ? d : d && Array.isArray(d.data) ? d.data : []);
const readJson = (key, fallback) => {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; }
};

const defaultPrefs = (user) => ({
  types: [],
  city: user?.professional_profile?.city || user?.city || "",
  remote: false,
  kind: "all",
  minScore: 0,
  q: "",
});

/* ============================================================
   PAGE
============================================================ */
export default function Opportunities() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const uid = user?.id;
  const prefsKey = `talentshare_radar_prefs_${uid}`;
  const dismissedKey = `talentshare_radar_dismissed_${uid}`;
  const favKey = `talentshare_favorites_${uid}`;
  const seenKey = `talentshare_radar_seen_${uid}`;

  const [prefs, setPrefs] = useState(() => ({ ...defaultPrefs(user), ...readJson(prefsKey, {}) }));
  const [debounced, setDebounced] = useState(prefs);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dismissed, setDismissed] = useState(() => readJson(dismissedKey, []));
  const [favorites, setFavorites] = useState(() => readJson(favKey, []));
  const [applications, setApplications] = useState([]);
  const [sent, setSent] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [naming, setNaming] = useState(false);
  const [searchName, setSearchName] = useState("");

  const [offerId, setOfferId] = useState(null);
  const [applyRequest, setApplyRequest] = useState(null);

  const prevSeen = useRef(localStorage.getItem(seenKey));
  const markedRef = useRef(false);

  /* ---------- persistance ---------- */
  useEffect(() => { try { localStorage.setItem(prefsKey, JSON.stringify(prefs)); } catch { /* ignore */ } }, [prefs, prefsKey]);
  useEffect(() => { try { localStorage.setItem(dismissedKey, JSON.stringify(dismissed)); } catch { /* ignore */ } }, [dismissed, dismissedKey]);
  useEffect(() => { try { localStorage.setItem(favKey, JSON.stringify(favorites)); } catch { /* ignore */ } }, [favorites, favKey]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(prefs), 350);
    return () => clearTimeout(t);
  }, [prefs]);

  /* ---------- chargement du radar ---------- */
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const params = { limit: 60 };
      if (debounced.types.length) params.types = debounced.types;
      if (debounced.city.trim()) params.city = debounced.city.trim();
      if (debounced.remote) params.remote = 1;
      if (debounced.kind !== "all") params.kind = debounced.kind;
      if (debounced.minScore) params.min_score = debounced.minScore;
      if (debounced.q.trim()) params.q = debounced.q.trim();

      const res = await api.get("/radar", { params });
      setData(res.data);

      if (!markedRef.current) {
        markedRef.current = true;
        try { localStorage.setItem(seenKey, new Date().toISOString()); } catch { /* ignore */ }
      }
    } catch {
      setError("Impossible de charger vos opportunités.");
    } finally {
      setLoading(false);
    }
  }, [debounced, seenKey]);

  useEffect(() => { load(); }, [load]);

  const loadContext = useCallback(() => {
    api.get("/applications").then((r) => setApplications(asArray(r.data))).catch(() => setApplications([]));
    api.get("/proposals/sent").then((r) => setSent(asArray(r.data))).catch(() => setSent([]));
  }, []);

  const loadSaved = useCallback(() => {
    api.get("/saved-searches")
      .then((r) => setSavedSearches(asArray(r.data).filter((s) => s.criteria?.radar)))
      .catch(() => setSavedSearches([]));
  }, []);

  useEffect(() => { loadContext(); loadSaved(); }, [loadContext, loadSaved]);

  /* ---------- déjà postulé ---------- */
  const appliedOffers = useMemo(
    () => new Set(applications.map((a) => a.job_offer_id).filter(Boolean).map(String)),
    [applications]
  );
  const appliedRequests = useMemo(
    () => new Set(
      sent.map((p) => p.resource_request_id ?? p.resourceRequest?.id ?? p.resource_request?.id ?? p.request_id ?? p.subject_id)
        .filter(Boolean).map(String)
    ),
    [sent]
  );
  const isApplied = (it) => (it.kind === "job_offer" ? appliedOffers.has(String(it.id)) : appliedRequests.has(String(it.id)));

  /* ---------- liste visible ---------- */
  const items = useMemo(
    () => (data?.data || []).filter((it) => !dismissed.includes(it.key)),
    [data, dismissed]
  );
  const hiddenCount = (data?.data || []).filter((it) => dismissed.includes(it.key)).length;

  const isNew = (it) => !!prevSeen.current && new Date(it.created_at) > new Date(prevSeen.current);

  /* ---------- actions ---------- */
  const setPref = (patch) => setPrefs((p) => ({ ...p, ...patch }));
  const toggleType = (id) => setPref({ types: prefs.types.includes(id) ? prefs.types.filter((t) => t !== id) : [...prefs.types, id] });
  const resetPrefs = () => setPrefs({ ...defaultPrefs(user), city: "" });
  const toggleFav = (key) => setFavorites((f) => (f.includes(key) ? f.filter((k) => k !== key) : [...f, key]));
  const dismiss = (key) => { setDismissed((d) => [...d, key]); showToast("Opportunité masquée", "success"); };

  const onApply = (it) => {
    if (it.kind === "job_offer") setOfferId(it.id);
    else setApplyRequest({ ...it, id: it.id, real_id: it.id, match_score: it.score });
  };

  const saveSearch = async (e) => {
    e.preventDefault();
    const name = searchName.trim();
    if (!name) return;
    try {
      await api.post("/saved-searches", {
        name,
        notify_on_match: false,
        criteria: { radar: true, types: prefs.types, city: prefs.city, remote: prefs.remote, kind: prefs.kind, minScore: prefs.minScore, q: prefs.q },
      });
      setNaming(false);
      setSearchName("");
      loadSaved();
      showToast("Recherche enregistrée", "success");
    } catch {
      showToast("Impossible d'enregistrer la recherche", "error");
    }
  };

  const applySaved = (s) => {
    const { radar, ...c } = s.criteria || {};
    setPrefs({ ...defaultPrefs(user), ...c });
  };

  const deleteSaved = async (s) => {
    try {
      await api.delete(`/saved-searches/${s.id}`);
      setSavedSearches((list) => list.filter((x) => x.id !== s.id));
    } catch {
      showToast("Suppression impossible", "error");
    }
  };

  const hasFilters = prefs.types.length || prefs.city.trim() || prefs.remote || prefs.kind !== "all" || prefs.minScore || prefs.q.trim();
  const chip = (on) =>
    `rounded-full border px-3.5 py-1.5 text-xs font-semibold transition active:scale-95 ${
      on
        ? "border-teal-400 bg-teal-50 text-teal-700 dark:border-teal-500/50 dark:bg-teal-500/20 dark:text-teal-300"
        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-[#142B49] dark:text-slate-300"
    }`;
  const input = "w-full rounded-lg border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 dark:border-white/10 dark:bg-[#142B49] dark:text-white dark:placeholder:text-slate-500";

  return (
    <AppShell>
      <div className="mx-auto max-w-[1280px] space-y-5 px-3 py-4 sm:px-5 lg:px-7">
        {/* ===== PROFIL DE RECHERCHE ===== */}
        <section className={`${card} space-y-4 p-4 sm:p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white">
                <Target size={18} className="text-teal-500" /> Mon radar
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Offres et demandes classées selon leur compatibilité avec votre profil.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {hasFilters ? (
                <button onClick={resetPrefs} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400">
                  <RotateCcw size={13} /> Réinitialiser
                </button>
              ) : null}
              <button onClick={() => setNaming((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">
                <Bookmark size={13} /> Enregistrer cette recherche
              </button>
            </div>
          </div>

          {naming && (
            <form onSubmit={saveSearch} className="flex flex-wrap gap-2">
              <input value={searchName} onChange={(e) => setSearchName(e.target.value)} maxLength={60} autoFocus placeholder="Nom de la recherche (ex : Stage marketing Tana)"
                className="min-w-[220px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-400 dark:border-white/10 dark:bg-[#142B49] dark:text-white" />
              <button type="submit" disabled={!searchName.trim()} className="rounded-lg bg-[#0B1F33] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 dark:bg-[#16B8B1] dark:text-[#0B1F33]">Enregistrer</button>
            </form>
          )}

          <div className="flex flex-wrap gap-2">
            <span className="mr-1 self-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">Je cherche</span>
            {TYPES.map((t) => (
              <button key={t.id} onClick={() => toggleType(t.id)} className={chip(prefs.types.includes(t.id))}>{t.label}</button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_auto]">
            <label className="relative block">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={prefs.q} onChange={(e) => setPref({ q: e.target.value })} placeholder="Mot-clé, compétence, entreprise…" className={input} />
            </label>
            <label className="relative block">
              <MapPin size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={prefs.city} onChange={(e) => setPref({ city: e.target.value })} placeholder="Ville préférée" className={input} />
            </label>
            <button onClick={() => setPref({ remote: !prefs.remote })} className={`${chip(prefs.remote)} inline-flex items-center justify-center gap-2 !rounded-lg !py-2.5`}>
              <Home size={14} /> Télétravail
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-white/10">
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-white/5">
              {KINDS.map(([id, label]) => (
                <button key={id} onClick={() => setPref({ kind: id })}
                  className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition ${prefs.kind === id ? "bg-white text-slate-800 shadow-sm dark:bg-white/10 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}>{label}</button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Compatibilité</span>
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-white/5">
                {MIN_SCORES.map(([v, label]) => (
                  <button key={v} onClick={() => setPref({ minScore: v })}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${prefs.minScore === v ? "bg-white text-slate-800 shadow-sm dark:bg-white/10 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}>{label}</button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* ===== FIL ===== */}
          <div className="min-w-0 space-y-4">
            {loading ? (
              [0, 1, 2].map((i) => <div key={i} className="ts-skel h-56 rounded-2xl" />)
            ) : error ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                <span>{error}</span>
                <button onClick={() => load()} className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white">Réessayer</button>
              </div>
            ) : data && data.profile_found === false ? (
              <div className={`${card} p-10 text-center`}>
                <p className="text-base font-semibold text-slate-800 dark:text-white">Créez votre profil pour activer le radar</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">Le radar compare vos compétences, votre ville et vos disponibilités aux offres publiées.</p>
                <Link to="/profile" className="mt-5 inline-block rounded-lg bg-[#0B1F33] px-5 py-2.5 text-sm font-semibold text-white dark:bg-[#16B8B1] dark:text-[#0B1F33]">Compléter mon profil</Link>
              </div>
            ) : items.length === 0 ? (
              <div className={`${card} border-dashed p-10 text-center`}>
                <p className="text-base font-semibold text-slate-800 dark:text-white">Aucune opportunité ne correspond</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
                  Élargissez vos filtres ou baissez le seuil de compatibilité.
                  {data?.profile?.tips?.[0] ? ` ${data.profile.tips[0]}` : ""}
                </p>
                {hasFilters ? <button onClick={resetPrefs} className="mt-5 rounded-lg bg-teal-50 px-4 py-2.5 text-xs font-semibold text-teal-700 dark:bg-teal-500/20 dark:text-teal-300">Effacer les filtres</button> : null}
              </div>
            ) : (
              <>
                <p className="px-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {items.length} opportunité{items.length > 1 ? "s" : ""} · classées par compatibilité
                </p>
                {items.map((it, i) => (
                  <div key={it.key} className="ts-rise" style={{ animationDelay: `${Math.min(i, 6) * 50}ms` }}>
                    <RadarCard
                      item={it}
                      applied={isApplied(it)}
                      favorite={favorites.includes(it.key)}
                      isNew={isNew(it)}
                      onApply={() => onApply(it)}
                      onFav={() => toggleFav(it.key)}
                      onDismiss={() => dismiss(it.key)}
                    />
                  </div>
                ))}
              </>
            )}
            {hiddenCount > 0 && (
              <button onClick={() => setDismissed([])} className="mx-auto block text-xs font-medium text-slate-500 hover:text-teal-600 dark:text-slate-400">
                {hiddenCount} opportunité{hiddenCount > 1 ? "s" : ""} masquée{hiddenCount > 1 ? "s" : ""} · tout réafficher
              </button>
            )}
          </div>

          {/* ===== COLONNE DROITE ===== */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {data?.profile && (
              <section className={`${card} p-5`}>
                <div className="flex items-center gap-4">
                  <MatchRing score={data.profile.completeness} size={60} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Qualité de votre profil</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{data.profile.skills_count} compétence(s) renseignée(s)</p>
                  </div>
                </div>
                {data.profile.tips.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {data.profile.tips.map((t) => (
                      <li key={t} className="rounded-lg bg-amber-50 px-3 py-2 text-[12px] leading-5 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">{t}</li>
                    ))}
                  </ul>
                )}
                <Link to="/profile" className="mt-4 block rounded-lg bg-slate-100 py-2 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white">Améliorer mon profil</Link>
              </section>
            )}

            {data?.counts && (
              <section className={`${card} grid grid-cols-3 divide-x divide-slate-100 p-4 text-center dark:divide-white/10`}>
                <div><p className="text-xl font-bold text-slate-800 dark:text-white">{data.counts.offers}</p><p className="text-[10px] font-medium text-slate-500">Offres</p></div>
                <div><p className="text-xl font-bold text-slate-800 dark:text-white">{data.counts.requests}</p><p className="text-[10px] font-medium text-slate-500">Demandes</p></div>
                <div><p className="text-xl font-bold text-teal-600 dark:text-teal-400">{data.counts.strong}</p><p className="text-[10px] font-medium text-slate-500">70 %+</p></div>
              </section>
            )}

            <section className={`${card} p-5`}>
              <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-white">Mes recherches</h3>
              {savedSearches.length === 0 ? (
                <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">Réglez vos filtres puis cliquez sur « Enregistrer cette recherche » pour la retrouver en un clic.</p>
              ) : (
                <ul className="space-y-1.5">
                  {savedSearches.map((s) => (
                    <li key={s.id} className="group flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-50 dark:hover:bg-white/5">
                      <button onClick={() => applySaved(s)} className="min-w-0 flex-1 truncate text-left text-xs font-medium text-slate-700 hover:text-teal-600 dark:text-slate-200">{s.name}</button>
                      <button onClick={() => deleteSaved(s)} aria-label="Supprimer" className="rounded p-1 text-slate-400 opacity-0 transition hover:text-rose-500 group-hover:opacity-100"><Trash2 size={13} /></button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </div>

      {offerId && <JobOfferDetail offerId={offerId} onClose={() => { setOfferId(null); loadContext(); }} />}
      {applyRequest && (
        <ApplyToRequestModal
          request={applyRequest}
          onClose={() => setApplyRequest(null)}
          onSuccess={() => {
            setApplyRequest(null);
            showToast("Votre proposition a été envoyée avec succès !", "success");
            loadContext();
          }}
        />
      )}
    </AppShell>
  );
}

/* ============================================================
   CARTE D'OPPORTUNITÉ
============================================================ */
function RadarCard({ item, applied, favorite, isNew, onApply, onFav, onDismiss }) {
  const [open, setOpen] = useState(false);
  const isOffer = item.kind === "job_offer";
  const tone = matchTone(item.score);
  const reasons = open ? item.reasons : item.reasons.slice(0, 3);
  const location = [item.city, item.country].filter(Boolean).join(", ");

  return (
    <article className={`${card} relative overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:shadow-md`}>
      <span className={`absolute inset-y-0 left-0 w-1 ${isOffer ? "bg-violet-400" : "bg-teal-400"}`} />

      <div className="flex items-start gap-4 px-6 pt-5">
        <Logo src={fileUrl(item.company?.logo_path)} name={item.company?.name} size={46} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{item.company?.name || "Entreprise"}</p>
            {item.company?.is_verified && <ShieldCheck size={14} className="text-teal-500" />}
            {isNew && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">Nouveau</span>}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{timeAgo(item.created_at)}</p>
        </div>
        <div className="flex flex-col items-center">
          <MatchRing score={item.score} size={56} />
          <span className="mt-1 hidden text-[10px] font-medium sm:block" style={{ color: tone.color }}>{tone.label}</span>
        </div>
      </div>

      <div className="px-6 pb-4 pt-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${isOffer ? "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400" : "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400"}`}>
            {TYPE_LABELS[item.type_key] || (isOffer ? "Recrutement" : "Mission")} · {isOffer ? "Offre" : "Demande de talent"}
          </span>
        </div>

        <h3 className="text-lg font-semibold leading-snug text-slate-800 dark:text-white">{item.title}</h3>
        <p className="mt-1.5 text-[13px] leading-6 text-slate-600 dark:text-slate-300">{item.excerpt}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
          {location && <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 dark:border-white/10"><MapPin size={12} className="text-teal-500" />{location}</span>}
          {item.remote && <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 dark:border-white/10"><Home size={12} className="text-teal-500" />Télétravail</span>}
          {(item.budget_min || item.budget_max) && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 dark:bg-white/10"><Banknote size={12} />{item.budget_min || 0} - {item.budget_max || 0} € / jour</span>
          )}
        </div>

        {/* Pourquoi ça colle */}
        <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-white/5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pourquoi cette opportunité</p>
          <ul className="space-y-1.5">
            {reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px] leading-5 text-slate-700 dark:text-slate-200">
                <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${r.tone === "ok" ? "bg-teal-500" : r.tone === "warn" ? "bg-amber-500" : "bg-slate-400"}`} />
                {r.text}
              </li>
            ))}
          </ul>
          {item.reasons.length > 3 && (
            <button onClick={() => setOpen((o) => !o)} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400">
              {open ? "Voir moins" : "Voir tout"} <ChevronDown size={12} className={open ? "rotate-180" : ""} />
            </button>
          )}
          {item.missing_skills.length > 0 && (
            <div className="mt-3 border-t border-slate-200 pt-3 dark:border-white/10">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Il vous manque</p>
              <div className="flex flex-wrap gap-1.5">
                {item.missing_skills.slice(0, 6).map((s) => (
                  <span key={s} className="rounded-md bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 dark:border-white/5">
        <div className="flex items-center gap-1">
          <button onClick={onFav} aria-label="Enregistrer" className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition hover:bg-slate-50 dark:hover:bg-white/5 ${favorite ? "text-rose-500" : "text-slate-500 dark:text-slate-400"}`}>
            <Heart size={15} fill={favorite ? "currentColor" : "none"} /> {favorite ? "Enregistrée" : "Enregistrer"}
          </button>
          <button onClick={onDismiss} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/5">
            <X size={15} /> Pas intéressé
          </button>
        </div>
        {applied ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2.5 text-[13px] font-semibold text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-400">
            <CheckCircle size={15} /> {isOffer ? "Candidature envoyée" : "Proposition envoyée"}
          </span>
        ) : (
          <button onClick={onApply} className="inline-flex items-center gap-2 rounded-lg bg-[#0B1F33] px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:-translate-y-0.5 active:scale-95 dark:bg-[#16B8B1] dark:text-[#0B1F33]">
            <Send size={15} /> {isOffer ? "Voir l'offre et postuler" : "Proposer ma candidature"}
          </button>
        )}
      </div>
    </article>
  );
}