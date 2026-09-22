import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Building2, MapPin, Calendar, Clock, DollarSign,
  Zap, Users, Tag, Briefcase, Share2, Check, Star, Eye,
  UserPlus, MessageSquare, Loader2, Lock, ShieldCheck, Send, Sparkles,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import PublicNavbar from "../components/layout/PublicNavbar";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import MatchScoreBadge from "../components/MatchScoreBadge";

const STATUS_CFG = {
  draft:     { label: "Brouillon", badge: "bg-slate-100 text-slate-600" },
  published: { label: "Publiée",   badge: "bg-emerald-100 text-emerald-700" },
  paused:    { label: "En pause",  badge: "bg-amber-100 text-amber-700" },
  closed:    { label: "Fermée",    badge: "bg-rose-100 text-rose-700" },
  filled:    { label: "Pourvue",   badge: "bg-blue-100 text-blue-700" },
  expired:   { label: "Expirée",   badge: "bg-slate-100 text-slate-500" },
};

const LEVEL_LABEL = {
  beginner: "Débutant",
  intermediate: "Intermédiaire",
  advanced: "Avancé",
  expert: "Expert",
};

const asArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export default function ResourceRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [myTalents, setMyTalents] = useState([]);
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [message, setMessage] = useState("");
  const [proposing, setProposing] = useState(false);
  const { toast, show: showToast, close: closeToast } = useToast();

  useEffect(() => {
    api.get(`/resource-requests/${id}`)
      .then((res) => setRequest(res.data))
      .catch((err) => {
        if (err.response?.status === 404) setError("not_found");
        else if (err.response?.status === 403) setError("forbidden");
        else setError("error");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: request?.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) { /* silent */ }
  };

  const openProposeModal = async () => {
    setShowProposeModal(true);
    try {
      const employeesRes = await api.get("/companies/me/employees").catch(() => ({ data: [] }));
      const list = Array.isArray(employeesRes.data?.data)
        ? employeesRes.data.data
        : Array.isArray(employeesRes.data) ? employeesRes.data : [];

      setMyTalents(list.map((e) => ({
        profile_id: e.user?.professional_profile?.id || e.user?.professionalProfile?.id,
        user_id: e.user_id,
        name: e.user?.name || `${e.first_name} ${e.last_name}`,
        headline: e.position || e.user?.professional_profile?.headline,
      })).filter((t) => t.profile_id));
    } catch (err) {
      console.error(err);
    }
  };

  const submitProposal = async () => {
    if (!selectedTalent) return;
    setProposing(true);
    try {
      const companyRes = await api.get("/companies/me");
      await api.post("/proposals", {
        resource_request_id: request.id,
        professional_profile_id: selectedTalent.profile_id,
        proposed_by_company_id: companyRes.data.id,
        message: message || null,
      });
      setShowProposeModal(false);
      showToast("✅ Proposition envoyée !", "success");
   } catch (err) {
  const msg = err.response?.data?.message;
  const code = err.response?.data?.code;

  if (code === "duplicate_proposal") {
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

  if (error === "not_found" || !request) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <Lock size={40} className="mx-auto text-slate-300" />
          <h1 className="mt-4 text-2xl font-bold">Demande introuvable</h1>
          <p className="mt-2 text-slate-500">
            Cette demande n'existe pas ou a été supprimée.
          </p>
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

  const cfg = STATUS_CFG[request.display_status] || STATUS_CFG.draft;
  const isOwner = request.is_owner;
  const canPropose = user && !isOwner && request.display_status === "published";
  const daysLeft = request.days_until_expiry;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && request.display_status === "published";

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy"
        >
          <ArrowLeft size={15} /> Retour
        </button>

        {/* ============ HEADER ============ */}
        <div className="rounded-3xl bg-navy p-8 text-white">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.badge}`}>
                  {cfg.label}
                </span>
                {request.urgency === "urgent" && (
                  <span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-bold text-white flex items-center gap-1">
                    <Zap size={11} /> Urgent
                  </span>
                )}
                {isExpiringSoon && (
                  <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white">
                    ⚠️ Expire dans {daysLeft}j
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold">{request.title}</h1>

              {request.company && (
                <div className="mt-3 flex items-center gap-2 text-slate-300">
                  <Building2 size={16} className="text-mint" />
                  <span className="font-semibold">{request.company.name}</span>
                  {request.company.is_verified && <ShieldCheck size={14} className="text-mint" />}
                  {request.company.city && (
                    <span className="text-sm">· {request.company.city}</span>
                  )}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Eye size={14} /> {request.views_count} vues
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={14} /> {request.proposals_count || 0} proposition{(request.proposals_count || 0) > 1 ? "s" : ""}
                </span>
                {request.positions_count > 1 && (
                  <span className="flex items-center gap-1.5 text-blue-300">
                    <Briefcase size={14} /> {request.positions_count} postes à pourvoir
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={share}
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20 transition"
            >
              {copied ? <Check size={14} /> : <Share2 size={14} />}
              {copied ? "Lien copié" : "Partager"}
            </button>
          </div>

          {/* ACTIONS */}
          <div className="mt-6 flex flex-wrap gap-3">
            {isOwner ? (
              <>
                <Link
                  to={`/resource-requests/${request.id}/edit`}
                  className="flex items-center gap-2 rounded-full bg-mint px-5 py-2.5 text-sm font-semibold text-navy hover:bg-mint/80"
                >
                  ✏️ Modifier
                </Link>
                <Link
                  to={`/resource-requests/${request.id}/candidates`}
                  className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold hover:bg-white/20"
                >
                  <Users size={16} /> Voir les candidats
                </Link>
              </>
            ) : canPropose ? (
              <button
                onClick={openProposeModal}
                className="flex items-center gap-2 rounded-full bg-mint px-5 py-2.5 text-sm font-semibold text-navy hover:bg-mint/80"
              >
                <UserPlus size={16} /> Proposer un talent
              </button>
            ) : (
              <p className="text-sm text-slate-400">
                {!user
                  ? "Connectez-vous pour proposer un talent."
                  : "Cette demande n'accepte plus de propositions."}
              </p>
            )}
          </div>
        </div>

        {/* ============ ✅ TOP 3 CANDIDATS MATCHÉS ============ */}
        {isOwner && <TopCandidatesSection requestId={request.id} />}

        {/* ============ CONTENU ============ */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-bold">Description du besoin</h2>
          <p className="mt-3 text-sm text-slate-600 whitespace-pre-line">{request.description}</p>

          {request.tags?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {request.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-purple-50 border border-purple-200 px-2.5 py-1 text-xs font-medium text-purple-700"
                >
                  <Tag size={10} className="inline mr-1" /> {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {request.skills?.length > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold flex items-center gap-2">
              <Star size={18} className="text-navy" /> Compétences requises
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {request.skills.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2"
                >
                  <p className="text-sm font-semibold text-navy">{s.name}</p>
                  <p className="text-xs text-slate-500">
                    Niveau min : {LEVEL_LABEL[s.pivot?.min_level] || "Intermédiaire"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase text-slate-400 mb-2">Période</p>
            <p className="text-sm">
              <b>{new Date(request.start_at).toLocaleDateString("fr-FR")}</b>
              <br />
              <span className="text-slate-400">→</span>{" "}
              <b>{new Date(request.end_at).toLocaleDateString("fr-FR")}</b>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase text-slate-400 mb-2">Charge</p>
            <p className="text-sm font-semibold">{request.workload_percent}%</p>
            {request.remote && <p className="text-xs text-blue-600 mt-1">🏠 Télétravail</p>}
          </div>

          {request.budget_min && request.budget_max && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-xs font-bold uppercase text-emerald-700 mb-2">Budget</p>
              <p className="text-sm font-bold text-emerald-700">
                {request.budget_min} – {request.budget_max} €/jour
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase text-slate-400 mb-2">Localisation</p>
            <p className="text-sm flex items-center gap-1.5">
              <MapPin size={13} className="text-slate-400" />
              {request.city ? `${request.city}, ` : ""}{request.country || "—"}
            </p>
          </div>
        </div>

        {request.expires_at && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3 text-sm text-amber-800">
            <Clock size={18} className="shrink-0" />
            <p>
              Cette demande expire le{" "}
              <b>{new Date(request.expires_at).toLocaleDateString("fr-FR")}</b>
              {daysLeft !== null && (
                <> ({daysLeft} jour{daysLeft > 1 ? "s" : ""} restant{daysLeft > 1 ? "s" : ""})</>
              )}
            </p>
          </div>
        )}
      </div>

      {/* ============ MODAL PROPOSITION ============ */}
      {showProposeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowProposeModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <UserPlus size={20} className="text-navy" /> Proposer un talent
            </h3>

            <p className="text-sm text-slate-500 mb-4">
              Sélectionnez un salarié de votre entreprise à proposer pour cette demande.
            </p>

            {myTalents.length === 0 ? (
              <p className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                Aucun salarié disponible dans votre entreprise. Ajoutez-en dans "Mon entreprise".
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {myTalents.map((t) => (
                  <button
                    key={t.profile_id}
                    onClick={() => setSelectedTalent(t)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      selectedTalent?.profile_id === t.profile_id
                        ? "border-navy bg-navy/5"
                        : "border-slate-200 hover:border-navy"
                    }`}
                  >
                    <p className="font-semibold text-sm">{t.name}</p>
                    {t.headline && <p className="text-xs text-slate-500 mt-0.5">{t.headline}</p>}
                  </button>
                ))}
              </div>
            )}

            {selectedTalent && (
              <div className="mt-4">
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
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={submitProposal}
                disabled={!selectedTalent || proposing}
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </AppShell>
  );
}

// ============================================
// ✅ TOP 3 CANDIDATS MATCHÉS
// ============================================
function TopCandidatesSection({ requestId }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/resource-requests/${requestId}/candidates`)
      .then((res) => setCandidates(asArray(res.data).slice(0, 3)))
      .catch(() => setCandidates([]))
      .finally(() => setLoading(false));
  }, [requestId]);

  if (loading || candidates.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-bold flex items-center gap-2">
          <Sparkles size={18} className="text-emerald-600" />
          Top talents matchés
        </h2>
        <Link
          to={`/resource-requests/${requestId}/candidates`}
          className="text-sm font-semibold text-navy hover:underline"
        >
          Voir tous les candidats →
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {candidates.map((c) => (
          <Link
            key={c.profile_id}
            to={`/talents/${c.profile_id}`}
            className="block rounded-2xl bg-white border border-slate-200 p-4 hover:shadow-md transition"
          >
            <div className="flex items-center gap-3">
              {c.avatar_path ? (
                <img
                  src={`http://localhost:8000/storage/${c.avatar_path}`}
                  className="h-12 w-12 rounded-full object-cover"
                  alt={c.name}
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-navy to-mint text-white flex items-center justify-center font-bold">
                  {c.name?.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{c.name}</p>
                {c.headline && (
                  <p className="text-xs text-slate-500 truncate">{c.headline}</p>
                )}
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <MatchScoreBadge score={c.match?.total} size="sm" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}