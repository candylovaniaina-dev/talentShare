import React, { useEffect, useState } from "react";
import {
  X, CheckCircle, MapPin, Building2, UserRound, CalendarDays,
  Banknote, FileText, Target, Send, Clock3, BriefcaseBusiness,
  Monitor, Users, MessageCircle, AlertCircle, LoaderCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import CandidatesModal from "./CandidatesModal";
import ApplyToRequestModal from "./ApplyToRequestModal";
import SuccessOverlay from "./SuccessOverlay";
import ProposalsList from "./ProposalsList";
import useRequestProposals from "../../hooks/useRequestProposals";
import ProposeTalentModal from "../resource-sharing/ProposeTalentModal";

const BASE_URL = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
const fileUrl = (p) => (!p ? null : /^https?:/.test(p) ? p : `${BASE_URL}/storage/${p}`);

const STATUS_LABELS = {
  draft: "Brouillon", published: "Publiée", paused: "En pause",
  closed: "Fermée", filled: "Pourvue", expired: "Expirée",
};

const STATUS_STYLES = {
  draft: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
  published: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400",
  paused: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  closed: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  filled: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  expired: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400",
};

const CONTRACT_LABELS = {
  stage: "Stage", alternance: "Alternance", emploi: "Emploi (CDI)",
  cdi: "CDI", mission: "Mission freelance",
};

const MISSION_TYPE_LABELS = {
  staffing: "Mise à disposition",
  punctual: "Mission ponctuelle",
  freelance: "Prestation freelance",
};

const LEVEL_LABEL = {
  beginner: "Débutant", intermediate: "Intermédiaire", advanced: "Avancé", expert: "Expert",
};

const formatDate = (date) => {
  if (!date) return "Non précisée";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Non précisée";
  return parsed.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

const toTime = (date, fallback) => {
  if (!date) return fallback;
  const t = new Date(date).getTime();
  return Number.isNaN(t) ? fallback : t;
};

const periodsOverlap = (aStart, aEnd, bStart, bEnd) =>
  toTime(aStart, -Infinity) <= toTime(bEnd, Infinity) &&
  toTime(bStart, -Infinity) <= toTime(aEnd, Infinity);

const INACTIVE_MISSION_STATUSES = ["completed", "cancelled", "terminated", "ended"];

const clampScore = (score) => {
  const number = Number(score);
  if (!Number.isFinite(number)) return 0;
  return Math.min(100, Math.max(0, number));
};

const safeParseArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  }
  return [];
};

const getTagLabel = (tag) => {
  if (!tag) return "";
  if (typeof tag === "string") return tag;
  if (typeof tag === "object") return tag.name || tag.label || "";
  return String(tag);
};

function getMatchLevel(score) {
  if (score >= 90) return { color: "#16B8B1", label: "Excellente", description: "Votre profil correspond très fortement aux besoins." };
  if (score >= 75) return { color: "#0F9691", label: "Très bonne", description: "Votre profil présente une très bonne correspondance." };
  if (score >= 60) return { color: "#0F9691", label: "Bonne", description: "Plusieurs éléments de votre profil correspondent." };
  if (score >= 40) return { color: "#D97706", label: "Partielle", description: "Une partie des compétences correspond aux besoins." };
  if (score >= 20) return { color: "#EA580C", label: "Faible", description: "La correspondance avec les besoins reste limitée." };
  return { color: "#64748B", label: "Faible", description: "Peu d'éléments de correspondance ont été détectés." };
}

function Card({ children, className = "", ...props }) {
  return (
    <section className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#112A3A] ${className}`} {...props}>
      {children}
    </section>
  );
}

function SectionHeading({ title, subtitle, icon: Icon }) {
  return (
    <div className="mb-3 flex items-start gap-2.5">
      {Icon && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
          <Icon size={16} strokeWidth={1.8} />
        </div>
      )}
      <div className="min-w-0">
        <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 dark:border-white/10 dark:bg-white/[0.03]">
      {Icon && (
        <div className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500">
          <Icon size={15} strokeWidth={1.8} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-0.5 break-words text-xs font-semibold leading-5 text-slate-800 dark:text-slate-200">{value ?? "Non précisé"}</p>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-3 border-b border-slate-100 px-3 py-2.5 last:border-0 dark:border-white/10">
      <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="break-words text-right text-xs font-semibold text-slate-800 dark:text-slate-200">{value ?? "Non précisé"}</dd>
    </div>
  );
}

function MatchCircle({ score, size = 80 }) {
  const safeScore = clampScore(score);
  const { color } = getMatchLevel(safeScore);
  const radius = size / 2 - 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - safeScore / 100);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Compatibilité : ${safeScore} %`}>
      <svg className="-rotate-90" viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" className="text-slate-100 dark:text-white/10" strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 700ms ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tracking-tight" style={{ color }}>{safeScore}%</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
      {STATUS_LABELS[status] || "Statut inconnu"}
    </span>
  );
}

function ActionButton({ children, onClick, variant = "primary", disabled = false, icon: Icon, className = "" }) {
  const variants = {
    primary: "border border-[#0B1F33] bg-[#0B1F33] text-white shadow-sm hover:-translate-y-0.5 hover:bg-[#16324F] dark:border-[#16B8B1] dark:bg-[#16B8B1] dark:text-[#0B1F33] dark:hover:bg-[#0F9691] dark:hover:text-white",
    success: "border border-[#16B8B1] bg-[#16B8B1] text-[#0B1F33] shadow-sm hover:-translate-y-0.5 hover:bg-[#0F9691] hover:text-white dark:border-[#16B8B1] dark:bg-[#16B8B1] dark:text-[#0B1F33]",
    secondary: "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-transparent dark:text-slate-200 dark:hover:bg-white/5",
  };

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}>
      {Icon && <Icon size={14} strokeWidth={1.9} />}
      {children}
    </button>
  );
}

export default function RequestDetailModal({ requestId, onClose, autoOpenCandidates = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showRightPanel, setShowRightPanel] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState("proposals");

  const {
    received: receivedProposals,
    sent: sentProposals,
    byProfile: proposalsByProfile,
    loading: proposalsLoading,
    reload: reloadProposals,
  } = useRequestProposals(requestId);

  const [showApply, setShowApply] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [checkingApplied, setCheckingApplied] = useState(true);

  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [successTitle, setSuccessTitle] = useState("Candidature envoyée");
  const [showProposeEmployee, setShowProposeEmployee] = useState(false);
  const [myCompanies, setMyCompanies] = useState([]);
  
  const [conflictMission, setConflictMission] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!user || !(user.role === "company" || user.role === "entreprise")) return;
    api.get("/companies/my/all")
      .then((r) => setMyCompanies(Array.isArray(r.data) ? r.data : r.data?.data || []))
      .catch(() => setMyCompanies([]));
  }, [user]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setRequest(null);
    setAlreadyApplied(false);
    setCheckingApplied(true);

    api.get(`/resource-requests/${requestId}`)
      .then((res) => { if (active) setRequest(res.data); })
      .catch((err) => {
        if (!active) return;
        if (err.response?.status === 404) setError("not_found");
        else if (err.response?.status === 403) setError("forbidden");
        else setError("error");
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [requestId]);

  useEffect(() => {
    if (!request || !user) { setCheckingApplied(false); return; }
    let active = true;
    setCheckingApplied(true);

    api.get("/proposals/sent")
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const applied = list.some(
          (proposal) =>
            String(proposal.resource_request_id) === String(request.id) &&
            ["sent", "viewed", "accepted", "pending"].includes(String(proposal.status || "").toLowerCase())
        );
        setAlreadyApplied(applied);
      })
      .catch(() => { if (active) setAlreadyApplied(false); })
      .finally(() => { if (active) setCheckingApplied(false); });

    return () => { active = false; };
  }, [request, user]);

  useEffect(() => {
    const isTalent = user?.role === "employee" || user?.role === "student";
    if (!request || !isTalent || !request.start_at) {
      setConflictMission(null);
      return;
    }
    let active = true;

    api.get("/missions")
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const conflict = list.find(
          (m) =>
            !INACTIVE_MISSION_STATUSES.includes(String(m.status || "").toLowerCase()) &&
            periodsOverlap(m.start_at, m.end_at, request.start_at, request.end_at)
        );
        setConflictMission(conflict || null);
      })
      .catch(() => { if (active) setConflictMission(null); });

    return () => { active = false; };
  }, [request, user]);

  useEffect(() => {
    if (!request || !user) return;
    const isOwner =
      user.id === request.created_by ||
      (user.role === "company" && user.companies?.some((company) => company.id === request.company_id));
    if (autoOpenCandidates && isOwner) {
      setShowRightPanel(true);
      setRightPanelTab("proposals");
    }
  }, [request, user, autoOpenCandidates]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event) => {
      if (event.key !== "Escape" || showSuccessOverlay) return;
      if (showRightPanel) setShowRightPanel(false);
      else if (showApply) setShowApply(false);
      else onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, showRightPanel, showApply, showSuccessOverlay]);

  const handleDiscuss = () => {
    const ownerId = request?.author?.id || request?.created_by;
    if (!ownerId) return;
    onClose();
    setTimeout(() => { navigate(`/messages?to=${ownerId}`); }, 50);
  };

  const handleApplySuccess = () => {
    setShowApply(false);
    setAlreadyApplied(true);
    setSuccessTitle(alreadyApplied ? "Candidature déjà envoyée" : "Candidature envoyée");
    setShowSuccessOverlay(true);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xl dark:border-white/10 dark:bg-[#112A3A]">
          <LoaderCircle size={30} className="mx-auto animate-spin text-[#16B8B1]" />
          <p className="mt-4 text-sm font-semibold text-slate-800 dark:text-white">Chargement de la demande</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Veuillez patienter quelques instants.</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    const forbidden = error === "forbidden";
    const notFound = error === "not_found";
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl dark:border-white/10 dark:bg-[#112A3A]" onClick={(event) => event.stopPropagation()}>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
            <AlertCircle size={22} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
            {forbidden ? "Accès refusé" : notFound ? "Demande introuvable" : "Impossible de charger la demande"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {forbidden ? "Vous ne disposez pas des autorisations nécessaires." : notFound ? "Cette demande n'existe plus ou n'est plus disponible." : "Une erreur est survenue. Veuillez réessayer."}
          </p>
          <ActionButton onClick={onClose} className="mt-6 w-full">Fermer</ActionButton>
        </div>
      </div>
    );
  }

  const isOwner =
    user?.id === request.created_by ||
    (user?.role === "company" && user?.companies?.some((company) => company.id === request.company_id));

  const isCompanyRole = user?.role === "company" || user?.role === "entreprise";
  const isTalentRole = user?.role === "employee" || user?.role === "student";
  const isTalentRequest = request.author_type === "talent";

  const isCDI =
    request.contract_type === "emploi" ||
    request.contract_type === "cdi" ||
    request.contract_type === "CDI" ||
    (request.contract_type && String(request.contract_type).toLowerCase().includes("emploi")) ||
    (!request.end_at && request.start_at);

  const canSeeRightPanel = isOwner && !isTalentRequest && isCompanyRole;
  const canApply = !isOwner && isTalentRole && !isTalentRequest;
  const canProposeTalent = !isOwner && isCompanyRole && isTalentRequest;
  const canProposeEmployee = !isOwner && isCompanyRole && !isTalentRequest && myCompanies.length > 0;

  const isExpiringSoon = request.days_until_expiry != null && request.days_until_expiry <= 7 && request.days_until_expiry >= 0 && request.display_status === "published";

  const tagsList = safeParseArray(request.tags);
  const skillsList = Array.isArray(request.skills) ? request.skills : [];

  const rawMatchScore = request.match_score;
  const hasMatchScore = rawMatchScore !== null && rawMatchScore !== undefined && rawMatchScore !== "" && Number.isFinite(Number(rawMatchScore));
  const matchScore = hasMatchScore ? clampScore(rawMatchScore) : null;
  const showMatch = hasMatchScore && matchScore > 0 && (isTalentRole || isCompanyRole);
  const matchLevel = showMatch ? getMatchLevel(matchScore) : null;

  const matchedSkills = request.matched_skills ?? null;
  const skillsText = matchedSkills !== null && skillsList.length > 0 ? `${matchedSkills} compétence${Number(matchedSkills) > 1 ? "s" : ""} sur ${skillsList.length} correspondent` : null;

  const maxWidth = showRightPanel ? "max-w-[1200px]" : "max-w-5xl";

  const tabClass = (active) =>
    `flex-1 border-b-2 px-4 py-3 text-sm font-bold transition ${
      active
        ? "border-[#16B8B1] text-[#0B1F33] dark:text-[#16B8B1]"
        : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"
    }`;

  const description = request.description || "";
  const shouldTruncate = description.length > 250;
  const displayedDescription = isExpanded || !shouldTruncate ? description : `${description.slice(0, 250)}...`;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5" role="dialog" aria-modal="true" aria-labelledby="request-detail-title">
        <button type="button" aria-label="Fermer la fenêtre" onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />

        <div className={`relative z-10 flex w-full items-stretch justify-center gap-4 ${maxWidth}`}>

          <div className={`flex max-h-[94vh] min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-15px_rgba(11,31,51,0.3)] dark:border-white/10 dark:bg-[#112A3A] ${showRightPanel ? "hidden w-full lg:flex lg:w-1/2" : "w-full"}`}>

            {/* EN-TÊTE BLEU MARINE */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0B1F33] px-5 py-3 text-white sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10 p-1.5">
                  {isTalentRequest ? (
                    request.author?.professional_profile?.avatar_path || request.author?.avatar_path ? (
                      <img src={fileUrl(request.author?.professional_profile?.avatar_path || request.author?.avatar_path)} alt={request.author?.name} className="h-full w-full object-cover rounded-lg" />
                    ) : (
                      <UserRound size={18} className="text-[#16B8B1]" />
                    )
                  ) : (
                    request.company?.logo_path ? (
                      <img src={fileUrl(request.company.logo_path)} alt={request.company?.name} className="h-full w-full object-contain drop-shadow-md" />
                    ) : (
                      <Building2 size={18} className="text-[#16B8B1]" />
                    )
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-white/70">Détail de la demande</p>
                  <p className="truncate text-sm font-semibold text-white">
                    {isTalentRequest ? "Profil de talent" : "Besoin en ressources"}
                  </p>
                </div>
              </div>

              <button type="button" onClick={onClose} aria-label="Fermer" className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 bg-slate-50/70 p-4 dark:bg-[#0B1F33]/40 sm:p-6">

                {/* COLONNE GAUCHE */}
                <div className="space-y-4">
                  {canApply && !alreadyApplied && conflictMission && (
                    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 shadow-sm">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <p className="font-medium">
                        Vous avez déjà une mission en cours sur cette période
                        {conflictMission.end_at ? ` (jusqu'au ${formatDate(conflictMission.end_at)})` : " (sans date de fin)"}.
                      </p>
                    </div>
                  )}

                  <Card className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={request.display_status} />
                        <span className="inline-flex items-center rounded-md border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:border-white/10 dark:text-slate-300">
                          {isTalentRequest ? "Talent" : "Entreprise"}
                        </span>
                        {request.urgency === "urgent" && (
                          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">Urgent</span>
                        )}
                        {alreadyApplied && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700 dark:bg-teal-500/10 dark:text-teal-400">
                            <CheckCircle size={11} /> Candidature envoyée
                          </span>
                        )}
                      </div>

                      <h1 id="request-detail-title" className="mt-3 break-words text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
                        {request.title || "Demande de ressource"}
                      </h1>

                      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {(request.city || request.country) && (
                          <InfoItem icon={MapPin} label="Localisation" value={[request.city, request.country].filter(Boolean).join(", ")} />
                        )}
                        {isTalentRequest ? (
                          <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 dark:border-white/10 dark:bg-white/[0.03]">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400">
                              <UserRound size={14} />
                            </div>
                            <div>
                              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Talent</p>
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{request.author?.name}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 dark:border-white/10 dark:bg-white/[0.03]">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400">
                              <Building2 size={14} />
                            </div>
                            <div>
                              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Entreprise</p>
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{request.company?.name}</p>
                            </div>
                          </div>
                        )}
                        {request.remote && <InfoItem icon={Monitor} label="Mode de travail" value="Télétravail possible" />}
                        {request.budget_min != null && request.budget_max != null && (
                          <InfoItem icon={Banknote} label="Budget" value={`${request.budget_min} – ${request.budget_max} € / jour`} />
                        )}
                      </div>

                      {request.expires_at && (
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-white/10">
                          <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <CalendarDays size={14} /> Expiration
                          </span>
                          <span className={`text-xs font-semibold ${isExpiringSoon ? "text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-slate-200"}`}>
                            {formatDate(request.expires_at)}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>

                  {(request.description || tagsList.length > 0) && (
                    <Card className="p-4">
                      {request.description && (
                        <div>
                          <SectionHeading title="Description" icon={FileText} />
                          <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/[0.03]">
                            <p className="whitespace-pre-line break-words text-xs leading-6 text-slate-600 dark:text-slate-300">
                              {displayedDescription}
                            </p>
                            {shouldTruncate && (
                              <button
                                type="button"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="mt-2 text-xs font-semibold text-[#0F9691] hover:underline dark:text-[#16B8B1]"
                              >
                                {isExpanded ? "Voir moins" : "Voir plus"}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      {tagsList.length > 0 && (
                        <div className={request.description ? "mt-4" : ""}>
                          <h3 className="mb-2 text-xs font-bold text-slate-900 dark:text-white">Mots-clés</h3>
                          <div className="flex flex-wrap gap-1.5">
                            {tagsList.map((tag, index) => {
                              const label = getTagLabel(tag);
                              if (!label) return null;
                              return (
                                <span key={`${label}-${index}`} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300">
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </Card>
                  )}
                </div>

                {/* COLONNE DROITE */}
                <div className="space-y-4">
                  {showMatch && (
                    <Card className="p-4">
                      <SectionHeading title="Compatibilité" icon={Target} />
                      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:items-center">
                        <div className="flex shrink-0 flex-col items-center">
                          <MatchCircle score={matchScore} size={80} />
                          <span className="mt-1 text-xs font-bold" style={{ color: matchLevel.color }}>{matchLevel.label}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">{matchLevel.description}</p>
                          {skillsText && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{skillsText}</p>}
                          <div className="mt-3">
                            <div className="mb-1 flex items-center justify-between gap-2 text-[10px]">
                              <span className="text-slate-500 dark:text-slate-400">Score</span>
                              <span className="font-bold" style={{ color: matchLevel.color }}>{matchScore}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10" role="progressbar" aria-valuenow={matchScore} aria-valuemin={0} aria-valuemax={100}>
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${matchScore}%`, backgroundColor: matchLevel.color }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  <Card className="p-4">
                    <SectionHeading title="Informations pratiques" icon={BriefcaseBusiness} />
                    <dl className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
                      <DetailRow 
                        label="Type de contrat" 
                        value={
                          CONTRACT_LABELS[request.contract_type] 
                          || MISSION_TYPE_LABELS[request.mission_type] 
                          || request.contract_type 
                          || request.mission_type 
                          || "Non précisé"
                        } 
                      />
                      <DetailRow label="Début" value={formatDate(request.start_at)} />
                      {isCDI ? (
                        <DetailRow label="Fin" value="Indéterminée (CDI)" />
                      ) : (
                        <DetailRow label="Fin" value={formatDate(request.end_at)} />
                      )}
                      <DetailRow label="Charge" value={request.workload_percent != null ? `${request.workload_percent}%${request.remote ? " · Télétravail" : ""}` : request.remote ? "Non précisée · Télétravail" : "Non précisée"} />
                      <DetailRow 
                        label="Postes disponibles" 
                        value={
                          request.remaining_positions !== undefined 
                            ? `${request.remaining_positions} / ${request.positions_count}`
                            : request.positions_count || 1
                        } 
                      />
                    </dl>
                  </Card>

                  {skillsList.length > 0 && (
                    <Card className="p-4">
                      <SectionHeading title="Compétences requises" icon={Target} />
                      <div className="space-y-1.5">
                        {skillsList.map((skill, index) => (
                          <div key={skill.id ?? `${skill.name}-${index}`} className="flex flex-col gap-2 rounded-xl border border-slate-200 px-3 py-2 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-2">
                              <CheckCircle size={14} className="shrink-0 text-teal-600 dark:text-teal-400" />
                              <span className="break-words text-xs font-semibold text-slate-800 dark:text-slate-200">{skill.name}</span>
                            </div>
                            <span className="w-fit rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
                              {LEVEL_LABEL[skill.pivot?.min_level] || "Intermédiaire"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  <Card className="p-4">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      {isOwner ? "Gestion de la demande" : "Vous êtes intéressé ?"}
                    </h3>
                    <p className="mt-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                      {canSeeRightPanel && "Consultez les propositions reçues ou proposez de nouveaux talents."}
                      {canApply && !alreadyApplied && !conflictMission && "Envoyez votre candidature pour manifester votre intérêt."}
                      {canApply && alreadyApplied && "Votre candidature a déjà été envoyée."}
                      {!isOwner && !isTalentRequest && !canApply && "Contactez l'auteur de la demande."}
                      {canProposeTalent && "Proposez une offre adaptée à ce profil."}
                      {canProposeEmployee && "Proposez l'un de vos salariés pour cette demande."}
                    </p>

                    <div className="mt-3 flex flex-col gap-2">
                      {canSeeRightPanel && !showRightPanel && (
                        <ActionButton
                          onClick={() => { setRightPanelTab("proposals"); setShowRightPanel(true); }}
                          icon={Users}
                          className="w-full justify-start"
                        >
                          Voir les propositions{receivedProposals.length > 0 ? ` (${receivedProposals.length})` : ""}
                        </ActionButton>
                      )}
                      {canApply && !alreadyApplied && (
                        <ActionButton 
                          onClick={() => setShowApply(true)} 
                          disabled={checkingApplied || !!conflictMission}
                          icon={Send} 
                          className="w-full justify-start"
                        >
                          Proposer ma candidature
                        </ActionButton>
                      )}
                      {canApply && alreadyApplied && (
                        <ActionButton variant="success" icon={CheckCircle} onClick={() => { onClose(); setTimeout(() => { navigate("/my-activity?tab=profile"); }, 50); }} className="w-full justify-start">
                          Candidature envoyée
                        </ActionButton>
                      )}
                      {canProposeTalent && (
                        <ActionButton onClick={() => setShowApply(true)} icon={Send} className="w-full justify-start">
                          Proposer une offre
                        </ActionButton>
                      )}
                      {canProposeEmployee && (
                        <ActionButton onClick={() => setShowProposeEmployee(true)} icon={Users} className="w-full justify-start">
                          Proposer un salarié
                        </ActionButton>
                      )}
                      {!isOwner && !isTalentRequest && (
                        <ActionButton onClick={handleDiscuss} icon={MessageCircle} className="w-full justify-start" variant="secondary">
                          Discuter
                        </ActionButton>
                      )}
                    </div>
                  </Card>
                </div>

              </div>
            </div>
          </div>

                   {/* ✅ PANNEAU DROIT (Propositions / Matching) - En-tête Bleu Marine */}
          {showRightPanel && canSeeRightPanel && (
            <div className="hidden max-h-[94vh] w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#112A3A] lg:flex lg:w-1/2">
              
              {/* ✅ EN-TÊTE BLEU MARINE AVEC ONGLETS EN PILULE */}
              <div className="relative flex shrink-0 items-center justify-between overflow-hidden bg-gradient-to-br from-[#0B1F33] to-[#142B49] px-4 py-3">
                
                {/* Effet de lumière */}
                <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-[#16B8B1]/20 blur-3xl" />

                {/* Les onglets */}
                <div className="relative z-10 flex rounded-full bg-white/10 p-1 backdrop-blur-sm">
                  <button 
                    type="button" 
                    onClick={() => setRightPanelTab("proposals")} 
                    className={`relative z-10 rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-300 ${
                      rightPanelTab === "proposals" 
                        ? "bg-[#16B8B1] text-[#0B1F33] shadow-sm" 
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    Propositions ({receivedProposals.length})
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={() => setRightPanelTab("matching")} 
                    className={`relative z-10 rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-300 ${
                      rightPanelTab === "matching" 
                        ? "bg-[#16B8B1] text-[#0B1F33] shadow-sm" 
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    Matching
                  </button>
                </div>

                {/* Bouton fermer */}
                <button
                  type="button"
                  onClick={() => setShowRightPanel(false)}
                  aria-label="Fermer le panneau"
                  className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* CONTENU DU PANNEAU (Adouci) */}
              <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/50 p-4 dark:bg-[#0B1F33]/20 sm:p-5">
                {rightPanelTab === "proposals" ? (
                  <ProposalsList received={receivedProposals} sent={sentProposals} loading={proposalsLoading} />
                ) : (
                  <CandidatesModal
                    requestId={request.id}
                    requestTitle={request.title}
                    onClose={() => setShowRightPanel(false)}
                    relations={proposalsByProfile}
                    onChanged={reloadProposals}
                    embedded
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* PANNEAU DROIT MOBILE */}
        {showRightPanel && canSeeRightPanel && (
          <div className="fixed inset-0 z-[55] overflow-y-auto bg-white dark:bg-[#112A3A] lg:hidden">
            <div className="flex items-center border-b border-slate-100 px-4 pt-2 dark:border-white/10">
              <button type="button" onClick={() => setRightPanelTab("proposals")} className={tabClass(rightPanelTab === "proposals")}>
                Propositions ({receivedProposals.length})
              </button>
              <button type="button" onClick={() => setRightPanelTab("matching")} className={tabClass(rightPanelTab === "matching")}>
                Matching
              </button>
              <button
                type="button"
                onClick={() => setShowRightPanel(false)}
                aria-label="Fermer le panneau"
                className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {rightPanelTab === "proposals" ? (
              <div className="p-5">
                <ProposalsList received={receivedProposals} sent={sentProposals} loading={proposalsLoading} />
              </div>
            ) : (
              <CandidatesModal
                requestId={request.id}
                requestTitle={request.title}
                onClose={() => setShowRightPanel(false)}
                relations={proposalsByProfile}
                onChanged={reloadProposals}
              />
            )}
          </div>
        )}

        {showApply && (
          <ApplyToRequestModal request={request} onClose={() => setShowApply(false)} onSuccess={handleApplySuccess} />
        )}
        {showProposeEmployee && (
          <div className="relative z-[70]">
            <ProposeTalentModal
              myCompanies={myCompanies}
              targetCompany={request.company}
              resourceRequest={request}
              onClose={() => setShowProposeEmployee(false)}
              onSaved={() => {
                setShowProposeEmployee(false);
                setAlreadyApplied(true);
                setSuccessTitle("Proposition envoyée");
                setShowSuccessOverlay(true);
              }}
            />
          </div>
        )}
      </div>

      {showSuccessOverlay && (
        <SuccessOverlay
          title={successTitle}
          subtitle={`Votre proposition a bien été transmise à ${request.author?.name || request.company?.name || "l'utilisateur"}. Vous recevrez une notification dès qu'elle sera consultée.`}
          duration={2600}
          onComplete={() => {
            setShowSuccessOverlay(false);
            onClose();
          }}
        />
      )}
    </>
  );
}