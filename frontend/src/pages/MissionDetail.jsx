import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Building2, Calendar, Clock, User, CheckCircle,
  XCircle, PlayCircle, Flag, Loader2, MessageSquare, Timer,
  AlertCircle, FileText, History,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import DocumentUploader from "../components/documents/DocumentUploader";
import DocumentList from "../components/documents/DocumentList";

const STATUS_CONFIG = {
  pending_employee: { label: "⏳ En attente du salarié",          badge: "bg-amber-100 text-amber-700" },
  planned:          { label: "📅 Acceptée — prête à démarrer",   badge: "bg-blue-100 text-blue-700" },
  active:           { label: "🟢 En cours",                       badge: "bg-emerald-100 text-emerald-700" },
  completed:        { label: "✅ Terminée",                       badge: "bg-slate-100 text-slate-600" },
  cancelled:        { label: "❌ Annulée",                        badge: "bg-rose-100 text-rose-700" },
};

function computeTimeline(mission) {
  if (!mission?.start_at || !mission?.end_at) return null;

  const now = new Date();
  const start = new Date(mission.start_at);
  const end = new Date(mission.end_at);

  const totalMs = end - start;
  const elapsedMs = now - start;
  const remainingMs = end - now;

  const days = (ms) => Math.ceil(ms / (1000 * 60 * 60 * 24));
  const percent = totalMs > 0
    ? Math.max(0, Math.min(100, Math.round((elapsedMs / totalMs) * 100)))
    : 0;

  return {
    totalDays: days(totalMs),
    elapsedDays: Math.max(0, days(elapsedMs)),
    remainingDays: Math.max(0, days(remainingMs)),
    percent,
    notStarted: now < start,
    finished: now > end,
  };
}

export default function MissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [docsRefresh, setDocsRefresh] = useState(0);
  const { toast, show: showToast, close: closeToast } = useToast();

  const load = () => {
    setLoading(true);
    api.get(`/missions/${id}`)
      .then((res) => setMission(res.data))
      .catch(() => showToast("Mission introuvable", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const doAction = async (action) => {
    setActionLoading(true);
    try {
      if (action === "accept")    await api.post(`/missions/${id}/accept`);
      if (action === "decline")   await api.post(`/missions/${id}/decline`);
      if (action === "active")    await api.patch(`/missions/${id}/status`, { status: "active" });
      if (action === "completed") await api.patch(`/missions/${id}/status`, { status: "completed" });

      showToast("✅ Action effectuée", "success");
      setTimeout(() => load(), 800);
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur serveur", "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-navy" size={32} />
        </div>
      </AppShell>
    );
  }

  if (!mission) {
    return (
      <AppShell>
        <p className="text-center text-slate-400 py-10">Mission introuvable</p>
      </AppShell>
    );
  }

  const myProfileId =
    user?.professional_profile?.id ||
    user?.professionalProfile?.id ||
    user?.professional_profile_id;

  const myCompanyIds = (user?.companies || []).map((c) => c.id);

  const isEmployee   = myProfileId && Number(mission.professional_profile_id) === Number(myProfileId);
  const isSupplying  = myCompanyIds.includes(mission.supplying_company_id);
  const isRequesting = myCompanyIds.includes(mission.requesting_company_id);

  const cfg = STATUS_CONFIG[mission.status] || STATUS_CONFIG.planned;
  const timeline = computeTimeline(mission);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <Link to="/missions" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy mb-6">
          <ArrowLeft size={15} /> Toutes mes missions
        </Link>

        {/* ============ HEADER ============ */}
        <div className="rounded-3xl bg-navy p-8 text-white">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-mint">Mission</p>
              <h1 className="mt-2 text-3xl font-bold">
                {mission.resource_offer?.title || "Mission"}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Building2 size={14} /> {mission.supplying_company?.name}
                </span>
                <span>→</span>
                <span className="flex items-center gap-1.5">
                  <Building2 size={14} /> {mission.requesting_company?.name || "?"}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {isEmployee && (
                  <span className="rounded-full bg-purple-500/20 px-2.5 py-1 text-[11px] font-semibold text-purple-200">
                    👤 Vous êtes le salarié
                  </span>
                )}
                {isSupplying && !isEmployee && (
                  <span className="rounded-full bg-blue-500/20 px-2.5 py-1 text-[11px] font-semibold text-blue-200">
                    🏢 Prêteur
                  </span>
                )}
                {isRequesting && (
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                    🏢 Emprunteur
                  </span>
                )}
              </div>
            </div>
            <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${cfg.badge}`}>
              {cfg.label}
            </span>
          </div>
        </div>

        {/* ============ COMPTE À REBOURS + PROGRESSION ============ */}
        {timeline && ["planned", "active"].includes(mission.status) && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Timer size={18} className="text-navy" />
                <h3 className="font-bold">Temps restant</h3>
              </div>
              <div className="text-right">
                {timeline.notStarted ? (
                  <p className="text-sm text-slate-500">
                    Démarre dans{" "}
                    <b className="text-navy">
                      {Math.abs(timeline.remainingDays)} jour{Math.abs(timeline.remainingDays) > 1 ? "s" : ""}
                    </b>
                  </p>
                ) : timeline.finished ? (
                  <p className="text-sm text-rose-600 font-semibold">Mission arrivée à terme</p>
                ) : (
                  <p className="text-sm text-slate-500">
                    <b className="text-emerald-600 text-lg">{timeline.remainingDays}</b>{" "}
                    jour{timeline.remainingDays > 1 ? "s" : ""} restant{timeline.remainingDays > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-mint to-navy transition-all duration-500"
                  style={{ width: `${timeline.percent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>{new Date(mission.start_at).toLocaleDateString("fr-FR")}</span>
                <span className="font-semibold text-navy">{timeline.percent}% écoulé</span>
                <span>{new Date(mission.end_at).toLocaleDateString("fr-FR")}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Durée totale</p>
                <p className="text-lg font-bold text-navy">{timeline.totalDays}j</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Jours écoulés</p>
                <p className="text-lg font-bold text-navy">{timeline.elapsedDays}j</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-xs text-emerald-600">Restants</p>
                <p className="text-lg font-bold text-emerald-700">{timeline.remainingDays}j</p>
              </div>
            </div>
          </div>
        )}

        {/* ============ DÉTAILS ============ */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase text-slate-400 mb-2">Salarié</p>
            <p className="font-semibold">{mission.profile?.user?.name || "?"}</p>
            {mission.profile?.headline && <p className="text-xs text-mint">{mission.profile.headline}</p>}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase text-slate-400 mb-2">Période</p>
            <p className="text-sm">
              <b>{new Date(mission.start_at).toLocaleDateString("fr-FR")}</b>
              {" → "}
              <b>{new Date(mission.end_at).toLocaleDateString("fr-FR")}</b>
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase text-slate-400 mb-2">Charge</p>
            <p className="text-sm">
              <b>{mission.workload_percent}%</b>
              {mission.remote && " · 🏠 Télétravail"}
            </p>
          </div>
        </div>

        {/* ============ 📄 CONTRATS & DOCUMENTS (P0-23) ============ */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-navy" />
              <h3 className="font-bold">Contrats & documents</h3>
            </div>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <History size={12} /> Versionné
            </span>
          </div>

          {/* Upload (uniquement prêteur / salarié) */}
          {(isSupplying || isEmployee) && (
            <div className="mb-4">
              <DocumentUploader
                documentableType="App\Models\Mission"
                documentableId={mission.id}
                allowedTypes={["contract", "agreement", "invoice", "attachment"]}
                onUploaded={() => setDocsRefresh((r) => r + 1)}
              />
            </div>
          )}

          {/* Liste des documents */}
          <DocumentList
            documentableType="App\Models\Mission"
            documentableId={mission.id}
            refreshKey={docsRefresh}
          />
        </div>

        {/* ============ MESSAGE D'ATTENTE (si pending) ============ */}
        {mission.status === "pending_employee" && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800 flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">⏳ En attente de la réponse du salarié</p>
              <p className="text-xs mt-1">
                {mission.profile?.user?.name} doit accepter ou refuser cette mission avant qu'elle ne démarre.
              </p>
            </div>
          </div>
        )}

        {/* ============ ACTIONS ============ */}
        <div className="mt-6 flex flex-wrap gap-3">

          {isEmployee && mission.status === "pending_employee" && (
            <>
              <button
                onClick={() => doAction("accept")}
                disabled={actionLoading}
                className="flex-1 min-w-[220px] rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} /> Accepter la mission
              </button>
              <button
                onClick={() => doAction("decline")}
                disabled={actionLoading}
                className="flex-1 min-w-[220px] rounded-2xl border border-rose-200 bg-white px-6 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <XCircle size={16} /> Refuser
              </button>
            </>
          )}

          {isSupplying && mission.status === "planned" && (
            <button
              onClick={() => doAction("active")}
              disabled={actionLoading}
              className="flex-1 min-w-[220px] rounded-2xl bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <PlayCircle size={16} /> Démarrer la mission
            </button>
          )}

          {isSupplying && mission.status === "active" && (
            <button
              onClick={() => doAction("completed")}
              disabled={actionLoading}
              className="flex-1 min-w-[220px] rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Flag size={16} /> Marquer comme terminée
            </button>
          )}

          {isRequesting && (
            <Link
              to="/messages"
              className="flex-1 min-w-[220px] rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold hover:border-navy flex items-center justify-center gap-2"
            >
              <MessageSquare size={16} /> Contacter le prêteur
            </Link>
          )}

          {mission.resource_offer_id && (
            <Link
              to={`/resource-offers/${mission.resource_offer_id}`}
              className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold hover:border-navy"
            >
              Voir l'offre liée
            </Link>
          )}
        </div>

        {!isEmployee && !isSupplying && !isRequesting && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            ℹ️ Vous n'avez pas de rôle actif sur cette mission.
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </AppShell>
  );
}