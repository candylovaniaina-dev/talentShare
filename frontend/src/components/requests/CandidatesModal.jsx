import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  X, Users, Search, MapPin, ShieldCheck, User, Send,
  Loader2, HelpCircle, Star,
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

export default function CandidatesModal({ requestId, requestTitle, onClose, embedded = false }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState("");
  const [sortBy, setSortBy] = useState("score_desc");

  // Modal proposition
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [message, setMessage] = useState("");
  const [proposing, setProposing] = useState(false);

  // Modal explication
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [explainProfileId, setExplainProfileId] = useState(null);

  const { toast, show: showToast, close: closeToast } = useToast();

  /* ============ CHARGEMENT ============ */
  const loadCandidates = () => {
    setLoading(true);
    api.get(`/resource-requests/${requestId}/candidates`)
      .then((res) => setCandidates(asArray(res.data)))
      .catch(() => setCandidates([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCandidates();
  }, [requestId]);

  /* ============ FERMETURE ÉCHAP ============ */
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  /* ============ ACTIONS ============ */
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
  if (!selectedCandidate) return;
  setProposing(true);
  try {
    const companyRes = await api.get("/companies/me");
    await api.post("/proposals", {
  resource_request_id: Number(requestId),
  professional_profile_id: selectedCandidate.profile_id,
  proposed_by_company_id: companyRes.data.id,
  message: message || null,
  status: "sent",   // ✅ valeur acceptée par le backend
});
      setShowProposeModal(false);
      showToast("Proposition envoyée ✅", "success");
      loadCandidates();
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      const code = err.response?.data?.code;

      if (status === 409 || code === "duplicate_proposal") {
        showToast("Ce talent a déjà été proposé pour cette demande.", "warning");
      } else if (code === "mission_overlap") {
        showToast("Ce talent a déjà une mission sur cette période.", "warning");
      } else if (code === "request_closed") {
        showToast("Cette demande n'accepte plus de propositions.", "warning");
      } else {
        showToast(msg || "Erreur serveur", "error");
      }
    } finally {
      setProposing(false);
    }
  };

  /* ============ FILTRES ============ */
  let filtered = candidates.filter((c) => {
    const role = c.role || c.user?.role;
    // ✅ Filtre de sécurité frontend
    if (role === "company" || role === "university") return false;
    return true;
  });

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter((c) =>
      (c.name || "").toLowerCase().includes(q) ||
      (c.headline || "").toLowerCase().includes(q)
    );
  }

  if (minScore) {
    filtered = filtered.filter((c) => (c.match?.total || 0) >= Number(minScore));
  }

  filtered = [...filtered].sort((a, b) => {
    const aScore = a.match?.total || 0;
    const bScore = b.match?.total || 0;
    if (sortBy === "score_desc") return bScore - aScore;
    if (sortBy === "score_asc") return aScore - bScore;
    if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
    return 0;
  });

  /* ============ STATS ============ */
  const stats = {
    excellent: filtered.filter((c) => (c.match?.total || 0) >= 80).length,
    good: filtered.filter((c) => (c.match?.total || 0) >= 60 && (c.match?.total || 0) < 80).length,
    medium: filtered.filter((c) => (c.match?.total || 0) >= 40 && (c.match?.total || 0) < 60).length,
    low: filtered.filter((c) => (c.match?.total || 0) < 40).length,
  };

return (
  <>
    {/* ===== CONTENEUR (embedded = dans la grille, sinon overlay) ===== */}
    <div
      className={
        embedded
          ? "flex max-h-[92vh] flex-col overflow-hidden rounded-2xl border border-[var(--border-app)] bg-[var(--bg-app)]/80 shadow-2xl backdrop-blur-2xl animate-modalContent"
          : "fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-modalOverlay"
      }
      onClick={embedded ? undefined : onClose}
    >
      <div
        className={
          embedded
            ? "flex h-full flex-col overflow-hidden"
            : "flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[var(--border-app)] bg-[var(--bg-app)]/80 shadow-2xl backdrop-blur-2xl animate-modalContent"
        }
        onClick={(e) => e.stopPropagation()}
      >

          {/* ===== HEADER ===== */}
          <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-6 py-5">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
                Candidats potentiels
              </p>
              <h2 className="mt-1 truncate text-lg font-semibold text-white">
                {requestTitle || "Demande"}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {filtered.length} talent{filtered.length > 1 ? "s" : ""} correspondant{filtered.length > 1 ? "s" : ""} à vos critères
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* ===== STATS ===== */}
          <div className="grid grid-cols-4 gap-2 border-b border-white/[0.06] px-6 py-3">
            <StatCard value={stats.excellent} label="Excellents" color="emerald" />
            <StatCard value={stats.good}      label="Bons"       color="blue" />
            <StatCard value={stats.medium}    label="Moyens"     color="amber" />
            <StatCard value={stats.low}       label="Faibles"    color="slate" />
          </div>

          {/* ===== FILTRES ===== */}
          <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-6 py-3">
            <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 transition focus-within:border-emerald-500/50">
              <Search size={14} className="shrink-0 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom ou titre..."
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-slate-500 hover:text-rose-400">
                  <X size={13} />
                </button>
              )}
            </div>

            <select
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white focus:border-emerald-500/50 focus:outline-none"
            >
              <option value="">Tous scores</option>
              <option value="80">≥ 80%</option>
              <option value="60">≥ 60%</option>
              <option value="40">≥ 40%</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white focus:border-emerald-500/50 focus:outline-none"
            >
              <option value="score_desc">Score ↓</option>
              <option value="score_asc">Score ↑</option>
              <option value="name">Nom A-Z</option>
            </select>
          </div>

          {/* ===== LISTE ===== */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 size={24} className="animate-spin text-emerald-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Users size={32} className="text-slate-600" />
                <p className="mt-3 text-sm font-medium text-slate-400">
                  {search || minScore ? "Aucun candidat ne correspond aux filtres" : "Aucun candidat trouvé"}
                </p>
                {(search || minScore) && (
                  <button
                    onClick={() => { setSearch(""); setMinScore(""); }}
                    className="mt-3 text-xs font-medium text-emerald-400 hover:text-emerald-300"
                  >
                    Effacer les filtres
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((c) => (
                  <CandidateCard
                    key={c.profile_id}
                    candidate={c}
                    onPropose={() => openPropose(c)}
                    onExplain={() => openExplain(c)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ===== FOOTER ===== */}
          <div className="flex items-center justify-end border-t border-white/[0.06] px-6 py-3">
            <button
              onClick={onClose}
              className="rounded-lg bg-white/[0.06] px-4 py-2 text-xs font-medium text-white transition hover:bg-white/[0.1]"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      {/* ===== MODAL PROPOSITION ===== */}
      {showProposeModal && selectedCandidate && (
       <div
  className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
  onClick={() => setShowProposeModal(false)}
>
  <div
    className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--border-app)] bg-[var(--bg-app)]/80 shadow-2xl backdrop-blur-2xl"
    onClick={(e) => e.stopPropagation()}
  >
           <div className="flex items-center justify-between border-b border-[var(--border-app)] px-6 py-4">
  <h3 className="text-base font-semibold text-[var(--text-app)]">Proposer ce talent</h3>
  <button
    onClick={() => setShowProposeModal(false)}
    className="rounded-lg p-1.5 text-[var(--text-faint)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
  >
    <X size={18} />
  </button>
</div>

            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              <div className="rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface)]/50 p-3">
  <p className="text-sm font-semibold text-[var(--text-app)]">{selectedCandidate.name}</p>
  {selectedCandidate.headline && (
    <p className="mt-0.5 text-xs text-[var(--text-muted)]">{selectedCandidate.headline}</p>
  )}
  <p className="mt-2 text-xs font-medium text-emerald-400">
    Score : {selectedCandidate.match?.total || 0}%
  </p>
</div>

              <div>
  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
    Message d'accompagnement (optionnel)
  </label>
<textarea
  rows={4}
  value={message}
  onChange={(e) => setMessage(e.target.value)}
  placeholder="Pourquoi ce talent correspond à votre besoin..."
  className="w-full rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 transition focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 backdrop-blur-sm"
/>
</div>
</div>

{/* ===== FOOTER ===== */}
<div className="flex items-center justify-end gap-2 border-t border-[var(--border-app)] px-6 py-4">
  <button
    type="button"
    onClick={() => setShowProposeModal(false)}
    className="rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-hover)]"
  >
    Annuler
  </button>
  <button
    type="button"
    onClick={submitProposal}
    disabled={proposing}
    className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-50"
  >
    {proposing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
    {proposing ? "Envoi..." : "Envoyer"}
  </button>
</div>
</div>
</div>
)}

      {/* ===== MODAL EXPLICATION ===== */}
      {showExplainModal && explainProfileId && (
        <MatchExplanationModal
          open={showExplainModal}
          onClose={() => setShowExplainModal(false)}
          profileId={explainProfileId}
          requestId={requestId}
          mode="profile_request"
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </>
  );
}

/* ============================================
   CARTE CANDIDAT
============================================ */
function CandidateCard({ candidate, onPropose, onExplain }) {
  const score = candidate.match?.total || 0;
  const breakdown = candidate.match?.breakdown || {};

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3 transition hover:border-white/[0.12]">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {candidate.avatar_path ? (
          <img
            src={`http://localhost:8000/storage/${candidate.avatar_path}`}
            alt={candidate.name}
            className="h-12 w-12 shrink-0 rounded-full border border-white/[0.08] object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-bold text-white">
            {candidate.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
        )}

        {/* Infos */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-white">{candidate.name}</p>
            <ShieldCheck size={12} className="shrink-0 text-emerald-400" />
          </div>

          {candidate.headline && (
            <p className="truncate text-xs text-slate-500">{candidate.headline}</p>
          )}

          {candidate.city && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
              <MapPin size={10} /> {candidate.city}
            </p>
          )}

          {/* Breakdown */}
          {breakdown && (
            <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
              {breakdown.skills !== undefined && (
                <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-slate-400">
                  Compétences : {breakdown.skills}%
                </span>
              )}
              {breakdown.availability !== undefined && (
                <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-slate-400">
                  Dispo : {breakdown.availability}%
                </span>
              )}
              {breakdown.location !== undefined && (
                <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-slate-400">
                  Lieu : {breakdown.location}%
                </span>
              )}
            </div>
          )}
        </div>

        {/* Score */}
        <MatchScoreBadge score={score} size="sm" showLabel />
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.04] pt-3">
        <div className="flex items-center gap-3 text-[11px]">
          <Link
            to={`/talents/${candidate.profile_id}`}
            className="flex items-center gap-1 text-slate-500 transition hover:text-white"
          >
            <User size={11} /> Voir profil
          </Link>
          <button
            onClick={onExplain}
            className="flex items-center gap-1 text-emerald-400 transition hover:text-emerald-300"
          >
            <HelpCircle size={11} /> Expliquer
          </button>
        </div>

        <button
          onClick={onPropose}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-[#0A1229] transition hover:bg-emerald-400"
        >
          <Send size={11} />
          Proposer
        </button>
      </div>
    </div>
  );
}

/* ============================================
   STAT CARD
============================================ */
function StatCard({ value, label, color }) {
  const colors = {
    emerald: "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400",
    blue:    "border-blue-500/20 bg-blue-500/[0.06] text-blue-400",
    amber:   "border-amber-500/20 bg-amber-500/[0.06] text-amber-400",
    slate:   "border-slate-500/20 bg-slate-500/[0.06] text-slate-400",
  };
  return (
    <div className={`rounded-lg border px-3 py-2 ${colors[color]}`}>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] font-medium opacity-80">{label}</p>
    </div>
  );
}