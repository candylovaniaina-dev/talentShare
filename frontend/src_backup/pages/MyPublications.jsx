import React, { useState } from "react";
import AppShell from "../components/layout/AppShell";
import OffersSection from "../components/publications/OffersSection";
import RequestsSection from "../components/publications/RequestsSection";

export default function MyPublications() {
  const [mainTab, setMainTab] = useState("offers");

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl py-2">

        {/* ===== LAYOUT : SIDEBAR + CONTENU ===== */}
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">

          {/* ============ NAVIGATION VERTICALE ============ */}
          <aside className="space-y-2">

            <NavCard
              active={mainTab === "offers"}
              onClick={() => setMainTab("offers")}
              emoji="⚡"
              label="Offres"
              subtitle="Emploi & ressources"
              color="emerald"
            />

            <NavCard
              active={mainTab === "requests"}
              onClick={() => setMainTab("requests")}
              emoji="📋"
              label="Demandes"
              subtitle="Besoin de talents"
              color="amber"
            />

            {/* Petite carte info en bas */}
            <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Astuce
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                Publiez régulièrement pour augmenter votre visibilité sur le réseau.
              </p>
            </div>
          </aside>

          {/* ============ CONTENU ============ */}
          <main className="min-w-0">
            <div className="animate-fadeIn">
              {mainTab === "offers" && <OffersSection />}
              {mainTab === "requests" && <RequestsSection />}
            </div>
          </main>
        </div>
      </div>
    </AppShell>
  );
}

/* ============================================
   CARTE DE NAVIGATION
============================================ */
function NavCard({ active, onClick, emoji, label, subtitle, color = "emerald" }) {
  const colorMap = {
    emerald: {
      ring:    "ring-emerald-500/30",
      bg:      "bg-emerald-500/[0.08]",
      text:    "text-emerald-400",
      bar:     "bg-emerald-400",
    },
    amber: {
      ring:    "ring-amber-500/30",
      bg:      "bg-amber-500/[0.08]",
      text:    "text-amber-400",
      bar:     "bg-amber-400",
    },
  };
  const c = colorMap[color] || colorMap.emerald;

  return (
    <button
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-xl border px-4 py-3.5 text-left transition-all duration-200 ${
        active
          ? `border-white/[0.12] ${c.bg} ring-1 ${c.ring}`
          : "border-white/[0.06] bg-white/[0.015] hover:border-white/[0.12] hover:bg-white/[0.03]"
      }`}
    >
      {/* Barre verticale animée */}
      <span
        className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full transition-all duration-200 ${
          active ? c.bar : "bg-transparent"
        }`}
      />

      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base transition ${
            active ? c.bg : "bg-white/[0.04]"
          }`}
        >
          {emoji}
        </span>

        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium transition ${active ? "text-white" : "text-slate-300"}`}>
            {label}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">{subtitle}</p>
        </div>
      </div>
    </button>
  );
}