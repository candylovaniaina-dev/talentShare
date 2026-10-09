import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, Building2, Calendar, Clock, User, CheckCircle,
  XCircle, PlayCircle, Flag, Loader2, MessageSquare, Timer,
  AlertCircle, FileText, X, Sparkles, Target,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import DocumentUploader from "../components/documents/DocumentUploader";
import DocumentList from "../components/documents/DocumentList";

/* ============================================================
   CONFIG
============================================================ */
const STATUS_CONFIG = {
  pending_employee: { label: "En attente du salarié",  tone: "amber"   },
  planned:          { label: "Acceptée",               tone: "blue"    },
  active:           { label: "En cours",               tone: "emerald" },
  completed:        { label: "Terminée",               tone: "slate"   },
  cancelled:        { label: "Annulée",                tone: "rose"    },
};

const TONE_STYLES = {
  emerald: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  amber:   "border-amber-500/40 bg-amber-500/10 text-amber-400",
  rose:    "border-rose-500/40 bg-rose-500/10 text-rose-400",
  blue:    "border-blue-500/40 bg-blue-500/10 text-blue-400",
  slate:   "border-[var(--border-app)] bg-[var(--bg-surface-hover)] text-[var(--text-muted)]",
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

/* ============================================================
   PAGE
============================================================ */
export default function MissionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [docsRefresh, setDocsRefresh] = useState(0);

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

      showToast("Action effectuée", "success");
      setTimeout(() => load(), 500);
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
          <Loader2 className="animate-spin text-emerald-400" size={32} />
        </div>
      </AppShell>
    );
  }

  if (!mission) {
    return (
      <AppShell>
        <p className="text-center text-[var(--text-muted)] py-10">Mission introuvable</p>
      </AppShell>
    );
  }

  /* ---------- Rôles ---------- */
  const myProfileId =
    user?.professional_profile?.id ||
    user?.professionalProfile?.id ||
    user?.professional_profile_id;

  const myCompanyIds = (user?.companies || []).map((c) => c.id);

  const isEmployee   = myProfileId && Number(mission.professional_profile_id) === Number(myProfileId);
  const isSupplying  = myCompanyIds.includes(mission.supplying_company_id);
  const isRequesting = myCompanyIds.includes(mission.requesting_company_id);
  const isCompany    = isSupplying || isRequesting;

  const cfg = STATUS_CONFIG[mission.status] || STATUS_CONFIG.planned;
  const timeline = computeTimeline(mission);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">

        {/* Retour */}
        <Link
          to="/missions"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-emerald-400 transition"
        >
          <ArrowLeft size={15} /> Toutes mes missions
        </Link>

        {/* ============================================
            BLOC UNIQUE (header + infos + actions)
        ============================================ */}
        <div className="rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] overflow-hidden">

          {/* HEADER */}
          <div className="border-b border-[var(--border-app)] p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                  <FileText size={20} />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-400">
                    Mission #{mission.id}
                  </p>
                  <h1 className="mt-1 text-2xl font-bold text-[var(--text-app)]">
                    {mission.resource_offer?.title || "Mission"}
                  </h1>

                  {/* Badges rôle */}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {isEmployee && (
                      <span className="rounded-md border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400">
                        👤 Vous êtes le salarié
                      </span>
                    )}
                    {isSupplying && !isEmployee && (
                      <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                        🏢 Prêteur
                      </span>
                    )}
                    {isRequesting && !isSupplying && (
                      <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        🏢 Emprunteur
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <span className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${TONE_STYLES[cfg.tone]}`}>
                {cfg.label}
              </span>
            </div>
          </div>

          {/* INFOS CLÉS (grille 4 colonnes compacte) */}
          <div className="grid grid-cols-2 gap-px bg-[var(--border-app)] sm:grid-cols-4">
            <InfoBlock icon={User} label="Salarié" value={mission.profile?.user?.name || "—"} />
            <InfoBlock icon={Building2} label="Prêteur" value={mission.supplying_company?.name || "—"} />
            <InfoBlock icon={Building2} label="Emprunteur" value={mission.requesting_company?.name || "—"} />
            <InfoBlock icon={Clock} label="Charge" value={`${mission.workload_percent}%${mission.remote ? " · 🏠" : ""}`} />
          </div>

          {/* TIMELINE (si planned/active) */}
          {timeline && ["planned", "active"].includes(mission.status) && (
            <div className="border-t border-[var(--border-app)] p-6">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Timer size={16} className="text-emerald-400" />
                  <h3 className="text-sm font-bold text-[var(--text-app)]">Progression</h3>
                </div>
                <div className="text-xs">
                  {timeline.notStarted ? (
                    <span className="text-[var(--text-muted)]">
                      Démarre dans <b className="text-emerald-400">{Math.abs(timeline.remainingDays)}j</b>
                    </span>
                  ) : timeline.finished ? (
                    <span className="text-rose-400 font-semibold">Mission arrivée à terme</span>
                  ) : (
                    <span className="text-[var(--text-muted)]">
                      <b className="text-emerald-400 text-base">{timeline.remainingDays}</b> jours restants
                    </span>
                  )}
                </div>
              </div>

              <div className="h-2 w-full rounded-full bg-[var(--bg-surface-hover)] overflow-hidden">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                  style={{ width: `${timeline.percent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-2">
                <span>{new Date(mission.start_at).toLocaleDateString("fr-FR")}</span>
                <span className="font-semibold text-emerald-400">{timeline.percent}% écoulé</span>
                <span>{new Date(mission.end_at).toLocaleDateString("fr-FR")}</span>
              </div>
            </div>
          )}

          {/* MESSAGE D'ATTENTE selon rôle */}
          {mission.status === "pending_employee" && isEmployee && (
            <ActionBanner
              tone="amber"
              icon={AlertCircle}
              title="⏳ En attente de votre réponse"
              subtitle="Acceptez ou refusez cette mission pour continuer."
            />
          )}
          {mission.status === "pending_employee" && !isEmployee && (
            <ActionBanner
              tone="amber"
              icon={AlertCircle}
              title="⏳ En attente de la réponse du salarié"
              subtitle={`${mission.profile?.user?.name} doit accepter ou refuser cette mission.`}
            />
          )}
          {mission.status === "planned" && isEmployee && (
            <ActionBanner
              tone="amber"
              icon={AlertCircle}
              title="⏳ En attente du démarrage par l'entreprise"
              subtitle="Vous recevrez une notification dès que la mission démarre."
            />
          )}
          {mission.status === "planned" && isRequesting && !isSupplying && (
            <ActionBanner
              tone="blue"
              icon={AlertCircle}
              title="⏳ En attente du prêteur"
              subtitle="Le prêteur doit démarrer la mission."
            />
          )}

          {/* ACTIONS */}
          <div className="border-t border-[var(--border-app)] p-6 flex flex-wrap gap-3">
            {/* Salarié : accepter/refuser */}
            {isEmployee && mission.status === "pending_employee" && (
              <>
                <button
                  onClick={() => doAction("accept")}
                  disabled={actionLoading}
                  className="flex-1 min-w-[180px] rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0A1229] hover:bg-emerald-400 disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} /> Accepter
                </button>
                <button
                  onClick={() => doAction("decline")}
                  disabled={actionLoading}
                  className="flex-1 min-w-[180px] rounded-lg border border-rose-500/30 bg-transparent px-5 py-2.5 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  <XCircle size={16} /> Refuser
                </button>
              </>
            )}

            {/* Prêteur : démarrer */}
            {isSupplying && !isEmployee && mission.status === "planned" && (
              <button
                onClick={() => doAction("active")}
                disabled={actionLoading}
                className="flex-1 min-w-[180px] rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0A1229] hover:bg-emerald-400 disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                <PlayCircle size={16} /> Démarrer la mission
              </button>
            )}

            {/* Prêteur : terminer */}
            {isSupplying && mission.status === "active" && (
              <button
                onClick={() => doAction("completed")}
                disabled={actionLoading}
                className="flex-1 min-w-[180px] rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0A1229] hover:bg-emerald-400 disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                <Flag size={16} /> Marquer comme terminée
              </button>
            )}

            {/* Documents (uniquement entreprises) */}
            {isCompany && (
              <button
                onClick={() => setShowDocs(true)}
                className="rounded-lg border border-[var(--border-app)] bg-transparent px-5 py-2.5 text-sm font-medium text-[var(--text-app)] hover:border-emerald-500/40 inline-flex items-center justify-center gap-2"
              >
                <FileText size={16} /> Documents
              </button>
            )}

            {isRequesting && (
              <Link
                to="/messages"
                className="rounded-lg border border-[var(--border-app)] bg-transparent px-5 py-2.5 text-sm font-medium text-[var(--text-app)] hover:border-emerald-500/40 inline-flex items-center justify-center gap-2"
              >
                <MessageSquare size={16} /> Contacter le prêteur
              </Link>
            )}
          </div>
        </div>

        {/* Message si aucun rôle */}
        {!isEmployee && !isCompany && (
          <div className="mt-6 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-5 text-sm text-[var(--text-muted)]">
            ℹ️ Vous n'avez pas de rôle actif sur cette mission.
          </div>
        )}
      </div>

      {/* ============================================
          MODAL DOCUMENTS (entreprises uniquement)
      ============================================ */}
      {showDocs && isCompany && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowDocs(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-emerald-400" />
                <h3 className="text-base font-bold text-[var(--text-app)]">Documents de la mission</h3>
              </div>
              <button
                onClick={() => setShowDocs(false)}
                className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
              >
                <X size={18} />
              </button>
            </div>

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

            <DocumentList
              documentableType="App\Models\Mission"
              documentableId={mission.id}
              refreshKey={docsRefresh}
            />
          </div>
        </div>
      )}
    </AppShell>
  );
}

/* ============================================================
   SOUS-COMPOSANTS
============================================================ */

function InfoBlock({ icon: Icon, label, value }) {
  return (
    <div className="bg-[var(--bg-surface)] p-4">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
        <Icon size={11} /> {label}
      </div>
      <p className="mt-1.5 text-sm font-semibold text-[var(--text-app)] truncate">
        {value}
      </p>
    </div>
  );
}

function ActionBanner({ tone, icon: Icon, title, subtitle }) {
  const toneMap = {
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    blue:  "border-blue-500/30 bg-blue-500/10 text-blue-400",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  };
  const c = toneMap[tone] || toneMap.amber;

  return (
    <div className={`border-t border-[var(--border-app)] p-5 flex items-start gap-3`}>
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg border shrink-0 ${c}`}>
        <Icon size={16} />
      </span>
      <div>
        <p className={`text-sm font-bold ${c.split(" ").pop()}`}>{title}</p>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">{subtitle}</p>
      </div>
    </div>
  );
}