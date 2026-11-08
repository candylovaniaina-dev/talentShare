import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, Calendar, Clock, MapPin, ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import api from "../services/api";
import {
  PageLayout, MISSION_TYPES, LOCATION_LABELS, Avatar, Badge, MetaChip, SkillChips, EmptyState,
  Spinner, fmtDate, durationLabel, workloadLabel, inputCls, cardCls, btnGhost,
} from "../components/resource-sharing/shared";

const DEFAULTS = { q: "", skill: "", mission_type: "", location_type: "", city: "", rate_max: "", from: "", to: "", sort: "recent" };

function FilterGroup({ title, children }) {
  return (
    <div className="border-b border-slate-100 py-4 last:border-0 dark:border-slate-800">
      <p className="mb-2.5 text-xs font-bold text-slate-800 dark:text-slate-200">{title}</p>
      {children}
    </div>
  );
}

function RadioList({ options, value, onChange }) {
  return (
    <div className="space-y-1">
      {[["", "Tous"], ...Object.entries(options)].map(([k, label]) => (
        <button type="button" key={k || "all"} onClick={() => onChange(k)}
          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${value === k
            ? "bg-emerald-50 font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
            : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"}`}>
          {label} {value === k && <Check size={13} />}
        </button>
      ))}
    </div>
  );
}

export default function BrowseResourceOffers() {
  const [f, setF] = useState(DEFAULTS);
  const [page, setPage] = useState(1);
  const [res, setRes] = useState({ data: [], total: 0, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const set = (k, v) => { setF((p) => ({ ...p, [k]: v })); setPage(1); };
  const activeCount = Object.entries(f).filter(([k, v]) => v && k !== "sort").length;

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      const params = Object.fromEntries(Object.entries({ ...f, page }).filter(([, v]) => v !== "" && v != null));
      api.get("/resource-sharing/browse", { params })
        .then((r) => setRes(r.data))
        .catch(() => setRes({ data: [], total: 0, last_page: 1 }))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(t);
  }, [f, page]);

  const filters = (
    <>
      <FilterGroup title="Type de mission"><RadioList options={MISSION_TYPES} value={f.mission_type} onChange={(v) => set("mission_type", v)} /></FilterGroup>
      <FilterGroup title="Mode de travail"><RadioList options={LOCATION_LABELS} value={f.location_type} onChange={(v) => set("location_type", v)} /></FilterGroup>
      <FilterGroup title="Ville"><input value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="Ex. Antananarivo" className={inputCls} /></FilterGroup>
      <FilterGroup title="Compétence"><input value={f.skill} onChange={(e) => set("skill", e.target.value)} placeholder="Ex. Laravel, comptabilité" className={inputCls} /></FilterGroup>
      <FilterGroup title="Tarif max. (€/jour)"><input type="number" min={0} value={f.rate_max} onChange={(e) => set("rate_max", e.target.value)} className={inputCls} /></FilterGroup>
      <FilterGroup title="Disponibilité">
        <div className="space-y-2">
          <input type="date" value={f.from} onChange={(e) => set("from", e.target.value)} className={inputCls} />
          <input type="date" value={f.to} min={f.from} onChange={(e) => set("to", e.target.value)} className={inputCls} />
        </div>
        <p className="mt-1.5 text-[11px] text-slate-400">Offres qui recoupent cette période.</p>
      </FilterGroup>
      {activeCount > 0 && (
        <button onClick={() => { setF(DEFAULTS); setPage(1); }} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:underline">
          <X size={13} /> Réinitialiser les filtres
        </button>
      )}
    </>
  );

  return (
    <PageLayout>
      <main className="min-h-screen bg-[#F4F7FA] px-3 pb-12 pt-5 dark:bg-transparent sm:px-5 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={f.q} onChange={(e) => set("q", e.target.value)} placeholder="Rechercher un profil, une compétence, un titre..."
                className={`${inputCls} bg-white py-3 pl-10`} />
            </div>
            <select value={f.sort} onChange={(e) => set("sort", e.target.value)} className={`${inputCls} bg-white sm:w-52`}>
              <option value="recent">Plus récentes</option>
              <option value="start">Disponibles bientôt</option>
              <option value="rate_asc">Tarif croissant</option>
              <option value="rate_desc">Tarif décroissant</option>
            </select>
            <button onClick={() => setShowFilters((s) => !s)} className={`${btnGhost} lg:hidden`}>
              <SlidersHorizontal size={14} /> Filtres {activeCount > 0 && `(${activeCount})`}
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className={`${showFilters ? "block" : "hidden"} lg:block`}>
              <div className={`${cardCls} px-4 lg:sticky lg:top-5`}>{filters}</div>
            </aside>

            <section>
              <p className="mb-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {loading ? "Recherche..." : `${res.total} ressource${res.total > 1 ? "s" : ""} disponible${res.total > 1 ? "s" : ""}`}
              </p>

              {loading ? <Spinner label="Recherche en cours..." /> : res.data.length === 0 ? (
                <EmptyState title="Aucune ressource ne correspond" text="Élargissez vos critères ou réinitialisez les filtres." />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {res.data.map((o) => (
                    <article key={o.id} className={`${cardCls} flex flex-col overflow-hidden transition hover:shadow-md`}>
                      <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar name={o.profile?.user?.name} path={o.profile?.avatar_path} size={44} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{o.profile?.user?.name || "Salarié"}</p>
                              <p className="truncate text-xs text-emerald-600 dark:text-emerald-400">{o.profile?.headline || "—"}</p>
                            </div>
                          </div>
                          <Badge cls="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{MISSION_TYPES[o.mission_type] || o.mission_type}</Badge>
                        </div>

                        <h3 className="mt-4 line-clamp-2 text-sm font-bold text-slate-900 dark:text-white">{o.title}</h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Proposé par {o.company?.name}</p>

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                          <MetaChip icon={Calendar}>{fmtDate(o.start_at)} → {fmtDate(o.end_at)} · {durationLabel(o.start_at, o.end_at)}</MetaChip>
                          <MetaChip icon={Clock}>{workloadLabel(o.workload_value, o.workload_unit)}</MetaChip>
                          <MetaChip icon={MapPin}>{LOCATION_LABELS[o.location_type]}{o.location_city ? ` · ${o.location_city}` : ""}</MetaChip>
                        </div>

                        <div className="mt-3 mb-4"><SkillChips skills={o.skills} max={4} /></div>

                        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                          <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                            {o.daily_rate ? <>{o.daily_rate} € <span className="text-[11px] font-medium text-slate-400">/ jour</span></> : <span className="text-xs font-semibold text-slate-400">Tarif à discuter</span>}
                          </p>
                          <div className="flex items-center gap-2">
                            {o.already_proposed && <Badge cls="bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">Proposition envoyée</Badge>}
                            <Link to={`/resource-offers/${o.id}`} className="rounded-xl bg-[#0B253B] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#143B55] dark:bg-emerald-500 dark:text-[#06251F]">
                              Voir l'offre
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {res.last_page > 1 && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={btnGhost}><ChevronLeft size={14} /> Précédent</button>
                  <span className="text-xs font-semibold text-slate-500">Page {page} / {res.last_page}</span>
                  <button disabled={page >= res.last_page} onClick={() => setPage((p) => p + 1)} className={btnGhost}>Suivant <ChevronRight size={14} /></button>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </PageLayout>
  );
}