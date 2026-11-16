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
      <main className="mx-auto max-w-[1500px] space-y-4 px-2 py-4 pb-10 font-['Plus_Jakarta_Sans',sans-serif] sm:px-4">
        
        {/* Statistiques (adoucies) */}
        <section className="overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm dark:border-white/10 dark:bg-[#131E47]">
          <div className="flex items-center gap-2 border-b border-slate-100/80 px-5 py-3.5 dark:border-white/5">
            <Activity size={16} className="text-[#16B8B1]" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Vue d'ensemble · {tab.label}</h2>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-100/80 sm:grid-cols-4 sm:divide-y-0 dark:divide-white/5">
            {tab.kpis.map((item) => (
              <StatItem key={`${mainTab}-${item.key}`} label={item.label} value={stats[mainTab]?.[item.key]} />
            ))}
          </div>
        </section>

        {/* Gestion des offres */}
        <section className="space-y-3 relative">
          
          {/* Ligne avec les Onglets + Loader */}
          <div className="flex items-center justify-between gap-4">
            
            {/* MENU SANS ICÔNES */}
            <div className="flex w-full items-center overflow-x-auto rounded-lg bg-slate-100/70 p-1 dark:bg-white/5 lg:w-auto">
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
                    className={`group relative flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-[13px] font-medium transition-all duration-200 lg:flex-none ${
                      active 
                        ? "bg-white text-[#0B1F33] shadow-sm ring-1 ring-slate-200/50 dark:bg-[#131E47] dark:text-white dark:ring-white/10" 
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    } ${isTransitioning ? "opacity-70" : ""}`}
                  >
                    <span>{item.label}</span>
                    
                    {typeof total === "number" && (
                      <span className={`flex h-[18px] min-w-[18px] items-center justify-center rounded px-1 text-[10px] font-bold tabular-nums ${
                        active 
                          ? "bg-[#16B8B1]/15 text-[#0F9691] dark:bg-[#16B8B1]/20 dark:text-[#16B8B1]" 
                          : "bg-slate-200/60 text-slate-500 dark:bg-white/10 dark:text-slate-400"
                      }`}>
                        {total}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Loader à droite */}
            <div className={`transition-opacity duration-300 ${isTransitioning ? "opacity-100" : "opacity-0"}`}>
              <span className="flex items-center gap-1.5 rounded-md bg-[#16B8B1]/10 px-2.5 py-1.5 text-[11px] font-medium text-[#0F9691]">
                <Loader2 size={12} className="animate-spin" />
                Chargement...
              </span>
            </div>
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
    <div className="min-w-0 px-6 py-5 transition-colors hover:bg-slate-50/50 dark:hover:bg-white/5">
      <span className="text-3xl font-bold leading-none tracking-tight tabular-nums text-[#0B1F33] dark:text-white">
        {typeof value === "number" ? count : "–"}
      </span>
      <p className="mt-2 truncate text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}