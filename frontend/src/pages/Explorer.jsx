import React, { useState } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import JobOffers from "./JobOffers";
import BrowseResourceRequests from "./BrowseResourceRequests";

export default function Explorer() {
  const [activeTab, setActiveTab] = useState("offers");
  const [searchQuery, setSearchQuery] = useState("");

  const tabs = [
    { id: "offers", label: "Offres d’emploi" },
    { id: "requests", label: "Demandes de ressources" },
  ];

  return (
    <AppShell>
      {/* On réduit le padding du haut (-mt-4) pour coller à l'en-tête "Bonjour..." */}
      <main className="min-h-screen bg-[#F6F8F7] text-[#102F38] dark:bg-[#0B1F33] dark:text-slate-200">
        <div className="mx-auto w-full max-w-[1680px] px-4 pb-5 sm:px-7 lg:px-10 -mt-2 sm:-mt-4">
          
          {/* ✅ BARRE DE RECHERCHE + MENU */}
          <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* La barre de recherche */}
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-[#DCE7E2] bg-white px-4 py-2 shadow-sm transition focus-within:border-[#0CA581] focus-within:ring-4 focus-within:ring-[#0CA581]/10 dark:border-white/10 dark:bg-[#112A3A] dark:focus-within:border-emerald-500 dark:focus-within:ring-emerald-500/20">
              <Search size={20} strokeWidth={1.8} className="shrink-0 text-[#079B78] dark:text-emerald-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Métier, compétence, entreprise, ville..."
                aria-label="Rechercher dans les offres et les demandes"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-[#173A40] outline-none placeholder:text-[#9AA9A7] dark:text-white dark:placeholder:text-slate-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Effacer la recherche"
                  className="rounded-lg p-1.5 text-[#829491] transition hover:bg-[#EAF4EF] hover:text-[#087F68] dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-emerald-400"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Le menu déroulant */}
            <div className="relative shrink-0 sm:w-[220px]">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                aria-label="Choisir la catégorie"
                className="w-full appearance-none rounded-xl border border-[#DCE7E2] bg-white py-3 pl-4 pr-10 text-sm font-semibold text-[#123B40] outline-none shadow-sm transition focus:border-[#0CA581] focus:ring-4 focus:ring-[#0CA581]/10 dark:border-white/10 dark:bg-[#112A3A] dark:text-white dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id} className="dark:bg-[#112A3A] dark:text-white">
                    {tab.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#82918F] dark:text-slate-400"
              />
            </div>
          </section>

          {/* ✅ LES RÉSULTATS */}
          <section
            key={activeTab}
            id={`explorer-panel-${activeTab}`}
            className="min-w-0"
          >
            {activeTab === "offers" ? (
              <JobOffers embedded sharedSearch={searchQuery} />
            ) : (
              <BrowseResourceRequests
                embedded
                sharedSearch={searchQuery}
              />
            )}
          </section>
          
        </div>
      </main>
    </AppShell>
  );
}