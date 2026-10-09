import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import CreateResourceRequestModal from "./CreateResourceRequestModal";

const STATUS_CFG = {
  draft:     { label: "Brouillon", color: "text-slate-400" },
  published: { label: "Publiée",   color: "text-emerald-400" },
  paused:    { label: "En pause",  color: "text-amber-400" },
  closed:    { label: "Fermée",    color: "text-rose-400" },
  filled:    { label: "Pourvue",   color: "text-blue-400" },
  expired:   { label: "Expirée",   color: "text-slate-500" },
};

const asArray = (d) => Array.isArray(d) ? d : (d?.data && Array.isArray(d.data) ? d.data : []);

export default function RequestsSection() {
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // ✅ Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editRequestId, setEditRequestId] = useState(null);

  useEffect(() => {
    api.get("/companies").then((res) => {
      const all = asArray(res.data);
      setCompany(all.find((c) => c.owner_user_id === user.id));
    });
  }, [user.id]);

  const load = () => {
    setLoading(true);
    api.get("/resource-requests", { params: { my: 1 } })
      .then((res) => setRequests(asArray(res.data)))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (company) load(); }, [company]);

  const doAction = async (id, action) => {
    try { await api.post(`/resource-requests/${id}/${action}`); load(); }
    catch (err) { alert(err.response?.data?.message || "Erreur"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cette demande ?")) return;
    try { await api.delete(`/resource-requests/${id}`); load(); }
    catch (err) { alert(err.response?.data?.message || "Erreur"); }
  };

  // Ouvrir le modal
  const openCreate = () => { setEditRequestId(null); setShowCreateModal(true); };
  const openEdit = (id) => { setEditRequestId(id); setShowCreateModal(true); };
  const closeModal = () => { setShowCreateModal(false); setEditRequestId(null); };

  // Filtrage
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
      <div className="rounded-xl border border-dashed border-white/[0.08] py-16 text-center">
        <p className="text-sm text-slate-400">Créez d'abord votre entreprise.</p>
        <Link to="/company" className="mt-3 inline-block text-xs text-emerald-400 hover:text-emerald-300">
          Mon entreprise →
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* ===== FILTRES + ACTION ===== */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>
            Tout <span className="ml-1.5 text-slate-500">{counts.all}</span>
          </FilterPill>
          <FilterPill active={filter === "published"} onClick={() => setFilter("published")}>
            Publiées <span className="ml-1.5 text-slate-500">{counts.published}</span>
          </FilterPill>
          <FilterPill active={filter === "urgent"} onClick={() => setFilter("urgent")}>
            Urgentes <span className="ml-1.5 text-slate-500">{counts.urgent}</span>
          </FilterPill>
          <FilterPill active={filter === "expired"} onClick={() => setFilter("expired")}>
            Expirées <span className="ml-1.5 text-slate-500">{counts.expired}</span>
          </FilterPill>
        </div>

        {/* ✅ Bouton ouvre le modal au lieu de naviguer */}
        <button
          onClick={openCreate}
          className="text-xs font-medium text-slate-400 transition hover:text-emerald-400"
        >
          + Nouvelle demande
        </button>
      </div>

      {/* ===== LISTE ===== */}
      {loading ? (
        <Skeleton />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] py-20">
          <p className="text-sm text-slate-400">Aucune demande dans ce filtre</p>
          <button
            onClick={openCreate}
            className="mt-4 text-xs font-medium text-emerald-400 transition hover:text-emerald-300"
          >
            + Créer une demande →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <RequestCard
              key={r.id}
              request={r}
              onAction={doAction}
              onDelete={handleDelete}
              onEdit={openEdit}
            />
          ))}
        </div>
      )}

      {/* ✅ MODAL — création OU édition */}
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

// ============ CARTE DEMANDE ============
function RequestCard({ request, onAction, onDelete, onEdit }) {
  const statusCfg = STATUS_CFG[request.display_status] || STATUS_CFG.draft;
  const daysLeft = request.days_until_expiry;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && request.display_status === "published";

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "";

  return (
    <div className="group rounded-lg border border-white/[0.06] bg-white/[0.015] px-5 py-4 transition hover:border-white/[0.12] hover:bg-white/[0.03]">
      {/* Ligne meta */}
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <span className={statusCfg.color}>{statusCfg.label}</span>
        {request.urgency === "urgent" && (
          <>
            <span className="text-slate-600">·</span>
            <span className="text-rose-400">Urgent</span>
          </>
        )}
        {isExpiringSoon && (
          <>
            <span className="text-slate-600">·</span>
            <span className="text-amber-400">Expire dans {daysLeft}j</span>
          </>
        )}
      </div>

      {/* Titre */}
      <Link to={`/resource-requests/${request.id}`} className="block">
        <h3 className="mt-2 text-base font-medium text-white transition group-hover:text-emerald-400">
          {request.title}
        </h3>
      </Link>

      {/* Description */}
      {request.description && (
        <p className="mt-1.5 line-clamp-2 text-sm text-slate-400">{request.description}</p>
      )}

      {/* Meta */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span>{request.views_count || 0} vues</span>
        <span>·</span>
        <span>{request.proposals_count || 0} proposition{(request.proposals_count || 0) > 1 ? "s" : ""}</span>
        {request.positions_count > 1 && (
          <>
            <span>·</span>
            <span>{request.positions_count} postes</span>
          </>
        )}
        {request.city && (
          <>
            <span>·</span>
            <span>{request.city}</span>
          </>
        )}
        {request.start_at && request.end_at && (
          <>
            <span>·</span>
            <span>{fmtDate(request.start_at)} → {fmtDate(request.end_at)}</span>
          </>
        )}
      </div>

      {/* Compétences */}
      {request.skills?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {request.skills.slice(0, 5).map((s) => (
            <span
              key={s.id}
              className="rounded border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[11px] text-slate-300"
            >
              {s.name}
            </span>
          ))}
          {request.skills.length > 5 && (
            <span className="text-[11px] text-slate-500 self-center">+{request.skills.length - 5}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-4 border-t border-white/[0.04] pt-3 text-xs">
        {["published", "paused"].includes(request.display_status) && (
         <Link
  to={`/resource-requests/${request.id}?candidates=1`}
  className="font-medium text-emerald-400 transition hover:text-emerald-300"
>
  Voir les candidats →
</Link>
        )}

        {request.display_status === "draft" && (
          <button
            onClick={() => onAction(request.id, "publish")}
            className="text-slate-400 transition hover:text-white"
          >
            Publier
          </button>
        )}

        {request.display_status === "published" && (
          <button
            onClick={() => onAction(request.id, "pause")}
            className="text-slate-500 transition hover:text-white"
          >
            Mettre en pause
          </button>
        )}

        {request.display_status === "paused" && (
          <button
            onClick={() => onAction(request.id, "publish")}
            className="text-slate-400 transition hover:text-white"
          >
            Reprendre
          </button>
        )}

        <button
          onClick={() => onEdit(request.id)}
          className="text-slate-500 transition hover:text-white"
        >
          Modifier
        </button>

        <button
          onClick={() => onDelete(request.id)}
          className="text-slate-500 transition hover:text-rose-400"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}

// ============ SKELETON ============
function Skeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-lg border border-white/[0.04] bg-white/[0.015]"
        />
      ))}
    </div>
  );
}