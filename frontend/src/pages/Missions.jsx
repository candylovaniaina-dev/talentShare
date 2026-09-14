import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase, Calendar, Clock, Building2, User, CheckCircle,
  PlayCircle, XCircle, AlertCircle, Check, X,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const STATUS_CONFIG = {
  pending_employee: { label: "En attente du salarié", badge: "bg-amber-100 text-amber-700",     icon: AlertCircle },
  planned:          { label: "Acceptée",              badge: "bg-blue-100 text-blue-700",       icon: CheckCircle },
  active:           { label: "En cours",              badge: "bg-emerald-100 text-emerald-700", icon: PlayCircle },
  completed:        { label: "Terminée",              badge: "bg-slate-100 text-slate-600",     icon: CheckCircle },
  cancelled:        { label: "Annulée",               badge: "bg-rose-100 text-rose-700",       icon: XCircle },
};

// ✅ Onglets de filtre
const TABS = [
  { id: "all",       label: "Toutes" },
  { id: "pending",   label: "En attente",  statuses: ["pending_employee"] },
  { id: "planned",   label: "Acceptées",   statuses: ["planned"] },
  { id: "active",    label: "En cours",    statuses: ["active"] },
  { id: "completed", label: "Terminées",   statuses: ["completed"] },
  { id: "cancelled", label: "Annulées",    statuses: ["cancelled"] },
];

export default function Missions() {
  const { user } = useAuth();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const { toast, show: showToast, close: closeToast } = useToast();

  const load = () => {
    setLoading(true);
    api.get("/missions")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setMissions(data);
      })
      .catch((err) => {
        console.error("Erreur missions:", err.response?.data || err.message);
        setError("Impossible de charger les missions");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const acceptMission = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`/missions/${id}/accept`);
      showToast("✅ Mission acceptée !", "success");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur serveur", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const declineMission = async (id) => {
    if (!confirm("Refuser cette mission ?")) return;
    setActionLoading(id);
    try {
      await api.post(`/missions/${id}/decline`);
      showToast("Mission refusée.", "info");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur serveur", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const updateStatus = async (id, status) => {
    setActionLoading(id);
    try {
      await api.patch(`/missions/${id}/status`, { status });
      showToast(status === "active" ? "▶️ Mission démarrée" : "✅ Mission terminée", "success");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur serveur", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ Filtrer les missions selon l'onglet actif
  const filteredMissions = activeTab === "all"
    ? missions
    : missions.filter((m) => (TABS.find((t) => t.id === activeTab)?.statuses || []).includes(m.status));

  // ✅ Compter les missions par onglet
  const countByTab = (tabId) => {
    if (tabId === "all") return missions.length;
    const tab = TABS.find((t) => t.id === tabId);
    return missions.filter((m) => (tab?.statuses || []).includes(m.status)).length;
  };

  if (loading && missions.length === 0) {
    return <AppShell><p className="text-slate-400">Chargement...</p></AppShell>;
  }

  return (
    <AppShell>
      <div>
        <h1 className="text-2xl font-bold">Missions</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gérez les missions de mise à disposition en cours et passées.
        </p>
      </div>

      {/* ✅ Onglets de filtre */}
      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-slate-200 pb-1">
        {TABS.map((tab) => {
          const count = countByTab(tab.id);
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-t-xl px-4 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "border-b-2 border-navy text-navy"
                  : "border-b-2 border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                isActive ? "bg-navy text-white" : "bg-slate-100 text-slate-500"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          ⚠️ {error}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {!error && filteredMissions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <Briefcase size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">
              {activeTab === "all" ? "Aucune mission pour l'instant" : `Aucune mission dans "${TABS.find(t => t.id === activeTab)?.label}"`}
            </p>
          </div>
        )}

        {filteredMissions.map((mission) => {
          const cfg = STATUS_CONFIG[mission.status] || STATUS_CONFIG.planned;
          const Icon = cfg.icon;

          const myProfileId = user?.professional_profile?.id || user?.professionalProfile?.id;
          const isEmployee = myProfileId && mission.professional_profile_id === myProfileId;
          const isSupplier = user?.companies?.some?.((c) => c.id === mission.supplying_company_id);
          const isRequester = user?.companies?.some?.((c) => c.id === mission.requesting_company_id);

          return (
            <div key={mission.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold flex items-center gap-1 ${cfg.badge}`}>
                      <Icon size={12} /> {cfg.label}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      Mission #{mission.id}
                    </span>
                    {isEmployee && (
                      <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                        👤 Vous êtes le salarié
                      </span>
                    )}
                    {isSupplier && !isEmployee && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                        Prêteur
                      </span>
                    )}
                    {isRequester && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        Emprunteur
                      </span>
                    )}
                  </div>

                  {mission.profile?.user && (
                    <p className="mt-2 text-sm font-semibold flex items-center gap-1">
                      <User size={14} /> {mission.profile.user.name}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(mission.start_at).toLocaleDateString("fr-FR")} → {new Date(mission.end_at).toLocaleDateString("fr-FR")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {mission.workload_percent}%
                    </span>
                    {mission.supplying_company && (
                      <span className="flex items-center gap-1">
                        <Building2 size={12} /> Prêteur : {mission.supplying_company.name}
                      </span>
                    )}
                    {mission.requesting_company && (
                      <span className="flex items-center gap-1">
                        <Building2 size={12} /> Emprunteur : {mission.requesting_company.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0 flex-wrap">
                  {isEmployee && mission.status === "pending_employee" && (
                    <>
                      <button
                        onClick={() => acceptMission(mission.id)}
                        disabled={actionLoading === mission.id}
                        className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 flex items-center gap-1"
                      >
                        <Check size={12} /> Accepter
                      </button>
                      <button
                        onClick={() => declineMission(mission.id)}
                        disabled={actionLoading === mission.id}
                        className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60 flex items-center gap-1"
                      >
                        <X size={12} /> Refuser
                      </button>
                    </>
                  )}

                  {!isEmployee && mission.status === "planned" && (isSupplier || isRequester) && (
                    <button
                      onClick={() => updateStatus(mission.id, "active")}
                      disabled={actionLoading === mission.id}
                      className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 flex items-center gap-1"
                    >
                      <PlayCircle size={12} /> Démarrer
                    </button>
                  )}
                  {!isEmployee && mission.status === "active" && (isSupplier || isRequester) && (
                    <button
                      onClick={() => updateStatus(mission.id, "completed")}
                      disabled={actionLoading === mission.id}
                      className="rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-light disabled:opacity-60 flex items-center gap-1"
                    >
                      <CheckCircle size={12} /> Terminer
                    </button>
                  )}

                  <Link
                    to={`/missions/${mission.id}`}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:border-navy"
                  >
                    Détails
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </AppShell>
  );
}