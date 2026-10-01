import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Loader2, Mail, Phone, Briefcase, Calendar,
  Check, X, Video, UserCheck, Eye, FileText, Download, ExternalLink,
  Building2, Users, Send,
} from "lucide-react";
import AppShell from "../../components/layout/AppShell";
import ScheduleInterviewModal from "../../components/ScheduleInterviewModal";
import api from "../../services/api";
import { useToast } from "../../hooks/useToast";
import Toast from "../../components/ui/Toast";

const STATUS_CFG = {
  sent:        { label: "Envoyée",         icon: Send,      color: "text-slate-400",   bg: "bg-slate-500/10 border-slate-500/30" },
  viewed:      { label: "Consultée",       icon: Eye,       color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/30" },
  shortlisted: { label: "Présélectionnée", icon: UserCheck, color: "text-violet-400",  bg: "bg-violet-500/10 border-violet-500/30" },
  interview:   { label: "Entretien",       icon: Video,     color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30" },
  accepted:    { label: "Acceptée",        icon: Check,     color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  rejected:    { label: "Refusée",         icon: X,         color: "text-rose-400",    bg: "bg-rose-500/10 border-rose-500/30" },
};

export default function OfferApplications() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [interviewModal, setInterviewModal] = useState(null); // ✅ NOUVEAU
  const [filter, setFilter] = useState("all");
  const { toast, show: showToast, close: closeToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/job-offers/${id}/applications`);
      setData(res.data);
    } catch {
      showToast("Impossible de charger les candidatures", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const updateStatus = async (applicationId, newStatus) => {
    try {
      await api.patch(`/applications/${applicationId}/status`, { status: newStatus });
      showToast("Statut mis à jour ✅", "success");
      load();
      setSelected(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur", "error");
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-emerald-400" size={32} />
        </div>
      </AppShell>
    );
  }

  if (!data) return null;

  const { job_offer: offer, applications, stats } = data;

  const filtered = filter === "all"
    ? applications
    : applications.filter((a) => a.status === filter);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">

        <button
          onClick={() => navigate("/my-offers")}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={15} /> Retour à mes offres
        </button>

        {/* Header offre */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
            Candidatures reçues
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">{offer.title}</h1>
          {offer.company && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
              <Building2 size={13} /> {offer.company.name}
            </p>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { key: "total",       label: "Total",           color: "text-white" },
              { key: "sent",        label: "Envoyées",        color: "text-slate-300" },
              { key: "viewed",      label: "Consultées",      color: "text-blue-400" },
              { key: "shortlisted", label: "Présélectionnées", color: "text-violet-400" },
              { key: "interview",   label: "Entretiens",      color: "text-amber-400" },
              { key: "accepted",    label: "Acceptées",       color: "text-emerald-400" },
            ].map((s) => (
              <div key={s.key} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{s.label}</p>
                <p className={`mt-1 text-2xl font-bold ${s.color}`}>{stats[s.key] || 0}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-5 flex flex-wrap gap-2">
          {[
            { key: "all", label: "Toutes" },
            { key: "viewed", label: "Consultées" },
            { key: "shortlisted", label: "Présélectionnées" },
            { key: "interview", label: "Entretiens" },
            { key: "accepted", label: "Acceptées" },
            { key: "rejected", label: "Refusées" },
          ].map((f) => {
            const count = f.key === "all" ? applications.length : applications.filter((a) => a.status === f.key).length;
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-emerald-500 bg-emerald-500 text-[#0A1229]"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25 hover:text-white"
                }`}
              >
                {f.label}
                {count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    active ? "bg-black/20 text-[#0A1229]" : "bg-white/10 text-slate-400"
                  }`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-14 text-center">
            <Users size={40} className="mx-auto text-slate-500" />
            <p className="mt-3 font-semibold text-white">Aucune candidature</p>
            <p className="mt-1 text-sm text-slate-500">
              {filter === "all" ? "Les candidats apparaîtront ici." : "Aucune candidature dans cette catégorie."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((app) => {
              const cfg = STATUS_CFG[app.status] || STATUS_CFG.sent;
              const Icon = cfg.icon;
              const user = app.profile?.user;

              return (
                <button
                  key={app.id}
                  onClick={() => setSelected(app)}
                  className="group flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-emerald-500/40 hover:bg-white/[0.06]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-lg font-bold text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-white">{user?.name || "Candidat"}</h3>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
                        <Icon size={10} /> {cfg.label}
                      </span>
                    </div>
                    {app.profile?.headline && (
                      <p className="mt-0.5 text-sm text-slate-400">{app.profile.headline}</p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(app.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </span>
                      {app.portfolio && (
                        <span className="flex items-center gap-1"><Briefcase size={11} /> Portfolio joint</span>
                      )}
                      {app.cv_path && (
                        <span className="flex items-center gap-1"><FileText size={11} /> CV joint</span>
                      )}
                    </div>
                  </div>

                  <span className="text-xs text-emerald-400 opacity-0 transition group-hover:opacity-100">
                    Voir →
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal détail candidature */}
      {selected && (
        <ApplicationDetailModal
          application={selected}
          onClose={() => setSelected(null)}
          onUpdateStatus={updateStatus}
          onOpenInterviewModal={(app) => {
            setSelected(null);
            setInterviewModal(app);
          }}
        />
      )}

      {/* ✅ Modal Programmer entretien */}
      {interviewModal && (
        <ScheduleInterviewModal
          application={interviewModal}
          onClose={() => setInterviewModal(null)}
          onSuccess={() => {
            setInterviewModal(null);
            showToast("Entretien programmé et invitation envoyée", "success");
            load();
          }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </AppShell>
  );
}

// ============================================
// MODAL DÉTAIL CANDIDATURE
// ============================================
function ApplicationDetailModal({ application, onClose, onUpdateStatus, onOpenInterviewModal }) {
  const user = application.profile?.user;
  const [notes, setNotes] = useState(application.recruiter_notes || "");
  const [saving, setSaving] = useState(false);

  const handleStatus = async (newStatus) => {
    // ✅ Si c'est "interview" → ouvrir le modal de programmation
    if (newStatus === "interview") {
      onOpenInterviewModal(application);
      return;
    }
    // Sinon, appel API classique
    await onUpdateStatus(application.id, newStatus);
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      await api.patch(`/applications/${application.id}/status`, {
        status: application.status,
        recruiter_notes: notes,
      });
    } finally {
      setSaving(false);
    }
  };

  const cfg = STATUS_CFG[application.status] || STATUS_CFG.sent;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0F1E45] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-[#0F1E45] p-6">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-xl font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-white">{user?.name || "Candidat"}</h2>
              {application.profile?.headline && (
                <p className="truncate text-sm text-slate-400">{application.profile.headline}</p>
              )}
              <span className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
                <cfg.icon size={10} /> {cfg.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-6">

          <section>
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">Contact</h3>
            <div className="flex flex-wrap gap-3">
              {user?.email && (
                <a href={`mailto:${user.email}`} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300">
                  <Mail size={13} /> {user.email}
                </a>
              )}
              {user?.phone && (
                <a href={`tel:${user.phone}`} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300">
                  <Phone size={13} /> {user.phone}
                </a>
              )}
            </div>
          </section>

          {application.cover_letter && (
            <section>
              <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">Lettre de motivation</h3>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
                  {application.cover_letter}
                </p>
              </div>
            </section>
          )}

          <section>
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">Documents joints</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {application.portfolio && (
                <a
                  href={`/portfolio/${application.portfolio.public_slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 transition hover:bg-emerald-500/20"
                >
                  <Briefcase size={18} className="text-emerald-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">Portfolio</p>
                    <p className="truncate text-xs text-slate-400">{application.portfolio.title}</p>
                  </div>
                  <ExternalLink size={13} className="text-emerald-400" />
                </a>
              )}
              {application.cv_path && (
                <a
                  href={`http://localhost:8000/storage/${application.cv_path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 transition hover:bg-rose-500/20"
                >
                  <FileText size={18} className="text-rose-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">CV</p>
                    <p className="text-xs text-slate-400">Cliquez pour télécharger</p>
                  </div>
                  <Download size={13} className="text-rose-400" />
                </a>
              )}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">Notes internes</h3>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Vos notes sur ce candidat (visible uniquement par votre équipe)..."
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            {notes !== (application.recruiter_notes || "") && (
              <button
                onClick={saveNotes}
                disabled={saving}
                className="mt-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
              >
                {saving ? "Enregistrement..." : "Enregistrer les notes"}
              </button>
            )}
          </section>
        </div>

        {/* Actions statut */}
        <div className="border-t border-white/10 bg-[#0F1E45] p-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Actions — changer le statut
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "viewed",      label: "Consultée",        icon: Eye,       color: "border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20" },
              { key: "shortlisted", label: "Présélectionner",  icon: UserCheck, color: "border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20" },
              { key: "interview",   label: "Inviter à un entretien", icon: Video, color: "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20" },
              { key: "accepted",    label: "Accepter",         icon: Check,     color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20" },
              { key: "rejected",    label: "Refuser",          icon: X,         color: "border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20" },
            ].map(({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                onClick={() => handleStatus(key)}
                disabled={application.status === key}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:opacity-40 ${color}`}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          {application.status === "interview" && application.interview_at && (
            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              <p className="font-semibold">📅 Entretien programmé</p>
              <p className="mt-1 text-amber-300/80">
                {new Date(application.interview_at).toLocaleDateString("fr-FR", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                })} à {new Date(application.interview_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </p>
              {application.interview_link && (
                <a
                  href={application.interview_link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 font-semibold text-amber-300 underline"
                >
                  Rejoindre le lien visio <ExternalLink size={11} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}