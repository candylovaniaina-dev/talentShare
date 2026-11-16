import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Loader2, Clock, Check, Calendar, Building2, FileText,
  MapPin, AlertCircle, Trash2, Download, ShieldCheck, ChevronRight,
  ArrowRight, X, ChevronDown, ChevronUp
} from "lucide-react";

import AppShell from "../../components/layout/AppShell";
import api from "../../services/api";
import PublicPortfolio from "../PublicPortfolio";

// ======================================================
// THEME & CONFIG
// ======================================================

const STATUS_CFG = {
  sent: { label: "Envoyée", step: 1, color: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
  viewed: { label: "Consultée", step: 2, color: "bg-sky-50 text-sky-700 border-sky-100", dot: "bg-sky-500" },
  shortlisted: { label: "Présélectionnée", step: 3, color: "bg-violet-50 text-violet-700 border-violet-100", dot: "bg-violet-500" },
  interview: { label: "Entretien", step: 4, color: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500" },
  accepted: { label: "Acceptée", step: 5, color: "bg-[#0B2235] text-white border-[#0B2235]", dot: "bg-[#16B8B1]" },
  rejected: { label: "Refusée", step: 0, color: "bg-rose-50 text-rose-700 border-rose-100", dot: "bg-rose-500" },
};

const STEPS = [
  { key: "sent", label: "Envoyée" },
  { key: "viewed", label: "Consultée" },
  { key: "shortlisted", label: "Présélectionnée" },
  { key: "interview", label: "Entretien" },
  { key: "accepted", label: "Décision" },
];

// ======================================================
// HELPERS
// ======================================================

function formatDate(value, options = {}) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", options);
}

function getDocumentUrl(path) {
  if (!path || typeof path !== "string") return "";
  const value = path.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const baseURL = api.defaults?.baseURL || window.location.origin;
  const serverBase = baseURL.replace(/\/api\/v\d+\/?$/i, "").replace(/\/api\/?$/i, "").replace(/\/+$/, "");
  let cleanPath = value.replace(/^\/+/, "");
  if (!cleanPath.startsWith("storage/")) cleanPath = `storage/${cleanPath}`;
  return `${serverBase}/${cleanPath}`;
}

function getPortfolioSlug(portfolio) {
  return (
    portfolio?.public_slug || portfolio?.slug ||
    portfolio?.portfolio?.public_slug || portfolio?.portfolio?.slug || ""
  );
}

// ======================================================
// UI COMPONENTS
// ======================================================

function Card({ children, className = "" }) {
  return (
    <section className={`overflow-hidden rounded-3xl border border-[#EBF1F6] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 ${className}`}>
      {children}
    </section>
  );
}

function SectionHeader({ title, subtitle, right }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F4F8] bg-white/50 px-6 py-5">
      <div>
        <h2 className="text-sm font-extrabold tracking-tight text-[#0B2235]">{title}</h2>
        {subtitle && <p className="mt-1 text-[11px] font-medium text-[#8796A6]">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

function InfoItem({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#94A3B2]">{label}</p>
      <p className="mt-1.5 break-words text-[13px] font-semibold leading-relaxed text-[#263C4D]">{children}</p>
    </div>
  );
}

function DocumentLink({ href, title, subtitle, download = false }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...(download ? { download: true } : {})}
      className="group flex min-w-0 items-center gap-3 rounded-2xl border border-[#EBF1F6] bg-white p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#16B8B1]/40 hover:shadow-md">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F8F7] text-[#109E98]"><FileText size={18} /></div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-[#0B2235]">{title}</p>
        <p className="mt-0.5 truncate text-[11px] text-[#8493A3]">{subtitle}</p>
      </div>
      <Download size={16} className="shrink-0 text-[#94A3B2] transition group-hover:text-[#16A9A3]" />
    </a>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.sent;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-bold shadow-sm ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function ApplicationTimeline({ currentStep }) {
  return (
    <div className="px-6 py-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[13px] font-extrabold text-[#0B2235]">Suivi de votre candidature</h3>
        <span className="rounded-full bg-[#E9F8F7] px-3 py-1 text-[10px] font-bold text-[#109E98]">
          {currentStep} / {STEPS.length}
        </span>
      </div>
      <div className="relative">
        <div className="absolute left-[10%] right-[10%] top-[13px] h-[3px] rounded-full bg-[#E8EDF2]" />
        <div
          className="absolute left-[10%] top-[13px] h-[3px] rounded-full bg-[#16B8B1] transition-all duration-700 ease-in-out"
          style={{ width: `${(Math.max(0, currentStep - 1) / (STEPS.length - 1)) * 80}%` }}
        />
        <div className="relative grid grid-cols-5">
          {STEPS.map((step, index) => {
            const stepNumber = index + 1;
            const done = stepNumber <= currentStep;
            const current = stepNumber === currentStep;
            return (
              <div key={step.key} className="flex min-w-0 flex-col items-center text-center">
                <div className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-[3px] transition-all duration-300 ${
                  done ? "border-[#16B8B1] bg-[#16B8B1] text-white" : "border-[#E2EAF0] bg-white text-[#BCC7D1]"
                } ${current ? "ring-4 ring-[#16B8B1]/20" : ""}`}>
                  {done ? <Check size={12} strokeWidth={3} /> : <span className="text-[9px] font-bold">{stepNumber}</span>}
                </div>
                <span className={`mt-2.5 max-w-full text-[9.5px] font-bold leading-3 ${done ? "text-[#0B2235]" : "text-[#9BA8B5]"}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ======================================================
// PAGE PRINCIPALE
// ======================================================

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const [missionId, setMissionId] = useState(null);
  const [linkedMission, setLinkedMission] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [isLetterExpanded, setIsLetterExpanded] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    api.get(`/applications/${id}`)
      .then(async (res) => {
        if (!active) return;
        const appData = res?.data?.data ?? res?.data;
        setApplication(appData);

        if (appData.status === "accepted" && appData.job_offer_id) {
          try {
            const missionsRes = await api.get("/missions");
            const missions = Array.isArray(missionsRes.data) ? missionsRes.data : missionsRes.data?.data || [];
            const linked = missions.find((m) => m.job_offer_id === appData.job_offer_id);
            if (active && linked) {
              setMissionId(linked.id);
              setLinkedMission(linked);
            }
          } catch (err) {
            console.error("Impossible de trouver la mission liée", err);
          }
        }

        const portfolio = appData.portfolio || appData.portfolio_data;
        const slug = getPortfolioSlug(portfolio);
        if (slug) {
          try {
            const portfolioRes = await api.get(`/portfolio/${encodeURIComponent(slug)}`);
            if (active) setPortfolioData(portfolioRes?.data?.data ?? portfolioRes?.data);
          } catch (err) {
            console.error("Erreur portfolio :", err);
          }
        }
      })
      .catch((err) => {
        if (!active) return;
        if (err.response?.status === 404) {
          navigate(`/proposals/${id}`, { replace: true });
          return;
        }
        setError(err.response?.status === 403 ? "forbidden" : "not_found");
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [id, navigate]);

  const documents = useMemo(() => {
    if (!application) return {};
    const portfolio = application.portfolio || application.portfolio_data || null;
    const slug = getPortfolioSlug(portfolio);
    const cvPath =
      application.cv_path || application.cv?.path || application.cv?.url ||
      application.profile?.cv_path || application.candidate?.cv_path ||
      application.user?.cv_path || application.profile_data?.cv_path || "";
    return {
      portfolio,
      portfolioSlug: slug,
      portfolioUrl: slug ? `/portfolio/${encodeURIComponent(slug)}` : "",
      cvUrl: getDocumentUrl(cvPath),
    };
  }, [application]);

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
        <main className="flex min-h-[70vh] items-center justify-center bg-[#F3F6FA] px-4">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
              <Loader2 size={26} className="animate-spin text-[#16B8B1]" />
            </div>
            <p className="mt-4 text-sm font-semibold text-[#0B2235]">Chargement de votre candidature</p>
          </div>
        </main>
      </AppShell>
    );
  }

  if (error || !application) {
    return (
      <AppShell>
        <main className="flex min-h-[70vh] items-center justify-center bg-[#F3F6FA] px-4">
          <div className="w-full max-w-md rounded-3xl border border-[#E2EAF1] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
              <AlertCircle size={27} />
            </div>
            <h1 className="mt-5 text-xl font-bold text-[#0B2235]">
              {error === "forbidden" ? "Accès refusé" : "Candidature introuvable"}
            </h1>
            <Link to="/applications" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0B2235] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#153C53]">
              <ArrowLeft size={16} /> Retour
            </Link>
          </div>
        </main>
      </AppShell>
    );
  }

  const cfg = STATUS_CFG[application.status] || STATUS_CFG.sent;
  const currentStep = cfg.step;
  const isWithdrawable = !["accepted", "rejected"].includes(application.status);
  const offer = application.job_offer || {};
  const company = offer.company || {};
  const hasDocuments = Boolean(documents.portfolioUrl || documents.cvUrl);

  const getContractText = () => {
    const type = (offer.offer_type || offer.employment_type || "").toLowerCase();
    const title = offer.title || "ce poste";
    const companyName = company.name || "L'entreprise";
    if (type.includes("intern") || type.includes("stage")) return `${companyName} a accepté votre candidature pour le stage de ${title}.`;
    if (type.includes("apprenti") || type.includes("alternance")) return `${companyName} a accepté votre candidature pour l'alternance de ${title}.`;
    if (type.includes("cdd")) return `${companyName} a accepté votre candidature pour le CDD de ${title}.`;
    if (type.includes("cdi") || type.includes("permanent")) return `${companyName} a accepté votre candidature pour le CDI de ${title}.`;
    return `${companyName} a accepté votre candidature pour le poste de ${title}.`;
  };

  const letterText = application.cover_letter || "";
  const isLetterLong = letterText.length > 200;
  const displayedLetter = isLetterExpanded ? letterText : letterText.slice(0, 200) + (isLetterLong ? "..." : "");
  const isTrial = linkedMission?.status === "trial";

  return (
    <AppShell>
      <main translate="no" className="min-h-screen bg-[#F3F6FA] px-4 py-8 font-['Plus_Jakarta_Sans',sans-serif] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {isTrial && (
            <div className="rounded-3xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-violet-900">
                    Période d'essai en cours
                    {linkedMission.trial_ends_at && ` · jusqu'au ${formatDate(linkedMission.trial_ends_at)}`}
                  </h2>
                  <p className="mt-1 text-xs font-medium text-violet-800/80">
                    À l'issue de l'essai, l'entreprise confirmera (ou non) votre embauche en CDI.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            
            {/* ======================================================== */}
            {/* COLONNE 1 : ESPACE PRO + ACCEPTATION + DOCUMENTS         */}
            {/* ======================================================== */}
            <div className="space-y-6">
              
              {/* BLOC ESPACE PRO */}
              <Card className="border-none ring-1 ring-[#0B2235]/5 shadow-lg shadow-[#0B2235]/5">
                <div className="relative overflow-hidden bg-[#0B2235] p-6 text-white">
                  <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full border border-white/[0.06]" />
                  <div className="relative">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="text-[9.5px] font-extrabold uppercase tracking-[0.2em] text-[#16B8B1]">Espace professionnel</span>
                      <span className="h-1 w-1 rounded-full bg-white/30" />
                      <span className="text-[9.5px] font-medium text-white/50">Suivi</span>
                    </div>
                    <h1 className="break-words text-xl font-bold leading-tight tracking-tight">
                      {offer.title || "Ma candidature"}
                    </h1>
                    <div className="mt-4 space-y-2.5 text-[13px] text-white/75">
                      {company.name && (
                        <div className="flex items-center gap-2.5"><Building2 size={15} className="text-[#16B8B1]" />{company.name}</div>
                      )}
                      {offer.city && (
                        <div className="flex items-center gap-2.5"><MapPin size={15} className="text-[#16B8B1]" />{offer.city}{offer.country ? `, ${offer.country}` : ""}</div>
                      )}
                    </div>
                    <div className="mt-6 border-t border-white/10 pt-5 space-y-4">
                      <div>
                        <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-2">Statut actuel</p>
                        <StatusBadge status={application.status} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Date</p>
                          <p className="mt-1 text-[12px] font-semibold text-white/90">
                            {formatDate(application.created_at, { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Contrat</p>
                          <p className="mt-1 text-[12px] font-semibold text-white/90">
                            {offer.offer_type || offer.employment_type || "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* BLOC ACCEPTÉ */}
              {application.status === "accepted" && (
                <div className="overflow-hidden rounded-3xl border border-[#0B2235] bg-[#0B2235] shadow-xl shadow-[#0B2235]/10">
                  <div className="border-b border-white/10 p-6">
                    <div className="mb-3 inline-flex rounded-full border border-[#16B8B1]/30 bg-[#16B8B1]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#54DCD4]">
                      Candidature acceptée
                    </div>
                    <h3 className="text-lg font-bold text-white">Félicitations !</h3>
                    <p className="mt-1.5 text-[12px] font-medium leading-relaxed text-white/65">Vous faites désormais partie de l'équipe.</p>
                  </div>
                  <div className="p-6">
                    <p className="text-[13px] font-medium leading-6 text-white/75">{getContractText()}</p>
                    {missionId && (
                      <Link to={`/missions/${missionId}`}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#16B8B1] px-4 py-3 text-[13px] font-bold text-[#0B2235] transition-all hover:bg-[#40D2CB] hover:shadow-lg hover:shadow-[#16B8B1]/20">
                        Accéder à ma mission <ArrowRight size={16} />
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* BLOC MES DOCUMENTS */}
              {hasDocuments && (
                <Card>
                  <SectionHeader title="Mes documents" subtitle="Pièces jointes" />
                  <div className="space-y-3 p-5">
                    {documents.portfolioUrl ? (
                      <button type="button" onClick={() => setShowPortfolioModal(true)}
                        className="group flex w-full items-center gap-3 rounded-2xl border border-[#EBF1F6] bg-white p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#16B8B1]/40 hover:shadow-md">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F8F7] text-[#109E98]"><FileText size={18} /></div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-bold text-[#0B2235]">{documents.portfolio?.title || "Mon portfolio public"}</p>
                          <p className="mt-0.5 text-[11px] font-medium text-[#8796A6]">Consulter mon portfolio</p>
                        </div>
                        <ChevronRight size={16} className="shrink-0 text-[#9BA9B6] transition group-hover:translate-x-1 group-hover:text-[#16B8B1]" />
                      </button>
                    ) : documents.portfolio ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-medium text-amber-800">
                        Le portfolio est associé, mais son slug public est absent.
                      </div>
                    ) : null}
                    {documents.cvUrl && (
                      <DocumentLink href={documents.cvUrl} title="Curriculum Vitæ" subtitle="Ouvrir ou télécharger" download />
                    )}
                  </div>
                </Card>
              )}
            </div>

            {/* ======================================================== */}
            {/* COLONNE 2 : SUIVI + LETTRE DE MOTIVATION                 */}
            {/* ======================================================== */}
            <div className="space-y-6">
              <Card>
                {application.status !== "rejected" ? (
                  <ApplicationTimeline currentStep={currentStep} />
                ) : (
                  <div className="p-6">
                    <div className="flex items-start gap-4 rounded-2xl border border-rose-100 bg-rose-50/70 p-5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-rose-500 shadow-sm"><AlertCircle size={18} /></div>
                      <div>
                        <h3 className="text-sm font-bold text-rose-900">Candidature non retenue</h3>
                        <p className="mt-1 text-xs font-medium leading-relaxed text-rose-700/80">Cette candidature n'a pas été retenue.</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {application.cover_letter && (
                <Card>
                  <SectionHeader title="Lettre de motivation" subtitle="Message transmis à l'entreprise" />
                  <div className="p-5">
                    <div className="relative rounded-2xl border border-[#E7EDF2] bg-[#F8FAFC] p-5">
                      <div className="absolute left-0 top-5 bottom-5 w-[3px] rounded-full bg-[#16B8B1]" />
                      <p className="whitespace-pre-wrap break-words pl-4 text-[13px] font-medium leading-7 text-[#536577]">
                        {displayedLetter}
                      </p>
                      
                      {isLetterLong && (
                        <div className="mt-4 pl-4">
                          <button 
                            type="button" 
                            onClick={() => setIsLetterExpanded(!isLetterExpanded)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#16B8B1]/10 px-3 py-1.5 text-[11px] font-bold text-[#109E98] transition-all duration-200 hover:bg-[#16B8B1]/20 hover:text-[#0B2235]"
                          >
                            {isLetterExpanded ? (
                              <><ChevronUp size={14} /> Voir moins</>
                            ) : (
                              <><ChevronDown size={14} /> Voir plus</>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* ======================================================== */}
            {/* COLONNE 3 : INFOS GÉNÉRALES + EXTRAS                     */}
            {/* ======================================================== */}
            <div className="space-y-6">
              <Card>
                <SectionHeader title="Informations générales" subtitle="Récapitulatif de votre candidature" />
                <div className="grid gap-5 p-6 sm:grid-cols-2">
                  <InfoItem label="Date">{formatDate(application.created_at, { day: "numeric", month: "long", year: "numeric" })}</InfoItem>
                  <InfoItem label="Statut">
                    <span className="inline-flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />{cfg.label}</span>
                  </InfoItem>
                  <InfoItem label="Entreprise">{company.name || "—"}</InfoItem>
                  <InfoItem label="Localisation">
                    {offer.city ? `${offer.city}${offer.country ? `, ${offer.country}` : ""}` : "—"}
                  </InfoItem>
                  <InfoItem label="Contrat">{offer.offer_type || offer.employment_type || "—"}</InfoItem>
                  <InfoItem label="Poste">{offer.title || "—"}</InfoItem>
                </div>
              </Card>

              {application.recruiter_notes && (
                <Card>
                  <SectionHeader title="Retour du recruteur" subtitle="Informations communiquées" />
                  <div className="p-5">
                    <div className="rounded-2xl border border-[#D8EEEC] bg-[#F0FAF9] p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="h-1 w-4 rounded-full bg-[#16B8B1]" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#128D87]">Message</span>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-[13px] font-medium leading-6 text-[#405968]">{application.recruiter_notes}</p>
                    </div>
                  </div>
                </Card>
              )}

              {application.status === "interview" && application.interview_at && (
                <Card>
                  <SectionHeader title="Entretien programmé" subtitle="Votre rendez-vous" />
                  <div className="p-5">
                    <div className="rounded-2xl border border-[#F1E6C9] bg-[#FFFBF1] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#A58A4C]">Date</p>
                      <p className="mt-1.5 text-sm font-bold capitalize leading-5 text-[#624D22]">
                        {formatDate(application.interview_at, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      </p>
                      <div className="mt-2.5 flex items-center gap-2 text-[13px] font-semibold text-[#927437]">
                        <Clock size={15} /> À {new Date(application.interview_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      {application.interview_link && (
                        <a href={application.interview_link} target="_blank" rel="noopener noreferrer"
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B2235] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#153C53]">
                          Rejoindre l'entretien
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {isWithdrawable && (
                <Card>
                  <div className="p-5">
                    <p className="text-[13px] font-bold text-[#0B2235]">Gérer ma candidature</p>
                    <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-[#8796A6]">Vous pouvez retirer votre candidature.</p>
                    <button type="button" onClick={withdraw} disabled={withdrawing}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-[13px] font-bold text-rose-600 transition-all hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 hover:shadow-sm disabled:opacity-50">
                      {withdrawing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      {withdrawing ? "Retrait..." : "Retirer ma candidature"}
                    </button>
                  </div>
                </Card>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#E2EAF1] pt-6 pb-2">
            <p className="text-[11px] font-medium text-[#96A3B0]">TalentShare · Connecter les talents</p>
          </div>
        </div>

        {showPortfolioModal && portfolioData && (
          <PublicPortfolio asModal={true} onClose={() => setShowPortfolioModal(false)} data={portfolioData} />
        )}
      </main>
    </AppShell>
  );
}