import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Edit, Trash2, Eye, MapPin, Calendar, Clock,
  Handshake, Briefcase,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

// ✅ Badges Tailwind STATIQUES (détectables en prod)
const STATUS_LABELS = {
  draft:           { label: "Brouillon",             badge: "bg-slate-100 text-slate-600" },
  published:       { label: "Publiée",               badge: "bg-emerald-100 text-emerald-700" },
  closed:          { label: "Clôturée",              badge: "bg-rose-100 text-rose-700" },
  expired:         { label: "Expirée",               badge: "bg-slate-100 text-slate-600" },
  mission_pending: { label: "⏳ Mission en attente", badge: "bg-amber-100 text-amber-700" },
  mission_planned: { label: "📅 Mission acceptée",   badge: "bg-blue-100 text-blue-700" },
  mission_active:  { label: "🟢 Mission en cours",   badge: "bg-emerald-100 text-emerald-700" },
};

const MISSION_TYPES = {
  full_time: "Temps plein",
  part_time: "Temps partiel",
  freelance: "Freelance",
  mission:   "Mission",
  loan:      "Mise à disposition",
};

const asArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export default function ResourceOffers() {
  const { user } = useAuth();
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
      .catch((err) => {
        console.error("Erreur chargement offres:", err);
        setOffers([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (company) load(); }, [company]);

  const deleteOffer = async (id) => {
    if (!confirm("Supprimer cette offre ?")) return;
    try {
      await api.delete(`/resource-offers/${id}`);
      load();
    } catch { alert("Erreur"); }
  };

  const toggleStatus = async (offer) => {
    const newStatus = offer.status === "published" ? "closed" : "published";
    try {
      await api.patch(`/resource-offers/${offer.id}`, { status: newStatus });
      load();
    } catch { alert("Erreur"); }
  };

  if (loading) {
    return <AppShell><p className="text-slate-400">Chargement...</p></AppShell>;
  }

  if (!company) {
    return (
      <AppShell>
        <p className="text-slate-500">Créez d'abord votre entreprise dans "Mon entreprise".</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mes offres de ressources</h1>
          <p className="mt-1 text-sm text-slate-500">
            Proposez vos salariés disponibles à d'autres entreprises.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/resource-offers/browse"
            className="flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold hover:border-navy"
          >
            <Eye size={16} /> Parcourir les offres
          </Link>
          <Link
            to="/resource-offers/new"
            className="flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-light"
          >
            <Plus size={16} /> Prêter un salarié
          </Link>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {offers.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <p className="font-semibold text-slate-600">Aucune offre pour l'instant</p>
            <p className="mt-1 text-sm text-slate-400">
              Prêtez un de vos salariés à une autre entreprise qui a besoin de ses compétences.
            </p>
            <Link
              to="/resource-offers/new"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white"
            >
              <Plus size={16} /> Créer ma première offre
            </Link>
          </div>
        )}

        {offers.map((offer) => {
          const displayKey = offer.display_status || offer.status;
          const statusCfg = STATUS_LABELS[displayKey] || STATUS_LABELS.draft;
          const activeMission = offer.active_mission || null;
          const hasActiveMission = ["mission_pending", "mission_planned", "mission_active"].includes(displayKey);

          return (
            <div key={offer.id} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md">
              <div className="flex items-start justify-between flex-wrap gap-3">

                {/* ✅ BLOC CLIQUABLE */}
                <Link to={`/resource-offers/${offer.id}`} className="flex-1 group min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold group-hover:text-navy group-hover:underline transition">
                      {offer.title}
                    </h3>

                    {/* ✅ BADGE STATUT */}
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusCfg.badge}`}>
                      {statusCfg.label}
                    </span>

                    {/* ✅ NOUVEAU : LIEN MISSION juste à côté du badge */}
                    {activeMission && (
                      <Link
                        to={`/missions/${activeMission.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-full bg-navy px-2.5 py-0.5 text-[11px] font-semibold text-white hover:bg-navy-light inline-flex items-center gap-1"
                      >
                        <Briefcase size={11} /> Voir la mission →
                      </Link>
                    )}

                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      {MISSION_TYPES[offer.mission_type] || offer.mission_type}
                    </span>
                  </div>

                  {offer.profile?.user && (
                    <p className="mt-1 text-sm text-slate-500">
                      👤 {offer.profile.user.name} {offer.profile.headline && `· ${offer.profile.headline}`}
                    </p>
                  )}

                  {offer.description && (
                    <p className="mt-1 text-sm text-slate-500 line-clamp-2">{offer.description}</p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(offer.start_at).toLocaleDateString("fr-FR")} → {new Date(offer.end_at).toLocaleDateString("fr-FR")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {offer.workload_value}
                      {offer.workload_unit === "percentage" ? "%" :
                       offer.workload_unit === "hours_per_week" ? "h/sem" : "j/sem"}
                    </span>
                    {offer.location_city && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {offer.location_city}
                      </span>
                    )}
                    {offer.daily_rate && (
                      <span className="text-navy font-semibold">💰 {offer.daily_rate}€/jour</span>
                    )}
                  </div>

                  {offer.skills?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {offer.skills.map((s) => (
                        <span key={s.id} className="rounded-full bg-mint/15 px-2.5 py-1 text-xs font-medium text-navy">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* ✅ Message dynamique */}
                  <p className="mt-2 text-xs font-semibold text-navy group-hover:underline flex items-center gap-1">
                    <Handshake size={12} />
                    {displayKey === "published"       && "Voir le détail & créer une mission"}
                    {displayKey === "mission_pending" && "⏳ Mission en attente de l'accord du salarié"}
                    {displayKey === "mission_planned" && "📅 Mission acceptée — prête à démarrer"}
                    {displayKey === "mission_active"  && "🟢 Mission en cours — voir le détail"}
                    {displayKey === "closed"          && "🔒 Offre clôturée"}
                    {displayKey === "draft"           && "📝 Brouillon — non publiée"}
                  </p>
                </Link>

                {/* ✅ BOUTONS À DROITE */}
                <div className="flex gap-2 shrink-0 flex-wrap">
                  {!hasActiveMission && (
                    <button
                      onClick={() => toggleStatus(offer)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        offer.status === "published"
                          ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                          : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      {offer.status === "published" ? "Clôturer" : "Publier"}
                    </button>
                  )}

                  <Link
                    to={`/resource-offers/${offer.id}/edit`}
                    className="rounded-full border border-slate-200 p-2 hover:border-navy"
                    title="Modifier"
                  >
                    <Edit size={14} />
                  </Link>
                  <button
                    onClick={() => deleteOffer(offer.id)}
                    className="rounded-full border border-slate-200 p-2 hover:border-rose-400 hover:text-rose-500"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}