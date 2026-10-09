import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Handshake, Briefcase, Building2, User, Calendar, Check, X,
  Clock, ArrowUpRight, Plus, FileText, Eye, Send, Ban,
  PlayCircle, CheckCircle, XCircle, AlertCircle, Target, Layers,
  Sparkles, Timer, Search, SlidersHorizontal,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import { Card, EmptyState } from "../components/ui/Card";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
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
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tab, setTab] = useState(searchParams.get("tab") || "all");
  const [query, setQuery] = useState("");        // ✅ recherche dynamique
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedMission, setSelectedMission] = useState(null);

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
      setSelectedMission(null);
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
      setSelectedMission(null);
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
      setSelectedMission(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur", "error");
    } finally {
      setActionLoading(null);
    }
  };

  /* ---------- Timeline unifiée ---------- */
  const timeline = useMemo(() => {
    const items = [];

    const missionProposalIds = new Set(
      missions.filter((m) => m.proposal_id).map((m) => m.proposal_id)
    );

    const hideIfMissionExists = (p) =>
      p.status === "accepted" && missionProposalIds.has(p.id);

    const visibleReceived = received.filter((p) => !hideIfMissionExists(p));
    const visibleSent     = sent.filter((p) => !hideIfMissionExists(p));

    visibleReceived.forEach((p) => items.push({ type: "proposal", direction: "received", ...p }));
    visibleSent.forEach((p) => items.push({ type: "proposal", direction: "sent", ...p }));
    missions.forEach((m) => items.push({ type: "mission", ...m }));

    return items.sort((a, b) => {
      const da = new Date(a.updated_at || a.created_at || 0).getTime();
      const db = new Date(b.updated_at || b.created_at || 0).getTime();
      return db - da;
    });
  }, [received, sent, missions]);

  /* ---------- Recherche dynamique ---------- */
  const filtered = useMemo(() => {
    let list = timeline;

    // Filtre par onglet
    if (tab === "proposals") list = list.filter((i) => i.type === "proposal");
    if (tab === "missions")  list = list.filter((i) => i.type === "mission");

    // Filtre par recherche
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((item) => {
        if (item.type === "proposal") {
          return (
            item.profile?.user?.name?.toLowerCase().includes(q) ||
            item.profile?.headline?.toLowerCase().includes(q) ||
            item.proposingCompany?.name?.toLowerCase().includes(q) ||
            item.toCompany?.name?.toLowerCase().includes(q) ||
            item.message?.toLowerCase().includes(q)
          );
        }
        if (item.type === "mission") {
          return (
            item.resource_offer?.title?.toLowerCase().includes(q) ||
            item.profile?.user?.name?.toLowerCase().includes(q) ||
            item.supplying_company?.name?.toLowerCase().includes(q) ||
            item.requesting_company?.name?.toLowerCase().includes(q)
          );
        }
        return false;
      });
    }

    return list;
  }, [timeline, tab, query]);

  const counts = {
    all:       timeline.length,
    proposals: timeline.filter((i) => i.type === "proposal").length,
    missions:  timeline.filter((i) => i.type === "mission").length,
  };

  const stats = [
    { label: "Propositions", count: counts.proposals, icon: Handshake, color: "text-amber-400" },
    { label: "Missions",     count: counts.missions,  icon: Briefcase, color: "text-emerald-400" },
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
          <div className="flex items-start justify-between gap-4 flex-wrap">
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

            {/* ✅ Bouton "Publier une proposition" */}
            {user?.role === "company" && (
    <Link
      to="/proposals/new"
      className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-bold text-[#0A1229] transition hover:bg-emerald-400"
    >
      <Plus size={14} /> Publier une proposition
    </Link>
  )}
          </div>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Suivez vos propositions et missions en un seul endroit.
          </p>

          {/* ✅ Barre de recherche + Filtres */}
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-4 py-2.5 focus-within:border-emerald-500/40 transition">
            <Search size={16} className="text-[var(--text-muted)] shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une offre, une entreprise, un talent…"
              className="flex-1 bg-transparent text-sm text-[var(--text-app)] placeholder:text-[var(--text-faint)] outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-app)] transition"
                title="Effacer"
              >
                <X size={14} />
              </button>
            )}
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-app)] hover:border-emerald-500/40 transition"
            >
              <SlidersHorizontal size={12} /> Filtres
            </button>
          </div>

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
                <p className={`mt-2 text-2xl font-bold ${s.color}`}>{s.count}</p>
              </Card>
            );
          })}
        </div>

        {/* ===== TIMELINE ===== */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-[var(--bg-surface)]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            emoji={query ? "🔍" : "📭"}
            text={
              query
                ? `Aucun résultat pour "${query}"`
                : tab === "all"
                ? "Aucune activité pour le moment."
                : tab === "proposals"
                ? "Aucune proposition."
                : "Aucune mission."
            }
            action={
              !query && tab !== "missions" && (
                <Link
                  to="/proposals/new"
                  className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
                >
                  Publier une proposition
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
                  user={user}
                  onAccept={acceptMission}
                  onDecline={declineMission}
                  onUpdateStatus={updateMissionStatus}
                  actionLoading={actionLoading}
                  onOpenDetails={() => setSelectedMission(item)}
                />
              )
            )}
          </div>
        )}
      </div>

      {/* ============================================
          MODAL MISSION DETAILS
      ============================================ */}
      {selectedMission && (
        <MissionDetailModal
          mission={selectedMission}
          user={user}
          onClose={() => setSelectedMission(null)}
          onAccept={acceptMission}
          onDecline={declineMission}
          onUpdateStatus={updateMissionStatus}
          actionLoading={actionLoading}
        />
      )}
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
        <div className="shrink-0">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <Handshake size={20} />
          </span>
        </div>

        <div className="min-w-0 flex-1">
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

          {p.message && (
            <p className="mt-2 line-clamp-2 text-xs italic text-[var(--text-muted)]">
              "{p.message}"
            </p>
          )}

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
   ROW : MISSION (compacte)
============================================================ */
function MissionRow({ mission, user, onAccept, onDecline, onUpdateStatus, actionLoading, onOpenDetails }) {
  const cfg = MISSION_STATUS[mission.status] || MISSION_STATUS.planned;
  const Icon = cfg.icon;

  const myProfileId =
    user?.professional_profile?.id ||
    user?.professionalProfile?.id ||
    user?.professional_profile_id;

  const myCompanyIds = (user?.companies || []).map((c) => c.id);
  const isEmployee   = myProfileId && Number(mission.professional_profile_id) === Number(myProfileId);
  const isSupplying  = myCompanyIds.includes(mission.supplying_company_id);
  const isRequesting = myCompanyIds.includes(mission.requesting_company_id);

  return (
    <div className="group rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-5 transition hover:border-emerald-500/40">
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <Briefcase size={20} />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TONE_STYLES[cfg.tone]}`}>
              <Icon size={10} /> {cfg.label}
            </span>
            <span className="rounded-md border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
              Mission #{mission.id}
            </span>
            {isEmployee && (
              <span className="rounded-md border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400">
                👤 Salarié
              </span>
            )}
            {isSupplying && !isEmployee && (
              <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                Prêteur
              </span>
            )}
            {isRequesting && !isSupplying && (
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                Emprunteur
              </span>
            )}
          </div>

          <div className="mt-2">
            <p className="truncate text-sm font-bold text-[var(--text-app)]">
              {mission.resource_offer?.title || "Mission"}
            </p>
            {mission.profile?.user && (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <User size={11} /> {mission.profile.user.name}
              </p>
            )}
          </div>

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

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {isEmployee && mission.status === "pending_employee" && (
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

            <button
              onClick={onOpenDetails}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-app)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-app)] transition hover:border-emerald-500/40"
            >
              Détails <ArrowUpRight size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MODAL : MISSION DETAILS
============================================================ */
function MissionDetailModal({ mission, user, onClose, onAccept, onDecline, onUpdateStatus, actionLoading }) {
  const cfg = MISSION_STATUS[mission.status] || MISSION_STATUS.planned;
  const Icon = cfg.icon;

  const myProfileId =
    user?.professional_profile?.id ||
    user?.professionalProfile?.id ||
    user?.professional_profile_id;

  const myCompanyIds = (user?.companies || []).map((c) => c.id);
  const isEmployee   = myProfileId && Number(mission.professional_profile_id) === Number(myProfileId);
  const isSupplying  = myCompanyIds.includes(mission.supplying_company_id);
  const isRequesting = myCompanyIds.includes(mission.requesting_company_id);

  const timeline = useMemo(() => {
    if (!mission.start_at || !mission.end_at) return null;
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
      remainingDays: Math.max(0, days(remainingMs)),
      percent,
      notStarted: now < start,
    };
  }, [mission]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 border-b border-[var(--border-app)] bg-[var(--bg-surface)] p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                <Briefcase size={18} />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-400">
                  Mission #{mission.id}
                </p>
                <h2 className="mt-1 text-lg font-bold text-[var(--text-app)]">
                  {mission.resource_offer?.title || "Mission"}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TONE_STYLES[cfg.tone]}`}>
                    <Icon size={10} /> {cfg.label}
                  </span>
                  {isEmployee && (
                    <span className="rounded-md border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400">
                      👤 Salarié
                    </span>
                  )}
                  {isSupplying && !isEmployee && (
                    <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                      Prêteur
                    </span>
                  )}
                  {isRequesting && !isSupplying && (
                    <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      Emprunteur
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <InfoCard icon={User} label="Salarié" value={mission.profile?.user?.name || "—"} sub={mission.profile?.headline} />
            <InfoCard icon={Clock} label="Charge" value={`${mission.workload_percent}%`} sub={mission.remote ? "🏠 Télétravail" : null} />
            <InfoCard icon={Building2} label="Prêteur" value={mission.supplying_company?.name || "—"} />
            <InfoCard icon={Building2} label="Emprunteur" value={mission.requesting_company?.name || "—"} />
          </div>

          <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-hover)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
              Période
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-[var(--text-app)]">
                {new Date(mission.start_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </span>
              <span className="text-[var(--text-faint)]">→</span>
              <span className="font-semibold text-[var(--text-app)]">
                {new Date(mission.end_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
          </div>

          {timeline && ["planned", "active"].includes(mission.status) && (
            <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-hover)] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Timer size={14} className="text-emerald-400" />
                  <p className="text-xs font-bold text-[var(--text-app)]">Progression</p>
                </div>
                <span className="text-xs text-[var(--text-muted)]">
                  {timeline.notStarted ? (
                    <>Démarre dans <b className="text-emerald-400">{Math.abs(timeline.remainingDays)}j</b></>
                  ) : (
                    <><b className="text-emerald-400">{timeline.remainingDays}</b> jours restants</>
                  )}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-[var(--bg-surface)] overflow-hidden">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all"
                  style={{ width: `${timeline.percent}%` }}
                />
              </div>
              <p className="mt-2 text-[10px] text-[var(--text-muted)] text-center">
                {timeline.percent}% écoulé · {timeline.totalDays} jours au total
              </p>
            </div>
          )}

          {mission.notes && (
            <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-hover)] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Notes
              </p>
              <p className="text-sm text-[var(--text-app)] whitespace-pre-wrap">{mission.notes}</p>
            </div>
          )}

          {mission.status === "planned" && isEmployee && (
            <ActionBanner tone="amber" icon={AlertCircle} title="⏳ En attente du démarrage" subtitle="L'entreprise prêteuse doit démarrer la mission." />
          )}
          {mission.status === "planned" && isRequesting && !isSupplying && (
            <ActionBanner tone="blue" icon={AlertCircle} title="⏳ En attente du prêteur" subtitle="Le prêteur doit démarrer la mission." />
          )}
          {mission.status === "pending_employee" && isEmployee && (
            <ActionBanner tone="amber" icon={AlertCircle} title="⏳ En attente de votre réponse" subtitle="Acceptez ou refusez cette mission." />
          )}
        </div>

        <div className="sticky bottom-0 border-t border-[var(--border-app)] bg-[var(--bg-surface)] p-6 flex flex-wrap gap-3">
          {isEmployee && mission.status === "pending_employee" && (
            <>
              <button
                onClick={() => onAccept(mission.id)}
                disabled={actionLoading === mission.id}
                className="flex-1 min-w-[140px] rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0A1229] hover:bg-emerald-400 disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                <Check size={16} /> Accepter
              </button>
              <button
                onClick={() => onDecline(mission.id)}
                disabled={actionLoading === mission.id}
                className="flex-1 min-w-[140px] rounded-lg border border-rose-500/30 bg-transparent px-5 py-2.5 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                <X size={16} /> Refuser
              </button>
            </>
          )}

          {isSupplying && !isEmployee && mission.status === "planned" && (
            <button
              onClick={() => onUpdateStatus(mission.id, "active")}
              disabled={actionLoading === mission.id}
              className="flex-1 min-w-[180px] rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0A1229] hover:bg-emerald-400 disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              <PlayCircle size={16} /> Démarrer la mission
            </button>
          )}

          {isSupplying && mission.status === "active" && (
            <button
              onClick={() => onUpdateStatus(mission.id, "completed")}
              disabled={actionLoading === mission.id}
              className="flex-1 min-w-[180px] rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0A1229] hover:bg-emerald-400 disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              <CheckCircle size={16} /> Terminer
            </button>
          )}

          <Link
            to={`/missions/${mission.id}`}
            className="rounded-lg border border-[var(--border-app)] bg-transparent px-5 py-2.5 text-sm font-medium text-[var(--text-app)] hover:border-emerald-500/40 inline-flex items-center justify-center gap-2"
          >
            Ouvrir la mission complète <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SOUS-COMPOSANTS
============================================================ */
function InfoCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-hover)] p-3.5">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
        <Icon size={11} /> {label}
      </div>
      <p className="mt-1.5 text-sm font-semibold text-[var(--text-app)] truncate">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-[var(--text-muted)] truncate">{sub}</p>}
    </div>
  );
}

function ActionBanner({ tone, icon: Icon, title, subtitle }) {
  const toneMap = {
    amber:   "border-amber-500/30 bg-amber-500/10 text-amber-400",
    blue:    "border-blue-500/30 bg-blue-500/10 text-blue-400",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  };
  const c = toneMap[tone] || toneMap.amber;

  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${c}`}>
      <Icon size={16} className="shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-0.5 text-xs opacity-80">{subtitle}</p>
      </div>
    </div>
  );
}