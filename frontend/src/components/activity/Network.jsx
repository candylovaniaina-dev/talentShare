import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, RotateCcw, Building2, MapPin, CheckCircle, ArrowUpRight, Globe, Loader2, Briefcase, UserRound, ShieldCheck, TrendingUp, Home } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { card, asArray, fileUrl, OFFER_TYPES } from "./shared";

const sectorOf = (c) => c.sector || c.industry || "";

function Toggle({ active, onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition ${
        active ? "bg-teal-50 text-teal-700 ring-1 ring-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:ring-teal-500/30" : "bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-white/5 dark:text-slate-300"
      }`}
    >
      <Icon size={14} /> {children}
    </button>
  );
}

function CompanyCard({ company, index, onSelect }) {
  const [failed, setFailed] = useState(false);
  const logo = !failed ? company.logo_url || fileUrl(company.logo_path) : null;
  const location = [company.city, company.country].filter(Boolean).join(", ");
  return (
    <button
      type="button"
      onClick={() => onSelect?.(company)}
      style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
      className={`${card} ts-fade group flex h-full min-h-[220px] w-full flex-col p-5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-16px_rgba(16,42,67,0.2)]`}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 p-1.5 dark:bg-white/5">
          {logo ? <img src={logo} alt="" onError={() => setFailed(true)} className="h-full w-full object-contain" />
            : <span className="flex h-full w-full items-center justify-center rounded-xl bg-[#0B1F33] text-xl font-semibold text-white">{(company.name || "?").charAt(0).toUpperCase()}</span>}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <h4 className="line-clamp-2 text-[15px] font-semibold leading-tight text-slate-800 group-hover:text-teal-600 dark:text-white">{company.name || "Entreprise"}</h4>
          {sectorOf(company) && <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{sectorOf(company)}</p>}
        </div>
        {company.is_verified && (
          <span className="mt-1 flex shrink-0 items-center gap-1 rounded-full bg-teal-50 px-2 py-1 text-[10px] font-medium text-teal-600 dark:bg-teal-500/10 dark:text-teal-300"><CheckCircle size={10} /> Vérifiée</span>
        )}
      </div>
      <p className="mt-4 line-clamp-3 min-h-[58px] text-[13px] leading-5 text-slate-500 dark:text-slate-400">
        {company.description || "Découvrez cette organisation et les opportunités qu'elle propose sur TalentShare."}
      </p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <span className="flex min-w-0 items-center gap-1.5 truncate text-[11px] text-slate-500 dark:text-slate-400"><MapPin size={12} className="shrink-0" />{location || "Localisation non renseignée"}</span>
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-teal-600 dark:text-teal-400">Voir le profil <ArrowUpRight size={14} /></span>
      </div>
    </button>
  );
}

export function CompaniesTab({ companies = [], onSelect }) {
  const [search, setSearch] = useState("");
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [onlyHiring, setOnlyHiring] = useState(false);
  const [onlyRemote, setOnlyRemote] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(tag)) { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return companies.filter((c) => {
      if (onlyVerified && !c.is_verified) return false;
      if (onlyHiring && !(c.job_offers_count > 0 || c.is_hiring)) return false;
      if (onlyRemote && !c.remote_friendly) return false;
      if (!q) return true;
      return [c.name, sectorOf(c), c.city, c.country, c.description].some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [companies, search, onlyVerified, onlyHiring, onlyRemote]);

  const hasFilters = Boolean(search.trim()) || onlyVerified || onlyHiring || onlyRemote;
  const reset = () => { setSearch(""); setOnlyVerified(false); setOnlyHiring(false); setOnlyRemote(false); };
  const verified = companies.filter((c) => c.is_verified).length;

  return (
    <div className="space-y-5">
      <section className={`${card} p-6`}>
        <p className="text-[11px] font-medium text-teal-600 dark:text-teal-400">Écosystème TalentShare</p>
        <div className="mt-1 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-800 dark:text-white">Le réseau des entreprises</h2>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">Explorez les organisations, leurs domaines d'activité et leurs opportunités.</p>
          </div>
          <div className="flex gap-3">
            {[[companies.length, "Entreprises"], [verified, "Vérifiées"]].map(([n, l]) => (
              <div key={l} className="rounded-2xl bg-slate-50/80 px-5 py-2.5 text-center dark:bg-white/5">
                <p className="text-xl font-semibold tabular-nums text-slate-800 dark:text-white">{n}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{l}</p>
              </div>
            ))}
          </div>
        </div>

        <label className="relative mt-5 block">
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input ref={searchRef} type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom, secteur ou localisation…"
            className="w-full rounded-2xl border-0 bg-slate-50/80 py-3.5 pl-11 pr-11 text-sm text-slate-700 outline-none ring-1 ring-slate-900/5 transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-teal-300 dark:bg-white/5 dark:text-white dark:ring-white/10" />
          {search && <button type="button" onClick={() => setSearch("")} aria-label="Effacer" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"><X size={14} /></button>}
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Toggle active={onlyVerified} onClick={() => setOnlyVerified((v) => !v)} icon={ShieldCheck}>Vérifiées</Toggle>
          <Toggle active={onlyHiring} onClick={() => setOnlyHiring((v) => !v)} icon={TrendingUp}>Recrute</Toggle>
          <Toggle active={onlyRemote} onClick={() => setOnlyRemote((v) => !v)} icon={Home}>Télétravail</Toggle>
          {hasFilters && (
            <button type="button" onClick={reset} className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300"><RotateCcw size={13} /> Réinitialiser</button>
          )}
        </div>
      </section>

      <p className="px-1 text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
        {filtered.length} résultat{filtered.length > 1 ? "s" : ""}{hasFilters ? ` sur ${companies.length}` : ""}
      </p>

      {filtered.length === 0 ? (
        <div className={`${card} px-6 py-14 text-center`}>
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 dark:bg-white/5"><Building2 size={26} /></span>
          <p className="mt-4 text-base font-semibold text-slate-800 dark:text-white">Aucune entreprise trouvée</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">Modifiez votre recherche ou retirez des filtres.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c, i) => <CompanyCard key={c.id} company={c} index={i} onSelect={onSelect} />)}
        </div>
      )}
    </div>
  );
}

export function CompanyModal({ company, onClose, showJobs = true, onSelectOffer }) {
  const { user } = useAuth();
  const [details, setDetails] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("about");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.get(`/companies/${company.id}`).then((r) => r.data?.data || r.data).catch(() => company),
      showJobs ? api.get(`/job-offers?company_id=${company.id}`).then((r) => asArray(r.data)).catch(() => []) : Promise.resolve([]),
    ]).then(([c, j]) => { if (!cancelled) { setDetails(c); setJobs(j); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [company.id, showJobs]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const data = details || company;
  const isMember = user?.companies?.some((c) => Number(c.id) === Number(data.id));
  const location = [data.city, data.country].filter(Boolean).join(", ");
  const tabs = [["about", "À propos"], ...(showJobs ? [["jobs", `Offres (${jobs.length})`]] : [])];

  return (
    <div className="ts-root fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <section role="dialog" aria-modal="true" className="ts-pop flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#112A3A]" onClick={(e) => e.stopPropagation()}>
        <header className="relative shrink-0 bg-gradient-to-br from-[#0B1F33] to-[#16324F] px-6 py-6 text-white">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/10 p-2">
              <img
                src={fileUrl(data.logo_path)} alt="" className="h-full w-full rounded-xl object-contain"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || "?")}&background=16B8B1&color=fff&bold=true`; }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="break-words text-xl font-semibold">{data.name || "Entreprise"}</h2>
                {isMember && <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px]"><UserRound size={12} /> Membre de l'équipe</span>}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/75">
                {location && <span className="flex items-center gap-1.5"><MapPin size={14} className="text-[#16B8B1]" />{location}</span>}
                {data.website && (
                  <a href={data.website.startsWith("http") ? data.website : `https://${data.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[#16B8B1] hover:text-white">
                    <Globe size={13} /> Site web <ArrowUpRight size={12} />
                  </a>
                )}
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Fermer" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"><X size={17} /></button>
          </div>
        </header>

        <nav className="flex shrink-0 gap-1 border-b border-slate-100 px-5 dark:border-white/10">
          {tabs.map(([id, label]) => (
            <button key={id} type="button" onClick={() => setTab(id)} className={`border-b-2 px-3 py-3.5 text-sm font-medium transition ${tab === id ? "border-teal-400 text-teal-600 dark:text-teal-300" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}>
              {label}
            </button>
          ))}
        </nav>

        <main className="min-h-0 flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex min-h-48 items-center justify-center"><Loader2 className="animate-spin text-teal-500" size={28} /></div>
          ) : tab === "about" ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50/80 p-5 dark:bg-white/5">
                <h4 className="mb-2 text-sm font-semibold text-slate-800 dark:text-white">À propos de {data.name || "l'entreprise"}</h4>
                <p className="whitespace-pre-line break-words text-sm leading-7 text-slate-600 dark:text-slate-300">{data.description || "Aucune description n'a été renseignée pour le moment."}</p>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50/80 p-4 dark:bg-white/5">
                <MapPin size={17} className="mt-0.5 shrink-0 text-teal-500" />
                <div><p className="text-xs text-slate-500">Localisation</p><p className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-200">{location || "Non renseignée"}</p></div>
              </div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl bg-slate-50/80 px-5 py-12 text-center dark:bg-white/5">
              <Briefcase size={22} className="text-slate-400" />
              <p className="mt-3 text-sm text-slate-500">Cette entreprise n'a pas d'offre disponible actuellement.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {jobs.map((job) => (
                <button key={job.id} type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSelectOffer?.(job.id); }}
                  className="group flex min-h-36 flex-col justify-between rounded-2xl bg-slate-50/80 p-4 text-left transition hover:bg-white hover:shadow-md dark:bg-white/5 dark:hover:bg-white/10">
                  <div>
                    <span className="inline-flex rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-medium text-teal-600 dark:bg-teal-500/10 dark:text-teal-300">{OFFER_TYPES[job.offer_type] || "Emploi"}</span>
                    <h4 className="mt-3 break-words text-sm font-medium leading-6 text-slate-800 group-hover:text-teal-600 dark:text-white">{job.title || "Offre sans titre"}</h4>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin size={12} className="text-teal-500" /><span className="truncate">{job.city || "Localisation non précisée"}</span>
                    <span className="ml-auto font-medium text-teal-600 dark:text-teal-300">Voir l'offre</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
      </section>
    </div>
  );
}