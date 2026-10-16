
import React, { useEffect, useState } from "react";
import {
  X,
  Loader2,
  Sparkles,
  TrendingUp,
  Target,
  CalendarDays,
  MapPin,
  House,
  Lightbulb,
  RefreshCw,
} from "lucide-react";
import api from "../services/api";

const BREAKDOWN_ITEMS = [
  {
    key: "skills",
    label: "Compétences",
    icon: Target,
    color: "#12364D",
    track: "bg-[#12364D]",
  },
  {
    key: "availability",
    label: "Disponibilité",
    icon: CalendarDays,
    color: "#0D9488",
    track: "bg-teal-600",
  },
  {
    key: "location",
    label: "Localisation",
    icon: MapPin,
    color: "#3B82F6",
    track: "bg-blue-500",
  },
  {
    key: "remote",
    label: "Télétravail",
    icon: House,
    color: "#8B5CF6",
    track: "bg-violet-500",
  },
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

        if (!cancelled) {
          setData(response.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Impossible de charger les détails de cette correspondance."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchExplanation();

    return () => {
      cancelled = true;
    };
  }, [open, profileId, requestId, mode]);

  if (!open) return null;

  const total = Number(data?.total);
  const safeTotal = Number.isFinite(total)
    ? Math.max(0, Math.min(100, total))
    : 0;

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
        className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8FBF5] text-[#087F70]">
              <Sparkles size={20} />
            </div>
            <div>
              <h2
                id="match-explanation-title"
                className="text-base font-bold text-[#12364D]"
              >
                Pourquoi ce score ?
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Comprendre les critères de correspondance
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-[#12364D]"
          >
            <X size={19} />
          </button>
        </header>

        <div className="overflow-y-auto p-5 sm:p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-14">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8FBF5]">
                <Loader2 size={27} className="animate-spin text-[#087F70]" />
              </div>
              <p className="mt-4 text-sm font-semibold text-[#12364D]">
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
              <button
                type="button"
                onClick={() => {
                  setData(null);
                  setError(null);
                  setLoading(false);
                  // Le chargement peut être relancé en fermant puis rouvrant la fenêtre.
                }}
                className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-rose-800"
              >
                <RefreshCw size={13} />
                Fermez puis rouvrez la fenêtre pour réessayer
              </button>
            </div>
          )}

          {!loading && !error && data && (
            <div className="space-y-6">
              <div className="relative overflow-hidden rounded-2xl bg-[#12364D] p-5 text-white sm:p-6">
                <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#6EE7C8]/10 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-blue-400/10 blur-2xl" />

                <div className="relative text-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#6EE7C8]">
                    <Sparkles size={12} />
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

              {data.breakdown &&
                Object.keys(data.breakdown).length > 0 && (
                  <section>
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-[#12364D]">
                        Détail du calcul
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Contribution de chaque critère au score
                      </p>
                    </div>

                    <div className="space-y-4">
                      {BREAKDOWN_ITEMS.map(
                        ({ key, label, icon: Icon, track }) => {
                          const rawValue = Number(data.breakdown[key] ?? 0);
                          const value = Number.isFinite(rawValue)
                            ? Math.max(0, Math.min(100, rawValue))
                            : 0;

                          return (
                            <div key={key}>
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[#12364D]">
                                    <Icon size={15} />
                                  </div>
                                  <span className="text-sm font-medium text-slate-700">
                                    {label}
                                  </span>
                                </div>

                                <span className="text-sm font-bold tabular-nums text-[#12364D]">
                                  {value}%
                                </span>
                              </div>

                              <div className="ml-10 h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className={`h-full rounded-full ${track} transition-all duration-500`}
                                  style={{ width: `${value}%` }}
                                />
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </section>
                )}

              {Array.isArray(data.explanation) &&
                data.explanation.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-sm font-bold text-[#12364D]">
                      Analyse détaillée
                    </h3>

                    <div className="space-y-2.5">
                      {data.explanation.map((item, index) => (
                        <div
                          key={`${item.type || "info"}-${index}`}
                          className={`flex items-start gap-3 rounded-xl border p-3 text-sm leading-5 ${
                            MESSAGE_STYLES[item.type] ||
                            "border-slate-200 bg-slate-50 text-slate-700"
                          }`}
                        >
                          <span className="shrink-0 text-base">
                            {item.icon || "•"}
                          </span>
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

              <section
                className={`rounded-2xl border p-4 ${recommendation.style}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{recommendation.icon}</span>
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-bold">
                      <TrendingUp size={16} />
                      {recommendation.title}
                    </h3>
                    <p className="mt-1 text-sm leading-5">
                      {recommendation.message}
                    </p>
                  </div>
                </div>
              </section>

              <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                <Lightbulb size={15} className="mt-0.5 shrink-0" />
                <p>
                  Le score est une aide à la décision. Pensez à consulter le profil
                  complet avant de prendre une décision.
                </p>
              </div>
            </div>
          )}
        </div>

        <footer className="flex justify-end border-t border-slate-100 px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#12364D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#172B5B] focus:outline-none focus:ring-4 focus:ring-[#12364D]/15"
          >
            Fermer
          </button>
        </footer>
      </section>
    </div>
  );
}
