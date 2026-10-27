import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Loader2, FileText, Download, Trash2, Upload,
  Check, X, Ban, AlertCircle, Building2, CheckCircle2, MapPin,
  CalendarClock, ShieldCheck, Briefcase, GraduationCap, Clock,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";

const STATUS_CFG = {
  draft:     { label: "Brouillon",  tone: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700" },
  sent:      { label: "Envoyée",    tone: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800" },
  viewed:    { label: "Consultée",  tone: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800" },
  accepted:  { label: "Acceptée",   tone: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800" },
  declined:  { label: "Refusée",    tone: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800" },
  expired:   { label: "Expirée",    tone: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" },
  cancelled: { label: "Annulée",    tone: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" },
};

const DOC_TYPES = {
  contract:   "Contrat",
  agreement:  "Accord",
  attachment: "Pièce jointe",
  other:      "Autre",
};

const INTERVIEW_CFG = {
  pending:   { label: "À planifier",       tone: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" },
  scheduled: { label: "Entretien planifié", tone: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" },
  validated: { label: "Entretien validé",   tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" },
  failed:    { label: "Non concluant",      tone: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300" },
};

const JOB_TYPES = ["emploi", "job", "cdi", "cdd", "first_job"];

const fileSrc = (p) => (!p ? null : /^https?:/.test(p) ? p : `/storage/${p}`);
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—";
const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

const labelCls = "text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500";
const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

function LogoBox({ src, name }) {
  const [failed, setFailed] = useState(false);
  const url = fileSrc(src);
  if (url && !failed) {
    return (
      <img
        src={url}
        alt={name}
        onError={() => setFailed(true)}
        className="h-20 w-20 shrink-0 rounded-2xl border border-slate-100 object-cover shadow-sm dark:border-slate-700"
      />
    );
  }
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-2xl font-bold text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-400">
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

function Section({ title, subtitle, children, right }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export default function ProposalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [proposal, setProposal] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [interviewForm, setInterviewForm] = useState({ interview_at: "", interview_location: "", interview_notes: "" });
  const { toast, show: showToast, close: closeToast } = useToast();

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [propRes, docsRes] = await Promise.all([
        api.get(`/proposals/${id}`),
        api.get("/documents", { params: { documentable_type: "App\\Models\\Proposal", documentable_id: id } }),
      ]);
      setProposal(propRes.data);
      setDocuments(Array.isArray(docsRes.data) ? docsRes.data : (docsRes.data?.data || []));
    } catch (err) {
      setError(err.response?.status === 403 ? "forbidden" : "not_found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const errMsg = (err, fallback = "Erreur") => {
    const errors = err.response?.data?.errors;
    return errors ? Object.values(errors).flat().join(" · ") : err.response?.data?.message || fallback;
  };

  /** Exécute une action API, affiche un toast et recharge sans spinner plein écran */
  const run = async (fn, okMsg) => {
    setActionLoading(true);
    try {
      await fn();
      if (okMsg) showToast(okMsg, "success");
      await load(true);
      return true;
    } catch (err) {
      showToast(errMsg(err), "error");
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const uploadDocument = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("documentable_type", "App\\Models\\Proposal");
      formData.append("documentable_id", id);
      formData.append("document_type", type);
      formData.append("file", file);

      await api.post("/documents", formData, { headers: { "Content-Type": "multipart/form-data" } });
      showToast("✅ Document ajouté", "success");
      await load(true);
    } catch (err) {
      showToast(errMsg(err, "Erreur upload"), "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const deleteDocument = async (docId) => {
    if (!confirm("Supprimer ce document ?")) return;
    try {
      await api.delete(`/documents/${docId}`);
      showToast("Document supprimé", "info");
      await load(true);
    } catch (err) {
      showToast(errMsg(err), "error");
    }
  };

  const doAction = async (action) => {
    if (action === "cancel" && !confirm("Annuler cette proposition ?")) return;
    if (action === "decline" && !confirm("Refuser cette proposition ?")) return;

    setActionLoading(true);
    try {
      const res = await api.post(`/proposals/${id}/${action}`);

      // Flux classique : l'acceptation crée directement la mission
      if (action === "accept" && res.data?.mission?.id) {
        showToast("🎉 Mission créée avec succès !", "success");
        setTimeout(() => navigate(`/missions/${res.data.mission.id}`), 1000);
        return;
      }

      showToast(
        action === "accept"
          ? "✅ Proposition acceptée — l'entreprise va planifier l'entretien"
          : "✅ Action effectuée",
        "success"
      );
      await load(true);
    } catch (err) {
      showToast(errMsg(err), "error");
    } finally {
      setActionLoading(false);
    }
  };

  // ---------- Entretien / période d'essai (recruteur) ----------
  const submitInterview = async (e) => {
    e.preventDefault();
    const ok = await run(() => api.post(`/proposals/${id}/schedule-interview`, interviewForm), "📅 Entretien planifié");
    if (ok) setShowSchedule(false);
  };

  const validateInterview = () => {
    if (!confirm("Valider l'entretien et créer la mission ?")) return;
    run(() => api.post(`/proposals/${id}/validate-interview`), "🎉 Entretien validé — mission créée");
  };

  const rejectInterview = () => {
    if (!confirm("Marquer l'entretien comme non concluant ?")) return;
    run(() => api.post(`/proposals/${id}/reject-interview`), "Entretien marqué comme non concluant");
  };

  const validateTrial = () => {
    if (!proposal?.mission?.id) return;
    if (!confirm("Valider la période d'essai ? Le contrat passera en CDI (sans date de fin).")) return;
    run(() => api.post(`/missions/${proposal.mission.id}/validate-trial`), "🎉 Période d'essai validée — CDI en cours");
  };
    const rejectTrial = () => {
    if (!proposal?.mission?.id) return;
    if (!confirm("Ne pas confirmer le talent ? La collaboration prendra fin.")) return;
    run(() => api.post(`/missions/${proposal.mission.id}/reject-trial`), "Période d'essai non confirmée");
  };

  // ---------- États de chargement / erreur ----------
  if (loading) {
    return (
      <AppShell>
        <main className="flex min-h-[65vh] items-center justify-center bg-[#F5F8FA] dark:bg-[#071521]">
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="animate-spin text-emerald-500" size={25} /> Chargement de la proposition...
          </div>
        </main>
      </AppShell>
    );
  }

  if (error || !proposal) {
    return (
      <AppShell>
        <main className="flex min-h-[70vh] items-center justify-center bg-[#F5F8FA] px-4 dark:bg-[#071521]">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/50 dark:text-rose-400"><AlertCircle size={28} /></span>
            <h1 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">{error === "forbidden" ? "Accès refusé" : "Proposition introuvable"}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{error === "forbidden" ? "Tu n'as pas les autorisations nécessaires." : "Cette proposition n'existe pas ou n'est plus accessible."}</p>
            <Link to="/proposals" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0B1F33] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#16354E] dark:bg-emerald-400 dark:text-[#071521] dark:hover:bg-emerald-300"><ArrowLeft size={15} /> Retour</Link>
          </div>
        </main>
      </AppShell>
    );
  }

  // =====================================================
  // ✅ RÔLES — qui regarde cette proposition ?
  // =====================================================
  const cfg = STATUS_CFG[proposal.status] || STATUS_CFG.sent;
  const isPending = ["sent", "viewed"].includes(proposal.status);

  const myCompanyIds = (user?.companies || []).map((c) => c.id);
  const myProfileId = user?.professional_profile?.id ?? user?.professionalProfile?.id;

  const isMyProfile =
    (myProfileId != null && proposal.professional_profile_id === myProfileId) ||
    proposal.profile?.user?.id === user?.id ||
    proposal.profile?.user_id === user?.id;

  // Proposition faite PAR une entreprise (flux inversé) ou candidature d'un talent (flux classique)
  const proposedByCompany = proposal.proposed_by_company_id != null;

  const isCompanySender    = proposedByCompany && myCompanyIds.includes(proposal.proposed_by_company_id);   // recruteur (inversé)
  const isTalentRecipient  = proposedByCompany && !isCompanySender && isMyProfile;                          // étudiant (inversé)
  const isTalentAuthor     = !proposedByCompany && isMyProfile;                                             // étudiant (classique)
  const isCompanyRecipient = !proposedByCompany && !isMyProfile &&
    (myCompanyIds.includes(proposal.to_company_id) || myCompanyIds.includes(proposal.resource_request?.company_id)); // entreprise (classique)

  const isCompanySide = isCompanySender || isCompanyRecipient;
  const canAnswer = isPending && (isTalentRecipient || isCompanyRecipient);  // Accepter / Refuser
  const canCancel = isPending && (isCompanySender || isTalentAuthor);        // Annuler

  // =====================================================
  // DONNÉES D'AFFICHAGE
  // =====================================================
  // Laravel sérialise les relations en snake_case (proposing_company, to_company…)
  const company = proposedByCompany
    ? (proposal.proposing_company || proposal.proposingCompany)
    : (proposal.to_company || proposal.toCompany || proposal.resource_request?.company);
  const companyName = company?.name || "Entreprise";

  const talentName = proposal.profile?.user?.name || "Le talent";
  const requestTitle = proposal.resource_request?.title || "Demande de ressource";

  const eyebrow = isTalentRecipient ? "Proposition reçue"
    : isCompanySender ? "Proposition envoyée"
    : isTalentAuthor ? "Candidature envoyée"
    : isCompanyRecipient ? "Candidature reçue"
    : "Proposition";

  const heading = isTalentRecipient ? `Proposition de ${companyName}`
    : isCompanySender ? `Proposition envoyée à ${talentName}`
    : isTalentAuthor ? `Candidature chez ${companyName}`
    : isCompanyRecipient ? `Candidature de ${talentName}`
    : `Proposition de ${companyName}`;

  const requestLabel = isTalentRecipient ? "Pour votre besoin :" : isCompanySender ? "Pour son besoin :" : "Pour la demande :";

  // Carte latérale : le talent voit l'entreprise, l'entreprise voit le talent
  const showCompanyCard = isTalentRecipient || isTalentAuthor;
  const sideCard = showCompanyCard
    ? {
        title: isTalentRecipient ? "Entreprise proposante" : "Entreprise concernée",
        subtitle: isTalentRecipient ? "L'entreprise qui vous a contacté" : "L'entreprise destinataire",
        name: companyName,
        logo: company?.logo_path,
        line: company?.city,
        desc: company?.description,
      }
    : {
        title: isCompanySender ? "Talent contacté" : "Candidat",
        subtitle: isCompanySender ? "L'étudiant à qui vous avez proposé" : "La personne qui a postulé",
        name: talentName,
        logo: proposal.profile?.avatar_path,
        line: proposal.profile?.headline,
        desc: null,
      };

  // =====================================================
  // SUIVI RECRUTEMENT (flux inversé, après acceptation)
  // =====================================================
  const mission = proposal.mission;
  const showTracker = proposedByCompany && proposal.status === "accepted";
  const interviewStatus = proposal.interview_status || "pending";
  const contractType = String(proposal.resource_request?.contract_type || "").toLowerCase();
  const kind = proposal.contract_kind || (JOB_TYPES.includes(contractType) ? "job" : "internship");
  const isJob = kind === "job";
  const trialActive = mission?.status === "trial";
  const intCfg = INTERVIEW_CFG[interviewStatus] || INTERVIEW_CFG.pending;

   const missionCancelled = mission?.status === "cancelled";

  const steps = [
    { label: "Proposition acceptée", state: "done" },
    { label: "Entretien", state: interviewStatus === "validated" ? "done" : interviewStatus === "failed" ? "failed" : "current" },
    ...(isJob
      ? [{ label: "Période d'essai", state: !mission ? "todo" : trialActive ? "current" : missionCancelled ? "failed" : "done" }]
      : []),
    {
      label: isJob ? "Salarié (CDI)" : "Mission",
      state: !mission ? "todo" : (isJob && trialActive) || missionCancelled ? "todo" : "done",
    },
  ];

  const stepCls = {
    done: "bg-emerald-500 text-white",
    current: "bg-[#0B1F33] text-white ring-4 ring-emerald-500/20 dark:bg-emerald-400 dark:text-[#071521]",
    failed: "bg-rose-500 text-white",
    todo: "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300",
  };

  const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  return (
    <AppShell>
      <main className="min-h-screen bg-[#F5F8FA] px-4 py-6 transition-colors duration-300 sm:px-6 sm:py-8 lg:px-8 dark:bg-[#071521]">
        <div className="mx-auto max-w-6xl space-y-5">

          {/* HEADER */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-5 py-6 dark:border-slate-800 sm:px-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400">{eyebrow}</p>
                  <h1 className="break-words text-2xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-3xl">{heading}</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Building2 size={14} /> {requestLabel}{" "}
                      <strong className="text-slate-700 dark:text-slate-300">{requestTitle}</strong>
                    </span>
                    {proposedByCompany && (
                      <span className="flex items-center gap-1.5">
                        {isJob ? <Briefcase size={14} /> : <GraduationCap size={14} />}
                        {isJob ? "Emploi (CDI)" : "Stage / mission"}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`inline-flex w-fit shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${cfg.tone}`}>
                  {cfg.label}
                </span>
              </div>
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            {/* ================= COLONNE GAUCHE ================= */}
            <div className="space-y-5">

              {/* INFOS GÉNÉRALES */}
              <Section title="Informations générales">
                <div className="grid gap-5 p-5 sm:grid-cols-2">
                  <div>
                    <p className={labelCls}>Date d'envoi</p>
                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{fmtDate(proposal.created_at)}</p>
                  </div>
                  <div>
                    <p className={labelCls}>Statut actuel</p>
                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{cfg.label}</p>
                  </div>
                  {proposal.expires_at && (
                    <div>
                      <p className={labelCls}>Date d'expiration</p>
                      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{fmtDate(proposal.expires_at)}</p>
                    </div>
                  )}
                  {proposal.match_score != null && (
                    <div>
                      <p className={labelCls}>Score de correspondance</p>
                      <p className="mt-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">{proposal.match_score}% match</p>
                    </div>
                  )}
                  {proposedByCompany && (
                    <div>
                      <p className={labelCls}>Type de recherche</p>
                      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                        {isJob ? "Emploi — CDI avec période d'essai" : "Stage / mission à durée déterminée"}
                      </p>
                    </div>
                  )}
                </div>
              </Section>

              {/* SUIVI DU RECRUTEMENT : ENTRETIEN → (ESSAI) → MISSION */}
              {showTracker && (
                <Section
                  title="Suivi du recrutement"
                  subtitle={isJob ? "Entretien, période d'essai puis CDI" : "Entretien puis création de la mission"}
                  right={<span className={`rounded-full px-3 py-1 text-[11px] font-bold ${intCfg.tone}`}>{intCfg.label}</span>}
                >
                  <div className="space-y-6 p-5">
                    {/* Stepper */}
                    <ol className="flex items-start">
                      {steps.map((s, i) => (
                        <li key={s.label} className="relative flex flex-1 flex-col items-center text-center">
                          {i > 0 && (
                            <span className={`absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 ${steps[i - 1].state === "done" ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"}`} />
                          )}
                          <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${stepCls[s.state]}`}>
                            {s.state === "done" ? <Check size={14} /> : s.state === "failed" ? <X size={14} /> : i + 1}
                          </span>
                          <span className="mt-2 text-[11px] font-semibold leading-tight text-slate-600 dark:text-slate-300">{s.label}</span>
                        </li>
                      ))}
                    </ol>

                    {/* Détails de l'entretien */}
                    {proposal.interview_at && interviewStatus !== "pending" && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-[#0B1F33]">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className={labelCls}>Date et heure</p>
                            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-slate-100">
                              <CalendarClock size={14} /> {fmtDateTime(proposal.interview_at)}
                            </p>
                          </div>
                          <div>
                            <p className={labelCls}>Lieu</p>
                            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-slate-100">
                              <MapPin size={14} /> {proposal.interview_location || "—"}
                            </p>
                          </div>
                        </div>
                        {proposal.interview_notes && (
                          <div className="mt-4">
                            <p className={labelCls}>Informations complémentaires</p>
                            <p className="mt-1 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">{proposal.interview_notes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ---------- VUE RECRUTEUR ---------- */}
                    {isCompanySender && (
                      <>
                        {/* Planifier / replanifier */}
                        {(interviewStatus === "pending" || showSchedule) && (
                          <form onSubmit={submitInterview} className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {interviewStatus === "pending" ? "Planifier l'entretien physique" : "Replanifier l'entretien"}
                            </p>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className={labelCls}>Date et heure *</label>
                                <input
                                  type="datetime-local"
                                  required
                                  min={nowLocal}
                                  value={interviewForm.interview_at}
                                  onChange={(e) => setInterviewForm((f) => ({ ...f, interview_at: e.target.value }))}
                                  className={`${inputCls} mt-1`}
                                />
                              </div>
                              <div>
                                <label className={labelCls}>Lieu *</label>
                                <input
                                  type="text"
                                  required
                                  maxLength={255}
                                  placeholder="Adresse du rendez-vous"
                                  value={interviewForm.interview_location}
                                  onChange={(e) => setInterviewForm((f) => ({ ...f, interview_location: e.target.value }))}
                                  className={`${inputCls} mt-1`}
                                />
                              </div>
                            </div>
                            <div>
                              <label className={labelCls}>Informations complémentaires</label>
                              <textarea
                                rows={3}
                                maxLength={2000}
                                placeholder="Personne à contacter, documents à apporter..."
                                value={interviewForm.interview_notes}
                                onChange={(e) => setInterviewForm((f) => ({ ...f, interview_notes: e.target.value }))}
                                className={`${inputCls} mt-1 resize-y`}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              {showSchedule && (
                                <button type="button" onClick={() => setShowSchedule(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                                  Annuler
                                </button>
                              )}
                              <button type="submit" disabled={actionLoading} className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F33] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#16354E] disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-400">
                                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <CalendarClock size={14} />}
                                Envoyer la convocation
                              </button>
                            </div>
                          </form>
                        )}

                        {/* Entretien planifié : valider / refuser / replanifier */}
                        {interviewStatus === "scheduled" && !showSchedule && (
                          <div className="flex flex-col gap-3 sm:flex-row">
                            <button onClick={validateInterview} disabled={actionLoading} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-400">
                              <Check size={16} /> {isJob ? "Valider l'entretien → période d'essai" : "Valider l'entretien → créer la mission"}
                            </button>
                            <button onClick={rejectInterview} disabled={actionLoading} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900 dark:bg-slate-950 dark:text-rose-400 dark:hover:bg-rose-950/30">
                              <X size={16} /> Non concluant
                            </button>
                            <button onClick={() => setShowSchedule(true)} disabled={actionLoading} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                              <Clock size={16} /> Replanifier
                            </button>
                          </div>
                        )}

                                              {/* Période d'essai (emploi) */}
                        {interviewStatus === "validated" && isJob && trialActive && (
                          <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/20">
                            <p className="flex items-center gap-2 text-sm font-bold text-blue-900 dark:text-blue-200">
                              <ShieldCheck size={16} /> Période d'essai en cours
                              {mission?.trial_ends_at && <span className="font-medium">· jusqu'au {fmtDate(mission.trial_ends_at)}</span>}
                            </p>
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                              À l'issue de l'essai, confirmez le talent : il passera en CDI (sans date de fin) et sera ajouté à vos salariés.
                            </p>
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <button onClick={validateTrial} disabled={actionLoading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-400">
                                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                Confirmer en CDI
                              </button>
                              <button onClick={rejectTrial} disabled={actionLoading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-5 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900 dark:bg-slate-950 dark:text-rose-400 dark:hover:bg-rose-950/30">
                                <X size={16} /> Ne pas confirmer
                              </button>
                            </div>
                          </div>
                        )}

                        {interviewStatus === "validated" && isJob && mission?.status === "active" && (
                          <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                            CDI confirmé : {talentName} est désormais salarié de votre entreprise.
                          </p>
                        )}

                        {interviewStatus === "validated" && isJob && missionCancelled && (
                          <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                            Vous n'avez pas confirmé le talent à l'issue de la période d'essai.
                          </p>
                        )}
                      </>
                    )}

                    {/* ---------- VUE ÉTUDIANT ---------- */}
                    {isTalentRecipient && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-[#0B1F33] dark:text-slate-300">
                        {interviewStatus === "pending" && "Vous avez accepté la proposition. L'entreprise va vous communiquer la date et le lieu de l'entretien."}
                        {interviewStatus === "scheduled" && "Votre entretien est planifié. Présentez-vous à l'adresse indiquée ci-dessus."}
                                               {interviewStatus === "validated" && isJob && trialActive && "Entretien validé : votre période d'essai est en cours. À son terme, l'entreprise pourra vous confirmer en CDI."}
                        {interviewStatus === "validated" && isJob && mission?.status === "active" && "Période d'essai validée : vous êtes désormais salarié en CDI."}
                        {interviewStatus === "validated" && isJob && missionCancelled && "L'entreprise n'a pas confirmé votre embauche à l'issue de la période d'essai."}
                        {interviewStatus === "failed" && "L'entreprise n'a pas donné suite après l'entretien."}
                      </div>
                    )}

                    {interviewStatus === "failed" && isCompanySender && (
                      <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                        Vous avez marqué l'entretien comme non concluant. Le processus est terminé.
                      </p>
                    )}
                  </div>
                </Section>
              )}

              {/* LETTRE D'ACCOMPAGNEMENT */}
              {proposal.message && (
                <Section title="Lettre d'accompagnement" subtitle="Le message transmis avec la proposition">
                  <div className="p-5">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-[#0B1F33] sm:p-5">
                      <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 dark:text-slate-200">{proposal.message}</p>
                    </div>
                  </div>
                </Section>
              )}

              {/* CONDITIONS */}
              {(proposal.conditions || proposal.description) && (
                <Section title="Détails de l'offre">
                  <div className="space-y-4 p-5">
                    {proposal.description && (
                      <div>
                        <p className={labelCls}>Description</p>
                        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{proposal.description}</p>
                      </div>
                    )}
                    {proposal.conditions && (
                      <div>
                        <p className={labelCls}>Conditions</p>
                        <p className="mt-1 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">{proposal.conditions}</p>
                      </div>
                    )}
                  </div>
                </Section>
              )}
            </div>

            {/* ================= COLONNE DROITE ================= */}
            <div className="space-y-5">

              {/* CARTE CONTREPARTIE */}
              <Section title={sideCard.title} subtitle={sideCard.subtitle}>
                <div className="p-5">
                  <div className="flex items-center gap-4">
                    <LogoBox src={sideCard.logo} name={sideCard.name} />
                    <div className="min-w-0">
                      <p className="truncate text-lg font-bold text-slate-900 dark:text-white">{sideCard.name}</p>
                      {sideCard.line && (
                        <p className="mt-1 flex items-center gap-1 truncate text-sm text-slate-500 dark:text-slate-400">
                          {showCompanyCard && <MapPin size={13} />} {sideCard.line}
                        </p>
                      )}
                    </div>
                  </div>
                  {sideCard.desc && (
                    <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                      <p className="line-clamp-3 text-xs text-slate-500 dark:text-slate-400">{sideCard.desc}</p>
                    </div>
                  )}
                </div>
              </Section>

              {/* DOCUMENTS */}
              {(isCompanySide || documents.length > 0) && (
                <Section
                  title="Documents joints"
                  subtitle="Pièces du dossier"
                  right={
                    isCompanySide && (
                      <div className="flex gap-2">
                        <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:border-emerald-500 dark:border-slate-700 dark:text-slate-200 dark:hover:border-emerald-500">
                          <Upload size={12} /> Contrat
                          <input type="file" accept=".pdf,.doc,.docx" className="hidden" disabled={uploading} onChange={(e) => uploadDocument(e, "contract")} />
                        </label>
                        <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-[#0B1F33] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#16354E] dark:bg-emerald-500 dark:hover:bg-emerald-400">
                          <Upload size={12} /> Ajouter
                          <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp" className="hidden" disabled={uploading} onChange={(e) => uploadDocument(e, "attachment")} />
                        </label>
                      </div>
                    )
                  }
                >
                  <div className="space-y-3 p-5">
                    {uploading && (
                      <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
                        <Loader2 size={14} className="animate-spin" /> Upload en cours...
                      </div>
                    )}

                    {documents.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-950/50">
                        <FileText size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">Aucun document joint</p>
                      </div>
                    ) : (
                      documents.map((d) => (
                        <div key={d.id} className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition dark:border-slate-700 dark:bg-slate-950">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            <FileText size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {d.original_name || d.file_path?.split("/").pop() || "Document"}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {DOC_TYPES[d.type] || d.type} · {d.formatted_size || "—"}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <a href={`/api/documents/${d.id}/download`} target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 p-2 hover:border-emerald-500 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-500" title="Télécharger">
                              <Download size={14} />
                            </a>
                            {isCompanySide && d.uploaded_by === user?.id && (
                              <button onClick={() => deleteDocument(d.id)} className="rounded-full border border-slate-200 p-2 hover:border-rose-400 hover:text-rose-500 dark:border-slate-700 dark:text-slate-300" title="Supprimer">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Section>
              )}

              {/* ACTIONS */}
              <div className="flex flex-col gap-3">
                {/* Le DESTINATAIRE répond : étudiant (flux inversé) ou entreprise (candidature reçue) */}
                {canAnswer && (
                  <>
                    <button
                      onClick={() => doAction("accept")}
                      disabled={actionLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                    >
                      <Check size={16} /> Accepter la proposition
                    </button>
                    <button
                      onClick={() => doAction("decline")}
                      disabled={actionLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900 dark:bg-slate-950 dark:text-rose-400 dark:hover:bg-rose-950/30"
                    >
                      <X size={16} /> Refuser
                    </button>
                  </>
                )}

                {/* L'EXPÉDITEUR (entreprise en flux inversé, talent en flux classique) ne peut qu'annuler */}
                {canCancel && (
                  <button
                    onClick={() => doAction("cancel")}
                    disabled={actionLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900 dark:bg-slate-950 dark:text-rose-400 dark:hover:bg-rose-950/30"
                  >
                    <Ban size={16} /> Annuler ma proposition
                  </button>
                )}

                {mission && (
                  <Link
                    to={`/missions/${mission.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B1F33] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#16354E] dark:bg-emerald-400 dark:text-[#071521] dark:hover:bg-emerald-300"
                  >
                    Voir la mission
                  </Link>
                )}
              </div>

              {/* BLOC FÉLICITATIONS — étudiant */}
              {proposal.status === "accepted" && (isTalentRecipient || isTalentAuthor) && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
                      <CheckCircle2 size={20} />
                    </div>
                    <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Proposition acceptée !</h3>
                  </div>
                  <p className="mt-3 text-sm text-emerald-800 dark:text-emerald-300">
                    {isTalentRecipient
                      ? "Vous avez accepté la proposition. Suivez ici l'avancement : entretien, puis mission."
                      : "Félicitations, l'entreprise a accepté votre candidature. Vous pouvez maintenant discuter des détails via la messagerie."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </AppShell>
  );
}