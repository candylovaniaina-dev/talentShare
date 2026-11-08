import React, { useState } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import JobOffers from "./JobOffers";
import BrowseResourceRequests from "./BrowseResourceRequests";

const TABS = [
  { id: "offers", label: "Recrutement" },
  { id: "requests", label: "Demandes de talents" },
];

export default function Explorer() {
  const [activeTab, setActiveTab] = useState("offers");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <AppShell>
      <main className="min-h-screen bg-transparent font-['Plus_Jakarta_Sans',sans-serif] text-[#0B1F33] dark:text-slate-200">
        <div className="mx-auto -mt-2 w-full max-w-[1680px] px-4 pb-5 sm:-mt-4 sm:px-7 lg:px-10">
          {/* Recherche + catégorie */}
          <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-[#E4EBF1] bg-white px-4 py-2 shadow-sm transition focus-within:border-[#16B8B1] focus-within:ring-4 focus-within:ring-[#16B8B1]/15 dark:border-white/10 dark:bg-[#131E47]">
              <Search size={18} strokeWidth={1.9} className="shrink-0 text-[#6B7F95]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Métier, compétence, entreprise, ville…"
                aria-label="Rechercher dans le recrutement et les demandes"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-[#0B1F33] outline-none placeholder:text-[#94A3B8] dark:text-white dark:placeholder:text-slate-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Effacer la recherche"
                  className="rounded-lg p-1.5 text-[#6B7F95] transition hover:bg-[#F3F6FC] hover:text-[#0B1F33] dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="relative shrink-0 sm:w-[230px]">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                aria-label="Choisir la catégorie"
                className="w-full appearance-none rounded-xl border border-[#E4EBF1] bg-white py-3 pl-4 pr-10 text-sm font-semibold text-[#0B1F33] shadow-sm outline-none transition focus:border-[#16B8B1] focus:ring-4 focus:ring-[#16B8B1]/15 dark:border-white/10 dark:bg-[#131E47] dark:text-white"
              >
                {TABS.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B7F95]" />
            </div>
          </section>

          {/* Résultats */}
          <section key={activeTab} id={`explorer-panel-${activeTab}`} className="min-w-0">
            {activeTab === "offers" ? (
              <JobOffers embedded sharedSearch={searchQuery} />
            ) : (
              <BrowseResourceRequests embedded sharedSearch={searchQuery} />
            )}
          </section>
        </div>
      </main>
    </AppShell>
  );
}