import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import CreateResourceOfferModal from "./CreateResourceOfferModal";

// ============ CONFIG ============
const OFFER_TYPES = {
  internship: "Stage",
  apprenticeship: "Alternance",
  junior_mission: "Mission junior",
  first_job: "Premier emploi",
};

const MISSION_TYPES = {
  full_time: "Temps plein", part_time: "Temps partiel",
  freelance: "Freelance", mission: "Mission", loan: "Mise à disposition",
};

const JOB_STATUS = {
  draft:     { label: "Brouillon", color: "text-slate-400" },
  published: { label: "Publiée",   color: "text-emerald-400" },
  closed:    { label: "Clôturée",  color: "text-rose-400" },
  expired:   { label: "Expirée",   color: "text-slate-500" },
};

const RESOURCE_STATUS = {
  draft:           { label: "Brouillon",          color: "text-slate-500" },
  published:       { label: "Publiée",            color: "text-emerald-400" },
  closed:          { label: "Clôturée",           color: "text-rose-400" },
  expired:         { label: "Expirée",            color: "text-slate-500" },
  mission_pending: { label: "Mission en attente", color: "text-amber-400" },
  mission_planned: { label: "Mission acceptée",   color: "text-blue-400" },
  mission_active:  { label: "Mission en cours",   color: "text-emerald-400" },
};

const asArray = (d) => Array.isArray(d) ? d : (d?.data && Array.isArray(d.data) ? d.data : []);

// ============ COMPOSANT ============
export default function OffersSection() {
  const { user } = useAuth();
  const isCompany = user?.role === "company";

  const [filter, setFilter] = useState("all");
  const [jobOffers, setJobOffers] = useState([]);
  const [resourceOffers, setResourceOffers] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Modal : création + édition
  const [showModal, setShowModal] = useState(false);
  const [editOfferId, setEditOfferId] = useState(null);

  // Charge entreprise
  useEffect(() => {
    if (!isCompany) return;
    api.get("/companies/me").then((r) => setCompany(r.data)).catch(() => setCompany(null));
  }, [isCompany]);

  // Charge les 2 types d'offres
  const load = () => {
    setLoading(true);
    Promise.all([
      api.get(isCompany ? "/job-offers/my" : "/job-offers").then((r) => asArray(r.data)).catch(() => []),
      isCompany ? api.get("/resource-offers/my").then((r) => asArray(r.data)).catch(() => []) : Promise.resolve([]),
    ]).then(([jobs, resources]) => {
      setJobOffers(jobs);
      setResourceOffers(resources);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [isCompany]);

  // Filtrage
  const allOffers = [
    ...jobOffers.map((o) => ({ ...o, __type: "job" })),
    ...resourceOffers.map((o) => ({ ...o, __type: "resource" })),
  ];

  const filtered = filter === "all"
    ? allOffers
    : allOffers.filter((o) => o.__type === (filter === "jobs" ? "job" : "resource"));

  // Actions
  const deleteJob = async (id) => {
    if (!confirm("Supprimer cette offre ?")) return;
    try { await api.delete(`/job-offers/${id}`); load(); } catch { alert("Erreur"); }
  };

  const deleteResource = async (id) => {
    if (!confirm("Supprimer cette offre ?")) return;
    try { await api.delete(`/resource-offers/${id}`); load(); } catch { alert("Erreur"); }
  };

  const openCreate = () => { setEditOfferId(null); setShowModal(true); };
  const openEdit   = (id) => { setEditOfferId(id);   setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditOfferId(null); };

  return (
    <>
      {/* ===== BARRE FILTRES + ACTION ===== */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>
            Tout <span className="ml-1.5 text-slate-500">{allOffers.length}</span>
          </FilterPill>
          <FilterPill active={filter === "jobs"} onClick={() => setFilter("jobs")}>
            Emploi <span className="ml-1.5 text-slate-500">{jobOffers.length}</span>
          </FilterPill>
          <FilterPill active={filter === "resources"} onClick={() => setFilter("resources")}>
            Ressources <span className="ml-1.5 text-slate-500">{resourceOffers.length}</span>
          </FilterPill>
        </div>

        {(filter === "all" || filter === "resources") && (
          <button
            onClick={openCreate}
            className="text-xs font-medium text-slate-400 transition hover:text-emerald-400"
          >
            + Proposer un talent
          </button>
        )}
      </div>

      {/* ===== LISTE ===== */}
      {loading ? (
        <Skeleton />
      ) : filtered.length === 0 ? (
        <EmptyState filter={filter} isCompany={isCompany} company={company} onCreate={openCreate} />
      ) : (
        <div className="space-y-2">
          {filtered.map((offer) =>
            offer.__type === "job" ? (
              <JobOfferCard key={`job-${offer.id}`} offer={offer} isCompany={isCompany} onDelete={deleteJob} />
            ) : (
              <ResourceOfferCard
                key={`res-${offer.id}`}
                offer={offer}
                onDelete={deleteResource}
                onEdit={openEdit}
              />
            )
          )}
        </div>
      )}

      {/* ✅ MODAL — création OU édition */}
      {showModal && (
        <CreateResourceOfferModal
          offerId={editOfferId}
          onClose={closeModal}
          onSuccess={() => { closeModal(); load(); }}
        />
      )}
    </>
  );
}

// ============ FILTRE PILL ============
function FilterPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30"
          : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

// ============ CARTE JOB ============
function JobOfferCard({ offer, isCompany, onDelete }) {
  const statusCfg = JOB_STATUS[offer.status] || JOB_STATUS.published;

  return (
    <div className="group rounded-lg border border-white/[0.06] bg-white/[0.015] px-5 py-4 transition hover:border-white/[0.12] hover:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className={statusCfg.color}>{statusCfg.label}</span>
            <span>·</span>
            <span>Emploi</span>
            <span>·</span>
            <span>{OFFER_TYPES[offer.offer_type] || offer.offer_type}</span>
          </div>
          <h3 className="mt-2 text-base font-medium text-white">{offer.title}</h3>
          {offer.company && <p className="mt-1 text-xs text-slate-500">{offer.company.name}</p>}
          {offer.description && (
            <p className="mt-2 line-clamp-2 text-sm text-slate-400">{offer.description}</p>
          )}
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
            {offer.city && <span>{offer.city}</span>}
            {offer.remote && (<><span>·</span><span>Télétravail</span></>)}
          </div>
        </div>
        {isCompany && (
          <button onClick={() => onDelete(offer.id)} className="text-xs text-slate-500 transition hover:text-rose-400">
            Supprimer
          </button>
        )}
      </div>
      {isCompany && (
        <div className="mt-4 flex items-center justify-between border-t border-white/[0.04] pt-3">
          <Link
            to={`/job-offers/${offer.id}/applications`}
            className="text-xs font-medium text-emerald-400 transition hover:text-emerald-300"
          >
            {offer.applications_count || 0} candidature{(offer.applications_count || 0) > 1 ? "s" : ""} →
          </Link>
        </div>
      )}
    </div>
  );
}

// ============ CARTE RESOURCE ============
function ResourceOfferCard({ offer, onDelete, onEdit }) {
  const displayKey = offer.display_status || offer.status;
  const statusCfg = RESOURCE_STATUS[displayKey] || RESOURCE_STATUS.draft;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "";

  return (
    <div className="group rounded-lg border border-white/[0.06] bg-white/[0.015] px-5 py-4 transition hover:border-white/[0.12] hover:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className={statusCfg.color}>{statusCfg.label}</span>
            <span>·</span>
            <span>Ressource</span>
            <span>·</span>
            <span>{MISSION_TYPES[offer.mission_type] || offer.mission_type}</span>
          </div>
          <h3 className="mt-2 text-base font-medium text-white">{offer.title}</h3>
          {offer.profile?.user && (
            <p className="mt-1 text-xs text-slate-500">
              {offer.profile.user.name}
              {offer.profile.headline && ` · ${offer.profile.headline}`}
            </p>
          )}
          {offer.description && (
            <p className="mt-2 line-clamp-2 text-sm text-slate-400">{offer.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            {offer.start_at && offer.end_at && (
              <span>{fmtDate(offer.start_at)} → {fmtDate(offer.end_at)}</span>
            )}
            {offer.location_city && (<><span>·</span><span>{offer.location_city}</span></>)}
            {offer.daily_rate && (<><span>·</span><span className="font-medium text-emerald-400">{offer.daily_rate}€/jour</span></>)}
          </div>
        </div>
        <button onClick={() => onDelete(offer.id)} className="text-xs text-slate-500 transition hover:text-rose-400">
          Supprimer
        </button>
      </div>
      <div className="mt-4 flex items-center gap-4 border-t border-white/[0.04] pt-3 text-xs">
        <button
          onClick={() => onEdit(offer.id)}
          className="text-slate-500 transition hover:text-white"
        >
          Modifier
        </button>
      </div>
    </div>
  );
}

// ============ EMPTY STATE ============
function EmptyState({ filter, isCompany, company, onCreate }) {
  const messages = {
    all: "Aucune offre pour l'instant",
    jobs: "Aucune offre d'emploi",
    resources: "Aucune offre de ressources",
  };
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] py-20">
      <p className="text-sm text-slate-400">{messages[filter]}</p>
      {isCompany && company && (
        <button
          onClick={onCreate}
          className="mt-4 text-xs font-medium text-emerald-400 transition hover:text-emerald-300"
        >
          + Créer ma première offre →
        </button>
      )}
    </div>
  );
}

// ============ SKELETON ============
function Skeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 animate-pulse rounded-lg border border-white/[0.04] bg-white/[0.015]" />
      ))}
    </div>
  );
}