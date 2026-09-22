import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Users, Briefcase, MoreVertical, Eye, Copy, Pause, Play,
  XCircle, CheckCircle, MapPin, Calendar, DollarSign, Edit, Trash2,
  Zap, AlertCircle,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const STATUS_CFG = {
  draft:     { label: "Brouillon", badge: "bg-slate-100 text-slate-600",     dot: "bg-slate-400" },
  published: { label: "Publiée",   badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  paused:    { label: "En pause",  badge: "bg-amber-100 text-amber-700",     dot: "bg-amber-500" },
  closed:    { label: "Fermée",    badge: "bg-rose-100 text-rose-700",       dot: "bg-rose-500" },
  filled:    { label: "Pourvue",   badge: "bg-blue-100 text-blue-700",       dot: "bg-blue-500" },
  expired:   { label: "Expirée",   badge: "bg-slate-100 text-slate-500",     dot: "bg-slate-400" },
};

const asArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export default function ResourceRequests() {
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingMissions, setPendingMissions] = useState(0);
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => {
    api.get("/companies").then((res) => {
      const all = asArray(res.data);
      setCompany(all.find((c) => c.owner_user_id === user.id));
    });
    api.get("/dashboard")
      .then((res) => setPendingMissions(res.data.pending_missions || 0))
      .catch(() => setPendingMissions(0));
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
    try {
      await api.post(`/resource-requests/${id}/${action}`);
      load();
      setOpenMenu(null);
    } catch (err) {
      alert(err.response?.data?.message || "Erreur");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cette demande ?")) return;
    try {
      await api.delete(`/resource-requests/${id}`);
      load();
      setOpenMenu(null);
    } catch (err) {
      alert(err.response?.data?.message || "Erreur");
    }
  };

  if (!company) {
    return <AppShell><p className="text-slate-500">Créez d'abord votre entreprise dans "Mon entreprise".</p></AppShell>;
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mes demandes de ressources</h1>
          <p className="mt-1 text-sm text-slate-500">
            Publiez un besoin et laissez TalentShare identifier les meilleurs profils.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/missions"
            className="relative flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold hover:border-navy"
          >
            <Briefcase size={16} /> Mes missions
            {pendingMissions > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                {pendingMissions > 9 ? "9+" : pendingMissions}
              </span>
            )}
          </Link>
          <Link
            to="/resource-requests/new"
            className="flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-light"
          >
            <Plus size={16} /> Nouvelle demande
          </Link>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {loading && <p className="text-slate-400">Chargement...</p>}

        {!loading && requests.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <p className="font-semibold text-slate-600">Aucune demande pour l'instant.</p>
            <p className="mt-1 text-sm text-slate-400">
              Créez votre première demande pour trouver les talents qu'il vous faut.
            </p>
            <Link
              to="/resource-requests/new"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white"
            >
              <Plus size={16} /> Créer une demande
            </Link>
          </div>
        )}

        {requests.map((r) => {
          const statusCfg = STATUS_CFG[r.display_status] || STATUS_CFG.draft;
          const daysLeft = r.days_until_expiry;
          const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && r.display_status === "published";

          return (
            <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <Link to={`/resource-requests/${r.id}`} className="flex-1 group min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold group-hover:text-navy group-hover:underline transition">
                      {r.title}
                    </h3>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold flex items-center gap-1 ${statusCfg.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </span>
                    {r.urgency === "urgent" && (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700 flex items-center gap-1">
                        <Zap size={10} /> Urgent
                      </span>
                    )}
                    {isExpiringSoon && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                        ⚠️ Expire dans {daysLeft}j
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-slate-500 line-clamp-2">{r.description}</p>

                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Eye size={12} /> {r.views_count} vues
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {r.proposals_count || 0} proposition{(r.proposals_count || 0) > 1 ? "s" : ""}
                    </span>
                    {r.positions_count > 1 && (
                      <span className="flex items-center gap-1">
                        <Briefcase size={12} /> {r.positions_count} postes
                      </span>
                    )}
                    {r.budget_min && r.budget_max && (
                      <span className="flex items-center gap-1 text-navy font-semibold">
                        <DollarSign size={12} /> {r.budget_min}–{r.budget_max}€/j
                      </span>
                    )}
                    {r.city && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {r.city}{r.country ? `, ${r.country}` : ""}
                      </span>
                    )}
                    {r.start_at && r.end_at && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(r.start_at).toLocaleDateString("fr-FR")} → {new Date(r.end_at).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                  </div>

                  {r.skills?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {r.skills.slice(0, 5).map((s) => (
                        <span key={s.id} className="rounded-full bg-mint/15 px-2.5 py-1 text-xs font-medium text-navy">
                          {s.name}
                        </span>
                      ))}
                      {r.skills.length > 5 && (
                        <span className="text-xs text-slate-400 self-center">+{r.skills.length - 5}</span>
                      )}
                    </div>
                  )}
                </Link>

                {/* Menu 3 points */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setOpenMenu(openMenu === r.id ? null : r.id)}
                    className="rounded-full border border-slate-200 p-2 hover:border-navy"
                  >
                    <MoreVertical size={14} />
                  </button>

                  {openMenu === r.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                      <div className="absolute right-0 top-10 z-20 w-56 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                        {/* Brouillon → Publier */}
                        {r.display_status === "draft" && (
                          <button onClick={() => doAction(r.id, "publish")}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 text-emerald-600">
                            <Play size={14} /> Publier
                          </button>
                        )}

                        {/* Publiée → Pause / Pourvue */}
                        {r.display_status === "published" && (
                          <>
                            <button onClick={() => doAction(r.id, "pause")}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 text-amber-600">
                              <Pause size={14} /> Mettre en pause
                            </button>
                            <button onClick={() => doAction(r.id, "mark-filled")}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 text-blue-600">
                              <CheckCircle size={14} /> Marquer comme pourvue
                            </button>
                          </>
                        )}

                        {/* En pause → Reprendre */}
                        {r.display_status === "paused" && (
                          <button onClick={() => doAction(r.id, "publish")}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 text-emerald-600">
                            <Play size={14} /> Reprendre
                          </button>
                        )}

                        {/* Publiée/En pause → Fermer */}
                        {["published", "paused"].includes(r.display_status) && (
                          <button onClick={() => doAction(r.id, "close")}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 text-rose-600">
                            <XCircle size={14} /> Fermer
                          </button>
                        )}

                        {/* Dupliquer */}
                        <button onClick={() => doAction(r.id, "duplicate")}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-600 border-t border-slate-100">
                          <Copy size={14} /> Dupliquer
                        </button>

                        {/* Supprimer */}
                        <button onClick={() => handleDelete(r.id)}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 text-rose-600 border-t border-slate-100">
                          <Trash2 size={14} /> Supprimer
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Bouton "Voir les candidats" */}
              {["published", "paused"].includes(r.display_status) && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <Link
                    to={`/resource-requests/${r.id}/candidates`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:underline"
                  >
                    <Users size={14} /> Voir les candidat{(r.proposals_count || 0) > 1 ? "s" : ""} potentiel{(r.proposals_count || 0) > 1 ? "s" : ""}
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}