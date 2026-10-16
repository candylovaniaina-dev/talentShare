import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Clock,
  Check,
  Calendar,
  Building2,
  FileText,
  Briefcase,
  Video,
  MapPin,
  ExternalLink,
  AlertCircle,
  Trash2,
  Download,
  ShieldCheck,
  ChevronRight,
  Circle,
  Mail,
  Globe,
} from "lucide-react";
import AppShell from "../../components/layout/AppShell";
import api from "../../services/api";

/* ============================================================
   CONFIG
============================================================ */
const STATUS_CFG = {
  sent:        { label: "Envoyée",         step: 1, tone: "bg-slate-100 text-slate-700 border-slate-200",     dot: "bg-slate-400" },
  viewed:      { label: "Consultée",       step: 2, tone: "bg-sky-50 text-sky-700 border-sky-200",           dot: "bg-sky-500" },
  shortlisted: { label: "Présélectionnée", step: 3, tone: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-500" },
  interview:   { label: "Entretien",       step: 4, tone: "bg-amber-50 text-amber-700 border-amber-200",    dot: "bg-amber-500" },
  accepted:    { label: "Acceptée",        step: 5, tone: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  rejected:    { label: "Refusée",         step: 0, tone: "bg-rose-50 text-rose-700 border-rose-200",       dot: "bg-rose-500" },
};

const STEPS = [
  { key: "sent",        label: "Envoyée" },
  { key: "viewed",      label: "Consultée" },
  { key: "shortlisted", label: "Présélectionnée" },
  { key: "interview",   label: "Entretien" },
  { key: "accepted",    label: "Décision" },
];

function formatDate(value, options = {}) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", options);
}

/* ============================================================
   BLOCS RÉUTILISABLES
============================================================ */
function Card({ children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${className}`}
    >
      {children}
    </section>
  );
}

function CardHeader({ icon: Icon, title, subtitle, tone = "emerald" }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-600",
    amber:   "bg-amber-50 text-amber-600",
    blue:    "bg-blue-50 text-blue-600",
    slate:   "bg-slate-100 text-slate-600",
    violet:  "bg-violet-50 text-violet-600",
  };
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon size={16} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <h2 className="text-[14px] font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[12px] text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

/* ============================================================
   PAGE PRINCIPALE
============================================================ */
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
    api.get(`/applications/${id}`)
      .then((res) => { if (active) setApplication(res.data); })
      .catch((err) => {
        if (active) setError(err.response?.status === 403 ? "forbidden" : "not_found");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const withdraw = async () => {
    if (!window.confirm("Retirer cette candidature ? Cette action est irréversible.")) return;
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
        <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
        </div>
      </AppShell>
    );
  }

  if (error || !application) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg py-20 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
            <AlertCircle size={28} />
          </span>
          <h1 className="mt-5 text-xl font-bold text-slate-900">
            {error === "forbidden" ? "Accès refusé" : "Candidature introuvable"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {error === "forbidden"
              ? "Vous n'avez pas les autorisations nécessaires."
              : "Cette candidature n'existe pas ou n'est plus accessible."}
          </p>
          <Link
            to="/opportunites"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <ArrowLeft size={15} /> Retour aux candidatures
          </Link>
        </div>
      </AppShell>
    );
  }

  const cfg = STATUS_CFG[application.status] || STATUS_CFG.sent;
  const currentStep = cfg.step;
  const isWithdrawable = !["accepted", "rejected"].includes(application.status);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl pb-12">
        {/* ============ RETOUR ============ */}
       
        {/* ============================================================
            BLOC 1 : HERO (titre + statut + timeline)
        ============================================================ */}
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-600">
                  Suivi de candidature
                </p>
                <h1 className="text-2xl font-bold leading-tight tracking-tight text-slate-900">
                  {application.job_offer?.title || "Candidature"}
                </h1>
                {application.job_offer?.company && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Building2 size={13} className="text-slate-400" />
                      {application.job_offer.company.name}
                    </span>
                    {application.job_offer.city && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-slate-400" />
                        {application.job_offer.city}
                        {application.job_offer.country && `, ${application.job_offer.country}`}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <span
                className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-semibold ${cfg.tone}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>
          </div>

          {/* Timeline */}
          {application.status !== "rejected" && (
            <div className="px-6 py-6 sm:px-7">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-[13px] font-semibold text-slate-900">Progression du dossier</p>
                <span className="text-[12px] font-medium text-slate-400">
                  Étape {currentStep} / {STEPS.length}
                </span>
              </div>

              <div className="flex items-start justify-between gap-1">
                {STEPS.map((step, i) => {
                  const stepNum = i + 1;
                  const isDone = stepNum <= currentStep;
                  const isCurrent = stepNum === currentStep;

                  return (
                    <React.Fragment key={step.key}>
                      <div className="flex min-w-0 flex-1 flex-col items-center text-center">
                        <div
                          className={`relative flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all ${
                            isDone
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-slate-200 bg-white text-slate-300"
                          } ${isCurrent ? "ring-4 ring-emerald-100" : ""}`}
                        >
                          {isDone ? <Check size={13} strokeWidth={3} /> : <Circle size={7} fill="currentColor" />}
                        </div>
                        <span
                          className={`mt-2 max-w-full truncate text-[11px] font-medium ${
                            isDone ? "text-slate-900" : "text-slate-400"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>

                      {i < STEPS.length - 1 && (
                        <div className="mt-[13px] h-0.5 flex-1 rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              stepNum < currentStep ? "bg-emerald-500" : "bg-transparent"
                            }`}
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* Refus */}
          {application.status === "rejected" && (
            <div className="px-6 py-5 sm:px-7">
              <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-500" />
                <div>
                  <p className="text-[13px] font-bold text-rose-900">Candidature refusée</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-rose-700">
                    Cette candidature n'a pas été retenue. Vous pouvez continuer à explorer les opportunités.
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* ============================================================
            GRILLE 2 COLONNES : Infos + Entretien
        ============================================================ */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_380px]">

          {/* ============ COLONNE GAUCHE ============ */}
          <div className="space-y-5">

            {/* BLOC 2 : INFOS GÉNÉRALES */}
            <Card>
              <CardHeader
                icon={Calendar}
                title="Informations générales"
                subtitle="Récapitulatif de votre candidature"
                tone="blue"
              />
              <div className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Date de candidature
                  </p>
                  <p className="mt-1 text-[13.5px] font-medium text-slate-900">
                    {formatDate(application.created_at, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Statut actuel
                  </p>
                  <p className="mt-1 text-[13.5px] font-medium text-slate-900">{cfg.label}</p>
                </div>
                {application.job_offer?.city && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Localisation
                    </p>
                    <p className="mt-1 text-[13.5px] font-medium text-slate-900">
                      {application.job_offer.city}
                      {application.job_offer.country && `, ${application.job_offer.country}`}
                    </p>
                  </div>
                )}
                {application.job_offer?.offer_type && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Type d'offre
                    </p>
                    <p className="mt-1 text-[13.5px] font-medium text-slate-900">
                      {application.job_offer.offer_type}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* BLOC 3 : LETTRE DE MOTIVATION */}
            {application.cover_letter && (
              <Card>
                <CardHeader
                  icon={FileText}
                  title="Lettre de motivation"
                  subtitle="Le message transmis"
                  tone="slate"
                />
                <div className="p-5">
                  <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
                    <p className="whitespace-pre-line text-[13px] leading-[1.7] text-slate-700">
                      {application.cover_letter}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* BLOC 4 : NOTES RECRUTEUR */}
            {application.recruiter_notes && (
              <Card>
                <CardHeader
                  icon={ShieldCheck}
                  title="Notes du recruteur"
                  subtitle="Retour communiqué"
                  tone="blue"
                />
                <div className="p-5">
                  <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4">
                    <p className="whitespace-pre-line text-[13px] leading-[1.7] text-slate-700">
                      {application.recruiter_notes}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* ============ COLONNE DROITE ============ */}
          <div className="space-y-5">

            {/* BLOC 5 : ENTRETIEN */}
            {application.status === "interview" && application.interview_at && (
              <Card>
                <CardHeader
                  icon={Video}
                  title="Entretien programmé"
                  subtitle="Détails de votre entretien"
                  tone="amber"
                />
                <div className="p-5">
                  <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4">
                    <p className="text-[15px] font-bold capitalize leading-snug text-amber-900">
                      {formatDate(application.interview_at, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-amber-700">
                      <Clock size={14} />
                      À{" "}
                      {new Date(application.interview_at).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>

                    {application.interview_link && (
                      <a
                        href={application.interview_link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-slate-800"
                      >
                        <Video size={13} />
                        Rejoindre l'entretien
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* BLOC 6 : DOCUMENTS */}
            {(application.portfolio || application.cv_path) && (
              <Card>
                <CardHeader
                  icon={FileText}
                  title="Documents joints"
                  subtitle="Pièces de votre candidature"
                  tone="slate"
                />
                <div className="space-y-2.5 p-5">
                  {application.portfolio && (
                    <a
                      href={`http://localhost:5173/portfolio/${application.portfolio.public_slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-emerald-300 hover:bg-emerald-50/40"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <Briefcase size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-semibold text-slate-900">
                          {application.portfolio.title || "Mon portfolio"}
                        </p>
                        <p className="truncate text-[10.5px] text-slate-500">Portfolio</p>
                      </div>
                      <ChevronRight
                        size={14}
                        className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600"
                      />
                    </a>
                  )}

                  {application.cv_path && (
                    <a
                      href={`/storage/${application.cv_path}`}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-blue-300 hover:bg-blue-50/40"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <FileText size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-semibold text-slate-900">
                          Curriculum Vitæ
                        </p>
                        <p className="truncate text-[10.5px] text-slate-500">Fichier PDF</p>
                      </div>
                      <Download
                        size={14}
                        className="shrink-0 text-slate-400 transition group-hover:text-blue-600"
                      />
                    </a>
                  )}
                </div>
              </Card>
            )}

            {/* BLOC 7 : ACTIONS */}
            {isWithdrawable && (
              <Card>
                <div className="p-5">
                  <p className="text-[13px] font-semibold text-slate-900">
                    Retirer ma candidature
                  </p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-500">
                    Action irréversible. Cette candidature sera supprimée définitivement.
                  </p>
                  <button
                    onClick={withdraw}
                    disabled={withdrawing}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-[12.5px] font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 disabled:opacity-50"
                  >
                    {withdrawing ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    {withdrawing ? "Retrait..." : "Retirer ma candidature"}
                  </button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}