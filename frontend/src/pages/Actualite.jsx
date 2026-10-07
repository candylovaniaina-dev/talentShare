import React, { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import {
  Briefcase, MapPin, Home, Loader2, Clock, Search, Filter, X,
  Building2, TrendingUp, Heart, MessageCircle, Send, CheckCircle,
  AlertCircle, FileText, ExternalLink, Link as LinkIcon,
} from "lucide-react";

const OFFER_TYPES = {
  internship: "Stage",
  apprenticeship: "Alternance",
  junior_mission: "Mission junior",
  first_job: "Premier emploi",
};

export default function Actualite() {
  const { showToast } = useToast();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterRemote, setFilterRemote] = useState(false);
  const [applyOffer, setApplyOffer] = useState(null);
  const [commentOffer, setCommentOffer] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = { per_page: 30 };
      if (filterType) params.offer_type = filterType;
      if (filterRemote) params.remote = 1;
      if (search) params.search = search;

      const res = await api.get("/job-offers", { params });
      setOffers(res.data.data || []);
    } catch (err) {
      console.error(err);
      showToast("Erreur de chargement", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterType, filterRemote]);

  const submitSearch = (e) => {
    e.preventDefault();
    load();
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Espace communauté
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--text-app)]">
            Actualité des offres
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Découvrez les dernières opportunités publiées par les entreprises.
          </p>
        </div>

        {/* Barre de recherche + filtres */}
        <div className="mb-5 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-4">
          <form onSubmit={submitSearch} className="flex flex-wrap gap-2">
            <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2 transition focus-within:border-emerald-500/50">
              <Search size={14} className="shrink-0 text-[var(--text-faint)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un poste, une entreprise..."
                className="w-full bg-transparent text-sm text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus:outline-none"
              />
              {search && (
                <button type="button" onClick={() => { setSearch(""); load(); }} className="text-[var(--text-faint)] hover:text-rose-400">
                  <X size={13} />
                </button>
              )}
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2 text-sm text-[var(--text-app)] focus:border-emerald-500/50 focus:outline-none"
            >
              <option value="">Tous les types</option>
              {Object.entries(OFFER_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2 text-sm text-[var(--text-app)]">
              <input
                type="checkbox"
                checked={filterRemote}
                onChange={(e) => setFilterRemote(e.target.checked)}
                className="h-4 w-4 accent-emerald-500"
              />
              <Home size={13} /> Télétravail
            </label>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400"
            >
              <Filter size={14} /> Filtrer
            </button>
          </form>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="animate-spin text-emerald-400" size={32} />
          </div>
        ) : offers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-app)] bg-[var(--bg-surface)] p-14 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-surface-hover)] text-[var(--text-faint)]">
              <Briefcase size={26} />
            </span>
            <p className="mt-4 font-semibold text-[var(--text-app)]">
              Aucune offre pour le moment
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Essayez de modifier vos filtres ou revenez plus tard.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onApply={() => setApplyOffer(offer)}
                onComment={() => setCommentOffer(offer)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Postuler */}
      {applyOffer && (
        <ApplyModal
          offer={applyOffer}
          onClose={() => setApplyOffer(null)}
          onSuccess={() => {
            setApplyOffer(null);
            showToast("Candidature envoyée ✅", "success");
          }}
        />
      )}

      {/* Modal Commenter */}
      {commentOffer && (
        <CommentModal
          offer={commentOffer}
          onClose={() => setCommentOffer(null)}
          onSuccess={() => {
            setCommentOffer(null);
            showToast("Commentaire envoyé ✅", "success");
          }}
        />
      )}
    </AppShell>
  );
}

/* ============================================
   CARTE : Offre
============================================ */
function OfferCard({ offer, onApply, onComment }) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [liked, setLiked] = useState(offer.is_liked || false);
  const [likesCount, setLikesCount] = useState(offer.likes_count || 0);
  const [liking, setLiking] = useState(false);

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `il y a ${days}j`;
    return new Date(dateStr).toLocaleDateString("fr-FR");
  };

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const res = await api.post(`/job-offers/${offer.id}/like`);
      setLiked(res.data.liked);
      setLikesCount(res.data.likes_count);
    } catch (err) {
      showToast(err.response?.data?.message || "Erreur", "error");
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/actualite#offer-${offer.id}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Lien copié dans le presse-papier ✅", "success");
      api.post(`/job-offers/${offer.id}/share`).catch(() => {});
    } catch {
      showToast("Impossible de copier le lien", "error");
    }
  };

  const company = offer.company;
  const isOwner = user?.id === company?.owner_user_id;

  return (
    <div
      id={`offer-${offer.id}`}
      className="rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-5 transition hover:border-emerald-500/40"
    >
      {/* En-tête entreprise */}
      <div className="flex items-start gap-3">
        {company?.logo_path ? (
          <img
            src={`http://localhost:8000/storage/${company.logo_path}`}
            alt={company.name}
            className="h-12 w-12 shrink-0 rounded-lg border border-[var(--border-app)] object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-lg font-bold text-white">
            {company?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[var(--text-app)]">
            {company?.name || "Entreprise"}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-faint)]">
            <Clock size={10} /> {timeAgo(offer.created_at)}
            {offer.city && (
              <>
                <span>·</span>
                <MapPin size={10} /> {offer.city}
              </>
            )}
            {offer.remote && (
              <span className="rounded border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-blue-400">
                Télétravail
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Contenu */}
      <div className="mt-4">
        <span className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
          {OFFER_TYPES[offer.offer_type] || offer.offer_type}
        </span>
        <h3 className="mt-2 text-lg font-bold text-[var(--text-app)]">
          {offer.title}
        </h3>
        <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-[var(--text-muted)]">
          {offer.description}
        </p>
      </div>

      {/* Likes counter */}
      {likesCount > 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
            <Heart size={11} fill="currentColor" />
          </span>
          {likesCount} {likesCount > 1 ? "personnes aiment" : "personne aime"}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-1 border-t border-[var(--border-app)] pt-3">
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
            liked
              ? "text-rose-400 hover:bg-rose-500/10"
              : "text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
          }`}
        >
          <Heart size={14} fill={liked ? "currentColor" : "none"} />
          J'aime
        </button>

        <button
          onClick={onComment}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
        >
          <MessageCircle size={14} />
          Commenter
        </button>

        <button
          onClick={handleShare}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
        >
          <Send size={14} />
          Partager
        </button>
      </div>

      {/* Bouton Postuler */}
      {!isOwner && (
        <button
          onClick={onApply}
          className="mt-3 w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400"
        >
          Postuler à cette offre
        </button>
      )}
    </div>
  );
}

/* ============================================
   MODAL : Postuler
============================================ */
function ApplyModal({ offer, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    cover_letter: "",
    portfolio_id: "",
    cv_path: "",
  });
  const [profile, setProfile] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/profile/me").then(r => r.data).catch(() => null),
      api.get("/portfolio/my").then(r => r.data).catch(() => null),
    ]).then(([p, pf]) => {
      setProfile(p);
      setPortfolio(pf);
      if (pf?.id) setForm(prev => ({ ...prev, portfolio_id: pf.id }));
      if (p?.cv_path) setForm(prev => ({ ...prev, cv_path: p.cv_path }));
      setLoading(false);
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.post("/applications", {
        job_offer_id: offer.id,
        cover_letter: form.cover_letter || null,
        portfolio_id: form.portfolio_id || null,
        cv_path: form.cv_path || null,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la candidature.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
        <div className="rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-8">
          <Loader2 className="animate-spin text-emerald-400" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-app)] px-6 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Postuler
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-[var(--text-app)]">
              {offer.title}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              chez {offer.company?.name || "l'entreprise"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-faint)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 space-y-4 overflow-y-auto p-6">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {!profile && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <div>
                Vous n'avez pas encore de profil professionnel.{" "}
                <a href="/profile" className="underline font-semibold">Créez-le d'abord</a>.
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
              <FileText size={11} /> Lettre de motivation
            </label>
            <textarea
              rows={5}
              value={form.cover_letter}
              onChange={(e) => setForm({ ...form, cover_letter: e.target.value })}
              placeholder="Expliquez pourquoi cette offre vous intéresse..."
              className="w-full rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2 text-sm text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus:border-emerald-500/50 focus:outline-none"
            />
          </div>

          {portfolio && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
              <p className="flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle size={14} />
                Votre portfolio sera joint automatiquement
              </p>
            </div>
          )}

          {profile?.cv_path && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
              <p className="flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle size={14} />
                Votre CV sera joint automatiquement
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-[var(--border-app)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !profile}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {saving ? "Envoi..." : "Envoyer ma candidature"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================
   MODAL : Commenter
============================================ */
function CommentModal({ offer, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setError(null);
    setSaving(true);
    try {
      await api.post(`/job-offers/${offer.id}/comment`, {
        content: content.trim(),
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'envoi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-app)] px-6 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Commenter
            </p>
            <h2 className="mt-0.5 text-base font-bold text-[var(--text-app)]">
              {offer.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-faint)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
              {error}
            </div>
          )}

          <textarea
            rows={4}
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Écrivez votre commentaire..."
            className="w-full rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2 text-sm text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus:border-emerald-500/50 focus:outline-none"
          />

          <div className="flex justify-end gap-2 border-t border-[var(--border-app)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !content.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {saving ? "Envoi..." : "Envoyer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}