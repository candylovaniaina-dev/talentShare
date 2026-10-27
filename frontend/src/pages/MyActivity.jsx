import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import {
  Handshake, Briefcase, X, ArrowUpRight, Send, CheckCircle,
  Target, Search, MoreHorizontal, ThumbsUp, MessageSquare, Share2, MapPin,
  ChevronLeft, ChevronRight, Heart, Loader2, Rocket, Banknote,
  UserRound, Home, Maximize2, Bookmark, Mail, Globe, CalendarDays, Pencil,
  Trash2, Flag, AlertCircle, Plus, Sparkles, Wallet, History,LayoutGrid ,User ,Building2,FileText , Building, BriefcaseBusiness,
  Shuffle, RotateCcw
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import { EmptyState } from "../components/ui/Card";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import JobOfferDetail from "./JobOfferDetail";
import ApplyToRequestModal from "../components/requests/ApplyToRequestModal";

/* ============================================================
   CONFIG & HELPERS
============================================================ */
const getMissionTitle = (mission) => {
  if (mission.resource_offer?.title) return mission.resource_offer.title;
  if (mission.resource_request?.title) return mission.resource_request.title;
  if (mission.proposal?.resource_request?.title) return mission.proposal.resource_request.title;
  
  const talent = mission.profile?.user?.name || "Talent";
  const company = mission.requesting_company?.name || mission.requestingCompany?.name || "Entreprise";
  return `Mission de ${talent} chez ${company}`;
};

const TABS = [
  { id: "home", label: "Accueil", icon: LayoutGrid },
  { id: "profile", label: "Mon Profil", icon: User },
  { id: "companies", label: "Réseau", icon: Building2 },
];

const OFFER_TYPES = {
  internship: "Stage",
  apprenticeship: "Alternance",
  junior_mission: "Mission junior",
  first_job: "Emploi",
};

const BASE_URL = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
const fileUrl = (p) => (!p ? null : /^https?:/.test(p) ? p : `${BASE_URL}/storage/${p}`);

const asArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";

const formatShortDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) : "";

function getMatchLevel(score) {
  if (score >= 80) return { color: "#10B981", sublabel: "Forte correspondance" };
  if (score >= 60) return { color: "#FACC15", sublabel: "Bonne correspondance" };
  if (score >= 40) return { color: "#F59E0B", sublabel: "Correspondance partielle" };
  return { color: "#94A3B8", sublabel: "Correspondance faible" };
}

function getAuthor(post) {
  const isTalent = post.author_type === "talent";
  const prof = post.author?.professional_profile;
  return {
    isTalent,
    name: isTalent
      ? post.author?.name || "Talent"
      : post.company?.name || post.author?.name || "Entreprise",
    logo: fileUrl(isTalent ? prof?.avatar_path || post.author?.avatar_path : post.company?.logo_path),
    subtitle: isTalent ? prof?.headline : [post.company?.city, post.company?.country].filter(Boolean).join(", "),
  };
}

function buildUpdatePayload(post, changes) {
  const d = (v) => (v ? String(v).slice(0, 10) : undefined);
  const base = {
    title: post.title,
    description: post.description,
    company_id: post.company_id,
    start_at: d(post.start_at),
    end_at: d(post.end_at),
    workload_percent: post.workload_percent,
    remote: !!post.remote,
    country: post.country,
    city: post.city,
    status: post.status,
    budget_min: post.budget_min,
    budget_max: post.budget_max,
    positions_count: post.positions_count,
    urgency: post.urgency,
    contract_type: post.contract_type,
    ...changes,
  };
  return Object.fromEntries(Object.entries(base).filter(([, v]) => v !== null && v !== undefined && v !== ""));
}

function prettyUrl(url) {
  if (!url) return "";
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname === "/" ? "" : u.pathname}`;
  } catch {
    return url;
  }
}

// ✅ HELPERS POUR LES CARTES ANIMÉES
const sectorOf = (company) => company.sector || company.industry || "";
const hash = (value) => [...String(value || "")].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);
const GRADIENTS = [
  "from-emerald-500 to-teal-700",
  "from-teal-500 to-cyan-700",
  "from-sky-500 to-indigo-700",
  "from-violet-500 to-indigo-700",
  "from-emerald-400 to-sky-600",
  "from-amber-500 to-rose-600",
];
const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;


/* ============================================================
   PAGE PRINCIPALE
============================================================ */
export default function MyActivity() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingTarget, setPendingTarget] = useState(null);
  const handledNonce = useRef(null);
  const retriedRef = useRef(false);

  const initialTab = TABS.some((t) => t.id === searchParams.get("tab")) ? searchParams.get("tab") : "home";
  const [tab, setTab] = useState(initialTab);
  const [activityFilter, setActivityFilter] = useState("all");

  const [postContent, setPostContent] = useState("");
  const [postType, setPostType] = useState("Mission");
  const [isPublishing, setIsPublishing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [missions, setMissions] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [feed, setFeed] = useState([]);
  const [stories, setStories] = useState([]);
  const [feedPage, setFeedPage] = useState(1);
  const [feedLastPage, setFeedLastPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [feedSearch, setFeedSearch] = useState("");

  const [hiddenIds, setHiddenIds] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [historyModalType, setHistoryModalType] = useState(null);

  const [favorites, setFavorites] = useState(() => {
    if (!user?.id) return [];
    try { return JSON.parse(localStorage.getItem(`talentshare_favorites_${user.id}`)) || []; } catch { return []; }
  });
  const [savedOffers, setSavedOffers] = useState(() => {
    if (!user?.id) return [];
    try { return JSON.parse(localStorage.getItem(`talentshare_saved_offers_${user.id}`)) || []; } catch { return []; }
  });

  const [fullscreenStory, setFullscreenStory] = useState(null);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [showSavedOffersModal, setShowSavedOffersModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedOfferId, setSelectedOfferId] = useState(null);

  const [applyModalRequest, setApplyModalRequest] = useState(null);

  const [myCompanies, setMyCompanies] = useState([]);

  const avatarUrl = fileUrl(user?.avatar_path || user?.professional_profile?.avatar_path);
  const role = user?.role?.toLowerCase();
  const isCompany = role === "company" || role === "entreprise";
  const isStudent = role === "student" || role === "employee";

  useEffect(() => {
    setSearchParams({ tab }, { replace: true, state: location.state });
  }, [tab, setSearchParams]);

  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (TABS.some((t) => t.id === urlTab) && urlTab !== tab) setTab(urlTab);
  }, [searchParams]);

  useEffect(() => {
    if (user?.id) localStorage.setItem(`talentshare_favorites_${user.id}`, JSON.stringify(favorites));
  }, [favorites, user?.id]);

  useEffect(() => {
    if (user?.id) localStorage.setItem(`talentshare_saved_offers_${user.id}`, JSON.stringify(savedOffers));
  }, [savedOffers, user?.id]);

  const loadData = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [recRes, sentRes, misRes, myRes, compRes, feedRes, matchRes, jobOffersRes] = await Promise.all([
        api.get("/proposals/received").catch(() => ({ data: [] })),
        api.get("/proposals/sent").catch(() => ({ data: [] })),
        api.get("/missions").catch(() => ({ data: [] })),
        api.get("/resource-requests?my=1").catch(() => ({ data: [] })),
        api.get("/companies").catch(() => ({ data: [] })),
        api.get("/resource-requests?per_page=15").catch(() => null),
        isStudent ? api.get("/resource-requests/matching-for-me").catch(() => ({ data: [] })) : Promise.resolve(null),
        api.get("/job-offers").catch(() => ({ data: [] })),
      ]);

      if (!feedRes) setError("Impossible de charger le fil d'actualité.");

      const feedList = feedRes ? asArray(feedRes.data).map(req => ({
        ...req,
        id: `req-${req.id}`,
        real_id: req.id,
      })) : [];

      const jobOffersList = asArray(jobOffersRes.data).map(job => ({
        ...job,
        id: `job-${job.id}`,
        real_id: job.id,
        is_job_offer: true,
      }));

      const combinedFeed = [...feedList, ...jobOffersList].sort((a, b) => {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });

      const likedMap = new Map(combinedFeed.map((r) => [r.id, r.is_liked]));

      setReceived(asArray(recRes.data));
      setSent(asArray(sentRes.data));
      setMissions(asArray(misRes.data));
      setCompanies(asArray(compRes.data));
      setMyRequests(asArray(myRes.data).map((r) => ({ ...r, is_liked: r.is_liked ?? likedMap.get(`req-${r.id}`) ?? false })));

      setFeed(combinedFeed);
      setFeedPage(feedRes?.data?.current_page || 1);
      setFeedLastPage(feedRes?.data?.last_page || 1);

      if (isStudent) {
        setStories(asArray(matchRes?.data).filter((r) => r.author_type !== "talent"));
      } else {
        setStories(combinedFeed.filter((r) => r.created_by !== user.id));
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, isStudent]);

  useEffect(() => {
    loadData();
    const onFocus = () => loadData(true);
    window.addEventListener("focus", onFocus);

    if (user) {
      api.get("/profile/my-companies")
        .then((res) => setMyCompanies(asArray(res.data)))
        .catch(() => setMyCompanies([]));
    }

    return () => window.removeEventListener("focus", onFocus);
  }, [loadData, user]);

  // ✅ NOUVEAU : Ouvrir la modale de proposition SEULEMENT si on vient d'une notification
  useEffect(() => {
    const applyId = searchParams.get("apply");
    
    // On s'assure que le feed est chargé et que l'ID est présent
    if (applyId && feed.length > 0 && !loading) {
      // On cherche la demande spécifique dans le feed
      const requestToApply = feed.find((p) => String(p.real_id) === String(applyId));
      
      if (requestToApply) {
        setApplyModalRequest(requestToApply);
        // On nettoie l'URL instantanément pour ne pas que la modale se rouvre au prochain clic
        setSearchParams({ tab: "home" }, { replace: true });
      }
    }
  }, [searchParams, feed, loading, setSearchParams]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await api.get(`/resource-requests?per_page=15&page=${feedPage + 1}`);
      const list = asArray(res.data).map(req => ({
        ...req,
        id: `req-${req.id}`,
        real_id: req.id,
      }));
      setFeed((prev) => [...prev, ...list.filter((n) => !prev.some((p) => p.id === n.id))]);
      setFeedPage(res.data?.current_page || feedPage + 1);
      setFeedLastPage(res.data?.last_page || feedPage + 1);
    } catch {
      showToast("Impossible de charger plus de publications", "error");
    } finally {
      setLoadingMore(false);
    }
  };

  const patchPost = (id, patch) => {
    const upd = (list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r));
    setFeed(upd);
    setStories(upd);
    setMyRequests((prev) => prev.map(r => `req-${r.id}` === id ? { ...r, ...patch } : r));
  };

  const removePost = (id) => {
    const rm = (list) => list.filter((r) => r.id !== id);
    setFeed(rm);
    setStories(rm);
    setMyRequests((prev) => prev.filter(r => `req-${r.id}` !== id));
  };

  const handlePublish = async (data) => {
    setIsPublishing(true);
    try {
      await api.post("/resource-requests", data);
      showToast("Publication réussie !", "success");
      setShowCreateModal(false);
      loadData(true);
    } catch (err) {
      const errors = err.response?.data?.errors;
      const msg = errors
        ? Object.values(errors).flat().join(" · ")
        : err.response?.data?.message || "Erreur lors de la publication";
      showToast(msg, "error");
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleFavorite = (id) => setFavorites((p) => (p.includes(id) ? p.filter((f) => f !== id) : [...p, id]));
  const toggleSavedOffer = (id) => setSavedOffers((p) => (p.includes(id) ? p.filter((f) => f !== id) : [...p, id]));

  const handleLike = async (id, realId, isJobOffer) => {
    try {
      const currentPost = feed.find(p => p.id === id);
      if (currentPost) {
        const newLikedState = !currentPost.is_liked;
        const newCount = newLikedState
          ? (currentPost.likes_count || 0) + 1
          : Math.max(0, (currentPost.likes_count || 0) - 1);
        patchPost(id, { is_liked: newLikedState, likes_count: newCount });
      }

      const url = isJobOffer
        ? `/job-offers/${realId}/like`
        : `/resource-requests/${realId}/like`;

      const res = await api.post(url);

      patchPost(id, {
        is_liked: res.data.liked,
        likes_count: res.data.likes_count
      });

    } catch (error) {
      console.error("Erreur like:", error);
      showToast("Impossible d'enregistrer votre J'aime", "error");
      const currentPost = feed.find(p => p.id === id);
      if (currentPost) {
        patchPost(id, { is_liked: !currentPost.is_liked, likes_count: currentPost.likes_count });
      }
    }
  };

  const handleShare = async (post) => {
    try {
      const url = `${window.location.origin}/resource-requests/${post.real_id || post.id}`;
      try { await navigator.clipboard.writeText(url); showToast("Lien copié dans le presse-papiers", "success"); }
      catch { showToast("Publication partagée", "success"); }
      const res = await api.post(`/resource-requests/${post.real_id || post.id}/share`);
      patchPost(post.id, { shares_count: res.data.shares_count });
    } catch {
      showToast("Impossible de partager", "error");
    }
  };

  const handleDelete = async (post) => {
    try {
      await api.delete(`/resource-requests/${post.real_id || post.id}`);
      removePost(post.id);
      showToast("Publication supprimée", "success");
    } catch (err) {
      if (err.response?.status === 403) {
        showToast("Vous n'êtes pas autorisé à supprimer cette publication.", "error");
      } else if (err.response?.status === 404) {
        showToast("Cette publication n'existe plus.", "error");
        removePost(post.id);
      } else {
        showToast(err.response?.data?.message || "Suppression impossible", "error");
      }
    }
  };

  const handleEdit = async (post, changes) => {
    try {
      await api.patch(`/resource-requests/${post.real_id || post.id}`, buildUpdatePayload(post, changes));
      patchPost(post.id, changes);
      setEditingPost(null);
      showToast("Publication modifiée", "success");
    } catch (err) {
      const errors = err.response?.data?.errors;
      showToast(errors ? Object.values(errors).flat().join(" · ") : err.response?.data?.message || "Modification impossible", "error");
    }
  };

  const handleReport = (post) => {
    setHiddenIds((p) => [...p, post.id]);
    showToast("Publication masquée. Merci pour votre signalement.", "success");
  };

  const isMine = (post) =>
    post.created_by === user?.id ||
    (post.company_id && (user?.companies || []).some((c) => c.id === post.company_id));

  const visibleFeed = useMemo(() => {
    const q = feedSearch.trim().toLowerCase();
    return feed
      .filter((p) => !hiddenIds.includes(p.id))
      .filter((p) => !isMine(p))
      .filter((p) => {
        if (!q) return true;
        return (
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          getAuthor(p).name.toLowerCase().includes(q) ||
          (p.skills || []).some((s) => (s.name || s).toLowerCase().includes(q))
        );
      });
  }, [feed, hiddenIds, feedSearch]);

  const visibleMine = useMemo(() => myRequests.filter((p) => !hiddenIds.includes(`req-${p.id}`)), [myRequests, hiddenIds]);
  const visibleStories = useMemo(() => stories.filter((p) => !hiddenIds.includes(p.id)), [stories, hiddenIds]);

  useEffect(() => {
    const hashId = location.hash?.startsWith("#request-") ? location.hash.replace("#request-", "") : null;
    const target = location.state?.scrollToRequestId ?? hashId;
    const nonce = location.state?.nonce ?? location.hash ?? null;
    if (!target || handledNonce.current === nonce) return;

    handledNonce.current = nonce;
    retriedRef.current = false;
    setTab("profile");
    setPendingTarget(String(target));
  }, [location.state, location.hash]);

  useEffect(() => {
    if (!pendingTarget || tab !== "profile" || loading) return;

    const exists = visibleMine.some((p) => String(p.id) === pendingTarget);

    if (!exists) {
      if (!retriedRef.current) {
        retriedRef.current = true;
        loadData(true);
        return;
      }
      setPendingTarget(null);
      navigate(`/resource-requests/${pendingTarget}`);
      return;
    }

    const frame = requestAnimationFrame(() => {
      const el = document.getElementById(`request-${pendingTarget}`);
      if (!el) return;
      const highlight = ["ring-4", "ring-[#16B8B1]", "rounded-[24px]", "transition-all"];
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add(...highlight);
      setTimeout(() => el.classList.remove(...highlight), 3500);
      setPendingTarget(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [pendingTarget, tab, loading, visibleMine]);

  const activityItems = useMemo(() => {
    const receivedRows = isCompany ? received.map((p) => ({
      id: `received-${p.id}`,
      kind: "proposals",
      label: "Proposition reçue",
      title: p.title || p.resource_request?.title || p.job_offer?.title || "Proposition reçue",
      counterpart: p.professional_profile?.user?.name || p.professional?.name || p.user?.name || p.from?.name || "Talent",
      status: p.status === "sent" ? "À traiter" : (p.status_label || p.status || "En attente"), 
      date: p.created_at || p.updated_at,
    })) : [];

    const sentRows = sent.map((p) => ({
      id: `sent-${p.id}`,
      kind: "proposals",
      label: "Proposition envoyée",
      title: p.title || p.resource_request?.title || p.job_offer?.title || "Proposition envoyée",
      counterpart: p.company?.name || p.resource_request?.company?.name || p.professional_profile?.user?.name || p.to?.name || "Destinataire",
      status: "Envoyée", 
      date: p.created_at || p.updated_at,
    }));

    const missionRows = missions.map((m) => ({
      id: `mission-${m.id}`,
      kind: "missions",
      label: "Mission",
      title: getMissionTitle(m), 
      counterpart: m.company?.name || m.professional?.name || [m.city, m.country].filter(Boolean).join(", "),
      status: m.status_label || m.status || "Statut non renseigné",
      date: m.updated_at || m.created_at,
    }));

    const requestRows = visibleMine.map((r) => ({
      id: `request-${r.id}`,
      kind: "requests",
      label: "Besoin publié",
      title: r.title || "Demande de ressource",
      counterpart: r.company?.name || r.author?.name || [r.city, r.country].filter(Boolean).join(", "),
      status: r.status_label || r.status || "Statut non renseigné",
      date: r.updated_at || r.created_at,
    }));

    return [...receivedRows, ...sentRows, ...missionRows, ...requestRows].sort((a, b) => {
      const aDate = new Date(a.date || 0).getTime();
      const bDate = new Date(b.date || 0).getTime();
      return (Number.isFinite(bDate) ? bDate : 0) - (Number.isFinite(aDate) ? aDate : 0);
    });
  }, [received, sent, missions, visibleMine, isCompany]);

  const favoritesPool = useMemo(() => {
    const map = new Map();
    [...stories, ...feed, ...myRequests].forEach((r) => { if (!map.has(r.id)) map.set(r.id, r); });
    return [...map.values()];
  }, [stories, feed, myRequests]);

  const activeMissions = missions.filter((m) => m.status === "active").length;

  const appliedRequestIds = useMemo(() => {
    return new Set(
      sent.map((p) => p.resource_request_id ?? p.resourceRequest?.id ?? p.resource_request?.id ?? p.request_id ?? p.subject_id)
          .filter(Boolean)
          .map((id) => String(id))
    );
  }, [sent]);

  const appliedJobOfferIds = useMemo(() => {
    return new Set(
      sent.map((p) => p.job_offer_id ?? p.jobOffer?.id ?? p.job_offer?.id ?? p.offer_id ?? p.subject_id)
          .filter(Boolean)
          .map((id) => String(id))
    );
  }, [sent]);

  const cardProps = {
    onLike: handleLike,
    onShare: handleShare,
    onDelete: handleDelete,
    onEdit: setEditingPost,
    onReport: handleReport,
    onPatch: patchPost,
    showToast,
    sentProposals: sent,
    onOpenOffer: (id) => setSelectedOfferId(id),
    onApply: (req) => setApplyModalRequest(req),
  };

  return (
    <AppShell>
     <div className="min-h-full bg-transparent px-3 py-4 sm:px-5 lg:px-7">
        <div className="mx-auto max-w-[1440px] space-y-4">
        
          {loading ? (
            <div className="flex min-h-[50vh] items-center justify-center">
              <Loader2 className="animate-spin text-[#16B8B1]" size={32} />
            </div>
          ) : (
            <>
              {tab === "home" && (
                <div className="mx-auto max-w-4xl space-y-5 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-extrabold tracking-tight text-[#0B253B] dark:text-white">Fil d'actualité</h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Découvrez les besoins et les profils du réseau.</p>
                    </div>
                    <label className="relative block w-full sm:w-80">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        type="text"
                        value={feedSearch}
                        onChange={(e) => setFeedSearch(e.target.value)}
                        placeholder="Rechercher une publication..."
                        className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-[#16B8A6] focus:ring-4 focus:ring-[#16B8A6]/10 dark:border-white/10 dark:bg-[#0B1F33] dark:text-white dark:placeholder:text-slate-500"
                      />
                    </label>
                  </div>

                  {error && (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                      <span className="flex items-center gap-2"><AlertCircle size={16} /> {error}</span>
                      <button onClick={() => loadData()} className="rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700">Réessayer</button>
                    </div>
                  )}

                  {!error && visibleFeed.length === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-8 text-center dark:border-white/10 dark:bg-[#112A3A]">
                      <EmptyState emoji="📰" text={feedSearch ? "Aucune publication ne correspond à votre recherche." : "Aucune publication pour le moment."} />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {visibleFeed.map((post) => (
                        <PostCard key={post.id} post={post} mine={isMine(post)} avatarUrl={avatarUrl} {...cardProps} />
                      ))}
                    </div>
                  )}

                  {feedPage < feedLastPage && !feedSearch && (
                    <button onClick={loadMore} disabled={loadingMore} className="mx-auto flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-[#0B253B] shadow-sm transition hover:border-[#B8F0E8] hover:bg-[#F8FCFA] disabled:opacity-60 dark:border-white/10 dark:bg-[#112A3A] dark:text-white dark:hover:bg-white/5">
                      {loadingMore && <Loader2 size={14} className="animate-spin" />} Voir plus de publications
                    </button>
                  )}
                </div>
              )}

              {tab === "profile" && (
                <div className="mx-auto max-w-4xl space-y-5">
                  <div className="space-y-4">
                  <section className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 dark:border-white/10 dark:bg-[#112A3A]">
  <div className="flex flex-col sm:flex-row items-center gap-4">
    <Avatar src={avatarUrl} name={user?.name} size={44} />
    
    <button
      onClick={() => setShowCreateModal(true)}
      className="flex h-11 flex-1 w-full items-center gap-3 rounded-full bg-[#F0F2F5] px-4 text-left text-[15px] text-slate-500 transition hover:bg-[#E4E6EB] dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10"
    >
      <span className="font-medium">Publier un besoin spécifique...</span>
    </button>
  </div>
</section>

                    <section className="relative rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#112A3A]">
                      <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-extrabold text-[#0B253B] dark:text-white">Dernières demandes</h2>
                        <span className="text-[10px] font-bold text-[#0F9691] uppercase tracking-wider dark:text-emerald-400">Nouveau</span>
                      </div>

                      <div className="relative">
                        <div id="stories-container" className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth px-1">
                         {visibleStories.slice(0, 10).map((story) => {
  const author = getAuthor(story);
  const realId = String(story.real_id || story.id).replace(/^(req|job)-/, "");
  const alreadyApplied = story.is_job_offer
    ? appliedJobOfferIds.has(realId)
    : appliedRequestIds.has(realId);

  return (
    <button
      key={story.id}
      onClick={() => {
        if (alreadyApplied) return;
        setFullscreenStory({ index: 0, allRequests: visibleStories });
      }}
      disabled={alreadyApplied}
      className={`group relative flex h-[220px] w-[150px] shrink-0 flex-col justify-between overflow-hidden rounded-[20px] p-3 text-left shadow-sm transition ${
        alreadyApplied
          ? "cursor-default bg-gradient-to-b from-emerald-500 to-[#064E4B] opacity-90"
          : "bg-gradient-to-b from-[#0F9691] to-[#064E4B] hover:opacity-90"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#1877F2] bg-white p-0.5">
          <Avatar src={author.logo} name={author.name} size={26} className="h-full w-full" />
        </div>
        <p className="truncate text-[11px] font-bold text-white shadow-sm">{author.name}</p>
      </div>

      <div className="mt-3 flex-1">
        <h3 className="line-clamp-4 text-[13px] font-extrabold leading-tight text-white drop-shadow-sm">
          {story.title || "Demande sans titre"}
        </h3>
      </div>

      <div className="mt-2 flex items-center justify-between gap-1">
        {(story.budget_min || story.budget_max) && !alreadyApplied && (
          <span className="inline-flex items-center gap-1 rounded bg-black/30 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
            <Banknote size={10} /> {story.budget_min || 0} - {story.budget_max || 0} €
          </span>
        )}
        {alreadyApplied && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-extrabold text-emerald-700">
            <CheckCircle size={10} /> Postulé
          </span>
        )}
      </div>
    </button>
  );
})}
                        </div>

                        <div className="pointer-events-none absolute bottom-0 left-0 top-0 flex w-12 items-center justify-start bg-gradient-to-r from-white via-white/80 to-transparent pl-1 dark:from-[#112A3A] dark:via-[#112A3A]/80">
                          <button
                            onClick={() => {
                              const container = document.getElementById('stories-container');
                              if (container) container.scrollBy({ left: -320, behavior: 'smooth' });
                            }}
                            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-600 shadow-md transition hover:bg-slate-50 hover:text-[#0F9691] dark:bg-[#0B1F33] dark:text-slate-300 dark:hover:bg-white/10"
                          >
                            <ChevronLeft size={18} />
                          </button>
                        </div>

                        <div className="pointer-events-none absolute bottom-0 right-0 top-0 flex w-12 items-center justify-end bg-gradient-to-l from-white via-white/80 to-transparent pr-1 dark:from-[#112A3A] dark:via-[#112A3A]/80">
                          <button
                            onClick={() => {
                              const container = document.getElementById('stories-container');
                              if (container) container.scrollBy({ left: 320, behavior: 'smooth' });
                            }}
                            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-600 shadow-md transition hover:bg-slate-50 hover:text-[#0F9691] dark:bg-[#0B1F33] dark:text-slate-300 dark:hover:bg-white/10"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </div>
                    </section>

                    {myCompanies.length > 0 && (
                      <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#112A3A]">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <h2 className="text-base font-extrabold text-[#0B253B] dark:text-white">Mes entreprises</h2>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Vous faites partie de l'équipe</p>
                          </div>
                          {myCompanies[0].industry && (
                            <span className="rounded-full bg-[#E6FAF6] px-3 py-1 text-[10px] font-extrabold text-[#087F73] dark:bg-emerald-500/10 dark:text-emerald-400">
                              {myCompanies[0].industry}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                          {myCompanies.map((company) => (
                            <button
                              type="button"
                              key={company.id}
                              onClick={() => setSelectedCompany(company)}
                              className="group flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#16B8B1]/50 hover:shadow-lg dark:border-white/10 dark:bg-[#0B1F33] dark:hover:border-emerald-500/40 dark:hover:shadow-none"
                            >
                              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 p-2 dark:border-white/5 dark:bg-white/5">
                                <Avatar
                                  src={fileUrl(company.logo_path)}
                                  name={company.name}
                                  size={64}
                                  rounded="rounded-xl"
                                  fit="contain"
                                  className="h-full w-full transition duration-300 group-hover:scale-105"
                                />
                              </div>
                              <span className="line-clamp-2 text-center text-xs font-bold text-slate-800 transition-colors group-hover:text-[#087F83] dark:text-slate-200 dark:group-hover:text-emerald-400">
                                {company.name}
                              </span>
                              {company.city && (
                                <span className="mt-1 text-center text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                  {company.city}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </section>
                    )}

                    <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#112A3A]">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/10">
                        <div>
                          <h2 className="text-base font-extrabold text-[#0B253B] dark:text-white">Mes publications</h2>
                        </div>
                        <span className="rounded-full bg-[#E6FAF6] px-3 py-1 text-[10px] font-extrabold text-[#087F73] dark:bg-emerald-500/10 dark:text-emerald-400">{visibleMine.length} publication(s)</span>
                      </div>
                      <div className="p-4 sm:p-5">
                        {visibleMine.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-[#FAFCFD] p-7 text-center dark:border-white/10 dark:bg-white/5">
                            <EmptyState emoji="📝" text="Vous n'avez pas encore publié de besoin." />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {visibleMine.map((post) => (
                              <div key={`req-${post.id}`} id={`request-${post.id}`}>
                                <PostCard post={{ ...post, id: `req-${post.id}`, real_id: post.id }} mine avatarUrl={avatarUrl} {...cardProps} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </section>

                    <ActivityOverview items={activityItems} filter={activityFilter} onFilter={setActivityFilter} />
                  </div>
                </div>
              )}

              {tab === "companies" && (
                <div className="mx-auto max-w-6xl">
                  <CompaniesTab companies={companies} onSelect={(company) => setSelectedCompany(company)} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateRequestModal
          onClose={() => setShowCreateModal(false)}
          onPublish={handlePublish}
          user={user}
          isCompany={isCompany}
          publishing={isPublishing}
        />
      )}
      {fullscreenStory && (
        <FullScreenStory initialIndex={fullscreenStory.index} allRequests={fullscreenStory.allRequests} onClose={() => setFullscreenStory(null)} favorites={favorites} onToggleFavorite={toggleFavorite} />
      )}
      {showFavoritesModal && (
        <FavoritesModal allRequests={favoritesPool} favorites={favorites} onClose={() => setShowFavoritesModal(false)} onToggleFavorite={toggleFavorite} />
      )}
      {showSavedOffersModal && (
        <SavedOffersModal savedOffers={savedOffers} onClose={() => setShowSavedOffersModal(false)} onToggleSavedOffer={toggleSavedOffer} onSelectOffer={(id) => { setShowSavedOffersModal(false); setSelectedOfferId(id); }} />
      )}
      
      {selectedCompany && (
        <CompanyModal 
          company={selectedCompany} 
          onClose={() => setSelectedCompany(null)} 
          onSelectOffer={(offerId) => { setSelectedCompany(null); setSelectedOfferId(offerId); }} 
          savedOffers={savedOffers} 
          onToggleSavedOffer={toggleSavedOffer} 
        />
      )}
      
      {editingPost && <EditPostModal post={editingPost} onClose={() => setEditingPost(null)} onSubmit={handleEdit} />}
      
      {selectedOfferId && <JobOfferDetail offerId={selectedOfferId} onClose={() => setSelectedOfferId(null)} />}
      
      {historyModalType && (
        <HistoryModal 
          type={historyModalType} 
          sent={sent} 
          received={received} 
          missions={missions} 
          onClose={() => setHistoryModalType(null)} 
        />
      )}

      {applyModalRequest && (
        <ApplyToRequestModal
          request={applyModalRequest}
          onClose={() => setApplyModalRequest(null)}
          onSuccess={() => {
            setApplyModalRequest(null);
            showToast("Votre proposition a été envoyée avec succès !", "success");
            loadData(true);
          }}
        />
      )}
    </AppShell>
  );
}

/* ============================================================ */
/* COMPOSANT COMPANIES TAB */
/* ============================================================ */
function CompaniesTab({ companies = [], onSelect }) {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("all");
  const [onlyVerified, setOnlyVerified] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const onKey = (event) => {
      const tag = event.target?.tagName;
      if (event.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const sectors = useMemo(() => {
    const counts = new Map();
    companies.forEach((company) => {
      const name = sectorOf(company);
      if (name) counts.set(name, (counts.get(name) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], "fr"));
  }, [companies]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return companies.filter((company) => {
      if (onlyVerified && !company.is_verified) return false;
      if (sector !== "all" && sectorOf(company) !== sector) return false;
      if (!query) return true;
      return [company.name, sectorOf(company), company.city, company.country, company.description].some((value) =>
        value?.toLowerCase().includes(query)
      );
    });
  }, [companies, search, sector, onlyVerified]);

  const hasFilters = Boolean(search.trim()) || sector !== "all" || onlyVerified;

  const reset = () => {
    setSearch("");
    setSector("all");
    setOnlyVerified(false);
  };

  const pickRandom = () => {
    const pool = filtered.length ? filtered : companies;
    if (!pool.length) return;
    onSelect?.(pool[Math.floor(Math.random() * pool.length)]);
  };

  const chip = (active) =>
    `shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition duration-200 active:scale-95 ${
      active
        ? "border-[#0B253B] bg-[#0B253B] text-white shadow-sm dark:border-emerald-500 dark:bg-emerald-500"
        : "border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-emerald-500/40 dark:hover:text-emerald-400"
    }`;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <style>{`
        @keyframes ts-co-rise {
          from { opacity: 0; transform: translateY(22px) scale(.97); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes ts-co-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes ts-co-shine {
          from { transform: translateX(-120%) skewX(-18deg); }
          to   { transform: translateX(260%) skewX(-18deg); }
        }
        .ts-co-rise  { animation: ts-co-rise .6s cubic-bezier(.2,.7,.2,1) backwards; }
        .ts-co-float { animation: ts-co-float 3.2s ease-in-out infinite; }
        .ts-co-shine { animation: ts-co-shine 1.1s ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .ts-co-rise, .ts-co-float, .ts-co-shine { animation: none !important; }
        }
      `}</style>

      <section className="rounded-2xl border border-slate-200/80 bg-white/80 p-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#112A3A]/80 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="group relative block flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-emerald-500 dark:text-slate-500"
            />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une entreprise, un secteur, une ville…"
              aria-label="Rechercher une entreprise"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-12 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(16,185,129,0.12)] dark:border-white/10 dark:bg-[#0B1F33] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Effacer la recherche"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X size={14} />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-3.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-400 dark:border-white/10 dark:bg-white/5 sm:block">
                /
              </kbd>
            )}
          </label>

          <button
            type="button"
            onClick={pickRandom}
            disabled={companies.length === 0}
            title="Ouvrir une entreprise au hasard"
            className="group inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 active:scale-95 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-emerald-500/40 dark:hover:text-emerald-400"
          >
            <Shuffle size={16} className="transition duration-300 group-hover:rotate-180" />
            Au hasard
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2 overflow-x-auto border-t border-slate-100 pt-3 [scrollbar-width:none] dark:border-white/10 [&::-webkit-scrollbar]:hidden">
          <button type="button" onClick={() => setSector("all")} aria-pressed={sector === "all"} className={chip(sector === "all")}>
            Toutes <span className="ml-1 opacity-60">{companies.length}</span>
          </button>

          {sectors.map(([name, count]) => (
            <button key={name} type="button" onClick={() => setSector(sector === name ? "all" : name)} aria-pressed={sector === name} className={chip(sector === name)}>
              {name} <span className="ml-1 opacity-60">{count}</span>
            </button>
          ))}

          <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-slate-200 dark:bg-white/10" />

          <button
            type="button"
            onClick={() => setOnlyVerified((v) => !v)}
            aria-pressed={onlyVerified}
            className={`${chip(onlyVerified)} inline-flex items-center gap-1.5`}
          >
            <CheckCircle size={13} /> Vérifiées
          </button>
        </div>
      </section>

      <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
        <p>
          <span className="font-bold text-slate-800 dark:text-white">{filtered.length}</span>{" "}
          entreprise{filtered.length > 1 ? "s" : ""}
          {hasFilters && <span className="text-slate-400 dark:text-slate-500"> sur {companies.length}</span>}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 font-semibold text-emerald-700 transition hover:underline dark:text-emerald-400"
          >
            <RotateCcw size={12} /> Réinitialiser
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-white/10 dark:bg-[#112A3A]">
          <span className="ts-co-float mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Building2 size={26} />
          </span>
          <p className="mt-4 text-sm font-bold text-slate-800 dark:text-white">Aucune entreprise ne correspond</p>
          <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-400">
            Essayez un autre mot-clé ou retirez un filtre pour élargir la recherche.
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={reset}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0B253B] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#123B55] active:scale-95 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              <RotateCcw size={13} /> Effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <div
          key={`${sector}-${onlyVerified}`}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {filtered.map((company, index) => (
            <CompanyCard key={company.id} company={company} index={index} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================ */
/* CARTE ENTREPRISE */
/* ============================================================ */
function CompanyCard({ company, index, onSelect }) {
  const ref = useRef(null);
  const [logoFailed, setLogoFailed] = useState(false);

  const sector = sectorOf(company);
  const location = [company.city, company.country].filter(Boolean).join(", ");
  const gradient = GRADIENTS[hash(company.name) % GRADIENTS.length];
  const logo = !logoFailed ? company.logo_url || fileUrl(company.logo_path) : null;
  const initial = (company.name || "?").charAt(0).toUpperCase();

  const handleMove = (event) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);

    if (!prefersReducedMotion()) {
      el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 6}deg) rotateY(${(x - 0.5) * 8}deg) translateY(-4px)`;
    }
  };

  const handleLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <div className="ts-co-rise" style={{ animationDelay: `${Math.min(index, 12) * 60}ms` }}>
      <button
        ref={ref}
        type="button"
        onClick={() => onSelect?.(company)}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        aria-label={`Voir ${company.name}`}
        className="group relative block w-full overflow-hidden rounded-[22px] border border-slate-200 bg-white text-left shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-out will-change-transform hover:border-emerald-300/70 hover:shadow-[0_22px_44px_-18px_rgba(11,37,59,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:border-white/10 dark:bg-[#112A3A] dark:hover:border-emerald-500/40 dark:hover:shadow-[0_22px_44px_-18px_rgba(0,0,0,0.7)]"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(240px circle at var(--mx, 50%) var(--my, 0%), rgba(52,211,153,0.18), transparent 70%)",
          }}
        />

        <div className={`relative h-[78px] overflow-hidden bg-gradient-to-br ${gradient}`}>
          <span
            aria-hidden="true"
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,.6) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          />
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-5 select-none text-[92px] font-black leading-none text-white/15 transition duration-500 group-hover:-translate-x-1 group-hover:scale-110"
          >
            {initial}
          </span>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 group-hover:ts-co-shine group-hover:opacity-100"
          />

          {company.is_verified && (
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-emerald-700 shadow-sm backdrop-blur">
              <CheckCircle size={11} /> Vérifiée
            </span>
          )}
        </div>

        <div className="relative px-5 pb-5">
          <div className="-mt-8 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-lg ring-4 ring-white transition duration-300 group-hover:-translate-y-0.5 group-hover:-rotate-3 dark:ring-[#112A3A]">
            {logo ? (
              <img src={logo} alt="" onError={() => setLogoFailed(true)} className="h-full w-full object-contain" />
            ) : (
              <span className={`flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-xl font-extrabold text-white`}>
                {initial}
              </span>
            )}
          </div>

          <h3 className="mt-3 truncate text-[15px] font-bold text-slate-900 transition-colors group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-400">
            {company.name}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {sector && (
              <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                {sector}
              </span>
            )}
            {location && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} className="text-slate-400 dark:text-slate-500" /> {location}
              </span>
            )}
          </div>

          <p className="mt-3 line-clamp-2 min-h-[36px] text-xs leading-[18px] text-slate-500 dark:text-slate-400">
            {company.description || "Découvrez cette entreprise et ses opportunités."}
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/10">
            <span className="text-xs font-semibold text-slate-500 transition-colors group-hover:text-emerald-700 dark:text-slate-400 dark:group-hover:text-emerald-400">
              Voir le profil
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:bg-emerald-500 group-hover:text-white dark:bg-white/10 dark:text-slate-400">
              <ArrowUpRight size={14} />
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}

/* ============================================================ */
/* COMPOSANTS UTILITAIRES */
/* ============================================================ */

function HistoryModal({ type, sent, received, missions, onClose }) {
  const isSent = type === "sent";
  const isReceived = type === "received";
  const isMissions = type === "missions";

  const data = isSent ? sent : isReceived ? received : missions;
  const title = isSent ? "Candidatures envoyées" : isReceived ? "Propositions reçues" : "Missions en cours";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#082B35]/70 p-4 backdrop-blur-md" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#112A3A]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-white/10">
          <div>
            <h3 className="text-lg font-extrabold text-[#0B253B] dark:text-white">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{data.length} élément(s)</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {data.length === 0 ? (
            <EmptyState emoji="📭" text="Aucun élément pour le moment." />
          ) : (
            data.map((item) => {
              const date = formatShortDate(item.created_at || item.start_at);
              
              if (isMissions) {
                const displayTitle = getMissionTitle(item);
                const statusFr = {
                  planned: "Acceptée",
                  active: "En cours",
                  completed: "Terminée",
                  cancelled: "Annulée",
                  pending_employee: "En attente"
                }[item.status] || item.status;

                return (
                  <div key={item.id} className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50 transition dark:border-white/10 dark:hover:bg-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-bold text-[#0B253B] dark:text-white">{displayTitle}</span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">{statusFr}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Avec : {item.requesting_company?.name || item.requestingCompany?.name || item.supplying_company?.name || "N/A"}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Début : {date}</p>
                    <Link to={`/missions/${item.id}`} className="mt-3 inline-block text-xs font-bold text-[#0F9691] hover:underline dark:text-emerald-400">Voir la mission →</Link>
                  </div>
                );
              }

              return (
                <div key={item.id} className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50 transition dark:border-white/10 dark:hover:bg-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold text-[#0B253B] dark:text-white">{item.title || item.resource_request?.title || "Sans titre"}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      item.status === 'accepted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 
                      item.status === 'declined' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                    }`}>
                      {item.status_label || item.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isSent ? `À : ${item.to_company?.name || item.resource_request?.company?.name || "Entreprise"}` : `De : ${item.proposing_company?.name || item.profile?.user?.name || "Talent"}`}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Le {date}</p>
                  <Link to={`/proposals/${item.id}`} className="mt-3 inline-block text-xs font-bold text-[#0F9691] hover:underline dark:text-emerald-400">Voir le détail →</Link>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, mine, onLike, onShare, onDelete, onEdit, onReport, onPatch, showToast, avatarUrl, sentProposals = [], onOpenOffer, onApply }) {
  const author = getAuthor(post);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [showReactions, setShowReactions] = useState(false);
  const [localReaction, setLocalReaction] = useState(post.is_liked ? "like" : null);
  const [localLikesCount, setLocalLikesCount] = useState(post.is_job_offer ? 0 : (post.likes_count || 0));
  const menuRef = useRef(null);
  const reactionTimeoutRef = useRef(null);

  const hasApplied = useMemo(() => {
    if (mine || !sentProposals?.length) return false;
    
    const rawId = post.real_id || post.id;
    const realId = String(rawId).replace(/^(req|job)-/, "");
    
    return sentProposals.some((p) => {
      if (post.is_job_offer) {
        const idsToCheck = [
          p.job_offer_id,
          p.jobOffer?.id,
          p.job_offer?.id,
          p.subject_id,
          p.proposalable_id
        ];
        return idsToCheck.some(id => id != null && String(id) === realId);
      }
      
      const idsToCheck = [
        p.resource_request_id,
        p.resourceRequest?.id,
        p.resource_request?.id,
        p.request_id,
        p.subject_id,
        p.proposalable_id
      ];
      return idsToCheck.some(id => id != null && String(id) === realId);
    });
  }, [mine, post.real_id, post.id, post.is_job_offer, sentProposals]);

  useEffect(() => {
    setLocalLikesCount(post.likes_count || 0);
  }, [post.likes_count, post.is_job_offer]);

  useEffect(() => {
    const savedReaction = localStorage.getItem(`reaction_${post.id}`);
    if (savedReaction) setLocalReaction(savedReaction);
    else setLocalReaction(post.is_liked ? "like" : null);
  }, [post.is_liked, post.id]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const handleReactionClick = (type) => {
    const newType = localReaction === type ? null : type;
    setLocalReaction(newType);
    setShowReactions(false);

    if (newType && !localReaction) {
      setLocalLikesCount((prev) => prev + 1);
    } else if (!newType && localReaction) {
      setLocalLikesCount((prev) => Math.max(0, prev - 1));
    }

    if (newType) localStorage.setItem(`reaction_${post.id}`, newType);
    else localStorage.removeItem(`reaction_${post.id}`);

    if (newType !== null) {
      onLike(post.id, post.real_id || post.id, post.is_job_offer);
    }
  };

  const handleMouseEnterReaction = () => {
    clearTimeout(reactionTimeoutRef.current);
    setShowReactions(true);
  };

  const handleMouseLeaveReaction = () => {
    reactionTimeoutRef.current = setTimeout(() => setShowReactions(false), 500);
  };

  const toggleComments = async () => {
    const next = !showComments;
    setShowComments(next);

    if (next && comments === null) {
      setLoadingComments(true);
      try {
        const res = await api.get(`/resource-requests/${post.real_id || post.id}/comments`);
        setComments(asArray(res.data));
      } catch (error) {
        if (error.response?.status === 403) {
          showToast("Vous n'avez pas accès aux commentaires de cette publication.", "error");
        } else {
          showToast("Impossible de charger les commentaires", "error");
        }
        setComments([]);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const sendComment = async (e) => {
    e.preventDefault();
    const content = newComment.trim();
    if (!content) return;
    setSending(true);
    try {
      const res = await api.post(`/resource-requests/${post.real_id || post.id}/comment`, { content });
      setComments((prev) => [res.data.comment, ...(prev || [])]);
      onPatch(post.id, { comments_count: (post.comments_count || 0) + 1 });
      setNewComment("");
    } catch (error) {
      if (error.response?.status === 403) {
        showToast("Vous n'êtes pas autorisé à commenter cette publication.", "error");
      } else {
        showToast("Impossible d'ajouter le commentaire", "error");
      }
    } finally {
      setSending(false);
    }
  };

  const description = post.description || "";
  const isLong = description.length > 300;
  const shown = isLong && !expanded ? `${description.slice(0, 300)}…` : description;

  const isJobOffer = post.is_job_offer || post.type === 'offre' || post.type === 'offer' || post.type === 'job';

  return (
    <article className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-[#112A3A] dark:shadow-none dark:hover:shadow-lg">
      
      <div className="flex items-start justify-between bg-slate-50/50 px-5 py-4 border-b border-slate-100/80 dark:border-white/5 dark:bg-white/5">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar src={author.logo} name={author.name} size={48} fit={author.isTalent ? "cover" : "contain"} className="ring-2 ring-white shadow-sm dark:ring-[#112A3A]" />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold text-slate-900 dark:text-white">{author.name}</p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 font-medium dark:text-slate-400">
              <span>{formatShortDate(post.created_at)}</span>
              <span>·</span>
              <span className={`font-semibold ${isJobOffer ? "text-violet-600 dark:text-violet-400" : "text-[#0F9691] dark:text-emerald-400"}`}>
                {isJobOffer ? "Offre d'emploi" : "Demande"}
              </span>
              <span>·</span>
              <Globe size={11} className="mb-0.5" />
            </div>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen((o) => !o)} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-white">
            <MoreHorizontal size={20} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-white/10 dark:bg-[#0B1F33]">
              {mine ? (
                <>
                  <button onClick={() => { setMenuOpen(false); onEdit(post); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"><Pencil size={14} /> Modifier</button>
                  <button onClick={() => { setMenuOpen(false); setShowDeleteModal(true); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"><Trash2 size={14} /> Supprimer</button>
                </>
              ) : (
                <button onClick={() => { setMenuOpen(false); onReport(post); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"><Flag size={14} /> Signaler</button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white px-5 py-4 dark:bg-transparent">
        <h3 className="mb-2 text-[17px] font-bold leading-snug text-slate-900 dark:text-white">{post.title}</h3>
        <p className="whitespace-pre-line text-[14px] leading-relaxed text-slate-600 dark:text-slate-300">{shown}</p>
        {isLong && (
          <button onClick={() => setExpanded((e) => !e)} className="mt-1 text-xs font-bold text-[#087F83] hover:underline dark:text-emerald-400">{expanded ? "Voir moins" : "Voir plus"}</button>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-medium text-slate-500 dark:text-slate-400">
          {(post.city || post.country) && (
            <span className="flex items-center gap-1.5">
              <MapPin size={15} className="text-slate-400 dark:text-slate-500" />
              {[post.city, post.country].filter(Boolean).join(", ")}
            </span>
          )}
          {post.remote && (
            <span className="flex items-center gap-1.5">
              <Home size={15} className="text-slate-400 dark:text-slate-500" /> Télétravail
            </span>
          )}
          {(post.budget_min || post.budget_max) && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Banknote size={14} /> {post.budget_min || 0} - {post.budget_max || 0} € / jour
            </span>
          )}
        </div>

        {post.skills?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.skills.slice(0, 6).map((s, i) => (
              <span key={s.id ?? i} className="rounded-lg bg-[#F4F7FA] px-2.5 py-1.5 text-[11px] font-bold text-slate-600 border border-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                {s.name || s}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-5 pb-3 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          {localReaction === "love" ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm shadow-sm dark:bg-[#0B1F33]">❤️</span>
          ) : localReaction === "like" ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-sm"><ThumbsUp size={10} fill="currentColor" /></span>
          ) : null}
          <span className="font-medium">{localLikesCount}</span>
        </span>
        <span className="font-medium">{post.comments_count || 0} commentaire(s) · {post.shares_count || 0} partage(s)</span>
      </div>

      <div className="flex items-center justify-between rounded-b-[24px] bg-slate-50/50 px-3 py-2 border-t border-slate-100 dark:border-white/5 dark:bg-white/5">
        <div
          className="relative flex-1"
          onMouseEnter={handleMouseEnterReaction}
          onMouseLeave={handleMouseLeaveReaction}
        >
          <button
            onClick={() => handleReactionClick(localReaction === 'like' ? null : 'like')}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-semibold text-[#1877F2] transition hover:bg-slate-200/50 dark:text-blue-400 dark:hover:bg-white/5"
          >
            {localReaction === "love" ? (
              <span>❤️ J'adore</span>
            ) : localReaction === "like" ? (
              <><ThumbsUp size={18} fill="currentColor" /> J'aime</>
            ) : (
              <><ThumbsUp size={18} /> J'aime</>
            )}
          </button>

          {showReactions && (
            <div className="absolute bottom-full left-0 mb-1 flex gap-1 rounded-full border border-slate-200 bg-white p-1.5 shadow-lg z-30 dark:border-white/10 dark:bg-[#0B1F33]">
              <button onClick={() => handleReactionClick("like")} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 transition hover:scale-110 dark:hover:bg-white/10">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1877F2] text-white"><ThumbsUp size={15} fill="currentColor" /></span>
              </button>
              <button onClick={() => handleReactionClick("love")} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 transition hover:scale-110 dark:hover:bg-white/10">
                <span className="text-2xl">❤️</span>
              </button>
            </div>
          )}
        </div>

        <button onClick={toggleComments} className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-200/50 dark:text-slate-300 dark:hover:bg-white/5">
          <MessageSquare size={18} /> Commenter
        </button>

        <button onClick={() => onShare(post)} className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-200/50 dark:text-slate-300 dark:hover:bg-white/5">
          <Share2 size={18} /> Partager
        </button>

        {!mine && (
          <div className="flex-1 flex justify-center">
            {hasApplied ? (
              <span className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2 text-[13px] font-bold text-emerald-700 border border-emerald-200 cursor-default dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                <CheckCircle size={16} /> Candidature envoyée
              </span>
            ) : (
              isJobOffer ? (
                <button
                  onClick={() => {
                    const realId = String(post.real_id || post.id).replace(/^job-/, "");
                    if (onOpenOffer) onOpenOffer(realId);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F0FAF8] px-4 py-2 text-[13px] font-bold text-[#0F9691] transition hover:bg-[#E0F2EC] dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                >
                  <Send size={16} /> Contacter
                </button>
              ) : (
                <button
                  onClick={() => onApply(post)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F0FAF8] px-4 py-2 text-[13px] font-bold text-[#0F9691] transition hover:bg-[#E0F2EC] dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                >
                  <Send size={16} /> Proposer une offre
                </button>
              )
            )}
          </div>
        )}
      </div>

      {showComments && (
        <div className="space-y-4 border-t border-slate-100 bg-slate-50/50 p-5 dark:border-white/5 dark:bg-white/5">
          <form onSubmit={sendComment} className="flex items-center gap-3">
            <Avatar src={avatarUrl} name="Moi" size={36} />
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={2000}
              placeholder="Écrire un commentaire..."
              className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#16B8B1] focus:ring-2 focus:ring-[#16B8B1]/20 dark:border-white/10 dark:bg-[#0B1F33] dark:text-white dark:placeholder:text-slate-500"
            />
            <button type="submit" disabled={!newComment.trim() || sending} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877F2] text-white transition hover:bg-blue-700 disabled:opacity-50">
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>

          {loadingComments ? (
            <div className="flex justify-center py-3"><Loader2 size={20} className="animate-spin text-[#16B8B1]" /></div>
          ) : comments?.length === 0 ? (
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">Soyez le premier à commenter.</p>
          ) : (
            <div className="space-y-3 mt-4">
              {comments?.map((c) => (
                <div key={c.id} className="flex items-start gap-3">
                <Avatar 
  src={fileUrl(
    c.user?.professional_profile?.avatar_path ||
    c.user?.professionalProfile?.avatar_path ||
    c.user?.avatar_path
  )} 
  name={c.user?.name} 
  size={36} 
/>
                  <div className="min-w-0 rounded-2xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-slate-100/50 dark:bg-[#0B1F33] dark:ring-white/5">
                    <p className="text-[13px] font-bold text-slate-900 dark:text-white">{c.user?.name || "Utilisateur"}</p>
                    <p className="mt-0.5 whitespace-pre-line break-words text-[13px] text-slate-700 dark:text-slate-300">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
          <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 text-center shadow-2xl dark:bg-[#112A3A]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Supprimer la publication ?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Cette action est irréversible. Voulez-vous vraiment supprimer cette publication ?</p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">Annuler</button>
              <button onClick={() => { setShowDeleteModal(false); onDelete(post); }} className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-bold text-white hover:bg-rose-700">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function Avatar({ src, name, size = 40, rounded = "rounded-full", fit = "cover", className = "" }) {
  const [err, setErr] = useState(false);
  useEffect(() => setErr(false), [src]);
  return (
    <div style={{ width: size, height: size }} className={`flex shrink-0 items-center justify-center overflow-hidden bg-[#E8F8F5] font-bold text-[#0B253B] dark:bg-emerald-500/10 dark:text-emerald-400 ${rounded} ${className}`}>
      {src && !err ? <img src={src} alt="" onError={() => setErr(true)} className={`h-full w-full ${fit === "contain" ? "object-contain p-1" : "object-cover"}`} /> : <span style={{ fontSize: size * 0.4 }}>{(name || "?").charAt(0).toUpperCase()}</span>}
    </div>
  );
}

function StatTile({ icon: Icon, value, label, tone, onClick }) {
  const tones = { emerald: "bg-[#E6FAF6] text-[#0F8F78]", blue: "bg-sky-50 text-sky-700", violet: "bg-violet-50 text-violet-700", amber: "bg-amber-50 text-amber-700" };
  const darkTones = { emerald: "dark:bg-emerald-500/10 dark:text-emerald-400", blue: "dark:bg-sky-500/10 dark:text-sky-400", violet: "dark:bg-violet-500/10 dark:text-violet-400", amber: "dark:bg-amber-500/10 dark:text-amber-400" };
  return (
    <div 
      onClick={onClick}
      className={`rounded-2xl border border-slate-100 bg-[#FAFCFD] p-3 transition hover:border-[#CDEDE3] dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-500/30 ${onClick ? "cursor-pointer hover:shadow-sm" : ""}`}
    >
      <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${tones[tone] || tones.blue} ${darkTones[tone] || darkTones.blue}`}><Icon size={15} /></span>
      <p className="mt-2 text-xl font-extrabold leading-none text-[#0B253B] dark:text-white">{value}</p>
      <p className="mt-1 text-[10px] leading-tight text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function StatsWidget({ title, requests, received, sent, active, isCompany = false, onStatClick }) {
  const stats = isCompany
    ? [
        { icon: Briefcase, value: requests, label: "Besoins publiés", tone: "emerald", key: "requests" },
        { icon: Handshake, value: received, label: "Propositions reçues", tone: "blue", key: "received" },
        { icon: CheckCircle, value: active, label: "Missions en cours", tone: "amber", key: "missions" },
        { icon: Send, value: sent, label: "Propositions envoyées", tone: "violet", key: "sent" },
      ]
    : [
        { icon: Send, value: sent, label: "Candidatures envoyées", tone: "violet", key: "sent" },
        { icon: Briefcase, value: active, label: "Missions en cours", tone: "emerald", key: "missions" },
        { icon: Handshake, value: received, label: "Propositions reçues", tone: "blue", key: "received" },
        { icon: Target, value: requests, label: "Besoins publiés", tone: "amber", key: "requests" },
      ];
  return (
    <section className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#112A3A]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-extrabold text-[#0B253B] dark:text-white">{title}</h2>
        <span className="rounded-full bg-[#E6FAF6] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-[#087F73] dark:bg-emerald-500/10 dark:text-emerald-400">Vue synthèse</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {stats.map((item) => {
          const { key, ...rest } = item;
          return (
            <StatTile 
              key={key} 
              {...rest} 
              onClick={() => onStatClick && onStatClick(key)}
            />
          );
        })}
      </div>
    </section>
  );
}

function ActivityOverview({ items, filter, onFilter }) {
  const filters = [
    { id: "all", label: "Tout" },
    { id: "proposals", label: "Propositions" },
    { id: "missions", label: "Missions" },
    { id: "requests", label: "Besoins publiés" },
  ];
  const filtered = filter === "all" ? items : items.filter((item) => item.kind === filter);
  
  const statusLabels = {
    pending: "En attente", sent: "Envoyée", accepted: "Acceptée", rejected: "Refusée",
    active: "En cours", completed: "Terminée", draft: "Brouillon", published: "Publiée",
    paused: "En pause", closed: "Fermée", filled: "Pourvue", expired: "Expirée",
    "Envoyée": "Envoyée",
    "À traiter": "À traiter",
    "En attente": "En attente"
  };

  const getTargetUrl = (item) => {
    const realId = item.id.split("-")[1];
    if (item.kind === "missions") return `/missions/${realId}`;
    if (item.kind === "proposals") return `/proposals/${realId}`;
    if (item.kind === "requests") return `/resource-requests/${realId}`;
    return "#";
  };

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#112A3A]">
      
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-white/10">
        <div>
          <h2 className="text-base font-extrabold text-[#0B253B] dark:text-white">Suivi de votre activité</h2>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Propositions, missions et besoins issus de vos données.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex gap-1 overflow-x-auto rounded-full bg-[#F2F6F8] p-1 dark:bg-white/5" role="tablist">
            {filters.map((item) => (
              <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} onClick={() => onFilter(item.id)} className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold transition ${filter === item.id ? "bg-[#0B253B] text-white shadow-sm dark:bg-emerald-500 dark:text-white" : "text-slate-500 hover:text-[#0B253B] dark:text-slate-400 dark:hover:text-white"}`}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm font-semibold text-[#405B73] dark:text-slate-300">Aucune activité dans cette catégorie</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Les nouveaux éléments apparaîtront ici lorsqu'ils seront disponibles.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {filtered.slice(0, 7).map((item) => {
            const status = String(item.status || "").toLowerCase();
            
            const positive = ["accepted", "active", "completed", "published", "envoyée"].includes(status);
            const waiting = ["pending", "sent", "draft", "à traiter", "en attente"].includes(status);
            
            const date = item.date && !Number.isNaN(new Date(item.date).getTime()) ? formatShortDate(item.date) : "Date non renseignée";
            
            return (
              <Link 
                key={item.id} 
                to={getTargetUrl(item)} 
                className="group flex items-start gap-3 px-4 py-3.5 transition hover:bg-[#F8FCFA] sm:px-5 cursor-pointer dark:hover:bg-white/5"
              >
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${positive ? "bg-[#16B8A6]" : waiting ? "bg-amber-400" : "bg-slate-300 dark:bg-slate-600"}`} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#0F8F78] dark:text-emerald-400">{item.label}</span>
                    {item.counterpart && <span className="truncate text-[10px] text-slate-500 dark:text-slate-400">· {item.counterpart}</span>}
                  </div>
                  <h3 className="mt-0.5 truncate text-sm font-bold text-[#102A43] group-hover:text-[#0F9691] transition dark:text-slate-200 dark:group-hover:text-emerald-400">
                    {item.title}
                  </h3>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${
                    positive ? "bg-[#E6FAF6] text-[#087F73] dark:bg-emerald-500/10 dark:text-emerald-400" 
                    : waiting ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" 
                    : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400"
                  }`}>
                    {statusLabels[status] || item.status || "Statut non renseigné"}
                  </span>
                  <time className="text-[9px] text-slate-400 dark:text-slate-500">{date}</time>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {filter === "missions" && filtered.length > 0 && (
        <div className="border-t border-slate-100 bg-[#FAFCFD] px-4 py-3 text-center sm:px-5 dark:border-white/10 dark:bg-white/5">
          <Link 
            to="/missions" 
            className="inline-flex items-center text-[12px] font-bold text-[#0F9691] transition hover:text-[#087F73] hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Voir tout
          </Link>
        </div>
      )}
    </section>
  );
}

const CONTRACT_CHOICES = [
  { id: "stage",      label: "Stage",             hint: "Durée déterminée" },
  { id: "alternance", label: "Alternance",        hint: "Durée déterminée" },
  { id: "emploi",     label: "Emploi",            hint: "CDI · essai d'1 mois" },
  { id: "mission",    label: "Mission freelance", hint: "Ponctuelle" },
];

function CreateRequestModal({ onClose, onPublish, user, isCompany, publishing }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "Mission",
    contract_type: "stage",
    city: user?.city || user?.professional_profile?.city || "",
    budget_min: "",
    budget_max: "",
    remote: false,
    start_at: new Date().toISOString().split("T")[0],
    end_at: "",
  });

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const isJob = form.contract_type === "emploi";

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;

    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    onPublish({
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type.toLowerCase(),
      contract_type: form.contract_type,
      status: "published",
      author_type: isCompany ? "company" : "talent",
      workload_percent: 100,
      remote: form.remote,
      urgency: "normal",
      positions_count: 1,
      company_id: isCompany ? user?.companies?.[0]?.id : null,
      city: form.city,
      budget_min: form.budget_min ? Number(form.budget_min) : null,
      budget_max: form.budget_max ? Number(form.budget_max) : null,
           start_at: form.start_at || today.toISOString().split("T")[0],
      end_at: isJob ? null : (form.end_at || nextMonth.toISOString().split("T")[0]),
    });
  };

  const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:bg-[#0B1F33] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500";
  const labelClass = "mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#082B35]/70 p-4 backdrop-blur-md" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#112A3A]">

        <div className="relative flex items-center justify-between gap-3 overflow-hidden bg-gradient-to-r from-[#0B2A35] via-[#0B3A36] to-[#0E4B42] px-6 py-5 text-white">
          <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-emerald-300 backdrop-blur">
              <Plus size={20} />
            </span>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight">Publier un besoin</h3>
              <p className="text-[11px] text-emerald-100/80">Décrivez votre projet à la communauté.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {/* ✅ TYPE DE RECHERCHE : toujours visible, quel que soit l'onglet */}
          <div>
            <label className={labelClass}>
              {isCompany ? "Type de contrat proposé *" : "Je recherche *"}
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CONTRACT_CHOICES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => update("contract_type", c.id)}
                  className={`rounded-xl border px-3 py-2.5 text-left transition ${
                    form.contract_type === c.id
                      ? "border-teal-500 bg-teal-50 dark:border-emerald-500 dark:bg-emerald-500/10"
                      : "border-slate-200 bg-white hover:border-teal-300 dark:border-white/10 dark:bg-[#0B1F33] dark:hover:border-emerald-500/40"
                  }`}
                >
                  <p className={`text-xs font-bold ${form.contract_type === c.id ? "text-teal-700 dark:text-emerald-400" : "text-slate-800 dark:text-slate-200"}`}>{c.label}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">{c.hint}</p>
                </button>
              ))}
            </div>
            {isJob && (
              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                Si un entretien est validé : période d'essai d'1 mois, puis CDI (sans date de fin).
              </p>
            )}
          </div>

          <div className="flex gap-2 rounded-xl bg-slate-100 p-1 dark:bg-white/5">
            {["Mission", "Proposition", "Talent"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => update("type", t)}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${form.type === t ? "bg-white text-slate-900 shadow-sm dark:bg-[#0B1F33] dark:text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div>
            <label className={labelClass}>Titre du besoin *</label>
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              required
              maxLength={100}
              className={inputClass}
              placeholder={isJob ? "Ex: Recherche CDI développeur React" : "Ex: Recherche stage en design UI/UX"}
            />
          </div>

          <div>
            <label className={labelClass}>Description *</label>
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} required rows={4} className={`${inputClass} resize-y`} placeholder="Décrivez le besoin, les compétences attendues..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Ville</label>
              <input value={form.city} onChange={(e) => update("city", e.target.value)} className={inputClass} placeholder="Ex: Antananarivo" />
            </div>
            <div>
              <label className={labelClass}>Budget (€ / jour)</label>
              <div className="flex items-center gap-2">
                <input type="number" value={form.budget_min} onChange={(e) => update("budget_min", e.target.value)} className={inputClass} placeholder="Min" />
                <span className="text-slate-400">-</span>
                <input type="number" value={form.budget_max} onChange={(e) => update("budget_max", e.target.value)} className={inputClass} placeholder="Max" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Début</label>
              <input type="date" value={form.start_at} onChange={(e) => update("start_at", e.target.value)} className={inputClass} />
            </div>
            {/* Pas de date de fin pour un emploi (CDI) */}
            {!isJob && (
              <div>
                <label className={labelClass}>Fin (optionnel)</label>
                <input type="date" value={form.end_at} onChange={(e) => update("end_at", e.target.value)} className={inputClass} />
              </div>
            )}
          </div>

          <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${form.remote ? "border-teal-200 bg-teal-50/50 dark:border-emerald-500/30 dark:bg-emerald-500/10" : "border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-[#0B1F33] dark:hover:bg-white/5"}`}>
            <input type="checkbox" checked={form.remote} onChange={(e) => update("remote", e.target.checked)} className="h-4 w-4 accent-teal-600 dark:accent-emerald-500" />
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-white">Télétravail possible</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Le poste peut être effectué à distance.</p>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 p-5 dark:border-white/10 dark:bg-white/5">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:bg-transparent dark:text-slate-300 dark:hover:bg-white/5">
            Annuler
          </button>
          <button type="submit" disabled={publishing || !form.title.trim() || !form.description.trim()} className="inline-flex items-center gap-2 rounded-xl bg-[#0B253B] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#123B55] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500">
            {publishing ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {publishing ? "Publication..." : "Publier"}
          </button>
        </div>
      </form>
    </div>
  );
}

function EditPostModal({ post, onClose, onSubmit }) {
  const [title, setTitle] = useState(post.title || "");
  const [description, setDescription] = useState(post.description || "");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit(post, { title: title.trim(), description: description.trim() });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#082B35]/70 p-4 backdrop-blur-md" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#112A3A]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-[#0B253B] dark:text-white">Modifier la publication</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><X size={20} /></button>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-400">Titre</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={255} className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-2.5 text-sm outline-none focus:border-[#16B8B1] focus:bg-white dark:border-white/10 dark:bg-[#0B1F33] dark:text-white dark:focus:border-emerald-500" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-400">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={6} className="w-full resize-y rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-sm outline-none focus:border-[#16B8B1] focus:bg-white dark:border-white/10 dark:bg-[#0B1F33] dark:text-white dark:focus:border-emerald-500" />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">Annuler</button>
          <button type="submit" disabled={saving || !title.trim() || !description.trim()} className="inline-flex items-center gap-2 rounded-xl bg-[#0B253B] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#123B55] disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500">
            {saving && <Loader2 size={14} className="animate-spin" />} Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}

function FullScreenStory({ initialIndex, allRequests, onClose, favorites, onToggleFavorite }) {
  const [index, setIndex] = useState(initialIndex || 0);
  const [query, setQuery] = useState("");
  const firstRun = useRef(true);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allRequests || [];
    return (allRequests || []).filter((r) => r.title?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q));
  }, [allRequests, query]);

  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    setIndex(0);
  }, [query]);

  const next = useCallback(() => { if (list.length) setIndex((p) => (p + 1) % list.length); }, [list.length]);
  const prev = useCallback(() => { if (list.length) setIndex((p) => (p - 1 + list.length) % list.length); }, [list.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onClose]);

  const current = list[Math.min(index, Math.max(list.length - 1, 0))];
  const author = current ? getAuthor(current) : null;
  const isFav = current ? favorites.includes(current.id) : false;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#082B35]/95 backdrop-blur-xl">
      {author?.logo && <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${author.logo})`, filter: "blur(60px)", transform: "scale(1.2)" }} />}

      <div className="relative z-50 bg-black/40 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          {author ? (
            <div className="flex items-center gap-3">
              <Avatar src={author.logo} name={author.name} size={40} />
              <div>
                <p className="text-sm font-bold text-white">{author.name}</p>
                <p className="text-xs text-white/70">{current.title}</p>
              </div>
            </div>
          ) : <h2 className="font-bold text-white">Recherche</h2>}
          <button onClick={onClose} className="rounded-full p-2 text-white transition hover:bg-white/20"><X size={24} /></button>
        </div>
        <div className="px-4 py-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une demande..." className="w-full rounded-xl border border-white/10 bg-white/10 py-2 pl-9 pr-4 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#16B8B1]" />
          </div>
        </div>
      </div>

      {current ? (
        <>
          <div className="relative z-10 flex gap-1.5 px-4 pt-2">
            {list.map((_, i) => <div key={i} className={`h-1 flex-1 rounded-full ${i === index ? "bg-[#16B8B1]" : "bg-white/30"}`} />)}
          </div>

          <div className="relative z-10 flex flex-1 items-center justify-center gap-3 overflow-y-auto p-4">
            <button onClick={prev} aria-label="Précédent" className="hidden shrink-0 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/25 sm:block"><ChevronLeft size={24} /></button>

            <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#112A3A]">
              <div className="flex h-28 w-full items-center justify-center border-b border-slate-100 bg-slate-50 dark:border-white/10 dark:bg-white/5">
                {author.logo ? <img src={author.logo} alt="" className="h-full w-full object-contain p-4" /> : <span className="text-4xl font-extrabold text-slate-300 dark:text-slate-600">{author.name.charAt(0)}</span>}
              </div>
              <div className="p-6">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-extrabold leading-tight text-[#102A43] dark:text-white">{current.title}</h1>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{author.name}{(current.city || current.country) && ` · ${[current.city, current.country].filter(Boolean).join(", ")}`}</p>
                  </div>
                  {current.match_score > 0 && <MatchCircle score={current.match_score} />}
                </div>
                <p className="mb-4 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">{current.description}</p>
                {current.skills?.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {current.skills.slice(0, 6).map((s, i) => <span key={s.id ?? i} className="rounded-md border border-emerald-100 bg-[#E8F8F5] px-2 py-1 text-[10px] font-bold text-[#087F73] dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">{s.name || s}</span>)}
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <button onClick={() => onToggleFavorite(current.id)} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${isFav ? "border border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"}`}>
                      <Heart size={14} fill={isFav ? "currentColor" : "none"} /> {isFav ? "Sauvegardé" : "Sauvegarder"}
                    </button>
                    {(current.budget_min || current.budget_max) && <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-[#102A43] dark:bg-white/5 dark:text-slate-300">{current.budget_min || 0} - {current.budget_max || 0} € / jour</span>}
                  </div>
                  <Link to={`/resource-requests/${current.real_id || current.id}`} className="flex shrink-0 items-center gap-2 rounded-lg bg-[#102A43] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#087F83] dark:bg-emerald-600 dark:hover:bg-emerald-500">
                    Proposer ma candidature <ArrowUpRight size={14} />
                  </Link>
                </div>
              </div>
            </div>

            <button onClick={next} aria-label="Suivant" className="hidden shrink-0 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/25 sm:block"><ChevronRight size={24} /></button>
          </div>
        </>
      ) : (
        <div className="relative z-10 flex flex-1 items-center justify-center text-white/60"><p>Aucune demande trouvée.</p></div>
      )}
    </div>
  );
}

function MatchCircle({ score }) {
  const { color, sublabel } = getMatchLevel(score);
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative h-14 w-14 shrink-0">
        <svg className="h-14 w-14 -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="3.5" className="dark:stroke-white/10" />
          <circle cx="24" cy="24" r={radius} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 0.6s ease" }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[12px] font-extrabold" style={{ color }}>{score}%</span>
      </div>
      <div className="hidden min-w-0 leading-tight sm:block">
        <p className="text-[10.5px] font-extrabold text-[#0F172A] dark:text-white">Compatibilité</p>
        <p className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">{sublabel}</p>
      </div>
    </div>
  );
}

function FavoritesModal({ allRequests, favorites, onClose, onToggleFavorite }) {
  const favoriteRequests = useMemo(() => allRequests.filter((r) => favorites.includes(r.id)), [allRequests, favorites]);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#082B35]/70 p-4 backdrop-blur-md" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_30px_90px_rgba(4,35,44,.3)] dark:border-white/10 dark:bg-[#112A3A]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400"><Heart size={20} fill="currentColor" /></span>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Mes Favoris (Demandes)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{favoriteRequests.length} demande(s) sauvegardée(s)</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-200 dark:hover:bg-white/10"><X size={24} /></button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {favoriteRequests.length === 0 ? (
            <div className="py-10 text-center"><EmptyState emoji="💔" text="Vous n'avez pas encore de favoris." /></div>
          ) : (
            favoriteRequests.map((req) => {
              const a = getAuthor(req);
              return (
                <div key={req.id} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-sm dark:border-white/10 dark:bg-[#0B1F33] dark:hover:shadow-none dark:hover:border-emerald-500/30">
                  <Avatar src={a.logo} name={a.name} size={48} rounded="rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white">{req.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{a.name}{req.city && ` · ${req.city}`}</p>
                      </div>
                      <button onClick={() => onToggleFavorite(req.id)} className="shrink-0 rounded-lg p-1.5 text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"><Heart size={16} fill="currentColor" /></button>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{req.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="rounded border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">{req.match_score ? `${req.match_score}% Match` : "Nouveau"}</span>
                      <Link to={`/resource-requests/${req.real_id || req.id}`} className="text-xs font-bold text-[#102A43] hover:underline dark:text-slate-200 dark:hover:text-emerald-400">Voir →</Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function SavedOffersModal({ savedOffers, onClose, onToggleSavedOffer, onSelectOffer }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (savedOffers.length === 0) { setOffers([]); setLoading(false); return; }
    setLoading(true);
    Promise.all(
      savedOffers.map((id) => api.get(`/job-offers/${id}`).then((res) => res.data?.data || res.data).catch(() => null))
    )
      .then((results) => setOffers(results.filter(Boolean)))
      .finally(() => setLoading(false));
  }, [savedOffers]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#082B35]/70 p-4 backdrop-blur-md" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_30px_90px_rgba(4,35,44,.3)] dark:border-white/10 dark:bg-[#112A3A]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F8F5] text-[#0F9691] dark:bg-emerald-500/10 dark:text-emerald-400"><Bookmark size={20} fill="currentColor" /></span>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Offres sauvegardées</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{offers.length} offre(s) enregistrée(s)</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-200 dark:hover:bg-white/10"><X size={24} /></button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#16B8B1]" size={32} /></div>
          ) : offers.length === 0 ? (
            <div className="py-10 text-center">
              <EmptyState emoji="💔" text="Vous n'avez pas encore d'offres sauvegardées." />
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Cliquez sur le cœur d'une offre pour la sauvegarder ici.</p>
            </div>
          ) : (
            offers.map((o) => (
              <div key={o.id} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-sm dark:border-white/10 dark:bg-[#0B1F33] dark:hover:shadow-none dark:hover:border-emerald-500/30">
                <Avatar src={fileUrl(o.company?.logo_path)} name={o.company?.name} size={48} rounded="rounded-xl" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white">{o.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{o.company?.name}{o.city && ` · ${o.city}`}</p>
                    </div>
                    <button onClick={() => onToggleSavedOffer(o.id)} className="shrink-0 rounded-lg p-1.5 text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-500/10" title="Retirer des favoris"><Heart size={16} fill="currentColor" /></button>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{o.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="rounded border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">{OFFER_TYPES[o.offer_type] || "Offre"}</span>
                    <button onClick={() => onSelectOffer(o.id)} className="text-xs font-bold text-[#102A43] hover:underline dark:text-slate-200 dark:hover:text-emerald-400">Voir l'offre →</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function CompanyModal({ company, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/companies/${company.id}`)
      .then((res) => setDetails(res.data?.data || res.data))
      .catch(() => setDetails(company))
      .finally(() => setLoading(false));
  }, [company.id]);

  const data = details || company;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06141F]/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#0B1F33] shadow-[0_24px_60px_rgba(0,0,0,0.6)]" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-[220px] w-full shrink-0 overflow-hidden bg-[#0B1F33]">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ 
              backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')`, 
              filter: "brightness(0.5)" 
            }} 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1F33] via-[#0B1F33]/90 to-transparent" />

          <div className="relative z-10 flex h-full items-center gap-6 px-6 sm:px-8">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-white p-1 shadow-lg ring-4 ring-emerald-500/20">
              <img 
                src={fileUrl(data.logo_path)} 
                alt={data.name} 
                className="h-full w-full object-contain rounded-xl" 
                onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${data.name}&background=0D8ABC&color=fff`; }}
              />
            </div>

            <div className="flex flex-col justify-center">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{data.name}</h2>
              
              <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-300">
                <MapPin size={16} />
                <span>{[data.city, data.country].filter(Boolean).join(", ")}</span>
              </div>
              
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-emerald-400 w-fit">
                <UserRound size={14} />
               Vous êtes actuellement salarié chez {data.name}
              </div>
            </div>
          </div>
          
          <button 
            onClick={onClose} 
            className="absolute right-4 top-4 z-20 rounded-full bg-black/30 p-2 text-white/70 transition hover:bg-black/50 hover:text-white backdrop-blur-sm"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#0B1F33] p-6 sm:p-8">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-emerald-500" size={28} />
            </div>
          ) : (
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                À propos de l'entreprise
              </h3>
              <div className="rounded-xl border border-slate-700/50 bg-[#112A3A] p-5 shadow-inner">
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
                  {data.description || "Aucune description n'a été renseignée pour cette entreprise pour le moment."}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-700/50 bg-[#112A3A] px-6 py-4 text-center sm:px-8">
          <p className="text-[11px] text-slate-400">
            Ces informations sont réservées aux membres de l'entreprise.
          </p>
        </div>

      </div>
    </div>
  );
}