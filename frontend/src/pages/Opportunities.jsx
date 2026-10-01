import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Briefcase, MapPin, Building2, Clock, Eye, Check, X,
  Loader2, FileText, UserCheck, Video, ChevronRight, Send,
  Home, SlidersHorizontal, Filter, Inbox, Sparkles,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import ApplyModal from "../components/ApplyModal";
import api from "../services/api";

// ============================================
// CONFIG STATUTS (icônes Lucide, pas d'emoji)
// ============================================
const STATUS_CFG = {
  sent:        { label: "Envoyée",         icon: Clock,     tone: "border-white/10 bg-white/5 text-slate-300" },
  viewed:      { label: "Consultée",       icon: Eye,       tone: "border-blue-500/30 bg-blue-500/10 text-blue-300" },
  shortlisted: { label: "Présélectionnée", icon: UserCheck, tone: "border-violet-500/30 bg-violet-500/10 text-violet-300" },
  interview:   { label: "Entretien",       icon: Video,     tone: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
  accepted:    { label: "Acceptée",        icon: Check,     tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
  rejected:    { label: "Refusée",         icon: X,         tone: "border-rose-500/30 bg-rose-500/10 text-rose-300" },
};

const APPLICATION_FILTERS = [
  { key: "all",         label: "Toutes" },
  { key: "sent",        label: "Envoyées" },
  { key: "viewed",      label: "Consultées" },
  { key: "shortlisted", label: "Présélectionnées" },
  { key: "interview",   label: "Entretiens" },
  { key: "accepted",    label: "Acceptées" },
  { key: "rejected",    label: "Refusées" },
];

const OFFER_TYPES = {
  internship:     "Stage",
  apprenticeship: "Alternance",
  junior_mission: "Mission junior",
  first_job:      "Premier emploi",
};

// ============================================
// PAGE PRINCIPALE — Layout style Shopify
// ============================================
export default function Opportunities() {
  const [tab, setTab] = useState("offers");

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">

        {/* ===== HEADER ===== */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Espace personnel
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white">Opportunités</h1>
            <p className="mt-1 text-sm text-slate-400">
              Découvrez les offres et suivez vos candidatures.
            </p>
          </div>

          {/* Actions haut-droite (style Shopify) */}
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-white/20 hover:text-white">
              <Filter size={13} /> Filtrer
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-[#0A1229] transition hover:bg-emerald-400">
              <Sparkles size={13} /> Recommandations
            </button>
          </div>
        </div>

        {/* ===== ONGLETS ===== */}
        <div className="mb-6 flex gap-1 border-b border-white/10">
          <TabButton
            active={tab === "offers"}
            onClick={() => setTab("offers")}
            icon={Briefcase}
            label="Offres"
            count={null}
          />
          <TabButton
            active={tab === "applications"}
            onClick={() => setTab("applications")}
            icon={Send}
            label="Mes candidatures"
            count={null}
          />
        </div>

        {/* ===== CONTENU ===== */}
        {tab === "offers" && <OffersTab />}
        {tab === "applications" && <ApplicationsTab />}
      </div>
    </AppShell>
  );
}

// ============================================
// BOUTON ONGLET (style Shopify)
// ============================================
function TabButton({ active, onClick, icon: Icon, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold transition ${
        active ? "text-emerald-400" : "text-slate-400 hover:text-white"
      }`}
    >
      <Icon size={15} />
      {label}
      {count > 0 && (
        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
          active ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-slate-400"
        }`}>
          {count}
        </span>
      )}
      {active && <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-emerald-400" />}
    </button>
  );
}

// ============================================
// SECTION HEADER (titre + action, style Shopify)
// ============================================
function SectionHeader({ title, count, children }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</h2>
        {count !== undefined && (
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-400">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ============================================
// FILTRE PILL
// ============================================
function FilterPill({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-emerald-500 bg-emerald-500 text-[#0A1229]"
          : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25 hover:text-white"
      }`}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
          active ? "bg-black/20 text-[#0A1229]" : "bg-white/10 text-slate-400"
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ============================================
// EMPTY STATE
// ============================================
function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-14 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-slate-500">
        <Icon size={26} />
      </span>
      <p className="mt-4 font-semibold text-white">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ============================================
// ONGLET 1 : OFFRES
// ============================================
function OffersTab() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyModal, setApplyModal] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    api.get("/job-offers")
      .then((res) => setOffers(res.data.data || res.data || []))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = offers
    .filter((o) => {
      if (filter === "internships") return ["internship", "apprenticeship", "junior_mission", "first_job"].includes(o.offer_type);
      if (filter === "remote") return o.remote === true;
      return true;
    })
    .filter((o) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        o.title?.toLowerCase().includes(q) ||
        o.company?.name?.toLowerCase().includes(q) ||
        o.description?.toLowerCase().includes(q)
      );
    });

  return (
    <>
      {/* Barre de recherche + filtres (style Shopify) */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 transition focus-within:border-emerald-500/50">
          <Search size={14} className="text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une offre, une entreprise..."
            className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>Tout</FilterPill>
          <FilterPill active={filter === "internships"} onClick={() => setFilter("internships")}>Stages</FilterPill>
          <FilterPill active={filter === "remote"} onClick={() => setFilter("remote")}>Télétravail</FilterPill>
        </div>
      </div>

      {/* Section */}
      <SectionHeader title="Offres disponibles" count={filtered.length} />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-emerald-400" size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Aucune opportunité pour le moment"
          subtitle="Revenez plus tard ou modifiez vos filtres."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o) => (
            <div
              key={o.id}
              className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition hover:border-emerald-500/40 hover:bg-white/[0.06]"
            >
              {/* Type d'offre */}
              <span className="self-start rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
                {OFFER_TYPES[o.offer_type] || o.offer_type}
              </span>

              {/* Titre */}
              <h3 className="mt-3 line-clamp-2 font-bold text-white">{o.title}</h3>

              {/* Entreprise */}
              {o.company && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                  <Building2 size={11} /> {o.company.name}
                </p>
              )}

              {/* Description */}
              <p className="mt-2 flex-1 line-clamp-3 text-sm text-slate-400">{o.description}</p>

              {/* Meta */}
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                {o.city && (
                  <span className="flex items-center gap-1">
                    <MapPin size={11} /> {o.city}
                  </span>
                )}
                {o.remote && (
                  <span className="flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 font-semibold text-blue-300">
                    <Home size={10} /> Télétravail
                  </span>
                )}
              </div>

              {/* Action */}
              <button
                onClick={() => setApplyModal(o)}
                className="mt-4 w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400"
              >
                Postuler
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal candidature */}
      {applyModal && (
        <ApplyModal
          offer={applyModal}
          onClose={() => setApplyModal(null)}
          onSuccess={load}
        />
      )}
    </>
  );
}

// ============================================
// ONGLET 2 : MES CANDIDATURES
// ============================================
function ApplicationsTab() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const [appsRes, statsRes] = await Promise.all([
        api.get("/applications"),
        api.get("/applications/stats"),
      ]);
      setApplications(appsRes.data || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "all"
    ? applications
    : applications.filter((a) => a.status === filter);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-emerald-400" size={32} />
      </div>
    );
  }

  return (
    <>
      {/* ==== SECTION 1 : Stats ==== */}
      {stats && stats.total > 0 && (
        <>
          <SectionHeader title="Vue d'ensemble" />
          <div className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { key: "total",       label: "Total",            color: "text-white",        bg: "bg-white/[0.04]" },
              { key: "sent",        label: "Envoyées",         color: "text-slate-300",    bg: "bg-white/[0.04]" },
              { key: "viewed",      label: "Consultées",       color: "text-blue-300",     bg: "bg-blue-500/[0.06]" },
              { key: "shortlisted", label: "Présélectionnées", color: "text-violet-300",   bg: "bg-violet-500/[0.06]" },
              { key: "interview",   label: "Entretiens",       color: "text-amber-300",    bg: "bg-amber-500/[0.06]" },
              { key: "accepted",    label: "Acceptées",        color: "text-emerald-300",  bg: "bg-emerald-500/[0.06]" },
            ].map((s) => (
              <div key={s.key} className={`rounded-xl border border-white/10 p-3 ${s.bg}`}>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{s.label}</p>
                <p className={`mt-1 text-2xl font-bold ${s.color}`}>{stats[s.key] || 0}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ==== SECTION 2 : Filtres ==== */}
      <SectionHeader title="Filtrer par statut" />
      <div className="mb-5 flex flex-wrap gap-2">
        {APPLICATION_FILTERS.map((f) => {
          const count = f.key === "all"
            ? applications.length
            : applications.filter((a) => a.status === f.key).length;
          return (
            <FilterPill
              key={f.key}
              active={filter === f.key}
              onClick={() => setFilter(f.key)}
              count={count}
            >
              {f.label}
            </FilterPill>
          );
        })}
      </div>

      {/* ==== SECTION 3 : Liste ==== */}
      <SectionHeader title="Mes candidatures" count={filtered.length} />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Send}
          title={filter === "all" ? "Aucune candidature pour l'instant" : "Aucune candidature dans cette catégorie"}
          subtitle={filter === "all" ? "Parcourez les offres dans l'onglet « Offres » et postulez." : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const cfg = STATUS_CFG[app.status] || STATUS_CFG.sent;
            const Icon = cfg.icon;
            return (
              <Link
                key={app.id}
                to={`/applications/${app.id}`}
                className="group block rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition hover:border-emerald-500/40 hover:bg-white/[0.06]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${cfg.tone}`}>
                        <Icon size={11} /> {cfg.label}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(app.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">
                      {app.job_offer?.title || "Offre supprimée"}
                    </h3>
                    {app.job_offer?.company && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
                        <Building2 size={13} /> {app.job_offer.company.name}
                        {app.job_offer.city && <span className="text-slate-500"> · {app.job_offer.city}</span>}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      {app.portfolio && (
                        <span className="flex items-center gap-1"><Briefcase size={11} /> Portfolio joint</span>
                      )}
                      <span className="flex items-center gap-1"><FileText size={11} /> CV joint</span>
                    </div>
                  </div>

                  <ChevronRight size={18} className="shrink-0 text-slate-600 transition group-hover:translate-x-1 group-hover:text-emerald-400" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}