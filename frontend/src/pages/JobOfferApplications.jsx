import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Loader2, Clock, Eye, Check, X, UserCheck, Video,
  Briefcase, FileText, ExternalLink, Calendar, AlertCircle,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import ScheduleInterviewModal from "../components/ScheduleInterviewModal";
import api from "../services/api";

const STATUS_CFG = {
  sent:        { label: "Envoyée",         icon: Clock,     tone: "border-white/10 bg-white/5 text-slate-300" },
  viewed:      { label: "Consultée",       icon: Eye,       tone: "border-blue-500/30 bg-blue-500/10 text-blue-300" },
  shortlisted: { label: "Présélectionnée", icon: UserCheck, tone: "border-violet-500/30 bg-violet-500/10 text-violet-300" },
  interview:   { label: "Entretien",       icon: Video,     tone: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
  accepted:    { label: "Acceptée",        icon: Check,     tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
  rejected:    { label: "Refusée",         icon: X,         tone: "border-rose-500/30 bg-rose-500/10 text-rose-300" },
};

export default function JobOfferApplications() {
  const { id } = useParams();
  const [applications, setApplications] = useState([]);
  const [offerTitle, setOfferTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [interviewModal, setInterviewModal] = useState(null);
  const [toast, setToast] = useState(null);

  const flash = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    api.get(`/job-offers/${id}/applications`)
      .then((res) => {
        const list = res.data.data || res.data || [];
        setApplications(list);
        setOfferTitle(list[0]?.job_offer?.title || "");
      })
      .catch(() => flash("Erreur de chargement", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const updateStatus = async (applicationId, status) => {
    try {
      await api.patch(`/applications/${applicationId}/status`, { status });
      flash("Statut mis à jour");
      load();
    } catch (err) {
      flash(err.response?.data?.message || "Erreur", "error");
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <Link to="/job-offers" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
          <ArrowLeft size={15} /> Retour aux offres
        </Link>

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Candidatures reçues</p>
          <h1 className="mt-1 text-2xl font-bold text-white">{offerTitle || "Offre"}</h1>
        </div>

        {toast && (
          <div className={`mb-4 rounded-lg border px-4 py-2.5 text-sm font-medium ${
            toast.type === "error"
              ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          }`}>
            {toast.msg}
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="animate-spin text-emerald-400" size={32} />
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-14 text-center">
            <p className="font-semibold text-white">Aucune candidature pour l'instant</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => {
              const cfg = STATUS_CFG[app.status] || STATUS_CFG.sent;
              const Icon = cfg.icon;
              const applicant = app.profile?.user;

              return (
                <div key={app.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${cfg.tone}`}>
                          <Icon size={11} /> {cfg.label}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(app.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white">{applicant?.name || "Candidat"}</h3>
                      <p className="mt-1 text-sm text-slate-400">{applicant?.email}</p>

                      {/* ✅ FIX : Balises <a> correctement fermées */}
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                        {app.portfolio && (
                          <a
                            href={`/portfolio/${app.portfolio.public_slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                          >
                            <Briefcase size={11} /> Portfolio <ExternalLink size={10} />
                          </a>
                        )}
                        {app.cv_path && (
                          <a
                            href={`http://localhost:8000/storage/${app.cv_path}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                          >
                            <FileText size={11} /> CV <ExternalLink size={10} />
                          </a>
                        )}
                      </div>

                      {app.status === "interview" && app.interview_at && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                          <Calendar size={12} />
                          Entretien le {new Date(app.interview_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                          {" à "}
                          {new Date(app.interview_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {app.status === "sent" && (
                        <ActionBtn onClick={() => updateStatus(app.id, "viewed")}>Marquer consultée</ActionBtn>
                      )}
                      {["sent", "viewed"].includes(app.status) && (
                        <ActionBtn onClick={() => updateStatus(app.id, "shortlisted")}>Présélectionner</ActionBtn>
                      )}
                      {["sent", "viewed", "shortlisted"].includes(app.status) && (
                        <ActionBtn accent onClick={() => setInterviewModal(app)}>
                          <Video size={13} /> Proposer un entretien
                        </ActionBtn>
                      )}
                      {!["accepted", "rejected"].includes(app.status) && (
                        <>
                          <ActionBtn onClick={() => updateStatus(app.id, "accepted")}>Accepter</ActionBtn>
                          <ActionBtn danger onClick={() => updateStatus(app.id, "rejected")}>Refuser</ActionBtn>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {interviewModal && (
        <ScheduleInterviewModal
          application={interviewModal}
          onClose={() => setInterviewModal(null)}
          onSuccess={() => {
            setInterviewModal(null);
            flash("Entretien programmé et invitation envoyée");
            load();
          }}
        />
      )}
    </AppShell>
  );
}

function ActionBtn({ children, onClick, accent, danger }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
        danger
          ? "border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
          : accent
          ? "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
          : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}