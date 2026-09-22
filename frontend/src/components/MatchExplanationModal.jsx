import React, { useEffect, useState } from "react";
import { X, Loader2, Sparkles, TrendingUp } from "lucide-react";
import api from "../services/api";

export default function MatchExplanationModal({ open, onClose, profileId, requestId, mode = "profile_request" }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !profileId) return;
    setLoading(true);
    setError(null);

    const payload = { mode, profile_id: profileId };
    if (mode === "profile_request") payload.request_id = requestId;
    if (mode === "profile_offer") payload.offer_id = requestId;

    api.post("/match/explain", payload)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || "Erreur"))
      .finally(() => setLoading(false));
  }, [open, profileId, requestId, mode]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Sparkles size={20} className="text-mint" /> Pourquoi ce score ?
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-navy" size={32} />
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {data && !loading && (
          <div className="space-y-5">
            {/* Score global */}
            <div className="rounded-2xl bg-navy text-white p-5 text-center">
              <p className="text-xs uppercase tracking-wider text-mint font-semibold">Score global</p>
              <p className="text-5xl font-bold mt-2">{data.total}%</p>
              <p className="text-sm text-slate-300 mt-1">
                {data.profile.name} × {data.target?.title || "Recherche"}
              </p>
            </div>

            {/* Breakdown */}
            {data.breakdown && Object.keys(data.breakdown).length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">
                  Détail du calcul
                </p>
                <div className="space-y-3">
                  {[
                    { key: "skills", label: "🎯 Compétences", color: "bg-navy" },
                    { key: "availability", label: "📅 Disponibilité", color: "bg-emerald-500" },
                    { key: "location", label: "📍 Localisation", color: "bg-blue-500" },
                    { key: "remote", label: "🏠 Télétravail", color: "bg-purple-500" },
                  ].map(({ key, label, color }) => {
                    const value = data.breakdown[key] ?? 0;
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-slate-600">{label}</span>
                          <span className="font-bold text-navy">{value}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-2 ${color} rounded-full transition-all`}
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Explication textuelle */}
            {data.explanation && data.explanation.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">
                  Analyse détaillée
                </p>
                <div className="space-y-2">
                  {data.explanation.map((item, i) => {
                    const bg = {
                      success: "bg-emerald-50 border-emerald-200 text-emerald-800",
                      error: "bg-rose-50 border-rose-200 text-rose-800",
                      warning: "bg-amber-50 border-amber-200 text-amber-800",
                      info: "bg-blue-50 border-blue-200 text-blue-800",
                    }[item.type] || "bg-slate-50 border-slate-200 text-slate-800";

                    return (
                      <div
                        key={i}
                        className={`rounded-xl border px-3 py-2 text-sm flex items-start gap-2 ${bg}`}
                      >
                        <span className="shrink-0">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Conseil */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500 mb-1 flex items-center gap-1.5">
                <TrendingUp size={12} /> Comment améliorer ?
              </p>
              <p className="text-sm text-slate-600">
                {data.total >= 80
                  ? "🎉 Ce candidat est excellent. Contactez-le rapidement !"
                  : data.total >= 60
                  ? "👍 Bonne correspondance. Proposez-lui la mission dès maintenant."
                  : "💡 Enrichissez le profil du candidat (compétences, dispo) pour booster le score."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}