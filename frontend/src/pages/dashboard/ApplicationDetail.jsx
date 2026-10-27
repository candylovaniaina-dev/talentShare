import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Loader2, Clock, Check, Calendar, Building2, FileText,
  Briefcase, Video, MapPin, ExternalLink, AlertCircle, Trash2,
  Download, ShieldCheck, ChevronRight, Circle, X,
  CheckCircle2, MessageCircle, // ✅ Ajouté ici
} from "lucide-react";
import AppShell from "../../components/layout/AppShell";
import api from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

import PublicPortfolio from "../PublicPortfolio";

const STATUS_CFG = {
  sent: { label: "Envoyée", step: 1, tone: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700", dot: "bg-slate-400" },
  viewed: { label: "Consultée", step: 2, tone: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800", dot: "bg-sky-500" },
  shortlisted: { label: "Présélectionnée", step: 3, tone: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800", dot: "bg-violet-500" },
  interview: { label: "Entretien", step: 4, tone: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800", dot: "bg-amber-500" },
  accepted: { label: "Acceptée", step: 5, tone: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800", dot: "bg-emerald-500" },
  rejected: { label: "Refusée", step: 0, tone: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800", dot: "bg-rose-500" },
};

const STEPS = [
  { key: "sent", label: "Envoyée" },
  { key: "viewed", label: "Consultée" },
  { key: "shortlisted", label: "Présélectionnée" },
  { key: "interview", label: "Entretien" },
  { key: "accepted", label: "Décision" },
];

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
  return portfolio?.public_slug || portfolio?.slug || portfolio?.portfolio?.public_slug || portfolio?.portfolio?.slug || "";
}

function Card({ children, className = "" }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900 ${className}`}>{children}</section>;
}

function CardHeader({ icon: Icon, title, subtitle, tone = "emerald" }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
  };
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}><Icon size={16} strokeWidth={2} /></span>
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function InfoItem({ label, children }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{children}</p>
    </div>
  );
}

function DocumentLink({ href, title, subtitle, icon: Icon, tone = "emerald", download = false }) {
  if (!href) return null;
  const styles = {
    emerald: { icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400", hover: "hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30" },
    blue: { icon: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400", hover: "hover:border-blue-300 hover:bg-blue-50/50 dark:hover:border-blue-700 dark:hover:bg-blue-950/30" },
  };
  const style = styles[tone];
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...(download ? { download: true } : {})} className={`group flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition dark:border-slate-700 dark:bg-slate-950 ${style.hover}`}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.icon}`}><Icon size={17} /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</span>
        <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</span>
      </span>
      <Download size={15} className="shrink-0 text-slate-400 transition group-hover:text-emerald-500" />
    </a>
  );
}

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);
  
  const [portfolioData, setPortfolioData] = useState(null);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    api.get(`/applications/${id}`)
      .then(async (res) => {
        if (!active) return;
        const appData = res?.data?.data ?? res?.data;
        setApplication(appData);

        const portfolio = appData.portfolio || appData.portfolio_data;
        const slug = getPortfolioSlug(portfolio);
        
        if (slug) {
          try {
            const portfolioRes = await api.get(`/portfolio/${encodeURIComponent(slug)}`);
            if (active) {
              setPortfolioData(portfolioRes?.data?.data ?? portfolioRes?.data);
            }
          } catch (err) {
            console.error("Erreur de chargement du portfolio :", err);
          }
        }
      })
         .catch((err) => {
        if (!active) return;
        
        // ✅ Si l'application n'est pas trouvée (404), on tente la proposition
        if (err.response?.status === 404) {
           navigate(`/proposals/${id}`, { replace: true });
           return;
        }

        setError(err.response?.status === 403 ? "forbidden" : "not_found");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [id]);

  const documents = useMemo(() => {
    if (!application) return {};
    const portfolio = application.portfolio || application.portfolio_data || null;
    const slug = getPortfolioSlug(portfolio);
    
    const cvPath = 
      application.cv_path || 
      application.cv?.path || 
      application.cv?.url || 
      application.profile?.cv_path || 
      application.candidate?.cv_path || 
      application.user?.cv_path ||
      application.profile_data?.cv_path ||
      "";

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

  const pageClass = isDark ? "bg-[#071521] text-slate-100" : "bg-[#F5F8FA] text-slate-800";

  if (loading) {
    return (
      <AppShell>
        <main className={`flex min-h-[65vh] items-center justify-center ${pageClass}`}>
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="animate-spin text-emerald-500" size={25} /> Chargement de ta candidature...
          </div>
        </main>
      </AppShell>
    );
  }

  if (error || !application) {
    return (
      <AppShell>
        <main className={`flex min-h-[70vh] items-center justify-center px-4 ${pageClass}`}>
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-950/50 dark:text-rose-400"><AlertCircle size={28} /></span>
            <h1 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">{error === "forbidden" ? "Accès refusé" : "Candidature introuvable"}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{error === "forbidden" ? "Tu n'as pas les autorisations nécessaires." : "Cette candidature n'existe pas ou n'est plus accessible."}</p>
            <Link to="/applications" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0B1F33] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#16354E] dark:bg-emerald-400 dark:text-[#071521] dark:hover:bg-emerald-300"><ArrowLeft size={15} /> Retour à mes candidatures</Link>
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

  return (
    <AppShell>
      <main className={`min-h-screen px-4 py-6 transition-colors duration-300 sm:px-6 sm:py-8 lg:px-8 ${pageClass}`}>
        <div className="mx-auto max-w-6xl space-y-5">
          
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-6 dark:border-slate-800 sm:px-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400">Suivi de candidature</p>
                  <h1 className="break-words text-2xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-3xl">{offer.title || "Candidature"}</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                    {company.name && <span className="flex items-center gap-1.5"><Building2 size={14} /> {company.name}</span>}
                    {offer.city && <span className="flex items-center gap-1.5"><MapPin size={14} /> {offer.city}{offer.country ? `, ${offer.country}` : ""}</span>}
                  </div>
                </div>
                <span className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${cfg.tone}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} /> {cfg.label}
                </span>
              </div>
            </div>

            {application.status !== "rejected" ? (
              <div className="px-5 py-6 sm:px-7">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Progression du dossier</p>
                  <span className="text-xs text-slate-400 dark:text-slate-500">Étape {currentStep} / {STEPS.length}</span>
                </div>
                <div className="flex items-start justify-between gap-1">
                  {STEPS.map((step, index) => {
                    const stepNum = index + 1;
                    const isDone = stepNum <= currentStep;
                    const isCurrent = stepNum === currentStep;
                    return (
                      <React.Fragment key={step.key}>
                        <div className="flex min-w-0 flex-1 flex-col items-center text-center">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition ${isDone ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-200 bg-white text-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-600"} ${isCurrent ? "ring-4 ring-emerald-100 dark:ring-emerald-900/50" : ""}`}>
                            {isDone ? <Check size={13} strokeWidth={3} /> : <Circle size={7} fill="currentColor" />}
                          </div>
                          <span className={`mt-2 max-w-full truncate text-[10px] font-medium sm:text-xs ${isDone ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}`}>{step.label}</span>
                        </div>
                        {index < STEPS.length - 1 && (
                          <div className="mt-4 h-0.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className={`h-full rounded-full transition-all duration-500 ${stepNum < currentStep ? "bg-emerald-500" : "bg-transparent"}`} />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-5 sm:px-7">
                <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-500" />
                  <div>
                    <p className="text-sm font-bold text-rose-900 dark:text-rose-200">Candidature refusée</p>
                    <p className="mt-1 text-sm leading-relaxed text-rose-700 dark:text-rose-300">Cette candidature n'a pas été retenue. Tu peux continuer à explorer les opportunités.</p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <Card>
                <CardHeader icon={Calendar} title="Informations générales" subtitle="Récapitulatif de ta candidature" tone="blue" />
                <div className="grid gap-5 p-5 sm:grid-cols-2">
                  <InfoItem label="Date de candidature">{formatDate(application.created_at, { day: "numeric", month: "long", year: "numeric" })}</InfoItem>
                  <InfoItem label="Statut actuel">{cfg.label}</InfoItem>
                  {offer.city && <InfoItem label="Localisation">{offer.city}{offer.country ? `, ${offer.country}` : ""}</InfoItem>}
                  {(offer.offer_type || offer.employment_type) && <InfoItem label="Type d'offre">{offer.offer_type || offer.employment_type}</InfoItem>}
                </div>
              </Card>

              {application.cover_letter && (
                <Card>
                  <CardHeader icon={FileText} title="Lettre de motivation" subtitle="Le message transmis avec ta candidature" tone="slate" />
                  <div className="p-5">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-[#0B1F33] sm:p-5">
                      <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 dark:text-slate-200">{application.cover_letter}</p>
                    </div>
                  </div>
                </Card>
              )}

              {application.recruiter_notes && (
                <Card>
                  <CardHeader icon={ShieldCheck} title="Notes du recruteur" subtitle="Retour communiqué" tone="blue" />
                  <div className="p-5">
                    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/30 sm:p-5">
                      <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 dark:text-slate-200">{application.recruiter_notes}</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            <div className="space-y-5">
              {application.status === "interview" && application.interview_at && (
                <Card>
                  <CardHeader icon={Video} title="Entretien programmé" subtitle="Détails de ton entretien" tone="amber" />
                  <div className="p-5">
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                      <p className="text-sm font-bold capitalize leading-snug text-amber-900 dark:text-amber-200">{formatDate(application.interview_at, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-300"><Clock size={14} /> À {new Date(application.interview_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                      {application.interview_link && (
                        <a href={application.interview_link} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B1F33] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#16354E] dark:bg-emerald-400 dark:text-[#071521] dark:hover:bg-emerald-300">
                          <Video size={15} /> Rejoindre l'entretien <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {hasDocuments && (
                <Card>
                  <CardHeader icon={FileText} title="Documents joints" subtitle="Pièces de ta candidature" tone="slate" />
                  <div className="space-y-3 p-5">
                    {documents.portfolioUrl ? (
                      <button
                        type="button"
                        onClick={() => setShowPortfolioModal(true)}
                        className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{documents.portfolio?.title || "Mon portfolio public"}</span>
                          <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">Ouvrir le vrai portfolio</span>
                        </span>
                        <ChevronRight size={16} className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-500" />
                      </button>
                    ) : documents.portfolio ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                        Le portfolio est associé à cette candidature, mais son slug public n'est pas présent dans les données reçues.
                      </div>
                    ) : null}

                    {documents.cvUrl && <DocumentLink href={documents.cvUrl} title="Curriculum Vitæ" subtitle="Ouvrir ou télécharger le CV joint" icon={FileText} tone="blue" download />}
                  </div>
                </Card>
              )}

              {isWithdrawable && (
                <Card>
                  <div className="p-5">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Retirer ma candidature</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Action irréversible. Cette candidature sera supprimée définitivement.</p>
                    <button type="button" onClick={withdraw} disabled={withdrawing} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900 dark:bg-slate-950 dark:text-rose-300 dark:hover:bg-rose-950/30">
                      {withdrawing ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      {withdrawing ? "Retrait..." : "Retirer ma candidature"}
                    </button>
                  </div>
                </Card>
              )}

              {/* ✅ BLOC FÉLICITATIONS ACCEPTÉ */}
              {application.status === "accepted" && (
                <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30">
                  <div className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
                        <CheckCircle2 size={20} />
                      </div>
                      <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                        Félicitations, vous faites partie de l'équipe !
                      </h3>
                    </div>
                    <p className="mt-3 text-sm text-emerald-800 dark:text-emerald-300">
                      L'entreprise <strong>{company.name}</strong> a accepté votre candidature pour le poste de <strong>{offer.title}</strong>.
                      Un message de bienvenue vous a été envoyé dans la messagerie.
                    </p>
                    
                  
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* ✅ MODALE DU PORTFOLIO */}
        {showPortfolioModal && portfolioData && (
          <PublicPortfolio
            asModal={true}
            onClose={() => setShowPortfolioModal(false)}
            data={portfolioData}
          />
        )}

      </main>
    </AppShell>
  );
}