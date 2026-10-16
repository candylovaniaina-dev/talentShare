import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  X,
  Users,
  Search,
  MapPin,
  ShieldCheck,
  User,
  Send,
  Loader2,
  HelpCircle,
  SlidersHorizontal,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import api from "../../services/api";
import MatchScoreBadge from "../MatchScoreBadge";
import MatchExplanationModal from "../MatchExplanationModal";
import { useToast } from "../../hooks/useToast";
import Toast from "../ui/Toast";

const asArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

const SCORE_COLORS = {
  excellent: {
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  good: {
    text: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  medium: {
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  low: {
    text: "text-slate-600",
    bg: "bg-slate-100",
    border: "border-slate-200",
  },
};

export default function CandidatesModal({
  requestId,
  requestTitle,
  onClose,
  embedded = false,
}) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState("");
  const [sortBy, setSortBy] = useState("score_desc");

  const [showProposeModal, setShowProposeModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [message, setMessage] = useState("");
  const [proposing, setProposing] = useState(false);

  const [showExplainModal, setShowExplainModal] = useState(false);
  const [explainProfileId, setExplainProfileId] = useState(null);

  const { toast, show: showToast, close: closeToast } = useToast();

  const loadCandidates = useCallback(() => {
    if (!requestId) {
      setCandidates([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    api
      .get(`/resource-requests/${requestId}/candidates`)
      .then((res) => setCandidates(asArray(res.data)))
      .catch(() => setCandidates([]))
      .finally(() => setLoading(false));
  }, [requestId]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  useEffect(() => {
    if (embedded) return undefined;

    const previousOverflow = document.body.style.overflow;

    const onKey = (event) => {
      if (event.key === "Escape") {
        if (showExplainModal) {
          setShowExplainModal(false);
        } else if (showProposeModal) {
          setShowProposeModal(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, embedded, showExplainModal, showProposeModal]);

  const openPropose = (candidate) => {
    setSelectedCandidate(candidate);
    setMessage("");
    setShowProposeModal(true);
  };

  const openExplain = (candidate) => {
    setExplainProfileId(candidate.profile_id);
    setShowExplainModal(true);
  };

  const submitProposal = async () => {
    if (!selectedCandidate || proposing) return;

    setProposing(true);

    try {
      const companyRes = await api.get("/companies/me");

      await api.post("/proposals", {
        resource_request_id: Number(requestId),
        professional_profile_id: selectedCandidate.profile_id,
        proposed_by_company_id: companyRes.data.id,
        message: message.trim() || null,
        status: "sent",
      });

      setShowProposeModal(false);
      showToast("Proposition envoyée avec succès.", "success");
      loadCandidates();
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      const code = err.response?.data?.code;

      if (status === 409 || code === "duplicate_proposal") {
        showToast(
          "Ce talent a déjà été proposé pour cette demande.",
          "warning"
        );
      } else if (code === "mission_overlap") {
        showToast(
          "Ce talent a déjà une mission sur cette période.",
          "warning"
        );
      } else if (code === "request_closed") {
        showToast(
          "Cette demande n'accepte plus de propositions.",
          "warning"
        );
      } else {
        showToast(msg || "Une erreur est survenue lors de l'envoi.", "error");
      }
    } finally {
      setProposing(false);
    }
  };

  let filtered = candidates.filter((candidate) => {
    const role = candidate.role || candidate.user?.role;

    // Filtre de sécurité côté interface.
    if (role === "company" || role === "university") return false;

    return true;
  });

  if (search.trim()) {
    const query = search.trim().toLowerCase();

    filtered = filtered.filter(
      (candidate) =>
        (candidate.name || "").toLowerCase().includes(query) ||
        (candidate.headline || "").toLowerCase().includes(query)
    );
  }

  if (minScore) {
    filtered = filtered.filter(
      (candidate) => (candidate.match?.total || 0) >= Number(minScore)
    );
  }

  filtered = [...filtered].sort((a, b) => {
    const scoreA = a.match?.total || 0;
    const scoreB = b.match?.total || 0;

    if (sortBy === "score_desc") return scoreB - scoreA;
    if (sortBy === "score_asc") return scoreA - scoreB;
    if (sortBy === "name") {
      return (a.name || "").localeCompare(b.name || "");
    }

    return 0;
  });

  const stats = {
    excellent: filtered.filter((c) => (c.match?.total || 0) >= 80).length,
    good: filtered.filter((c) => {
      const score = c.match?.total || 0;
      return score >= 60 && score < 80;
    }).length,
    medium: filtered.filter((c) => {
      const score = c.match?.total || 0;
      return score >= 40 && score < 60;
    }).length,
    low: filtered.filter((c) => (c.match?.total || 0) < 40).length,
  };

  const content = (
    <div
      className={
        embedded
          ? "flex min-h-0 h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          : "flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      }
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <Users size={21} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                Matching talents
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            <h2 className="mt-1 truncate text-lg font-bold tracking-tight text-slate-900">
              {requestTitle || "Candidats potentiels"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Découvrez les profils qui correspondent à votre demande.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={19} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:grid-cols-4 sm:px-7">
        <StatCard
          value={stats.excellent}
          label="Excellents"
          color="excellent"
        />
        <StatCard value={stats.good} label="Très bons" color="good" />
        <StatCard value={stats.medium} label="Moyens" color="medium" />
        <StatCard value={stats.low} label="Faibles" color="low" />
      </div>

      <div className="space-y-3 border-b border-slate-100 px-5 py-4 sm:px-7">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 transition focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/10">
            <Search size={17} className="shrink-0 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un talent ou une spécialité..."
              className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Effacer la recherche"
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
              <SlidersHorizontal size={15} className="shrink-0 text-slate-400" />
              <select
                value={minScore}
                onChange={(event) => setMinScore(event.target.value)}
                aria-label="Filtrer par score minimum"
                className="w-full bg-transparent py-2.5 text-sm text-slate-700 outline-none"
              >
                <option value="">Tous les scores</option>
                <option value="80">80 % et plus</option>
                <option value="60">60 % et plus</option>
                <option value="40">40 % et plus</option>
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              aria-label="Trier les candidats"
              className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-teal-500"
            >
              <option value="score_desc">Score ↓</option>
              <option value="score_asc">Score ↑</option>
              <option value="name">Nom A-Z</option>
            </select>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/50 px-5 py-4 sm:px-7">
        {loading ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3">
            <Loader2 size={28} className="animate-spin text-teal-600" />
            <p className="text-sm text-slate-500">
              Recherche des meilleurs profils...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Users size={25} />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-800">
              {search || minScore
                ? "Aucun résultat pour ces filtres"
                : "Aucun candidat disponible"}
            </h3>

            <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
              {search || minScore
                ? "Essayez de modifier votre recherche ou d'élargir les critères."
                : "Les profils correspondant à cette demande apparaîtront ici."}
            </p>

            {(search || minScore) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setMinScore("");
                }}
                className="mt-4 rounded-lg px-3 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((candidate) => (
              <CandidateCard
                key={candidate.profile_id}
                candidate={candidate}
                onPropose={() => openPropose(candidate)}
                onExplain={() => openExplain(candidate)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:px-7">
        <p className="hidden text-xs text-slate-400 sm:block">
          Les scores indiquent la compatibilité estimée avec votre demande.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Fermer
        </button>
      </div>
    </div>
  );

  return (
    <>
      {embedded ? (
        content
      ) : (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6"
          onClick={onClose}
        >
          {content}
        </div>
      )}

      {showProposeModal && selectedCandidate && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => !proposing && setShowProposeModal(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                  Contacter un talent
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  Envoyer une proposition
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowProposeModal(false)}
                disabled={proposing}
                aria-label="Fermer la fenêtre"
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50/60 p-4">
                <Avatar candidate={selectedCandidate} size="large" />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">
                    {selectedCandidate.name}
                  </p>

                  {selectedCandidate.headline && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">
                      {selectedCandidate.headline}
                    </p>
                  )}

                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-teal-800 ring-1 ring-teal-100">
                    <TrendingUp size={13} />
                    Compatibilité : {selectedCandidate.match?.total || 0} %
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="proposal-message"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Message d'accompagnement
                  <span className="ml-1 font-normal text-slate-400">
                    (facultatif)
                  </span>
                </label>

                <textarea
                  id="proposal-message"
                  rows={5}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Présentez brièvement la mission et expliquez pourquoi ce profil vous intéresse..."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Un message personnalisé peut faciliter la prise de contact.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowProposeModal(false)}
                disabled={proposing}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={submitProposal}
                disabled={proposing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {proposing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {proposing ? "Envoi en cours..." : "Envoyer la proposition"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showExplainModal && explainProfileId && (
        <MatchExplanationModal
          open={showExplainModal}
          onClose={() => setShowExplainModal(false)}
          profileId={explainProfileId}
          requestId={requestId}
          mode="profile_request"
        />
      )}

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

function Avatar({ candidate, size = "normal" }) {
  const [imageError, setImageError] = useState(false);
  const initials = (candidate?.name || "T")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const dimensions =
    size === "large"
      ? "h-14 w-14 rounded-xl text-base"
      : "h-12 w-12 rounded-xl text-sm";

  const avatarUrl = candidate?.avatar_path
    ? `/storage/${candidate.avatar_path}`
    : null;

  if (avatarUrl && !imageError) {
    return (
      <img
        src={avatarUrl}
        alt={candidate?.name || "Talent"}
        onError={() => setImageError(true)}
        className={`${dimensions} shrink-0 border border-slate-200 object-cover`}
      />
    );
  }

  return (
    <div
      className={`${dimensions} flex shrink-0 items-center justify-center bg-gradient-to-br from-slate-800 to-teal-700 font-bold text-white`}
    >
      {initials || <User size={20} />}
    </div>
  );
}

function CandidateCard({ candidate, onPropose, onExplain }) {
  const score = candidate.match?.total || 0;
  const breakdown = candidate.match?.breakdown || {};

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 transition duration-200 hover:border-teal-200 hover:shadow-md sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <Avatar candidate={candidate} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="truncate text-sm font-bold text-slate-900 sm:text-base">
              {candidate.name || "Talent"}
            </h3>

            <ShieldCheck
              size={15}
              className="shrink-0 text-teal-600"
              aria-label="Profil professionnel"
            />
          </div>

          {candidate.headline && (
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
              {candidate.headline}
            </p>
          )}

          {candidate.city && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin size={13} className="shrink-0 text-slate-400" />
              {candidate.city}
            </p>
          )}

          {Object.keys(breakdown).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {breakdown.skills !== undefined && (
                <BreakdownTag label="Compétences" value={breakdown.skills} />
              )}
              {breakdown.availability !== undefined && (
                <BreakdownTag
                  label="Disponibilité"
                  value={breakdown.availability}
                />
              )}
              {breakdown.location !== undefined && (
                <BreakdownTag label="Localisation" value={breakdown.location} />
              )}
            </div>
          )}
        </div>

        <div className="shrink-0">
          <MatchScoreBadge score={score} size="sm" showLabel />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            to={`/talents/${candidate.profile_id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
          >
            <User size={14} />
            Voir le profil
          </Link>

          <button
            type="button"
            onClick={onExplain}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 transition hover:text-teal-900"
          >
            <HelpCircle size={14} />
            Comprendre le score
          </button>
        </div>

        <button
          type="button"
          onClick={onPropose}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-600/15"
        >
          <Send size={14} />
          Proposer ce talent
        </button>
      </div>
    </article>
  );
}

function BreakdownTag({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
      <span>{label}</span>
      <span className="font-bold text-slate-800">{value}%</span>
    </span>
  );
}

function StatCard({ value, label, color }) {
  const styles = SCORE_COLORS[color] || SCORE_COLORS.low;

  const icons = {
    excellent: <Sparkles size={15} />,
    good: <CheckCircle2 size={15} />,
    medium: <AlertCircle size={15} />,
    low: <Users size={15} />,
  };

  return (
    <div className={`rounded-xl border ${styles.border} ${styles.bg} p-3`}>
      <div className={`flex items-center gap-2 ${styles.text}`}>
        {icons[color]}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${styles.text}`}>
        {value}
      </p>
    </div>
  );
}