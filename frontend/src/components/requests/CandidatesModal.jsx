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
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  ChevronDown,
  RotateCcw,
  Target,
  Clock3,
  SearchX,
} from "lucide-react";

import api from "../../services/api";
import MatchScoreBadge from "../MatchScoreBadge";
import MatchExplanationModal from "../MatchExplanationModal";
import { useToast } from "../../hooks/useToast";
import Toast from "../ui/Toast";
import useRequestProposals from "../../hooks/useRequestProposals";

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
    bar: "bg-emerald-500",
  },
  good: {
    text: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-100",
    bar: "bg-blue-500",
  },
  medium: {
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-100",
    bar: "bg-amber-500",
  },
  low: {
    text: "text-slate-600",
    bg: "bg-slate-100",
    border: "border-slate-200",
    bar: "bg-slate-400",
  },
};

export default function CandidatesModal({
  requestId,
  requestTitle,
  onClose,
  embedded = false,
  relations: externalRelations,
  onChanged,
}) {
  const own = useRequestProposals(requestId, !externalRelations);
  const relations = externalRelations ?? own.byProfile;
  const refreshRelations = onChanged ?? own.reload;

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
        if (showExplainModal) setShowExplainModal(false);
        else if (showProposeModal) setShowProposeModal(false);
        else onClose();
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
      await refreshRelations();
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      const code = err.response?.data?.code;

      if (status === 409 || code === "duplicate_proposal") {
        showToast("Ce talent a déjà été proposé pour cette demande.", "warning");
        setShowProposeModal(false);
        refreshRelations();
      } else if (code === "mission_overlap") {
        showToast("Ce talent a déjà une mission sur cette période.", "warning");
      } else if (code === "request_closed") {
        showToast("Cette demande n'accepte plus de propositions.", "warning");
      } else {
        showToast(msg || "Une erreur est survenue lors de l'envoi.", "error");
      }
    } finally {
      setProposing(false);
    }
  };

  let filtered = candidates.filter((candidate) => {
    const role = candidate.role || candidate.user?.role;
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
    if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
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

  const resetFilters = () => {
    setSearch("");
    setMinScore("");
    setSortBy("score_desc");
  };

  const content = (
    <div
      className={
        embedded
          ? "flex h-full min-h-0 flex-col overflow-hidden bg-[#F7F9FC] dark:bg-[#101A31]"
          : "flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-[#F7F9FC] shadow-[0_25px_100px_rgba(2,15,30,0.30)] dark:border-white/10 dark:bg-[#101A31]"
      }
      onClick={(event) => event.stopPropagation()}
    >
      {/* HEADER */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-[#15223B]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold tracking-tight text-[#0B1F33] dark:text-white">
              {requestTitle || "Candidats potentiels"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Identifiez les talents adaptés à votre besoin.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="shrink-0 rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* STATISTIQUES AVEC EMOJIS */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-[#15223B]">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <StatCard value={stats.excellent} label="Excellents" color="excellent" emoji="🤩" />
          <StatCard value={stats.good} label="Très bons" color="good" emoji="😊" />
          <StatCard value={stats.medium} label="Moyens" color="medium" emoji="😐" />
          <StatCard value={stats.low} label="Faibles" color="low" emoji="🙁" />
        </div>
      </div>

      {/* FILTRES */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-[#15223B]">
        <div className="flex flex-col gap-2.5 lg:flex-row">
          <div className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 transition-all focus-within:border-[#16B8B1] focus-within:bg-white dark:border-white/10 dark:bg-white/[0.035] dark:focus-within:bg-white/5">
            <Search size={16} className="shrink-0 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher par nom..."
              className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-200"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5 lg:w-[360px]">
            <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/70 px-3 dark:border-white/10 dark:bg-white/[0.035]">
              <select
                value={minScore}
                onChange={(event) => setMinScore(event.target.value)}
                className="w-full cursor-pointer appearance-none bg-transparent py-2.5 pl-1 pr-5 text-xs font-semibold text-slate-700 outline-none dark:text-slate-200"
              >
                <option value="">Tous les scores</option>
                <option value="80">80 % et plus</option>
                <option value="60">60 % et plus</option>
                <option value="40">40 % et plus</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 text-slate-400" />
            </div>

            <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50/70 px-3 dark:border-white/10 dark:bg-white/[0.035]">
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="w-full cursor-pointer appearance-none bg-transparent py-2.5 pl-1 pr-5 text-xs font-semibold text-slate-700 outline-none dark:text-slate-200"
              >
                <option value="score_desc">Score décroissant</option>
                <option value="score_asc">Score croissant</option>
                <option value="name">Nom A-Z</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 text-slate-400" />
            </div>
          </div>
        </div>

        {(search || minScore) && (
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#078F89] hover:text-[#0B1F33] dark:text-[#56DAD2]"
            >
              Réinitialiser
            </button>
          </div>
        )}
      </div>

      {/* LISTE DES CANDIDATS */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-[#F5F8FB] px-5 py-5 dark:bg-[#101A31]">
        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4">
            <Loader2 size={26} className="animate-spin text-[#16B8B1]" />
            <p className="text-sm font-bold text-[#0B1F33] dark:text-white">
              Analyse des profils...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 text-center dark:border-white/10 dark:bg-white/[0.025]">
            <SearchX size={26} className="text-slate-300" />
            <h3 className="mt-4 text-sm font-bold text-[#0B1F33] dark:text-white">
              {search || minScore
                ? "Aucun résultat pour ces filtres"
                : "Aucun candidat disponible"}
            </h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              {search || minScore
                ? "Essayez de modifier votre recherche."
                : "Les profils correspondants apparaîtront ici."}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filtered.map((candidate) => (
              <CandidateCard
                key={candidate.profile_id}
                candidate={candidate}
                relation={relations?.[String(candidate.profile_id)]}
                onPropose={() => openPropose(candidate)}
                onExplain={() => openExplain(candidate)}
              />
            ))}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-[#15223B]">
        <p className="text-[10px] leading-4 text-slate-400">
          Les scores représentent une estimation de compatibilité.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
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
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#061323]/65 p-2 backdrop-blur-md sm:p-5"
          onClick={onClose}
        >
          {content}
        </div>
      )}

      {/* MODAL PROPOSITION */}
      {showProposeModal && selectedCandidate && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#061323]/70 p-3 backdrop-blur-md">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#15223B]">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-white/10">
              <h3 className="text-base font-bold text-[#0B1F33] dark:text-white">
                Contacter ce talent
              </h3>
              <button onClick={() => setShowProposeModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5">
              <textarea
                rows={4}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Bonjour, votre profil nous intéresse..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-[#16B8B1] dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 p-5 dark:border-white/10">
              <button onClick={() => setShowProposeModal(false)} className="px-4 py-2 text-sm font-semibold text-slate-500">
                Annuler
              </button>
              <button
                onClick={submitProposal}
                disabled={proposing}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F33] px-4 py-2 text-sm font-bold text-white dark:bg-[#16B8B1] dark:text-[#0B1F33]"
              >
                {proposing ? "Envoi..." : "Envoyer"}
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
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}
    </>
  );
}

function Avatar({ candidate, size = "normal" }) {
  const [imageError, setImageError] = useState(false);
  const initials = (candidate?.name || "T").split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const dimensions = size === "large" ? "h-14 w-14 rounded-2xl text-base" : "h-14 w-14 rounded-2xl text-sm";
  const avatarUrl = candidate?.avatar_path ? `/storage/${candidate.avatar_path}` : null;

  if (avatarUrl && !imageError) {
    return <img src={avatarUrl} onError={() => setImageError(true)} className={`${dimensions} border border-slate-200 object-cover`} />;
  }
  return <div className={`${dimensions} flex items-center justify-center bg-[#0B1F33] font-bold text-white`}>{initials}</div>;
}

function CandidateCard({ candidate, relation, onPropose, onExplain }) {
  const score = candidate.match?.total || 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-[#16B8B1]/50 dark:border-white/10 dark:bg-[#15223B]">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar candidate={candidate} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-bold text-[#0B1F33] dark:text-white">{candidate.name || "Talent"}</h3>
            <p className="mt-1 line-clamp-2 text-xs text-slate-500">{candidate.headline || "Profil professionnel"}</p>
            {candidate.city && <p className="mt-2 text-[11px] text-slate-500">{candidate.city}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <MatchScoreBadge score={score} size="sm" showLabel />
            {/* ✅ ICÔNE POINT D'INTERROGATION */}
            <button
              type="button"
              onClick={onExplain}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
              title="Comprendre le score"
            >
              <HelpCircle size={12} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="flex gap-3">
          <Link to={`/talents/${candidate.profile_id}`} className="text-[11px] font-bold text-slate-500 hover:text-[#078F89]">Voir le profil</Link>
          <button onClick={onExplain} className="text-[11px] font-bold text-slate-500 hover:text-[#078F89]">Comprendre le score</button>
        </div>
        {relation?.direction === "applied" ? (
          <span className="text-[11px] font-bold text-emerald-600">A postulé</span>
        ) : relation?.direction === "proposed" ? (
          <span className="text-[11px] font-bold text-slate-400">Déjà proposé</span>
        ) : (
          <button onClick={onPropose} className="rounded-lg bg-[#0B1F33] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#123A50] dark:bg-[#16B8B1] dark:text-[#0B1F33]">Proposer</button>
        )}
      </div>
    </article>
  );
}

function StatCard({ value, label, color, emoji }) {
  const styles = SCORE_COLORS[color] || SCORE_COLORS.low;
  return (
    <div className={`rounded-xl border ${styles.border} ${styles.bg} p-3`}>
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-bold ${styles.text}`}>{label}</span>
        <span className="text-sm">{emoji}</span>
      </div>
      <p className={`mt-1 text-xl font-bold ${styles.text}`}>{value}</p>
    </div>
  );
}