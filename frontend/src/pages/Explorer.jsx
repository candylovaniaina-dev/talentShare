import React, { useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { X, ChevronDown, SlidersHorizontal, LayoutGrid, List, RotateCcw, Plus, MapPin } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import JobOffers from "./JobOffers";
import BrowseResourceRequests from "./BrowseResourceRequests";
import { 
  ExplorerStyles, 
  FONT, 
  SelectBox, 
  FilterDrawer, 
  DrawerSection, 
  OptionPill, 
  SearchField 
} from "../components/explorer/ExplorerKit";
import { useAuth } from "../context/AuthContext";

const TABS = [
  { id: "offers", label: "Recrutement" },
  { id: "requests", label: "Demandes de talents" },
];

export default function Explorer() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") === "requests" ? "requests" : "offers";

  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);

  const inputRef = useRef(null);
  const [view, setView] = useState("grid");
  const [sortBy, setSortBy] = useState("recent");
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // ✅ ÉTATS DES FILTRES GLOBAUX (pour le Drawer)
  const [citySearch, setCitySearch] = useState("");
  const [onlyRemote, setOnlyRemote] = useState(false);
  const [onlyUrgent, setOnlyUrgent] = useState(false);
  const [onlyPaid, setOnlyPaid] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  
  // Nombre de résultats pour le bouton "Voir résultat"
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    const handleShortcut = (event) => {
      const tag = document.activeElement?.tagName || "";
      if (event.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(tag) && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const handleTabChange = (e) => {
    setSearchParams({ tab: e.target.value });
  };

  const triggerRefresh = () => {
    setRefreshing(true);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setRefreshing(false), 800);
  };

  const resetFilters = () => {
    setCitySearch("");
    setOnlyRemote(false);
    setOnlyUrgent(false);
    setOnlyPaid(false);
    setShowSavedOnly(false);
  };

  const isCompany = user?.role === "company";

  // Compte le nombre de filtres actifs pour le badge
  const activeFiltersCount = [
    citySearch.trim() ? 1 : 0,
    onlyRemote ? 1 : 0,
    onlyUrgent ? 1 : 0,
    onlyPaid ? 1 : 0,
    showSavedOnly ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <AppShell>
      <ExplorerStyles />
      <main className={`${FONT} min-h-screen bg-[#F5F8FC] text-[#10243A] dark:bg-[#0B1F33] dark:text-slate-200`}>
        <div className="mx-auto w-full max-w-[1680px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
          
          <div className="overflow-hidden rounded-[24px] border border-[#E2EAF2] bg-white shadow-[0_4px_24px_rgba(15,35,60,0.03)] dark:border-white/10 dark:bg-[#112A3A]">

            {/* ✅ BARRE TOUT SUR UNE LIGNE (Recherche + Select + Actions) */}
            <div className="flex min-w-0 flex-col gap-3 border-b border-[#E9EEF4] p-3 sm:p-4 lg:flex-row lg:items-center lg:gap-3 dark:border-white/10">
              
              <div className="relative w-full shrink-0 lg:w-[280px]">
                <input
                  ref={inputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Rechercher..."
                  className="h-[42px] w-full rounded-[12px] border border-[#D8E2EE] bg-[#F8FAFC] px-4 pr-10 text-[14px] font-medium text-[#18314D] outline-none transition hover:border-[#B9C9DA] focus:border-[#0F9691] focus:bg-white focus:ring-4 focus:ring-[#0F9691]/[0.08] dark:border-white/10 dark:bg-[#0B1F33] dark:text-white dark:placeholder:text-slate-500"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10">
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="relative w-full shrink-0 lg:w-[200px]">
                <select
                  value={activeTab}
                  onChange={handleTabChange}
                  className="h-[42px] w-full appearance-none rounded-[12px] border border-[#D8E2EE] bg-white pl-4 pr-10 text-[14px] font-medium text-[#102B43] outline-none transition hover:border-[#B9C9DA] focus:border-[#0F9691] focus:ring-4 focus:ring-[#0F9691]/[0.08] dark:border-white/10 dark:bg-[#0B1F33] dark:text-white"
                >
                  {TABS.map((tab) => (
                    <option key={tab.id} value={tab.id}>{tab.label}</option>
                  ))}
                </select>
                <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="flex flex-1 items-center justify-end gap-2 overflow-x-auto">
                {/* BOUTON FILTRES */}
                <button onClick={() => setDrawerOpen(true)} className="flex h-[42px] shrink-0 items-center gap-2 rounded-[12px] border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:bg-[#1A2650] dark:text-slate-300">
                  <SlidersHorizontal size={14} /> 
                  Filtres {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </button>

                {/* TRI */}
                <div className="shrink-0">
                  <SelectBox value={sortBy} onChange={setSortBy} label="Trier par">
                    <option value="recent">Plus récentes</option>
                    <option value="title">Ordre alphabétique</option>
                  </SelectBox>
                </div>

                {/* VUE */}
                <div className="flex h-[42px] shrink-0 items-center rounded-[12px] border border-slate-200 bg-white p-0.5 dark:border-white/10 dark:bg-[#1A2650]">
                  <button onClick={() => setView("grid")} className={`flex h-full w-8 items-center justify-center rounded-lg transition ${view === "grid" ? "bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white" : "text-slate-400"}`}><LayoutGrid size={15} /></button>
                  <button onClick={() => setView("list")} className={`flex h-full w-8 items-center justify-center rounded-lg transition ${view === "list" ? "bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white" : "text-slate-400"}`}><List size={15} /></button>
                </div>

                {/* ACTUALISER */}
                <button onClick={triggerRefresh} className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[12px] border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 dark:border-white/10 dark:bg-[#1A2650] dark:text-slate-300">
                  <RotateCcw size={16} className={refreshing ? "animate-spin" : ""} />
                </button>

                {/* PUBLIER (Uniquement pour les entreprises sur l'onglet Offres) */}
                {isCompany && activeTab === "offers" && (
                  <button className="inline-flex h-[42px] shrink-0 items-center justify-center rounded-[12px] bg-[#0B1F33] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#0F9691] dark:bg-[#0F9691] dark:hover:bg-[#16B8B1]">
                    <Plus size={14} className="mr-1.5" /> Publier
                  </button>
                )}
              </div>
            </div>

            <div className="p-3 sm:p-5">
              <section role="tabpanel" hidden={activeTab !== "offers"}>
                <JobOffers 
                  embedded 
                  sharedSearch={deferredQuery} 
                  externalView={view} 
                  externalSort={sortBy} 
                  refreshKey={refreshKey}
                  // ✅ TRANSMISSION DES FILTRES
                  externalCitySearch={citySearch}
                  externalOnlyRemote={onlyRemote}
                  externalOnlyPaid={onlyPaid}
                  externalShowSavedOnly={showSavedOnly}
                  onCountChange={setTotalResults}
                />
              </section>
              
              <section role="tabpanel" hidden={activeTab !== "requests"}>
                <BrowseResourceRequests 
                  embedded 
                  sharedSearch={deferredQuery} 
                  externalView={view} 
                  externalSort={sortBy} 
                  refreshKey={refreshKey}
                  // ✅ TRANSMISSION DES FILTRES
                  externalCitySearch={citySearch}
                  externalOnlyRemote={onlyRemote}
                  externalOnlyUrgent={onlyUrgent}
                  externalShowSavedOnly={showSavedOnly}
                  onCountChange={setTotalResults}
                />
              </section>
            </div>
          </div>
        </div>

        {/* ✅ TIROIR DE FILTRES */}
        <FilterDrawer 
          open={drawerOpen} 
          onClose={() => setDrawerOpen(false)} 
          activeCount={activeFiltersCount} 
          onReset={resetFilters} 
          resultCount={totalResults}
        >
          <DrawerSection title="Critères">
            <div className="flex flex-wrap gap-2">
              <OptionPill active={onlyRemote} onClick={() => setOnlyRemote(v => !v)}>Télétravail</OptionPill>
              
              {activeTab === "offers" ? (
                <OptionPill active={onlyPaid} onClick={() => setOnlyPaid(v => !v)}>Rémunération indiquée</OptionPill>
              ) : (
                <OptionPill active={onlyUrgent} onClick={() => setOnlyUrgent(v => !v)}>Urgent</OptionPill>
              )}

              <OptionPill active={showSavedOnly} onClick={() => setShowSavedOnly(v => !v)}>
                {activeTab === "offers" ? "Mes favoris" : "Mes sauvegardes"}
              </OptionPill>
            </div>
          </DrawerSection>

          <DrawerSection title="Localisation">
            <SearchField value={citySearch} onChange={setCitySearch} placeholder="Ville ou pays" icon={MapPin} />
          </DrawerSection>
        </FilterDrawer>
      </main>
    </AppShell>
  );
}