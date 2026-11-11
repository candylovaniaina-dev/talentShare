import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import {
  Handshake, Briefcase, Send, Target, Search, Heart, Loader2, Bookmark, Building2, Plus,
  ChevronLeft, TrendingUp, Clock, AlertCircle, X, Globe, Banknote,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import JobOfferDetail from "./JobOfferDetail";
import ApplyToRequestModal from "../components/requests/ApplyToRequestModal";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  STYLES, card, btnPrimary, Avatar, Empty, asArray, fileUrl, timeAgo, getAuthor, getMissionTitle,
  GRADIENTS, hash, useCountUp, useNow,
} from "../components/activity/shared";
import {
  buildAgenda, buildWeeklyReport, buildSkillGaps, upcomingEvents, nextInterviewOf, splitProposals, weekId,
} from "../components/activity/insights";
import PostCard from "../components/activity/PostCard";
import RadarStrip from "../components/activity/RadarStrip";
import WeeklyReport, { GoalsMini } from "../components/activity/WeeklyReport";
import AgendaPanel, { AgendaMini, NextEvent, ReminderBanner } from "../components/activity/AgendaPanel";
import SkillGaps, { SkillGapMini } from "../components/activity/SkillGaps";
import { CompaniesTab, CompanyModal } from "../components/activity/Network";
import {
  HistoryModal, CreateRequestModal, EditPostModal, FavoritesModal, SavedOffersModal, CONTRACT_CHOICES,
} from "../components/activity/Modals";

/* ============================================================
   CONFIG
============================================================ */
const TABS = [
  { id: "home", label: "Accueil" },
  { id: "profile", label: "Mon espace" },
  { id: "companies", label: "Réseau" },
];
const SECTIONS = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "report", label: "Rapport" },
  { id: "agenda", label: "Agenda" },
  { id: "skills", label: "Compétences" },
  { id: "activity", label: "Activité" },
];

const readJson = (key, fallback) => {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; }
};

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

const getTargetUrl = (item) => {
  const realId = item.id.split("-")[1];
  if (item.kind === "missions") return `/missions/${realId}`;
  if (item.kind === "proposals") return `/proposals/${realId}`;
  if (item.kind === "applications") return `/applications/${realId}`;
  if (item.kind === "requests") return `/resource-requests/${realId}`;
  return "#";
};

function KindIcon({ kind, size = 14 }) {
  const I = kind === "missions" ? Briefcase : kind === "proposals" ? Handshake : kind === "applications" ? Send : Target;
  return <I size={size} />;
}

function MiniStat({ value, label }) {
  const n = useCountUp(value, 600);
  return (
    <div>
      <p className="text-lg font-semibold tabular-nums text-slate-800 dark:text-white">{n}</p>
      <p className="text-[10px] text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function StatTile({ icon: Icon, value, label, tone, onClick }) {
  const n = useCountUp(value, 700);
  const tones = {
    blue: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-300",
    violet: "bg-violet-50 text-violet-500 dark:bg-violet-500/10 dark:text-violet-300",
    teal: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300",
    amber: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-300",
  };
  return (
    <button onClick={onClick} className={`${card} p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-16px_rgba(16,42,67,0.2)]`}>
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}><Icon size={17} /></span>
      <p className="mt-3 text-2xl font-semibold leading-none tabular-nums text-slate-800 dark:text-white">{n}</p>
      <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">{label}</p>
    </button>
  );
}

/* ---------- Suivi d'activité (timeline) ---------- */
function ActivityOverview({ items, filter, onFilter, limit = 8, showFilters = true }) {
  const filters = [
    { id: "all", label: "Tout" }, { id: "applications", label: "Candidatures" }, { id: "proposals", label: "Propositions" },
    { id: "missions", label: "Missions" }, { id: "requests", label: "Besoins" },
  ];
  const filtered = filter === "all" ? items : items.filter((i) => i.kind === filter);
  const statusLabels = {
    pending: "En attente", sent: "Envoyée", viewed: "Consultée", shortlisted: "Présélectionnée", interview: "Entretien",
    accepted: "Acceptée", rejected: "Refusée", active: "En cours", trial: "Essai", completed: "Terminée", draft: "Brouillon",
    published: "Publiée", paused: "En pause", closed: "Fermée", filled: "Pourvue", expired: "Expirée",
    "envoyée": "Envoyée", "à traiter": "À traiter", "en attente": "En attente",
  };

  return (
    <section className={`${card} overflow-hidden`}>
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Suivi de votre activité</h2>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Candidatures, propositions, missions et besoins.</p>
        </div>
        {showFilters && (
          <div className="ts-noscroll flex gap-1 overflow-x-auto rounded-xl bg-slate-100/80 p-1 dark:bg-white/5">
            {filters.map((f) => (
              <button key={f.id} type="button" onClick={() => onFilter(f.id)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-medium transition ${filter === f.id ? "bg-white text-slate-800 shadow-sm dark:bg-white/10 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}>
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 pb-6"><Empty icon={Clock} text="Aucune activité dans cette catégorie pour le moment." compact /></div>
      ) : (
        <ol className="px-3 pb-3">
          {filtered.slice(0, limit).map((item) => {
            const status = String(item.status || "").toLowerCase();
            const positive = ["accepted", "active", "completed", "published", "envoyée", "interview", "shortlisted"].includes(status);
            const waiting = ["pending", "sent", "viewed", "draft", "à traiter", "en attente"].includes(status);
            return (
              <li key={item.id}>
                <Link to={getTargetUrl(item)} className="group flex items-start gap-4 rounded-2xl p-3 transition hover:bg-slate-50 dark:hover:bg-white/5">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${positive ? "bg-teal-400" : waiting ? "bg-amber-300" : "bg-slate-300"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 text-[10px]">
                      <span className="font-medium text-teal-600 dark:text-teal-300">{item.label}</span>
                      {item.counterpart && <span className="truncate text-slate-500 dark:text-slate-400">· {item.counterpart}</span>}
                    </div>
                    <h3 className="mt-0.5 truncate text-sm font-medium text-slate-700 group-hover:text-teal-600 dark:text-slate-200 dark:group-hover:text-teal-300">{item.title}</h3>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${positive ? "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300" : waiting ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300" : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"}`}>
                      {statusLabels[status] || item.status || "—"}
                    </span>
                    <time className="text-[10px] text-slate-400">{timeAgo(item.date)}</time>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function FeedSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
      <div className="space-y-5">
        <div className="ts-skel h-52 rounded-2xl" />
        {[0, 1, 2].map((i) => <div key={i} className="ts-skel h-60 rounded-2xl" />)}
      </div>
      <div className="hidden space-y-5 lg:block"><div className="ts-skel h-64 rounded-2xl" /><div className="ts-skel h-48 rounded-2xl" /></div>
    </div>
  );
}

/* ============================================================
   PAGE PRINCIPALE
============================================================ */
export default function MyActivity() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const now = useNow(60000);

  const uid = user?.id;
  const role = user?.role?.toLowerCase();
  const isCompany = role === "company" || role === "entreprise";
  const isStudent = role === "student" || role === "employee";

  const pendingRef = useRef(null);
  const handledNonce = useRef(null);
  const retriedRef = useRef(false);
  const [pendingTarget, setPendingTarget] = useState(null);

  const [tab, setTab] = useState(TABS.some((t) => t.id === searchParams.get("tab")) ? searchParams.get("tab") : "home");
  const [section, setSection] = useState(SECTIONS.some((s) => s.id === searchParams.get("section")) ? searchParams.get("section") : "overview");
  const [activityFilter, setActivityFilter] = useState("all");
  const [feedFilter, setFeedFilter] = useState("all");

  const [isPublishing, setIsPublishing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createPreset, setCreatePreset] = useState("stage");

  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [applications, setApplications] = useState([]);
  const [missions, setMissions] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [radar, setRadar] = useState(null);
  const [dashInfo, setDashInfo] = useState(null);
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
  const [addingSkill, setAddingSkill] = useState(null);

  const [favorites, setFavorites] = useState(() => (uid ? readJson(`talentshare_favorites_${uid}`, []) : []));
  const [savedOffers, setSavedOffers] = useState(() => (uid ? readJson(`talentshare_saved_offers_${uid}`, []) : []));
  const skillsKey = `talentshare_skills_added_${uid}`;
  const [skillsAdded, setSkillsAdded] = useState(() => {
    const v = readJson(skillsKey, null);
    return v && v.week === weekId() ? v.ids || [] : [];
  });

  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [showSavedOffersModal, setShowSavedOffersModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companySource, setCompanySource] = useState("network");
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [applyModalRequest, setApplyModalRequest] = useState(null);
  const [myCompanies, setMyCompanies] = useState([]);

  const avatarUrl = fileUrl(user?.avatar_path || user?.professional_profile?.avatar_path);

  /* ---------- URL <-> onglets ---------- */
  useEffect(() => {
    const next = { tab };
    if (tab === "profile" && isStudent) next.section = section;
    setSearchParams(next, { replace: true, state: location.state });
  }, [tab, section, isStudent, setSearchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (TABS.some((t) => t.id === urlTab) && urlTab !== tab) setTab(urlTab);
    const urlSection = searchParams.get("section");
    if (SECTIONS.some((s) => s.id === urlSection) && urlSection !== section) setSection(urlSection);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (uid) localStorage.setItem(`talentshare_favorites_${uid}`, JSON.stringify(favorites)); }, [favorites, uid]);
  useEffect(() => { if (uid) localStorage.setItem(`talentshare_saved_offers_${uid}`, JSON.stringify(savedOffers)); }, [savedOffers, uid]);
  useEffect(() => { if (uid) localStorage.setItem(skillsKey, JSON.stringify({ week: weekId(), ids: skillsAdded })); }, [skillsAdded, skillsKey, uid]);

  /* ---------- Chargement ---------- */
  const loadData = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    setError(null);
    const empty = { data: [] };
    try {
      const [recRes, sentRes, misRes, myRes, compRes, feedRes, jobOffersRes, appRes, availRes, radarRes, dashRes] = await Promise.all([
        api.get("/proposals/received").catch(() => empty),
        api.get("/proposals/sent").catch(() => empty),
        api.get("/missions").catch(() => empty),
        api.get("/resource-requests?my=1").catch(() => empty),
        api.get("/companies").catch(() => empty),
        api.get("/resource-requests?per_page=15").catch(() => null),
        api.get("/job-offers").catch(() => empty),
        isStudent ? api.get("/applications").catch(() => empty) : Promise.resolve(empty),
        isStudent ? api.get("/availability").catch(() => empty) : Promise.resolve(empty),
        isStudent ? api.get("/radar", { params: { limit: 100 } }).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
        isStudent ? api.get("/dashboard").catch(() => ({ data: null })) : Promise.resolve({ data: null }),
      ]);

      if (!feedRes) setError("Impossible de charger le fil d'actualité.");

      const feedList = feedRes ? asArray(feedRes.data).map((r) => ({ ...r, id: `req-${r.id}`, real_id: r.id })) : [];
      const jobList = asArray(jobOffersRes.data).map((j) => ({ ...j, id: `job-${j.id}`, real_id: j.id, is_job_offer: true }));
      const combined = [...feedList, ...jobList].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      const likedMap = new Map(combined.map((r) => [r.id, r.is_liked]));

      setReceived(asArray(recRes.data));
      setSent(asArray(sentRes.data));
      setApplications(asArray(appRes.data));
      setMissions(asArray(misRes.data));
      setAvailability(asArray(availRes.data));
      setRadar(radarRes?.data ?? null);
      setDashInfo(dashRes?.data ?? null);
      setCompanies(asArray(compRes.data));
      setMyRequests(asArray(myRes.data).map((r) => ({ ...r, is_liked: r.is_liked ?? likedMap.get(`req-${r.id}`) ?? false })));
      setFeed(combined);
      setFeedPage(feedRes?.data?.current_page || 1);
      setFeedLastPage(feedRes?.data?.last_page || 1);
      setStories(combined.filter((r) => r.created_by !== user.id));
    } finally {
      setLoading(false);
    }
  }, [user?.id, isStudent]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadData();
    const onFocus = () => loadData(true);
    window.addEventListener("focus", onFocus);
    if (user) api.get("/profile/my-companies").then((r) => setMyCompanies(asArray(r.data))).catch(() => setMyCompanies([]));
    return () => window.removeEventListener("focus", onFocus);
  }, [loadData, user]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await api.get(`/resource-requests?per_page=15&page=${feedPage + 1}`);
      const list = asArray(res.data).map((r) => ({ ...r, id: `req-${r.id}`, real_id: r.id }));
      setFeed((prev) => [...prev, ...list.filter((n) => !prev.some((p) => p.id === n.id))]);
      setFeedPage(res.data?.current_page || feedPage + 1);
      setFeedLastPage(res.data?.last_page || feedPage + 1);
    } catch {
      showToast("Impossible de charger plus de publications", "error");
    } finally {
      setLoadingMore(false);
    }
  };

  /* ---------- Actions sur les publications ---------- */
  const patchPost = (id, patch) => {
    const upd = (l) => l.map((r) => (r.id === id ? { ...r, ...patch } : r));
    setFeed(upd); setStories(upd);
    setMyRequests((prev) => prev.map((r) => (`req-${r.id}` === id ? { ...r, ...patch } : r)));
  };
  const removePost = (id) => {
    const rm = (l) => l.filter((r) => r.id !== id);
    setFeed(rm); setStories(rm);
    setMyRequests((prev) => prev.filter((r) => `req-${r.id}` !== id));
  };
  const openCreate = (preset = "stage") => { setCreatePreset(preset); setShowCreateModal(true); };

  const handlePublish = async (data) => {
    setIsPublishing(true);
    try {
      await api.post("/resource-requests", data);
      showToast(isCompany ? "Besoin publié avec succès !" : "Vos compétences ont été publiées !", "success");
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
      const cur = feed.find((p) => p.id === id);
      if (cur) {
        const liked = !cur.is_liked;
        patchPost(id, { is_liked: liked, likes_count: liked ? (cur.likes_count || 0) + 1 : Math.max(0, (cur.likes_count || 0) - 1) });
      }
      const res = await api.post(isJobOffer ? `/job-offers/${realId}/like` : `/resource-requests/${realId}/like`);
      patchPost(id, { is_liked: res.data.liked, likes_count: res.data.likes_count });
    } catch {
      showToast("Impossible d'enregistrer votre J'aime", "error");
      const cur = feed.find((p) => p.id === id);
      if (cur) patchPost(id, { is_liked: !cur.is_liked, likes_count: cur.likes_count });
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

  const handleReport = (post) => { setHiddenIds((p) => [...p, post.id]); showToast("Publication masquée. Merci pour votre signalement.", "success"); };

  const handleAddSkill = async (gap, level) => {
    setAddingSkill(gap.id);
    try {
      await api.post("/skills/attach", { skill_id: gap.id, level });
      setSkillsAdded((p) => (p.includes(gap.id) ? p : [...p, gap.id]));
      showToast(`« ${gap.name} » ajoutée à votre profil`, "success");
      loadData(true); // le radar recalcule les compatibilités
    } catch (err) {
      const errors = err.response?.data?.errors;
      showToast(errors ? Object.values(errors).flat().join(" · ") : err.response?.data?.message || "Ajout impossible", "error");
    } finally {
      setAddingSkill(null);
    }
  };

  const openRadarItem = (it) => {
    if (it.kind === "job_offer") setSelectedOfferId(it.id);
    else navigate(`/resource-requests/${it.id}`);
  };

  const isMine = (post) =>
    post.created_by === user?.id || (post.company_id && (user?.companies || []).some((c) => c.id === post.company_id));

  /* ---------- Données dérivées ---------- */
  const visibleFeed = useMemo(() => {
    const q = feedSearch.trim().toLowerCase();
    return feed
      .filter((p) => !hiddenIds.includes(p.id) && !isMine(p))
      .filter((p) => (feedFilter === "all" ? true : feedFilter === "offers" ? p.is_job_offer : !p.is_job_offer))
      .filter((p) => !q || p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) ||
        getAuthor(p).name.toLowerCase().includes(q) || (p.skills || []).some((s) => (s.name || s).toLowerCase().includes(q)));
  }, [feed, hiddenIds, feedSearch, feedFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleMine = useMemo(() => myRequests.filter((p) => !hiddenIds.includes(`req-${p.id}`)), [myRequests, hiddenIds]);
  const visibleStories = useMemo(() => stories.filter((p) => !hiddenIds.includes(p.id)), [stories, hiddenIds]);

  const dismissed = useMemo(() => readJson(`talentshare_radar_dismissed_${uid}`, []), [radar, uid]); // eslint-disable-line react-hooks/exhaustive-deps
  const radarItems = useMemo(() => (radar?.data || []).filter((i) => !dismissed.includes(i.key)), [radar, dismissed]);

  const incoming = useMemo(() => splitProposals(sent, received).incoming, [sent, received]);
  const events = useMemo(() => buildAgenda({ applications, sent, received, missions, availability }), [applications, sent, received, missions, availability]);
  const nextInterview = useMemo(() => nextInterviewOf(events, now), [events, now]);
  const upcomingInterviews = useMemo(() => upcomingEvents(events, now, 365).filter((e) => e.type === "interview").length, [events, now]);
  const gaps = useMemo(() => buildSkillGaps(radarItems, skillsAdded), [radarItems, skillsAdded]);
  const report = useMemo(
    () => buildWeeklyReport({
      applications, sent, received, missions, radar: radarItems, now,
      skillsAdded: skillsAdded.length,
      completion: dashInfo?.completion ?? radar?.profile?.completeness ?? 0,
    }),
    [applications, sent, received, missions, radarItems, now, skillsAdded, dashInfo, radar]
  );

  const activityItems = useMemo(() => {
    const rows = [];
    if (isCompany) {
      received.forEach((p) => rows.push({
        id: `received-${p.id}`, kind: "proposals", label: "Proposition reçue",
        title: p.title || p.resource_request?.title || "Proposition reçue",
        counterpart: p.profile?.user?.name || "Talent",
        status: p.status === "sent" ? "À traiter" : p.status, date: p.created_at || p.updated_at,
      }));
    }
    applications.forEach((a) => rows.push({
      id: `application-${a.id}`, kind: "applications", label: "Candidature",
      title: a.job_offer?.title || a.jobOffer?.title || "Offre d'emploi",
      counterpart: a.job_offer?.company?.name || "", status: a.status, date: a.updated_at || a.created_at,
    }));
    sent.forEach((p) => rows.push({
      id: `sent-${p.id}`, kind: "proposals", label: "Proposition envoyée",
      title: p.title || p.resource_request?.title || p.resourceRequest?.title || "Proposition envoyée",
      counterpart: p.to_company?.name || p.toCompany?.name || p.resource_request?.company?.name || "",
      status: p.status || "sent", date: p.created_at || p.updated_at,
    }));
    missions.forEach((m) => rows.push({
      id: `mission-${m.id}`, kind: "missions", label: "Mission", title: getMissionTitle(m),
      counterpart: m.requesting_company?.name || m.requestingCompany?.name || "",
      status: m.status, date: m.updated_at || m.created_at,
    }));
    visibleMine.forEach((r) => rows.push({
      id: `request-${r.id}`, kind: "requests", label: "Besoin publié", title: r.title || "Demande de ressource",
      counterpart: r.company?.name || "", status: r.status, date: r.updated_at || r.created_at,
    }));
    return rows.sort((a, b) => (new Date(b.date || 0).getTime() || 0) - (new Date(a.date || 0).getTime() || 0));
  }, [received, applications, sent, missions, visibleMine, isCompany]);

  const favoritesPool = useMemo(() => {
    const map = new Map();
    [...stories, ...feed, ...myRequests].forEach((r) => { if (!map.has(r.id)) map.set(r.id, r); });
    return [...map.values()];
  }, [stories, feed, myRequests]);

  const activeMissions = missions.filter((m) => ["active", "trial"].includes(m.status)).length;
  const receivedForModal = isStudent ? incoming : received;

  const appliedRequestIds = useMemo(() => new Set(
    sent.map((p) => p.resource_request_id ?? p.resourceRequest?.id ?? p.resource_request?.id ?? p.request_id ?? p.subject_id).filter(Boolean).map(String)
  ), [sent]);
  const appliedJobOfferIds = useMemo(() => new Set(applications.map((a) => a.job_offer_id).filter(Boolean).map(String)), [applications]);

  const cardProps = {
    onLike: handleLike, onShare: handleShare, onDelete: handleDelete, onEdit: setEditingPost,
    onReport: handleReport, onPatch: patchPost, showToast, sentProposals: sent, myApplications: applications,
    onOpenOffer: (id) => setSelectedOfferId(id), onApply: (req) => setApplyModalRequest(req),
  };

  const firstName = (user?.name || "").split(" ")[0] || "vous";

  /* ---------- Scroll vers une publication (notifications) ---------- */
  useEffect(() => {
    const hashId = location.hash?.startsWith("#request-") ? location.hash.replace("#request-", "") : null;
    const target = location.state?.scrollToRequestId ?? hashId;
    const nonce = location.state?.nonce ?? location.hash ?? null;
    if (!target || handledNonce.current === nonce) return;
    handledNonce.current = nonce;
    retriedRef.current = false;
    setTab("profile");
    setSection("activity");
    setPendingTarget(String(target));
  }, [location.state, location.hash]);

  useEffect(() => {
    if (!pendingTarget || tab !== "profile" || loading) return undefined;
    const exists = visibleMine.some((p) => String(p.id) === pendingTarget);
    if (!exists) {
      if (!retriedRef.current) { retriedRef.current = true; loadData(true); return undefined; }
      setPendingTarget(null);
      return undefined;
    }
    const frame = requestAnimationFrame(() => {
      const el = document.getElementById(`request-${pendingTarget}`);
      if (!el) return;
      const hl = ["ring-4", "ring-teal-300", "rounded-2xl", "transition-all"];
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add(...hl);
      setTimeout(() => el.classList.remove(...hl), 3500);
      setPendingTarget(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [pendingTarget, tab, loading, visibleMine, loadData]);

  /* ---------- Rail de stories (non-étudiants) ---------- */
  const StoriesRail = () => (
    <div className="ts-noscroll flex gap-3 overflow-x-auto pb-1">
      {visibleStories.slice(0, 12).map((story) => {
        const author = getAuthor(story);
        const realId = String(story.real_id || story.id).replace(/^(req|job)-/, "");
        const applied = story.is_job_offer ? appliedJobOfferIds.has(realId) : appliedRequestIds.has(realId);
        const grad = GRADIENTS[hash(author.name) % GRADIENTS.length];
        return (
          <button
            key={story.id} type="button" disabled={applied}
            onClick={() => (story.is_job_offer ? setSelectedOfferId(realId) : navigate(`/resource-requests/${realId}`))}
            className={`relative flex h-[190px] w-[140px] shrink-0 flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-b ${grad} p-3 text-left transition ${applied ? "opacity-70" : "hover:-translate-y-1"}`}
          >
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
            <div className="relative flex items-center gap-2">
              <Avatar src={author.logo} name={author.name} size={28} className="ring-2 ring-white/80" />
              <p className="truncate text-[11px] text-white">{author.name}</p>
            </div>
            <h3 className="relative line-clamp-4 text-[13px] font-semibold leading-tight text-white">{story.title || "Demande sans titre"}</h3>
            <div className="relative">
              {applied ? (
                <span className="rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-medium text-teal-700">Postulé</span>
              ) : (story.budget_min || story.budget_max) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-[9px] text-white"><Banknote size={10} /> {story.budget_min || 0}-{story.budget_max || 0} €</span>
              )}
            </div>
          </button>
        );
      })}
      {visibleStories.length === 0 && <p className="w-full py-8 text-center text-xs text-slate-500">Aucune nouvelle demande pour le moment.</p>}
    </div>
  );

  /* ---------- Sections réutilisables ---------- */
  const publicationsSection = (
    <section id="my-posts" className={`${card} overflow-hidden`}>
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Mes publications</h2>
        <span className="rounded-full bg-teal-50 px-3 py-1 text-[10px] font-medium text-teal-600 dark:bg-teal-500/10 dark:text-teal-300">{visibleMine.length}</span>
      </div>
      <div className="px-4 pb-5 sm:px-5">
        {visibleMine.length === 0 ? (
          <Empty icon={Send} compact text={isStudent ? "Vos candidatures et propositions apparaissent dans le suivi d'activité." : "Vous n'avez pas encore publié de besoin."} />
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
  );

  const companiesSection = myCompanies.length > 0 && (
    <section className={`${card} p-5`}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Mes entreprises</h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Vous faites partie de l'équipe</p>
        </div>
        <span className="rounded-full bg-teal-50 px-3 py-1 text-[10px] font-medium text-teal-600 dark:bg-teal-500/10 dark:text-teal-300">{myCompanies.length}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {myCompanies.map((c) => (
          <button key={c.id} type="button" onClick={() => { setSelectedCompany(c); setCompanySource("profile"); }}
            className="flex flex-col items-center rounded-2xl bg-slate-50/80 p-4 transition hover:bg-white hover:shadow-md dark:bg-white/5">
            <Avatar src={fileUrl(c.logo_path)} name={c.name} size={56} rounded="rounded-2xl" fit="contain" className="mb-3" />
            <span className="line-clamp-2 text-center text-xs font-medium text-slate-700 dark:text-slate-200">{c.name}</span>
            {c.city && <span className="mt-1 text-[10px] text-slate-500">{c.city}</span>}
          </button>
        ))}
      </div>
    </section>
  );

  const statTiles = (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatTile icon={Target} value={visibleMine.length} label="Besoins publiés" tone="blue" onClick={() => document.getElementById("my-posts")?.scrollIntoView({ behavior: "smooth" })} />
      <StatTile icon={Send} value={sent.length} label="Envoyées" tone="violet" onClick={() => setHistoryModalType("sent")} />
      <StatTile icon={Handshake} value={receivedForModal.length} label="Reçues" tone="teal" onClick={() => setHistoryModalType("received")} />
      <StatTile icon={Briefcase} value={activeMissions} label="Missions en cours" tone="amber" onClick={() => setHistoryModalType("missions")} />
    </div>
  );

  /* ============================================================
     RENDU
  ============================================================ */
  return (
    <AppShell>
      <style>{STYLES}</style>
      <div className="ts-root min-h-full px-3 py-4 sm:px-5 lg:px-7">
        <div className="mx-auto max-w-[1280px] space-y-5">
          {isStudent && !loading && <ReminderBanner ev={nextInterview} now={now} />}

          {loading ? (
            <FeedSkeleton />
          ) : (
            <div key={tab} className="ts-fade">
              {/* ================= ACCUEIL ================= */}
              {tab === "home" && (
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
                  <div className="min-w-0 space-y-5">
                    {isStudent ? (
                      <RadarStrip
                        items={radarItems.slice(0, 8)}
                        profileFound={radar?.profile_found !== false}
                        completeness={radar?.profile?.completeness}
                        tip={radar?.profile?.tips?.[0]}
                        onOpen={openRadarItem}
                      />
                    ) : (
                      <section className={`${card} p-5`}>
                        <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-white">À la une pour vous</h2>
                        <StoriesRail />
                      </section>
                    )}

                    <section className={`${card} sticky top-24 z-20 p-3`}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <label className="relative block flex-1">
                          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input type="text" value={feedSearch} onChange={(e) => setFeedSearch(e.target.value)} placeholder="Rechercher un besoin, une compétence, une entreprise…"
                            className="w-full rounded-xl border-0 bg-slate-50/80 py-2.5 pl-11 pr-10 text-sm text-slate-700 outline-none ring-1 ring-slate-900/5 transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-teal-300 dark:bg-[#142B49] dark:text-white dark:ring-white/10" />
                          {feedSearch && <button onClick={() => setFeedSearch("")} aria-label="Effacer" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"><X size={14} /></button>}
                        </label>
                        <div className="flex gap-1 rounded-xl bg-slate-100/80 p-1 dark:bg-white/5">
                          {[["all", "Tout"], ["requests", "Demandes"], ["offers", "Offres"]].map(([id, label]) => (
                            <button key={id} onClick={() => setFeedFilter(id)} className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${feedFilter === id ? "bg-white text-slate-800 shadow-sm dark:bg-white/10 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}>{label}</button>
                          ))}
                        </div>
                      </div>
                    </section>

                    {error && (
                      <div className="flex items-center justify-between gap-3 rounded-2xl bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                        <span className="flex items-center gap-2"><AlertCircle size={16} /> {error}</span>
                        <button onClick={() => loadData()} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-700">Réessayer</button>
                      </div>
                    )}

                    {!error && visibleFeed.length === 0 ? (
                      <div className={`${card} p-10`}><Empty text={feedSearch ? "Aucune publication ne correspond à votre recherche." : "Aucune publication pour le moment."} /></div>
                    ) : (
                      <div className="space-y-5">
                        {visibleFeed.map((post, i) => (
                          <div key={post.id} className="ts-fade" style={{ animationDelay: `${Math.min(i, 5) * 50}ms` }}>
                            <PostCard post={post} mine={isMine(post)} avatarUrl={avatarUrl} {...cardProps} />
                          </div>
                        ))}
                      </div>
                    )}

                    {feedPage < feedLastPage && !feedSearch && (
                      <button onClick={loadMore} disabled={loadingMore} className="mx-auto flex items-center gap-2 rounded-xl bg-slate-100/80 px-6 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-60 dark:bg-white/10 dark:text-white">
                        {loadingMore ? <Loader2 size={15} className="animate-spin" /> : <TrendingUp size={15} />} Charger plus de publications
                      </button>
                    )}

                    <section className={`${card} p-6 text-center`}>
                      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300"><Building2 size={22} /></span>
                      <h2 className="mt-4 text-base font-semibold text-slate-800 dark:text-white">Découvrez les entreprises du réseau</h2>
                      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">Explorez les organisations partenaires, trouvez de nouvelles opportunités et connectez-vous avec les recruteurs.</p>
                      <button onClick={() => setTab("companies")} className={`${btnPrimary} mt-5`}><Globe size={15} /> Découvrir le réseau</button>
                    </section>
                  </div>

                  {/* Colonne latérale */}
                  <aside className="hidden lg:block">
                    <div className="sticky top-24 space-y-5">
                      <section className={`${card} overflow-hidden`}>
                        <div className="h-16 bg-gradient-to-br from-teal-50 via-slate-50 to-blue-50 dark:from-teal-500/10 dark:via-white/5 dark:to-blue-500/10" />
                        <div className="-mt-9 px-5 pb-5 text-center">
                          <Avatar src={avatarUrl} name={user?.name} size={68} className="mx-auto ring-4 ring-white dark:ring-[#112A3A]" />
                          <p className="mt-2 truncate text-base font-semibold text-slate-800 dark:text-white">{user?.name}</p>
                          <p className="text-[11px] text-teal-600 dark:text-teal-300">{isCompany ? "Entreprise" : "Talent"}</p>
                          <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 rounded-2xl bg-slate-50/80 py-3 dark:divide-white/10 dark:bg-white/5">
                            {isStudent ? (
                              <>
                                <MiniStat value={report.totals.applications} label="Candidatures" />
                                <MiniStat value={upcomingInterviews} label="Entretiens" />
                                <MiniStat value={activeMissions} label="Missions" />
                              </>
                            ) : (
                              <>
                                <MiniStat value={visibleMine.length} label="Besoins" />
                                <MiniStat value={sent.length} label="Envoyées" />
                                <MiniStat value={activeMissions} label="Missions" />
                              </>
                            )}
                          </div>
                          {isStudent && (
                            <Link to="/opportunites" className={`${btnPrimary} mt-4 w-full`}><Target size={15} /> Ouvrir mon radar</Link>
                          )}
                        </div>
                      </section>

                      {isStudent && (
                        <>
                          <AgendaMini events={events} now={now} onSeeAll={() => { setSection("agenda"); setTab("profile"); }} />

                          <section className={`${card} p-4`}>
                            <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-white">Cette semaine</h3>
                            <p className="mb-4 text-xs leading-5 text-slate-600 dark:text-slate-300">{report.summary}</p>
                            <GoalsMini goals={report.goals} />
                            <button onClick={() => { setSection("report"); setTab("profile"); }} className="mt-3 w-full rounded-xl py-2 text-xs font-medium text-teal-600 transition hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-500/10">Voir le rapport →</button>
                          </section>

                          <SkillGapMini gaps={gaps} onSeeAll={() => { setSection("skills"); setTab("profile"); }} />
                        </>
                      )}

                      {!isStudent && myCompanies.length > 0 && (
                        <section className={`${card} p-4`}>
                          <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-white">Mes entreprises</h3>
                          <div className="space-y-1">
                            {myCompanies.map((c) => (
                              <button key={c.id} onClick={() => { setSelectedCompany(c); setCompanySource("profile"); }} className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-slate-50 dark:hover:bg-white/5">
                                <Avatar src={fileUrl(c.logo_path)} name={c.name} size={34} rounded="rounded-xl" fit="contain" />
                                <div className="min-w-0"><p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">{c.name}</p><p className="text-[10px] text-slate-500">Salarié</p></div>
                              </button>
                            ))}
                          </div>
                        </section>
                      )}

                      <section className={`${card} p-4`}>
                        <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-white">Raccourcis</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => setShowFavoritesModal(true)} className="flex flex-col items-start gap-1 rounded-2xl bg-rose-50/80 p-3 text-left transition hover:bg-rose-50 dark:bg-rose-500/10"><Heart size={16} className="text-rose-400" /><span className="text-xs font-medium text-rose-700 dark:text-rose-300">Favoris · {favorites.length}</span></button>
                          <button onClick={() => setShowSavedOffersModal(true)} className="flex flex-col items-start gap-1 rounded-2xl bg-blue-50/80 p-3 text-left transition hover:bg-blue-50 dark:bg-blue-500/10"><Bookmark size={16} className="text-blue-500" /><span className="text-xs font-medium text-blue-700 dark:text-blue-300">Offres · {savedOffers.length}</span></button>
                        </div>
                      </section>
                    </div>
                  </aside>
                </div>
              )}

              {/* ================= MON ESPACE ================= */}
              {tab === "profile" && isStudent && (
                <div className="mx-auto max-w-5xl space-y-5">
                  <nav className="ts-noscroll flex gap-1 overflow-x-auto rounded-2xl bg-white/70 p-1.5 shadow-sm ring-1 ring-slate-900/[0.04] dark:bg-white/5 dark:ring-white/5" aria-label="Sections">
                    {SECTIONS.map((s) => (
                      <button key={s.id} type="button" onClick={() => setSection(s.id)}
                        className={`shrink-0 rounded-xl px-4 py-2 text-[13px] font-medium transition ${section === s.id ? "bg-[#0B1F33] text-white dark:bg-[#16B8B1] dark:text-[#0B1F33]" : "text-slate-500 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:bg-white/10"}`}>
                        {s.label}
                        {s.id === "skills" && gaps.length > 0 && <span className="ml-2 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">{gaps.length}</span>}
                      </button>
                    ))}
                  </nav>

                  <div key={section} className="ts-fade space-y-5">
                    {section === "overview" && (
                      <>
                        <NextEvent ev={nextInterview} now={now} />
                        <WeeklyReport report={report} compact />
                        <div className="grid gap-5 lg:grid-cols-2">
                          <SkillGaps gaps={gaps} limit={3} onAdd={handleAddSkill} addingId={addingSkill} />
                          <AgendaMini events={events} now={now} onSeeAll={() => setSection("agenda")} />
                        </div>
                        <ActivityOverview items={activityItems} filter="all" onFilter={() => {}} limit={5} showFilters={false} />
                      </>
                    )}
                    {section === "report" && <WeeklyReport report={report} />}
                    {section === "agenda" && (
                      <>
                        <NextEvent ev={nextInterview} now={now} />
                        <AgendaPanel events={events} now={now} />
                      </>
                    )}
                    {section === "skills" && <SkillGaps gaps={gaps} onAdd={handleAddSkill} addingId={addingSkill} />}
                    {section === "activity" && (
                      <>
                        {statTiles}
                        <ActivityOverview items={activityItems} filter={activityFilter} onFilter={setActivityFilter} limit={12} />
                        {companiesSection}
                        {publicationsSection}
                      </>
                    )}
                  </div>
                </div>
              )}

              {tab === "profile" && !isStudent && (
                <div className="mx-auto max-w-4xl space-y-5">
                  <section className={`${card} overflow-hidden`}>
                    <div className="flex items-center gap-3 p-4 sm:p-5">
                      <Avatar src={avatarUrl} name={user?.name} size={46} />
                      <button onClick={() => openCreate()} className="group flex h-12 w-full flex-1 items-center justify-between rounded-full bg-slate-50/80 px-5 text-left text-[15px] text-slate-500 ring-1 ring-slate-900/5 transition hover:bg-white dark:bg-white/5 dark:text-slate-400 dark:ring-white/10">
                        <span>Quel besoin souhaitez-vous publier, {firstName} ?</span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#16B8B1] text-white"><Plus size={16} strokeWidth={2.5} /></span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 p-4 pt-0 sm:grid-cols-4">
                      {CONTRACT_CHOICES.map((c) => (
                        <button key={c.id} onClick={() => openCreate(c.id)} className="flex flex-col items-start rounded-2xl bg-slate-50/80 p-3.5 text-left transition hover:bg-white hover:shadow-md dark:bg-white/5">
                          <span className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${c.color}`}><c.icon size={16} /></span>
                          <span className="text-[13px] font-medium text-slate-700 dark:text-slate-200">{c.label}</span>
                          <span className="mt-0.5 text-[11px] text-slate-500">{c.hint}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                  {statTiles}
                  <ActivityOverview items={activityItems} filter={activityFilter} onFilter={setActivityFilter} />
                  {companiesSection}
                  {publicationsSection}
                </div>
              )}

              {/* ================= RÉSEAU ================= */}
              {tab === "companies" && (
                <div className="mx-auto max-w-6xl space-y-5">
                  <button onClick={() => setTab("home")} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-900/5 transition hover:bg-slate-50 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10">
                    <ChevronLeft size={16} /> Retour à l'accueil
                  </button>
                  <CompaniesTab companies={companies} onSelect={(c) => { setSelectedCompany(c); setCompanySource("network"); }} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {tab !== "companies" && !isStudent && (
        <button onClick={() => openCreate()} aria-label="Publier un besoin" className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0B1F33] text-white shadow-lg transition hover:scale-105 dark:bg-[#16B8B1] dark:text-[#0B1F33] lg:hidden">
          <Plus size={24} />
        </button>
      )}

      {showCreateModal && <CreateRequestModal onClose={() => setShowCreateModal(false)} onPublish={handlePublish} user={user} isCompany={isCompany} publishing={isPublishing} preset={createPreset} />}
      {showFavoritesModal && <FavoritesModal allRequests={favoritesPool} favorites={favorites} onClose={() => setShowFavoritesModal(false)} onToggleFavorite={toggleFavorite} />}
      {showSavedOffersModal && <SavedOffersModal savedOffers={savedOffers} onClose={() => setShowSavedOffersModal(false)} onToggleSavedOffer={toggleSavedOffer} onSelectOffer={(id) => { setShowSavedOffersModal(false); setSelectedOfferId(id); }} />}
      {selectedCompany && <CompanyModal company={selectedCompany} onClose={() => setSelectedCompany(null)} showJobs={companySource === "network"} onSelectOffer={(id) => setSelectedOfferId(id)} />}
      {editingPost && <EditPostModal post={editingPost} onClose={() => setEditingPost(null)} onSubmit={handleEdit} />}
      {selectedOfferId && <JobOfferDetail offerId={selectedOfferId} onClose={() => setSelectedOfferId(null)} />}
      {historyModalType && <HistoryModal type={historyModalType} sent={sent} received={receivedForModal} missions={missions} onClose={() => setHistoryModalType(null)} />}
      {applyModalRequest && (
        <ApplyToRequestModal
          request={applyModalRequest}
          onClose={() => setApplyModalRequest(null)}
          onSuccess={() => { setApplyModalRequest(null); showToast("Votre proposition a été envoyée avec succès !", "success"); loadData(true); }}
        />
      )}
    </AppShell>
  );
}