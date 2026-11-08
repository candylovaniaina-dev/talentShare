import React, { useState } from "react";
import { Star, Loader2, Send, X } from "lucide-react";
import api from "../services/api";

const CRITERIA = [
  { key: "skills_score",        label: "Compétences techniques", hint: "Maîtrise du poste et des outils" },
  { key: "quality_score",       label: "Qualité du travail",     hint: "Précision et rigueur des livrables" },
  { key: "communication_score", label: "Communication",          hint: "Clarté des échanges et réactivité" },
  { key: "punctuality_score",   label: "Ponctualité",            hint: "Respect des délais et des horaires" },
  { key: "collaboration_score", label: "Collaboration",          hint: "Esprit d'équipe et intégration" },
];

export default function ReviewModal({ mission, isTalent, onClose, onSuccess }) {
  const [scores, setScores] = useState({
    skills_score: 5, quality_score: 5, communication_score: 5,
    punctuality_score: 5, collaboration_score: 5,
  });
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setScore = (key, val) => setScores((s) => ({ ...s, [key]: val }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post(`/missions/${mission.id}/ratings`, { ...scores, comment });
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'envoi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#0D2030]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50 px-5 py-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
          <div>
            <h2 className="text-base font-bold text-emerald-900 dark:text-emerald-300">
              Évaluer {isTalent ? "l'entreprise" : "le talent"}
            </h2>
            <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-400">
              Votre retour aide la communauté à grandir.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/40">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          {error && <p className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</p>}

          {CRITERIA.map((c) => (
            <div key={c.key}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{c.label}</p>
                  <p className="text-[11px] text-slate-400">{c.hint}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setScore(c.key, val)}
                      className="text-amber-400 transition hover:scale-110"
                    >
                      <Star size={20} fill={val <= scores[c.key] ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
              Commentaire (optionnel)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </form>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/50">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800">
            Annuler
          </button>
          <button onClick={submit} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Envoyer l'évaluation
          </button>
        </div>
      </div>
    </div>
  );
}