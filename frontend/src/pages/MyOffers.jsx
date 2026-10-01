import React, { useState } from "react";
import { Briefcase, Handshake } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import JobOffersTab from "../components/offers/JobOffersTab";
import ResourceOffersTab from "../components/offers/ResourceOffersTab";

export default function MyOffers() {
  const [tab, setTab] = useState("jobs"); // "jobs" | "resources"

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">

        {/* ===== HEADER ===== */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Espace entreprise
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">Mes offres</h1>
          <p className="mt-1 text-sm text-slate-400">
            Gérez vos offres d'emploi et vos mises à disposition de salariés.
          </p>
        </div>

        {/* ===== ONGLETS ===== */}
        <div className="mb-6 flex gap-1 border-b border-white/10">
          <TabButton
            active={tab === "jobs"}
            onClick={() => setTab("jobs")}
            icon={Briefcase}
            label="Offres d'emploi"
          />
          <TabButton
            active={tab === "resources"}
            onClick={() => setTab("resources")}
            icon={Handshake}
            label="Offres de ressources"
          />
        </div>

        {/* ===== CONTENU ===== */}
        {tab === "jobs" && <JobOffersTab />}
        {tab === "resources" && <ResourceOffersTab />}
      </div>
    </AppShell>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold transition ${
        active ? "text-emerald-400" : "text-slate-400 hover:text-white"
      }`}
    >
      <Icon size={15} />
      {label}
      {active && <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-emerald-400" />}
    </button>
  );
}