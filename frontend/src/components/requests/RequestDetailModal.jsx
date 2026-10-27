import React, { useEffect, useState } from "react";
import {
  X, CheckCircle, MapPin, Building2, UserRound, CalendarDays,
  Banknote, FileText, Target, Send, Clock3, BriefcaseBusiness,
  Monitor, Users, MessageCircle, AlertCircle, LoaderCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import CandidatesModal from "./CandidatesModal";
import ApplyToRequestModal from "./ApplyToRequestModal";
import SuccessOverlay from "./SuccessOverlay";

/* ============================================================
   HELPERS & CONSTANTES
============================================================ */
const BASE_URL = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
const fileUrl = (p) => (!p ? null : /^https?:/.test(p) ? p : `${BASE_URL}/storage/${p}`);

const STATUS_LABELS = {
  draft: "Brouillon",
  published: "Publiée",
  paused: "En pause",
  closed: "Fermée",
  filled: "Pourvue",
  expired: "Expirée",
};

const STATUS_STYLES = {
  draft: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
  published: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  paused: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  closed: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  filled: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  expired: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400",
};

// ✅ Traduction des types de contrat
const CONTRACT_LABELS = {
  stage: "Stage",
  alternance: "Alternance",
  emploi: "Emploi (CDI)",
  cdi: "CDI",
  mission: "Mission freelance",
};

const LEVEL_LABEL = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
  expert: "Expert",
};

const formatDate = (date) => {
  if (!date) return "Non précisée";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Non précisée";
  return parsed.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

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
  if (score >= 90) return { color: "#059669", label: "Excellente", description: "Votre profil correspond très fortement aux besoins." };
  if (score >= 75) return { color: "#0D9488", label: "Très bonne", description: "Votre profil présente une très bonne correspondance." };
  if (score >= 60) return { color: "#0D9488", label: "Bonne", description: "Plusieurs éléments de votre profil correspondent." };
  if (score >= 40) return { color: "#D97706", label: "Partielle", description: "Une partie des compétences correspond aux besoins." };
  if (score >= 20) return { color: "#EA580C", label: "Faible", description: "La correspondance avec les besoins reste limitée." };
  return { color: "#64748B", label: "Faible", description: "Peu d'éléments de correspondance ont été détectés." };
}

/* ============================================================
   SOUS-COMPOSANTS
============================================================ */
function Card({ children, className = "", ...props }) {
  return (
    <section className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#112A3A] ${className}`} {...props}>
      {children}
    </section>
  );
}

function SectionHeading({ title, subtitle, icon: Icon }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      {Icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          <Icon size={19} strokeWidth={1.8} />
        </div>
      )}
      <div className="min-w-0">
        <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-lg">{title}</h2>
        {subtitle && <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
      {Icon && (
        <div className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500">
          <Icon size={17} strokeWidth={1.8} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold leading-5 text-slate-800 dark:text-slate-200">{value ?? "Non précisé"}</p>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-4 border-b border-slate-100 px-4 py-3.5 last:border-0 dark:border-white/10 sm:px-5">
      <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="break-words text-right text-sm font-semibold text-slate-800 dark:text-slate-200">{value ?? "Non précisé"}</dd>
    </div>
  );
}

function MatchCircle({ score, size = 92 }) {
  const safeScore = clampScore(score);
  const { color } = getMatchLevel(safeScore);
  const radius = size / 2 - 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - safeScore / 100);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Compatibilité : ${safeScore} %`}>
      <svg className="-rotate-90" viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" className="text-slate-100 dark:text-white/10" strokeWidth="7" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 700ms ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tracking-tight" style={{ color }}>{safeScore}%</span>
        <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-400">Matching</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
      {STATUS_LABELS[status] || "Statut inconnu"}
    </span>
  );
}

function ActionButton({ children, onClick, variant = "primary", disabled = false, icon: Icon, className = "" }) {
  const variants = {
    primary: "border border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800 dark:border-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500",
    secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10",
    success: "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
  };

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}>
      {Icon && <Icon size={16} strokeWidth={1.9} />}
      {children}
    </button>
  );
}

/* ============================================================
   COMPOSANT PRINCIPAL
============================================================ */
export default function RequestDetailModal({ requestId, onClose, autoOpenCandidates = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCandidates, setShowCandidates] = useState(false);
  const [showApply, setShowApply] = useState(false);

  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [checkingApplied, setCheckingApplied] = useState(true);

  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [successTitle, setSuccessTitle] = useState("Candidature envoyée");

  /* Chargement de la demande */
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

  /* Vérification de la candidature existante */
  useEffect(() => {
    if (!request || !user) {
      setCheckingApplied(false);
      return;
    }

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

  /* Ouverture automatique des candidats pour le propriétaire */
  useEffect(() => {
    if (!request || !user) return;
    const isOwner =
      user.id === request.created_by ||
      (user.role === "company" && user.companies?.some((company) => company.id === request.company_id));
    if (autoOpenCandidates && isOwner) setShowCandidates(true);
  }, [request, user, autoOpenCandidates]);

  /* Fermeture avec Échap */
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event) => {
      if (event.key !== "Escape" || showSuccessOverlay) return;
      if (showCandidates) setShowCandidates(false);
      else if (showApply) setShowApply(false);
      else onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, showCandidates, showApply, showSuccessOverlay]);

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

  /* État de chargement */
  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-2xl dark:border-white/10 dark:bg-[#112A3A]">
          <LoaderCircle size={30} className="mx-auto animate-spin text-emerald-600" />
          <p className="mt-4 text-sm font-semibold text-slate-800 dark:text-white">Chargement de la demande</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Veuillez patienter quelques instants.</p>
        </div>
      </div>
    );
  }

  /* Gestion des erreurs */
  if (error || !request) {
    const forbidden = error === "forbidden";
    const notFound = error === "not_found";
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-7 shadow-2xl dark:border-white/10 dark:bg-[#112A3A]" onClick={(event) => event.stopPropagation()}>
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

  /* Permissions et données */
  const isOwner =
    user?.id === request.created_by ||
    (user?.role === "company" && user?.companies?.some((company) => company.id === request.company_id));

  const isCompanyRole = user?.role === "company" || user?.role === "entreprise";
  const isTalentRole = user?.role === "employee" || user?.role === "student";
  const isTalentRequest = request.author_type === "talent";
  
  // ✅ EST-CE UN CDI ? (vérifie aussi si la fin est nulle, pour forcer l'affichage)
  const isCDI = 
    request.contract_type === "emploi" || 
    request.contract_type === "cdi" || 
    request.contract_type === "CDI" ||
    (request.contract_type && String(request.contract_type).toLowerCase().includes("emploi")) ||
    (!request.end_at && request.start_at);

  const canSeeTalents = isOwner && !isTalentRequest && isCompanyRole;
  const canApply = !isOwner && isTalentRole && !isTalentRequest;
  const canProposeTalent = !isOwner && isCompanyRole && isTalentRequest;

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

  const maxWidth = showCandidates ? "max-w-[1100px]" : "max-w-3xl";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5" role="dialog" aria-modal="true" aria-labelledby="request-detail-title">
        <button type="button" aria-label="Fermer la fenêtre" onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />

        <div className={`relative z-10 flex w-full items-stretch justify-center gap-4 ${maxWidth}`}>
          
          {/* Panneau principal */}
          <div className={`flex max-h-[94vh] min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#112A3A] ${showCandidates ? "hidden w-full lg:flex lg:w-1/2" : "w-full"}`}>
            
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-white/10 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                
                {/* AVATAR DYNAMIQUE DANS LE HEADER */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  {isTalentRequest ? (
                    request.author?.professional_profile?.avatar_path || request.author?.avatar_path ? (
                      <img src={fileUrl(request.author?.professional_profile?.avatar_path || request.author?.avatar_path)} alt={request.author?.name} className="h-full w-full object-cover" />
                    ) : (
                      <UserRound size={18} />
                    )
                  ) : (
                    request.company?.logo_path ? (
                      <img src={fileUrl(request.company.logo_path)} alt={request.company?.name} className="h-full w-full object-cover" />
                    ) : (
                      <Building2 size={18} />
                    )
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Détail de la demande</p>
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {isTalentRequest ? "Profil de talent" : "Besoin en ressources"}
                  </p>
                </div>
              </div>

              <button type="button" onClick={onClose} aria-label="Fermer" className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white">
                <X size={19} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-4 bg-slate-50/70 p-4 dark:bg-[#0B1F33]/40 sm:p-6">
                
                {/* Présentation */}
                <Card className="overflow-hidden">
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={request.display_status} />
                      <span className="inline-flex items-center rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:text-slate-300">
                        {isTalentRequest ? "Talent disponible" : "Demande d'entreprise"}
                      </span>
                      {request.urgency === "urgent" && (
                        <span className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">Urgent</span>
                      )}
                      {alreadyApplied && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                          <CheckCircle size={13} /> Candidature envoyée
                        </span>
                      )}
                    </div>

                    <h1 id="request-detail-title" className="mt-4 break-words text-xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                      {request.title || "Demande de ressource"}
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      Consultez les informations, les compétences attendues et les modalités de cette opportunité.
                    </p>

                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {(request.city || request.country) && (
                        <InfoItem icon={MapPin} label="Localisation" value={[request.city, request.country].filter(Boolean).join(", ")} />
                      )}

                      {isTalentRequest ? (
                        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
                          {request.author?.professional_profile?.avatar_path || request.author?.avatar_path ? (
                            <img src={fileUrl(request.author?.professional_profile?.avatar_path || request.author?.avatar_path)} alt={request.author?.name} className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                              <UserRound size={18} />
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Talent</p>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{request.author?.name}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
                          {request.company?.logo_path ? (
                            <img src={fileUrl(request.company.logo_path)} alt={request.company?.name} className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                              <Building2 size={18} />
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Entreprise</p>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{request.company?.name}</p>
                          </div>
                        </div>
                      )}

                      {request.remote && (
                        <InfoItem icon={Monitor} label="Mode de travail" value="Télétravail possible" />
                      )}
                      {request.budget_min != null && request.budget_max != null && (
                        <InfoItem icon={Banknote} label="Budget journalier" value={`${request.budget_min} – ${request.budget_max} € / jour`} />
                      )}
                    </div>

                    {request.expires_at && (
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 dark:border-white/10">
                        <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                          <CalendarDays size={16} /> Date d'expiration
                        </span>
                        <span className={`text-sm font-semibold ${isExpiringSoon ? "text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-slate-200"}`}>
                          {formatDate(request.expires_at)}
                        </span>
                      </div>
                    )}

                    {isExpiringSoon && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                        <Clock3 size={16} className="mt-0.5 shrink-0" />
                        <p>Cette demande arrive bientôt à expiration.</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Compatibilité */}
                {showMatch && (
                  <Card className="p-5 sm:p-6">
                    <SectionHeading title="Compatibilité de votre profil" subtitle="Estimation de la correspondance avec les besoins de cette demande." icon={Target} />
                    <div className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:items-center">
                      <div className="flex shrink-0 flex-col items-center">
                        <MatchCircle score={matchScore} size={92} />
                        <span className="mt-2 text-sm font-bold" style={{ color: matchLevel.color }}>{matchLevel.label}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{matchLevel.description}</p>
                        {skillsText && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{skillsText}</p>}
                        <div className="mt-4">
                          <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                            <span className="text-slate-500 dark:text-slate-400">Score de compatibilité</span>
                            <span className="font-bold" style={{ color: matchLevel.color }}>{matchScore}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10" role="progressbar" aria-valuenow={matchScore} aria-valuemin={0} aria-valuemax={100} aria-label="Score de compatibilité">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${matchScore}%`, backgroundColor: matchLevel.color }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Description et domaines */}
                {(request.description || tagsList.length > 0) && (
                  <Card className="p-5 sm:p-6">
                    {request.description && (
                      <div>
                        <SectionHeading title="À propos de la mission" subtitle="Description et objectifs de la demande." icon={FileText} />
                        <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">
                          <p className="whitespace-pre-line break-words text-sm leading-7 text-slate-600 dark:text-slate-300">{request.description}</p>
                        </div>
                      </div>
                    )}
                    {tagsList.length > 0 && (
                      <div className={request.description ? "mt-6" : ""}>
                        <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">Domaines et mots-clés</h3>
                        <div className="flex flex-wrap gap-2">
                          {tagsList.map((tag, index) => {
                            const label = getTagLabel(tag);
                            if (!label) return null;
                            return (
                              <span key={`${label}-${index}`} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300">
                                {label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                {/* Compétences */}
                {skillsList.length > 0 && (
                  <Card className="p-5 sm:p-6">
                    <SectionHeading title="Compétences requises" subtitle="Les compétences associées à cette demande." icon={Target} />
                    <div className="space-y-2">
                      {skillsList.map((skill, index) => (
                        <div key={skill.id ?? `${skill.name}-${index}`} className="flex flex-col gap-2 rounded-xl border border-slate-200 px-3.5 py-3 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <CheckCircle size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span className="break-words text-sm font-semibold text-slate-800 dark:text-slate-200">{skill.name}</span>
                          </div>
                          <span className="w-fit rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
                            {LEVEL_LABEL[skill.pivot?.min_level] || "Intermédiaire"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* ✅ INFORMATIONS PRATIQUES (Corrigé pour le CDI) */}
                <Card className="p-5 sm:p-6">
                  <SectionHeading title="Informations pratiques" subtitle="Période, charge de travail et modalités." icon={BriefcaseBusiness} />
                  <dl className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
                    {/* Ajout du type de contrat avec fallback */}
                    <DetailRow 
                      label="Type de contrat" 
                      value={CONTRACT_LABELS[request.contract_type] || request.contract_type || "Non précisé"} 
                    />
                    
                    <DetailRow label="Début" value={formatDate(request.start_at)} />
                    
                    {/* ✅ Si c'est un CDI, on n'affiche pas la date de fin */}
                    {isCDI ? (
                      <DetailRow label="Fin" value="Indéterminée (CDI)" />
                    ) : (
                      <DetailRow label="Fin" value={formatDate(request.end_at)} />
                    )}
                    
                    <DetailRow label="Charge de travail" value={request.workload_percent != null ? `${request.workload_percent}%${request.remote ? " · Télétravail" : ""}` : request.remote ? "Non précisée · Télétravail" : "Non précisée"} />
                    <DetailRow label="Localisation" value={[request.city, request.country].filter(Boolean).join(", ") || "Non précisée"} />
                    <DetailRow label="Nombre de postes" value={request.positions_count || 1} />
                    {request.expires_at && <DetailRow label="Date d'expiration" value={formatDate(request.expires_at)} />}
                  </dl>
                </Card>
              </div>

              {/* Pied de page et actions */}
              <div className="border-t border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#112A3A] sm:px-6 sm:py-5">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isOwner ? "Gestion de la demande" : "Vous êtes intéressé ?"}
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                    {canSeeTalents && "Consultez les profils des talents correspondant à cette demande."}
                    {canApply && !alreadyApplied && "Envoyez votre candidature pour manifester votre intérêt."}
                    {canApply && alreadyApplied && "Votre candidature a déjà été envoyée. Vous pouvez consulter son suivi."}
                    {!isOwner && !isTalentRequest && !canApply && "Contactez l'auteur de la demande pour échanger à propos de cette opportunité."}
                    {canProposeTalent && "Proposez une offre adaptée à ce profil."}
                    {isOwner && !canSeeTalents && "Consultez les informations de votre demande."}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {canSeeTalents && !showCandidates && (
                    <ActionButton onClick={() => setShowCandidates(true)} icon={Users} className="w-full sm:w-auto">
                      Voir les talents
                    </ActionButton>
                  )}

                  {canApply && !alreadyApplied && (
                    <ActionButton onClick={() => setShowApply(true)} disabled={checkingApplied} icon={Send} className="w-full sm:w-auto">
                      Proposer ma candidature
                    </ActionButton>
                  )}

                  {canApply && alreadyApplied && (
                    <ActionButton variant="success" icon={CheckCircle} onClick={() => { onClose(); setTimeout(() => { navigate("/my-activity?tab=profile"); }, 50); }} className="w-full sm:w-auto">
                      Candidature envoyée
                    </ActionButton>
                  )}

                  {canProposeTalent && (
                    <ActionButton onClick={() => setShowApply(true)} icon={Send} className="w-full sm:w-auto">
                      Proposer une offre
                    </ActionButton>
                  )}

                  {!isOwner && !isTalentRequest && (
                    <ActionButton onClick={handleDiscuss} icon={MessageCircle} className="w-full sm:w-auto">
                      Discuter
                    </ActionButton>
                  )}

                  <ActionButton variant="secondary" onClick={onClose} className="w-full sm:ml-auto sm:w-auto">
                    Fermer
                  </ActionButton>
                </div>
              </div>
            </div>
          </div>

          {/* Panneau des candidats */}
          {showCandidates && canSeeTalents && (
            <div className="hidden max-h-[94vh] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#112A3A] lg:flex lg:w-1/2">
              <CandidatesModal requestId={request.id} requestTitle={request.title} onClose={() => setShowCandidates(false)} embedded />
            </div>
          )}
        </div>

        {/* Version mobile du panneau des candidats */}
        {showCandidates && canSeeTalents && (
          <div className="fixed inset-0 z-[55] overflow-y-auto bg-white dark:bg-[#112A3A] lg:hidden">
            <CandidatesModal requestId={request.id} requestTitle={request.title} onClose={() => setShowCandidates(false)} />
          </div>
        )}

        {/* Formulaire de candidature */}
        {showApply && (
          <ApplyToRequestModal request={request} onClose={() => setShowApply(false)} onSuccess={handleApplySuccess} />
        )}
      </div>

      {/* Confirmation de succès */}
      {showSuccessOverlay && (
        <SuccessOverlay
          title={successTitle}
          subtitle={`Votre proposition a bien été transmise à ${request.author?.name || request.company?.name || "l'utilisateur"}. Vous recevrez une notification dès qu'elle sera consultée.`}
          duration={2600}
          onComplete={() => {
            setShowSuccessOverlay(false);
            onClose();
            setTimeout(() => { navigate("/my-activity?tab=profile"); }, 300);
          }}
        />
      )}
    </>
  );
}