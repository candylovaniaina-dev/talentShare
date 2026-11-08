import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import {
  Handshake, Briefcase, X, ArrowUpRight, Send, CheckCircle, Target, Search,
  MoreHorizontal, ThumbsUp, MessageSquare, Share2, MapPin, ChevronLeft, ChevronRight,
  Heart, Loader2, Banknote, UserRound, Home, Bookmark, Globe, Pencil, Trash2, Flag,
  AlertCircle, Plus, Sparkles, LayoutGrid, User, Building2, GraduationCap, Rocket,
  Shuffle, RotateCcw, Flame, Clock, Inbox, Zap, TrendingUp,
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
  { id: "home", label: "Accueil", hint: "Fil du réseau" },
  { id: "profile", label: "Mon espace", hint: "Publications & suivi" },
  { id: "companies", label: "Réseau", hint: "Annuaire des entreprises" },
];

const OFFER_TYPES = { internship: "Stage", apprenticeship: "Alternance", junior_mission: "Mission junior", first_job: "Emploi" };

const BASE_URL = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
const fileUrl = (p) => (!p ? null : /^https?:/.test(p) ? p : `${BASE_URL}/storage/${p}`);

const asArray = (data) => (Array.isArray(data) ? data : data && Array.isArray(data.data) ? data.data : []);

const formatShortDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) : "");

function timeAgo(d) {
  if (!d) return "";
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (!Number.isFinite(diff)) return "";
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`;
  return formatShortDate(d);
}

function getMatchLevel(score) {
  if (score >= 80) return { color: "#536D91", sublabel: "Forte correspondance" };
  if (score >= 60) return { color: "#FACC15", sublabel: "Bonne correspondance" };
  if (score >= 40) return { color: "#F59E0B", sublabel: "Correspondance partielle" };
  return { color: "#94A3B8", sublabel: "Correspondance faible" };
}

function getAuthor(post) {
  const isTalent = post.author_type === "talent";
  const prof = post.author?.professional_profile;
  return {
    isTalent,
    name: isTalent ? post.author?.name || "Talent" : post.company?.name || post.author?.name || "Entreprise",
    logo: fileUrl(isTalent ? prof?.avatar_path || post.author?.avatar_path : post.company?.logo_path),
    subtitle: isTalent ? prof?.headline : [post.company?.city, post.company?.country].filter(Boolean).join(", "),
  };
}

function buildUpdatePayload(post, changes) {
  const d = (v) => (v ? String(v).slice(0, 10) : undefined);
  const base = {
    title: post.title, description: post.description, company_id: post.company_id,
    start_at: d(post.start_at), end_at: d(post.end_at), workload_percent: post.workload_percent,
    remote: !!post.remote, country: post.country, city: post.city, status: post.status,
    budget_min: post.budget_min, budget_max: post.budget_max, positions_count: post.positions_count,
    urgency: post.urgency, contract_type: post.contract_type, ...changes,
  };
  return Object.fromEntries(Object.entries(base).filter(([, v]) => v !== null && v !== undefined && v !== ""));
}

const sectorOf = (company) => company.sector || company.industry || "";
const hash = (value) => [...String(value || "")].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);
const GRADIENTS = [
  "from-[#304F78] to-[#142B49]",
  "from-[#3D5D83] to-[#1B3557]",
  "from-[#243F63] to-[#0F2340]",
  "from-[#526B8B] to-[#243F63]",
];
const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function useCountUp(target = 0, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) { setVal(target); return; }
    let raf; const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

/* ============================================================
   STYLES GLOBAUX (animations)
============================================================ */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
@keyframes ts-rise{from{opacity:0;transform:translateY(20px) scale(.98)}to{opacity:1;transform:none}}
@keyframes ts-pop{from{opacity:0;transform:scale(.92) translateY(10px)}to{opacity:1;transform:none}}
@keyframes ts-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes ts-drift{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,-20px) scale(1.15)}}
@keyframes ts-shine{from{transform:translateX(-120%) skewX(-18deg)}to{transform:translateX(260%) skewX(-18deg)}}
@keyframes ts-shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
@keyframes ts-pulse-ring{0%{box-shadow:0 0 0 0 rgba(36,63,99,.35)}100%{box-shadow:0 0 0 12px rgba(36,63,99,0)}}
.ts-rise{animation:ts-rise .55s cubic-bezier(.2,.7,.2,1) backwards}
.ts-pop{animation:ts-pop .28s cubic-bezier(.2,.8,.2,1)}
.ts-float{animation:ts-float 3.2s ease-in-out infinite}
.ts-drift{animation:ts-drift 11s ease-in-out infinite}
.ts-shine{animation:ts-shine 1.1s ease-out}
.ts-live{animation:ts-pulse-ring 1.8s ease-out infinite}
.ts-skel{background:linear-gradient(90deg,rgba(148,163,184,.12) 25%,rgba(148,163,184,.28) 50%,rgba(148,163,184,.12) 75%);background-size:800px 100%;animation:ts-shimmer 1.4s linear infinite}
.ts-noscroll{scrollbar-width:none}.ts-noscroll::-webkit-scrollbar{display:none}
.ts-grid{background-image:radial-gradient(rgba(255,255,255,.55) 1px,transparent 1px);background-size:16px 16px}
@media (prefers-reduced-motion:reduce){.ts-rise,.ts-pop,.ts-float,.ts-drift,.ts-shine,.ts-live,.ts-skel{animation:none!important}}
`;

const card = "rounded-[26px] border border-slate-200/70 bg-white/90 shadow-[0_8px_30px_-12px_rgba(11,37,59,.18)] backdrop-blur dark:border-white/10 dark:bg-[#112A3A]/90 dark:shadow-none";

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
  const [feedFilter, setFeedFilter] = useState("all");

  const [isPublishing, setIsPublishing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createPreset, setCreatePreset] = useState("stage");

  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [applications, setApplications] = useState([]); // ✅ Ajout des candidatures
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
  const [companySource, setCompanySource] = useState("network");
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [applyModalRequest, setApplyModalRequest] = useState(null);
  const [myCompanies, setMyCompanies] = useState([]);

  const avatarUrl = fileUrl(user?.avatar_path || user?.professional_profile?.avatar_path);
  const role = user?.role?.toLowerCase();
  const isCompany = role === "company" || role === "entreprise";
  const isStudent = role === "student" || role === "employee";

  useEffect(() => { setSearchParams({ tab }, { replace: true, state: location.state }); }, [tab, setSearchParams]);

  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (TABS.some((t) => t.id === urlTab) && urlTab !== tab) setTab(urlTab);
  }, [searchParams]);

  useEffect(() => { if (user?.id) localStorage.setItem(`talentshare_favorites_${user.id}`, JSON.stringify(favorites)); }, [favorites, user?.id]);
  useEffect(() => { if (user?.id) localStorage.setItem(`talentshare_saved_offers_${user.id}`, JSON.stringify(savedOffers)); }, [savedOffers, user?.id]);

  const loadData = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [recRes, sentRes, misRes, myRes, compRes, feedRes, matchRes, jobOffersRes, appRes] = await Promise.all([
        api.get("/proposals/received").catch(() => ({ data: [] })),
        api.get("/proposals/sent").catch(() => ({ data: [] })),
        api.get("/missions").catch(() => ({ data: [] })),
        api.get("/resource-requests?my=1").catch(() => ({ data: [] })),
        api.get("/companies").catch(() => ({ data: [] })),
        api.get("/resource-requests?per_page=15").catch(() => null),
        isStudent ? api.get("/resource-requests/matching-for-me").catch(() => ({ data: [] })) : Promise.resolve(null),
        api.get("/job-offers").catch(() => ({ data: [] })),
        isStudent ? api.get("/applications").catch(() => ({ data: [] })) : Promise.resolve({ data: [] }), // ✅ Chargement des candidatures
      ]);

      if (!feedRes) setError("Impossible de charger le fil d'actualité.");

      const feedList = feedRes ? asArray(feedRes.data).map((req) => ({ ...req, id: `req-${req.id}`, real_id: req.id })) : [];
      const jobOffersList = asArray(jobOffersRes.data).map((job) => ({ ...job, id: `job-${job.id}`, real_id: job.id, is_job_offer: true }));
      const combinedFeed = [...feedList, ...jobOffersList].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      const likedMap = new Map(combinedFeed.map((r) => [r.id, r.is_liked]));

      setReceived(asArray(recRes.data));
      setSent(asArray(sentRes.data));
      setApplications(asArray(appRes.data)); // ✅ Sauvegarde des candidatures
      setMissions(asArray(misRes.data));
      setCompanies(asArray(compRes.data));
      setMyRequests(asArray(myRes.data).map((r) => ({ ...r, is_liked: r.is_liked ?? likedMap.get(`req-${r.id}`) ?? false })));
      setFeed(combinedFeed);
      setFeedPage(feedRes?.data?.current_page || 1);
      setFeedLastPage(feedRes?.data?.last_page || 1);

      if (isStudent) setStories(asArray(matchRes?.data).filter((r) => r.author_type !== "talent"));
      else setStories(combinedFeed.filter((r) => r.created_by !== user.id));
    } finally {
      setLoading(false);
    }
  }, [user?.id, isStudent]);

  useEffect(() => {
    loadData();
    const onFocus = () => loadData(true);
    window.addEventListener("focus", onFocus);
    if (user) api.get("/profile/my-companies").then((res) => setMyCompanies(asArray(res.data))).catch(() => setMyCompanies([]));
    return () => window.removeEventListener("focus", onFocus);
  }, [loadData, user]);

  useEffect(() => {
    const applyId = searchParams.get("apply");
    if (applyId) {
      setSearchParams({ tab: "home" }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await api.get(`/resource-requests?per_page=15&page=${feedPage + 1}`);
      const list = asArray(res.data).map((req) => ({ ...req, id: `req-${req.id}`, real_id: req.id }));
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
    setMyRequests((prev) => prev.map((r) => (`req-${r.id}` === id ? { ...r, ...patch } : r)));
  };

  const removePost = (id) => {
    const rm = (list) => list.filter((r) => r.id !== id);
    setFeed(rm);
    setStories(rm);
    setMyRequests((prev) => prev.filter((r) => `req-${r.id}` !== id));
  };

  const openCreate = (preset = "stage") => { setCreatePreset(preset); setShowCreateModal(true); };

  const handlePublish = async (data) => {
    setIsPublishing(true);
    try {
      await api.post("/resource-requests", data);
      showToast("Publication réussie !", "success");
      setShowCreateModal(false);
      loadData(true);
    } catch (err) {
      const errors = err.response?.data?.errors;
      showToast(errors ? Object.values(errors).flat().join(" · ") : err.response?.data?.message || "Erreur lors de la publication", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleFavorite = (id) => setFavorites((p) => (p.includes(id) ? p.filter((f) => f !== id) : [...p, id]));
  const toggleSavedOffer = (id) => setSavedOffers((p) => (p.includes(id) ? p.filter((f) => f !== id) : [...p, id]));

  const handleLike = async (id, realId, isJobOffer) => {
    try {
      const currentPost = feed.find((p) => p.id === id);
      if (currentPost) {
        const newLikedState = !currentPost.is_liked;
        const newCount = newLikedState ? (currentPost.likes_count || 0) + 1 : Math.max(0, (currentPost.likes_count || 0) - 1);
        patchPost(id, { is_liked: newLikedState, likes_count: newCount });
      }
      const url = isJobOffer ? `/job-offers/${realId}/like` : `/resource-requests/${realId}/like`;
      const res = await api.post(url);
      patchPost(id, { is_liked: res.data.liked, likes_count: res.data.likes_count });
    } catch (error) {
      console.error("Erreur like:", error);
      showToast("Impossible d'enregistrer votre J'aime", "error");
      const currentPost = feed.find((p) => p.id === id);
      if (currentPost) patchPost(id, { is_liked: !currentPost.is_liked, likes_count: currentPost.likes_count });
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
      if (err.response?.status === 403) showToast("Vous n'êtes pas autorisé à supprimer cette publication.", "error");
      else if (err.response?.status === 404) { showToast("Cette publication n'existe plus.", "error"); removePost(post.id); }
      else showToast(err.response?.data?.message || "Suppression impossible", "error");
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
    post.created_by === user?.id || (post.company_id && (user?.companies || []).some((c) => c.id === post.company_id));

  const visibleFeed = useMemo(() => {
    const q = feedSearch.trim().toLowerCase();
    return feed
      .filter((p) => !hiddenIds.includes(p.id))
      .filter((p) => !isMine(p))
      .filter((p) => (feedFilter === "all" ? true : feedFilter === "offers" ? p.is_job_offer : !p.is_job_offer))
      .filter((p) => {
        if (!q) return true;
        return (
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          getAuthor(p).name.toLowerCase().includes(q) ||
          (p.skills || []).some((s) => (s.name || s).toLowerCase().includes(q))
        );
      });
  }, [feed, hiddenIds, feedSearch, feedFilter]);

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
      return;
    }
    
    const frame = requestAnimationFrame(() => {
      const el = document.getElementById(`request-${pendingTarget}`);
      if (!el) return;
      const highlight = ["ring-4", "ring-[#243F63]", "rounded-[26px]", "transition-all"];
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add(...highlight);
      setTimeout(() => el.classList.remove(...highlight), 3500);
      setPendingTarget(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [pendingTarget, tab, loading, visibleMine, loadData]);

  const activityItems = useMemo(() => {
    const receivedRows = isCompany ? received.map((p) => ({
      id: `received-${p.id}`, kind: "proposals", label: "Proposition reçue",
      title: p.title || p.resource_request?.title || p.job_offer?.title || "Proposition reçue",
      counterpart: p.professional_profile?.user?.name || p.professional?.name || p.user?.name || p.from?.name || "Talent",
      status: p.status === "sent" ? "À traiter" : (p.status_label || p.status || "En attente"),
      date: p.created_at || p.updated_at,
    })) : [];

    const sentRows = sent.map((p) => ({
      id: `sent-${p.id}`, kind: "proposals", label: "Proposition envoyée",
      title: p.title || p.resource_request?.title || p.job_offer?.title || "Proposition envoyée",
      counterpart: p.company?.name || p.resource_request?.company?.name || p.professional_profile?.user?.name || p.to?.name || "Destinataire",
      status: "Envoyée", date: p.created_at || p.updated_at,
    }));

    const missionRows = missions.map((m) => ({
      id: `mission-${m.id}`, kind: "missions", label: "Mission", title: getMissionTitle(m),
      counterpart: m.company?.name || m.professional?.name || [m.city, m.country].filter(Boolean).join(", "),
      status: m.status_label || m.status || "Statut non renseigné", date: m.updated_at || m.created_at,
    }));

    const requestRows = visibleMine.map((r) => ({
      id: `request-${r.id}`, kind: "requests", label: "Besoin publié", title: r.title || "Demande de ressource",
      counterpart: r.company?.name || r.author?.name || [r.city, r.country].filter(Boolean).join(", "),
      status: r.status_label || r.status || "Statut non renseigné", date: r.updated_at || r.created_at,
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

  const appliedRequestIds = useMemo(() => new Set(
    sent.map((p) => p.resource_request_id ?? p.resourceRequest?.id ?? p.resource_request?.id ?? p.request_id ?? p.subject_id)
      .filter(Boolean).map((id) => String(id))
  ), [sent]);

  const appliedJobOfferIds = useMemo(() => new Set(
    applications.map((a) => a.job_offer_id)
      .filter(Boolean).map((id) => String(id))
  ), [applications]);

  const cardProps = {
    onLike: handleLike, onShare: handleShare, onDelete: handleDelete, onEdit: setEditingPost,
    onReport: handleReport, onPatch: patchPost, showToast, sentProposals: sent,
    myApplications: applications, // ✅ On passe les candidatures
    onOpenOffer: (id) => setSelectedOfferId(id), onApply: (req) => setApplyModalRequest(req),
  };

  const tabIndex = Math.max(0, TABS.findIndex((t) => t.id === tab));
  const firstName = (user?.name || "").split(" ")[0] || "vous";
  const greeting = new Date().getHours() < 18 ? "Bonjour" : "Bonsoir";

  const openStory = (story) => {
    const idx = visibleStories.findIndex((s) => s.id === story.id);
    setFullscreenStory({ index: Math.max(idx, 0), allRequests: visibleStories });
  };

  const StoriesRail = ({ compact = false }) => (
    <div className="relative">
      <div id={compact ? "stories-compact" : "stories-container"} className="ts-noscroll flex gap-3 overflow-x-auto scroll-smooth px-1 pb-2 pt-1">
        {visibleStories.slice(0, 12).map((story, i) => {
          const author = getAuthor(story);
          const realId = String(story.real_id || story.id).replace(/^(req|job)-/, "");
          const applied = story.is_job_offer ? appliedJobOfferIds.has(realId) : appliedRequestIds.has(realId);
          const grad = GRADIENTS[hash(author.name) % GRADIENTS.length];
          return (
            <button
              key={story.id}
              onClick={() => !applied && openStory(story)}
              disabled={applied}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`ts-rise group relative flex h-[210px] w-[142px] shrink-0 flex-col justify-between overflow-hidden rounded-[22px] bg-gradient-to-b ${grad} p-3 text-left shadow-md transition duration-300 ${applied ? "opacity-80" : "hover:-translate-y-1.5 hover:shadow-xl"}`}
            >
              <span className="ts-grid pointer-events-none absolute inset-0 opacity-20" />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
              <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:ts-shine group-hover:opacity-100" />
              <div className="relative flex items-center gap-2">
                <span className="rounded-full bg-gradient-to-tr from-blue-300 via-white to-blue-300 p-[2px]">
                  <Avatar src={author.logo} name={author.name} size={30} className="ring-2 ring-white" />
                </span>
                <p className="truncate text-[11px] font-bold text-white drop-shadow">{author.name}</p>
              </div>
              <h3 className="relative line-clamp-4 text-[13px] font-extrabold leading-tight text-white drop-shadow">{story.title || "Demande sans titre"}</h3>
              <div className="relative flex items-center justify-between gap-1">
                {(story.budget_min || story.budget_max) && !applied && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/35 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur">
                    <Banknote size={10} /> {story.budget_min || 0}-{story.budget_max || 0} €
                  </span>
                )}
                {applied && (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-extrabold text-blue-700">
                    <CheckCircle size={10} /> Postulé
                  </span>
                )}
              </div>
            </button>
          );
        })}
        {visibleStories.length === 0 && (
          <p className="w-full py-8 text-center text-xs text-slate-500 dark:text-slate-400">Aucune nouvelle demande pour le moment.</p>
        )}
      </div>
      {visibleStories.length > 3 && (
        <>
          <button aria-label="Précédent" onClick={() => document.getElementById(compact ? "stories-compact" : "stories-container")?.scrollBy({ left: -300, behavior: "smooth" })} className="absolute left-0 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-lg transition hover:scale-110 hover:text-[#243F63] dark:bg-[#142B49] dark:text-slate-300"><ChevronLeft size={18} /></button>
          <button aria-label="Suivant" onClick={() => document.getElementById(compact ? "stories-compact" : "stories-container")?.scrollBy({ left: 300, behavior: "smooth" })} className="absolute right-0 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-lg transition hover:scale-110 hover:text-[#243F63] dark:bg-[#142B49] dark:text-slate-300"><ChevronRight size={18} /></button>
        </>
      )}
    </div>
  );

  return (
    <AppShell>
      <style>{STYLES}</style>
      <div className="relative min-h-full overflow-hidden px-3 py-4 font-sans sm:px-5 lg:px-7" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        {/* Aurore d'arrière-plan */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
          <div className="ts-drift absolute -left-24 -top-24 h-96 w-96 rounded-full bg-[#243F63]/[.07] blur-3xl" />
          <div className="ts-drift absolute -right-20 top-1/3 h-[28rem] w-[28rem] rounded-full bg-[#536D91]/[.06] blur-3xl" style={{ animationDelay: "-4s" }} />
          <div className="ts-drift absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-slate-300/20 blur-3xl" style={{ animationDelay: "-7s" }} />
        </div>

        <div className="relative z-10 mx-auto max-w-[1280px] space-y-6">
        
          {loading ? (
            <FeedSkeleton />
          ) : (
            <div key={tab} className="ts-pop">
              {/* ================= ACCUEIL ================= */}
              {tab === "home" && (
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                  <div className="min-w-0 space-y-5">
                    <section className={`${card} p-4 sm:p-5`}>
                      <div className="mb-3 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-sm font-extrabold text-[#142B49] dark:text-white"><Flame size={16} className="text-amber-500" /> À la une pour vous</h2>
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">Nouveau</span>
                      </div>
                      <StoriesRail compact />
                    </section>

                    <section className={`${card} sticky top-2 z-20 p-3`}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <label className="group relative block flex-1">
                          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-500" />
                          <input type="text" value={feedSearch} onChange={(e) => setFeedSearch(e.target.value)} placeholder="Rechercher un besoin, une compétence, une entreprise…"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-2.5 pl-11 pr-10 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(36,63,99,.10)] dark:border-white/10 dark:bg-[#142B49] dark:text-white dark:placeholder:text-slate-500" />
                          {feedSearch && <button onClick={() => setFeedSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"><X size={14} /></button>}
                        </label>
                        <div className="flex gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-white/5">
                          {[["all", "Tout"], ["requests", "Demandes"], ["offers", "Offres"]].map(([id, label]) => (
                            <button key={id} onClick={() => setFeedFilter(id)} className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition active:scale-95 ${feedFilter === id ? "bg-white text-[#142B49] shadow-sm dark:bg-blue-500 dark:text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}>{label}</button>
                          ))}
                        </div>
                      </div>
                    </section>

                    {error && (
                      <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                        <span className="flex items-center gap-2"><AlertCircle size={16} /> {error}</span>
                        <button onClick={() => loadData()} className="rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700">Réessayer</button>
                      </div>
                    )}

                    {!error && visibleFeed.length === 0 ? (
                      <div className={`${card} border-dashed p-10 text-center`}>
                        <EmptyState emoji="📰" text={feedSearch ? "Aucune publication ne correspond à votre recherche." : "Aucune publication pour le moment."} />
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {visibleFeed.map((post, i) => (
                          <div key={post.id} className="ts-rise" style={{ animationDelay: `${Math.min(i, 6) * 70}ms` }}>
                            <PostCard post={post} mine={isMine(post)} avatarUrl={avatarUrl} {...cardProps} />
                          </div>
                        ))}
                      </div>
                    )}

                    {feedPage < feedLastPage && !feedSearch && (
                      <button onClick={loadMore} disabled={loadingMore} className="group mx-auto flex items-center gap-2 rounded-full bg-[#142B49] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#123B55] active:scale-95 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500">
                        {loadingMore ? <Loader2 size={15} className="animate-spin" /> : <TrendingUp size={15} />} Charger plus de publications
                      </button>
                    )}
                  </div>

                  {/* Colonne latérale */}
                  <aside className="hidden space-y-5 lg:block">
                    <div className="sticky top-2 space-y-5">
                      <section className={`${card} overflow-hidden`}>
                       <div className="relative h-20 bg-slate-100 dark:bg-white/5" />
                    <div className="mt-4 px-5 pb-5 text-center">
                          <Avatar src={avatarUrl} name={user?.name} size={72} className="mx-auto ring-4 ring-white dark:ring-[#112A3A]" />
                          <p className="mt-2 truncate text-base font-extrabold text-[#142B49] dark:text-white">{user?.name}</p>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">{isCompany ? "Entreprise" : "Talent"}</p>
                          <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 rounded-2xl bg-slate-50 py-3 dark:divide-white/10 dark:bg-white/5">
                            <MiniStat value={visibleMine.length} label="Besoins" />
                            <MiniStat value={sent.length} label="Envoyées" />
                            <MiniStat value={activeMissions} label="Missions" />
                          </div>
                          <button onClick={() => openCreate()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#243F63] to-[#162D4A] py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg active:scale-95">
                            <Plus size={16} /> Publier un besoin
                          </button>
                        </div>
                      </section>

                      {myCompanies.length > 0 && (
                        <section className={`${card} p-4`}>
                          <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-[#142B49] dark:text-white">
                            <Building2 size={15} className="text-blue-500" /> Mes entreprises
                          </h3>
                          <div className="space-y-2">
                            {myCompanies.map((comp) => (
                              <button
                                key={comp.id}
                                onClick={() => { setSelectedCompany(comp); setCompanySource("profile"); }}
                                className="group flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-slate-50 dark:hover:bg-white/5"
                              >
                                <Avatar src={fileUrl(comp.logo_path)} name={comp.name} size={36} rounded="rounded-lg" fit="contain" className="border border-slate-100 bg-white" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-bold text-slate-800 group-hover:text-blue-700 dark:text-slate-200">{comp.name}</p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Salarié</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </section>
                      )}

                      <section className={`${card} p-4`}>
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-[#142B49] dark:text-white"><Clock size={15} className="text-blue-500" /> Activité récente</h3>
                        {activityItems.slice(0, 4).length === 0 ? (
                          <p className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">Rien pour l'instant.</p>
                        ) : (
                          <ul className="space-y-1">
                            {activityItems.slice(0, 4).map((it) => (
                              <li key={it.id}>
                                <Link to={getTargetUrl(it)} className="group flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50 dark:hover:bg-white/5">
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"><KindIcon kind={it.kind} size={14} /></span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-xs font-bold text-slate-800 group-hover:text-blue-700 dark:text-slate-200">{it.title}</span>
                                    <span className="block text-[10px] text-slate-400">{it.label} · {timeAgo(it.date)}</span>
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                        <button onClick={() => setTab("profile")} className="mt-2 w-full rounded-xl py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10">Tout voir →</button>
                      </section>

                      <section className={`${card} p-4`}>
                        <h3 className="mb-3 text-sm font-extrabold text-[#142B49] dark:text-white">Raccourcis</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => setShowFavoritesModal(true)} className="flex flex-col items-start gap-1 rounded-2xl bg-rose-50 p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md dark:bg-rose-500/10"><Heart size={16} className="text-rose-500" /><span className="text-xs font-bold text-rose-700 dark:text-rose-400">Favoris · {favorites.length}</span></button>
                          <button onClick={() => setShowSavedOffersModal(true)} className="flex flex-col items-start gap-1 rounded-2xl bg-blue-50 p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md dark:bg-blue-500/10"><Bookmark size={16} className="text-blue-600" /><span className="text-xs font-bold text-blue-700 dark:text-blue-400">Offres · {savedOffers.length}</span></button>
                        </div>
                      </section>
                    </div>
                  </aside>
                </div>
              )}

              {/* ================= MON ESPACE ================= */}
              {tab === "profile" && (
                <div className="mx-auto max-w-4xl space-y-5">
                  <section className={`${card} overflow-hidden`}>
                    <div className="flex items-center gap-3 p-4 sm:p-5">
                      <Avatar src={avatarUrl} name={user?.name} size={48} />
                      <button onClick={() => openCreate()} className="group flex h-12 w-full flex-1 items-center justify-between rounded-full border border-slate-200 bg-slate-50 px-5 text-left text-[15px] text-slate-500 transition hover:border-blue-300 hover:bg-white hover:shadow-[0_0_0_4px_rgba(16,185,129,.1)] dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                        <span>Quel besoin souhaitez-vous publier, {firstName} ?</span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white transition group-hover:rotate-90"><Plus size={16} /></span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-px border-t border-slate-100 bg-slate-100 sm:grid-cols-4 dark:border-white/5 dark:bg-white/5">
                      {CONTRACT_CHOICES.map((c) => (
                        <button key={c.id} onClick={() => openCreate(c.id)} className="group flex items-center gap-2.5 bg-white px-4 py-3 text-left transition hover:bg-blue-50/60 dark:bg-[#112A3A] dark:hover:bg-white/5">
                          <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-white transition group-hover:scale-110 group-hover:-rotate-6 ${c.color}`}><c.icon size={16} /></span>
                          <span><span className="block text-xs font-bold text-slate-800 dark:text-slate-100">{c.label}</span><span className="block text-[10px] text-slate-500 dark:text-slate-400">{c.hint}</span></span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatTile icon={Target} value={visibleMine.length} label="Besoins publiés" tone="blue" onClick={() => document.getElementById("my-posts")?.scrollIntoView({ behavior: "smooth" })} />
                    <StatTile icon={Send} value={sent.length} label="Envoyées" tone="violet" onClick={() => setHistoryModalType("sent")} />
                    <StatTile icon={Handshake} value={received.length} label="Reçues" tone="blue" onClick={() => setHistoryModalType("received")} />
                    <StatTile icon={Briefcase} value={activeMissions} label="Missions en cours" tone="amber" onClick={() => setHistoryModalType("missions")} />
                  </div>

                  {myCompanies.length > 0 && (
                    <section className={`${card} p-5`}>
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h2 className="text-base font-extrabold text-[#142B49] dark:text-white">Mes entreprises</h2>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Vous faites partie de l'équipe</p>
                        </div>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-extrabold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">{myCompanies.length}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {myCompanies.map((company) => (
                          <button type="button" key={company.id} onClick={() => { setSelectedCompany(company); setCompanySource("profile"); }}
                            className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-300 hover:shadow-xl dark:border-white/10 dark:bg-[#142B49]">
                            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 p-2 transition group-hover:-rotate-3 dark:border-white/5 dark:bg-white/5">
                              <Avatar src={fileUrl(company.logo_path)} name={company.name} size={64} rounded="rounded-xl" fit="contain" className="h-full w-full" />
                            </div>
                            <span className="line-clamp-2 text-center text-xs font-bold text-slate-800 group-hover:text-blue-700 dark:text-slate-200">{company.name}</span>
                            {company.city && <span className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{company.city}</span>}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  <section id="my-posts" className={`${card} overflow-hidden`}>
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/10">
                      <h2 className="text-base font-extrabold text-[#142B49] dark:text-white">Mes publications</h2>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-extrabold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">{visibleMine.length} publication(s)</span>
                    </div>
                    <div className="p-4 sm:p-5">
                      {visibleMine.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center dark:border-white/10 dark:bg-white/5">
                          <EmptyState emoji="📝" text="Vous n'avez pas encore publié de besoin." />
                        </div>
                      ) : (
                        <div className="space-y-5">
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
              )}

              {/* ================= RÉSEAU ================= */}
              {tab === "companies" && (
                <div className="mx-auto max-w-6xl">
                  <CompaniesTab companies={companies} onSelect={(company) => { setSelectedCompany(company); setCompanySource("network"); }} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bouton flottant mobile */}
      {tab !== "companies" && (
        <button onClick={() => openCreate()} aria-label="Publier un besoin" className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#243F63] to-[#162D4A] text-white shadow-[0_12px_30px_-8px_rgba(15,150,145,.8)] transition hover:scale-110 hover:rotate-90 active:scale-95 lg:hidden">
          <Plus size={26} />
        </button>
      )}

      {showCreateModal && <CreateRequestModal onClose={() => setShowCreateModal(false)} onPublish={handlePublish} user={user} isCompany={isCompany} publishing={isPublishing} preset={createPreset} />}
      {fullscreenStory && <FullScreenStory initialIndex={fullscreenStory.index} allRequests={fullscreenStory.allRequests} onClose={() => setFullscreenStory(null)} favorites={favorites} onToggleFavorite={toggleFavorite} />}
      {showFavoritesModal && <FavoritesModal allRequests={favoritesPool} favorites={favorites} onClose={() => setShowFavoritesModal(false)} onToggleFavorite={toggleFavorite} />}
      {showSavedOffersModal && <SavedOffersModal savedOffers={savedOffers} onClose={() => setShowSavedOffersModal(false)} onToggleSavedOffer={toggleSavedOffer} onSelectOffer={(id) => { setShowSavedOffersModal(false); setSelectedOfferId(id); }} />}
      {selectedCompany && <CompanyModal company={selectedCompany} onClose={() => setSelectedCompany(null)} showJobs={companySource === "network"} />}
      {editingPost && <EditPostModal post={editingPost} onClose={() => setEditingPost(null)} onSubmit={handleEdit} />}
      {selectedOfferId && <JobOfferDetail offerId={selectedOfferId} onClose={() => setSelectedOfferId(null)} />}
      {historyModalType && <HistoryModal type={historyModalType} sent={sent} received={received} missions={missions} onClose={() => setHistoryModalType(null)} />}
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

const getTargetUrl = (item) => {
  const realId = item.id.split("-")[1];
  if (item.kind === "missions") return `/missions/${realId}`;
  if (item.kind === "proposals") return `/proposals/${realId}`;
  if (item.kind === "requests") return `/resource-requests/${realId}`;
  return "#";
};

function KindIcon({ kind, size = 14 }) {
  const I = kind === "missions" ? Briefcase : kind === "proposals" ? Handshake : Target;
  return <I size={size} />;
}

/* ============================================================
   PETITS COMPOSANTS
============================================================ */
function MiniStat({ value, label }) {
  const n = useCountUp(value, 700);
  return (
    <div>
      <p className="text-lg font-extrabold tabular-nums text-[#142B49] dark:text-white">{n}</p>
      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        <div className="ts-skel h-60 rounded-[26px]" />
        {[0, 1, 2].map((i) => <div key={i} className="ts-skel h-64 rounded-[26px]" style={{ animationDelay: `${i * 120}ms` }} />)}
      </div>
      <div className="hidden space-y-5 lg:block"><div className="ts-skel h-72 rounded-[26px]" /><div className="ts-skel h-52 rounded-[26px]" /></div>
    </div>
  );
}

function Avatar({ src, name, size = 40, rounded = "rounded-full", fit = "cover", className = "" }) {
  const [err, setErr] = useState(false);
  useEffect(() => setErr(false), [src]);
  return (
    <div style={{ width: size, height: size }} className={`flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-[#EDF2F8] to-[#DCE5F0] font-bold text-[#142B49] dark:from-blue-500/20 dark:to-blue-500/10 dark:text-blue-400 ${rounded} ${className}`}>
      {src && !err ? <img src={src} alt="" onError={() => setErr(true)} className={`h-full w-full ${fit === "contain" ? "object-contain p-1" : "object-cover"}`} /> : <span style={{ fontSize: size * 0.4 }}>{(name || "?").charAt(0).toUpperCase()}</span>}
    </div>
  );
}

function StatTile({ icon: Icon, value, label, tone, onClick }) {
  const n = useCountUp(value, 800);
  const tones = {
    blue: "from-blue-500 to-blue-600", blue: "from-sky-500 to-indigo-600",
    violet: "from-violet-500 to-fuchsia-600", amber: "from-amber-400 to-orange-500",
  };
  return (
    <button onClick={onClick} className={`${card} group relative overflow-hidden p-4 text-left transition duration-300 hover:-translate-y-1.5 hover:shadow-xl active:scale-95`}>
      <span className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${tones[tone]} opacity-15 transition duration-500 group-hover:scale-150`} />
      <span className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${tones[tone]} text-white shadow-md transition group-hover:rotate-6`}><Icon size={18} /></span>
      <p className="mt-3 text-3xl font-extrabold leading-none tabular-nums text-[#142B49] dark:text-white">{n}</p>
      <p className="mt-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}<ArrowUpRight size={13} className="opacity-0 transition group-hover:opacity-100" /></p>
    </button>
  );
}

/* Modale générique */
function ModalShell({ title, subtitle, icon: Icon, onClose, children, footer, maxWidth = "max-w-2xl" }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B1F33]/70 p-4 backdrop-blur-md" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={`ts-pop flex max-h-[90vh] w-full ${maxWidth} flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,.6)] dark:bg-[#112A3A]`}>
        <div className="relative flex shrink-0 items-center justify-between gap-3 overflow-hidden bg-gradient-to-r from-[#142B49] via-[#1B3557] to-[#243F63] px-6 py-5 text-white">
          <span className="ts-grid pointer-events-none absolute inset-0 opacity-10" />
          <span className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-blue-400/20 blur-2xl" />
          <div className="relative flex items-center gap-3">
            {Icon && <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-blue-300 backdrop-blur"><Icon size={20} /></span>}
            <div>
              <h3 className="text-lg font-extrabold tracking-tight">{title}</h3>
              {subtitle && <p className="text-[11px] text-blue-100/80">{subtitle}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition hover:rotate-90 hover:bg-white/25"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer}
      </div>
    </div>
  );
}

/* ============================================================
   CARTE DE PUBLICATION
============================================================ */
function PostCard({ post, mine, onLike, onShare, onDelete, onEdit, onReport, onPatch, showToast, avatarUrl, sentProposals = [], myApplications = [], onOpenOffer, onApply }) {
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
  const [localLikesCount, setLocalLikesCount] = useState(post.is_job_offer ? 0 : post.likes_count || 0);
  const menuRef = useRef(null);
  const reactionTimeoutRef = useRef(null);

  const isJobOffer = post.is_job_offer || post.type === "offre" || post.type === "offer" || post.type === "job";

  // ✅ On vérifie si on a déjà postulé (Offre d'emploi) ou proposé (Demande)
  const hasApplied = useMemo(() => {
    if (mine) return false;
    const realId = String(post.real_id || post.id).replace(/^(req|job)-/, "");

    if (post.is_job_offer) {
      return (myApplications || []).some((app) => String(app.job_offer_id) === realId);
    }

    if (!sentProposals?.length) return false;
    return sentProposals.some((p) => {
      const ids = [p.resource_request_id, p.resourceRequest?.id, p.resource_request?.id, p.request_id, p.subject_id, p.proposalable_id];
      return ids.some((id) => id != null && String(id) === realId);
    });
  }, [mine, post.real_id, post.id, post.is_job_offer, sentProposals, myApplications]);

  useEffect(() => { setLocalLikesCount(post.likes_count || 0); }, [post.likes_count, post.is_job_offer]);

  useEffect(() => {
    const saved = localStorage.getItem(`reaction_${post.id}`);
    if (saved) setLocalReaction(saved); else setLocalReaction(post.is_liked ? "like" : null);
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
    if (newType && !localReaction) setLocalLikesCount((p) => p + 1);
    else if (!newType && localReaction) setLocalLikesCount((p) => Math.max(0, p - 1));
    if (newType) localStorage.setItem(`reaction_${post.id}`, newType); else localStorage.removeItem(`reaction_${post.id}`);
    if (newType !== null) onLike(post.id, post.real_id || post.id, post.is_job_offer);
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
        showToast(error.response?.status === 403 ? "Vous n'avez pas accès aux commentaires de cette publication." : "Impossible de charger les commentaires", "error");
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
      showToast(error.response?.status === 403 ? "Vous n'êtes pas autorisé à commenter cette publication." : "Impossible d'ajouter le commentaire", "error");
    } finally {
      setSending(false);
    }
  };

  const description = post.description || "";
  const isLong = description.length > 300;
  const shown = isLong && !expanded ? `${description.slice(0, 300)}…` : description;
  const accent = isJobOffer ? "from-violet-500 to-indigo-500" : "from-blue-400 to-blue-600";
  const actionBtn = "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100 active:scale-95 dark:text-slate-300 dark:hover:bg-white/5";

  return (
    <article className={`${card} group/card relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-20px_rgba(11,37,59,.3)]`}>
      <span className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${accent}`} />

      <div className="flex items-start justify-between px-6 pb-2 pt-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`rounded-full bg-gradient-to-tr ${accent} p-[2.5px]`}>
            <Avatar src={author.logo} name={author.name} size={46} fit={author.isTalent ? "cover" : "contain"} className="ring-2 ring-white dark:ring-[#112A3A]" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold text-slate-900 dark:text-white">{author.name}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              {author.subtitle && <><span className="max-w-[160px] truncate">{author.subtitle}</span><span>·</span></>}
              <span>{timeAgo(post.created_at)}</span><Globe size={11} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`hidden rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider sm:inline-block ${isJobOffer ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300" : "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"}`}>
            {isJobOffer ? "Offre d'emploi" : "Demande"}
          </span>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen((o) => !o)} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"><MoreHorizontal size={20} /></button>
            {menuOpen && (
              <div className="ts-pop absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-2xl dark:border-white/10 dark:bg-[#142B49]">
                {mine ? (
                  <>
                    <button onClick={() => { setMenuOpen(false); onEdit(post); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"><Pencil size={14} /> Modifier</button>
                    <button onClick={() => { setMenuOpen(false); setShowDeleteModal(true); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"><Trash2 size={14} /> Supprimer</button>
                  </>
                ) : (
                  <button onClick={() => { setMenuOpen(false); onReport(post); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"><Flag size={14} /> Signaler</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pb-4">
        <h3 className="mb-2 text-lg font-extrabold leading-snug tracking-tight text-slate-900 dark:text-white">{post.title}</h3>
        <p className="whitespace-pre-line text-[14px] leading-relaxed text-slate-600 dark:text-slate-300">{shown}</p>
        {isLong && <button onClick={() => setExpanded((e) => !e)} className="mt-1 text-xs font-bold text-[#243F63] hover:underline dark:text-blue-400">{expanded ? "Voir moins" : "Voir plus"}</button>}

        <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] font-semibold">
          {(post.city || post.country) && <Chip icon={MapPin}>{[post.city, post.country].filter(Boolean).join(", ")}</Chip>}
          {post.remote && <Chip icon={Home}>Télétravail</Chip>}
          {(post.budget_min || post.budget_max) && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
              <Banknote size={13} /> {post.budget_min || 0} - {post.budget_max || 0} € / jour
            </span>
          )}
        </div>

        {post.skills?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.skills.slice(0, 6).map((s, i) => (
              <span key={s.id ?? i} className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">{s.name || s}</span>
            ))}
            {post.skills.length > 6 && <span className="rounded-lg px-2 py-1 text-[11px] font-bold text-slate-400">+{post.skills.length - 6}</span>}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-6 pb-3 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          {localReaction === "love" ? <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm shadow-sm dark:bg-[#142B49]">❤️</span>
            : localReaction === "like" ? <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-sm"><ThumbsUp size={10} fill="currentColor" /></span> : null}
          <span className="font-semibold">{localLikesCount}</span>
        </span>
        <span className="font-medium">{post.comments_count || 0} commentaire(s) · {post.shares_count || 0} partage(s)</span>
      </div>

      <div className="flex items-center gap-1 border-t border-slate-100 px-3 py-2 dark:border-white/5">
        <div className="relative flex-1" onMouseEnter={() => { clearTimeout(reactionTimeoutRef.current); setShowReactions(true); }} onMouseLeave={() => { reactionTimeoutRef.current = setTimeout(() => setShowReactions(false), 500); }}>
          <button onClick={() => handleReactionClick(localReaction === "like" ? null : "like")} className={`${actionBtn} w-full ${localReaction ? "!text-[#1877F2] dark:!text-blue-400" : ""}`}>
            {localReaction === "love" ? <span>❤️ J'adore</span> : <><ThumbsUp size={17} fill={localReaction === "like" ? "currentColor" : "none"} /> J'aime</>}
          </button>
          {showReactions && (
            <div className="ts-pop absolute bottom-full left-0 z-30 mb-1 flex gap-1 rounded-full border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#142B49]">
              <button onClick={() => handleReactionClick("like")} className="flex h-10 w-10 items-center justify-center rounded-full transition hover:scale-125"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1877F2] text-white"><ThumbsUp size={15} fill="currentColor" /></span></button>
              <button onClick={() => handleReactionClick("love")} className="flex h-10 w-10 items-center justify-center rounded-full transition hover:scale-125"><span className="text-2xl">❤️</span></button>
            </div>
          )}
        </div>
        <button onClick={toggleComments} className={`${actionBtn} ${showComments ? "bg-slate-100 dark:bg-white/5" : ""}`}><MessageSquare size={17} /> <span className="hidden sm:inline">Commenter</span></button>
        <button onClick={() => onShare(post)} className={actionBtn}><Share2 size={17} /> <span className="hidden sm:inline">Partager</span></button>

        {!mine && (
          hasApplied ? (
            <span className="inline-flex cursor-default items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-[13px] font-bold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
              <CheckCircle size={16} /> {isJobOffer ? "Candidature envoyée" : "Proposition envoyée"}
            </span>
          ) : (
            <button
              onClick={() => (isJobOffer ? onOpenOffer?.(String(post.real_id || post.id).replace(/^job-/, "")) : onApply(post))}
              className={`group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg active:scale-95 ${
                isJobOffer ? "bg-[#142B49] hover:bg-[#243F63]" : "bg-gradient-to-r from-[#243F63] to-[#162D4A]"
              }`}
            >
              <Send size={15} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              {isJobOffer ? "Voir l'offre" : "Proposer"}
            </button>
          )
        )}
      </div>

      {showComments && (
        <div className="ts-pop space-y-4 border-t border-slate-100 bg-slate-50/60 p-5 dark:border-white/5 dark:bg-white/5">
          <form onSubmit={sendComment} className="flex items-center gap-3">
            <Avatar src={avatarUrl} name="Moi" size={36} />
            <input value={newComment} onChange={(e) => setNewComment(e.target.value)} maxLength={2000} placeholder="Écrire un commentaire..."
              className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:shadow-[0_0_0_4px_rgba(36,63,99,.10)] dark:border-white/10 dark:bg-[#142B49] dark:text-white dark:placeholder:text-slate-500" />
            <button type="submit" disabled={!newComment.trim() || sending} className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#243F63] to-[#162D4A] text-white transition hover:scale-110 disabled:opacity-50">
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
          {loadingComments ? (
            <div className="flex justify-center py-3"><Loader2 size={20} className="animate-spin text-[#243F63]" /></div>
          ) : comments?.length === 0 ? (
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">Soyez le premier à commenter.</p>
          ) : (
            <div className="mt-2 space-y-3">
              {comments?.map((c) => (
                <div key={c.id} className="ts-rise flex items-start gap-3">
                  <Avatar src={fileUrl(c.user?.professional_profile?.avatar_path || c.user?.professionalProfile?.avatar_path || c.user?.avatar_path)} name={c.user?.name} size={36} />
                  <div className="min-w-0 rounded-2xl rounded-tl-md bg-white px-4 py-2.5 shadow-sm ring-1 ring-slate-100 dark:bg-[#142B49] dark:ring-white/5">
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
          <div className="ts-pop w-full max-w-sm space-y-4 rounded-3xl bg-white p-7 text-center shadow-2xl dark:bg-[#112A3A]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"><Trash2 size={26} /></div>
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

function Chip({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
      <Icon size={13} className="text-blue-500" /> {children}
    </span>
  );
}

/* ============================================================
   SUIVI D'ACTIVITÉ (timeline)
============================================================ */
function ActivityOverview({ items, filter, onFilter }) {
  const filters = [
    { id: "all", label: "Tout" }, { id: "proposals", label: "Propositions" },
    { id: "missions", label: "Missions" }, { id: "requests", label: "Besoins" },
  ];
  const filtered = filter === "all" ? items : items.filter((item) => item.kind === filter);
  const statusLabels = {
    pending: "En attente", sent: "Envoyée", accepted: "Acceptée", rejected: "Refusée", active: "En cours",
    completed: "Terminée", draft: "Brouillon", published: "Publiée", paused: "En pause", closed: "Fermée",
    filled: "Pourvue", expired: "Expirée", "envoyée": "Envoyée", "à traiter": "À traiter", "en attente": "En attente",
  };

  return (
    <section className={`${card} overflow-hidden`}>
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
        <div>
          <h2 className="text-base font-extrabold text-[#142B49] dark:text-white">Suivi de votre activité</h2>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Propositions, missions et besoins issus de vos données.</p>
        </div>
        <div className="ts-noscroll flex gap-1 overflow-x-auto rounded-full bg-slate-100 p-1 dark:bg-white/5" role="tablist">
          {filters.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} onClick={() => onFilter(item.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition active:scale-95 ${filter === item.id ? "bg-[#142B49] text-white shadow-sm dark:bg-blue-500" : "text-slate-500 hover:text-[#142B49] dark:text-slate-400 dark:hover:text-white"}`}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <span className="ts-float mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10"><Clock size={22} /></span>
          <p className="text-sm font-semibold text-[#405B73] dark:text-slate-300">Aucune activité dans cette catégorie</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Les nouveaux éléments apparaîtront ici lorsqu'ils seront disponibles.</p>
        </div>
      ) : (
        <ol className="relative px-5 py-4">
          <span className="absolute bottom-6 left-[34px] top-6 w-px bg-gradient-to-b from-blue-300 via-slate-200 to-transparent dark:from-blue-500/40 dark:via-white/10" />
          {filtered.slice(0, 8).map((item, i) => {
            const status = String(item.status || "").toLowerCase();
            const positive = ["accepted", "active", "completed", "published", "envoyée"].includes(status);
            const waiting = ["pending", "sent", "draft", "à traiter", "en attente"].includes(status);
            return (
              <li key={item.id} className="ts-rise relative" style={{ animationDelay: `${i * 50}ms` }}>
                <Link to={getTargetUrl(item)} className="group flex items-start gap-4 rounded-2xl p-3 transition hover:bg-slate-50 dark:hover:bg-white/5">
                <span className={`relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full shadow-sm ${positive ? "bg-blue-500" : waiting ? "bg-amber-500" : "bg-slate-400"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 text-[10px]">
                      <span className="font-extrabold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-400">{item.label}</span>
                      {item.counterpart && <span className="truncate text-slate-500 dark:text-slate-400">· {item.counterpart}</span>}
                    </div>
                    <h3 className="mt-0.5 truncate text-sm font-bold text-slate-800 transition group-hover:text-blue-700 dark:text-slate-200 dark:group-hover:text-blue-400">{item.title}</h3>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${positive ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : waiting ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400"}`}>
                      {statusLabels[status] || item.status || "Statut non renseigné"}
                    </span>
                    <time className="text-[10px] text-slate-400 dark:text-slate-500">{timeAgo(item.date) || "Date non renseignée"}</time>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}

      {filter === "missions" && filtered.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-center dark:border-white/10 dark:bg-white/5">
          <Link to="/missions" className="text-[12px] font-bold text-[#243F63] hover:underline dark:text-blue-400">Voir toutes les missions →</Link>
        </div>
      )}
    </section>
  );
}

/* ============================================================
   ANNUAIRE ENTREPRISES
============================================================ */
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
      return [company.name, sectorOf(company), company.city, company.country, company.description]
        .some((value) => String(value || "").toLowerCase().includes(query));
    });
  }, [companies, search, sector, onlyVerified]);

  const verifiedCount = companies.filter((company) => company.is_verified).length;
  const hasFilters = Boolean(search.trim()) || sector !== "all" || onlyVerified;
  const reset = () => { setSearch(""); setSector("all"); setOnlyVerified(false); };

  const filterClass = (active) =>
    `shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition ${active
      ? "border-[#243F63] bg-[#243F63] text-white"
      : "border-slate-200 bg-white text-slate-600 hover:border-[#9AAAC0] hover:text-[#142B49] dark:border-white/10 dark:bg-[#142B49] dark:text-slate-300"}`;

  return (
    <div className="space-y-6 font-sans">
      {/* En-tête du réseau */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_28px_-20px_rgba(20,43,73,.35)] dark:border-white/10 dark:bg-[#142B49]">
        <div className="border-b border-slate-100 bg-gradient-to-r from-[#F5F7FB] via-white to-[#EEF2F8] px-5 py-6 sm:px-7 dark:border-white/10 dark:from-[#172F50] dark:via-[#142B49] dark:to-[#1B3557]">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#647A98] dark:text-blue-200">Écosystème TalentShare</p>
          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#142B49] dark:text-white sm:text-[28px]">Le réseau des entreprises</h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">Explorez les organisations, découvrez leurs domaines d'activité et accédez à leurs opportunités.</p>
            </div>
            <div className="flex gap-5 sm:gap-6">
              <div><p className="text-2xl font-bold tabular-nums text-[#142B49] dark:text-white">{companies.length}</p><p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Entreprises</p></div>
              <div className="h-9 w-px bg-slate-200 dark:bg-white/10" />
              <div><p className="text-2xl font-bold tabular-nums text-[#142B49] dark:text-white">{verifiedCount}</p><p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Vérifiées</p></div>
              <div className="h-9 w-px bg-slate-200 dark:bg-white/10" />
              <div><p className="text-2xl font-bold tabular-nums text-[#142B49] dark:text-white">{sectors.length}</p><p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Secteurs</p></div>
            </div>
          </div>
        </div>

        {/* Recherche et filtres */}
        <div className="space-y-4 p-4 sm:p-5">
          <label className="group relative block">
            <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#243F63]" />
            <input ref={searchRef} type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher par nom, secteur ou localisation…" aria-label="Rechercher une entreprise"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3.5 pl-11 pr-11 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#8295B0] focus:bg-white focus:ring-4 focus:ring-[#243F63]/[.07] dark:border-white/10 dark:bg-[#0F2340] dark:text-white dark:placeholder:text-slate-500" />
            {search ? <button type="button" onClick={() => setSearch("")} aria-label="Effacer la recherche" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"><X size={14} /></button> : <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-[10px] text-slate-400 sm:block dark:border-white/10 dark:bg-white/5">/</kbd>}
          </label>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="ts-noscroll flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setSector("all")} aria-pressed={sector === "all"} className={filterClass(sector === "all")}>Tous les secteurs <span className="ml-1 opacity-70">{companies.length}</span></button>
              {sectors.map(([name, count]) => <button key={name} type="button" onClick={() => setSector(sector === name ? "all" : name)} aria-pressed={sector === name} className={filterClass(sector === name)}>{name}<span className="ml-1 opacity-65">{count}</span></button>)}
            </div>
            <button type="button" onClick={() => setOnlyVerified((value) => !value)} aria-pressed={onlyVerified} className={`inline-flex w-fit items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${onlyVerified ? "border-[#243F63] bg-[#243F63]/[.06] text-[#142B49] dark:border-blue-300 dark:bg-blue-300/10 dark:text-blue-100" : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"}`}>
              <CheckCircle size={14} /> Entreprises vérifiées
            </button>
          </div>
        </div>
      </section>

      {/* Résultats */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1" aria-live="polite">
        <div><h3 className="text-base font-bold text-[#142B49] dark:text-white">Entreprises à découvrir</h3><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}{hasFilters ? ` sur ${companies.length}` : " dans votre réseau"}</p></div>
        {hasFilters && <button type="button" onClick={reset} className="text-xs font-semibold text-[#536D91] transition hover:text-[#142B49] hover:underline dark:text-blue-200"><RotateCcw size={12} className="mr-1 inline" />Réinitialiser les filtres</button>}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-white/10 dark:bg-[#142B49]">
          <Building2 size={25} className="mx-auto text-[#8091A9]" />
          <p className="mt-4 text-sm font-bold text-[#142B49] dark:text-white">Aucune entreprise trouvée</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">Modifiez votre recherche ou retirez certains filtres pour afficher davantage de résultats.</p>
          {hasFilters && <button type="button" onClick={reset} className="mt-4 rounded-lg bg-[#243F63] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#142B49]">Effacer les filtres</button>}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((company, index) => <CompanyCard key={company.id} company={company} index={index} onSelect={onSelect} />)}
        </div>
      )}
    </div>
  );
}

function CompanyCard({ company, index, onSelect }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const sector = sectorOf(company);
  const location = [company.city, company.country].filter(Boolean).join(", ");
  const logo = !logoFailed ? company.logo_url || fileUrl(company.logo_path) : null;
  const initial = (company.name || "?").charAt(0).toUpperCase();

  return (
    <button type="button" onClick={() => onSelect?.(company)} aria-label={`Voir le profil de ${company.name}`} style={{ animationDelay: `${Math.min(index, 10) * 45}ms` }}
      className="ts-rise group flex h-full min-h-[238px] w-full flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-[0_5px_18px_-15px_rgba(20,43,73,.35)] transition duration-200 hover:-translate-y-1 hover:border-[#AAB8CA] hover:shadow-[0_16px_32px_-20px_rgba(20,43,73,.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#536D91] dark:border-white/10 dark:bg-[#142B49] dark:hover:border-blue-300/40">
      <div className="flex w-full items-start gap-3">
        <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1.5 dark:border-white/10 dark:bg-white/5">
          {logo ? <img src={logo} alt={`Logo ${company.name}`} onError={() => setLogoFailed(true)} className="h-full w-full object-contain" /> : <span className="flex h-full w-full items-center justify-center rounded-lg bg-[#243F63] text-xl font-bold text-white">{initial}</span>}
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <h4 className="line-clamp-2 text-sm font-bold leading-5 text-[#142B49] transition-colors group-hover:text-[#536D91] dark:text-white">{company.name || "Entreprise"}</h4>
          {sector && <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">{sector}</p>}
        </div>
        {company.is_verified && <span title="Entreprise vérifiée" className="mt-1 shrink-0 rounded-md bg-[#EDF2F8] px-2 py-1 text-[10px] font-semibold text-[#304F78] dark:bg-blue-300/10 dark:text-blue-200">Vérifiée</span>}
      </div>

      <p className="mt-4 line-clamp-3 min-h-[54px] text-xs leading-[19px] text-slate-500 dark:text-slate-300">{company.description || "Découvrez cette organisation et les opportunités qu'elle propose sur TalentShare."}</p>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-white/10">
        <span className="min-w-0 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">{location || "Localisation non renseignée"}</span>
        <span className="shrink-0 text-xs font-semibold text-[#243F63] transition group-hover:translate-x-0.5 dark:text-blue-200">Voir le profil <ArrowUpRight size={13} className="ml-1 inline" /></span>
      </div>
    </button>
  );
}

/* ============================================================
   MODALES
============================================================ */
function HistoryModal({ type, sent, received, missions, onClose }) {
  const isSent = type === "sent";
  const isMissions = type === "missions";
  const data = isSent ? sent : type === "received" ? received : missions;
  const title = isSent ? "Candidatures envoyées" : type === "received" ? "Propositions reçues" : "Missions";
  const statusFr = { planned: "Acceptée", active: "En cours", completed: "Terminée", cancelled: "Annulée", pending_employee: "En attente" };

  return (
    <ModalShell title={title} subtitle={`${data.length} élément(s)`} icon={isMissions ? Briefcase : isSent ? Send : Inbox} onClose={onClose}>
      <div className="space-y-3 p-5">
        {data.length === 0 ? <EmptyState emoji="📭" text="Aucun élément pour le moment." /> : data.map((item, i) => {
          const date = formatShortDate(item.created_at || item.start_at);
          if (isMissions) {
            return (
              <div key={item.id} className="ts-rise rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-white/10" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="text-sm font-bold text-[#142B49] dark:text-white">{getMissionTitle(item)}</span>
                  <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">{statusFr[item.status] || item.status}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Avec : {item.requesting_company?.name || item.requestingCompany?.name || item.supplying_company?.name || "N/A"}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Début : {date}</p>
                <Link to={`/missions/${item.id}`} className="mt-3 inline-block text-xs font-bold text-[#243F63] hover:underline dark:text-blue-400">Voir la mission →</Link>
              </div>
            );
          }
          return (
            <div key={item.id} className="ts-rise rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-white/10" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="text-sm font-bold text-[#142B49] dark:text-white">{item.title || item.resource_request?.title || "Sans titre"}</span>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${item.status === "accepted" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : item.status === "declined" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400" : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"}`}>{item.status_label || item.status}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{isSent ? `À : ${item.to_company?.name || item.resource_request?.company?.name || "Entreprise"}` : `De : ${item.proposing_company?.name || item.profile?.user?.name || "Talent"}`}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Le {date}</p>
              <Link to={`/proposals/${item.id}`} className="mt-3 inline-block text-xs font-bold text-[#243F63] hover:underline dark:text-blue-400">Voir le détail →</Link>
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}

const CONTRACT_CHOICES = [
  { id: "stage", label: "Stage", hint: "Durée déterminée", icon: GraduationCap, color: "bg-gradient-to-br from-blue-400 to-blue-600" },
  { id: "alternance", label: "Alternance", hint: "Durée déterminée", icon: RotateCcw, color: "bg-gradient-to-br from-sky-400 to-indigo-600" },
  { id: "emploi", label: "Emploi", hint: "CDI · essai d'1 mois", icon: Briefcase, color: "bg-gradient-to-br from-violet-400 to-fuchsia-600" },
  { id: "mission", label: "Mission freelance", hint: "Ponctuelle", icon: Rocket, color: "bg-gradient-to-br from-amber-400 to-orange-500" },
];

function CreateRequestModal({ onClose, onPublish, user, isCompany, publishing, preset = "stage" }) {
  const [form, setForm] = useState({
    title: "", description: "", type: "Mission", contract_type: preset,
    city: user?.city || user?.professional_profile?.city || "",
    budget_min: "", budget_max: "", remote: false,
    start_at: new Date().toISOString().split("T")[0], end_at: "",
  });
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const isJob = form.contract_type === "emploi";

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    onPublish({
      title: form.title.trim(), description: form.description.trim(), type: form.type.toLowerCase(),
      contract_type: form.contract_type, status: "published", author_type: isCompany ? "company" : "talent",
      workload_percent: 100, remote: form.remote, urgency: "normal", positions_count: 1,
      company_id: isCompany ? user?.companies?.[0]?.id : null, city: form.city,
      budget_min: form.budget_min ? Number(form.budget_min) : null,
      budget_max: form.budget_max ? Number(form.budget_max) : null,
      start_at: form.start_at || today.toISOString().split("T")[0],
      end_at: isJob ? null : form.end_at || nextMonth.toISOString().split("T")[0],
    });
  };

  const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-[#142B49] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-500";
  const labelClass = "mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B1F33]/70 p-4 backdrop-blur-md" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="ts-pop flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,.6)] dark:bg-[#112A3A]">
        <div className="relative flex items-center justify-between gap-3 overflow-hidden bg-gradient-to-r from-[#142B49] via-[#1B3557] to-[#243F63] px-6 py-5 text-white">
          <span className="ts-grid pointer-events-none absolute inset-0 opacity-10" />
          <span className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-blue-400/20 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-blue-300 backdrop-blur"><Plus size={20} /></span>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight">Publier un besoin</h3>
              <p className="text-[11px] text-blue-100/80">Décrivez votre projet à la communauté.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition hover:rotate-90 hover:bg-white/20"><X size={18} /></button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <div>
            <label className={labelClass}>{isCompany ? "Type de contrat proposé *" : "Je recherche *"}</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CONTRACT_CHOICES.map((c) => {
                const on = form.contract_type === c.id;
                return (
                  <button key={c.id} type="button" onClick={() => update("contract_type", c.id)}
                    className={`group rounded-2xl border px-3 py-3 text-left transition active:scale-95 ${on ? "border-blue-500 bg-blue-50 shadow-[0_0_0_3px_rgba(20,184,166,.15)] dark:border-blue-500 dark:bg-blue-500/10" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-300 dark:border-white/10 dark:bg-[#142B49]"}`}>
                    <span className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg text-white ${c.color}`}><c.icon size={15} /></span>
                    <p className={`text-xs font-bold ${on ? "text-blue-700 dark:text-blue-400" : "text-slate-800 dark:text-slate-200"}`}>{c.label}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">{c.hint}</p>
                  </button>
                );
              })}
            </div>
            {isJob && <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Si un entretien est validé : période d'essai d'1 mois, puis CDI (sans date de fin).</p>}
          </div>

          <div className="flex gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-white/5">
            {["Mission", "Proposition", "Talent"].map((t) => (
              <button key={t} type="button" onClick={() => update("type", t)} className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${form.type === t ? "bg-white text-slate-900 shadow-sm dark:bg-[#142B49] dark:text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}>{t}</button>
            ))}
          </div>

          <div>
            <label className={labelClass}>Titre du besoin *</label>
            <input value={form.title} onChange={(e) => update("title", e.target.value)} required maxLength={100} className={inputClass} placeholder={isJob ? "Ex: Recherche CDI développeur React" : "Ex: Recherche stage en design UI/UX"} />
            <p className="mt-1 text-right text-[10px] text-slate-400">{form.title.length}/100</p>
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
            {!isJob && (
              <div>
                <label className={labelClass}>Fin (optionnel)</label>
                <input type="date" value={form.end_at} onChange={(e) => update("end_at", e.target.value)} className={inputClass} />
              </div>
            )}
          </div>

          <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${form.remote ? "border-blue-200 bg-blue-50/50 dark:border-blue-500/30 dark:bg-blue-500/10" : "border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-[#142B49] dark:hover:bg-white/5"}`}>
            <input type="checkbox" checked={form.remote} onChange={(e) => update("remote", e.target.checked)} className="h-4 w-4 accent-blue-600 dark:accent-blue-500" />
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-white">Télétravail possible</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Le poste peut être effectué à distance.</p>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 p-5 dark:border-white/10 dark:bg-white/5">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:bg-transparent dark:text-slate-300 dark:hover:bg-white/5">Annuler</button>
          <button type="submit" disabled={publishing || !form.title.trim() || !form.description.trim()} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#243F63] to-[#162D4A] px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">
            {publishing ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
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
  const input = "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-[#142B49] dark:text-white";

  return (
    <ModalShell title="Modifier la publication" subtitle="Ajustez le titre et la description" icon={Pencil} onClose={onClose} maxWidth="max-w-lg">
      <form onSubmit={submit} className="space-y-4 p-6">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-400">Titre</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={255} className={input} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-400">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={6} className={`${input} resize-y`} />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">Annuler</button>
          <button type="submit" disabled={saving || !title.trim() || !description.trim()} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#243F63] to-[#162D4A] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:-translate-y-0.5 disabled:opacity-50">
            {saving && <Loader2 size={14} className="animate-spin" />} Enregistrer
          </button>
        </div>
      </form>
    </ModalShell>
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

  useEffect(() => { if (firstRun.current) { firstRun.current = false; return; } setIndex(0); }, [query]);

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
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0B1F33]/95 backdrop-blur-xl">
      {author?.logo && <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url(${author.logo})`, filter: "blur(70px)", transform: "scale(1.3)" }} />}

      <div className="relative z-50 bg-black/30 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          {author ? (
            <div className="flex items-center gap-3">
              <Avatar src={author.logo} name={author.name} size={40} />
              <div><p className="text-sm font-bold text-white">{author.name}</p><p className="max-w-[260px] truncate text-xs text-white/70">{current.title}</p></div>
            </div>
          ) : <h2 className="font-bold text-white">Recherche</h2>}
          <div className="flex items-center gap-3">
            {list.length > 0 && <span className="hidden rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/80 sm:block">{Math.min(index + 1, list.length)} / {list.length}</span>}
            <button onClick={onClose} className="rounded-full p-2 text-white transition hover:rotate-90 hover:bg-white/20"><X size={24} /></button>
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une demande..." className="w-full rounded-xl border border-white/10 bg-white/10 py-2 pl-9 pr-4 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#243F63]" />
          </div>
        </div>
      </div>

      {current ? (
        <>
          <div className="relative z-10 flex gap-1.5 px-4 pt-3">
            {list.map((_, i) => <button key={i} onClick={() => setIndex(i)} className={`h-1 flex-1 rounded-full transition-all ${i === index ? "bg-[#243F63]" : i < index ? "bg-white/60" : "bg-white/25"}`} />)}
          </div>

          <div className="relative z-10 flex flex-1 items-center justify-center gap-3 overflow-y-auto p-4">
            <button onClick={prev} aria-label="Précédent" className="hidden shrink-0 rounded-full bg-white/10 p-3 text-white transition hover:scale-110 hover:bg-white/25 sm:block"><ChevronLeft size={24} /></button>

            <div key={current.id} className="ts-pop my-auto w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl dark:bg-[#112A3A]">
              <div className="flex h-28 w-full items-center justify-center border-b border-slate-100 bg-gradient-to-br from-blue-50 to-blue-50 dark:border-white/10 dark:from-white/5 dark:to-white/5">
                {author.logo ? <img src={author.logo} alt="" className="h-full w-full object-contain p-4" /> : <span className="text-4xl font-extrabold text-slate-300 dark:text-slate-600">{author.name.charAt(0)}</span>}
              </div>
              <div className="p-6">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-extrabold leading-tight text-[#142B49] dark:text-white">{current.title}</h1>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{author.name}{(current.city || current.country) && ` · ${[current.city, current.country].filter(Boolean).join(", ")}`}</p>
                  </div>
                  {current.match_score > 0 && <MatchCircle score={current.match_score} />}
                </div>
                <p className="mb-4 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">{current.description}</p>
                {current.skills?.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {current.skills.slice(0, 6).map((s, i) => <span key={s.id ?? i} className="rounded-md border border-blue-100 bg-[#EDF2F8] px-2 py-1 text-[10px] font-bold text-[#243F63] dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">{s.name || s}</span>)}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <button onClick={() => onToggleFavorite(current.id)} className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition active:scale-95 ${isFav ? "border border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"}`}>
                      <Heart size={14} fill={isFav ? "currentColor" : "none"} /> {isFav ? "Sauvegardé" : "Sauvegarder"}
                    </button>
                    {(current.budget_min || current.budget_max) && <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-[#142B49] dark:bg-white/5 dark:text-slate-300">{current.budget_min || 0} - {current.budget_max || 0} € / jour</span>}
                  </div>
                  <Link to={`/resource-requests/${current.real_id || current.id}`} className="flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-[#243F63] to-[#162D4A] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:-translate-y-0.5">
                    Proposer ma candidature <ArrowUpRight size={14} />
                  </Link>
                </div>
              </div>
            </div>

            <button onClick={next} aria-label="Suivant" className="hidden shrink-0 rounded-full bg-white/10 p-3 text-white transition hover:scale-110 hover:bg-white/25 sm:block"><ChevronRight size={24} /></button>
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
          <circle cx="24" cy="24" r={radius} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset .6s ease" }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[12px] font-extrabold" style={{ color }}>{score}%</span>
      </div>
      <div className="hidden min-w-0 leading-tight sm:block">
        <p className="text-[10.5px] font-extrabold text-[#142B49] dark:text-white">Compatibilité</p>
        <p className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">{sublabel}</p>
      </div>
    </div>
  );
}

function FavoritesModal({ allRequests, favorites, onClose, onToggleFavorite }) {
  const favoriteRequests = useMemo(() => allRequests.filter((r) => favorites.includes(r.id)), [allRequests, favorites]);
  return (
    <ModalShell title="Mes favoris" subtitle={`${favoriteRequests.length} demande(s) sauvegardée(s)`} icon={Heart} onClose={onClose}>
      <div className="space-y-3 p-5">
        {favoriteRequests.length === 0 ? <div className="py-10 text-center"><EmptyState emoji="💔" text="Vous n'avez pas encore de favoris." /></div> : favoriteRequests.map((req) => {
          const a = getAuthor(req);
          return (
            <div key={req.id} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#142B49]">
              <Avatar src={a.logo} name={a.name} size={48} rounded="rounded-xl" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white">{req.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{a.name}{req.city && ` · ${req.city}`}</p>
                  </div>
                  <button onClick={() => onToggleFavorite(req.id)} className="shrink-0 rounded-lg p-1.5 text-rose-500 transition hover:scale-110 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Heart size={16} fill="currentColor" /></button>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{req.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">{req.match_score ? `${req.match_score}% Match` : "Nouveau"}</span>
                  <Link to={`/resource-requests/${req.real_id || req.id}`} className="text-xs font-bold text-[#142B49] hover:underline dark:text-slate-200 dark:hover:text-blue-400">Voir →</Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
}

function SavedOffersModal({ savedOffers, onClose, onToggleSavedOffer, onSelectOffer }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (savedOffers.length === 0) { setOffers([]); setLoading(false); return; }
    setLoading(true);
    Promise.all(savedOffers.map((id) => api.get(`/job-offers/${id}`).then((res) => res.data?.data || res.data).catch(() => null)))
      .then((results) => setOffers(results.filter(Boolean)))
      .finally(() => setLoading(false));
  }, [savedOffers]);

  return (
    <ModalShell title="Offres sauvegardées" subtitle={`${offers.length} offre(s) enregistrée(s)`} icon={Bookmark} onClose={onClose}>
      <div className="space-y-3 p-5">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#243F63]" size={32} /></div>
        ) : offers.length === 0 ? (
          <div className="py-10 text-center">
            <EmptyState emoji="💔" text="Vous n'avez pas encore d'offres sauvegardées." />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Cliquez sur le cœur d'une offre pour la sauvegarder ici.</p>
          </div>
        ) : offers.map((o) => (
          <div key={o.id} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#142B49]">
            <Avatar src={fileUrl(o.company?.logo_path)} name={o.company?.name} size={48} rounded="rounded-xl" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white">{o.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{o.company?.name}{o.city && ` · ${o.city}`}</p>
                </div>
                <button onClick={() => onToggleSavedOffer(o.id)} className="shrink-0 rounded-lg p-1.5 text-rose-500 transition hover:scale-110 hover:bg-rose-50 dark:hover:bg-rose-500/10" title="Retirer des favoris"><Heart size={16} fill="currentColor" /></button>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{o.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="rounded border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">{OFFER_TYPES[o.offer_type] || "Offre"}</span>
                <button onClick={() => onSelectOffer(o.id)} className="text-xs font-bold text-[#142B49] hover:underline dark:text-slate-200 dark:hover:text-blue-400">Voir l'offre →</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

function CompanyModal({ company, onClose, showJobs = true }) {
  const { user } = useAuth();
  const [details, setDetails] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("about");

  useEffect(() => {
    let cancelled = false;

    setLoading(true);

    Promise.all([
      api.get(`/companies/${company.id}`).then((res) => res.data?.data || res.data).catch(() => company),
      showJobs ? api.get(`/job-offers?company_id=${company.id}`).then((res) => asArray(res.data)).catch(() => []) : Promise.resolve([]),
    ])
      .then(([companyData, jobsData]) => {
        if (cancelled) return;
        setDetails(companyData);
        setJobs(jobsData);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [company.id, showJobs]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const data = details || company;
  const gradient = GRADIENTS[hash(data.name || "company") % GRADIENTS.length];

  const isEmployee = user?.companies?.some(
    (item) => Number(item.id) === Number(data.id)
  );

  const location = [data.city, data.country].filter(Boolean).join(", ");

  const tabs = [
    { id: "about", label: "À propos", icon: Building2 },
    ...(showJobs ? [{ id: "jobs", label: "Offres d'emploi", icon: Briefcase, count: jobs.length }] : []),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F33]/65 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="company-modal-title"
        className="ts-pop flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="relative shrink-0 overflow-hidden border-b border-slate-100 bg-white">
          <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-[0.06]`} />

          <div className="relative flex items-start gap-4 px-5 py-5 sm:px-7 sm:py-6">
            <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm sm:h-20 sm:w-20">
              <img
                src={fileUrl(data.logo_path)}
                alt={`Logo ${data.name || "entreprise"}`}
                className="h-full w-full rounded-xl object-contain"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src =
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || "?")}&background=087C68&color=fff&bold=true`;
                }}
              />
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="company-modal-title"
                  className="break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
                >
                  {data.name || "Entreprise"}
                </h2>

                {isEmployee && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                    <UserRound size={13} />
                    Membre de l'équipe
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                {location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={15} className="shrink-0 text-blue-700" />
                    {location}
                  </span>
                )}

                {data.website && (
                  <a
                    href={
                      data.website.startsWith("http")
                        ? data.website
                        : `https://${data.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-blue-700 transition hover:text-blue-900 hover:underline"
                  >
                    <Globe size={14} />
                    Site web
                    <ArrowUpRight size={13} />
                  </a>
                )}
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Espace entreprise
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer la fenêtre"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <nav
          aria-label="Sections de l'entreprise"
          className="flex shrink-0 gap-1 border-b border-slate-200 bg-slate-50/80 px-5 sm:px-7"
        >
          {tabs.map(({ id, label, icon: Icon, count }) => {
            const active = activeTab === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center gap-2 border-b-2 px-3 py-4 text-sm font-semibold transition sm:px-4 ${
                  active
                    ? "border-blue-600 text-blue-800"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>

                {count !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      active
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <main className="min-h-0 flex-1 overflow-y-auto bg-white p-5 sm:p-7">
          {loading ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-blue-600" size={30} />
              <p className="text-sm text-slate-500">
                Chargement des informations...
              </p>
            </div>
          ) : (
            <>
              {activeTab === "about" && (
                <div className="animate-fadeIn space-y-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                      Présentation
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">
                      Découvrez l'entreprise
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Informations et présentation de cette organisation.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        <Building2 size={19} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">
                          À propos de {data.name || "l'entreprise"}
                        </h4>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Présentation générale
                        </p>
                      </div>
                    </div>

                    <p className="whitespace-pre-line break-words text-sm leading-7 text-slate-600">
                      {data.description ||
                        "Aucune description n'a été renseignée pour cette entreprise pour le moment."}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                      <MapPin size={18} className="mt-0.5 shrink-0 text-blue-700" />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500">Localisation</p>
                        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                          {location || "Non renseignée"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "jobs" && showJobs && (
                <div className="animate-fadeIn space-y-5">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                        Recrutement
                      </p>
                      <h3 className="mt-1 text-xl font-bold text-slate-900">
                        Offres d'emploi
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Les opportunités proposées par {data.name}.
                      </p>
                    </div>

                    <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                      {jobs.length} résultat{jobs.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  {jobs.length === 0 ? (
                    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                        <Briefcase size={23} />
                      </div>
                      <h4 className="mt-4 text-sm font-bold text-slate-800">
                        Aucune offre pour le moment
                      </h4>
                      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                        Cette entreprise n'a pas publié d'offre disponible actuellement.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {jobs.map((job) => (
                        <Link
                          key={job.id}
                          to={`/job-offers/${job.id}`}
                          onClick={onClose}
                          className="group flex min-h-40 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-900/5"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-800">
                                {OFFER_TYPES[job.offer_type] || "Emploi"}
                              </span>
                              <ArrowUpRight
                                size={16}
                                className="shrink-0 text-slate-400 transition group-hover:text-blue-700"
                              />
                            </div>

                            <h4 className="mt-3 break-words text-sm font-bold leading-6 text-slate-900 transition group-hover:text-blue-800">
                              {job.title || "Offre sans titre"}
                            </h4>
                          </div>

                          <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500">
                            <MapPin size={13} className="shrink-0 text-blue-700" />
                            <span className="truncate">
                              {job.city || "Localisation non précisée"}
                            </span>
                            <span className="ml-auto shrink-0 font-semibold text-blue-700">
                              Voir l'offre
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-white px-5 py-3 sm:px-7">
          <span className="text-xs text-slate-400">
            TalentShare · Espace entreprise
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            Fermer
          </button>
        </footer>
      </section>
    </div>
  );
}