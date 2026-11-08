import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Activity, BriefcaseBusiness, UsersRound, Package} from "lucide-react";

import AppShell from "../components/layout/AppShell";
import OffersSection from "../components/publications/OffersSection";
import RequestsSection from "../components/publications/RequestsSection";

const TABS = {
  jobs: {
    label: "Recrutement",
    icon: BriefcaseBusiness,
    title: "Vos offres de recrutement",
    caption: "Stage, alternance ou recrutement permanent : vous recrutez, les talents postulent.",
    kpis: [
      { key: "total", label: "Total des offres" },
      { key: "published", label: "Publiées" },
      { key: "drafts", label: "Brouillons" },
      { key: "applications", label: "Candidatures" },
    ],
  },
  requests: {
    label: "Demandes",
    icon: UsersRound,
    title: "Vos demandes de talents",
    caption: "Un besoin de compétences pour une mission : talents et entreprises vous envoient des propositions.",
    kpis: [
      { key: "total", label: "Total des demandes" },
      { key: "published", label: "Publiées" },
      { key: "proposals", label: "Propositions" },
      { key: "views", label: "Vues" },
    ],
  },
  resources: {
    label: "Ressources partagées",
    icon: Package,
    title: "Vos ressources partagées",
    caption: "Un de vos salariés est disponible : proposez-le aux autres entreprises du réseau.",
    kpis: [
      { key: "total", label: "Total" },
      { key: "published", label: "Publiées" },
      { key: "drafts", label: "Brouillons" },
      { key: "missions", label: "Missions" },
    ],
  },
};

export default function MyPublications() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const mainTab = rawTab === "offers" ? "jobs" : TABS[rawTab] ? rawTab : "jobs";

  const [stats, setStats] = useState({ jobs: {}, requests: {}, resources: {} });

  const setJobsStats = useCallback((s) => setStats((p) => ({ ...p, jobs: s })), []);
  const setRequestsStats = useCallback((s) => setStats((p) => ({ ...p, requests: s })), []);
  const setResourcesStats = useCallback((s) => setStats((p) => ({ ...p, resources: s })), []);

  const tab = TABS[mainTab];

  return (
    <AppShell>
      <main className="mx-auto max-w-[1500px] space-y-5 px-1 py-1 pb-10 font-['Plus_Jakarta_Sans',sans-serif] sm:px-2">
        {/* En-tête + onglets */}
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-[#0B1F33] dark:text-white">Espace recrutement</h1>
            <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">{tab.caption}</p>
          </div>

          <div role="tablist" aria-label="Type de publication" className="flex w-full items-center overflow-x-auto border-b border-slate-200 dark:border-white/10 lg:w-auto">
            {Object.entries(TABS).map(([id, item]) => {
              const active = mainTab === id;
              const total = stats[id]?.total;
              const Icon = item.icon;
              return (
                <button
                  key={id}
                  id={`tab-${id}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`panel-${id}`}
                  onClick={() => setSearchParams({ tab: id }, { replace: true })}
                  className={`group relative flex flex-1 items-center justify-center gap-2.5 whitespace-nowrap px-5 py-3.5 text-sm font-bold transition lg:flex-none ${
                    active ? "text-[#0B1F33] dark:text-white" : "text-slate-400 hover:text-[#0B1F33] dark:text-slate-500 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon size={17} strokeWidth={active ? 2.4 : 1.9} className={active ? "text-[#16B8B1]" : "text-slate-400 group-hover:text-[#16B8B1]"} />
                  <span>{item.label}</span>
                  {typeof total === "number" && (
                    <span className={`flex h-[22px] min-w-[22px] items-center justify-center rounded-md px-1.5 text-[10px] font-extrabold tabular-nums ${
                      active ? "bg-[#0B1F33] text-white dark:bg-[#16B8B1] dark:text-[#0B1F33]" : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"
                    }`}>
                      {total}
                    </span>
                  )}
                  <span className={`absolute bottom-[-1px] left-0 h-[3px] w-full rounded-t-full bg-[#16B8B1] transition-all duration-300 ${active ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"}`} />
                </button>
              );
            })}
          </div>
        </header>

        {/* Statistiques */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-[#131E47]">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3 dark:border-white/5">
            <Activity size={15} className="text-[#16B8B1]" />
            <h2 className="text-xs font-bold text-[#0B1F33] dark:text-white">Vue d'ensemble · {tab.label}</h2>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-4 sm:divide-y-0 dark:divide-white/5">
            {tab.kpis.map((item) => (
              <StatItem key={`${mainTab}-${item.key}`} label={item.label} value={stats[mainTab]?.[item.key]} />
            ))}
          </div>
        </section>

        {/* Gestion */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight text-[#0B1F33] dark:text-white">{tab.title}</h2>

          <div id="panel-jobs" role="tabpanel" aria-labelledby="tab-jobs" hidden={mainTab !== "jobs"} className={mainTab === "jobs" ? "block" : "hidden"}>
            <OffersSection mode="jobs" onStats={setJobsStats} />
          </div>

          <div id="panel-requests" role="tabpanel" aria-labelledby="tab-requests" hidden={mainTab !== "requests"} className={mainTab === "requests" ? "block" : "hidden"}>
            <RequestsSection onStats={setRequestsStats} />
          </div>

          <div id="panel-resources" role="tabpanel" aria-labelledby="tab-resources" hidden={mainTab !== "resources"} className={mainTab === "resources" ? "block" : "hidden"}>
            <OffersSection mode="resources" onStats={setResourcesStats} />
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function useCountUp(target, duration = 650) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (typeof target !== "number") { setValue(0); return; }
    let frame;
    const start = performance.now();
    const animate = (time) => {
      const progress = Math.min(1, (time - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

function StatItem({ label, value }) {
  const count = useCountUp(value);
  return (
    <div className="min-w-0 px-5 py-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-white/5">
      <span className="text-[26px] font-extrabold leading-none tracking-tight tabular-nums text-[#0B1F33] dark:text-white">
        {typeof value === "number" ? count : "–"}
      </span>
      <p className="mt-1.5 truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}