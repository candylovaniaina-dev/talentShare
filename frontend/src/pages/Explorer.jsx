import React, { useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { X } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import JobOffers from "./JobOffers";
import BrowseResourceRequests from "./BrowseResourceRequests";
import { ExplorerStyles, FONT, AnimatedNumber } from "../components/explorer/ExplorerKit";

const TABS = [
  { id: "offers", label: "Recrutement" },
  { id: "requests", label: "Demandes de talents" },
];

export default function Explorer() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") === "requests" ? "requests" : "offers";

  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);

  const [counts, setCounts] = useState({
    offers: null,
    requests: null,
  });

  const inputRef = useRef(null);

  const setOffersCount = useCallback((value) => {
    setCounts((current) =>
      current.offers === value ? current : { ...current, offers: value }
    );
  }, []);

  const setRequestsCount = useCallback((value) => {
    setCounts((current) =>
      current.requests === value ? current : { ...current, requests: value }
    );
  }, []);

  useEffect(() => {
    const handleShortcut = (event) => {
      const tag = document.activeElement?.tagName || "";

      if (
        event.key === "/" &&
        !/INPUT|TEXTAREA|SELECT/.test(tag) &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleShortcut);

    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  return (
    <AppShell>
      <ExplorerStyles />

      <main
        className={`${FONT} min-h-screen bg-[#F5F8FC] text-[#10243A] dark:bg-[#0B1F33] dark:text-slate-200`}
      >
        <div className="mx-auto w-full max-w-[1680px] px-4 pb-12 pt-5 sm:px-6 lg:px-8">

          <div className="overflow-hidden rounded-[22px] border border-[#DCE5EF] bg-white shadow-[0_4px_20px_rgba(15,35,60,0.035)] dark:border-white/10 dark:bg-[#112A3A]">

            {/* BARRE PRINCIPALE */}
            <div className="flex min-w-0 flex-col gap-3 border-b border-[#E9EEF4] p-3 sm:p-4 lg:flex-row lg:items-center lg:gap-5 dark:border-white/10">

              {/* RECHERCHE */}
              <div className="relative min-w-0 flex-1">
                <input
                  ref={inputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Métier, compétence, ville..."
                  aria-label="Rechercher un métier, une compétence ou une ville"
                  className="h-[48px] w-full rounded-[15px] border border-[#D8E2EE] bg-white px-4 pr-12 text-[14px] font-medium text-[#18314D] outline-none transition placeholder:text-[#A5B1C1] hover:border-[#B9C9DA] focus:border-[#0F9691] focus:ring-4 focus:ring-[#0F9691]/[0.08] dark:border-white/10 dark:bg-[#0B1F33] dark:text-white dark:placeholder:text-slate-500"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Effacer la recherche"
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <X size={15} />
                  </button>
                )}

                {!searchQuery && (
                  <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-[#E0E7EF] bg-[#F8FAFC] px-2 py-1 text-[10px] font-semibold text-[#8494A8] sm:block dark:border-white/10 dark:bg-white/5">
                    /
                  </kbd>
                )}
              </div>

              {/* ONGLETS (Arrondis et adoucis) */}
              <div className="flex w-full shrink-0 rounded-full bg-[#F1F5F9] p-1 lg:w-auto dark:bg-white/[0.06]">
                {TABS.map((tab) => {
                  const active = activeTab === tab.id;
                  const count = counts[tab.id];

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabChange(tab.id)}
                      aria-selected={active}
                      role="tab"
                      className={`flex min-h-[42px] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-[13px] font-bold transition-all duration-300 lg:flex-none lg:px-5 ${
                        active
                          ? "bg-[#102B43] text-white shadow-[0_2px_8px_rgba(16,43,67,0.2)] dark:bg-[#0F9691]"
                          : "text-[#718198] hover:bg-white/60 hover:text-[#102B43] dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                      }`}
                    >
                      {tab.label}

                      <span
                        className={`flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold tabular-nums transition-colors ${
                          active
                            ? "bg-white/20 text-white" // Plus contrasté sur le bleu
                            : "bg-[#E2E8F0] text-[#65758B] dark:bg-white/10 dark:text-slate-300"
                        }`}
                      >
                        <AnimatedNumber value={count} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CONTENU */}
            <div className="p-3 sm:p-4">
              <section role="tabpanel" hidden={activeTab !== "offers"}>
                <JobOffers
                  embedded
                  sharedSearch={deferredQuery}
                  onCountChange={setOffersCount}
                />
              </section>

              <section role="tabpanel" hidden={activeTab !== "requests"}>
                <BrowseResourceRequests
                  embedded
                  sharedSearch={deferredQuery}
                  onCountChange={setRequestsCount}
                />
              </section>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}