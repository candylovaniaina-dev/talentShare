import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  X,
  MapPin,
  Briefcase,
  Home,
  Banknote,
  ArrowRight,
  CheckCircle,
  FileText,
  Upload,
  AlertCircle,
  Send,
  Target,
  CalendarDays,
  Building2,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import ApplicationDetailModal from "../components/ApplicationDetailModal";
import SuccessModal from "../components/SuccessModal";

const STATUS_META = {
  sent: { label: "Envoyée", cls: "border-[#BDEBDD] bg-[#E4F8EF] text-[#087F68] dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400", step: 1 },
  viewed: { label: "Consultée", cls: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400", step: 2 },
  shortlisted: { label: "Présélectionnée", cls: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-400", step: 3 },
  interview: { label: "Entretien", cls: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400", step: 4 },
  accepted: { label: "Acceptée", cls: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400", step: 5 },
  rejected: { label: "Refusée", cls: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400", step: 0 },
};

const TIMELINE_STEPS = [
  { key: "sent", label: "Envoyée" },
  { key: "viewed", label: "Consultée" },
  { key: "shortlisted", label: "Présélectionnée" },
  { key: "interview", label: "Entretien" },
  { key: "accepted", label: "Décision" },
];

const OFFER_TYPE_LABEL = {
  internship: "Stage",
  apprenticeship: "Alternance",
  junior_mission: "Mission junior",
  first_job: "Premier emploi",
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

const formatSalary = (min, max, currency = "Ar") => {
  if (!min && !max) return null;
  const format = (value) => new Intl.NumberFormat("fr-FR").format(value);
  if (min && max) return `${format(min)} – ${format(max)} ${currency}`;
  if (min) return `Dès ${format(min)} ${currency}`;
  return `Jusqu'à ${format(max)} ${currency}`;
};

const parseCriteria = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
};

const Card = ({ children, className = "", ...props }) => (
  <section
    className={`relative overflow-hidden bg-white transition-all duration-300 dark:bg-[#112A3A] ${className}`}
    {...props}
  >
    {children}
  </section>
);

const SectionHeading = ({ children, subtitle, icon: Icon }) => (
  <div className="mb-6 flex items-start gap-3">
    {Icon && (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#CDEFE1] bg-gradient-to-br from-[#E5FAF0] to-[#CFF3E3] text-[#087F68] shadow-sm dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-emerald-500/5 dark:text-emerald-400">
        <Icon size={20} strokeWidth={1.8} />
      </div>
    )}
    <div className="min-w-0 pt-0.5">
      <h2 className="text-lg font-extrabold tracking-tight text-[#103F3B] dark:text-white sm:text-xl">
        {children}
      </h2>
      {subtitle && (
        <p className="mt-1.5 text-sm leading-6 text-[#708781] dark:text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  </div>
);

const InfoChip = ({ icon: Icon, children, accent = false }) => (
  <span
    className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-colors ${
      accent
        ? "border-[#BDEBDD] bg-gradient-to-r from-[#E0F8ED] to-[#D3F5E5] text-[#087F68] dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-emerald-500/5 dark:text-emerald-400"
        : "border-[#DCECE4] bg-white/80 text-[#526D66] dark:border-white/10 dark:bg-white/10 dark:text-slate-300"
    }`}
  >
    {Icon && <Icon size={15} strokeWidth={2} className={accent ? "text-[#0A9C79] dark:text-emerald-400" : "text-[#64877B] dark:text-slate-400"} />}
    {children}
  </span>
);

const PrimaryButton = ({ children, className = "", ...props }) => (
  <button
    {...props}
    className={`group inline-flex items-center justify-center gap-2 rounded-xl border border-[#0D5148] bg-gradient-to-r from-[#103F3B] via-[#087F68] to-[#0BA985] px-6 py-3.5 text-sm font-bold text-white shadow-[0_7px_18px_rgba(16,63,59,0.20)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(8,127,104,0.28)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#18B99A]/25 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 dark:border-emerald-500/50 dark:from-emerald-600 dark:via-emerald-500 dark:to-emerald-400 dark:text-white ${className}`}
  >
    {children}
  </button>
);

export default function JobOfferDetail({ offerId: propOfferId, onClose }) {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const offerId = propOfferId || routeId;
  const isModal = Boolean(onClose);

  const [offer, setOffer] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState(null);

  const [coverLetter, setCoverLetter] = useState("");
  const [cvFile, setCvFile] = useState(null);
  const [useExistingCv, setUseExistingCv] = useState(true);
  const [showApplicationDetail, setShowApplicationDetail] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (!isModal) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isModal]);

  useEffect(() => {
    if (!isModal) return;
    const onKey = (event) => { if (event.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isModal, onClose]);

  useEffect(() => {
    if (!offerId) { setLoading(false); return; }
    let active = true;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [offerRes, portfolioRes, appsRes] = await Promise.allSettled([
          api.get(`/job-offers/${offerId}`),
          api.get("/portfolio/my"),
          api.get("/applications"),
        ]);

        if (!active) return;

        if (offerRes.status === "fulfilled") {
          setOffer(offerRes.value.data?.data || offerRes.value.data);
        } else {
          setOffer(null);
          setError("Offre introuvable.");
        }

        if (portfolioRes.status === "fulfilled") {
          const data = portfolioRes.value.data?.data || portfolioRes.value.data;
          setPortfolio(data);
        }

        if (appsRes.status === "fulfilled") {
          const list = appsRes.value.data?.data || appsRes.value.data || [];
          const found = list.find((item) => String(item.job_offer_id) === String(offerId));
          setApplication(found || null);
        }
      } catch (err) {
        console.error(err);
        if (active) setError("Une erreur est survenue lors du chargement.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchAll();
    return () => { active = false; };
  }, [offerId]);

  const submitApplication = async (event) => {
    event.preventDefault();
    setApplying(true);
    setError(null);

    try {
      let cvPath = null;
      if (!useExistingCv && cvFile) {
        const formData = new FormData();
        formData.append("cv", cvFile);
        const cvRes = await api.post("/profile/cv", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        cvPath = cvRes.data?.cv_path || cvRes.data?.data?.cv_path;
      }

      const payload = {
        job_offer_id: Number(offerId),
        cover_letter: coverLetter.trim() || null,
        portfolio_id: portfolio?.id || null,
      };
      if (cvPath) payload.cv_path = cvPath;

      await api.post("/applications", payload);

      const appsRes = await api.get("/applications");
      const list = appsRes.data?.data || appsRes.data || [];
      const found = list.find((item) => String(item.job_offer_id) === String(offerId));

      setApplication(found || { status: "sent" });
      setShowSuccessModal(true);
    } catch (err) {
      const message = err.response?.data?.message || (err.response?.data?.errors ? Object.values(err.response.data.errors).flat()[0] : "Impossible d'envoyer la candidature.");
      setError(message);
    } finally {
      setApplying(false);
    }
  };

  const companyName = offer?.company?.name || "Entreprise";
  const salary = offer ? formatSalary(offer.salary_min, offer.salary_max, offer.currency) : null;
  const techs = offer ? parseCriteria(offer.criteria) : [];
  const statusMeta = application?.status ? STATUS_META[application.status] : null;
  const currentStep = statusMeta?.step ?? 1;

  const handleClose = () => {
    if (isModal) onClose?.();
    else navigate("/job-offers");
  };

  const inputClass = "w-full rounded-xl border border-[#CFE4D9] bg-white/80 px-4 py-3.5 text-sm text-[#173F3A] outline-none transition placeholder:text-[#91A69D] focus:border-[#18B99A] focus:bg-white focus:ring-4 focus:ring-[#18B99A]/15 dark:border-white/10 dark:bg-[#0B1F33] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:bg-[#112A3A]";

  const Content = (
    <>
      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center bg-gradient-to-br from-[#E9F8F0] via-white to-[#DDF5E9] dark:from-[#112A3A] dark:via-[#0B1F33] dark:to-[#112A3A]">
          <div className="text-center">
            <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#C5ECDD] bg-white shadow-lg shadow-[#0C8A6D]/10 dark:border-white/10 dark:bg-white/5 dark:shadow-none">
              <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#D8E9E1] border-t-[#079B78] dark:border-white/10 dark:border-t-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-[#315E53] dark:text-slate-300">Chargement de l’offre…</p>
            <p className="mt-1 text-xs text-[#8AA39A] dark:text-slate-500">Préparation des informations</p>
          </div>
        </div>
      ) : !offer ? (
        <div className="bg-gradient-to-br from-[#EAF7F0] via-white to-[#DDF3E8] px-6 py-20 text-center dark:from-[#112A3A] dark:via-[#0B1F33] dark:to-[#112A3A]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#C7ECDD] bg-white text-[#087F68] shadow-lg shadow-[#087F68]/10 dark:border-white/10 dark:bg-white/5 dark:text-emerald-400 dark:shadow-none">
            <Briefcase size={27} />
          </div>
          <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.2em] text-[#0A9B79] dark:text-emerald-400">TalentShare</p>
          <h1 className="mt-3 text-2xl font-extrabold text-[#103F3B] dark:text-white">Offre introuvable</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#718783] dark:text-slate-400">Cette offre est peut-être indisponible ou a été retirée.</p>
          {error && <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
          <PrimaryButton onClick={handleClose} className="mt-6">
            <ArrowRight size={16} className="rotate-180" />
            Retour aux offres
          </PrimaryButton>
        </div>
      ) : (
        <div className="relative min-h-full bg-white dark:bg-[#112A3A]">
          
          {/* En-tête de l'offre */}
          <Card>
            <div className="relative overflow-hidden bg-gradient-to-br from-[#103F3B] via-[#0C6252] to-[#087F68] px-5 py-6 text-white sm:px-7 sm:py-8 dark:from-[#0B1F33] dark:via-[#0F9691]/40 dark:to-[#16B8B1]/30">
              <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full border-[28px] border-white/[0.06]" />
              <div className="pointer-events-none absolute -bottom-20 right-28 h-40 w-40 rounded-full bg-[#53D6AB]/10 blur-2xl" />

              {isModal && (
                <button
                  type="button"
                  aria-label="Fermer le détail de l’offre"
                  onClick={onClose}
                  className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:rotate-90 hover:bg-white/20"
                >
                  <X size={18} />
                </button>
              )}

              {/* Grille pour l'en-tête (Logo + Titre) */}
              <div className="relative grid grid-cols-[auto_1fr] items-start gap-4 sm:gap-6">
                <div className="flex h-[64px] w-[64px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/25 bg-white/95 text-[#087F68] shadow-[0_8px_25px_rgba(0,0,0,0.15)] dark:border-white/10 dark:bg-white/10 dark:text-emerald-400 sm:h-[76px] sm:w-[76px]">
                  {offer.company?.logo_url ? (
                    <img src={offer.company.logo_url} alt="" className="h-full w-full object-contain p-2" />
                  ) : (
                    <span className="text-xl font-black sm:text-2xl">{companyName.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-[#D7F8E9]">
                      <Building2 size={13} />
                      {companyName}
                    </span>
                    {statusMeta && (
                      <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold sm:text-xs ${statusMeta.cls}`}>
                        <CheckCircle size={12} />
                        {statusMeta.label}
                      </span>
                    )}
                  </div>

                  {/* Titre avec taille fixe et responsives */}
                  <h1 className="break-words text-xl font-black leading-tight tracking-tight text-white sm:text-2xl lg:text-3xl">
                    {offer.title}
                  </h1>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(offer.city || offer.country) && (
                      <InfoChip icon={MapPin}>{[offer.city, offer.country].filter(Boolean).join(", ")}</InfoChip>
                    )}
                    <InfoChip icon={Briefcase}>
                      {OFFER_TYPE_LABEL[offer.offer_type] || offer.offer_type || offer.contract_type || "Opportunité"}
                    </InfoChip>
                    {offer.remote && <InfoChip icon={Home}>Télétravail</InfoChip>}
                    {salary && <InfoChip icon={Banknote} accent>{salary}</InfoChip>}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 bg-white px-5 py-4 dark:bg-[#112A3A] sm:flex-row sm:items-center sm:justify-between sm:px-7 border-b border-[#EAF0EC] dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E6F8EF] text-[#087F68] dark:bg-emerald-500/10 dark:text-emerald-400">
                  <ShieldCheck size={18} />
                </div>
                <p className="text-xs leading-5 text-[#718780] dark:text-slate-400">Une opportunité pour faire évoluer votre parcours professionnel.</p>
              </div>

              {offer.application_deadline && (
                <div className="flex items-center gap-2 rounded-xl border border-[#DCEFE5] bg-[#F0FAF5] px-3 py-2.5 text-xs text-[#526F65] dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  <CalendarDays size={15} className="text-[#0A9B79] dark:text-emerald-400" />
                  <span>Date limite : <strong className="font-bold text-[#176B59] dark:text-white">{formatDate(offer.application_deadline)}</strong></span>
                </div>
              )}
            </div>
          </Card>

          {/* Description et compétences */}
          <Card className="border-t border-[#EAF0EC] p-5 dark:border-white/10 sm:p-7">
            <SectionHeading icon={FileText} subtitle="Découvrez le poste et les attentes de l’entreprise.">
              À propos de cette opportunité
            </SectionHeading>

            <div className="rounded-2xl border border-[#E1F0E8] bg-gradient-to-br from-[#F8FCF9] to-[#EFF8F3] p-4 dark:border-white/5 dark:from-[#0B1F33] dark:to-[#0B1F33] sm:p-5">
              <div className="whitespace-pre-line text-sm leading-7 text-[#526D66] dark:text-slate-300">
                {offer.description || "Aucune description renseignée."}
              </div>
            </div>

            {techs.length > 0 && (
              <div className="mt-7">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#DDF8EB] to-[#BFEED8] text-[#087F68] dark:from-emerald-500/20 dark:to-emerald-500/10 dark:text-emerald-400">
                    <Target size={19} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#173F3A] dark:text-white">Compétences recherchées</h3>
                    <p className="mt-0.5 text-xs text-[#81968D] dark:text-slate-400">Les atouts utiles pour cette opportunité</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {techs.map((skill, index) => {
                    const skillName = typeof skill === "string" ? skill : skill.name || skill.label || JSON.stringify(skill);
                    return (
                      <span key={`${skillName}-${index}`} className="inline-flex items-center gap-2 rounded-xl border border-[#BFE8D5] bg-gradient-to-br from-[#E7F9EF] to-[#D7F5E6] px-3.5 py-2.5 text-xs font-bold text-[#176B59] shadow-[0_3px_8px_rgba(16,63,59,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#18B99A] hover:shadow-md dark:border-emerald-500/20 dark:from-emerald-500/10 dark:to-emerald-500/5 dark:text-emerald-300 dark:hover:border-emerald-500/50">
                        <CheckCircle size={13} className="text-[#0AA47F] dark:text-emerald-400" />
                        {skillName}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          {/* Formulaire de candidature ou Suivi */}
          {!application ? (
            <Card className="border-t border-[#EAF0EC] p-5 dark:border-white/10 sm:p-7">
              {/* ... (Le formulaire reste inchangé) ... */}
              <div className="mb-6 rounded-2xl bg-gradient-to-r from-[#E7F8EF] via-[#F0FAF5] to-[#D9F4E7] p-4 dark:from-emerald-500/10 dark:via-[#112A3A] dark:to-[#112A3A] sm:p-5">
                <SectionHeading icon={Send} subtitle="Préparez votre dossier et envoyez votre candidature.">
                  Postuler à cette offre
                </SectionHeading>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-lg border border-[#C5EBDD] bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-[#347663] dark:border-emerald-500/20 dark:bg-white/5 dark:text-emerald-300">1. Votre portfolio</span>
                  <ChevronRight size={16} className="self-center text-[#80B9A3] dark:text-emerald-500/50" />
                  <span className="rounded-lg border border-[#C5EBDD] bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-[#347663] dark:border-emerald-500/20 dark:bg-white/5 dark:text-emerald-300">2. Votre CV</span>
                  <ChevronRight size={16} className="self-center text-[#80B9A3] dark:text-emerald-500/50" />
                  <span className="rounded-lg border border-[#C5EBDD] bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-[#347663] dark:border-emerald-500/20 dark:bg-white/5 dark:text-emerald-300">3. Votre message</span>
                </div>
              </div>

              {error && (
                <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={submitApplication} className="space-y-7">
                {/* Portfolio */}
                <div>
                  <label className="mb-3 flex items-center gap-2 text-sm font-bold text-[#31564D] dark:text-slate-200">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E6F8EF] text-[#087F68] dark:bg-emerald-500/10 dark:text-emerald-400"><FileText size={15} /></span>
                    Portfolio
                  </label>
                  {portfolio ? (
                    <div className="flex flex-col gap-3 rounded-2xl border border-[#BFE8D5] bg-gradient-to-r from-[#F0FBF5] to-[#E4F7EC] p-4 dark:border-emerald-500/20 dark:from-emerald-500/5 dark:to-[#0B1F33] sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#C7ECDD] bg-white text-[#087F68] shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-emerald-400"><FileText size={21} /></div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#244E43] dark:text-white">{portfolio.title || "Mon portfolio"}</p>
                          <p className="mt-1 text-xs text-[#718D81] dark:text-slate-400">Sera partagé avec l’entreprise</p>
                        </div>
                      </div>
                      <Link to="/profile" onClick={(event) => { if (isModal) event.preventDefault(); }} className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#BCE5D2] bg-white px-4 py-2.5 text-xs font-bold text-[#087F68] transition hover:border-[#18B99A] hover:bg-[#DDF7EC] dark:border-emerald-500/30 dark:bg-white/5 dark:text-emerald-400 dark:hover:bg-emerald-500/10">
                        Modifier <ArrowRight size={14} />
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-[#FFFCF3] to-[#FFF8E7] p-4 dark:border-amber-500/30 dark:from-amber-500/10 dark:to-[#0B1F33] sm:flex-row sm:items-center">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm dark:bg-white/10 dark:text-amber-400"><AlertCircle size={19} /></div>
                      <p className="text-sm leading-6 text-[#806B3C] dark:text-slate-300">
                        Aucun portfolio associé à votre profil.{" "}
                        <Link to="/profile" onClick={(event) => { if (isModal) event.preventDefault(); }} className="font-bold underline decoration-amber-400 underline-offset-4">
                          Compléter mon profil
                        </Link>
                      </p>
                    </div>
                  )}
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-[#D8EAE0] to-transparent dark:via-white/10" />

                {/* CV */}
                <div>
                  <label className="mb-3 flex items-center gap-2 text-sm font-bold text-[#31564D] dark:text-slate-200">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E6F8EF] text-[#087F68] dark:bg-emerald-500/10 dark:text-emerald-400"><Upload size={15} /></span>
                    Curriculum vitæ (CV)
                  </label>
                  {user?.cv_path && useExistingCv ? (
                    <div className="flex flex-col gap-3 rounded-2xl border border-[#BFE8D5] bg-gradient-to-r from-[#F0FBF5] to-[#E4F7EC] p-4 dark:border-emerald-500/20 dark:from-emerald-500/5 dark:to-[#0B1F33] sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#C7ECDD] bg-white text-[#087F68] shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-emerald-400"><FileText size={21} /></div>
                        <div>
                          <p className="text-sm font-bold text-[#244E43] dark:text-white">CV enregistré</p>
                          <p className="mt-1 text-xs text-[#718D81] dark:text-slate-400">Utiliser le CV de votre profil</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => setUseExistingCv(false)} className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#BCE5D2] bg-white px-4 py-2.5 text-xs font-bold text-[#087F68] transition hover:border-[#18B99A] hover:bg-[#DDF7EC] dark:border-emerald-500/30 dark:bg-white/5 dark:text-emerald-400 dark:hover:bg-emerald-500/10">
                        <Upload size={14} />
                        Choisir un autre CV
                      </button>
                    </div>
                  ) : (
                    <div>
                      {!user?.cv_path && (
                        <div className="mb-3 flex items-start gap-2 rounded-xl border border-[#DCECE4] bg-[#F6FBF8] p-3 text-xs leading-5 text-[#70877D] dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                          <AlertCircle size={15} className="mt-0.5 shrink-0 text-[#0A9B79] dark:text-emerald-400" />
                          Aucun CV enregistré : ajoutez un document pour continuer.
                        </div>
                      )}
                      <label className="group flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-[#B6DFCE] bg-gradient-to-br from-[#F8FCF9] to-[#EAF8F0] p-5 transition-all duration-200 hover:border-[#18B99A] hover:from-[#ECFAF2] hover:to-[#DDF7E9] dark:border-white/10 dark:from-[#0B1F33] dark:to-[#0B1F33] dark:hover:border-emerald-500/50 dark:hover:from-white/5 dark:hover:to-white/5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#C7ECDD] bg-white text-[#087F68] shadow-sm transition-transform group-hover:scale-105 dark:border-white/10 dark:bg-white/10 dark:text-emerald-400"><Upload size={20} /></div>
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-bold text-[#244E43] dark:text-white">{cvFile ? cvFile.name : "Importer votre CV"}</p>
                          <p className="mt-1 text-xs leading-5 text-[#82988E] dark:text-slate-500">PDF, DOC ou DOCX · 5 Mo maximum</p>
                        </div>
                        <span className="rounded-lg bg-[#DDF7E9] px-3 py-2 text-xs font-bold text-[#087F68] dark:bg-white/10 dark:text-emerald-400">Parcourir</span>
                        <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(event) => {
                          const file = event.target.files?.[0] || null;
                          if (file && file.size > 5 * 1024 * 1024) {
                            setError("Le CV ne doit pas dépasser 5 Mo.");
                            event.target.value = "";
                            return;
                          }
                          setError(null);
                          setCvFile(file);
                        }} />
                      </label>
                    </div>
                  )}
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-[#D8EAE0] to-transparent dark:via-white/10" />

                {/* Lettre de motivation */}
                <div>
                  <label htmlFor="cover-letter" className="mb-3 flex items-center gap-2 text-sm font-bold text-[#31564D] dark:text-slate-200">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E6F8EF] text-[#087F68] dark:bg-emerald-500/10 dark:text-emerald-400"><FileText size={15} /></span>
                    Lettre de motivation
                    <span className="ml-1 rounded-md bg-[#F0F5F2] px-2 py-1 text-[10px] font-semibold text-[#879A90] dark:bg-white/10 dark:text-slate-400">FACULTATIF</span>
                  </label>
                  <textarea id="cover-letter" rows={5} value={coverLetter} onChange={(event) => setCoverLetter(event.target.value)} placeholder="Présentez votre motivation et ce que vous pourriez apporter à l’équipe..." className={`${inputClass} resize-y leading-7`} />
                  <p className="mt-2 text-right text-xs text-[#91A69D] dark:text-slate-500">{coverLetter.length} caractères</p>
                </div>

                <div className="flex flex-col-reverse gap-3 rounded-2xl border border-[#DCEFE5] bg-gradient-to-r from-[#F6FBF8] to-[#EDF8F2] p-4 dark:border-white/10 dark:from-[#112A3A] dark:to-[#112A3A] sm:flex-row sm:justify-end">
                  <button type="button" onClick={handleClose} className="rounded-xl border border-[#CFE2D9] bg-white px-5 py-3.5 text-sm font-bold text-[#42645D] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#9FD6C1] hover:bg-[#EAF7F0] hover:text-[#087F68] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#18B99A]/20 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10">
                    Annuler
                  </button>
                  <PrimaryButton type="submit" disabled={applying || (!useExistingCv && !cvFile)}>
                    {applying ? (
                      <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Envoi en cours…</>
                    ) : (
                      <>Envoyer ma candidature<Send size={16} className="transition-transform group-hover:translate-x-1" /></>
                    )}
                  </PrimaryButton>
                </div>
              </form>
            </Card>
          ) : (
            /* Suivi de candidature */
            <Card className="border-t border-[#EAF0EC] overflow-hidden dark:border-white/10">
              <div className="relative overflow-hidden bg-gradient-to-r from-[#103F3B] via-[#0C6252] to-[#087F68] p-5 text-white dark:from-[#0B1F33] dark:via-[#0F9691]/40 dark:to-[#16B8B1]/30 sm:p-6">
                <div className="pointer-events-none absolute -right-8 -top-16 h-40 w-40 rounded-full border-[22px] border-white/[0.06]" />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10"><CheckCircle size={23} /></div>
                    <div>
                      <h2 className="text-lg font-extrabold">Votre candidature</h2>
                      <p className="mt-1 text-sm text-[#D0EEE1]">Envoyée à {companyName}</p>
                    </div>
                  </div>
                  {statusMeta && (
                    <span className={`inline-flex self-start rounded-xl border px-3 py-2 text-xs font-bold sm:self-auto ${statusMeta.cls}`}>{statusMeta.label}</span>
                  )}
                </div>
              </div>

              <div className="p-5 sm:p-7">
                <p className="mb-7 text-xs font-extrabold uppercase tracking-[0.15em] text-[#789087] dark:text-slate-500">Étapes de votre candidature</p>

                {application.status === "rejected" ? (
                  <div className="rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-white p-5 dark:border-rose-500/30 dark:from-rose-500/10 dark:to-[#112A3A]">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"><AlertCircle size={20} /></div>
                      <div>
                        <p className="text-sm font-bold text-rose-800 dark:text-rose-300">Cette candidature n’a pas été retenue.</p>
                        <p className="mt-1 text-sm leading-6 text-rose-700 dark:text-rose-400/80">Vous pouvez continuer à explorer les autres opportunités disponibles.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start">
                    {TIMELINE_STEPS.map((step, index) => {
                      const stepNumber = index + 1;
                      const done = stepNumber <= currentStep;
                      const last = index === TIMELINE_STEPS.length - 1;
                      return (
                        <React.Fragment key={step.key}>
                          <div className="flex min-w-0 flex-1 flex-col items-center">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-bold transition-all sm:h-10 sm:w-10 ${done ? "border-[#087F68] bg-gradient-to-br from-[#0DA582] to-[#087F68] text-white shadow-md shadow-[#087F68]/20 dark:border-emerald-500 dark:from-emerald-600 dark:to-emerald-500" : "border-[#DCEAE2] bg-[#F7FBF8] text-[#9AAEA4] dark:border-white/10 dark:bg-white/5 dark:text-slate-500"}`}>
                              {done ? <CheckCircle size={17} /> : stepNumber}
                            </div>
                            <span className={`mt-3 max-w-[76px] text-center text-[10px] font-semibold leading-4 sm:max-w-none sm:text-xs ${done ? "text-[#287B67] dark:text-emerald-400" : "text-[#9AA9A3] dark:text-slate-500"}`}>{step.label}</span>
                          </div>
                          {!last && (
                            <div className={`mt-[18px] h-0.5 min-w-2 flex-1 rounded-full sm:mt-5 ${stepNumber < currentStep ? "bg-gradient-to-r from-[#0DA582] to-[#9CE3C4] dark:from-emerald-600 dark:to-emerald-500/50" : "bg-[#DCE8E2] dark:bg-white/10"}`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}

                {application.status === "interview" && application.interview_at && (
                  <div className="mt-7 rounded-2xl border border-[#E9DAB8] bg-gradient-to-r from-[#FFFCF3] to-[#FFF8E8] p-4 dark:border-amber-500/30 dark:from-amber-500/10 dark:to-[#112A3A]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm dark:bg-white/10 dark:text-amber-400"><CalendarDays size={19} /></div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-[#9A7430] dark:text-amber-400">Entretien programmé</p>
                        <p className="mt-1 text-sm font-bold text-[#3B4F4C] dark:text-slate-200">
                          {formatDate(application.interview_at)} à{" "}
                          {new Date(application.interview_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-[#E2EFE7] bg-[#F7FBF8] p-5 dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <p className="text-sm text-[#718780] dark:text-slate-400">Consultez les détails et les mises à jour.</p>
                <button type="button" onClick={() => setShowApplicationDetail(true)} className="group inline-flex items-center justify-center gap-2 rounded-xl border border-[#BFE8D5] bg-gradient-to-r from-[#E7F8EF] to-[#D8F5E6] px-4 py-3 text-sm font-bold text-[#087F68] transition-all hover:-translate-y-0.5 hover:border-[#18B99A] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#18B99A]/20 dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-emerald-500/5 dark:text-emerald-400 dark:hover:border-emerald-500/50">
                  Voir les détails
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </Card>
          )}
        </div>
      )}
    </>
  );

  if (isModal) {
    const hasSidePanel = showApplicationDetail && application?.id;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true">
        <button type="button" aria-label="Fermer" onClick={onClose} className="absolute inset-0 bg-[#102F38]/65 backdrop-blur-md dark:bg-black/80" />
        
        {/* Taille globale du modal ajustée (max-w-3xl si pas de panneau, max-w-6xl si panneau) */}
        <div className={`relative z-10 flex w-full items-stretch justify-center gap-4 ${hasSidePanel ? "max-w-[1200px]" : "max-w-3xl"}`}>
          
          {/* Panneau principal */}
          <div className={`flex max-h-[92vh] flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_30px_100px_rgba(16,47,56,0.28)] dark:border-white/10 dark:bg-[#112A3A] dark:shadow-[0_30px_100px_rgba(0,0,0,0.6)] ${hasSidePanel ? "hidden w-full max-w-xl lg:flex lg:w-1/2" : "w-full"}`}>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {Content}
            </div>
          </div>

          {/* Panneau latéral (Détails candidature) */}
          {hasSidePanel && (
            <div className="hidden max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_30px_100px_rgba(16,47,56,0.22)] dark:border-white/10 dark:bg-[#112A3A] dark:shadow-[0_30px_100px_rgba(0,0,0,0.6)] lg:flex lg:w-1/2">
              <ApplicationDetailModal applicationId={application.id} onClose={() => setShowApplicationDetail(false)} embedded />
            </div>
          )}
        </div>

        {hasSidePanel && (
          <div className="lg:hidden">
            <ApplicationDetailModal applicationId={application.id} onClose={() => setShowApplicationDetail(false)} />
          </div>
        )}

        <SuccessModal open={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="Candidature envoyée !" message={`Ta candidature a bien été transmise à ${companyName}. Tu recevras une notification dès qu'elle sera consultée.`} primaryLabel="Voir mes candidatures" primaryLink="/my-activity" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white dark:bg-[#0B1F33]">
      <div className="relative mx-auto max-w-3xl">
        <button type="button" onClick={() => navigate("/job-offers")} className="group absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(16,63,59,0.06)] backdrop-blur transition-all hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20">
          <ArrowRight size={16} className="rotate-180 transition-transform group-hover:-translate-x-0.5" />
          Retour aux offres
        </button>

        {Content}
      </div>

      <SuccessModal open={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="Candidature envoyée !" message={`Ta candidature a bien été transmise à ${companyName}.`} primaryLink="/my-activity" />
    </div>
  );
}