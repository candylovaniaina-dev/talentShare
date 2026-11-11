import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Activity, BriefcaseBusiness, UsersRound, Package, Loader2 } from "lucide-react";

import AppShell from "../components/layout/AppShell";
import OffersSection from "../components/publications/OffersSection";
import RequestsSection from "../components/publications/RequestsSection";

const TABS = {
  jobs: {
    label: "Recrutement",
    icon: BriefcaseBusiness,
  
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
  const [isTransitioning, setIsTransitioning] = useState(false);

  const setJobsStats = useCallback((s) => setStats((p) => ({ ...p, jobs: s })), []);
  const setRequestsStats = useCallback((s) => setStats((p) => ({ ...p, requests: s })), []);
  const setResourcesStats = useCallback((s) => setStats((p) => ({ ...p, resources: s })), []);

  const tab = TABS[mainTab];

  const handleTabChange = (id) => {
    if (id === mainTab) return;
    
    setIsTransitioning(true);
    setSearchParams({ tab: id }, { replace: true });
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 400);
  };

  return (
    <AppShell>
      <main className="mx-auto max-w-[1500px] space-y-5 px-1 py-1 pb-10 font-['Plus_Jakarta_Sans',sans-serif] sm:px-2">
        
        {/* En-tête (Titre et description uniquement) */}
       
        {/* Statistiques (adoucies) */}
        <section className="overflow-hidden rounded-xl border border-slate-200/60 bg-white dark:border-white/10 dark:bg-[#131E47]">
          <div className="flex items-center gap-2 border-b border-slate-100/80 px-5 py-3 dark:border-white/5">
            <Activity size={14} className="text-teal-500" />
            <h2 className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Vue d'ensemble · {tab.label}</h2>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-100/80 sm:grid-cols-4 sm:divide-y-0 dark:divide-white/5">
            {tab.kpis.map((item) => (
              <StatItem key={`${mainTab}-${item.key}`} label={item.label} value={stats[mainTab]?.[item.key]} />
            ))}
          </div>
        </section>

        {/* Gestion des offres */}
        <section className="space-y-4 relative">
          
          {/* Titre + Loader */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight text-slate-800 dark:text-slate-100">{tab.title}</h2>
            
            <div className={`transition-opacity duration-300 ${isTransitioning ? "opacity-100" : "opacity-0"}`}>
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded-md">
                <Loader2 size={12} className="animate-spin" />
                Chargement...
              </span>
            </div>
          </div>

          {/* ✅ MENU SANS ICÔNES, ALIGNÉ À GAUCHE (Style Collaborations) */}
          <div className="flex w-full items-center overflow-x-auto rounded-lg bg-slate-50/80 p-1 dark:bg-white/5 lg:w-auto">
            {Object.entries(TABS).map(([id, item]) => {
              const active = mainTab === id;
              const total = stats[id]?.total;
              
              return (
                <button
                  key={id}
                  id={`tab-${id}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`panel-${id}`}
                  onClick={() => handleTabChange(id)}
                  disabled={isTransitioning}
                  className={`group relative flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-[12px] font-medium transition-all duration-200 lg:flex-none ${
                    active 
                      ? "bg-white text-slate-800 shadow-sm dark:bg-[#131E47] dark:text-white" 
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  } ${isTransitioning ? "opacity-70" : ""}`}
                >
                  <span>{item.label}</span>
                  
                  {typeof total === "number" && (
                    <span className={`flex h-[18px] min-w-[18px] items-center justify-center rounded px-1 text-[10px] font-semibold tabular-nums ${
                      active 
                        ? "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300" 
                        : "bg-slate-200/50 text-slate-500 dark:bg-white/5 dark:text-slate-500"
                    }`}>
                      {total}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Conteneur avec fondu */}
          <div 
            className={`transition-all duration-300 ease-in-out ${
              isTransitioning ? "opacity-40 translate-y-1" : "opacity-100 translate-y-0"
            }`}
          >
            <div id="panel-jobs" role="tabpanel" aria-labelledby="tab-jobs" hidden={mainTab !== "jobs"} className={mainTab === "jobs" ? "block" : "hidden"}>
              <OffersSection mode="jobs" onStats={setJobsStats} />
            </div>

            <div id="panel-requests" role="tabpanel" aria-labelledby="tab-requests" hidden={mainTab !== "requests"} className={mainTab === "requests" ? "block" : "hidden"}>
              <RequestsSection onStats={setRequestsStats} />
            </div>

            <div id="panel-resources" role="tabpanel" aria-labelledby="tab-resources" hidden={mainTab !== "resources"} className={mainTab === "resources" ? "block" : "hidden"}>
              <OffersSection mode="resources" onStats={setResourcesStats} />
            </div>
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
    <div className="min-w-0 px-5 py-3.5 transition-colors hover:bg-slate-50/50 dark:hover:bg-white/5">
      <span className="text-[22px] font-semibold leading-none tracking-tight tabular-nums text-slate-700 dark:text-slate-200">
        {typeof value === "number" ? count : "–"}
      </span>
      <p className="mt-1.5 truncate text-[11px] font-medium text-slate-400 dark:text-slate-500">{label}</p>
    </div>
  );
}