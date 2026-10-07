import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Handshake, Briefcase, Loader2, Building2, User, Calendar, Check, X,
  Clock, Users, ArrowUpRight, Plus, FileText, Eye, Send, Ban,
  PlayCircle, CheckCircle, XCircle, AlertCircle, Target, Layers,
  TrendingUp, Sparkles,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import { Card, EmptyState } from "../components/ui/Card";
import { useToast } from "../context/ToastContext";
import api from "../services/api";

/* ============================================================
   CONFIG
============================================================ */
const TABS = [
  { id: "all",       label: "Tout",         icon: Layers },
  { id: "proposals", label: "Propositions", icon: Handshake },
  { id: "missions",  label: "Missions",     icon: Briefcase },
];

const PROPOSAL_STATUS = {
  draft:     { label: "Brouillon",  tone: "slate",   icon: FileText },
  sent:      { label: "Envoyée",    tone: "amber",   icon: Clock },
  viewed:    { label: "Consultée",  tone: "blue",    icon: Eye },
  accepted:  { label: "Acceptée",   tone: "emerald", icon: Check },
  declined:  { label: "Refusée",    tone: "rose",    icon: X },
  expired:   { label: "Expirée",    tone: "slate",   icon: Clock },
  cancelled: { label: "Annulée",    tone: "slate",   icon: Ban },
};

const MISSION_STATUS = {
  pending_employee: { label: "En attente du salarié", tone: "amber",   icon: AlertCircle },
  planned:          { label: "Acceptée",              tone: "blue",    icon: CheckCircle },
  active:           { label: "En cours",              tone: "emerald", icon: PlayCircle },
  completed:        { label: "Terminée",              tone: "slate",   icon: CheckCircle },
  cancelled:        { label: "Annulée",               tone: "rose",    icon: XCircle },
};

const TONE_STYLES = {
  emerald: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  amber:   "border-amber-500/40 bg-amber-500/10 text-amber-400",
  rose:    "border-rose-500/40 bg-rose-500/10 text-rose-400",
  blue:    "border-blue-500/40 bg-blue-500/10 text-blue-400",
  slate:   "border-[var(--border-app)] bg-[var(--bg-surface-hover)] text-[var(--text-muted)]",
};

const asArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

/* ============================================================
   PAGE
============================================================ */
export default function MyActivity() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tab, setTab] = useState(searchParams.get("tab") || "all");
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    setSearchParams({ tab }, { replace: true });
  }, [tab, setSearchParams]);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get("/proposals/received").catch(() => ({ data: [] })),
      api.get("/proposals/sent").catch(() => ({ data: [] })),
      api.get("/missions").catch(() => ({ data: [] })),
    ])
      .then(([recRes, sentRes, misRes]) => {
        setReceived(asArray(recRes.data));
        setSent(asArray(sentRes.data));
        setMissions(asArray(misRes.data));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  /* ---------- Actions propositions ---------- */
  const acceptProposal = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`/proposals/${id}/accept`);
      showToast("Proposition acceptée", "success");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const declineProposal = async (id) => {
    if (!confirm("Refuser cette proposition ?")) return;
    setActionLoading(id);
    try {
      await api.post(`/proposals/${id}/decline`);
      showToast("Proposition refusée", "info");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const submitProposal = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`/proposals/${id}/submit`);
      showToast("Proposition envoyée", "success");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const cancelProposal = async (id) => {
    if (!confirm("Annuler cette proposition ?")) return;
    setActionLoading(id);
    try {
      await api.post(`/proposals/${id}/cancel`);
      showToast("Proposition annulée", "info");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur", "error");
    } finally {
      setActionLoading(null);
    }
  };

  /* ---------- Actions missions ---------- */
  const acceptMission = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`/missions/${id}/accept`);
      showToast("Mission acceptée", "success");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const declineMission = async (id) => {
    if (!confirm("Refuser cette mission ?")) return;
    setActionLoading(id);
    try {
      await api.post(`/missions/${id}/decline`);
      showToast("Mission refusée", "info");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const updateMissionStatus = async (id, status) => {
    setActionLoading(id);
    try {
      await api.patch(`/missions/${id}/status`, { status });
      showToast(status === "active" ? "Mission démarrée" : "Mission terminée", "success");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur", "error");
    } finally {
      setActionLoading(null);
    }
  };

  /* ---------- Timeline unifiée ---------- */
  const timeline = useMemo(() => {
    const items = [];

    // Propositions reçues + envoyées
    [...received].forEach((p) => items.push({ type: "proposal", direction: "received", ...p }));
    [...sent].forEach((p) => items.push({ type: "proposal", direction: "sent", ...p }));

    // Missions
    missions.forEach((m) => items.push({ type: "mission", ...m }));

    // Tri par date récente
    return items.sort((a, b) => {
      const da = new Date(a.updated_at || a.created_at || 0).getTime();
      const db = new Date(b.updated_at || b.created_at || 0).getTime();
      return db - da;
    });
  }, [received, sent, missions]);

  const filtered = useMemo(() => {
    if (tab === "all") return timeline;
    if (tab === "proposals") return timeline.filter((i) => i.type === "proposal");
    if (tab === "missions") return timeline.filter((i) => i.type === "mission");
    return timeline;
  }, [timeline, tab]);

  const counts = {
    all:       timeline.length,
    proposals: timeline.filter((i) => i.type === "proposal").length,
    missions:  timeline.filter((i) => i.type === "mission").length,
  };

  /* ---------- Stats ---------- */
  const stats = [
    {
      label: "Propositions",
      count: counts.proposals,
      icon: Handshake,
      color: "text-amber-400",
    },
    {
      label: "Missions",
      count: counts.missions,
      icon: Briefcase,
      color: "text-emerald-400",
    },
    {
      label: "En cours",
      count: missions.filter((m) => ["planned", "active"].includes(m.status)).length,
      icon: PlayCircle,
      color: "text-blue-400",
    },
    {
      label: "Terminées",
      count: missions.filter((m) => m.status === "completed").length,
      icon: CheckCircle,
      color: "text-emerald-400",
    },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">

        {/* ===== HEADER ===== */}
        <div className="mb-6 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <Sparkles size={18} />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-400">
                  Espace personnel
                </p>
                <h1 className="text-xl font-bold text-[var(--text-app)]">
                  Mon activité
                </h1>
              </div>
            </div>

            <Link
              to="/proposals/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-[#0A1229] transition hover:bg-emerald-400"
            >
              <Plus size={13} /> Nouvelle proposition
            </Link>
          </div>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Suivez vos propositions et missions en un seul endroit.
          </p>

          {/* Onglets */}
          <div className="mt-5 flex gap-1 border-b border-[var(--border-app)]">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold transition ${
                    active ? "text-emerald-400" : "text-[var(--text-muted)] hover:text-[var(--text-app)]"
                  }`}
                >
                  <Icon size={14} />
                  {t.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      active ? "bg-emerald-500/20 text-emerald-400" : "bg-[var(--bg-surface-hover)] text-[var(--text-faint)]"
                    }`}
                  >
                    {counts[t.id]}
                  </span>
                  {active && (
                    <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== STATS ===== */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="p-4">
                <div className="flex items-center gap-2">
                  <Icon size={14} className={s.color} />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {s.label}
                  </p>
                </div>
                <p className={`mt-2 text-2xl font-bold ${s.color}`}>
                  {s.count}
                </p>
              </Card>
            );
          })}
        </div>

        {/* ===== TIMELINE ===== */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-[var(--bg-surface)]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            emoji="📭"
            text={
              tab === "all"
                ? "Aucune activité pour le moment."
                : tab === "proposals"
                ? "Aucune proposition."
                : "Aucune mission."
            }
            action={
              tab !== "missions" && (
                <Link
                  to="/proposals/new"
                  className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
                >
                  Créer une proposition
                </Link>
              )
            }
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((item) =>
              item.type === "proposal" ? (
                <ProposalRow
                  key={`p-${item.id}-${item.direction}`}
                  proposal={item}
                  direction={item.direction}
                  onAccept={acceptProposal}
                  onDecline={declineProposal}
                  onSubmit={submitProposal}
                  onCancel={cancelProposal}
                  actionLoading={actionLoading}
                />
              ) : (
                <MissionRow
                  key={`m-${item.id}`}
                  mission={item}
                  onAccept={acceptMission}
                  onDecline={declineMission}
                  onUpdateStatus={updateMissionStatus}
                  actionLoading={actionLoading}
                />
              )
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

/* ============================================================
   ROW : PROPOSITION
============================================================ */
function ProposalRow({
  proposal: p, direction,
  onAccept, onDecline, onSubmit, onCancel, actionLoading,
}) {
  const cfg = PROPOSAL_STATUS[p.display_status || p.status] || PROPOSAL_STATUS.sent;
  const Icon = cfg.icon;
  const isPending = ["sent", "viewed"].includes(p.status);
  const isDraft = p.status === "draft";

  return (
    <div className="group rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-5 transition hover:border-emerald-500/40">
      <div className="flex items-start gap-4">
        {/* Badge type */}
        <div className="shrink-0">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <Handshake size={20} />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TONE_STYLES[cfg.tone]}`}>
              <Icon size={10} /> {cfg.label}
            </span>
            <span className="rounded-md border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
              {direction === "received" ? "Reçue" : "Envoyée"}
            </span>
            {p.match_score != null && (
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                <Target size={9} className="mr-1 inline" />
                {p.match_score}%
              </span>
            )}
          </div>

          {/* Nom + contexte */}
          <div className="mt-2">
            {p.profile?.user && (
              <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--text-app)]">
                <User size={13} className="text-[var(--text-muted)]" />
                {p.profile.user.name}
                {p.profile.headline && (
                  <span className="text-xs font-normal text-[var(--text-muted)]">
                    · {p.profile.headline}
                  </span>
                )}
              </p>
            )}

            {p.proposingCompany && direction === "received" && (
              <p className="mt-1 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <Building2 size={11} />
                Proposé par <span className="font-medium">{p.proposingCompany.name}</span>
              </p>
            )}

            {p.toCompany && direction === "sent" && (
              <p className="mt-1 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <Building2 size={11} />
                À <span className="font-medium">{p.toCompany.name}</span>
              </p>
            )}
          </div>

          {/* Meta */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--text-muted)]">
            {p.start_at && p.end_at && (
              <span className="flex items-center gap-1">
                <Calendar size={10} />
                {new Date(p.start_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                {" → "}
                {new Date(p.end_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {new Date(p.sent_at || p.created_at).toLocaleDateString("fr-FR", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </span>
          </div>

          {/* Message */}
          {p.message && (
            <p className="mt-2 line-clamp-2 text-xs italic text-[var(--text-muted)]">
              "{p.message}"
            </p>
          )}

          {/* Actions */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {direction === "received" && isPending && (
              <>
                <button
                  onClick={() => onAccept(p.id)}
                  disabled={actionLoading === p.id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  <Check size={12} /> Accepter
                </button>
                <button
                  onClick={() => onDecline(p.id)}
                  disabled={actionLoading === p.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-transparent px-3.5 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/10 disabled:opacity-50"
                >
                  <X size={12} /> Refuser
                </button>
              </>
            )}

            {direction === "sent" && isDraft && (
              <>
                <button
                  onClick={() => onSubmit(p.id)}
                  disabled={actionLoading === p.id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  <Send size={12} /> Envoyer
                </button>
                <Link
                  to={`/proposals/${p.id}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-app)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-app)] transition hover:border-emerald-500/40"
                >
                  <FileText size={12} /> Modifier
                </Link>
              </>
            )}

            {direction === "sent" && isPending && (
              <button
                onClick={() => onCancel(p.id)}
                disabled={actionLoading === p.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-transparent px-3.5 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/10 disabled:opacity-50"
              >
                <Ban size={12} /> Annuler
              </button>
            )}

            <Link
              to={`/proposals/${p.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-app)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-app)] transition hover:border-emerald-500/40"
            >
              Détails <ArrowUpRight size={11} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ROW : MISSION
============================================================ */
function MissionRow({ mission, onAccept, onDecline, onUpdateStatus, actionLoading }) {
  const cfg = MISSION_STATUS[mission.status] || MISSION_STATUS.planned;
  const Icon = cfg.icon;

  return (
    <div className="group rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-5 transition hover:border-emerald-500/40">
      <div className="flex items-start gap-4">
        {/* Badge type */}
        <div className="shrink-0">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <Briefcase size={20} />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TONE_STYLES[cfg.tone]}`}>
              <Icon size={10} /> {cfg.label}
            </span>
            <span className="rounded-md border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
              Mission #{mission.id}
            </span>
          </div>

          {/* Nom + contexte */}
          <div className="mt-2">
            {mission.resource_offer?.title && (
              <p className="truncate text-sm font-bold text-[var(--text-app)]">
                {mission.resource_offer.title}
              </p>
            )}
            {mission.profile?.user && (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <User size={11} />
                {mission.profile.user.name}
              </p>
            )}
          </div>

          {/* Entreprises */}
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[var(--text-muted)]">
            {mission.supplying_company && (
              <span className="inline-flex items-center gap-1">
                <Building2 size={10} />
                {mission.supplying_company.name}
              </span>
            )}
            {mission.requesting_company && (
              <>
                <span className="text-[var(--text-faint)]">→</span>
                <span className="inline-flex items-center gap-1">
                  <Building2 size={10} />
                  {mission.requesting_company.name}
                </span>
              </>
            )}
          </div>

          {/* Meta */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--text-muted)]">
            {mission.start_at && mission.end_at && (
              <span className="flex items-center gap-1">
                <Calendar size={10} />
                {new Date(mission.start_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                {" → "}
                {new Date(mission.end_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              </span>
            )}
            {mission.workload_percent != null && (
              <span className="flex items-center gap-1">
                <Clock size={10} /> {mission.workload_percent}%
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {mission.status === "pending_employee" && (
              <>
                <button
                  onClick={() => onAccept(mission.id)}
                  disabled={actionLoading === mission.id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  <Check size={12} /> Accepter
                </button>
                <button
                  onClick={() => onDecline(mission.id)}
                  disabled={actionLoading === mission.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-transparent px-3.5 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/10 disabled:opacity-50"
                >
                  <X size={12} /> Refuser
                </button>
              </>
            )}

            {mission.status === "planned" && (
              <button
                onClick={() => onUpdateStatus(mission.id, "active")}
                disabled={actionLoading === mission.id}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-50"
              >
                <PlayCircle size={12} /> Démarrer
              </button>
            )}

            {mission.status === "active" && (
              <button
                onClick={() => onUpdateStatus(mission.id, "completed")}
                disabled={actionLoading === mission.id}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-50"
              >
                <CheckCircle size={12} /> Terminer
              </button>
            )}

            <Link
              to={`/missions/${mission.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-app)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-app)] transition hover:border-emerald-500/40"
            >
              Détails <ArrowUpRight size={11} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}