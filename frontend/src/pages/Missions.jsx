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
  pending_employee: { label: "En attente du salarié", badge: "bg-amber-50 text-amber-700 border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400", icon: AlertCircle },
  planned:          { label: "Acceptée",              badge: "bg-blue-50 text-blue-700 border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-400",       icon: CheckCircle },
  active:           { label: "En cours",              badge: "bg-mint/10 text-mint border-mint/25",     icon: PlayCircle },
  completed:        { label: "Terminée",              badge: "bg-slate-100 text-slate-600 border-slate-300 dark:bg-white/5 dark:text-slate-400",     icon: CheckCircle },
  cancelled:        { label: "Annulée",               badge: "bg-rose-50 text-rose-700 border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400",   icon: XCircle },
};

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
      showToast("Mission acceptée !", "success");
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
      showToast(status === "active" ? "Mission démarrée" : "Mission terminée", "success");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur serveur", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredMissions = activeTab === "all"
    ? missions
    : missions.filter((m) => (TABS.find((t) => t.id === activeTab)?.statuses || []).includes(m.status));

  const countByTab = (tabId) => {
    if (tabId === "all") return missions.length;
    const tab = TABS.find((t) => t.id === tabId);
    return missions.filter((m) => (tab?.statuses || []).includes(m.status)).length;
  };

  if (loading && missions.length === 0) {
    return <AppShell><p className="text-[var(--text-muted)]">Chargement...</p></AppShell>;
  }

  return (
    <AppShell>
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-app)]">Missions</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Gérez les missions de mise à disposition en cours et passées.
        </p>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-[var(--border-app)] pb-1">
        {TABS.map((tab) => {
          const count = countByTab(tab.id);
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-t-xl2 px-4 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "border-b-2 border-mint text-[var(--text-app)]"
                  : "border-b-2 border-transparent text-[var(--text-muted)] hover:text-[var(--text-app)]"
              }`}
            >
              {tab.label}
              <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                isActive ? "bg-mint text-navy-900" : "bg-[var(--bg-surface-hover)] text-[var(--text-muted)]"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mt-6 rounded-xl2 border border-rose-500/25 bg-rose-50 dark:bg-rose-500/10 p-5 text-sm text-rose-700 dark:text-rose-400">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {!error && filteredMissions.length === 0 && (
          <div className="rounded-xl2 border border-dashed border-[var(--border-app)] bg-[var(--bg-surface-2)] p-10 text-center">
            <Briefcase size={40} strokeWidth={1.5} className="mx-auto mb-3 text-[var(--text-faint)]" />
            <p className="font-semibold text-[var(--text-muted)]">
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
            <div key={mission.id} className="rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface)] p-5 shadow-card">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold flex items-center gap-1 ${cfg.badge}`}>
                      <Icon size={12} strokeWidth={1.5} /> {cfg.label}
                    </span>
                    <span className="rounded-md bg-[var(--bg-surface-hover)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-muted)]">
                      Mission #{mission.id}
                    </span>
                    {isEmployee && (
                      <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
                        Vous êtes le salarié
                      </span>
                    )}
                    {isSupplier && !isEmployee && (
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                        Prêteur
                      </span>
                    )}
                    {isRequester && (
                      <span className="rounded-md bg-mint/10 px-2 py-0.5 text-[11px] font-semibold text-mint">
                        Emprunteur
                      </span>
                    )}
                  </div>

                  {mission.profile?.user && (
                    <p className="mt-2 text-sm font-semibold flex items-center gap-1 text-[var(--text-app)]">
                      <User size={14} strokeWidth={1.5} /> {mission.profile.user.name}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} strokeWidth={1.5} />
                      {new Date(mission.start_at).toLocaleDateString("fr-FR")} → {new Date(mission.end_at).toLocaleDateString("fr-FR")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} strokeWidth={1.5} /> {mission.workload_percent}%
                    </span>
                    {mission.supplying_company && (
                      <span className="flex items-center gap-1">
                        <Building2 size={12} strokeWidth={1.5} /> Prêteur : {mission.supplying_company.name}
                      </span>
                    )}
                    {mission.requesting_company && (
                      <span className="flex items-center gap-1">
                        <Building2 size={12} strokeWidth={1.5} /> Emprunteur : {mission.requesting_company.name}
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
            className="rounded-xl2 bg-mint px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-mint-light disabled:opacity-60 flex items-center gap-1 transition"
          >
            <Check size={12} strokeWidth={2} /> Accepter
          </button>
          <button
            onClick={() => declineMission(mission.id)}
            disabled={actionLoading === mission.id}
            className="rounded-xl2 border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 disabled:opacity-60 flex items-center gap-1 transition"
          >
            <X size={12} strokeWidth={2} /> Refuser
          </button>
        </>
      )}

      {isEmployee && mission.status === "planned" && (
        <span className="rounded-xl2 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
          En attente du démarrage par l'entreprise
        </span>
      )}

      {isEmployee && mission.status === "active" && (
        <span className="rounded-xl2 bg-mint/10 border border-mint/25 px-3 py-1.5 text-xs font-semibold text-mint flex items-center gap-1">
          Mission en cours
        </span>
      )}

      {!isEmployee && isSupplier && mission.status === "planned" && (
        <button
          onClick={() => updateStatus(mission.id, "active")}
          disabled={actionLoading === mission.id}
          className="rounded-xl2 bg-mint px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-mint-light disabled:opacity-60 flex items-center gap-1 transition"
        >
          <PlayCircle size={12} strokeWidth={1.5} /> Démarrer la mission
        </button>
      )}

      {!isEmployee && isSupplier && mission.status === "active" && (
        <button
          onClick={() => updateStatus(mission.id, "completed")}
          disabled={actionLoading === mission.id}
          className="rounded-xl2 bg-navy-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-700 disabled:opacity-60 flex items-center gap-1 transition"
        >
          <CheckCircle size={12} strokeWidth={1.5} /> Terminer
        </button>
      )}

      {!isEmployee && isRequester && !isSupplier && mission.status === "planned" && (
        <span className="rounded-xl2 bg-blue-50 dark:bg-blue-500/10 border border-blue-500/25 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1">
          En attente du prêteur
        </span>
      )}

      <Link
        to={`/missions/${mission.id}`}
        className="rounded-xl2 border border-[var(--border-app)] px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:border-mint hover:text-mint transition"
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
