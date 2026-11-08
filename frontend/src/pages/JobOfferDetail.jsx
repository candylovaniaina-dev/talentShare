import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { X } from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import ApplicationDetailModal from "../components/ApplicationDetailModal";
import SuccessModal from "../components/SuccessModal";

const STATUS_META = {
  sent: { label: "Envoyée", cls: "bg-[#16B8B1]/15 text-[#0F9691] dark:text-[#16B8B1]", step: 1 },
  viewed: { label: "Consultée", cls: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300", step: 2 },
  shortlisted: { label: "Présélectionnée", cls: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300", step: 3 },
  interview: { label: "Entretien", cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300", step: 4 },
  accepted: { label: "Acceptée", cls: "bg-[#16B8B1]/10 text-[#0F9691] dark:bg-[#16B8B1]/20 dark:text-[#16B8B1]", step: 5 },
  rejected: { label: "Refusée", cls: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300", step: 0 },
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
  fixed_term: "CDD",
  permanent: "Recrutement permanent",
  first_job: "Recrutement permanent",
  junior_mission: "Mission junior",
  freelance: "Freelance",
  student_project: "Projet étudiant",
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : null;

const formatSalary = (min, max, rawCurrency = "Ar") => {
  if (!min && !max) return null;
  const currency = !rawCurrency || rawCurrency === "MGA" ? "Ar" : rawCurrency;
  const format = (value) => new Intl.NumberFormat("fr-FR").format(value);
  if (min && max) return `${format(min)} – ${format(max)} ${currency} / mois`;
  if (min) return `Dès ${format(min)} ${currency} / mois`;
  return `Jusqu'à ${format(max)} ${currency} / mois`;
};

const formatDuration = (offer) => {
  if (offer?.duration_text) {
    const text = String(offer.duration_text).trim();
    if (/^\d+$/.test(text)) {
      return `${text} mois`;
    }
    return text;
  }
  if (offer?.duration_value && offer?.duration_unit) {
    const value = Number(offer.duration_value);
    const unit = offer.duration_unit.toLowerCase();
    if (["day", "days", "jour", "jours"].includes(unit)) return `${value} jour${value > 1 ? "s" : ""}`;
    if (["month", "months", "mois"].includes(unit)) return `${value} mois`;
    if (["year", "years", "an", "ans"].includes(unit)) return `${value} an${value > 1 ? "s" : ""}`;
  }
  return null;
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

const logoSrc = (company) => {
  const path = company?.logo_url || company?.logo_path;
  if (!path) return null;
  return /^https?:/.test(path) ? path : `http://localhost:8001/storage/${path}`;
};

/* ----------------------------- Petites briques ----------------------------- */

const Section = ({ title, hint, children, className = "" }) => (
  <section className={`border-t border-[#E4EBF1] px-5 py-6 dark:border-white/10 sm:px-8 ${className}`}>
    <h2 className="text-[15px] font-bold tracking-tight text-[#0B1F33] dark:text-white">{title}</h2>
    {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    <div className="mt-4">{children}</div>
  </section>
);

const HeaderPill = ({ children, accent = false }) => (
  <span
    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
      accent ? "bg-[#16B8B1] text-[#0B1F33]" : "bg-white/10 text-white/90 ring-1 ring-white/10"
    }`}
  >
    {children}
  </span>
);

const PrimaryButton = ({ children, className = "", ...props }) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#16B8B1] px-6 py-3 text-sm font-bold text-[#0B1F33] shadow-[0_8px_20px_rgba(22,184,177,0.25)] transition hover:bg-[#0F9691] hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#16B8B1]/30 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
  >
    {children}
  </button>
);

const SecondaryButton = ({ children, className = "", ...props }) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-[#0B1F33] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#16B8B1]/20 dark:border-white/10 dark:bg-transparent dark:text-slate-300 dark:hover:bg-white/5 ${className}`}
  >
    {children}
  </button>
);

const FileRow = ({ title, text, action }) => (
  <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-[#F3F6FC]/60 p-4 dark:border-white/10 dark:bg-[#0A1230] sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <p className="truncate text-sm font-bold text-[#0B1F33] dark:text-white">{title}</p>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{text}</p>
    </div>
    {action}
  </div>
);

const Label = ({ children, optional, htmlFor }) => (
  <label htmlFor={htmlFor} className="mb-2 flex items-center gap-2 text-sm font-bold text-[#0B1F33] dark:text-slate-200">
    {children}
    {optional && (
      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-white/10 dark:text-slate-400">
        Facultatif
      </span>
    )}
  </label>
);

/* --------------------------------- Page ---------------------------------- */

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
          setPortfolio(portfolioRes.value.data?.data || portfolioRes.value.data);
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

      // ✅ 1. Si le candidat upload un NOUVEAU CV
      if (!useExistingCv && cvFile) {
        const formData = new FormData();
        formData.append("cv", cvFile);
        
        const cvRes = await api.post("/profile/cv", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        
        // ✅ On cherche le chemin du CV dans tous les formats possibles renvoyés par Laravel
        cvPath = cvRes.data?.cv_path 
              || cvRes.data?.data?.cv_path 
              || cvRes.data?.path 
              || cvRes.data?.data?.path 
              || cvRes.data?.file_path 
              || null;
        
        if (!cvPath) {
          throw new Error("Le CV a été uploadé mais l'API n'a pas renvoyé le chemin du fichier. Vérifiez la route /profile/cv.");
        }
      } 
      // ✅ 2. Si le candidat utilise le CV de son profil
      else if (useExistingCv && user?.cv_path) {
        cvPath = user.cv_path;
      }

      const payload = {
        job_offer_id: Number(offerId),
        cover_letter: coverLetter.trim() || null,
        portfolio_id: portfolio?.id || null,
      };
      
      // ✅ On ajoute le CV au payload s'il existe
      if (cvPath) {
        payload.cv_path = cvPath;
      }

      await api.post("/applications", payload);

      const appsRes = await api.get("/applications");
      const list = appsRes.data?.data || appsRes.data || [];
      const found = list.find((item) => String(item.job_offer_id) === String(offerId));

      setApplication(found || { status: "sent" });
      setShowSuccessModal(true);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.response?.data?.errors ? Object.values(err.response.data.errors).flat()[0] : (err.message || "Impossible d'envoyer la candidature."));
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
  const logo = offer ? logoSrc(offer.company) : null;

  const handleClose = () => {
    if (isModal) onClose?.();
    else navigate("/job-offers");
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#16B8B1] focus:ring-4 focus:ring-[#16B8B1]/15 dark:border-white/10 dark:bg-[#0A1230] dark:text-white";

  const Content = (
    <>
      {loading ? (
        <div className="flex min-h-[360px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#16B8B1] dark:border-white/10 dark:border-t-[#16B8B1]" />
            <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Chargement de l'offre…</p>
          </div>
        </div>
      ) : !offer ? (
        <div className="px-6 py-20 text-center">
          <h1 className="text-xl font-bold text-[#0B1F33] dark:text-white">Offre introuvable</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
            Cette offre est peut-être indisponible ou a été retirée.
          </p>
          {error && <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
          <PrimaryButton onClick={handleClose} className="mt-6">Retour aux offres</PrimaryButton>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#131E47]">
          {/* ===== En-tête ===== */}
          <header className="relative overflow-hidden bg-[#0B1F33] px-5 py-7 text-white sm:px-8">
            <div className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-[#16B8B1]/20 blur-3xl" />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
            />

            {isModal && (
              <button
                type="button"
                aria-label="Fermer"
                onClick={onClose}
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
              >
                <X size={17} />
              </button>
            )}

            <div className="relative flex items-start gap-4 sm:gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg sm:h-16 sm:w-16">
                {logo ? (
                  <img src={logo} alt="" className="h-full w-full object-contain p-1.5" />
                ) : (
                  <span className="text-lg font-extrabold text-[#0B1F33]">{companyName.slice(0, 2).toUpperCase()}</span>
                )}
              </div>

              <div className="min-w-0 flex-1 pr-10">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#16B8B1]">{companyName}</p>
                  {statusMeta && (
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusMeta.cls}`}>{statusMeta.label}</span>
                  )}
                </div>

                <h1 className="mt-1.5 break-words text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">
                  {offer.title}
                </h1>

                <div className="mt-4 flex flex-wrap gap-2">
                  <HeaderPill>{OFFER_TYPE_LABEL[offer.offer_type] || offer.offer_type || "Opportunité"}</HeaderPill>
                  {(offer.city || offer.country) && (
                    <HeaderPill>{[offer.city, offer.country].filter(Boolean).join(", ")}</HeaderPill>
                  )}
                  {formatDuration(offer) && <HeaderPill>{formatDuration(offer)}</HeaderPill>}
                  {offer.remote && <HeaderPill>Télétravail</HeaderPill>}
                  {salary && <HeaderPill accent>{salary}</HeaderPill>}
                </div>
              </div>
            </div>
          </header>

          {/* ===== Bandeau date limite ===== */}
          {offer.application_deadline && (
            <div className="flex items-center justify-between gap-3 bg-[#F3F6FC] px-5 py-3 text-xs dark:bg-[#0A1230] sm:px-8">
              <span className="text-slate-500 dark:text-slate-400">Candidatures ouvertes jusqu'au</span>
              <strong className="font-bold text-[#0B1F33] dark:text-white">{formatDate(offer.application_deadline)}</strong>
            </div>
          )}

          {/* ===== Description ===== */}
          <Section title="Description du poste" className={offer.application_deadline ? "border-t-0" : ""}>
            <div className="whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300">
              {offer.description || "Aucune description renseignée."}
            </div>

            {techs.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Compétences recherchées</h3>
                <div className="flex flex-wrap gap-2">
                  {techs.map((skill, index) => {
                    const skillName = typeof skill === "string" ? skill : skill.name || skill.label || JSON.stringify(skill);
                    return (
                      <span
                        key={`${skillName}-${index}`}
                        className="rounded-lg bg-[#0B1F33]/5 px-3 py-1.5 text-xs font-semibold text-[#0B1F33] dark:bg-white/10 dark:text-slate-200"
                      >
                        {skillName}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </Section>

          {/* ===== Candidature ===== */}
          {!application ? (
            <Section title="Postuler à cette offre" hint="Votre portfolio, votre CV et un message : trois étapes.">
              {error && (
                <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                  {error}
                </div>
              )}

              <form onSubmit={submitApplication} className="space-y-6">
                {/* Portfolio */}
                <div>
                  <Label>Portfolio</Label>
                  {portfolio ? (
                    <FileRow
                      title={portfolio.title || "Mon portfolio"}
                      text="Sera partagé avec l'entreprise"
                      action={
                        <Link
                          to="/profile"
                          onClick={(event) => { if (isModal) event.preventDefault(); }}
                          className="self-start rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-[#0B1F33] transition hover:border-[#16B8B1] dark:border-white/10 dark:bg-transparent dark:text-white"
                        >
                          Modifier
                        </Link>
                      }
                    />
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                      Aucun portfolio associé à votre profil.{" "}
                      <Link
                        to="/profile"
                        onClick={(event) => { if (isModal) event.preventDefault(); }}
                        className="font-bold underline underline-offset-4"
                      >
                        Compléter mon profil
                      </Link>
                    </div>
                  )}
                </div>

                {/* CV */}
                <div>
                  <Label>Curriculum vitæ</Label>
                  {user?.cv_path && useExistingCv ? (
                    <FileRow
                      title="CV enregistré"
                      text="Le CV de votre profil sera utilisé"
                      action={
                        <button
                          type="button"
                          onClick={() => setUseExistingCv(false)}
                          className="self-start rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-[#0B1F33] transition hover:border-[#16B8B1] dark:border-white/10 dark:bg-transparent dark:text-white"
                        >
                          Choisir un autre CV
                        </button>
                      }
                    />
                  ) : (
                    <div>
                      {!user?.cv_path && (
                        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Aucun CV enregistré : ajoutez un document pour continuer.</p>
                      )}
                      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border-2 border-dashed border-slate-300 bg-[#F3F6FC]/60 p-4 transition hover:border-[#16B8B1] dark:border-white/15 dark:bg-[#0A1230]">
                        <div className="min-w-0">
                          <p className="break-words text-sm font-bold text-[#0B1F33] dark:text-white">{cvFile ? cvFile.name : "Importer votre CV"}</p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">PDF, DOC ou DOCX · 5 Mo maximum</p>
                        </div>
                        <span className="shrink-0 rounded-lg bg-[#0B1F33] px-3.5 py-2 text-xs font-bold text-white dark:bg-[#16B8B1] dark:text-[#0B1F33]">Parcourir</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0] || null;
                            if (file && file.size > 10 * 1024 * 1024) {
                              setError("Le CV ne doit pas dépasser 5 Mo.");
                              event.target.value = "";
                              return;
                            }
                            setError(null);
                            setCvFile(file);
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Lettre */}
                <div>
                  <Label htmlFor="cover-letter" optional>Lettre de motivation</Label>
                  <textarea
                    id="cover-letter"
                    rows={5}
                    value={coverLetter}
                    onChange={(event) => setCoverLetter(event.target.value)}
                    placeholder="Présentez votre motivation et ce que vous pourriez apporter à l'équipe…"
                    className={`${inputClass} resize-y leading-7`}
                  />
                  <p className="mt-1.5 text-right text-xs text-slate-400">{coverLetter.length} caractères</p>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 dark:border-white/10 sm:flex-row sm:justify-end">
                  <SecondaryButton type="button" onClick={handleClose}>Annuler</SecondaryButton>
                  <PrimaryButton type="submit" disabled={applying || (!useExistingCv && !cvFile)}>
                    {applying ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0B1F33]/30 border-t-[#0B1F33]" />
                        Envoi en cours…
                      </>
                    ) : (
                      "Envoyer ma candidature"
                    )}
                  </PrimaryButton>
                </div>
              </form>
            </Section>
          ) : (
            <Section title="Votre candidature" hint={`Envoyée à ${companyName}`}>
              {application.status === "rejected" ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-500/30 dark:bg-rose-500/10">
                  <p className="text-sm font-bold text-rose-800 dark:text-rose-300">Cette candidature n'a pas été retenue.</p>
                  <p className="mt-1 text-sm leading-6 text-rose-700 dark:text-rose-300/80">
                    Vous pouvez continuer à explorer les autres opportunités disponibles.
                  </p>
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
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition ${
                              done
                                ? "bg-[#0B1F33] text-white dark:bg-[#16B8B1] dark:text-[#0B1F33]"
                                : "border border-slate-200 bg-white text-slate-400 dark:border-white/10 dark:bg-transparent dark:text-slate-500"
                            }`}
                          >
                            {done ? "✓" : stepNumber}
                          </div>
                          <span className={`mt-2.5 max-w-[76px] text-center text-[10px] font-semibold leading-4 sm:max-w-none sm:text-xs ${done ? "text-[#0B1F33] dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>
                            {step.label}
                          </span>
                        </div>
                        {!last && (
                          <div className={`mt-[17px] h-0.5 min-w-2 flex-1 rounded-full ${stepNumber < currentStep ? "bg-[#16B8B1]" : "bg-slate-200 dark:bg-white/10"}`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}

              {application.status === "interview" && application.interview_at && (
                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">Entretien programmé</p>
                  <p className="mt-1 text-sm font-bold text-[#0B1F33] dark:text-white">
                    {formatDate(application.interview_at)} à{" "}
                   {new Date(application.interview_at).toLocaleTimeString("fr-FR", { 
  hour: "2-digit", 
  minute: "2-digit", 
  timeZone: "Indian/Antananarivo" 
})}
                  </p>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">Consultez les détails et les mises à jour.</p>
                <PrimaryButton type="button" onClick={() => setShowApplicationDetail(true)} className="!py-2.5">
                  Voir les détails
                </PrimaryButton>
              </div>
            </Section>
          )}
        </div>
      )}
    </>
  );

  if (isModal) {
    const hasSidePanel = showApplicationDetail && application?.id;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 font-['Plus_Jakarta_Sans',sans-serif] sm:p-6" role="dialog" aria-modal="true">
        <button type="button" aria-label="Fermer" onClick={onClose} className="absolute inset-0 bg-[#06141F]/70 backdrop-blur-sm" />

        <div className={`relative z-10 flex w-full items-stretch justify-center gap-4 ${hasSidePanel ? "max-w-[1200px]" : "max-w-3xl"}`}>
          <div
            className={`flex max-h-[92vh] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_30px_100px_rgba(6,20,31,0.5)] dark:bg-[#131E47] ${
              hasSidePanel ? "hidden w-full max-w-xl lg:flex lg:w-1/2" : "w-full"
            }`}
          >
            <div className="min-h-0 flex-1 overflow-y-auto">{Content}</div>
          </div>

          {hasSidePanel && (
            <div className="hidden max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_30px_100px_rgba(6,20,31,0.4)] dark:bg-[#131E47] lg:flex lg:w-1/2">
              <ApplicationDetailModal applicationId={application.id} onClose={() => setShowApplicationDetail(false)} embedded />
            </div>
          )}
        </div>

        {hasSidePanel && (
          <div className="lg:hidden">
            <ApplicationDetailModal applicationId={application.id} onClose={() => setShowApplicationDetail(false)} />
          </div>
        )}

        <SuccessModal
          open={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            if (isModal) onClose?.();
            else navigate("/job-offers");
          }}
          title="Candidature envoyée !"
          message={`Votre candidature a bien été transmise à ${companyName}. Vous recevrez une notification dès qu'elle sera consultée.`}
          primaryLabel="Voir mes candidatures"
          primaryLink="/my-activity"
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#F3F6FC] font-['Plus_Jakarta_Sans',sans-serif] dark:bg-[#0A1230]">
      <div className="relative mx-auto max-w-3xl overflow-hidden bg-white shadow-xl dark:bg-[#131E47] sm:my-6 sm:rounded-2xl">
        <button
          type="button"
          onClick={() => navigate("/job-offers")}
          className="absolute left-4 top-4 z-20 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-white/20"
        >
          ← Retour aux offres
        </button>
        <div className="pt-0">{Content}</div>
      </div>
    </div>
  );
}