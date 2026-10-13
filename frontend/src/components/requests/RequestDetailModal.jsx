import React, { useEffect, useState } from "react";
import {
  MapPin,
  Zap,
  Users,
  Briefcase,
  Eye,
  ShieldCheck,
  Loader2,
  Lock,
  X,
  CalendarDays,
  Clock3,
  Wallet,
  Globe2,
  Tags,
  Code2,
  Building2,
  AlertCircle,
} from "lucide-react";
import api from "../../services/api";
import CandidatesModal from "./CandidatesModal";

const STATUS_LABELS = {
  draft: "Brouillon",
  published: "Publiée",
  paused: "En pause",
  closed: "Fermée",
  filled: "Pourvue",
  expired: "Expirée",
};

const LEVEL_LABEL = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
  expert: "Expert",
};

const STATUS_STYLES = {
  draft: "bg-slate-100 text-slate-600",
  published: "bg-emerald-50 text-emerald-700",
  paused: "bg-amber-50 text-amber-700",
  closed: "bg-rose-50 text-rose-700",
  filled: "bg-blue-50 text-blue-700",
  expired: "bg-slate-100 text-slate-500",
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function RequestDetailModal({
  requestId,
  onClose,
  autoOpenCandidates = false,
}) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCandidates, setShowCandidates] = useState(autoOpenCandidates);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);
    setRequest(null);

    api
      .get(`/resource-requests/${requestId}`)
      .then((res) => {
        if (active) setRequest(res.data);
      })
      .catch((err) => {
        if (!active) return;

        if (err.response?.status === 404) {
          setError("not_found");
        } else if (err.response?.status === 403) {
          setError("forbidden");
        } else {
          setError("error");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [requestId]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
        <div className="flex w-full max-w-xs flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50">
            <Loader2 size={26} className="animate-spin text-teal-700" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-800">
            Chargement de la demande
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Veuillez patienter...
          </p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    const forbidden = error === "forbidden";
    const notFound = error === "not_found";

    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            {forbidden ? <Lock size={24} /> : <AlertCircle size={24} />}
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            {forbidden
              ? "Accès refusé"
              : notFound
                ? "Demande introuvable"
                : "Impossible de charger la demande"}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {forbidden
              ? "Vous ne disposez pas des autorisations nécessaires pour consulter cette demande."
              : notFound
                ? "Cette demande n'existe plus ou n'est plus accessible."
                : "Une erreur est survenue. Veuillez réessayer ultérieurement."}
          </p>

          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  const daysLeft = request.days_until_expiry;
  const isExpiringSoon =
    daysLeft !== null &&
    daysLeft !== undefined &&
    daysLeft <= 7 &&
    daysLeft >= 0 &&
    request.display_status === "published";

  const statusClass =
    STATUS_STYLES[request.display_status] || STATUS_STYLES.draft;

  const gridCols = showCandidates ? "lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]" : "";
  const maxWidth = showCandidates ? "max-w-7xl" : "max-w-3xl";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-2 backdrop-blur-sm sm:p-5"
      onClick={onClose}
    >
      <div
        className={`grid max-h-[94vh] w-full ${maxWidth} ${gridCols} gap-4`}
        onClick={(event) => event.stopPropagation()}
      >
        <section className="flex max-h-[94vh] min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-7 sm:py-5">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <Briefcase size={21} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                  Détail de la demande
                </p>
                <h2 className="mt-1 break-words text-lg font-bold leading-snug text-slate-900 sm:text-xl">
                  {request.title || "Demande de ressource"}
                </h2>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass}`}
                  >
                    {STATUS_LABELS[request.display_status] || "Statut inconnu"}
                  </span>

                  {request.urgency === "urgent" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                      <Zap size={12} />
                      Urgent
                    </span>
                  )}

                  {isExpiringSoon && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                      <Clock3 size={12} />
                      Expire dans {daysLeft} j
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={19} />
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200">
                  <Building2 size={19} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="font-bold text-slate-900">
                      {request.company?.name || "Entreprise"}
                    </h3>

                    {request.company?.is_verified && (
                      <ShieldCheck
                        size={16}
                        className="text-teal-600"
                        aria-label="Entreprise vérifiée"
                      />
                    )}
                  </div>

                  {request.company?.city && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                      <MapPin size={14} />
                      {request.company.city}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4 sm:grid-cols-3">
                <Metric
                  icon={<Eye size={15} />}
                  label="Consultations"
                  value={request.views_count || 0}
                />
                <Metric
                  icon={<Users size={15} />}
                  label="Propositions"
                  value={request.proposals_count || 0}
                />
                <Metric
                  icon={<Briefcase size={15} />}
                  label="Postes"
                  value={request.positions_count || 1}
                />
              </div>
            </div>

            {request.description && (
              <section>
                <SectionHeading title="À propos de la mission" />
                <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                  {request.description}
                </p>
              </section>
            )}

            {request.tags?.length > 0 && (
              <section>
                <SectionHeading
                  icon={<Tags size={15} />}
                  title="Domaines et mots-clés"
                />

                <div className="flex flex-wrap gap-2">
                  {request.tags.map((tag, index) => (
                    <span
                      key={`${tag}-${index}`}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {request.skills?.length > 0 && (
              <section>
                <SectionHeading
                  icon={<Code2 size={15} />}
                  title="Compétences requises"
                />

                <div className="space-y-2">
                  {request.skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                          <Code2 size={15} />
                        </div>
                        <span className="text-sm font-semibold text-slate-800">
                          {skill.name}
                        </span>
                      </div>

                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                        {LEVEL_LABEL[skill.pivot?.min_level] ||
                          "Intermédiaire"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <SectionHeading
                icon={<CalendarDays size={15} />}
                title="Informations de la mission"
              />

              <div className="rounded-xl border border-slate-200 bg-white px-4">
                <DetailRow
                  icon={<CalendarDays size={15} />}
                  label="Période"
                  value={`${formatDate(request.start_at)} – ${formatDate(request.end_at)}`}
                />

                <DetailRow
                  icon={<Clock3 size={15} />}
                  label="Charge de travail"
                  value={`${request.workload_percent ?? "—"} %${request.remote ? " · Télétravail" : ""}`}
                />

                <DetailRow
                  icon={<MapPin size={15} />}
                  label="Localisation"
                  value={`${request.city ? `${request.city}, ` : ""}${request.country || "Non précisée"}`}
                />

                {request.budget_min != null &&
                  request.budget_max != null && (
                    <DetailRow
                      icon={<Wallet size={15} />}
                      label="Budget journalier"
                      value={`${request.budget_min} – ${request.budget_max} €`}
                      highlight
                    />
                  )}

                {request.expires_at && (
                  <DetailRow
                    icon={<CalendarDays size={15} />}
                    label="Date d'expiration"
                    value={formatDate(request.expires_at)}
                  />
                )}

                {request.remote && (
                  <DetailRow
                    icon={<Globe2 size={15} />}
                    label="Mode de travail"
                    value="Télétravail possible"
                  />
                )}
              </div>
            </section>
          </div>

          <footer className="flex flex-col gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="text-xs text-slate-400">
              Consultez les profils correspondant à cette mission.
            </p>

            <div className="flex gap-2">
              {!showCandidates && (
                <button
                  type="button"
                  onClick={() => setShowCandidates(true)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 sm:flex-none"
                >
                  <Users size={16} />
                  Voir les talents
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Fermer
              </button>
            </div>
          </footer>
        </section>

        {showCandidates && (
          <div className="min-h-0 max-h-[94vh]">
            <CandidatesModal
              requestId={request.id}
              requestTitle={request.title}
              onClose={() => setShowCandidates(false)}
              embedded
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeading({ icon, title }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
        {icon || <Briefcase size={15} />}
      </div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
    </div>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-slate-400">
        {icon}
        <span className="truncate text-[11px] font-medium">{label}</span>
      </div>
      <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function DetailRow({ icon, label, value, highlight = false }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3.5 last:border-0">
      <dt className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
        <span className="shrink-0 text-slate-400">{icon}</span>
        <span>{label}</span>
      </dt>

      <dd
        className={`max-w-[60%] text-right text-sm font-semibold ${
          highlight ? "text-teal-700" : "text-slate-800"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}