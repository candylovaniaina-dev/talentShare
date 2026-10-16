import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Clock,
  Eye,
  Check,
  X,
  Calendar,
  Building2,
  FileText,
  Briefcase,
  UserCheck,
  Video,
  MapPin,
  ExternalLink,
  AlertCircle,
  Trash2,
  Download,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import AppShell from "../../components/layout/AppShell";
import api from "../../services/api";

const STATUS_CFG = {
  sent: {
    label: "Envoyée",
    icon: Clock,
    color: "text-slate-300",
    bg: "bg-slate-500/15",
    border: "border-slate-400/20",
    step: 1,
  },
  viewed: {
    label: "Consultée",
    icon: Eye,
    color: "text-sky-300",
    bg: "bg-sky-400/10",
    border: "border-sky-400/20",
    step: 2,
  },
  shortlisted: {
    label: "Présélectionnée",
    icon: UserCheck,
    color: "text-violet-300",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
    step: 3,
  },
  interview: {
    label: "Entretien",
    icon: Video,
    color: "text-amber-300",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    step: 4,
  },
  accepted: {
    label: "Acceptée",
    icon: Check,
    color: "text-emerald-300",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    step: 5,
  },
  rejected: {
    label: "Refusée",
    icon: X,
    color: "text-rose-300",
    bg: "bg-rose-400/10",
    border: "border-rose-400/20",
    step: 0,
  },
};

const STEPS = [
  { key: "sent", label: "Envoyée", icon: Clock },
  { key: "viewed", label: "Consultée", icon: Eye },
  { key: "shortlisted", label: "Présélectionnée", icon: UserCheck },
  { key: "interview", label: "Entretien", icon: Video },
  { key: "accepted", label: "Décision", icon: Check },
];

const panelClass =
  "rounded-2xl border border-white/[0.08] bg-[#101D3B]/80 shadow-lg shadow-black/[0.08]";

const sectionLabelClass =
  "mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400";

function formatDate(value, options = {}) {
  if (!value) return "Date non disponible";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date non disponible";

  return date.toLocaleDateString("fr-FR", options);
}

function InfoItem({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-emerald-300">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <div className="mt-1 text-sm font-medium text-slate-200">
          {children}
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-300">
        <Icon size={18} />
      </div>
      <div>
        <h2 className="font-semibold text-white">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);

    api
      .get(`/applications/${id}`)
      .then((res) => {
        if (active) setApplication(res.data);
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.status === 403 ? "forbidden" : "not_found"
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const withdraw = async () => {
    if (
      !window.confirm(
        "Retirer cette candidature ? Cette action est irréversible."
      )
    ) {
      return;
    }

    setWithdrawing(true);

    try {
      await api.delete(`/applications/${id}`);
      navigate("/opportunites");
    } catch (err) {
      window.alert(err.response?.data?.message || "Erreur lors du retrait.");
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.08]">
              <Loader2 className="animate-spin text-emerald-300" size={30} />
            </div>
            <p className="text-sm text-slate-400">
              Chargement de votre candidature...
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !application) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4">
          <div className={`${panelClass} w-full p-8 text-center sm:p-10`}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 text-rose-300">
              <AlertCircle size={30} />
            </div>

            <h1 className="mt-5 text-xl font-bold text-white sm:text-2xl">
              {error === "forbidden"
                ? "Accès refusé"
                : "Candidature introuvable"}
            </h1>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
              {error === "forbidden"
                ? "Vous n'avez pas les autorisations nécessaires pour consulter cette candidature."
                : "Cette candidature n'existe pas ou n'est plus accessible."}
            </p>

            <Link
              to="/opportunites"
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-[#07152B] transition hover:bg-emerald-300"
            >
              <ArrowLeft size={16} />
              Retour aux candidatures
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const cfg = STATUS_CFG[application.status] || STATUS_CFG.sent;
  const StatusIcon = cfg.icon;
  const currentStep = cfg.step;
  const isWithdrawable = !["accepted", "rejected"].includes(
    application.status
  );

  const progressWidth =
    currentStep <= 1
      ? "0%"
      : `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-1 pb-10 sm:px-2">
        {/* Navigation */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="group mb-6 inline-flex items-center gap-2 rounded-lg py-2 text-sm text-slate-400 transition hover:text-emerald-300"
        >
          <ArrowLeft
            size={16}
            className="transition-transform group-hover:-translate-x-1"
          />
          Retour
        </button>

        {/* Main header */}
        <section className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-[#101D3B]">
          <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-emerald-400/[0.08] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-56 w-56 rounded-full bg-blue-500/[0.08] blur-3xl" />

          <div className="relative border-b border-white/[0.07] p-5 sm:p-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div className="min-w-0">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-300">
                  <Briefcase size={13} />
                  Suivi de candidature
                </div>

                <h1 className="max-w-2xl break-words text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
                  {application.job_offer?.title || "Candidature"}
                </h1>

                {application.job_offer?.company && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                    <Building2 size={16} className="shrink-0 text-emerald-300" />
                    {application.job_offer.company.name}
                  </p>
                )}
              </div>

              <div
                className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold ${cfg.color} ${cfg.bg} ${cfg.border}`}
              >
                <StatusIcon size={16} />
                {cfg.label}
              </div>
            </div>
          </div>

          {/* Application progress */}
          {application.status !== "rejected" ? (
            <div className="relative p-5 sm:p-8">
              <div className="mb-7 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Progression du dossier
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Suivez les étapes de votre candidature
                  </p>
                </div>

                <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-emerald-300">
                  Étape {currentStep}/{STEPS.length}
                </span>
              </div>

              <div className="relative">
                <div className="absolute left-[10%] right-[10%] top-5 h-0.5 rounded-full bg-white/10 sm:left-[10%] sm:right-[10%]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-700"
                    style={{ width: progressWidth }}
                  />
                </div>

                <div className="relative grid grid-cols-5 gap-1">
                  {STEPS.map((step, index) => {
                    const stepNum = index + 1;
                    const isDone = stepNum <= currentStep;
                    const isCurrent = stepNum === currentStep;
                    const Icon = step.icon;

                    return (
                      <div
                        key={step.key}
                        className="flex min-w-0 flex-col items-center text-center"
                      >
                        <div
                          className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300 sm:h-11 sm:w-11 ${
                            isDone
                              ? "border-emerald-300/40 bg-emerald-400 text-[#07152B]"
                              : "border-white/10 bg-[#0B1731] text-slate-500"
                          } ${
                            isCurrent
                              ? "ring-4 ring-emerald-400/10 shadow-lg shadow-emerald-400/10"
                              : ""
                          }`}
                        >
                          <Icon size={17} />
                        </div>

                        <span
                          className={`mt-3 max-w-full text-[10px] font-medium leading-4 sm:text-xs ${
                            isDone ? "text-emerald-200" : "text-slate-500"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 sm:p-8">
              <div className="flex items-start gap-4 rounded-2xl border border-rose-400/20 bg-rose-400/[0.07] p-4 sm:p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-400/10 text-rose-300">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <p className="font-semibold text-rose-200">
                    Candidature refusée
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Cette candidature n'a pas été retenue. Vous pouvez continuer
                    à explorer les opportunités disponibles.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* General information */}
        <section className={`${panelClass} mt-5 p-5 sm:p-7`}>
          <SectionHeading
            icon={Calendar}
            title="Informations générales"
            subtitle="Les informations principales de votre candidature"
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <InfoItem icon={Calendar} label="Date de candidature">
              {formatDate(application.created_at, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </InfoItem>

            {application.job_offer?.city && (
              <InfoItem icon={MapPin} label="Localisation">
                {application.job_offer.city}
                {application.job_offer.country &&
                  `, ${application.job_offer.country}`}
              </InfoItem>
            )}
          </div>
        </section>

        {/* Interview */}
        {application.status === "interview" && application.interview_at && (
          <section className={`${panelClass} mt-5 overflow-hidden`}>
            <div className="border-b border-white/[0.07] bg-amber-400/[0.05] p-5 sm:p-6">
              <SectionHeading
                icon={Video}
                title="Entretien programmé"
                subtitle="Les détails communiqués pour votre entretien"
              />

              <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] p-4 sm:p-5">
                <p className="text-lg font-bold capitalize text-white sm:text-xl">
                  {formatDate(application.interview_at, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>

                <p className="mt-2 flex items-center gap-2 text-sm text-amber-200">
                  <Clock size={15} />
                  À{" "}
                  {new Date(application.interview_at).toLocaleTimeString(
                    "fr-FR",
                    { hour: "2-digit", minute: "2-digit" }
                  )}
                </p>

                {application.interview_link && (
                  <a
                    href={application.interview_link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-3 text-sm font-bold text-[#201705] transition hover:bg-amber-200"
                  >
                    <Video size={16} />
                    Rejoindre l'entretien
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>

              {application.interview_notes && (
                <div className="mt-4 rounded-xl border border-white/[0.08] bg-[#0B1731]/70 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-200">
                    Notes du recruteur
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-300">
                    {application.interview_notes}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Attached documents */}
        {(application.portfolio || application.cv_path) && (
          <section className={`${panelClass} mt-5 p-5 sm:p-7`}>
            <SectionHeading
              icon={FileText}
              title="Documents joints"
              subtitle="Les documents associés à votre candidature"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {application.portfolio && (
                <div className="group rounded-2xl border border-white/[0.08] bg-[#0B1731]/70 p-5 transition hover:border-emerald-300/25">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-300">
                      <Briefcase size={19} />
                    </div>
                    <span className="rounded-lg border border-white/[0.08] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Portfolio
                    </span>
                  </div>

                  <h3 className="mt-4 break-words font-semibold text-white">
                    {application.portfolio.title || "Mon portfolio"}
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Présentation de vos projets et réalisations
                  </p>

                  <a
                    href={`http://localhost:5173/portfolio/${application.portfolio.public_slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 transition hover:text-emerald-200"
                  >
                    Voir le portfolio
                    <ChevronRight size={16} />
                  </a>
                </div>
              )}

              {application.cv_path && (
                <div className="group rounded-2xl border border-white/[0.08] bg-[#0B1731]/70 p-5 transition hover:border-emerald-300/25">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/15 bg-sky-400/[0.08] text-sky-300">
                      <FileText size={19} />
                    </div>
                    <span className="rounded-lg border border-white/[0.08] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      PDF
                    </span>
                  </div>

                  <h3 className="mt-4 font-semibold text-white">Mon CV.pdf</h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Curriculum vitæ joint à la candidature
                  </p>

                  <a
                    href={`http://localhost:8001/storage/${application.cv_path}`}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="mt-5 inline-flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.08] px-4 py-2.5 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-300/[0.14]"
                  >
                    <Download size={15} />
                    Télécharger le CV
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Cover letter */}
        {application.cover_letter && (
          <section className={`${panelClass} mt-5 p-5 sm:p-7`}>
            <SectionHeading
              icon={FileText}
              title="Lettre de motivation"
              subtitle="Le message transmis lors de votre candidature"
            />

            <div className="rounded-xl border border-white/[0.06] bg-[#0B1731]/60 p-4 sm:p-5">
              <p className="whitespace-pre-line text-sm leading-7 text-slate-300">
                {application.cover_letter}
              </p>
            </div>
          </section>
        )}

        {/* Recruiter notes */}
        {application.recruiter_notes && (
          <section className={`${panelClass} mt-5 p-5 sm:p-7`}>
            <SectionHeading
              icon={ShieldCheck}
              title="Notes du recruteur"
              subtitle="Informations communiquées au sujet de votre dossier"
            />

            <div className="rounded-xl border border-sky-300/15 bg-sky-300/[0.05] p-4 sm:p-5">
              <p className="whitespace-pre-line text-sm leading-7 text-slate-300">
                {application.recruiter_notes}
              </p>
            </div>
          </section>
        )}

        {/* Actions */}
        {isWithdrawable && (
          <div className="mt-6 flex flex-col-reverse justify-between gap-4 sm:flex-row sm:items-center">
            <p className="max-w-lg text-xs leading-5 text-slate-500">
              Vous pouvez retirer votre candidature si vous ne souhaitez plus
              poursuivre cette démarche.
            </p>

            <button
              type="button"
              onClick={withdraw}
              disabled={withdrawing}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] px-5 py-3 text-sm font-semibold text-rose-300 transition hover:border-rose-400/40 hover:bg-rose-400/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {withdrawing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              {withdrawing ? "Retrait en cours..." : "Retirer ma candidature"}
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}