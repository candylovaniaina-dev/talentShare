import React, { useEffect, useState } from "react";
import {
  X, Loader2, Clock, Eye, Check, UserCheck, Video, FileText, ExternalLink,
  Calendar, AlertCircle, Download, MapPin, Briefcase, Building2,
} from "lucide-react";
import api from "../services/api";

// ✅ Dictionnaire pour traduire les types d'offres
const OFFER_TYPES = {
  internship: "Stage",
  apprenticeship: "Alternance",
  fixed_term: "CDD",
  permanent: "Recrutement permanent",
  first_job: "Recrutement permanent",
  junior_mission: "Mission junior",
  freelance: "Freelance",
  student_project: "Projet étudiant",
};

const STATUS_META = {
  sent:        { label: "Envoyée",         style: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",  dot: "bg-slate-400",  step: 1 },
  viewed:      { label: "Consultée",       style: "bg-blue-50 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400",     dot: "bg-blue-500",   step: 2 },
  shortlisted: { label: "Présélectionnée", style: "bg-violet-50 text-violet-800 dark:bg-violet-500/10 dark:text-violet-400", dot: "bg-violet-500", step: 3 },
  interview:   { label: "Entretien",       style: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400",   dot: "bg-amber-500",  step: 4 },
  accepted:    { label: "Acceptée",        style: "bg-[#16B8B1]/10 text-[#0F9691] dark:bg-[#16B8B1]/20 dark:text-[#16B8B1]", dot: "bg-[#16B8B1]", step: 5 },
  rejected:    { label: "Refusée",         style: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",   dot: "bg-rose-500",   step: 0 },
};

const TIMELINE_STEPS = [
  { key: "sent", label: "Envoyée", icon: Clock },
  { key: "viewed", label: "Consultée", icon: Eye },
  { key: "shortlisted", label: "Présélectionnée", icon: UserCheck },
  { key: "interview", label: "Entretien", icon: Video },
  { key: "accepted", label: "Décision", icon: Check },
];

const formatDate = (v, opts = { day: "numeric", month: "long", year: "numeric" }) =>
  v ? new Date(v).toLocaleDateString("fr-FR", opts) : null;

export default function ApplicationDetailModal({ applicationId, onClose, embedded = false }) {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (embedded) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [embedded]);

  useEffect(() => {
    if (embedded) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, embedded]);

  useEffect(() => {
    if (!applicationId) return;
    let active = true;
    setLoading(true);

    api
      .get(`/applications/${applicationId}`)
      .then((res) => active && setApplication(res.data?.data || res.data))
      .catch(() => active && setError("Candidature introuvable."))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [applicationId]);

  const statusMeta = application?.status ? STATUS_META[application.status] : null;
  const rejected = application?.status === "rejected";
  const currentStep = rejected ? 1 : statusMeta?.step || 1;
  const jobOffer = application?.job_offer || {};
  const company = jobOffer.company || {};
  const place = [jobOffer.city, jobOffer.country].filter(Boolean).join(", ");
  const offerTypeLabel = OFFER_TYPES[jobOffer.offer_type] || jobOffer.offer_type;

  /* ---------- Blocs ---------- */

  // ✅ Résumé : Icône supprimée
  const Summary = application && (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">{company.name || "Entreprise"}</p>
          <h1 className="mt-0.5 text-lg font-bold tracking-tight text-[#0B1F33] dark:text-white">
            {jobOffer.title || "Candidature"}
          </h1>
          {place && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <MapPin size={12} className="text-slate-400" /> {place}
            </p>
          )}
        </div>

        {statusMeta && (
          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${statusMeta.style}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
            {statusMeta.label}
          </span>
        )}
      </div>
    </Card>
  );

  const Timeline = application && (
    <Card title="Progression">
      {rejected && (
        <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 ring-1 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20">
          <AlertCircle size={15} /> Cette candidature n'a pas été retenue.
        </div>
      )}

      <div className="flex items-start">
        {TIMELINE_STEPS.map((s, i) => {
          const stepNum = i + 1;
          const done = stepNum <= currentStep;
          const isCurrent = stepNum === currentStep;
          const isLast = i === TIMELINE_STEPS.length - 1;
          const Icon = s.icon;

          return (
            <React.Fragment key={s.key}>
              <div className="flex min-w-0 flex-1 flex-col items-center">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
                    done
                      ? rejected
                        ? "bg-rose-500 text-white"
                        : "bg-[#16B8B1] text-[#0B1F33] shadow-md shadow-[#16B8B1]/20"
                      : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500"
                  } ${isCurrent ? (rejected ? "ring-4 ring-rose-500/15" : "ring-4 ring-[#16B8B1]/20") : ""}`}
                >
                  <Icon size={16} />
                </div>
                <span
                  className={`mt-2 max-w-[78px] text-center text-[10px] font-bold leading-tight ${
                    done ? (rejected ? "text-rose-600 dark:text-rose-400" : "text-[#0F9691] dark:text-[#16B8B1]") : "text-slate-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>

              {!isLast && (
                <div className="flex h-10 shrink-0 items-center px-0.5">
                  <div
                    className={`h-0.5 w-5 rounded-full sm:w-9 ${
                      stepNum < currentStep ? "bg-[#16B8B1]" : "bg-slate-200 dark:bg-white/10"
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </Card>
  );

  const Interview =
    application?.status === "interview" && application.interview_at ? (
      <div className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 dark:border-amber-500/20 dark:from-amber-500/10 dark:to-[#131E47]">
        <div className="flex items-start gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm ring-1 ring-amber-100 dark:bg-white/10 dark:ring-amber-500/20">
            <Calendar size={19} />
          </span>
          <div>
            <p className="text-xs font-bold text-amber-800 dark:text-amber-400">Entretien programmé</p>
            <p className="mt-1 text-sm font-bold capitalize text-[#0B1F33] dark:text-white">
              {formatDate(application.interview_at, {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
              <span className="font-normal normal-case text-slate-500 dark:text-slate-400"> à </span>
              <span className="normal-case">
             {new Date(application.interview_at).toLocaleTimeString("fr-FR", { 
  hour: "2-digit", 
  minute: "2-digit", 
  timeZone: "Indian/Antananarivo" 
})}
              </span>
            </p>
            {application.interview_link && (
              <a
                href={application.interview_link}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-amber-700"
              >
                <Video size={13} /> Rejoindre l'entretien <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>
      </div>
    ) : null;

  // ✅ Infos : Icônes supprimées
  const Infos = application && (
    <Card title="Informations">
      <div className="space-y-4">
        <div>
          <p className="text-[11px] font-medium text-slate-400">Date de candidature</p>
          <p className="mt-0.5 text-sm font-bold text-[#0B1F33] dark:text-white">{formatDate(application.created_at)}</p>
        </div>
        {place && (
          <div>
            <p className="text-[11px] font-medium text-slate-400">Localisation</p>
            <p className="mt-0.5 text-sm font-bold text-[#0B1F33] dark:text-white">{place}</p>
          </div>
        )}
        {jobOffer.offer_type && (
          <div>
            <p className="text-[11px] font-medium text-slate-400">Type de contrat</p>
            <p className="mt-0.5 text-sm font-bold text-[#0B1F33] dark:text-white">{offerTypeLabel}</p>
          </div>
        )}
        {company.name && (
          <div>
            <p className="text-[11px] font-medium text-slate-400">Entreprise</p>
            <p className="mt-0.5 text-sm font-bold text-[#0B1F33] dark:text-white">{company.name}</p>
          </div>
        )}
      </div>
    </Card>
  );

  const Documents =
    application ? (
      <Card title="Documents joints">
        <div className="space-y-2">
          {/* Portfolio */}
          {application.portfolio && (
            <DocLink
              href={`/portfolio/${application.portfolio.public_slug}`}
              icon={Briefcase}
              title={application.portfolio.title || "Mon portfolio"}
              subtitle="Portfolio"
              action={<ExternalLink size={14} />}
            />
          )}

          {/* ✅ CV : On prend celui de la candidature, sinon celui du profil */}
          {(application.cv_path || application.profile?.cv_path) ? (
            <DocLink
              href={`/storage/${application.cv_path || application.profile?.cv_path}`}
              icon={FileText}
              title="Mon CV.pdf"
              subtitle="Curriculum vitæ"
              action={<Download size={14} />}
              download
            />
          ) : (
             <p className="text-xs text-slate-400 italic">Aucun document joint.</p>
          )}
        </div>
      </Card>
    ) : null;

  const Letter = application?.cover_letter ? (
    <Card title="Lettre de motivation">
      <p className="whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">{application.cover_letter}</p>
    </Card>
  ) : null;

  const Notes = application?.recruiter_notes ? (
    <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5 dark:border-sky-500/20 dark:bg-sky-500/10">
      <h2 className="mb-2 text-xs font-bold text-sky-800 dark:text-sky-300">Notes du recruteur</h2>
      <p className="whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">{application.recruiter_notes}</p>
    </div>
  ) : null;

  /* ---------- Corps ---------- */
  const Body = (
    <div className="min-h-0 flex-1 overflow-y-auto bg-[#F3F6FC] p-5 sm:p-6 dark:bg-[#0A1230]">
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 size={28} className="animate-spin text-[#16B8B1]" />
        </div>
      ) : error || !application ? (
        <div className="py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400">
            <AlertCircle size={26} />
          </div>
          <h2 className="mt-3 text-base font-semibold text-[#0B1F33] dark:text-white">
            {error || "Candidature introuvable"}
          </h2>
        </div>
      ) : embedded ? (
        <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
          {Summary}{Timeline}{Interview}{Infos}{Documents}{Letter}{Notes}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_300px] font-['Plus_Jakarta_Sans',sans-serif]">
          <div className="min-w-0 space-y-4">
            {Summary}{Timeline}{Letter}{Notes}
          </div>
          <div className="min-w-0 space-y-4">
            {Interview}{Infos}{Documents}
          </div>
        </div>
      )}
    </div>
  );

  /* ---------- Mode embarqué ---------- */
  if (embedded) {
    return (
      <>
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3 dark:border-white/10 dark:bg-[#131E47]">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-[#16B8B1]" />
            <p className="text-sm font-bold text-[#0B1F33] dark:text-white">Détail de la candidature</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        {Body}
      </>
    );
  }

  /* ---------- Mode overlay ---------- */
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 font-['Plus_Jakarta_Sans',sans-serif]" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-[#0B1F33]/70 backdrop-blur-sm"
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-[#0B1F33]/30 dark:bg-[#131E47]">
        {/* ✅ Header Bleu Marine */}
        <header className="relative overflow-hidden bg-[#0B1F33] px-5 py-4 text-white sm:px-6">
          <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-[#16B8B1]/20 blur-3xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 text-[#16B8B1]">
                <FileText size={18} />
              </span>
              <div>
                <h2 className="text-base font-bold tracking-tight">Détail de la candidature</h2>
                <p className="text-xs text-white/70">Suivi et documents de votre candidature</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="rounded-xl bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {Body}
      </div>
    </div>
  );
}

/* ============================================
   Briques
============================================ */
function Card({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#131E47]">
      {title && <h2 className="mb-4 text-xs font-bold text-slate-500 dark:text-slate-400">{title}</h2>}
      {children}
    </section>
  );
}

function DocLink({ href, icon: Icon, title, subtitle, action, download }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      download={download}
      className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-[#16B8B1]/30 hover:bg-[#16B8B1]/5 dark:border-white/10 dark:hover:bg-white/5"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#16B8B1]/10 text-[#0F9691] dark:bg-[#16B8B1]/20 dark:text-[#16B8B1]">
          <Icon size={15} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#0B1F33] dark:text-white">{title}</p>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
      <span className="shrink-0 text-slate-300 transition group-hover:text-[#16B8B1]">{action}</span>
    </a>
  );
}