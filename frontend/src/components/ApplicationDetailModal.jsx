import React, { useEffect, useState } from "react";
import {
  X, Loader2, Clock, Eye, Check, UserCheck, Video,
  FileText, ExternalLink, Calendar, AlertCircle, Download,
  MapPin, Briefcase, Building2,
} from "lucide-react";
import api from "../services/api";

const STATUS_META = {
  sent:        { label: "Envoyée",         icon: Clock,     cls: "border-slate-300 bg-slate-50 text-slate-700 dark:border-white/20 dark:bg-white/10 dark:text-slate-300",    step: 1 },
  viewed:      { label: "Consultée",       icon: Eye,       cls: "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400",       step: 2 },
  shortlisted: { label: "Présélectionnée", icon: UserCheck, cls: "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-400", step: 3 },
  interview:   { label: "Entretien",       icon: Video,     cls: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400",    step: 4 },
  accepted:    { label: "Acceptée",        icon: Check,     cls: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400", step: 5 },
  rejected:    { label: "Refusée",         icon: X,         cls: "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400",       step: 0 },
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
      .then((res) => {
        if (active) setApplication(res.data?.data || res.data);
      })
      .catch(() => {
        if (active) setError("Candidature introuvable.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [applicationId]);

  const statusMeta = application?.status ? STATUS_META[application.status] : null;
  const currentStep = statusMeta?.step || 1;
  const jobOffer = application?.job_offer || {};
  const company = jobOffer.company || {};

  /* ============ CONTENU PARTAGÉ (embarqué OU overlay) ============ */
  const Body = (
    <div className="min-h-0 flex-1 overflow-y-auto bg-[#F9FBFC] p-5 dark:bg-[#0B1F33] sm:p-6">
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 size={28} className="animate-spin text-[#0F9691] dark:text-emerald-400" />
        </div>
      ) : error || !application ? (
        <div className="py-16 text-center">
          <AlertCircle size={40} className="mx-auto text-rose-500 dark:text-rose-400" />
          <h2 className="mt-3 text-lg font-bold text-[#102A43] dark:text-white">
            {error || "Candidature introuvable"}
          </h2>
        </div>
      ) : (
        <div className="space-y-4">

          {/* En-tête candidature */}
          <section className="rounded-2xl border border-[#E5EDF3] bg-white p-5 dark:border-white/10 dark:bg-[#112A3A]">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#079C94] dark:text-emerald-400">
                  {company.name || "Entreprise"}
                </p>
                <h1 className="mt-1 text-lg font-extrabold text-[#102A43] dark:text-white">
                  {jobOffer.title || "Candidature"}
                </h1>
                {jobOffer.city && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-[#71849A] dark:text-slate-400">
                    <MapPin size={12} />
                    {[jobOffer.city, jobOffer.country].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>

              {statusMeta && (
                <span className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold ${statusMeta.cls}`}>
                  {statusMeta.label}
                </span>
              )}
            </div>
          </section>

          {/* Timeline */}
          <section className="rounded-2xl border border-[#E5EDF3] bg-white p-5 dark:border-white/10 dark:bg-[#112A3A]">
            <h2 className="mb-4 text-[10px] font-extrabold uppercase tracking-wider text-[#8A9BB0] dark:text-slate-500">
              Progression
            </h2>

            <div className="flex items-start justify-between gap-0">
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
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition ${
                          done
                            ? "border-[#0F9691] bg-[#0F9691] text-white dark:border-emerald-500 dark:bg-emerald-500"
                            : "border-[#E8EEF3] bg-white text-[#B0BDCB] dark:border-white/10 dark:bg-white/5 dark:text-slate-500"
                        } ${isCurrent ? "ring-4 ring-[#0F9691]/15 dark:ring-emerald-500/20" : ""}`}
                      >
                        <Icon size={15} />
                      </div>
                      <span
                        className={`mt-2 max-w-[78px] text-center text-[9px] font-bold leading-tight ${
                          done ? "text-[#0F9691] dark:text-emerald-400" : "text-[#B0BDCB] dark:text-slate-500"
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>

                    {!isLast && (
                      <div className="flex h-9 shrink-0 items-center px-0.5">
                        <div
                          className={`h-0.5 w-6 sm:w-10 lg:w-14 ${
                            done && stepNum < currentStep ? "bg-[#0F9691] dark:bg-emerald-500" : "bg-[#E8EEF3] dark:bg-white/10"
                          }`}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </section>

          {/* Infos générales */}
          <section className="rounded-2xl border border-[#E5EDF3] bg-white p-5 dark:border-white/10 dark:bg-[#112A3A]">
            <h2 className="mb-3 text-[10px] font-extrabold uppercase tracking-wider text-[#8A9BB0] dark:text-slate-500">
              Informations
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoItem icon={Calendar} label="Date de candidature">
                {formatDate(application.created_at)}
              </InfoItem>
              {jobOffer.city && (
                <InfoItem icon={MapPin} label="Localisation">
                  {[jobOffer.city, jobOffer.country].filter(Boolean).join(", ")}
                </InfoItem>
              )}
              {jobOffer.offer_type && (
                <InfoItem icon={Briefcase} label="Type">
                  {jobOffer.offer_type}
                </InfoItem>
              )}
              {company.name && (
                <InfoItem icon={Building2} label="Entreprise">
                  {company.name}
                </InfoItem>
              )}
            </div>
          </section>

          {/* Entretien */}
          {application.status === "interview" && application.interview_at && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
              <h2 className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Entretien programmé
              </h2>
              <p className="text-sm font-bold text-[#102A43] dark:text-white">
                {formatDate(application.interview_at, {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                })}{" "}
                à{" "}
                {new Date(application.interview_at).toLocaleTimeString("fr-FR", {
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
              {application.interview_link && (
                <a
                  href={application.interview_link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400"
                >
                  <Video size={12} /> Rejoindre l'entretien
                  <ExternalLink size={10} />
                </a>
              )}
            </section>
          )}

          {/* Documents */}
          {(application.portfolio || application.cv_path) && (
            <section className="rounded-2xl border border-[#E5EDF3] bg-white p-5 dark:border-white/10 dark:bg-[#112A3A]">
              <h2 className="mb-3 text-[10px] font-extrabold uppercase tracking-wider text-[#8A9BB0] dark:text-slate-500">
                Documents joints
              </h2>
              <div className="space-y-2">
                {application.portfolio && (
                  <a
                    href={`/portfolio/${application.portfolio.public_slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between rounded-xl border border-[#E5EDF3] p-3 transition hover:border-[#0F9691] hover:bg-[#F0FDFA] dark:border-white/10 dark:hover:border-emerald-500/50 dark:hover:bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F8F5] text-[#0F9691] dark:bg-emerald-500/10 dark:text-emerald-400">
                        <Briefcase size={15} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#24435D] dark:text-white">
                          {application.portfolio.title || "Mon portfolio"}
                        </p>
                        <p className="text-[10px] text-[#71849A] dark:text-slate-400">Portfolio</p>
                      </div>
                    </div>
                    <ExternalLink size={13} className="text-[#8A9BB0] group-hover:text-[#0F9691] dark:text-slate-500 dark:group-hover:text-emerald-400" />
                  </a>
                )}

                {application.cv_path && (
                  <a
                    href={`/storage/${application.cv_path}`}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="group flex items-center justify-between rounded-xl border border-[#E5EDF3] p-3 transition hover:border-[#0F9691] hover:bg-[#F0FDFA] dark:border-white/10 dark:hover:border-emerald-500/50 dark:hover:bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F8F5] text-[#0F9691] dark:bg-emerald-500/10 dark:text-emerald-400">
                        <FileText size={15} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#24435D] dark:text-white">Mon CV.pdf</p>
                        <p className="text-[10px] text-[#71849A] dark:text-slate-400">Curriculum vitæ</p>
                      </div>
                    </div>
                    <Download size={13} className="text-[#8A9BB0] group-hover:text-[#0F9691] dark:text-slate-500 dark:group-hover:text-emerald-400" />
                  </a>
                )}
              </div>
            </section>
          )}

          {/* Lettre de motivation */}
          {application.cover_letter && (
            <section className="rounded-2xl border border-[#E5EDF3] bg-white p-5 dark:border-white/10 dark:bg-[#112A3A]">
              <h2 className="mb-3 text-[10px] font-extrabold uppercase tracking-wider text-[#8A9BB0] dark:text-slate-500">
                Lettre de motivation
              </h2>
              <p className="whitespace-pre-line text-xs leading-6 text-[#4B647D] dark:text-slate-300">
                {application.cover_letter}
              </p>
            </section>
          )}

          {/* Notes recruteur */}
          {application.recruiter_notes && (
            <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5 dark:border-sky-500/30 dark:bg-sky-500/10">
              <h2 className="mb-3 text-[10px] font-extrabold uppercase tracking-wider text-sky-800 dark:text-sky-400">
                Notes du recruteur
              </h2>
              <p className="whitespace-pre-line text-xs leading-6 text-[#334B63] dark:text-slate-300">
                {application.recruiter_notes}
              </p>
            </section>
          )}
        </div>
      )}
    </div>
  );

  /* ============================================================
     MODE EMBARQUÉ (affiché à côté du modal 1)
     ============================================================ */
  if (embedded) {
    return (
      <>
        {/* Header sans fond noir */}
        <div className="flex items-center justify-between gap-3 border-b border-[#E8EEF3] bg-[#F9FBFC] px-5 py-3 dark:border-white/10 dark:bg-[#112A3A]">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-[#0F9691] dark:text-emerald-400" />
            <p className="text-xs font-bold uppercase tracking-wider text-[#079C94] dark:text-emerald-400">
              Détail de la candidature
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1.5 text-[#526B83] transition hover:bg-[#F1F6FA] hover:text-[#0B1F33] dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {Body}
      </>
    );
  }

  /* ============================================================
     MODE OVERLAY (par défaut, pour mobile ou usage seul)
     ============================================================ */
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-[#0B1F33]/70 backdrop-blur-sm dark:bg-black/80"
      />

   <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#112A3A] dark:shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between gap-3 border-b border-[#E8EEF3] bg-[#F9FBFC] px-5 py-3 dark:border-white/10 dark:bg-[#112A3A]">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-[#0F9691] dark:text-emerald-400" />
            <p className="text-xs font-bold uppercase tracking-wider text-[#079C94] dark:text-emerald-400">
              Détail de la candidature
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1.5 text-[#526B83] transition hover:bg-[#F1F6FA] hover:text-[#0B1F33] dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {Body}
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0F9691] dark:bg-emerald-500/10 dark:text-emerald-400">
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8A9BB0] dark:text-slate-500">
          {label}
        </p>
        <p className="mt-0.5 text-xs font-bold text-[#24435D] dark:text-white">{children}</p>
      </div>
    </div>
  );
}