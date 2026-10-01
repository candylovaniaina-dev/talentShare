import React, { useEffect, useState } from "react";
import {
  X, FileText, Briefcase, Send, Check, Loader2, ExternalLink,
  AlertCircle, Upload, Sparkles,
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

  // ✅ Charge profil + portfolio en parallèle
  useEffect(() => {
    Promise.all([
      api.get("/profile/me").catch(() => ({ data: null })),
      api.get("/portfolio/my").catch(() => ({ data: null })),
    ])
      .then(([profileRes, portfolioRes]) => {
        setProfile(profileRes.data);

        // ✅ Un portfolio est valide seulement s'il a un slug (pas juste un enregistrement vide)
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

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("job_offer_id", offer.id);
      formData.append("cover_letter", coverLetter);
      if (portfolio?.id) formData.append("portfolio_id", portfolio.id);
      if (!useExistingCv && cvFile) formData.append("cv", cvFile);

      await api.post("/applications", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast("✅ Candidature envoyée !", "success");
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

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="rounded-2xl bg-white p-8">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
        </div>
      </div>
    );
  }

  const hasCv = !!profile?.cv_path;
  const canSubmit = coverLetter.length >= 50 && !sending;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ==================== HEADER ==================== */}
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-gradient-to-br from-emerald-50 to-white px-6 py-5">
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                <Sparkles size={10} /> Postuler
              </span>
              <h2 className="mt-2 truncate text-xl font-bold text-slate-900">
                {offer.title}
              </h2>
              {offer.company?.name && (
                <p className="mt-0.5 text-sm text-slate-500">{offer.company.name}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <X size={18} />
            </button>
          </div>

          {/* ==================== BODY ==================== */}
          <form onSubmit={submit} className="flex-1 overflow-y-auto p-6 space-y-6">

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* ---------- PORTFOLIO ---------- */}
            <section>
              <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                <Briefcase size={12} /> Portfolio à joindre
              </label>

              {portfolio ? (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
                    <Check size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-emerald-900">
                      {portfolio.title || "Mon portfolio"}
                    </p>
                    <p className="text-xs text-emerald-700">
                      Ce portfolio sera joint à votre candidature
                    </p>
                  </div>
                  <a
                    href={`/portfolio/${portfolio.public_slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-lg border border-emerald-300 bg-white p-2 text-emerald-600 transition hover:bg-emerald-100"
                    title="Voir le portfolio"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4">
                  <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-500" />
                  <div className="min-w-0 flex-1 text-sm text-amber-900">
                    <p className="font-semibold">Aucun portfolio à joindre</p>
                    <p className="mt-0.5 text-xs text-amber-700">
                      Votre candidature partira sans portfolio.
                    </p>
                    <a
                      href="/profile"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 underline hover:text-amber-900"
                    >
                      Créer mon portfolio <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              )}
            </section>

            {/* ---------- CV ---------- */}
            <section>
              <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                <FileText size={12} /> CV à joindre
              </label>

              <div className="space-y-2">
                {/* Option 1 : CV actuel */}
                {hasCv && (
                  <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                    useExistingCv
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}>
                    <input
                      type="radio"
                      checked={useExistingCv}
                      onChange={() => setUseExistingCv(true)}
                      className="h-4 w-4 accent-emerald-500"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        Utiliser mon CV actuel
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Le CV enregistré dans votre profil sera joint
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                      PDF
                    </span>
                  </label>
                )}

                {/* Option 2 : Nouveau CV */}
                <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                  !useExistingCv
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}>
                  <input
                    type="radio"
                    checked={!useExistingCv}
                    onChange={() => setUseExistingCv(false)}
                    className="mt-1 h-4 w-4 accent-emerald-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      Téléverser un autre CV
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {cvFile ? cvFile.name : "PDF, DOC ou DOCX · 5 Mo max"}
                    </p>
                    {!useExistingCv && (
                      <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-600">
                        <Upload size={12} />
                        {cvFile ? "Changer de fichier" : "Choisir un fichier"}
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => setCvFile(e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </label>

                {!hasCv && !cvFile && (
                  <p className="flex items-center gap-1.5 text-xs text-amber-600">
                    <AlertCircle size={11} /> Aucun CV disponible. Téléversez-en un ci-dessus.
                  </p>
                )}
              </div>
            </section>

            {/* ---------- LETTRE DE MOTIVATION ---------- */}
            <section>
              <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                <Send size={12} /> Lettre de motivation *
              </label>
              <textarea
                required
                rows={7}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Expliquez pourquoi cette offre vous intéresse, ce que vous pouvez apporter, et vos motivations..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className={coverLetter.length < 50 ? "text-amber-600" : "text-emerald-600"}>
                  {coverLetter.length < 50
                    ? `Encore ${50 - coverLetter.length} caractères minimum`
                    : "✓ Longueur validée"}
                </span>
                <span className="text-slate-400">
                  {coverLetter.length} / 5000
                </span>
              </div>
            </section>
          </form>

          {/* ==================== FOOTER ==================== */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? (
                <><Loader2 size={14} className="animate-spin" /> Envoi...</>
              ) : (
                <><Send size={14} /> Envoyer ma candidature</>
              )}
            </button>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </>
  );
}