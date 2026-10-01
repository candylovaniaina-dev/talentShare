import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Edit, Trash2, Eye, MapPin, Calendar, Clock,
  Handshake, Briefcase, Loader2,
} from "lucide-react";
import api from "../../services/api";

const STATUS_LABELS = {
  draft:           { label: "Brouillon",              badge: "bg-slate-100 text-slate-600" },
  published:       { label: "Publiée",                badge: "bg-emerald-100 text-emerald-700" },
  closed:          { label: "Clôturée",               badge: "bg-rose-100 text-rose-700" },
  expired:         { label: "Expirée",                badge: "bg-slate-100 text-slate-600" },
  mission_pending: { label: "Mission en attente",     badge: "bg-amber-100 text-amber-700" },
  mission_planned: { label: "Mission acceptée",       badge: "bg-blue-100 text-blue-700" },
  mission_active:  { label: "Mission en cours",       badge: "bg-emerald-100 text-emerald-700" },
};

const MISSION_TYPES = {
  full_time: "Temps plein", part_time: "Temps partiel",
  freelance: "Freelance", mission: "Mission", loan: "Mise à disposition",
};

const asArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export default function ResourceOffersTab() {
  const [company, setCompany] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/companies/me")
      .then((res) => setCompany(res.data))
      .catch(() => setCompany(null))
      .finally(() => setLoading(false));
  }, []);

  const load = () => {
    setLoading(true);
    api.get("/resource-offers/my")
      .then((res) => setOffers(asArray(res.data)))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (company) load(); }, [company]);

  const deleteOffer = async (id) => {
    if (!confirm("Supprimer cette offre ?")) return;
    try { await api.delete(`/resource-offers/${id}`); load(); }
    catch { alert("Erreur"); }
  };

  const toggleStatus = async (offer) => {
    const newStatus = offer.status === "published" ? "closed" : "published";
    try {
      await api.patch(`/resource-offers/${offer.id}`, { status: newStatus });
      load();
    } catch { alert("Erreur"); }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-emerald-400" size={32} />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-14 text-center">
        <p className="text-sm text-slate-400">Créez d'abord votre entreprise.</p>
        <Link to="/company"
          className="mt-4 inline-block rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-[#0A1229]">
          Mon entreprise
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Section header + actions */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Offres de ressources
          </h2>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-400">
            {offers.length}
          </span>
        </div>

        <div className="flex gap-2">
          <Link
            to="/resource-offers/browse"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-white/20 hover:text-white"
          >
            <Eye size={13} /> Parcourir
          </Link>
          <Link
            to="/resource-offers/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-[#0A1229] transition hover:bg-emerald-400"
          >
            <Plus size={13} /> Prêter un salarié
          </Link>
        </div>
      </div>

      {/* Liste */}
      {offers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-14 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-slate-500">
            <Handshake size={26} />
          </span>
          <p className="mt-4 font-semibold text-white">Aucune offre pour l'instant</p>
          <p className="mt-1 text-sm text-slate-500">
            Prêtez un de vos salariés à une autre entreprise.
          </p>
          <Link
            to="/resource-offers/new"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400"
          >
            <Plus size={14} /> Créer ma première offre
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => {
            const displayKey = offer.display_status || offer.status;
            const statusCfg = STATUS_LABELS[displayKey] || STATUS_LABELS.draft;
            const activeMission = offer.active_mission || null;
            const hasActiveMission = ["mission_pending", "mission_planned", "mission_active"].includes(displayKey);

            return (
              <div key={offer.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition hover:border-emerald-500/40 hover:bg-white/[0.06]">
                <div className="flex items-start justify-between flex-wrap gap-3">

                  <Link to={`/resource-offers/${offer.id}`} className="flex-1 group min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white group-hover:text-emerald-300 transition">
                        {offer.title}
                      </h3>

                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusCfg.badge}`}>
                        {statusCfg.label}
                      </span>

                      {activeMission && (
                        <Link
                          to={`/missions/${activeMission.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-[#0A1229] hover:bg-emerald-400 inline-flex items-center gap-1"
                        >
                          <Briefcase size={10} /> Voir la mission
                        </Link>
                      )}

                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                        {MISSION_TYPES[offer.mission_type] || offer.mission_type}
                      </span>
                    </div>

                    {offer.profile?.user && (
                      <p className="mt-1.5 text-sm text-slate-400">
                        {offer.profile.user.name}
                        {offer.profile.headline && <span className="text-slate-500"> · {offer.profile.headline}</span>}
                      </p>
                    )}

                    {offer.description && (
                      <p className="mt-1 text-sm text-slate-500 line-clamp-2">{offer.description}</p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(offer.start_at).toLocaleDateString("fr-FR")} → {new Date(offer.end_at).toLocaleDateString("fr-FR")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {offer.workload_value}
                        {offer.workload_unit === "percentage" ? "%" :
                         offer.workload_unit === "hours_per_week" ? "h/sem" : "j/sem"}
                      </span>
                      {offer.location_city && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} /> {offer.location_city}
                        </span>
                      )}
                      {offer.daily_rate && (
                        <span className="text-emerald-400 font-semibold">{offer.daily_rate}€/jour</span>
                      )}
                    </div>

                    {offer.skills?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {offer.skills.map((s) => (
                          <span key={s.id} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0 flex-wrap">
                    {!hasActiveMission && (
                      <button
                        onClick={() => toggleStatus(offer)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          offer.status === "published"
                            ? "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                            : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        }`}
                      >
                        {offer.status === "published" ? "Clôturer" : "Publier"}
                      </button>
                    )}
                    <Link
                      to={`/resource-offers/${offer.id}/edit`}
                      className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:border-white/20 hover:text-white"
                      title="Modifier"
                    >
                      <Edit size={13} />
                    </Link>
                    <button
                      onClick={() => deleteOffer(offer.id)}
                      className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:border-rose-500/40 hover:text-rose-400"
                      title="Supprimer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}