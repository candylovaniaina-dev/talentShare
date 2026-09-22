import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Users, Search, MapPin, ShieldCheck, User, Star,
  Briefcase, Send, Loader2, Sparkles, AlertCircle, X, HelpCircle,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import MatchScoreBadge, { scoreColor } from "../components/MatchScoreBadge";
import MatchExplanationModal from "../components/MatchExplanationModal";

const asArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export default function ResourceRequestCandidates() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState("");
  const [sortBy, setSortBy] = useState("score_desc");
  const { toast, show: showToast, close: closeToast } = useToast();

  // Modal proposition
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [message, setMessage] = useState("");
  const [proposing, setProposing] = useState(false);

  // Modal explication
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [explainProfileId, setExplainProfileId] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/resource-requests/${id}`),
      api.get(`/resource-requests/${id}/candidates`),
    ])
      .then(([reqRes, candRes]) => {
        setRequest(reqRes.data);
        setCandidates(asArray(candRes.data));
      })
      .catch((err) => {
        if (err.response?.status === 403) setError("forbidden");
        else if (err.response?.status === 404) setError("not_found");
        else setError("error");
      })
      .finally(() => setLoading(false));
  }, [id]);

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
        resource_request_id: Number(id),
        professional_profile_id: selectedCandidate.profile_id,
        proposed_by_company_id: companyRes.data.id,
        message: message || null,
      });
      setShowProposeModal(false);
      showToast("✅ Proposition envoyée !", "success");
      const candRes = await api.get(`/resource-requests/${id}/candidates`);
      setCandidates(asArray(candRes.data));
    } catch (err) {
    const status = err.response?.status;
    const msg = err.response?.data?.message;
    const code = err.response?.data?.code;

    if (status === 409 || code === "duplicate_proposal") {
      showToast("⚠️ Ce talent a déjà été proposé pour cette demande.", "warning");
    } else if (code === "mission_overlap") {
      showToast("⚠️ Ce talent a déjà une mission sur cette période.", "warning");
    } else if (code === "request_closed") {
      showToast("⚠️ Cette demande n'accepte plus de propositions.", "warning");
    } else {
      showToast(msg || "Erreur serveur", "error");
    }
  } finally {
    setProposing(false);
  }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="animate-spin text-navy" size={40} />
        </div>
      </AppShell>
    );
  }

  if (error === "forbidden" || error === "not_found" || !request) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <AlertCircle size={40} className="mx-auto text-slate-300" />
          <h1 className="mt-4 text-2xl font-bold">
            {error === "forbidden" ? "Accès refusé" : "Demande introuvable"}
          </h1>
          <Link
            to="/resource-requests"
            className="mt-6 inline-block rounded-full bg-navy px-6 py-2.5 text-sm font-semibold text-white"
          >
            ← Retour aux demandes
          </Link>
        </div>
      </AppShell>
    );
  }

  // Filtres locaux
  let filtered = candidates;

  if (search.trim()) {
    filtered = filtered.filter((c) =>
      (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.headline || "").toLowerCase().includes(search.toLowerCase())
    );
  }

  if (minScore) {
    filtered = filtered.filter((c) => (c.match?.total || 0) >= Number(minScore));
  }

  // Tri
  filtered = [...filtered].sort((a, b) => {
    const aScore = a.match?.total || 0;
    const bScore = b.match?.total || 0;
    if (sortBy === "score_desc") return bScore - aScore;
    if (sortBy === "score_asc") return aScore - bScore;
    if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
    return 0;
  });

  // Stats
  const stats = {
    excellent: candidates.filter((c) => (c.match?.total || 0) >= 80).length,
    good: candidates.filter((c) => (c.match?.total || 0) >= 60 && (c.match?.total || 0) < 80).length,
    medium: candidates.filter((c) => (c.match?.total || 0) >= 40 && (c.match?.total || 0) < 60).length,
    low: candidates.filter((c) => (c.match?.total || 0) < 40).length,
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate(`/resource-requests/${id}`)}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy"
        >
          <ArrowLeft size={15} /> Retour à la demande
        </button>

        {/* Header */}
        <div className="rounded-3xl bg-navy p-8 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-mint">
            Candidats potentiels
          </p>
          <h1 className="mt-2 text-3xl font-bold">{request.title}</h1>
          <p className="mt-2 text-sm text-slate-300">
            Talents dont le profil correspond à vos critères (compétences, niveau, disponibilité).
          </p>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-emerald-500/20 p-3">
              <p className="text-2xl font-bold text-emerald-300">{stats.excellent}</p>
              <p className="text-xs text-emerald-200">🏆 Excellent</p>
            </div>
            <div className="rounded-2xl bg-blue-500/20 p-3">
              <p className="text-2xl font-bold text-blue-300">{stats.good}</p>
              <p className="text-xs text-blue-200">👍 Bon</p>
            </div>
            <div className="rounded-2xl bg-amber-500/20 p-3">
              <p className="text-2xl font-bold text-amber-300">{stats.medium}</p>
              <p className="text-xs text-amber-200">🤔 Moyen</p>
            </div>
            <div className="rounded-2xl bg-slate-500/20 p-3">
              <p className="text-2xl font-bold text-slate-300">{stats.low}</p>
              <p className="text-xs text-slate-200">😐 Faible</p>
            </div>
          </div>
        </div>

        {/* Barre de recherche + filtres */}
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-1 min-w-[220px] items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou titre..."
              className="flex-1 text-sm focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-slate-400 hover:text-rose-500">
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Tous les scores</option>
            <option value="80">≥ 80% (Excellent)</option>
            <option value="60">≥ 60% (Bon)</option>
            <option value="40">≥ 40% (Moyen)</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="score_desc">↓ Score décroissant</option>
            <option value="score_asc">↑ Score croissant</option>
            <option value="name">A-Z Nom</option>
          </select>
        </div>

        {/* Liste */}
        <div className="mt-6 space-y-4">
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <Users size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-600">
                {search || minScore ? "Aucun candidat ne correspond aux filtres" : "Aucun candidat trouvé"}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {search || minScore
                  ? "Essayez de modifier vos filtres."
                  : "Aucun profil ne matche actuellement cette demande."}
              </p>
              {(search || minScore) && (
                <button
                  onClick={() => { setSearch(""); setMinScore(""); }}
                  className="mt-4 text-sm font-semibold text-navy hover:underline"
                >
                  Effacer les filtres
                </button>
              )}
            </div>
          )}

          {filtered.map((c) => {
            const score = c.match?.total || 0;
            const breakdown = c.match?.breakdown || {};

            return (
              <div
                key={c.profile_id}
                className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {c.avatar_path ? (
                      <img
                        src={`http://localhost:8000/storage/${c.avatar_path}`}
                        alt={c.name}
                        className="h-16 w-16 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-mint text-xl font-bold text-white">
                        {c.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold">{c.name}</p>
                        <ShieldCheck size={14} className="text-mint" />
                      </div>

                      {c.headline && <p className="text-sm text-slate-500">{c.headline}</p>}

                      {c.city && (
                        <span className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                          <MapPin size={12} /> {c.city}
                        </span>
                      )}

                      {breakdown && (
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          {breakdown.skills !== undefined && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                              🎯 Compétences : {breakdown.skills}%
                            </span>
                          )}
                          {breakdown.availability !== undefined && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                              📅 Dispo : {breakdown.availability}%
                            </span>
                          )}
                          {breakdown.location !== undefined && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                              📍 Lieu : {breakdown.location}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <MatchScoreBadge score={score} size="md" showLabel />
                </div>

                <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div className="flex gap-3">
                    <Link
                      to={`/talents/${c.profile_id}`}
                      className="text-xs text-slate-400 hover:text-navy inline-flex items-center gap-1.5"
                    >
                      <User size={13} /> Voir le profil
                    </Link>
                    <button
                      onClick={() => openExplain(c)}
                      className="text-xs text-navy font-semibold hover:underline inline-flex items-center gap-1.5"
                    >
                      <HelpCircle size={13} /> Expliquer ce score
                    </button>
                  </div>
                  <button
                    onClick={() => openPropose(c)}
                    className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navy-light flex items-center gap-2"
                  >
                    <Send size={14} /> Proposer ce talent
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal proposition */}
      {showProposeModal && selectedCandidate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowProposeModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Send size={20} className="text-navy" /> Proposer un talent
              </h3>
              <button
                onClick={() => setShowProposeModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 mb-4">
              <p className="font-semibold">{selectedCandidate.name}</p>
              {selectedCandidate.headline && (
                <p className="text-sm text-slate-500">{selectedCandidate.headline}</p>
              )}
              <p className="mt-2 text-xs font-semibold text-navy">
                Score : {selectedCandidate.match?.total || 0}%
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500">
                Message d'accompagnement (optionnel)
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Pourquoi ce talent correspond à votre besoin..."
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={submitProposal}
                disabled={proposing}
                className="flex-1 rounded-xl bg-navy py-2.5 text-sm font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <Send size={14} />
                {proposing ? "Envoi..." : "Envoyer la proposition"}
              </button>
              <button
                onClick={() => setShowProposeModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal explication */}
      <MatchExplanationModal
        open={showExplainModal}
        onClose={() => setShowExplainModal(false)}
        profileId={explainProfileId}
        requestId={id}
        mode="profile_request"
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </AppShell>
  );
}