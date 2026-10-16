
import React, { useEffect, useState } from "react";
import {
  X,
  FileText,
  Briefcase,
  Send,
  Check,
  Loader2,
  ExternalLink,
  AlertCircle,
  Upload,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import api from "../services/api";
import { useToast } from "../hooks/useToast";
import Toast from "./ui/Toast";

export default function ApplyModal({ offer, onClose, onSuccess }) {
  const [profile, setProfile] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [cvFile, setCvFile] = useState(null);
  const [useExistingCv, setUseExistingCv] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const { toast, show: showToast, close: closeToast } = useToast();

  useEffect(() => {
    Promise.all([
      api.get("/profile/me").catch(() => ({ data: null })),
      api.get("/portfolio/my").catch(() => ({ data: null })),
    ])
      .then(([profileRes, portfolioRes]) => {
        setProfile(profileRes.data);

        const p = portfolioRes.data;
        const hasPortfolio = p?.public_slug && (p?.title || p?.id);
        setPortfolio(hasPortfolio ? p : null);
      })
      .catch(() => setError("Impossible de charger vos informations."))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    if (coverLetter.trim().length < 50) {
      setError("La lettre de motivation doit faire au moins 50 caractères.");
      return;
    }

    if (coverLetter.length > 5000) {
      setError("La lettre de motivation ne peut pas dépasser 5 000 caractères.");
      return;
    }

    if (!useExistingCv && cvFile) {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      const validExtension = /\.(pdf|doc|docx)$/i.test(cvFile.name);

      if (
        !validExtension ||
        (cvFile.type && !allowedTypes.includes(cvFile.type))
      ) {
        setError("Format invalide. Choisissez un fichier PDF, DOC ou DOCX.");
        return;
      }

      if (cvFile.size > 5 * 1024 * 1024) {
        setError("Le CV ne doit pas dépasser 5 Mo.");
        return;
      }
    }

    setSending(true);

    try {
      const formData = new FormData();
      formData.append("job_offer_id", offer.id);
      formData.append("cover_letter", coverLetter);

      if (portfolio?.id) {
        formData.append("portfolio_id", portfolio.id);
      }

      if (!useExistingCv && cvFile) {
        formData.append("cv", cvFile);
      }

      await api.post("/applications", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast("Candidature envoyée !", "success");

      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 800);
    } catch (err) {
      if (err.response?.status === 409) {
        setError("Vous avez déjà postulé à cette offre.");
      } else {
        setError(err.response?.data?.message || "Erreur lors de l'envoi.");
      }
    } finally {
      setSending(false);
    }
  };

  const hasCv = !!profile?.cv_path;

  const canSubmit =
    coverLetter.trim().length >= 50 &&
    coverLetter.length <= 5000 &&
    !sending &&
    !loading;

  const fieldLabel =
    "mb-3 flex items-center gap-2 text-sm font-semibold text-[#102344]";

  const selectedOption =
    "border-[#6EE7C8] bg-[#F0FCF8] ring-2 ring-[#6EE7C8]/20";

  const normalOption =
    "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50";

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F33]/65 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-2xl">
          <Loader2 className="animate-spin text-teal-600" size={22} />
          <span className="text-sm font-medium text-slate-600">
            Préparation de votre candidature...
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F33]/65 p-3 backdrop-blur-sm sm:p-6"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="apply-modal-title"
          className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_28px_100px_rgba(10,18,41,0.30)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* En-tête */}
          <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-[#F0FCF8] via-white to-[#F1F5FC] px-5 py-6 sm:px-8 sm:py-7">
            <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[#6EE7C8]/30 blur-3xl" />
            <div className="absolute -bottom-16 left-1/3 h-32 w-32 rounded-full bg-blue-100/60 blur-3xl" />

            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#6EE7C8]/50 bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#087F70] shadow-sm">
                  <Sparkles size={14} />
                  Votre prochaine opportunité
                </span>

                <h2
                  id="apply-modal-title"
                  className="mt-4 text-xl font-bold tracking-tight text-[#12364D] sm:text-2xl"
                >
                  Envoyer ma candidature
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Préparez vos documents et présentez votre motivation.
                </p>

                <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#12364D] text-[#6EE7C8]">
                    <Briefcase size={19} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#12364D]">
                      {offer.title}
                    </p>
                    {offer.company?.name && (
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {offer.company.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-[#6EE7C8] hover:bg-[#F0FCF8] hover:text-[#12364D]"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Formulaire */}
          <form
            id="application-form"
            onSubmit={submit}
            className="flex-1 space-y-7 overflow-y-auto px-5 py-6 sm:px-8"
          >
            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
              >
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-rose-500"
                />
                <p className="leading-relaxed">{error}</p>
              </div>
            )}

            {/* Portfolio */}
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <label className={fieldLabel}>
                  <Briefcase size={17} className="text-teal-600" />
                  Portfolio
                </label>
                <span className="text-xs text-slate-400">Facultatif</span>
              </div>

              {portfolio ? (
                <div className="flex items-center gap-3 rounded-2xl border border-[#6EE7C8] bg-[#F0FCF8] p-4 sm:p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#12364D] text-[#6EE7C8]">
                    <Check size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#12364D]">
                      {portfolio.title || "Mon portfolio"}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      Votre portfolio sera associé à cette candidature.
                    </p>
                  </div>

                  <a
                    href={`/portfolio/${portfolio.public_slug}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Voir mon portfolio"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#6EE7C8] bg-white text-[#087F70] transition hover:bg-[#E5FAF3]"
                  >
                    <ArrowUpRight size={18} />
                  </a>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-2xl border border-dashed border-amber-200 bg-amber-50/70 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <AlertCircle size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#12364D]">
                      Aucun portfolio disponible
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      Vous pouvez tout de même envoyer votre candidature sans portfolio.
                    </p>
                    <a
                      href="/profile"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900"
                    >
                      Créer mon portfolio <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              )}
            </section>

            {/* CV */}
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <label className={fieldLabel}>
                  <FileText size={17} className="text-teal-600" />
                  Curriculum vitæ
                </label>
                <span className="text-xs text-slate-400">PDF, DOC, DOCX</span>
              </div>

              <div className="space-y-3">
                {hasCv && (
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                      useExistingCv ? selectedOption : normalOption
                    }`}
                  >
                    <input
                      type="radio"
                      name="cv-choice"
                      checked={useExistingCv}
                      onChange={() => setUseExistingCv(true)}
                      className="mt-1 h-4 w-4 accent-teal-600"
                    />

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm ring-1 ring-slate-100">
                      <FileText size={19} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#12364D]">
                        Utiliser mon CV actuel
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        Le document déjà enregistré dans votre profil.
                      </p>
                    </div>

                    {useExistingCv && (
                      <Check size={17} className="mt-0.5 shrink-0 text-teal-600" />
                    )}
                  </label>
                )}

                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                    !useExistingCv ? selectedOption : normalOption
                  }`}
                >
                  <input
                    type="radio"
                    name="cv-choice"
                    checked={!useExistingCv}
                    onChange={() => setUseExistingCv(false)}
                    className="mt-1 h-4 w-4 accent-teal-600"
                  />

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm ring-1 ring-slate-100">
                    <Upload size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#12364D]">
                      Utiliser un autre CV
                    </p>
                    <p className="mt-1 break-words text-xs leading-relaxed text-slate-500">
                      {cvFile
                        ? cvFile.name
                        : "Choisissez un fichier sur votre appareil (5 Mo maximum)."}
                    </p>

                    {!useExistingCv && (
                      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#6EE7C8] bg-white px-3.5 py-2 text-xs font-semibold text-[#087F70] transition hover:bg-[#E5FAF3]">
                        <Upload size={14} />
                        {cvFile ? "Changer de fichier" : "Choisir un fichier"}
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setCvFile(file);
                              setError(null);
                            }
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>
                </label>

                {!hasCv && (
                  <p className="flex items-center gap-2 text-xs leading-relaxed text-slate-500">
                    <AlertCircle size={14} className="shrink-0 text-amber-500" />
                    Aucun CV n'est enregistré dans votre profil.
                  </p>
                )}
              </div>
            </section>

            {/* Lettre de motivation */}
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <label htmlFor="cover-letter" className={fieldLabel}>
                  <Send size={17} className="text-teal-600" />
                  Lettre de motivation
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs text-slate-400">Obligatoire</span>
              </div>

              <textarea
                id="cover-letter"
                required
                rows={7}
                maxLength={5000}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Présentez votre intérêt pour cette offre, vos compétences et ce que vous pourriez apporter à l'équipe..."
                className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-[#12364D] outline-none transition placeholder:text-slate-400 focus:border-[#6EE7C8] focus:bg-white focus:ring-4 focus:ring-[#6EE7C8]/20"
              />

              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                    coverLetter.trim().length < 50
                      ? "text-amber-600"
                      : "text-teal-700"
                  }`}
                >
                  {coverLetter.trim().length >= 50 && <Check size={13} />}
                  {coverLetter.trim().length < 50
                    ? `Encore ${50 - coverLetter.trim().length} caractères minimum`
                    : "Votre lettre est prête"}
                </span>

                <span
                  className={`text-xs tabular-nums ${
                    coverLetter.length >= 5000
                      ? "font-semibold text-rose-600"
                      : "text-slate-400"
                  }`}
                >
                  {coverLetter.length.toLocaleString("fr-FR")} / 5 000
                </span>
              </div>
            </section>
          </form>

          {/* Pied de fenêtre */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p className="hidden text-xs text-slate-400 sm:block">
              Vérifiez vos informations avant l'envoi.
            </p>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-[#12364D]"
              >
                Annuler
              </button>

              <button
                type="submit"
                form="application-form"
                disabled={!canSubmit}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#12364D] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1A3266] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:shadow-none"
              >
                {sending ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    Envoyer ma candidature
                    <Send size={16} className="text-[#6EE7C8]" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </>
  );
}
