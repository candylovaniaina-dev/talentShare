import React, { useState } from "react";
import { Star, X, Loader2 } from "lucide-react";
import api from "../services/api";

// ✅ On définit les critères selon le rôle
const CRITERIA_TALENT = [
  { key: "skills_score", label: "Compétences" },
  { key: "quality_score", label: "Qualité du travail" },
  { key: "communication_score", label: "Communication" },
  { key: "punctuality_score", label: "Ponctualité" },
  { key: "collaboration_score", label: "Collaboration" },
];

const CRITERIA_COMPANY = [
  { key: "skills_score", label: "Environnement de travail" },
  { key: "quality_score", label: "Management / Suivi" },
  { key: "communication_score", label: "Communication" },
  { key: "punctuality_score", label: "Respect des engagements" },
  { key: "collaboration_score", label: "Ambiance d'équipe" },
];

export default function ReviewModal({ mission, isTalent, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState("");
  
  // ✅ On choisit la bonne liste de critères selon le rôle
  const criteria = isTalent ? CRITERIA_TALENT : CRITERIA_COMPANY;

  const [scores, setScores] = useState({
    skills_score: 0,
    quality_score: 0,
    communication_score: 0,
    punctuality_score: 0,
    collaboration_score: 0,
  });

  const setScore = (key, value) => {
    setScores((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Vérifier que tous les critères sont remplis
    const allFilled = criteria.every((c) => scores[c.key] > 0);
    if (!allFilled) {
      setError("Veuillez noter tous les critères avant de valider.");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/missions/${mission.id}/ratings`, {
        ...scores,
        comment: comment.trim() || null,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'envoi de l'évaluation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#131E47]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-start justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-[#0B1F33] dark:text-white">
              Évaluer la mission
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {isTalent
                ? "Partagez votre expérience chez l'entreprise."
                : "Partagez votre retour sur le talent."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          {error && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Critères dynamiques */}
          <div className="space-y-4">
            {criteria.map((c) => (
              <div key={c.key} className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {c.label}
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setScore(c.key, value)}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                        scores[c.key] >= value
                          ? "bg-amber-400 text-white"
                          : "bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-500"
                      }`}
                    >
                      <Star size={18} fill={scores[c.key] >= value ? "currentColor" : "none"} />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                    {scores[c.key] > 0 ? `${scores[c.key]}/5` : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Commentaire */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Commentaire (optionnel)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez un détail marquant..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none transition focus:border-[#16B8B1] focus:bg-white focus:ring-2 focus:ring-[#16B8B1]/20 dark:border-slate-700 dark:bg-[#0A1230] dark:text-white"
            />
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-transparent dark:text-slate-300"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#16B8B1] px-5 py-2.5 text-sm font-bold text-[#0B1F33] transition hover:bg-[#0F9691] hover:text-white disabled:opacity-50"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              Envoyer l'évaluation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}