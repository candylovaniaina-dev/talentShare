import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, MapPin, Briefcase, Clock, Banknote, Calendar,
  Upload, FileText, Send, CheckCircle2, AlertCircle, Loader2,
  ExternalLink, Video, Eye, UserCheck, X, Check,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import ApplicationDetailModal from "../components/ApplicationDetailModal";
import SuccessModal from "../components/SuccessModal";

const STATUS_META = {
  sent:        { label: "Envoyée",         cls: "border-slate-300 bg-slate-50 text-slate-700",    step: 1 },
  viewed:      { label: "Consultée",       cls: "border-blue-300 bg-blue-50 text-blue-700",       step: 2 },
  shortlisted: { label: "Présélectionnée", cls: "border-violet-300 bg-violet-50 text-violet-700", step: 3 },
  interview:   { label: "Entretien",       cls: "border-amber-300 bg-amber-50 text-amber-700",    step: 4 },
  accepted:    { label: "Acceptée",        cls: "border-emerald-300 bg-emerald-50 text-emerald-700", step: 5 },
  rejected:    { label: "Refusée",         cls: "border-rose-300 bg-rose-50 text-rose-700",       step: 0 },
};

const TIMELINE_STEPS = [
  { key: "sent", label: "Envoyée", icon: Clock },
  { key: "viewed", label: "Consultée", icon: Eye },
  { key: "shortlisted", label: "Présélectionnée", icon: UserCheck },
  { key: "interview", label: "Entretien", icon: Video },
  { key: "accepted", label: "Décision", icon: Check },
];

const OFFER_TYPE_LABEL = {
  internship: "Stage",
  apprenticeship: "Alternance",
  junior_mission: "Mission junior",
  first_job: "Emploi",
};

const formatDate = (v) =>
  v ? new Date(v).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : null;

const formatSalary = (min, max, currency = "Ar") => {
  if (!min && !max) return null;
  const fmt = (n) => new Intl.NumberFormat("fr-FR").format(n);
  if (min && max) return `${fmt(min)} - ${fmt(max)} ${currency} / mois`;
  if (min) return `À partir de ${fmt(min)} ${currency} / mois`;
  return `Jusqu'à ${fmt(max)} ${currency} / mois`;
};

const parseCriteria = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try { return JSON.parse(value || "[]"); } catch { return []; }
  }
  return [];
};

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
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isModal, onClose]);

  useEffect(() => {
    if (!offerId) return;
    let active = true;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [offerRes, portfolioRes, appsRes] = await Promise.allSettled([
          api.get(`/job-offers/${offerId}`),
          api.get(`/portfolio/my`),
          api.get(`/applications`),
        ]);

        if (!active) return;

        if (offerRes.status === "fulfilled") {
          setOffer(offerRes.value.data?.data || offerRes.value.data);
        } else {
          setError("Offre introuvable.");
        }

        if (portfolioRes.status === "fulfilled") {
          const p = portfolioRes.value.data?.data || portfolioRes.value.data;
          setPortfolio(p);
        }

        if (appsRes.status === "fulfilled") {
          const list = appsRes.value.data?.data || appsRes.value.data || [];
          const found = list.find((a) => String(a.job_offer_id) === String(offerId));
          setApplication(found || null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchAll();
    return () => { active = false; };
  }, [offerId]);

  const submitApplication = async (e) => {
    e.preventDefault();
    setApplying(true);
    setError(null);

    try {
      let cvPath = null;
      if (!useExistingCv && cvFile) {
        const fdCv = new FormData();
        fdCv.append("cv", cvFile);
        const cvRes = await api.post("/profile/cv", fdCv, {
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
      const found = list.find((a) => String(a.job_offer_id) === String(offerId));
      setApplication(found || { status: "sent" });
      setShowSuccessModal(true);  // ✅ Afficher la modale de succès
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat()[0]
          : "Impossible d'envoyer la candidature.");
      setError(msg);
    } finally {
      setApplying(false);
    }
  };

  const companyName = offer?.company?.name || "Entreprise";
  const salary = offer ? formatSalary(offer.salary_min, offer.salary_max, offer.currency) : null;
  const techs = offer ? parseCriteria(offer.criteria) : [];
  const statusMeta = application?.status ? STATUS_META[application.status] : null;
  const currentStep = statusMeta?.step || 1;

  const handleClose = () => {
    if (isModal) onClose();
    else navigate("/job-offers");
  };

  const Content = (
    <>
      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[#0F9691]" />
        </div>
      ) : !offer ? (
        <div className="py-20 text-center">
          <AlertCircle size={48} className="mx-auto text-rose-500" />
          <h1 className="mt-4 text-xl font-bold">Offre introuvable</h1>
        </div>
      ) : (
        <div className={`space-y-5 ${isModal ? "p-5 sm:p-6" : ""}`}>

          {/* ============ EN-TÊTE OFFRE ============ */}
          <section>
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#EAF7FA] to-[#E1F6F0] text-lg font-extrabold text-[#087F83]">
                  {offer.company?.logo_url ? (
                    <img src={offer.company.logo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    companyName.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#079C94]">
                    {companyName}
                  </p>
                  <h1 className="mt-0.5 text-lg font-extrabold text-[#102A43] sm:text-xl">
                    {offer.title}
                  </h1>
                </div>
              </div>

              {statusMeta && (
                <span className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${statusMeta.cls}`}>
                  {statusMeta.label}
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#71849A] sm:text-sm">
              {(offer.city || offer.country) && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={13} /> {[offer.city, offer.country].filter(Boolean).join(", ")}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Briefcase size={13} /> {OFFER_TYPE_LABEL[offer.offer_type] || offer.offer_type || offer.contract_type}
              </span>
              {offer.remote && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={13} /> Télétravail
                </span>
              )}
              {salary && (
                <span className="inline-flex items-center gap-1.5 font-bold text-[#0F9691]">
                  <Banknote size={13} /> {salary}
                </span>
              )}
            </div>

            {offer.application_deadline && (
              <p className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                <Calendar size={13} />
                Candidatures jusqu'au {formatDate(offer.application_deadline)}
              </p>
            )}
          </section>

          {/* ============ DESCRIPTION ============ */}
          <section className="rounded-2xl border border-[#E5EDF3] bg-white p-4 sm:p-5">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#102A43]">
              Description
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#4B647D]">
              {offer.description}
            </p>

            {techs.length > 0 && (
              <>
                <h3 className="mt-4 text-xs font-extrabold uppercase tracking-wider text-[#102A43]">
                  Critères
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {techs.map((c, i) => (
                    <span key={i} className="rounded-md bg-[#E8F8F5] px-2.5 py-1 text-xs font-bold text-[#087F73]">
                      {c}
                    </span>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* ============ CANDIDATURE ============ */}
          {!application ? (
            /* ---- Formulaire de candidature ---- */
            <section className="rounded-2xl border border-[#E5EDF3] bg-white p-4 sm:p-5">
              <h2 className="text-base font-extrabold text-[#102A43]">
                Postuler à cette offre
              </h2>
              <p className="mt-1 text-xs text-[#71849A]">
                Remplis le formulaire ci-dessous pour envoyer ta candidature.
              </p>

              {error && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={submitApplication} className="mt-4 space-y-4">
                {/* Portfolio */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[#405B73]">
                    <FileText size={13} className="text-[#0B9690]" />
                    Portfolio
                  </label>
                  {portfolio ? (
                    <div className="flex items-center justify-between rounded-xl border border-[#DDE7EF] bg-[#F8FBFC] px-3.5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 size={16} className="text-[#0F9691]" />
                        <div>
                          <p className="text-xs font-bold text-[#24435D]">
                            {portfolio.title || "Mon portfolio"}
                          </p>
                          <p className="text-[10px] text-[#71849A]">Partagé avec l'entreprise</p>
                        </div>
                      </div>
                      <Link to="/profile" className="text-[11px] font-bold text-[#087F73] hover:underline">
                        Modifier
                      </Link>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
                      <AlertCircle size={16} className="text-amber-600" />
                      <p className="flex-1 text-xs text-amber-900">
                        Aucun portfolio — <Link to="/profile" className="font-bold underline">crée-le ici</Link>
                      </p>
                    </div>
                  )}
                </div>

                {/* CV */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[#405B73]">
                    <Upload size={13} className="text-[#0B9690]" />
                    CV
                  </label>
                  {user?.cv_path && useExistingCv ? (
                    <div className="flex items-center justify-between rounded-xl border border-[#DDE7EF] bg-[#F8FBFC] px-3.5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <FileText size={16} className="text-[#0F9691]" />
                        <p className="text-xs font-bold text-[#24435D]">Utiliser mon CV enregistré</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUseExistingCv(false)}
                        className="text-[11px] font-bold text-[#087F73] hover:underline"
                      >
                        Changer
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-[#DDE7EF] bg-[#FAFCFD] px-3.5 py-4 transition hover:border-[#14B8A6] hover:bg-[#F0FDFA]">
                      <Upload size={18} className="text-[#71849A]" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-[#24435D]">
                          {cvFile ? cvFile.name : "Choisir un fichier PDF"}
                        </p>
                        <p className="text-[10px] text-[#71849A]">PDF, DOC, DOCX · max 5 Mo</p>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>

                {/* Lettre */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[#405B73]">
                    <Send size={13} className="text-[#0B9690]" />
                    Lettre de motivation
                  </label>
                  <textarea
                    rows={4}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Explique pourquoi tu es motivé pour ce poste..."
                    className="w-full rounded-xl border border-[#DDE7EF] bg-[#FAFCFD] px-3 py-2.5 text-xs text-[#102A43] outline-none transition placeholder:text-[#9AABBA] focus:border-[#14B8A6] focus:ring-4 focus:ring-[#14B8A6]/10"
                  />
                </div>

                {/* Boutons */}
                <div className="flex justify-end gap-2 border-t border-[#E8EEF3] pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-xl border border-[#DDE7EF] px-4 py-2.5 text-xs font-bold text-[#5E7387] hover:bg-[#F6F9FB]"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={applying || (!useExistingCv && !cvFile)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#102A43] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#087F83] disabled:opacity-50"
                  >
                    {applying ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {applying ? "Envoi..." : "Envoyer ma candidature"}
                  </button>
                </div>
              </form>
            </section>
          ) : (
            /* ---- Candidature envoyée ---- */
            <section className="overflow-hidden rounded-2xl border border-[#E5EDF3] bg-white">
              {/* En-tête vert */}
              <div className="flex items-center gap-3 border-b border-emerald-100 bg-emerald-50/60 px-4 py-3.5 sm:px-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 size={20} className="text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-extrabold text-[#102A43]">
                    Candidature envoyée
                  </h2>
                  <p className="text-[11px] text-[#4B647D]">
                    Transmise à <span className="font-bold">{companyName}</span>
                  </p>
                </div>
                {statusMeta && (
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusMeta.cls}`}>
                    {statusMeta.label}
                  </span>
                )}
              </div>

              {/* Timeline */}
              <div className="px-4 py-5 sm:px-6">
                <p className="mb-4 text-[10px] font-extrabold uppercase tracking-wider text-[#8A9BB0]">
                  Suivi de votre candidature
                </p>

                <div className="flex items-start justify-between gap-0">
                  {TIMELINE_STEPS.map((s, i) => {
                    const stepNum = i + 1;
                    const done = stepNum <= currentStep;
                    const isCurrent = stepNum === currentStep;
                    const isLast = i === TIMELINE_STEPS.length - 1;
                    const Icon = s.icon;

                    return (
                      <React.Fragment key={s.key}>
                        <div className="flex min-w-0 flex-1 flex-col items-center">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition ${
                              done
                                ? "border-[#0F9691] bg-[#0F9691] text-white"
                                : "border-[#E8EEF3] bg-white text-[#B0BDCB]"
                            } ${isCurrent ? "ring-4 ring-[#0F9691]/15" : ""}`}
                          >
                            <Icon size={15} />
                          </div>
                          <span
                            className={`mt-2 line-clamp-2 max-w-[78px] text-center text-[9px] font-bold leading-tight ${
                              done ? "text-[#0F9691]" : "text-[#B0BDCB]"
                            }`}
                          >
                            {s.label}
                          </span>
                        </div>

                        {!isLast && (
                          <div className="flex h-9 shrink-0 items-center px-0.5">
                            <div
                              className={`h-0.5 w-6 sm:w-10 lg:w-16 ${
                                done && stepNum < currentStep ? "bg-[#0F9691]" : "bg-[#E8EEF3]"
                              }`}
                            />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {application.status === "interview" && application.interview_at && (
                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                      Entretien programmé
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#102A43]">
                      {formatDate(application.interview_at)} à{" "}
                      {new Date(application.interview_at).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {application.interview_link && (
                      <a
                        href={application.interview_link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-amber-700"
                      >
                        <Video size={12} /> Rejoindre l'entretien
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Lien discret "En savoir plus" */}
              <div className="flex items-center justify-between gap-3 border-t border-[#E8EEF3] bg-[#F9FBFC] px-4 py-3 sm:px-5">
                <p className="text-[11px] text-[#8A9BB0]">
                  Besoin de plus d'informations ?
                </p>

                <button
                  type="button"
                  onClick={() => setShowApplicationDetail(true)}
                  className="group inline-flex items-center gap-1 text-[11px] font-bold text-[#0F9691] underline-offset-4 transition hover:text-[#087F73] hover:underline"
                >
                  En savoir plus
                  
                </button>
              </div>
            </section>
          )}

        </div>
      )}
    </>
  );

  /* ============ MODE MODAL ============ */
 if (isModal) {
  const hasSidePanel = showApplicationDetail && application?.id;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-[#0B1F33]/60 backdrop-blur-sm"
      />

      {/* ✅ Conteneur : côte à côte sur lg, empilé sur mobile */}
      <div
        className={`relative z-10 flex w-full items-stretch justify-center gap-4 ${
          hasSidePanel ? "max-w-[1400px]" : "max-w-5xl"
        }`}
      >
        {/* ✅ Modal 1 — Détail de l'offre */}
        <div
          className={`flex max-h-[92vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300 ${
            hasSidePanel
              ? "hidden w-full max-w-xl lg:flex lg:w-1/2"
              : "flex w-full max-w-4xl"
          }`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-[#E8EEF3] bg-[#F9FBFC] px-5 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#079C94]">
              Détail de l'offre
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="rounded-lg p-1.5 text-[#526B83] transition hover:bg-[#F1F6FA] hover:text-[#0B1F33]"
            >
              <X size={18} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-white">{Content}</div>
        </div>

        {/* ✅ Modal 2 — Candidature (à droite, côte à côte sur lg) */}
        {hasSidePanel && (
          <div className="hidden max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl lg:flex lg:w-1/2">
            <ApplicationDetailModal
              applicationId={application.id}
              onClose={() => setShowApplicationDetail(false)}
              embedded
            />
          </div>
        )}
      </div>

        {/* Sur mobile : modal 2 s'ouvre en plein écran par-dessus */}
      {hasSidePanel && (
        <div className="lg:hidden">
          <ApplicationDetailModal
            applicationId={application.id}
            onClose={() => setShowApplicationDetail(false)}
          />
        </div>
      )}

      {/* ✅ Modale de succès avec confettis 🎉 */}
      <SuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Candidature envoyée !"
        message={`Ta candidature a bien été transmise à ${companyName}. Tu recevras une notification dès qu'elle sera consultée.`}
        primaryLabel="Voir mes candidatures"
        primaryLink="/my-activity"
      />
    </div>
  );
}
  /* ============ MODE PAGE (fallback) ============ */
  return (
    <div className="min-h-screen bg-[#F5F8FA]">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <button
          type="button"
          onClick={() => navigate("/job-offers")}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#087F73] hover:underline"
        >
          <ArrowLeft size={14} /> Retour aux offres
        </button>
         {Content}
      </div>

      {/* ✅ Modale de succès */}
      <SuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Candidature envoyée !"
        message={`Ta candidature a bien été transmise à ${companyName}.`}
        primaryLabel="Voir mes candidatures"
        primaryLink="/my-activity"
      />
    </div>
  );
}