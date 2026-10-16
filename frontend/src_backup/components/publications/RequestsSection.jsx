
import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Users,
  MapPin,
  CalendarDays,
  Eye,
  Pencil,
  Trash2,
  ChevronRight,
  FileText,
  Clock,
  AlertCircle,
  Search,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import CreateResourceRequestModal from "./CreateResourceRequestModal";

const STATUS_CFG = {
  draft: { label: "Brouillon", style: "bg-slate-100 text-slate-600" },
  published: { label: "Publiée", style: "bg-teal-50 text-teal-800" },
  paused: { label: "En pause", style: "bg-amber-50 text-amber-800" },
  closed: { label: "Fermée", style: "bg-rose-50 text-rose-700" },
  filled: { label: "Pourvue", style: "bg-blue-50 text-blue-800" },
  expired: { label: "Expirée", style: "bg-slate-100 text-slate-500" },
};

const asArray = (d) =>
  Array.isArray(d) ? d : d?.data && Array.isArray(d.data) ? d.data : [];

export default function RequestsSection() {
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editRequestId, setEditRequestId] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

    api
      .get("/companies")
      .then((res) => {
        const all = asArray(res.data);
        setCompany(all.find((c) => c.owner_user_id === user.id) || null);
      })
      .catch(() => setCompany(null));
  }, [user?.id]);

  const load = useCallback(() => {
    setLoading(true);

    api
      .get("/resource-requests", { params: { my: 1 } })
      .then((res) => setRequests(asArray(res.data)))
      .catch((err) => {
        console.error("Erreur de chargement des demandes :", err);
        setRequests([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (company) load();
  }, [company, load]);

  const doAction = async (id, action) => {
    try {
      await api.post(`/resource-requests/${id}/${action}`);
      load();
    } catch (err) {
      window.alert(
        err.response?.data?.message || "Impossible d'effectuer cette action."
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette demande ?")) return;

    try {
      await api.delete(`/resource-requests/${id}`);
      load();
    } catch (err) {
      window.alert(
        err.response?.data?.message || "Impossible de supprimer cette demande."
      );
    }
  };

  const openCreate = () => {
    setEditRequestId(null);
    setShowCreateModal(true);
  };

  const openEdit = (id) => {
    setEditRequestId(id);
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditRequestId(null);
  };

  const filtered = requests.filter((r) => {
    if (filter === "published") return r.display_status === "published";
    if (filter === "urgent") return r.urgency === "urgent";
    if (filter === "expired") return r.display_status === "expired";
    return true;
  });

  const counts = {
    all: requests.length,
    published: requests.filter((r) => r.display_status === "published").length,
    urgent: requests.filter((r) => r.urgency === "urgent").length,
    expired: requests.filter((r) => r.display_status === "expired").length,
  };

  if (!company) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
          <Users size={24} />
        </div>

        <h3 className="mt-4 text-base font-bold text-slate-900">
          Configurez votre entreprise
        </h3>

        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
          Vous devez créer votre profil entreprise avant de publier une demande
          de ressource.
        </p>

        <Link
          to="/company"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
        >
          Mon entreprise
          <ChevronRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Demandes de ressources
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Gérez vos besoins et suivez les propositions reçues.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          <Plus size={17} />
          Nouvelle demande
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">
        <FilterPill
          active={filter === "all"}
          onClick={() => setFilter("all")}
        >
          Toutes
          <Count>{counts.all}</Count>
        </FilterPill>

        <FilterPill
          active={filter === "published"}
          onClick={() => setFilter("published")}
        >
          Publiées
          <Count>{counts.published}</Count>
        </FilterPill>

        <FilterPill
          active={filter === "urgent"}
          onClick={() => setFilter("urgent")}
        >
          Urgentes
          <Count>{counts.urgent}</Count>
        </FilterPill>

        <FilterPill
          active={filter === "expired"}
          onClick={() => setFilter("expired")}
        >
          Expirées
          <Count>{counts.expired}</Count>
        </FilterPill>
      </div>

      {loading ? (
        <Skeleton />
      ) : filtered.length === 0 ? (
        <EmptyState onCreate={openCreate} />
      ) : (
        <div className="space-y-3">
          {filtered.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onAction={doAction}
              onDelete={handleDelete}
              onEdit={openEdit}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateResourceRequestModal
          requestId={editRequestId}
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

function StatusBadge({ status }) {
  const config = STATUS_CFG[status] || STATUS_CFG.draft;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${config.style}`}
    >
      {config.label}
    </span>
  );
}

function RequestCard({ request, onAction, onDelete, onEdit }) {
  const daysLeft = request.days_until_expiry;
  const isExpiringSoon =
    daysLeft !== null &&
    daysLeft !== undefined &&
    daysLeft <= 7 &&
    request.display_status === "published";

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
            <StatusBadge status={request.display_status} />

            {request.urgency === "urgent" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                <AlertCircle size={13} />
                Urgente
              </span>
            )}

            {isExpiringSoon && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                <Clock size={13} />
                Expire dans {daysLeft} j
              </span>
            )}
          </div>

          <Link
            to={`/resource-requests/${request.id}`}
            className="block"
          >
            <h3 className="mt-3 text-base font-bold text-slate-900 transition hover:text-teal-800">
              {request.title}
            </h3>
          </Link>

          {request.description && (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
              {request.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Eye size={14} />
              {request.views_count || 0} vues
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Users size={14} />
              {request.proposals_count || 0} proposition
              {(request.proposals_count || 0) > 1 ? "s" : ""}
            </span>

            {request.positions_count > 1 && (
              <span>
                {request.positions_count} postes
              </span>
            )}

            {request.city && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} />
                {request.city}
              </span>
            )}

            {request.start_at && request.end_at && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={14} />
                {fmtDate(request.start_at)} – {fmtDate(request.end_at)}
              </span>
            )}
          </div>

          {request.skills?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {request.skills.slice(0, 5).map((skill) => (
                <span
                  key={skill.id}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
                >
                  {skill.name}
                </span>
              ))}

              {request.skills.length > 5 && (
                <span className="self-center text-xs font-medium text-slate-500">
                  +{request.skills.length - 5}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        {["published", "paused"].includes(request.display_status) && (
          <Link
            to={`/resource-requests/${request.id}?candidates=1`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800 transition hover:bg-teal-100"
          >
            <Users size={14} />
            Voir les candidats
            <ChevronRight size={14} />
          </Link>
        )}

        {request.display_status === "draft" && (
          <button
            type="button"
            onClick={() => onAction(request.id, "publish")}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-teal-800 transition hover:bg-teal-50"
          >
            Publier
          </button>
        )}

        {request.display_status === "published" && (
          <button
            type="button"
            onClick={() => onAction(request.id, "pause")}
            className="rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Mettre en pause
          </button>
        )}

        {request.display_status === "paused" && (
          <button
            type="button"
            onClick={() => onAction(request.id, "publish")}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-teal-800 transition hover:bg-teal-50"
          >
            Reprendre
          </button>
        )}

        <button
          type="button"
          onClick={() => onEdit(request.id)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <Pencil size={14} />
          Modifier
        </button>

        <button
          type="button"
          onClick={() => onDelete(request.id)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
        >
          <Trash2 size={14} />
          Supprimer
        </button>
      </div>
    </article>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
        <FileText size={24} />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-900">
        Aucune demande dans ce filtre
      </h3>

      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
        Créez une demande pour présenter votre besoin et recevoir des
        propositions de talents.
      </p>

      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
      >
        <Plus size={16} />
        Créer une demande
      </button>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3" aria-label="Chargement des demandes">
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
