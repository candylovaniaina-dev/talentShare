import React, { useEffect, useState } from "react";
import { X, Loader2, Sparkles } from "lucide-react";
import api from "../services/api";

const BREAKDOWN_ITEMS = [
  { key: "skills", label: "Compétences", track: "bg-[#12364D]" },
  { key: "availability", label: "Disponibilité", track: "bg-teal-600" },
  { key: "location", label: "Localisation", track: "bg-blue-500" },
  { key: "remote", label: "Télétravail", track: "bg-violet-500" },
];

const MESSAGE_STYLES = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-rose-200 bg-rose-50 text-rose-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

export default function MatchExplanationModal({
  open,
  onClose,
  profileId,
  requestId,
  mode = "profile_request",
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !profileId) return;

    let cancelled = false;

    const fetchExplanation = async () => {
      setLoading(true);
      setError(null);
      setData(null);

      const payload = { mode, profile_id: profileId };

      if (mode === "profile_request") {
        payload.request_id = requestId;
      }

      if (mode === "profile_offer") {
        payload.offer_id = requestId;
      }

      try {
        const response = await api.post("/match/explain", payload);
        if (!cancelled) setData(response.data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Impossible de charger les détails de cette correspondance."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchExplanation();

    return () => {
      cancelled = true;
    };
  }, [open, profileId, requestId, mode]);

  if (!open) return null;

  const total = Number(data?.total);
  const safeTotal = Number.isFinite(total) ? Math.max(0, Math.min(100, total)) : 0;

  const recommendation =
    safeTotal >= 80
      ? {
          title: "Excellente correspondance",
          message: "Ce candidat correspond très bien. Contactez-le rapidement !",
          icon: "🎉",
          style: "border-emerald-200 bg-emerald-50 text-emerald-800",
        }
      : safeTotal >= 60
      ? {
          title: "Bonne correspondance",
          message: "Le profil semble adapté. Vous pouvez envisager de proposer la mission.",
          icon: "👍",
          style: "border-blue-200 bg-blue-50 text-blue-800",
        }
      : {
          title: "Correspondance à renforcer",
          message: "Des informations plus détaillées sur les compétences et les disponibilités peuvent améliorer l'évaluation.",
          icon: "💡",
          style: "border-amber-200 bg-amber-50 text-amber-800",
        };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071126]/65 p-3 backdrop-blur-sm sm:p-5"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-explanation-title"
        className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl dark:border-white/10 dark:bg-[#112A3A]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* EN-TÊTE BLEU MARINE SANS ICÔNE */}
        <header className="relative flex shrink-0 items-center justify-between overflow-hidden bg-gradient-to-br from-[#0B1F33] to-[#142B49] px-5 py-4 text-white sm:px-6">
          <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-[#16B8B1]/20 blur-3xl" />
          
          <div className="relative z-10">
            <h2 id="match-explanation-title" className="text-base font-bold text-white">
              Pourquoi ce score ?
            </h2>
            <p className="mt-1 text-[11px] text-white/60">
              Comprendre les critères de correspondance
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
          >
            <X size={16} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 font-['Plus_Jakarta_Sans',sans-serif] sm:p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-14">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8FBF5]">
                <Loader2 size={27} className="animate-spin text-[#087F70]" />
              </div>
              <p className="mt-4 text-sm font-semibold text-[#12364D] dark:text-white">
                Analyse de la correspondance…
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Évaluation des différents critères
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm font-semibold text-rose-800">
                Une erreur est survenue
              </p>
              <p className="mt-1 text-sm leading-5 text-rose-700">{error}</p>
            </div>
          )}

          {!loading && !error && data && (
            <div className="space-y-6">
              {/* SCORE GLOBAL */}
              <div className="relative overflow-hidden rounded-2xl bg-[#0B1F33] p-5 text-white sm:p-6">
                <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#6EE7C8]/10 blur-2xl" />
                
                <div className="relative text-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#6EE7C8]">
                    
                    Score global
                  </span>

                  <div className="mt-3 flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-extrabold tracking-tight sm:text-6xl">
                      {safeTotal}
                    </span>
                    <span className="text-2xl font-bold text-[#6EE7C8]">%</span>
                  </div>

                  <div className="mx-auto mt-4 h-2 max-w-xs overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full bg-[#6EE7C8] transition-all duration-700"
                      style={{ width: `${safeTotal}%` }}
                    />
                  </div>

                  <p className="mt-4 text-sm font-semibold text-white">
                    {data.profile?.name || "Profil"}{" "}
                    <span className="text-[#6EE7C8]">×</span>{" "}
                    {data.target?.title || "Recherche"}
                  </p>
                </div>
              </div>

              {/* DÉTAIL DU CALCUL */}
              {data.breakdown && Object.keys(data.breakdown).length > 0 && (
                <section>
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-[#12364D] dark:text-white">
                      Détail du calcul
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Contribution de chaque critère au score
                    </p>
                  </div>

                  <div className="space-y-4">
                    {BREAKDOWN_ITEMS.map(({ key, label, track }) => {
                      const rawValue = Number(data.breakdown[key] ?? 0);
                      const value = Number.isFinite(rawValue) ? Math.max(0, Math.min(100, rawValue)) : 0;

                      return (
                        <div key={key}>
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {label}
                            </span>
                            <span className="text-sm font-bold tabular-nums text-[#12364D] dark:text-white">
                              {value}%
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                            <div
                              className={`h-full rounded-full ${track} transition-all duration-500`}
                              style={{ width: `${value}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ANALYSE DÉTAILLÉE */}
              {Array.isArray(data.explanation) && data.explanation.length > 0 && (
                <section>
                  <h3 className="mb-3 text-sm font-bold text-[#12364D] dark:text-white">
                    Analyse détaillée
                  </h3>

                  <div className="space-y-2.5">
                    {data.explanation.map((item, index) => (
                      <div
                        key={`${item.type || "info"}-${index}`}
                        className={`flex items-start gap-3 rounded-xl border p-3 text-sm leading-5 ${
                          MESSAGE_STYLES[item.type] || "border-slate-200 bg-slate-50 text-slate-700"
                        }`}
                      >
                        <span className="shrink-0 text-base">{item.icon || "•"}</span>
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* RECOMMANDATION */}
              <section className={`rounded-2xl border p-4 ${recommendation.style}`}>
                <div className="flex items-start gap-3">
                  <span className="text-xl">{recommendation.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold">{recommendation.title}</h3>
                    <p className="mt-1 text-sm leading-5">{recommendation.message}</p>
                  </div>
                </div>
              </section>

              {/* NOTE */}
              <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500 dark:bg-white/5">
                <p>
                  Le score est une aide à la décision. Pensez à consulter le profil
                  complet avant de prendre une décision.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer className="flex justify-end border-t border-slate-100 px-5 py-3 dark:border-white/10 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#0B1F33] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16324F] focus:outline-none focus:ring-4 focus:ring-[#0B1F33]/15 dark:bg-[#16B8B1] dark:text-[#0B1F33] dark:hover:bg-[#0F9691]"
          >
            Fermer
          </button>
        </footer>
      </section>
    </div>
  );
}