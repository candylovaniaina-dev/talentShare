
import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  BriefcaseBusiness,
  Users,
  MapPin,
  CalendarDays,
  Eye,
  Pencil,
  Trash2,
  ChevronRight,
  FileText,
  Search,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import CreateResourceOfferModal from "./CreateResourceOfferModal";

const OFFER_TYPES = {
  internship: "Stage",
  apprenticeship: "Alternance",
  junior_mission: "Mission junior",
  first_job: "Premier emploi",
};

const MISSION_TYPES = {
  full_time: "Temps plein",
  part_time: "Temps partiel",
  freelance: "Freelance",
  mission: "Mission",
  loan: "Mise à disposition",
};

const JOB_STATUS = {
  draft: { label: "Brouillon", style: "bg-slate-100 text-slate-600" },
  published: { label: "Publiée", style: "bg-teal-50 text-teal-800" },
  closed: { label: "Clôturée", style: "bg-rose-50 text-rose-700" },
  expired: { label: "Expirée", style: "bg-slate-100 text-slate-500" },
};

const RESOURCE_STATUS = {
  draft: { label: "Brouillon", style: "bg-slate-100 text-slate-600" },
  published: { label: "Publiée", style: "bg-teal-50 text-teal-800" },
  closed: { label: "Clôturée", style: "bg-rose-50 text-rose-700" },
  expired: { label: "Expirée", style: "bg-slate-100 text-slate-500" },
  mission_pending: {
    label: "Mission en attente",
    style: "bg-amber-50 text-amber-800",
  },
  mission_planned: {
    label: "Mission acceptée",
    style: "bg-blue-50 text-blue-800",
  },
  mission_active: {
    label: "Mission en cours",
    style: "bg-teal-50 text-teal-800",
  },
};

const asArray = (d) =>
  Array.isArray(d) ? d : d?.data && Array.isArray(d.data) ? d.data : [];

export default function OffersSection() {
  const { user } = useAuth();
  const isCompany = user?.role === "company";

  const [filter, setFilter] = useState("all");
  const [jobOffers, setJobOffers] = useState([]);
  const [resourceOffers, setResourceOffers] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editOfferId, setEditOfferId] = useState(null);

  useEffect(() => {
    if (!isCompany) {
      setCompany(null);
      return;
    }

    api
      .get("/companies/me")
      .then((r) => setCompany(r.data))
      .catch(() => setCompany(null));
  }, [isCompany]);

  const load = useCallback(() => {
    setLoading(true);

    Promise.all([
      api
        .get(isCompany ? "/job-offers/my" : "/job-offers")
        .then((r) => asArray(r.data))
        .catch(() => []),
      isCompany
        ? api
            .get("/resource-offers/my")
            .then((r) => asArray(r.data))
            .catch(() => [])
        : Promise.resolve([]),
    ])
      .then(([jobs, resources]) => {
        setJobOffers(jobs);
        setResourceOffers(resources);
      })
      .finally(() => setLoading(false));
  }, [isCompany]);

  useEffect(() => {
    load();
  }, [load]);

  const allOffers = [
    ...jobOffers.map((o) => ({ ...o, __type: "job" })),
    ...resourceOffers.map((o) => ({ ...o, __type: "resource" })),
  ];

  const filtered =
    filter === "all"
      ? allOffers
      : allOffers.filter(
          (o) => o.__type === (filter === "jobs" ? "job" : "resource")
        );

  const deleteJob = async (id) => {
    if (!window.confirm("Supprimer cette offre d'emploi ?")) return;

    try {
      await api.delete(`/job-offers/${id}`);
      load();
    } catch {
      window.alert("Impossible de supprimer cette offre.");
    }
  };

  const deleteResource = async (id) => {
    if (!window.confirm("Supprimer cette offre de ressource ?")) return;

    try {
      await api.delete(`/resource-offers/${id}`);
      load();
    } catch {
      window.alert("Impossible de supprimer cette offre.");
    }
  };

  const openCreate = () => {
    setEditOfferId(null);
    setShowModal(true);
  };

  const openEdit = (id) => {
    setEditOfferId(id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditOfferId(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Offres
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Retrouvez et gérez vos offres d'emploi et de ressources.
          </p>
        </div>

        {(filter === "all" || filter === "resources") && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            <Plus size={17} />
            Proposer un talent
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">
        <FilterPill
          active={filter === "all"}
          onClick={() => setFilter("all")}
        >
          Toutes
          <Count>{allOffers.length}</Count>
        </FilterPill>

        <FilterPill
          active={filter === "jobs"}
          onClick={() => setFilter("jobs")}
        >
          Emploi
          <Count>{jobOffers.length}</Count>
        </FilterPill>

        <FilterPill
          active={filter === "resources"}
          onClick={() => setFilter("resources")}
        >
          Ressources
          <Count>{resourceOffers.length}</Count>
        </FilterPill>
      </div>

      {loading ? (
        <Skeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          filter={filter}
          isCompany={isCompany}
          company={company}
          onCreate={openCreate}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((offer) =>
            offer.__type === "job" ? (
              <JobOfferCard
                key={`job-${offer.id}`}
                offer={offer}
                isCompany={isCompany}
                onDelete={deleteJob}
              />
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

      {showModal && (
        <CreateResourceOfferModal
          offerId={editOfferId}
          onClose={closeModal}
          onSuccess={() => {
            closeModal();
            load();
          }}
        />
      )}
    </div>
  );
}

function Count({ children }) {
  return (
    <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
      {children}
    </span>
  );
}

function FilterPill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-lg px-3.5 py-2 text-sm font-medium transition ${
        active
          ? "bg-teal-50 text-teal-800"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status, config }) {
  const item = config[status] || config.draft;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${item.style}`}
    >
      {item.label}
    </span>
  );
}

function JobOfferCard({ offer, isCompany, onDelete }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={offer.status} config={JOB_STATUS} />
            <span className="text-xs text-slate-400">Emploi</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500">
              {OFFER_TYPES[offer.offer_type] || offer.offer_type}
            </span>
          </div>

          <h3 className="mt-3 text-base font-bold text-slate-900">
            {offer.title}
          </h3>

          {offer.company && (
            <p className="mt-1 text-sm text-slate-500">
              {offer.company.name}
            </p>
          )}

          {offer.description && (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
              {offer.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
            {offer.city && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} />
                {offer.city}
              </span>
            )}

            {offer.remote && (
              <span className="inline-flex items-center gap-1.5">
                <Eye size={14} />
                Télétravail possible
              </span>
            )}
          </div>
        </div>

        {isCompany && (
          <button
            type="button"
            onClick={() => onDelete(offer.id)}
            aria-label="Supprimer cette offre"
            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
          >
            <Trash2 size={14} />
            Supprimer
          </button>
        )}
      </div>

      {isCompany && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <Link
            to={`/job-offers/${offer.id}/applications`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition hover:text-teal-900"
          >
            <Users size={16} />
            {offer.applications_count || 0} candidature
            {(offer.applications_count || 0) > 1 ? "s" : ""}
            <ChevronRight size={15} />
          </Link>
        </div>
      )}
    </article>
  );
}

function ResourceOfferCard({ offer, onDelete, onEdit }) {
  const displayKey = offer.display_status || offer.status;
  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        })
      : "";

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={displayKey} config={RESOURCE_STATUS} />
            <span className="text-xs text-slate-400">Ressource</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500">
              {MISSION_TYPES[offer.mission_type] || offer.mission_type}
            </span>
          </div>

          <h3 className="mt-3 text-base font-bold text-slate-900">
            {offer.title}
          </h3>

          {offer.profile?.user && (
            <p className="mt-1 text-sm text-slate-500">
              {offer.profile.user.name}
              {offer.profile.headline && ` · ${offer.profile.headline}`}
            </p>
          )}

          {offer.description && (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
              {offer.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
            {offer.start_at && offer.end_at && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={14} />
                {fmtDate(offer.start_at)} – {fmtDate(offer.end_at)}
              </span>
            )}

            {offer.location_city && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} />
                {offer.location_city}
              </span>
            )}

            {offer.daily_rate && (
              <span className="font-semibold text-teal-800">
                {offer.daily_rate} €/jour
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDelete(offer.id)}
          aria-label="Supprimer cette offre de ressource"
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
        >
          <Trash2 size={14} />
          Supprimer
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => onEdit(offer.id)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-teal-50 hover:text-teal-800"
        >
          <Pencil size={14} />
          Modifier
        </button>
      </div>
    </article>
  );
}

function EmptyState({ filter, isCompany, company, onCreate }) {
  const messages = {
    all: "Aucune offre pour le moment.",
    jobs: "Aucune offre d'emploi pour le moment.",
    resources: "Aucune offre de ressources pour le moment.",
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
        {filter === "jobs" ? (
          <BriefcaseBusiness size={24} />
        ) : filter === "resources" ? (
          <Users size={24} />
        ) : (
          <FileText size={24} />
        )}
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-900">
        {messages[filter]}
      </h3>

      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
        Les offres que vous publiez apparaîtront ici.
      </p>

      {isCompany && company && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
        >
          <Plus size={16} />
          Créer une offre
        </button>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3" aria-label="Chargement des offres">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-slate-200 bg-white p-5"
        >
          <div className="h-5 w-24 rounded-md bg-slate-100" />
          <div className="mt-4 h-5 w-2/3 rounded-md bg-slate-100" />
          <div className="mt-3 h-4 w-full max-w-lg rounded-md bg-slate-100" />
          <div className="mt-2 h-4 w-1/2 rounded-md bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
