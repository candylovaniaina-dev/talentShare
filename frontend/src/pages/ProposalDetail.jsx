import React, { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Loader2, AlertCircle, Check, X, FileText, 
  CheckCircle2, XCircle, RefreshCw, Calendar, MessageSquare, 
  Briefcase, User, Eye, ChevronDown, ChevronUp, Send
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import SuccessOverlay from "../components/requests/SuccessOverlay";

/* ============================================================
   CONSTANTES
============================================================ */
const STATUS_CFG = {
  draft:     { label: "Brouillon", tone: "bg-slate-100 text-slate-600" },
  sent:      { label: "Envoyée",   tone: "bg-amber-100 text-amber-700" },
  viewed:    { label: "Consultée", tone: "bg-blue-100 text-blue-700" },
  accepted:  { label: "Acceptée",  tone: "bg-teal-100 text-teal-700" },
  declined:  { label: "Refusée",   tone: "bg-rose-100 text-rose-700" },
  expired:   { label: "Expirée",   tone: "bg-slate-100 text-slate-500" },
  cancelled: { label: "Annulée",   tone: "bg-slate-100 text-slate-500" },
};

const INTERVIEW_CFG = {
  pending:   { label: "À planifier",        tone: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" },
  scheduled: { label: "Entretien planifié", tone: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" },
  validated: { label: "Entretien validé",   tone: "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300" },
  failed:    { label: "Non concluant",      tone: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300" },
};

const DOC_TYPES = { contract: "Contrat", agreement: "Accord", attachment: "Pièce jointe", other: "Autre" };

const CONTRACT_LABELS = {
  stage: "Stage", alternance: "Alternance", emploi: "Emploi (CDI)", cdi: "CDI", cdd: "CDD",
  job: "Emploi (CDI)", first_job: "Premier emploi", mission: "Mission freelance",
};
const MISSION_TYPE_LABELS = {
  staffing: "Mise à disposition", punctual: "Mission ponctuelle", freelance: "Prestation freelance",
};
const LEVEL_LABEL = { beginner: "Débutant", intermediate: "Intermédiaire", advanced: "Avancé", expert: "Expert" };

const PERMANENT_TYPES = ["emploi", "job", "cdi", "first_job"];
const FIXED_TERM_TYPES = ["cdd"];

/* ============================================================
   HELPERS
============================================================ */
const fileSrc = (p) => (!p ? null : /^https?:/.test(p) ? p : `/storage/${p}`);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "Non précisée";
const fmtDateShort = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "";
const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "Non précisé";

const durationText = (start, end) => {
  if (!start || !end) return null;
  const a = new Date(start);
  const b = new Date(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return null;
  const days = Math.round((b - a) / 86400000) + 1;
  if (days < 31) return `${days} jour${days > 1 ? "s" : ""}`;
  const months = Math.round(days / 30.44);
  if (months < 24) return `${months} mois`;
  return `${(months / 12).toFixed(1).replace(".0", "")} ans`;
};

const safeParseArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const tagLabel = (t) => (typeof t === "string" ? t : t?.name || t?.label || "");

const cardCls = "rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900";
const labelCls = "text-xs font-medium text-slate-500 dark:text-slate-400";
const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#16B8B1] focus:bg-white focus:ring-4 focus:ring-[#16B8B1]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

/* ============================================================
   PETITS COMPOSANTS
============================================================ */
const BTN_VARIANTS = {
  primary: "bg-[#16B8B1] text-[#0B1F33] hover:bg-[#0F9691] hover:text-white shadow-[0_4px_14px_rgba(22,184,177,0.25)]",
  dark: "bg-[#0B1F33] text-white hover:bg-[#16354E] shadow-md dark:bg-[#16B8B1] dark:text-[#0B1F33] dark:hover:bg-[#0F9691]",
  outline:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800",
  danger:
    "border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:border-rose-900 dark:bg-transparent dark:text-rose-400 dark:hover:bg-rose-950/30",
  dangerSolid: "bg-rose-600 text-white hover:bg-rose-700 shadow-md",
};

function Btn({ variant = "dark", className = "", as: As = "button", children, ...props }) {
  const extra = As === "button" ? { type: props.type || "button" } : {};
  return (
    <As
      {...extra}
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${BTN_VARIANTS[variant]} ${className}`}
    >
      {children}
    </As>
  );
}

function Section({ title, subtitle, right, children }) {
  return (
    <section className={`${cardCls} overflow-hidden shadow-sm`}>
      <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-2.5 last:border-0 dark:border-slate-800">
      <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="break-words text-sm font-semibold text-slate-800 dark:text-slate-100">{children}</dd>
    </div>
  );
}

function LogoBox({ src, name }) {
  const [failed, setFailed] = useState(false);
  const url = fileSrc(src);
  if (url && !failed) {
    return (
      <img
        src={url}
        alt={name}
        onError={() => setFailed(true)}
        className="h-16 w-16 shrink-0 rounded-2xl border border-slate-100 object-cover shadow-sm dark:border-slate-700"
      />
    );
  }
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-xl font-bold text-teal-700 dark:bg-teal-950/50 dark:text-teal-400">
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

// ✅ NOUVEAU COMPOSANT : Texte avec "Voir plus / Voir moins"
function CollapsibleText({ text, limit = 250, className = "" }) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!text) return null;
  
  const isLong = text.length > limit;
  const displayedText = isExpanded ? text : `${text.slice(0, limit)}${isLong ? "..." : ""}`;

  return (
    <div className={className}>
      <p className="whitespace-pre-line break-words text-sm leading-7 text-slate-700 dark:text-slate-300">
        {displayedText}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#16B8B1] hover:text-[#0F9691] transition-colors"
        >
          {isExpanded ? (
            <>Voir moins <ChevronUp size={14} /></>
          ) : (
            <>Voir plus <ChevronDown size={14} /></>
          )}
        </button>
      )}
    </div>
  );
}

function ConfirmModal({ config, onClose }) {
  if (!config) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{config.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{config.message}</p>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/50">
          <Btn variant="outline" onClick={onClose}>Annuler</Btn>
          <Btn variant={config.tone || "primary"} onClick={config.onConfirm}>{config.confirmText || "Confirmer"}</Btn>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */
export default function ProposalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const trackerRef = useRef(null);

  const [proposal, setProposal] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    interview_at: "",
    interview_mode: "visio",
    interview_location: "",
    interview_notes: "",
  });

  const [confirmModal, setConfirmModal] = useState(null);
  const [showConvocationSuccess, setShowConvocationSuccess] = useState(false);
  const [missionSuccess, setMissionSuccess] = useState(null); // { missionId, title, subtitle }

  const { toast, show: showToast, close: closeToast } = useToast();

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [propRes, docsRes] = await Promise.all([
        api.get(`/proposals/${id}`),
        api.get("/documents", { params: { documentable_type: "App\\Models\\Proposal", documentable_id: id } }),
      ]);
      setProposal(propRes.data);
      setDocuments(Array.isArray(docsRes.data) ? docsRes.data : docsRes.data?.data || []);
    } catch (err) {
      setError(err.response?.status === 403 ? "forbidden" : "not_found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const errMsg = (err, fallback = "Une erreur est survenue") => {
    const errors = err.response?.data?.errors;
    return errors ? Object.values(errors).flat().join(" · ") : err.response?.data?.message || fallback;
  };

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

  /* ---------- Documents ---------- */
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
      showToast("Document ajouté", "success");
      await load(true);
    } catch (err) {
      showToast(errMsg(err, "Impossible d'ajouter le document"), "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const downloadDocument = async (doc) => {
    try {
      const res = await api.get(`/documents/${doc.id}/download`, { responseType: "blob" });
      const name = doc.original_name || doc.file_path?.split("/").pop() || "document";
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Téléchargement impossible. Vérifiez que vous avez accès à ce document.", "error");
    }
  };

  const deleteDocument = (docId) => {
    setConfirmModal({
      title: "Supprimer ce document ?",
      message: "Cette action est irréversible.",
      confirmText: "Supprimer",
      tone: "dangerSolid",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await api.delete(`/documents/${docId}`);
          showToast("Document supprimé", "info");
          await load(true);
        } catch (err) {
          showToast(errMsg(err), "error");
        }
      },
    });
  };

  /* ---------- Actions sur la proposition ---------- */
  const executeAction = async (action) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/proposals/${id}/${action}`);
      if (action === "accept" && res.data?.mission?.id) {
        showToast("Mission créée", "success");
        setTimeout(() => navigate(`/missions/${res.data.mission.id}`), 1000);
        return;
      }
      showToast(
        action === "accept" ? "Proposition acceptée. L'entreprise va planifier l'entretien." : "Action effectuée",
        "success"
      );
      await load(true);
    } catch (err) {
      showToast(errMsg(err), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const doAction = (action) => {
    const configs = {
      cancel: {
        title: "Retirer cette proposition ?",
        message: "Elle sera retirée définitivement.",
        confirmText: "Retirer",
        tone: "dangerSolid",
      },
      decline: {
        title: "Refuser ?",
        message: "Le processus s'arrêtera ici pour ce dossier.",
        confirmText: "Refuser",
        tone: "dangerSolid",
      },
    };
    if (configs[action]) {
      setConfirmModal({
        ...configs[action],
        onConfirm: async () => {
          setConfirmModal(null);
          await executeAction(action);
        },
      });
      return;
    }
    executeAction(action);
  };

  const submitInterview = async (e) => {
    e.preventDefault();
    const payload = {
      ...interviewForm,
      interview_location: interviewForm.interview_mode === "visio" ? null : interviewForm.interview_location,
    };
    setActionLoading(true);
    try {
      await api.post(`/proposals/${id}/schedule-interview`, payload);
      setShowSchedule(false);
      setShowConvocationSuccess(true);
      await load(true);
    } catch (err) {
      showToast(errMsg(err), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const rejectInterview = () => {
    setConfirmModal({
      title: "Entretien non concluant ?",
      message: "Le dossier sera clôturé pour ce talent et il en sera informé. Cette action est irréversible.",
      confirmText: "Clôturer le dossier",
      tone: "dangerSolid",
      onConfirm: async () => {
        setConfirmModal(null);
        await run(() => api.post(`/proposals/${id}/reject-interview`), "Dossier clôturé");
      },
    });
  };

  const validateTrial = () => {
    if (!proposal?.mission?.id) return;
    setConfirmModal({
      title: "Confirmer le talent en CDI ?",
      message: "Le contrat passera en CDI, sans date de fin, et le talent sera ajouté à vos salariés.",
      confirmText: "Confirmer en CDI",
      tone: "primary",
      onConfirm: async () => {
        setConfirmModal(null);
        await run(() => api.post(`/missions/${proposal.mission.id}/validate-trial`), "Période d'essai validée, CDI en cours");
      },
    });
  };

  const rejectTrial = () => {
    if (!proposal?.mission?.id) return;
    setConfirmModal({
      title: "Ne pas confirmer le talent ?",
      message: "La collaboration prendra fin immédiatement.",
      confirmText: "Ne pas confirmer",
      tone: "dangerSolid",
      onConfirm: async () => {
        setConfirmModal(null);
        await run(() => api.post(`/missions/${proposal.mission.id}/reject-trial`), "Période d'essai non confirmée");
      },
    });
  };

  /* ============================================================
     ÉTATS DE CHARGEMENT / ERREUR
  ============================================================ */
  if (loading) {
    return (
      <AppShell>
        <main className="flex min-h-[65vh] items-center justify-center bg-[#F5F8FA] dark:bg-[#071521]">
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="animate-spin text-[#16B8B1]" size={22} /> Chargement de la proposition
          </div>
        </main>
      </AppShell>
    );
  }

  if (error || !proposal) {
    return (
      <AppShell>
        <main className="flex min-h-[70vh] items-center justify-center bg-[#F5F8FA] px-4 dark:bg-[#071521]">
          <div className={`${cardCls} w-full max-w-lg p-8 text-center`}>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-rose-50 text-rose-500 dark:bg-rose-950/50">
              <AlertCircle size={26} />
            </span>
            <h1 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
              {error === "forbidden" ? "Accès refusé" : "Proposition introuvable"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {error === "forbidden"
                ? "Vous n'avez pas les autorisations nécessaires pour voir cette proposition."
                : "Cette proposition n'existe pas ou n'est plus accessible."}
            </p>
            <Btn as={Link} to="/collaborations" variant="dark" className="mt-6">Retour aux collaborations</Btn>
          </div>
        </main>
      </AppShell>
    );
  }

  /* ============================================================
     DONNÉES DÉRIVÉES
  ============================================================ */
  const req = proposal.resource_request || {};
  const mission = proposal.mission;

  const isPending = ["sent", "viewed"].includes(proposal.status);
  const myCompanyIds = (user?.companies || []).map((c) => c.id);
  const myProfileId = user?.professional_profile?.id ?? user?.professionalProfile?.id;

  const isMyProfile =
    (myProfileId != null && proposal.professional_profile_id === myProfileId) ||
    proposal.profile?.user?.id === user?.id ||
    proposal.profile?.user_id === user?.id;

  const proposedByCompany = proposal.proposed_by_company_id != null;
  const isCompanySender = proposedByCompany && myCompanyIds.includes(proposal.proposed_by_company_id);
  const isTalentRecipient = proposedByCompany && !isCompanySender && isMyProfile;
  const isTalentAuthor = !proposedByCompany && isMyProfile;
  const isCompanyRecipient =
    !proposedByCompany &&
    !isMyProfile &&
    (myCompanyIds.includes(proposal.to_company_id) || myCompanyIds.includes(req.company_id));

  const isCompanySide = isCompanySender || isCompanyRecipient;
  const isTalentApplication = !proposedByCompany && !!proposal.resource_request_id && req.author_type !== "talent";
  const isInterviewManager = isCompanySender || (isCompanyRecipient && isTalentApplication);
  const isInterviewTalent = isTalentRecipient || (isTalentAuthor && isTalentApplication);

  const canAnswer = isPending && (isTalentRecipient || isCompanyRecipient);
  const canCancel = isPending && (isCompanySender || isTalentAuthor);

  const company = proposedByCompany
    ? proposal.proposing_company || proposal.proposingCompany
    : proposal.to_company || proposal.toCompany || req.company;
  const companyName = company?.name || "Entreprise";
  const talentName = proposal.profile?.user?.name || "Le talent";
  const requestTitle = req.title || "Demande de ressource";

  /* ----- Type de contrat ----- */
  const contractType = String(req.contract_type || "").toLowerCase();
  const kind =
    proposal.contract_kind === "job" || proposal.contract_kind === "fixed_term" || proposal.contract_kind === "internship"
      ? proposal.contract_kind
      : PERMANENT_TYPES.includes(contractType)
        ? "job"
        : FIXED_TERM_TYPES.includes(contractType)
          ? "fixed_term"
          : "internship";
  const isJob = kind === "job";
  const isFixedTerm = kind === "fixed_term";

  const contractLabel =
    CONTRACT_LABELS[contractType] ||
    MISSION_TYPE_LABELS[req.mission_type] ||
    req.contract_type ||
    req.mission_type ||
    "Non précisé";

  /* ----- Conditions de la mission ----- */
  const startAt = proposal.start_at || req.start_at;
  const endAt = proposal.end_at || req.end_at;
  const workload = proposal.workload_percent ?? req.workload_percent;
  const remote = Boolean(proposal.remote || req.remote);
  const location = [req.city, req.country].filter(Boolean).join(", ");
  const duration = isJob ? null : durationText(startAt, endAt);
  const skills = Array.isArray(req.skills) ? req.skills : [];
  const tags = safeParseArray(req.tags).map(tagLabel).filter(Boolean);
  const hasBudget = req.budget_min != null && req.budget_max != null;

  const periodText = !startAt
    ? "À définir"
    : isJob || !endAt
      ? `À partir du ${fmtDateShort(startAt)}`
      : `Du ${fmtDateShort(startAt)} au ${fmtDateShort(endAt)}`;

  /* ----- Entretien ----- */
  const interviewStatus = proposal.interview_status || "pending";
  const intCfg = INTERVIEW_CFG[interviewStatus] || INTERVIEW_CFG.pending;
  const trialActive = mission?.status === "trial";
  const missionCancelled = mission?.status === "cancelled";

  const showTracker =
    (proposedByCompany && proposal.status === "accepted") ||
    (isTalentApplication &&
      (isCompanyRecipient || isTalentAuthor) &&
      ["sent", "viewed", "accepted", "declined"].includes(proposal.status) &&
      (proposal.status !== "declined" || interviewStatus === "failed"));

  const joinUrl =
    interviewStatus === "scheduled" && proposal.interview_mode === "visio" && proposal.interview_link
      ? `${proposal.interview_link.split("?")[0]}?name=${encodeURIComponent(user?.name || "")}&email=${encodeURIComponent(user?.email || "")}`
      : null;

  /* ----- Statut affiché ----- */
  const cfg = mission && proposal.status === "accepted"
    ? { label: trialActive ? "Période d'essai" : "Mission créée", tone: STATUS_CFG.accepted.tone }
    : showTracker && interviewStatus === "scheduled" && isPending
      ? { label: "Entretien planifié", tone: STATUS_CFG.viewed.tone }
      : STATUS_CFG[proposal.status] || STATUS_CFG.sent;

  /* ----- Textes ----- */
  const eyebrow = isTalentRecipient
    ? "Proposition reçue"
    : isCompanySender
      ? "Proposition envoyée"
      : isTalentAuthor
        ? "Candidature envoyée"
        : isCompanyRecipient
          ? "Candidature reçue"
          : "Proposition";

  const heading = isTalentRecipient
    ? `Proposition de ${companyName}`
    : isCompanySender
      ? `Proposition envoyée à ${talentName}`
      : isTalentAuthor
        ? `Candidature chez ${companyName}`
        : isCompanyRecipient
          ? `Candidature de ${talentName}`
          : `Proposition de ${companyName}`;

  const showCompanyCard = isTalentRecipient || isTalentAuthor;
  const sideCard = showCompanyCard
    ? {
        title: "Entreprise",
        name: companyName,
        logo: company?.logo_path,
        line: company?.city,
        desc: company?.description,
        messageTo: company?.owner_user_id,
      }
    : {
        title: isCompanySender ? "Talent proposé" : "Candidat",
        name: talentName,
        logo: proposal.profile?.avatar_path,
        line: proposal.profile?.headline,
        desc: null,
        messageTo: proposal.profile?.user?.id,
      };

  const steps = [
    { label: isTalentApplication ? "Candidature reçue" : "Proposition acceptée", state: "done" },
    {
      label: "Entretien",
      state: interviewStatus === "validated" ? "done" : interviewStatus === "failed" ? "failed" : "current",
    },
    ...(isJob
      ? [{ label: "Période d'essai", state: !mission ? "todo" : trialActive ? "current" : missionCancelled ? "failed" : "done" }]
      : []),
    {
      label: isJob ? "Salarié en CDI" : isFixedTerm ? "Contrat CDD" : "Mission",
      state: !mission ? "todo" : (isJob && trialActive) || missionCancelled ? "todo" : "done",
    },
  ];

  const stepCls = {
    done: "bg-[#16B8B1] text-[#0B1F33]",
    current: "bg-[#0B1F33] text-white ring-4 ring-[#16B8B1]/25 dark:bg-[#16B8B1] dark:text-[#0B1F33]",
    failed: "bg-rose-500 text-white",
    todo: "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300",
  };

  const nextStep = (() => {
    if (interviewStatus === "failed") {
      return {
        title: "Dossier clôturé",
        text: isInterviewManager
          ? "Vous n'avez pas donné suite après l'entretien."
          : "L'entreprise n'a pas donné suite après l'entretien.",
      };
    }
    if (["declined", "cancelled", "expired"].includes(proposal.status)) {
      return { title: "Dossier clôturé", text: "Cette proposition n'est plus active." };
    }
    if (missionCancelled) {
      return { title: "Collaboration terminée", text: "La mission a pris fin avant son terme." };
    }
    if (mission) {
      if (isJob && trialActive) {
        return isInterviewManager
          ? {
              title: "Période d'essai en cours",
              text: `Elle se termine le ${fmtDate(mission.trial_ends_at)}. Confirmez ensuite le talent en CDI ou mettez fin à la collaboration.`,
            }
          : {
              title: "Période d'essai en cours",
              text: "À son terme, l'entreprise pourra vous confirmer en CDI.",
            };
      }
      return { title: "Mission créée", text: "Elle est disponible dans vos collaborations." };
    }
    if (isInterviewManager && showTracker) {
      return interviewStatus === "scheduled"
        ? {
            title: "Entretien planifié",
            text: "Rejoignez l'entretien à l'heure prévue, puis indiquez son résultat pour créer la mission.",
          }
        : {
            title: "Planifiez un entretien",
            text: "Choisissez une date et un format dans le suivi du recrutement. Le talent reçoit une invitation par email.",
          };
    }
    if (isInterviewTalent && showTracker) {
      return interviewStatus === "scheduled"
        ? {
            title: "Entretien planifié",
            text:
              proposal.interview_mode === "visio"
                ? "Rejoignez la visioconférence à l'heure prévue avec le lien reçu par email."
                : "Présentez-vous à l'adresse indiquée à l'heure prévue.",
          }
        : {
            title: "En attente de l'entreprise",
            text: "L'entreprise va vous proposer une date d'entretien. Vous serez prévenu par email et notification.",
          };
    }
    if (canAnswer) {
      return { title: "Votre réponse est attendue", text: "Acceptez ou refusez cette proposition." };
    }
    return null;
  })();

  const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  const validateInterview = () => {
    const message = isJob
      ? `${talentName} démarre une période d'essai d'un mois. Vous pourrez ensuite le confirmer en CDI.`
      : isFixedTerm
        ? `Une mission en CDD sera créée du ${fmtDate(startAt)} au ${fmtDate(endAt)} et ${talentName} sera ajouté à vos salariés.`
        : `La mission sera créée du ${fmtDate(startAt)} au ${fmtDate(endAt)} et ${talentName} en sera informé.`;

    setConfirmModal({
      title: "Valider l'entretien ?",
      message,
      confirmText: "Valider l'entretien",
      tone: "primary",
      onConfirm: async () => {
        setConfirmModal(null);
        setActionLoading(true);
        try {
          const res = await api.post(`/proposals/${id}/validate-interview`);
          await load(true);
          setMissionSuccess({
            missionId: res.data?.mission?.id,
            title: isJob ? "Période d'essai lancée" : "Mission créée",
            subtitle: isJob
              ? `${talentName} démarre sa période d'essai. Vous la retrouvez dans vos collaborations.`
              : isFixedTerm
                ? `Le contrat CDD de ${talentName} est créé. Il rejoint vos salariés.`
                : `La mission de ${talentName} est créée. Elle apparaît dans vos collaborations.`,
          });
        } catch (err) {
          showToast(errMsg(err), "error");
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const scrollToTracker = () => trackerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const heroFacts = [
    { label: "Contrat", value: contractLabel },
    { label: "Période", value: periodText },
    { label: "Charge de travail", value: workload != null ? `${workload} %` : "Non précisée" },
    { label: "Lieu", value: location ? `${location}${remote ? ", télétravail possible" : ""}` : remote ? "Télétravail" : "Non précisé" },
  ];

  const hasActions = canAnswer || canCancel || joinUrl || mission;

  /* ============================================================
     RENDU
  ============================================================ */
  return (
    <AppShell>
      <main className="min-h-screen bg-[#F5F8FA] px-4 py-6 dark:bg-[#071521] sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-5">
          <Link
            to="/collaborations"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft size={15} /> Retour aux collaborations
          </Link>

          {/* ---------- En-tête ---------- */}
          <section className="overflow-hidden rounded-2xl bg-[#0B1F33] text-white shadow-md">
            <div className="flex flex-col gap-4 px-5 pb-6 pt-6 sm:flex-row sm:items-start sm:justify-between sm:px-7">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#16B8B1]">{eyebrow}</p>
                <h1 className="mt-2 break-words text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{heading}</h1>
                <p className="mt-2 text-sm text-white/70">
                  Pour la demande <span className="font-semibold text-white">{requestTitle}</span>
                </p>
              </div>
              <span className={`inline-flex w-fit shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${cfg.tone}`}>
                {cfg.label}
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-px border-t border-white/10 bg-white/10 lg:grid-cols-4">
              {heroFacts.map((f) => (
                <div key={f.label} className="min-w-0 bg-[#0B1F33] px-5 py-4 sm:px-7">
                  <dt className="text-xs text-white/60">{f.label}</dt>
                  <dd className="mt-1 break-words text-sm font-semibold">{f.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* ================= COLONNE PRINCIPALE ================= */}
            <div className="space-y-5">
              {/* ---------- Suivi du recrutement ---------- */}
              {showTracker && (
                <div ref={trackerRef} className="scroll-mt-24">
                  <Section
                    title="Suivi du recrutement"
                    subtitle={
                      isJob
                        ? "Entretien, période d'essai, puis CDI"
                        : isFixedTerm
                          ? "Entretien, puis mission en CDD"
                          : "Entretien, puis création de la mission"
                    }
                    right={
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${intCfg.tone}`}>{intCfg.label}</span>
                    }
                  >
                    <div className="space-y-6 p-5 pt-3">
                      <ol className="flex items-start">
                        {steps.map((s, i) => (
                          <li key={s.label} className="relative flex flex-1 flex-col items-center text-center">
                            {i > 0 && (
                              <span
                                className={`absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 ${
                                  steps[i - 1].state === "done" ? "bg-[#16B8B1]" : "bg-slate-200 dark:bg-slate-700"
                                }`}
                              />
                            )}
                            <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${stepCls[s.state]}`}>
                              {s.state === "done" ? <Check size={14} /> : s.state === "failed" ? <X size={14} /> : i + 1}
                            </span>
                            <span className="mt-2 text-xs font-semibold leading-tight text-slate-600 dark:text-slate-300">{s.label}</span>
                          </li>
                        ))}
                      </ol>

                      {proposal.interview_at && interviewStatus !== "pending" && (
                        <div className="rounded-xl bg-slate-50 p-4 dark:bg-[#0B1F33]">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <p className={labelCls}>Date et heure</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {fmtDateTime(proposal.interview_at)}
                              </p>
                            </div>
                            <div>
                              <p className={labelCls}>{proposal.interview_mode === "visio" ? "Format" : "Lieu"}</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {proposal.interview_location || "Non précisé"}
                              </p>
                            </div>
                          </div>
                          {proposal.interview_notes && (
                            <div className="mt-4">
                              <p className={labelCls}>Informations complémentaires</p>
                              <p className="mt-1 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">
                                {proposal.interview_notes}
                              </p>
                            </div>
                          )}
                          {joinUrl && (
                            <Btn as="a" href={joinUrl} target="_blank" rel="noreferrer" variant="dark" className="mt-4">
                              <Eye size={16} /> Rejoindre l'entretien
                            </Btn>
                          )}
                        </div>
                      )}

                      {/* ----- Actions du recruteur ----- */}
                      {isInterviewManager && (
                        <>
                          {(interviewStatus === "pending" || showSchedule) && (
                            <form
                              onSubmit={submitInterview}
                              className="space-y-4 rounded-xl border border-[#16B8B1]/30 bg-teal-50/50 p-4 dark:bg-teal-950/20"
                            >
                              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                {interviewStatus === "pending" ? "Planifier l'entretien" : "Replanifier l'entretien"}
                              </p>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                  <label className={labelCls}>Date et heure</label>
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
                                  <label className={labelCls}>Format</label>
                                  <select
                                    value={interviewForm.interview_mode}
                                    onChange={(e) => setInterviewForm((f) => ({ ...f, interview_mode: e.target.value }))}
                                    className={`${inputCls} mt-1`}
                                  >
                                    <option value="visio">Visioconférence</option>
                                    <option value="onsite">Sur place</option>
                                  </select>
                                </div>
                              </div>
                              {interviewForm.interview_mode === "onsite" && (
                                <div>
                                  <label className={labelCls}>Lieu du rendez-vous</label>
                                  <input
                                    type="text"
                                    required
                                    maxLength={255}
                                    placeholder="Adresse"
                                    value={interviewForm.interview_location}
                                    onChange={(e) => setInterviewForm((f) => ({ ...f, interview_location: e.target.value }))}
                                    className={`${inputCls} mt-1`}
                                  />
                                </div>
                              )}
                              <div>
                                <label className={labelCls}>Informations complémentaires (facultatif)</label>
                                <textarea
                                  rows={3}
                                  maxLength={2000}
                                  placeholder="Personne à contacter, documents à apporter"
                                  value={interviewForm.interview_notes}
                                  onChange={(e) => setInterviewForm((f) => ({ ...f, interview_notes: e.target.value }))}
                                  className={`${inputCls} mt-1 resize-y`}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                {showSchedule && (
                                  <Btn variant="outline" onClick={() => setShowSchedule(false)}>Annuler</Btn>
                                )}
                                <Btn type="submit" variant="dark" disabled={actionLoading}>
                                  {actionLoading && <Loader2 size={14} className="animate-spin" />}
                                  <Calendar size={16} /> Envoyer la convocation
                                </Btn>
                              </div>
                            </form>
                          )}

                          {interviewStatus === "scheduled" && !showSchedule && (
                            <div className="flex flex-col gap-3 sm:flex-row">
                              <Btn variant="primary" onClick={validateInterview} disabled={actionLoading} className="flex-1">
                                <CheckCircle2 size={16} /> Valider l'entretien
                              </Btn>
                              <Btn variant="danger" onClick={rejectInterview} disabled={actionLoading} className="flex-1">
                                <XCircle size={16} /> Non concluant
                              </Btn>
                              <Btn variant="outline" onClick={() => setShowSchedule(true)} disabled={actionLoading}>
                                <RefreshCw size={16} /> Replanifier
                              </Btn>
                            </div>
                          )}

                          {interviewStatus === "validated" && isJob && trialActive && (
                            <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/20">
                              <p className="text-sm font-bold text-blue-900 dark:text-blue-200">
                                Période d'essai en cours
                                {mission?.trial_ends_at && (
                                  <span className="font-medium"> jusqu'au {fmtDate(mission.trial_ends_at)}</span>
                                )}
                              </p>
                              <p className="text-sm text-blue-800 dark:text-blue-300">
                                À l'issue de l'essai, confirmez le talent : il passera en CDI sans date de fin et sera ajouté à vos salariés.
                              </p>
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <Btn variant="primary" onClick={validateTrial} disabled={actionLoading}>
                                  <CheckCircle2 size={16} /> Confirmer en CDI
                                </Btn>
                                <Btn variant="danger" onClick={rejectTrial} disabled={actionLoading}>
                                  <XCircle size={16} /> Ne pas confirmer
                                </Btn>
                              </div>
                            </div>
                          )}

                          {interviewStatus === "validated" && isJob && mission?.status === "active" && (
                            <p className="rounded-xl bg-teal-50 p-4 text-sm text-teal-800 dark:bg-teal-950/30 dark:text-teal-300">
                              CDI confirmé : {talentName} est désormais salarié de votre entreprise.
                            </p>
                          )}
                          {interviewStatus === "validated" && isJob && missionCancelled && (
                            <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                              Vous n'avez pas confirmé le talent à l'issue de la période d'essai.
                            </p>
                          )}
                        </>
                      )}

                      {interviewStatus === "validated" && mission && !isJob && (
                        <p className="rounded-xl bg-teal-50 p-4 text-sm text-teal-800 dark:bg-teal-950/30 dark:text-teal-300">
                          {isInterviewManager
                            ? `La mission de ${talentName} est créée du ${fmtDate(mission.start_at)} au ${fmtDate(mission.end_at)}.${isFixedTerm ? " Il fait désormais partie de vos salariés en CDD." : ""}`
                            : `Votre mission est créée du ${fmtDate(mission.start_at)} au ${fmtDate(mission.end_at)}.`}
                        </p>
                      )}

                      {isInterviewTalent && interviewStatus === "validated" && isJob && (
                        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-[#0B1F33] dark:text-slate-300">
                          {trialActive && "Entretien validé : votre période d'essai est en cours. À son terme, l'entreprise pourra vous confirmer en CDI."}
                          {mission?.status === "active" && "Période d'essai validée : vous êtes désormais salarié en CDI."}
                          {missionCancelled && "L'entreprise n'a pas confirmé votre embauche à l'issue de la période d'essai."}
                        </p>
                      )}

                      {interviewStatus === "failed" && (
                        <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                          {isInterviewManager
                            ? "Vous avez marqué l'entretien comme non concluant. Le dossier est clôturé."
                            : "L'entreprise n'a pas donné suite après l'entretien."}
                        </p>
                      )}
                    </div>
                  </Section>
                </div>
              )}

              {/* ---------- Détails de la mission ---------- */}
              <Section title="Détails de la mission" subtitle="Les conditions de la demande à laquelle ce dossier répond">
                <div className="px-5 pb-5">
                  <div className="grid gap-x-8 gap-y-2 md:grid-cols-2">
                    
                    {/* ✅ COLONNE 1 : Informations générales */}
                    <div>
                      <p className="mb-2 mt-2 text-[11px] font-bold uppercase tracking-wider text-[#16B8B1]">
                        Informations générales
                      </p>
                      <dl>
                        <Row label="Type de contrat">{contractLabel}</Row>
                        <Row label="Début">{startAt ? fmtDate(startAt) : "À définir"}</Row>
                        <Row label="Fin prévue">{isJob ? "Indéterminée (CDI)" : endAt ? fmtDate(endAt) : "À définir"}</Row>
                        {duration && <Row label="Durée">{duration}</Row>}
                        <Row label="Nombre de postes">{req.positions_count || 1}</Row>
                      </dl>
                    </div>

                    {/* ✅ COLONNE 2 : Conditions d'exercice */}
                    <div>
                      <p className="mb-2 mt-2 text-[11px] font-bold uppercase tracking-wider text-[#16B8B1]">
                        Conditions d'exercice
                      </p>
                      <dl>
                        <Row label="Charge de travail">{workload != null ? `${workload} % du temps` : "Non précisée"}</Row>
                        <Row label="Lieu">{location || "Non précisé"}</Row>
                        <Row label="Télétravail">{remote ? "Possible" : "Non"}</Row>
                        {hasBudget && <Row label="Budget journalier">{`${req.budget_min} à ${req.budget_max} €`}</Row>}
                        {proposal.expires_at && <Row label="Réponse attendue avant le">{fmtDate(proposal.expires_at)}</Row>}
                      </dl>
                    </div>

                  </div>
                </div>

                {skills.length > 0 && (
                  <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                    <p className={labelCls}>Compétences requises</p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {skills.map((s, i) => (
                        <li
                          key={s.id ?? `${s.name}-${i}`}
                          className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
                        >
                          {s.name}
                          <span className="text-slate-400"> {LEVEL_LABEL[s.pivot?.min_level] || ""}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {tags.length > 0 && (
                  <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                    <p className={labelCls}>Domaines</p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {tags.map((t, i) => (
                        <li key={`${t}-${i}`} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Section>

              {/* ✅ NOUVELLE SECTION À DEUX COLONNES : Lettre + Description */}
              {(proposal.message || req.description || proposal.conditions || proposal.description) && (
                <div className="grid gap-5 md:grid-cols-2">
                  
                  {/* Colonne Gauche : Lettre d'accompagnement */}
                  {proposal.message && (
                    <Section title="Lettre d'accompagnement" subtitle="Le message transmis avec le dossier">
                      <div className="px-5 pb-5">
                        <div className="rounded-xl bg-slate-50 p-4 dark:bg-[#0B1F33]">
                          <CollapsibleText text={proposal.message} limit={200} />
                        </div>
                      </div>
                    </Section>
                  )}

                  {/* Colonne Droite : Description et Conditions */}
                  {(req.description || proposal.conditions || proposal.description) && (
                    <Section title="Description et conditions">
                      <div className="space-y-4 px-5 pb-5">
                        {req.description && (
                          <div>
                            <p className={labelCls}>Description de la demande</p>
                            <CollapsibleText text={req.description} limit={200} className="mt-1" />
                          </div>
                        )}
                        {proposal.description && (
                          <div>
                            <p className={labelCls}>Description de la proposition</p>
                            <CollapsibleText text={proposal.description} limit={200} className="mt-1" />
                          </div>
                        )}
                        {proposal.conditions && (
                          <div>
                            <p className={labelCls}>Conditions proposées</p>
                            <CollapsibleText text={proposal.conditions} limit={200} className="mt-1" />
                          </div>
                        )}
                      </div>
                    </Section>
                  )}

                </div>
              )}
            </div>

            {/* ================= COLONNE LATÉRALE ================= */}
            <aside className="space-y-5">
              <Section title={sideCard.title}>
                <div className="px-5 pb-5">
                  <div className="flex items-center gap-4">
                    <LogoBox src={sideCard.logo} name={sideCard.name} />
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-slate-900 dark:text-white">{sideCard.name}</p>
                      {sideCard.line && (
                        <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">{sideCard.line}</p>
                      )}
                    </div>
                  </div>
                  {sideCard.desc && (
                    <p className="mt-4 line-clamp-3 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      {sideCard.desc}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {!showCompanyCard && proposal.professional_profile_id && (
                      <Btn as={Link} to={`/talents/${proposal.professional_profile_id}`} variant="outline" className="flex-1">
                        <User size={16} /> Voir le profil
                      </Btn>
                    )}
                    {sideCard.messageTo && (
                      <Btn as={Link} to={`/messages?to=${sideCard.messageTo}`} variant="outline" className="flex-1">
                        <MessageSquare size={16} /> Envoyer un message
                      </Btn>
                    )}
                  </div>
                </div>
              </Section>

              {nextStep && (
                <div className="rounded-xl border border-[#16B8B1]/30 bg-teal-50/60 p-5 dark:bg-teal-950/20">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{nextStep.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300">{nextStep.text}</p>
                </div>
              )}

              {hasActions && (
                <div className="flex flex-col gap-3">
                  {joinUrl && !showTracker && (
                    <Btn as="a" href={joinUrl} target="_blank" rel="noreferrer" variant="dark">
                      <Eye size={16} /> Rejoindre l'entretien
                    </Btn>
                  )}

                  {canAnswer && isTalentApplication && isInterviewManager && interviewStatus === "pending" && (
                    <Btn variant="primary" onClick={scrollToTracker}>
                      <Calendar size={16} /> Planifier un entretien
                    </Btn>
                  )}
                  {canAnswer && !isTalentApplication && (
                    <Btn variant="primary" onClick={() => doAction("accept")} disabled={actionLoading}>
                      <CheckCircle2 size={16} /> Accepter la proposition
                    </Btn>
                  )}
                  {canAnswer && (
                    <Btn variant="danger" onClick={() => doAction("decline")} disabled={actionLoading}>
                      <XCircle size={16} /> {isTalentApplication ? "Refuser la candidature" : "Refuser"}
                    </Btn>
                  )}

                  {canCancel && (
                    <Btn variant="danger" onClick={() => doAction("cancel")} disabled={actionLoading}>
                      <XCircle size={16} /> {isTalentAuthor ? "Retirer ma candidature" : "Annuler la proposition"}
                    </Btn>
                  )}

                  {mission && (
                    <Btn as={Link} to={`/missions/${mission.id}`} variant="dark">
                     Voir la mission
                    </Btn>
                  )}
                </div>
              )}

              {(isCompanySide || documents.length > 0) && (
                <Section
                  title="Documents"
                  subtitle="Contrat et pièces du dossier"
                >
                  <div className="space-y-3 px-5 pb-5">
                    {isCompanySide && (
                      <div className="flex flex-wrap gap-2">
                        <label className="inline-flex cursor-pointer items-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-[#16B8B1] hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                          Ajouter un contrat
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            disabled={uploading}
                            onChange={(e) => uploadDocument(e, "contract")}
                          />
                        </label>
                        <label className="inline-flex cursor-pointer items-center rounded-xl bg-[#0B1F33] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#16354E] dark:bg-[#16B8B1] dark:text-[#0B1F33] dark:hover:bg-[#0F9691]">
                          Ajouter un fichier
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                            className="hidden"
                            disabled={uploading}
                            onChange={(e) => uploadDocument(e, "attachment")}
                          />
                        </label>
                      </div>
                    )}

                    {uploading && (
                      <p className="flex items-center gap-2 text-sm text-slate-500">
                        <Loader2 size={14} className="animate-spin" /> Envoi en cours
                      </p>
                    )}

                    {documents.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center dark:border-slate-700">
                        <FileText size={26} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {isCompanySide
                            ? "Aucun document. Ajoutez le contrat à faire signer."
                            : "Aucun document pour le moment."}
                        </p>
                      </div>
                    ) : (
                      documents.map((d) => (
                        <div key={d.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                          <FileText size={18} className="shrink-0 text-slate-400" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {d.original_name || d.file_path?.split("/").pop() || "Document"}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {DOC_TYPES[d.type] || d.type} {d.formatted_size ? `(${d.formatted_size})` : ""}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              onClick={() => downloadDocument(d)}
                              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:border-[#16B8B1] dark:border-slate-700 dark:text-slate-200"
                            >
                              Télécharger
                            </button>
                            {isCompanySide && d.uploaded_by === user?.id && (
                              <button
                                type="button"
                                onClick={() => deleteDocument(d.id)}
                                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-rose-600 transition hover:border-rose-300 dark:border-slate-700"
                              >
                                Supprimer
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Section>
              )}
            </aside>
          </div>
        </div>
      </main>

      {confirmModal && <ConfirmModal config={confirmModal} onClose={() => setConfirmModal(null)} />}

      {showConvocationSuccess && (
        <SuccessOverlay
          title="Convocation envoyée"
          subtitle={`${talentName} a reçu l'invitation par email et par notification. Vous avez aussi reçu un email avec votre lien pour rejoindre l'entretien.`}
          duration={3200}
          onComplete={() => setShowConvocationSuccess(false)}
        />
      )}

      {missionSuccess && (
        <SuccessOverlay
          title={missionSuccess.title}
          subtitle={missionSuccess.subtitle}
          duration={3200}
          onComplete={() => {
            const missionId = missionSuccess.missionId;
            setMissionSuccess(null);
            if (missionId) navigate(`/missions/${missionId}`);
          }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </AppShell>
  );
}