import React, { useEffect, useState } from "react";
import {
  MapPin, Zap, Users, Briefcase, Eye,
  ShieldCheck, Loader2, Lock,
} from "lucide-react";
import api from "../../services/api";
import CandidatesModal from "./CandidatesModal";

const STATUS_LABELS = {
  draft:     "Brouillon",
  published: "Publiée",
  paused:    "En pause",
  closed:    "Fermée",
  filled:    "Pourvue",
  expired:   "Expirée",
};

const LEVEL_LABEL = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
  expert: "Expert",
};

export default function RequestDetailModal({ requestId, onClose, autoOpenCandidates = false }) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCandidates, setShowCandidates] = useState(autoOpenCandidates);

  /* ============ CHARGEMENT ============ */
  useEffect(() => {
    setLoading(true);
    api.get(`/resource-requests/${requestId}`)
      .then((res) => setRequest(res.data))
      .catch((err) => {
        if (err.response?.status === 404) setError("not_found");
        else if (err.response?.status === 403) setError("forbidden");
        else setError("error");
      })
      .finally(() => setLoading(false));
  }, [requestId]);

  /* ============ FERMETURE ÉCHAP ============ */
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  /* ============ LOADING ============ */
  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
        <div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-[var(--border-app)] bg-[var(--bg-app)]/80 shadow-2xl backdrop-blur-2xl">
          <Loader2 size={28} className="animate-spin text-emerald-400" />
        </div>
      </div>
    );
  }

  /* ============ ERREUR ============ */
  if (error || !request) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl border border-[var(--border-app)] bg-[var(--bg-app)]/80 p-8 text-center shadow-2xl backdrop-blur-2xl">
          <Lock size={28} className="mx-auto text-[var(--text-faint)]" />
          <p className="mt-4 text-sm font-medium text-[var(--text-app)]">
            {error === "forbidden" ? "Accès refusé" : "Demande introuvable"}
          </p>
        </div>
      </div>
    );
  }

  const daysLeft = request.days_until_expiry;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && request.display_status === "published";

  const gridCols = showCandidates ? "md:grid-cols-2" : "md:grid-cols-1";
  const maxWidth = showCandidates ? "max-w-6xl" : "max-w-2xl";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className={`grid w-full ${maxWidth} ${gridCols} gap-4 max-h-[92vh]`}>

        {/* ===== COLONNE 1 : DÉTAIL DEMANDE ===== */}
        <div className="flex max-h-[92vh] flex-col overflow-hidden rounded-2xl border border-[var(--border-app)] bg-[var(--bg-app)]/80 shadow-2xl backdrop-blur-2xl">

          {/* BODY (sans header X, sans footer) */}
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">

            {/* Titre */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Détail de la demande
              </p>
              <h2 className="mt-0.5 text-xl font-bold text-[var(--text-app)]">
                {request.title}
              </h2>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                <span>{STATUS_LABELS[request.display_status] || "—"}</span>
                {request.urgency === "urgent" && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-rose-400">
                      <Zap size={10} /> Urgent
                    </span>
                  </>
                )}
                {isExpiringSoon && (
                  <>
                    <span>·</span>
                    <span className="text-amber-400">Expire dans {daysLeft}j</span>
                  </>
                )}
              </p>
            </div>

            {/* Entreprise + meta */}
            <div className="rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface)]/50 p-4">
              {request.company && (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[var(--text-app)]">
                    {request.company.name}
                  </p>
                  {request.company.is_verified && (
                    <ShieldCheck size={13} className="text-emerald-400" />
                  )}
                  {request.company.city && (
                    <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <MapPin size={11} /> {request.company.city}
                    </span>
                  )}
                </div>
              )}
              <p className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-faint)]">
                <span className="flex items-center gap-1">
                  <Eye size={11} /> {request.views_count || 0} vues
                </span>
                <span className="flex items-center gap-1">
                  <Users size={11} /> {request.proposals_count || 0} proposition{request.proposals_count > 1 ? "s" : ""}
                </span>
                {request.positions_count > 1 && (
                  <span className="flex items-center gap-1">
                    <Briefcase size={11} /> {request.positions_count} postes
                  </span>
                )}
              </p>
            </div>

            {/* Description */}
            {request.description && (
              <section>
                <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Description
                </h3>
                <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-muted)]">
                  {request.description}
                </p>
              </section>
            )}

            {/* Tags */}
            {request.tags?.length > 0 && (
              <section>
                <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {request.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md border border-[var(--border-app)] bg-[var(--bg-surface)]/50 px-2 py-0.5 text-[11px] text-[var(--text-muted)]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Compétences */}
            {request.skills?.length > 0 && (
              <section>
                <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Compétences requises
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {request.skills.map((s) => (
                    <span
                      key={s.id}
                      className="rounded-md border border-[var(--border-app)] bg-[var(--bg-surface)]/50 px-2 py-0.5 text-[11px] text-[var(--text-muted)]"
                    >
                      {s.name}
                      <span className="ml-1.5 text-[10px] text-[var(--text-faint)]">
                        {LEVEL_LABEL[s.pivot?.min_level] || "Intermédiaire"}
                      </span>
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Détails */}
            <section>
              <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Détails
              </h3>
              <dl className="space-y-2 text-xs">
                <Row
                  label="Période"
                  value={`${new Date(request.start_at).toLocaleDateString("fr-FR")} → ${new Date(request.end_at).toLocaleDateString("fr-FR")}`}
                />
                <Row
                  label="Charge"
                  value={`${request.workload_percent}%${request.remote ? " · Télétravail" : ""}`}
                />
                <Row
                  label="Lieu"
                  value={`${request.city ? `${request.city}, ` : ""}${request.country || "—"}`}
                />
                {request.budget_min && request.budget_max && (
                  <Row
                    label="Budget"
                    value={`${request.budget_min} – ${request.budget_max} €/jour`}
                    highlight
                  />
                )}
                {request.expires_at && (
                  <Row
                    label="Expire le"
                    value={new Date(request.expires_at).toLocaleDateString("fr-FR")}
                  />
                )}
              </dl>
            </section>
          </div>
        </div>

        {/* ===== COLONNE 2 : CANDIDATS ===== */}
        {showCandidates && (
          <CandidatesModal
            requestId={request.id}
            requestTitle={request.title}
            onClose={onClose}
            embedded
          />
        )}
      </div>
    </div>
  );
}

/* ============================================
   LIGNE DÉTAIL
============================================ */
function Row({ label, value, highlight }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border-app)] pb-2 last:border-0">
      <dt className="text-[var(--text-muted)]">{label}</dt>
      <dd className={`text-right font-medium ${highlight ? "text-emerald-400" : "text-[var(--text-app)]"}`}>
        {value}
      </dd>
    </div>
  );
}