import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Loader2, Clock, Eye, Check, X, Calendar,
  Building2, FileText, Briefcase, UserCheck, Video,
  MapPin, ExternalLink, AlertCircle, Trash2, Download,
} from "lucide-react";
import AppShell from "../../components/layout/AppShell";
import api from "../../services/api";

const STATUS_CFG = {
  sent:        { label: "Envoyée",         icon: Clock,     color: "text-slate-600",   bg: "bg-slate-100",   step: 1 },
  viewed:      { label: "Consultée",       icon: Eye,       color: "text-blue-700",    bg: "bg-blue-100",    step: 2 },
  shortlisted: { label: "Présélectionnée", icon: UserCheck, color: "text-violet-700",  bg: "bg-violet-100",  step: 3 },
  interview:   { label: "Entretien",       icon: Video,     color: "text-amber-700",   bg: "bg-amber-100",   step: 4 },
  accepted:    { label: "Acceptée",        icon: Check,     color: "text-emerald-700", bg: "bg-emerald-100", step: 5 },
  rejected:    { label: "Refusée",         icon: X,         color: "text-rose-700",    bg: "bg-rose-100",    step: 0 },
};

const STEPS = [
  { key: "sent",        label: "Envoyée",         icon: Clock },
  { key: "viewed",      label: "Consultée",       icon: Eye },
  { key: "shortlisted", label: "Présélectionnée", icon: UserCheck },
  { key: "interview",   label: "Entretien",       icon: Video },
  { key: "accepted",    label: "Décision",        icon: Check },
];

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    api.get(`/applications/${id}`)
      .then((res) => setApplication(res.data))
      .catch((err) => setError(err.response?.status === 403 ? "forbidden" : "not_found"))
      .finally(() => setLoading(false));
  }, [id]);

  const withdraw = async () => {
    if (!confirm("Retirer cette candidature ? Cette action est irréversible.")) return;
    setWithdrawing(true);
    try {
      await api.delete(`/applications/${id}`);
      navigate("/opportunites");
    } catch (err) {
      alert(err.response?.data?.message || "Erreur");
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
        </div>
      </AppShell>
    );
  }

  if (error || !application) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl py-20 text-center">
          <AlertCircle size={40} className="mx-auto text-slate-300" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            {error === "forbidden" ? "Accès refusé" : "Candidature introuvable"}
          </h1>
          <Link to="/opportunites" className="mt-6 inline-block rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white">
            ← Retour aux candidatures
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
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={15} /> Retour
        </button>

        {/* Header */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-gradient-to-br from-emerald-50 to-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  Candidature
                </p>
                <h1 className="mt-1 text-2xl font-bold text-slate-900">
                  {application.job_offer?.title}
                </h1>
                {application.job_offer?.company && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                    <Building2 size={14} /> {application.job_offer.company.name}
                  </p>
                )}
              </div>

              <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${cfg.bg} ${cfg.color}`}>
                <cfg.icon size={16} /> {cfg.label}
              </div>
            </div>
          </div>

          {/* Timeline */}
          {application.status !== "rejected" ? (
            <div className="border-b border-slate-100 p-6">
              <p className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-400">
                Progression
              </p>
              <div className="relative flex items-center justify-between">
                <div className="absolute left-0 right-0 top-5 -z-0 h-0.5 bg-slate-200">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                  />
                </div>

                {STEPS.map((step, idx) => {
                  const stepNum = idx + 1;
                  const isDone = stepNum <= currentStep;
                  const isCurrent = stepNum === currentStep;
                  const Icon = step.icon;

                  return (
                    <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
                          isDone
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-300 bg-white text-slate-400"
                        } ${isCurrent ? "ring-4 ring-emerald-500/20" : ""}`}
                      >
                        <Icon size={16} />
                      </div>
                      <span className={`text-[10px] font-semibold ${isDone ? "text-emerald-700" : "text-slate-400"}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="border-b border-slate-100 bg-rose-50 p-6">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="shrink-0 text-rose-500" />
                <div>
                  <p className="font-semibold text-rose-900">Candidature refusée</p>
                  <p className="mt-1 text-sm text-rose-700">
                    Cette candidature n'a pas été retenue.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Informations */}
          <div className="grid gap-6 p-6 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                Date de candidature
              </p>
              <p className="flex items-center gap-2 text-sm text-slate-700">
                <Calendar size={14} className="text-slate-400" />
                {new Date(application.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            </div>

            {application.job_offer?.city && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Localisation
                </p>
                <p className="flex items-center gap-2 text-sm text-slate-700">
                  <MapPin size={14} className="text-slate-400" />
                  {application.job_offer.city}
                  {application.job_offer.country && `, ${application.job_offer.country}`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ✅ Entretien programmé */}
        {application.status === "interview" && application.interview_at && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-700">
              <Video size={13} /> Entretien programmé
            </p>
            <p className="text-lg font-bold text-amber-900">
              {new Date(application.interview_at).toLocaleDateString("fr-FR", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </p>
            <p className="text-amber-800">
              à {new Date(application.interview_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </p>

            {application.interview_link && (
              <a
                href={application.interview_link}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-600"
              >
                Rejoindre l'entretien <ExternalLink size={14} />
              </a>
            )}

            {application.interview_notes && (
              <div className="mt-4 rounded-lg border border-amber-300/50 bg-white/60 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                  Notes du recruteur
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-amber-900">
                  {application.interview_notes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ✅ Documents joints — CORRIGÉ */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {application.portfolio && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                <Briefcase size={12} /> Portfolio joint
              </p>
              <p className="font-semibold text-slate-900">{application.portfolio.title}</p>

              {/* ✅ Lien sécurisé vers le portfolio public */}
              <a
                href={`http://localhost:5173/portfolio/${application.portfolio.public_slug}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                Voir le portfolio <ExternalLink size={12} />
              </a>
            </div>
          )}

          {application.cv_path && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                <FileText size={12} /> CV joint
              </p>
              {/* ✅ FIX : Nom du fichier au lieu du hash */}
              <p className="font-semibold text-slate-900">
                Mon CV.pdf
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                Document PDF
              </p>

              <a
                href={`http://localhost:8000/storage/${application.cv_path}`}
                target="_blank"
                rel="noreferrer"
                download
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                <Download size={13} /> Télécharger le CV
              </a>
            </div>
          )}
        </div>

        {/* Lettre de motivation */}
        {application.cover_letter && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
              Lettre de motivation
            </p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {application.cover_letter}
            </p>
          </div>
        )}

        {/* Notes recruteur */}
        {application.recruiter_notes && (
          <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-blue-600">
              Notes du recruteur
            </p>
            <p className="whitespace-pre-line text-sm text-blue-900">
              {application.recruiter_notes}
            </p>
          </div>
        )}

        {/* Actions */}
        {isWithdrawable && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={withdraw}
              disabled={withdrawing}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-5 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
            >
              <Trash2 size={14} />
              {withdrawing ? "Retrait..." : "Retirer ma candidature"}
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}