import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import {
  Briefcase,
  MapPin,
  Home,
  Loader2,
  Clock,
  Search,
  Filter,
  X,
  Heart,
  MessageCircle,
  Send,
  CheckCircle,
  AlertCircle,
  FileText,
  ExternalLink,
  ArrowUpRight,
  Building2,
  SlidersHorizontal,
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

  const load = async (overrides = {}) => {
    setLoading(true);

    const currentSearch = overrides.search ?? search;
    const currentType = overrides.filterType ?? filterType;
    const currentRemote = overrides.filterRemote ?? filterRemote;

    try {
      const params = { per_page: 30 };

      if (currentType) params.offer_type = currentType;
      if (currentRemote) params.remote = 1;
      if (currentSearch.trim()) params.search = currentSearch.trim();

      const res = await api.get("/job-offers", { params });
      setOffers(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error(err);
      showToast("Erreur de chargement des offres.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterType, filterRemote]);

  const submitSearch = (e) => {
    e.preventDefault();
    load();
  };

  const clearSearch = () => {
    setSearch("");
    load({ search: "" });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 pb-8">
        {/* Page header */}
        <section className="relative overflow-hidden rounded-3xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                <Briefcase size={13} />
                Espace opportunités
              </span>

              <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--text-app)] sm:text-3xl">
                Actualité des offres
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-muted)]">
                Trouvez des stages, des alternances et des opportunités
                professionnelles adaptées à votre parcours.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-4 py-3">
              <Briefcase size={17} className="text-emerald-400" />
              <div>
                <p className="text-lg font-bold text-[var(--text-app)]">
                  {loading ? "…" : offers.length}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  offres affichées
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Search and filters */}
        <section className="rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-emerald-400" />
            <h2 className="text-sm font-bold text-[var(--text-app)]">
              Rechercher une opportunité
            </h2>
          </div>

          <form onSubmit={submitSearch} className="flex flex-col gap-3 lg:flex-row">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3.5 py-3 transition focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10">
              <Search size={17} className="shrink-0 text-[var(--text-faint)]" />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Poste, entreprise, compétence..."
                className="w-full bg-transparent text-sm text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus:outline-none"
              />

              {search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Effacer la recherche"
                  className="rounded-md p-1 text-[var(--text-faint)] transition hover:bg-rose-500/10 hover:text-rose-400"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              aria-label="Type d'offre"
              className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3.5 py-3 text-sm text-[var(--text-app)] focus:border-emerald-500/50 focus:outline-none"
            >
              <option value="">Tous les types</option>
              {Object.entries(OFFER_TYPES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3.5 py-3 text-sm text-[var(--text-app)] transition hover:border-emerald-500/30">
              <input
                type="checkbox"
                checked={filterRemote}
                onChange={(e) => setFilterRemote(e.target.checked)}
                className="h-4 w-4 accent-emerald-500"
              />
              <Home size={15} className="text-blue-400" />
              Télétravail
            </label>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-[#0B1F33] transition hover:bg-emerald-400"
            >
              <Search size={15} />
              Rechercher
            </button>
          </form>
        </section>

        {/* Offers */}
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)]">
            <Loader2 className="animate-spin text-emerald-400" size={32} />
            <p className="text-sm text-[var(--text-muted)]">
              Chargement des opportunités…
            </p>
          </div>
        ) : offers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-app)] bg-[var(--bg-surface)] px-6 py-14 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface-hover)] text-[var(--text-faint)]">
              <Briefcase size={25} />
            </span>

            <h2 className="mt-4 font-bold text-[var(--text-app)]">
              Aucune offre trouvée
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-muted)]">
              Essayez d'autres mots-clés ou modifiez les filtres pour
              découvrir de nouvelles opportunités.
            </p>

            <button
              onClick={() => {
                setSearch("");
                setFilterType("");
                setFilterRemote(false);
                load({
                  search: "",
                  filterType: "",
                  filterRemote: false,
                });
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-4 py-2.5 text-sm font-semibold text-[var(--text-app)] transition hover:border-emerald-500/40"
            >
              <X size={14} />
              Réinitialiser les filtres
            </button>
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

      {applyOffer && (
        <ApplyModal
          offer={applyOffer}
          onClose={() => setApplyOffer(null)}
          onSuccess={() => {
            setApplyOffer(null);
            showToast("Candidature envoyée avec succès.", "success");
          }}
        />
      )}

      {commentOffer && (
        <CommentModal
          offer={commentOffer}
          onClose={() => setCommentOffer(null)}
          onSuccess={() => {
            setCommentOffer(null);
            showToast("Commentaire envoyé avec succès.", "success");
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

  const [liked, setLiked] = useState(Boolean(offer.is_liked));
  const [likesCount, setLikesCount] = useState(offer.likes_count || 0);
  const [liking, setLiking] = useState(false);

  const timeAgo = (dateStr) => {
    if (!dateStr) return "Date inconnue";

    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "Date inconnue";

    const diff = Math.max(0, Date.now() - date.getTime());
    const mins = Math.floor(diff / 60000);

    if (mins < 1) return "À l'instant";
    if (mins < 60) return `Il y a ${mins} min`;

    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Il y a ${hours} h`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `Il y a ${days} j`;

    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleLike = async () => {
    if (liking) return;

    setLiking(true);

    try {
      const res = await api.post(`/job-offers/${offer.id}/like`);
      setLiked(Boolean(res.data.liked));
      setLikesCount(Number(res.data.likes_count || 0));
    } catch (err) {
      showToast(
        err.response?.data?.message || "Impossible de mettre à jour le J'aime.",
        "error"
      );
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/actualite#offer-${offer.id}`;

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Presse-papiers indisponible");
      }

      await navigator.clipboard.writeText(url);
      showToast("Lien copié dans le presse-papiers.", "success");

      api.post(`/job-offers/${offer.id}/share`).catch(() => {});
    } catch {
      showToast("Impossible de copier le lien.", "error");
    }
  };

  const company = offer.company;
  const isOwner = user?.id === company?.owner_user_id;

  return (
    <article
      id={`offer-${offer.id}`}
      className="group rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-5 transition duration-200 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-black/5 sm:p-6"
    >
      {/* Company header */}
      <div className="flex items-start gap-3">
        {company?.logo_path ? (
          <img
            src={`http://localhost:8001/storage/${company.logo_path}`}
            alt={company.name || "Logo de l'entreprise"}
            className="h-12 w-12 shrink-0 rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-hover)] object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-lg font-bold text-emerald-400">
            {company?.name?.charAt(0)?.toUpperCase() || (
              <Building2 size={19} />
            )}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[var(--text-app)]">
            {company?.name || "Entreprise"}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-faint)]">
            <span className="inline-flex items-center gap-1">
              <Clock size={12} />
              {timeAgo(offer.created_at)}
            </span>

            {offer.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} />
                {offer.city}
              </span>
            )}

            {offer.remote && (
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                <Home size={10} />
                Télétravail
              </span>
            )}
          </div>
        </div>

        <span className="hidden rounded-full border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-muted)] sm:inline-flex">
          TalentShare
        </span>
      </div>

      {/* Offer content */}
      <div className="mt-5">
        <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
          {OFFER_TYPES[offer.offer_type] || offer.offer_type || "Opportunité"}
        </span>

        <h2 className="mt-3 text-lg font-bold leading-snug text-[var(--text-app)] sm:text-xl">
          {offer.title}
        </h2>

        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--text-muted)]">
          {offer.description}
        </p>
      </div>

      {/* Likes */}
      {likesCount > 0 && (
        <div className="mt-4 flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
            <Heart size={12} fill="currentColor" />
          </span>
          {likesCount} {likesCount > 1 ? "personnes aiment" : "personne aime"}
        </div>
      )}

      {/* Social actions */}
      <div className="mt-5 grid grid-cols-3 gap-1 border-t border-[var(--border-app)] pt-3">
        <button
          type="button"
          onClick={handleLike}
          disabled={liking}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs font-semibold transition disabled:opacity-50 ${
            liked
              ? "bg-rose-500/10 text-rose-400"
              : "text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-rose-400"
          }`}
        >
          {liking ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Heart size={15} fill={liked ? "currentColor" : "none"} />
          )}
          J'aime
        </button>

        <button
          type="button"
          onClick={onComment}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs font-semibold text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-hover)] hover:text-emerald-400"
        >
          <MessageCircle size={15} />
          Commenter
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs font-semibold text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-hover)] hover:text-blue-400"
        >
          <Send size={15} />
          Partager
        </button>
      </div>

      {/* Apply */}
      {!isOwner && (
        <button
          type="button"
          onClick={onApply}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-[#0B1F33] transition hover:bg-emerald-400"
        >
          Postuler à cette offre
          <ArrowUpRight size={16} />
        </button>
      )}
    </article>
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
    let active = true;

    Promise.all([
      api.get("/profile/me").then((r) => r.data).catch(() => null),
      api.get("/portfolio/my").then((r) => r.data).catch(() => null),
    ]).then(([p, pf]) => {
      if (!active) return;

      setProfile(p);
      setPortfolio(pf);

      setForm((prev) => ({
        ...prev,
        portfolio_id: pf?.id || "",
        cv_path: p?.cv_path || "",
      }));

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await api.post("/applications", {
        job_offer_id: offer.id,
        cover_letter: form.cover_letter.trim() || null,
        portfolio_id: form.portfolio_id || null,
        cv_path: form.cv_path || null,
      });

      onSuccess();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Erreur lors de l'envoi de votre candidature."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ModalBackdrop onClose={onClose}>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-8">
          <Loader2 className="animate-spin text-emerald-400" size={30} />
          <p className="text-sm text-[var(--text-muted)]">
            Préparation du formulaire…
          </p>
        </div>
      </ModalBackdrop>
    );
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-app)] p-5 sm:p-6">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              Candidature
            </span>
            <h2 className="mt-1 text-lg font-bold text-[var(--text-app)]">
              {offer.title}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {offer.company?.name || "Entreprise"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-2 text-[var(--text-faint)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-400">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {!profile && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-400">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <div>
                <p>Vous n'avez pas encore de profil professionnel.</p>
                <Link to="/profile" className="mt-1 inline-block font-semibold underline">
                  Créer mon profil
                </Link>
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs font-semibold text-[var(--text-app)]">
              Lettre de motivation
              <span className="ml-1 font-normal text-[var(--text-faint)]">
                (facultatif)
              </span>
            </label>

            <textarea
              rows={5}
              value={form.cover_letter}
              onChange={(e) =>
                setForm({ ...form, cover_letter: e.target.value })
              }
              placeholder="Présentez votre motivation et expliquez pourquoi cette opportunité vous intéresse..."
              className="w-full resize-y rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-4 py-3 text-sm leading-6 text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>

          {portfolio && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
              <CheckCircle size={18} className="shrink-0 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-emerald-400">
                  Portfolio joint
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  {portfolio.title || "Votre portfolio sera associé à la candidature."}
                </p>
              </div>
            </div>
          )}

          {profile?.cv_path && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
              <FileText size={18} className="shrink-0 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-emerald-400">
                  CV disponible
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  Votre CV sera joint à votre candidature.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-[var(--border-app)] pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[var(--border-app)] px-4 py-2.5 text-sm font-semibold text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-hover)]"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={saving || !profile}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0B1F33] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
              {saving ? "Envoi en cours…" : "Envoyer ma candidature"}
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}

/* ============================================
   MODAL : Commenter
============================================ */

function CommentModal({ offer, onClose, onSuccess }) {
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
      setError(
        err.response?.data?.message ||
          "Erreur lors de l'envoi du commentaire."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-app)] p-5 sm:p-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              Communauté
            </span>
            <h2 className="mt-1 text-lg font-bold text-[var(--text-app)]">
              Commenter l'offre
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {offer.title}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-2 text-[var(--text-faint)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5 sm:p-6">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-400">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <textarea
            rows={4}
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Écrivez votre commentaire..."
            className="w-full resize-y rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-4 py-3 text-sm leading-6 text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
          />

          <div className="flex flex-col-reverse gap-2 border-t border-[var(--border-app)] pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[var(--border-app)] px-4 py-2.5 text-sm font-semibold text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-hover)]"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={saving || !content.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0B1F33] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
              {saving ? "Envoi en cours…" : "Envoyer le commentaire"}
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}

/* ============================================
   MODAL BACKDROP
============================================ */

function ModalBackdrop({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex w-full items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}