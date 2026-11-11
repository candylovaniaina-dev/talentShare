import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Compass,
  FileText,
  Handshake,
  Inbox,
  MessageCircle,
  Percent,
  RefreshCw,
  Send,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

import AppShell from "../../components/layout/AppShell";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

/* ============================================================
   HELPERS & PALETTE
============================================================ */

const number = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const hasValue = (value) => value !== undefined && value !== null && value !== "";

const getRole = (user) => {
  const role = String(user?.role || "").toLowerCase();
  if (role.includes("admin")) return "admin";
  if (role.includes("univers")) return "university";
  if (role.includes("company") || role.includes("entreprise")) return "company";
  if (role.includes("student") || role.includes("étudiant") || role.includes("etudiant")) return "student";
  return "employee";
};

const toList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  for (const key of ["data", "items", "results"]) {
    const inner = toList(payload[key]);
    if (inner.length) return inner;
  }
  return Object.values(payload).find(Array.isArray) || [];
};

const totalOf = (payload, list) =>
  number(payload?.total ?? payload?.meta?.total ?? payload?.data?.total ?? list.length);

const dateOf = (item) => {
  const raw = item?.created_at ?? item?.createdAt ?? item?.published_at ?? item?.updated_at;
  const date = raw ? new Date(raw) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const timeAgo = (date) => {
  if (!date) return "";
  const diff = (date.getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
  if (abs < 60) return "à l'instant";
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 2592000) return rtf.format(Math.round(diff / 86400), "day");
  return date.toLocaleDateString("fr-FR");
};

const bucketOf = (status) => {
  const s = String(status || "").toLowerCase();
  if (/accept|approv|hired|retenu|valid/.test(s)) return "accepted";
  if (/reject|refus|declin|cancel|withdraw|annul/.test(s)) return "rejected";
  return "pending";
};

// ✅ PALETTE DES CARTES (Couleurs identitaires + Fonds pastels)
const CARD_PALETTES = {
  navy: { 
    bg: "bg-[#0B1F33] border-[#0B1F33] text-white", 
    iconBg: "bg-white/10 text-white", 
    textMain: "text-white", 
    textSub: "text-white/70",
    hover: "hover:shadow-[0_8px_30px_rgba(11,31,51,0.25)]"
  },
  teal: { 
    bg: "bg-[#F0FDFA] border-[#CCFBF1] dark:bg-teal-500/10 dark:border-teal-500/20", 
    iconBg: "bg-[#16B8B1] text-white", 
    textMain: "text-[#0F766E] dark:text-teal-400", 
    textSub: "text-[#0F766E]/70 dark:text-teal-400/70",
    hover: "hover:border-[#16B8B1]/40 hover:shadow-sm"
  },
  amber: { 
    bg: "bg-[#FFFBEB] border-[#FEF3C7] dark:bg-amber-500/10 dark:border-amber-500/20", 
    iconBg: "bg-amber-400 text-white", 
    textMain: "text-[#B45309] dark:text-amber-400", 
    textSub: "text-[#B45309]/70 dark:text-amber-400/70",
    hover: "hover:border-amber-400/40 hover:shadow-sm"
  },
  blue: { 
    bg: "bg-[#EFF6FF] border-[#DBEAFE] dark:bg-blue-500/10 dark:border-blue-500/20", 
    iconBg: "bg-[#3478E8] text-white", 
    textMain: "text-[#1E40AF] dark:text-blue-400", 
    textSub: "text-[#1E40AF]/70 dark:text-blue-400/70",
    hover: "hover:border-blue-400/40 hover:shadow-sm"
  },
};

const TONES = {
  teal: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400",
  navy: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
  blue: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
  amber: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
  slate: "bg-slate-50 text-slate-400 dark:bg-white/5 dark:text-slate-500",
};

const STATUS_META = {
  accepted: { label: "Acceptée", cls: "bg-teal-50 text-teal-700 ring-1 ring-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:ring-teal-500/20", hex: "#16B8B1" },
  pending: { label: "En cours", cls: "bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/20", hex: "#94A3B8" },
  rejected: { label: "Refusée", cls: "bg-rose-50 text-rose-600 ring-1 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20", hex: "#F43F5E" },
};

const STATS_COLS = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
  5: "sm:grid-cols-2 lg:grid-cols-5",
};

const companyOf = (item) =>
  item?.company?.name || item?.company?.company_name || item?.company_name || item?.author?.name || "";

const typeOf = (item) => item?.contract_type || item?.job_type || item?.type || "";

const applicationTitle = (a) =>
  a?.job_offer?.title || a?.jobOffer?.title || a?.offer?.title || a?.title || "Offre d'emploi";

const proposalTitle = (p) =>
  p?.resource_request?.title || p?.resourceRequest?.title || p?.title || "Proposition";

const conversationName = (c, myId) =>
  c?.title ||
  c?.name ||
  c?.other_user?.name ||
  c?.participants?.find((p) => p?.id !== myId)?.name ||
  "Conversation";

const conversationPreview = (c) => {
  const last = c?.last_message ?? c?.lastMessage;
  if (typeof last === "string") return last;
  return last?.body || last?.content || last?.text || "";
};

/* ============================================================
   CHARGEMENT DES DONNÉES
============================================================ */

function useEndpoint(path, enabled, reloadKey) {
  const [state, setState] = useState({ data: null, loading: enabled, error: false });

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, loading: false, error: false });
      return undefined;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));

    api
      .get(path)
      .then((res) => {
        if (!cancelled) setState({ data: res.data ?? {}, loading: false, error: false });
      })
      .catch(() => {
        if (!cancelled) setState({ data: null, loading: false, error: true });
      });

    return () => {
      cancelled = true;
    };
  }, [path, enabled, reloadKey]);

  return { ...state, loading: state.loading && state.data === null };
}

/* ============================================================
   INDICATEURS PAR RÔLE
============================================================ */

function buildStats(role, s, x) {
  let list;

  if (role === "company") {
    list = [
      { key: "jobs", title: "Offres actives", value: s.job_offers_open, icon: FileText, to: "/my-publications", accent: "navy" },
      { key: "recv", title: "Candidatures reçues", value: x.applicationsReceived, icon: Inbox, to: "/my-publications", accent: "teal" },
      { key: "req", title: "Demandes ouvertes", value: s.resource_requests_open, icon: BriefcaseBusiness, to: "/my-publications", accent: "amber" },
      { key: "prop", title: "Propositions reçues", value: s.proposals_received, icon: Handshake, to: "/my-activity", accent: "blue" },
      { key: "mis", title: "Missions actives", value: s.active_missions, icon: Target, to: "/my-activity", accent: "teal" },
    ];
  } else if (role === "university") {
    list = [
      { key: "uni", title: "Universités", value: s.universities_count, icon: Building2, accent: "navy" },
      { key: "unread", title: "Messages non lus", value: x.unread, icon: MessageCircle, to: "/messages", accent: "teal" },
    ];
  } else if (role === "admin") {
    list = [
      { key: "usr", title: "Utilisateurs", value: s.users_count, icon: Users, accent: "navy" },
      { key: "cmp", title: "Entreprises", value: s.companies_count, icon: Building2, accent: "teal" },
      { key: "uni", title: "Universités", value: s.universities_count, icon: Building2, accent: "amber" },
      { key: "mis", title: "Missions", value: s.missions_count, icon: Target, accent: "blue" },
    ];
  } else {
    list = [
      { key: "app", title: "Candidatures envoyées", value: x.applicationsTotal ?? s.applications_count, icon: Send, to: "/my-activity", accent: "navy" },
      { key: "accp", title: "Candidatures acceptées", value: x.applicationsAccepted, icon: CheckCircle2, to: "/my-activity", accent: "teal" },
      { key: "rate", title: "Taux d'acceptation", value: x.acceptanceRate, suffix: " %", icon: Percent, accent: "blue" },
      { key: "mis", title: "Missions actives", value: s.active_missions, icon: Target, to: "/my-activity", accent: "amber" },
      { key: "opp", title: "Opportunités disponibles", value: x.opportunities, icon: BriefcaseBusiness, to: "/job-offers", accent: "teal" },
    ];
  }

  return list.filter((item) => hasValue(item.value));
}

function buildAlerts(role, s) {
  const alerts = [];
  if (role === "company" && number(s.pending_missions) > 0) {
    alerts.push({ key: "pm", label: "Missions en attente d'action", count: number(s.pending_missions), to: "/my-activity" });
  }
  if (role === "admin" && number(s.pending_verifications) > 0) {
    alerts.push({ key: "pv", label: "Vérifications en attente", count: number(s.pending_verifications), to: "/admin/verifications" });
  }
  return alerts;
}

function buildQuickLinks(role) {
  if (role === "company") {
    return [
      { to: "/my-publications", icon: BriefcaseBusiness, title: "Mes publications" },
      { to: "/my-activity", icon: Target, title: "Mon activité" },
      { to: "/company", icon: Building2, title: "Mon entreprise" },
      { to: "/resource-offers/browse", icon: Compass, title: "Ressources disponibles" },
      { to: "/messages", icon: MessageCircle, title: "Messagerie" },
    ];
  }
  if (role === "university") {
    return [{ to: "/messages", icon: MessageCircle, title: "Messagerie" }];
  }
  if (role === "admin") {
    return [{ to: "/admin/verifications", icon: CheckCircle2, title: "Vérifications" }];
  }
  return [
    { to: "/job-offers", icon: BriefcaseBusiness, title: "Offres d'emploi" },
    { to: "/browse-requests", icon: Handshake, title: "Demandes de ressources" },
    { to: "/resource-offers/browse", icon: Compass, title: "Ressources disponibles" },
    { to: "/my-activity", icon: Target, title: "Mon activité" },
    { to: "/messages", icon: MessageCircle, title: "Messagerie" },
    { to: "/profile", icon: CircleUserRound, title: "Mon profil" },
  ];
}

function buildFeed({ appList, proposalList, myJobList, myRequestList, notifList, role }) {
  const events = [];
  const isCompany = role === "company";

  appList.forEach((a, i) => {
    const bucket = bucketOf(a.status);
    const title = applicationTitle(a);
    let text = isCompany ? "Candidature reçue" : "Candidature envoyée";
    let detail = title;

    events.push({
      key: `app-${a.id ?? i}`, icon: Send,
      tone: bucket === "accepted" ? "teal" : bucket === "rejected" ? "slate" : "navy",
      text, detail, date: dateOf(a), to: "/my-activity",
    });
  });

  myJobList.forEach((o, i) => {
    events.push({
      key: `job-${o.id ?? i}`, icon: FileText, tone: "navy",
      text: "Offre publiée", detail: o.title || "", date: dateOf(o), to: "/my-publications",
    });
  });

  notifList.forEach((n, i) => {
    const link = n?.url || n?.link || n?.data?.url || n?.data?.link;
    events.push({
      key: `notif-${n.id ?? i}`, icon: Bell, tone: "slate",
      text: n?.title || n?.message || "Notification", detail: "",
      date: dateOf(n), to: typeof link === "string" && link.startsWith("/") ? link : null,
    });
  });

  return events.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0)).slice(0, 8);
}

/* ============================================================
   DASHBOARD
============================================================ */

const PANEL_GRID = { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3" };

function Dashboard() {
  const { user: authUser } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [dashboard, setDashboard] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const loadDashboard = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
      setReloadKey((k) => k + 1);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const [dashboardResult, profileResult] = await Promise.allSettled([
        api.get("/dashboard"),
        api.get("/profile/me"),
      ]);

      if (dashboardResult.status === "fulfilled") {
        setDashboard(dashboardResult.value?.data ?? {});
      } else {
        throw dashboardResult.reason;
      }

      if (profileResult.status === "fulfilled") {
        const response = profileResult.value?.data;
        setProfile(response?.profile ?? response?.data ?? response ?? null);
      }
    } catch (err) {
      console.error("Erreur de chargement du dashboard :", err);
      setError("Impossible de charger le tableau de bord. Réessaie dans un instant.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const user = profile?.user || profile || authUser || {};
  const role = getRole(authUser?.role ? authUser : user);
  const stats = dashboard?.stats || dashboard?.statistics || dashboard || {};

  const isTalent = role === "student" || role === "employee";
  const isCompany = role === "company";
  const hasMessages = isTalent || isCompany || role === "university";

  const apps = useEndpoint("/applications", isTalent || isCompany, reloadKey);
  const jobs = useEndpoint("/job-offers", isTalent, reloadKey);
  const myJobs = useEndpoint("/job-offers/my", isCompany, reloadKey);
  const myRequests = useEndpoint("/resource-requests/my", isCompany, reloadKey);
  const proposals = useEndpoint("/proposals/received", isTalent || isCompany, reloadKey);
  const convs = useEndpoint("/conversations", hasMessages, reloadKey);
  const unread = useEndpoint("/conversations/unread-count", hasMessages, reloadKey);
  const notifs = useEndpoint("/notifications", true, reloadKey);

  const appList = useMemo(() => toList(apps.data), [apps.data]);
  const jobList = useMemo(() => toList(jobs.data), [jobs.data]);
  const myJobList = useMemo(() => toList(myJobs.data), [myJobs.data]);
  const myRequestList = useMemo(() => toList(myRequests.data), [myRequests.data]);
  const proposalList = useMemo(() => toList(proposals.data), [proposals.data]);
  const convList = useMemo(() => toList(convs.data), [convs.data]);
  const notifList = useMemo(() => toList(notifs.data), [notifs.data]);

  const extra = useMemo(() => {
    const count = (list, bucket) => list.filter((i) => bucketOf(i.status) === bucket).length;
    const appsOk = apps.data !== null;
    const appsAccepted = count(appList, "accepted");
    const appsTotal = totalOf(apps.data, appList);
    const applicationsReceived = myJobList.some((o) => hasValue(o.applications_count))
      ? myJobList.reduce((sum, o) => sum + number(o.applications_count), 0)
      : undefined;

    return {
      unread: unread.data ? number(unread.data.unread_count) : undefined,
      applicationsTotal: appsOk ? appsTotal : undefined,
      applicationsPending: appsOk ? count(appList, "pending") : undefined,
      applicationsAccepted: appsOk ? appsAccepted : undefined,
      acceptanceRate: appsOk && appList.length > 0 ? Math.round((appsAccepted / appList.length) * 100) : undefined,
      opportunities: jobs.data ? totalOf(jobs.data, jobList) : undefined,
      jobsPublished: myJobs.data ? totalOf(myJobs.data, myJobList) : undefined,
      applicationsReceived,
      proposalsAccepted: proposals.data ? count(proposalList, "accepted") : undefined,
    };
  }, [apps.data, appList, jobs.data, jobList, myJobs.data, myJobList, proposals.data, proposalList, unread.data]);

  const statCards = useMemo(() => buildStats(role, stats, extra), [role, stats, extra]);
  const alerts = useMemo(() => buildAlerts(role, stats), [role, stats]);
  const quickLinks = useMemo(() => buildQuickLinks(role), [role]);
  const feed = useMemo(
    () => buildFeed({ appList, proposalList, myJobList, myRequestList, notifList, role }),
    [appList, proposalList, myJobList, myRequestList, notifList, role]
  );

  const completion = Math.min(100, Math.max(0, number(stats.completion)));

  const series = useMemo(() => {
    if (isTalent) {
      return [
        apps.data && { key: "apps", label: "Candidatures", hex: "#16B8B1", dates: appList.map(dateOf) },
        proposals.data && { key: "prop", label: "Propositions reçues", hex: "#0B1F33", dates: proposalList.map(dateOf) }, 
      ].filter(Boolean);
    }
    if (isCompany) {
      return [
        myJobs.data && { key: "jobs", label: "Offres publiées", hex: "#16B8B1", dates: myJobList.map(dateOf) },
        myRequests.data && { key: "req", label: "Demandes publiées", hex: "#F59E0B", dates: myRequestList.map(dateOf) },
        proposals.data && { key: "prop", label: "Propositions reçues", hex: "#0B1F33", dates: proposalList.map(dateOf) },
      ].filter(Boolean);
    }
    return [];
  }, [isTalent, isCompany, apps.data, appList, proposals.data, proposalList, myJobs.data, myJobList, myRequests.data, myRequestList]);

  const donut = useMemo(() => {
    const byStatus = (list) =>
      ["accepted", "pending", "rejected"].map((b) => ({
        key: b,
        title: STATUS_META[b].label,
        value: list.filter((i) => bucketOf(i.status) === b).length,
        hex: STATUS_META[b].hex,
      }));

    if (isTalent) {
      return { title: "Candidatures par statut", description: "Où en sont tes candidatures.", items: byStatus(appList) };
    }
    if (isCompany) {
      return { title: "Propositions par statut", description: "Suivi des propositions reçues.", items: byStatus(proposalList) };
    }
    return {
      title: "Part de chaque indicateur",
      description: "Poids dans l'activité totale.",
      items: statCards.map((c) => ({ key: c.key, title: c.title, value: number(c.value), hex: (CARD_PALETTES[c.accent] || CARD_PALETTES.navy).hex || "#16B8B1" })),
    };
  }, [isTalent, isCompany, appList, proposalList, statCards]);

  const messagesPanel = {
    key: "messages",
    title: "Messages récents",
    description: "Tes dernières conversations.",
    to: "/messages",
    linkLabel: "Messagerie",
    state: convs,
    items: convList.slice(0, 5),
    emptyIcon: MessageCircle,
    emptyText: "Aucune conversation pour le moment.",
    row: (c) => {
      const count = number(c.unread_count);
      return {
        icon: MessageCircle,
        title: conversationName(c, authUser?.id),
        subtitle: conversationPreview(c),
        meta: timeAgo(dateOf(c.last_message ?? c) || dateOf(c)),
        badge: count > 0 ? { label: String(count), cls: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400" } : null,
        to: "/messages",
      };
    },
  };

  let panels = [];
  if (isTalent) {
    panels = [
      {
        key: "apps",
        title: "Mes candidatures",
        description: "Tes dernières démarches.",
        to: "/my-activity",
        linkLabel: "Tout voir",
        state: apps,
        items: appList.slice(0, 5),
        emptyIcon: FileText,
        emptyText: "Tu n'as pas encore candidaté à une offre.",
        row: (a) => ({
          icon: FileText,
          title: applicationTitle(a),
          subtitle: companyOf(a.job_offer || a.jobOffer) || companyOf(a),
          meta: timeAgo(dateOf(a)),
          badge: STATUS_META[bucketOf(a.status)],
          to: "/my-activity",
        }),
      },
      {
        key: "jobs",
        title: "Opportunités récentes",
        description: "Dernières offres publiées.",
        to: "/job-offers",
        linkLabel: "Toutes les offres",
        state: jobs,
        items: jobList.slice(0, 5),
        emptyIcon: BriefcaseBusiness,
        emptyText: "Aucune offre disponible actuellement.",
        row: (o) => ({
          icon: BriefcaseBusiness,
          title: o.title || "Offre d'emploi",
          subtitle: [companyOf(o), typeOf(o)].filter(Boolean).join(" · "),
          meta: timeAgo(dateOf(o)),
          to: "/job-offers",
        }),
      },
      messagesPanel,
    ];
  } else if (isCompany) {
    panels = [
      {
        key: "myjobs",
        title: "Mes offres récentes",
        description: "Tes dernières publications.",
        to: "/my-publications",
        linkLabel: "Tout voir",
        state: myJobs,
        items: myJobList.slice(0, 5),
        emptyIcon: FileText,
        emptyText: "Tu n'as pas encore publié d'offre.",
        row: (o) => ({
          icon: FileText,
          title: o.title || "Offre d'emploi",
          subtitle: hasValue(o.applications_count) ? `${number(o.applications_count)} candidature(s)` : typeOf(o),
          meta: timeAgo(dateOf(o)),
          to: "/my-publications",
        }),
      },
      {
        key: "proposals",
        title: "Propositions reçues",
        description: "Les dernières propositions.",
        to: "/my-activity",
        linkLabel: "Tout voir",
        state: proposals,
        items: proposalList.slice(0, 5),
        emptyIcon: Handshake,
        emptyText: "Aucune proposition reçue pour le moment.",
        row: (p) => ({
          icon: Handshake,
          title: proposalTitle(p),
          subtitle: p?.sender?.name || p?.talent?.name || "",
          meta: timeAgo(dateOf(p)),
          badge: STATUS_META[bucketOf(p.status)],
          to: "/my-activity",
        }),
      },
      messagesPanel,
    ];
  } else if (role === "university") {
    panels = [messagesPanel];
  }

  return (
    <AppShell>
      <div className="font-['Plus_Jakarta_Sans',sans-serif] text-slate-800 dark:text-slate-200 min-h-screen bg-[#F8FAFC] dark:bg-[#0A1230]">
        <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
          {error && (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-2">
                <Activity size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 font-medium transition hover:bg-rose-100 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
                Réessayer
              </button>
            </div>
          )}

          {loading ? (
            <DashboardSkeleton />
          ) : (
            <>
             

              {/* ✅ GRILLE DES CARTES COLORÉES */}
              {statCards.length > 0 && (
                <section className={`grid grid-cols-1 gap-4 ${STATS_COLS[statCards.length] || "sm:grid-cols-2 lg:grid-cols-4"}`}>
                  {statCards.map((c, i) => (
                    <StatTile key={c.key} card={c} featured={i === 0} />
                  ))}
                </section>
              )}

              {alerts.map((alert) => (
                <AlertBanner key={alert.key} {...alert} />
              ))}

              <section className="grid gap-5 lg:grid-cols-3">
                {series.length > 0 ? (
                  <>
                   <EvolutionChart series={series} className="lg:col-span-2" isDark={isDark} />
                  <StatusDonut {...donut} isDark={isDark} />
                  </>
                ) : (
                  <>
                   <StatusDonut {...donut} isDark={isDark} />
                    <QuickLinksPanel links={quickLinks} className="lg:col-span-2" />
                  </>
                )}
              </section>

              <section className="grid gap-5 lg:grid-cols-3">
                <RecentActivity
                  events={feed}
                  loading={notifs.loading}
                  className={isTalent || isCompany ? "lg:col-span-2" : "lg:col-span-3"}
                />
                {isTalent && (
                  <ProfilePanel
                    completion={completion}
                    nextStep={stats.completion_next_step}
                    breakdown={stats.completion_breakdown}
                  />
                )}
                {isCompany && <QuickLinksPanel links={quickLinks} />}
              </section>

              {panels.length > 0 && (
                <section className={`grid gap-5 ${PANEL_GRID[panels.length] || "lg:grid-cols-3"}`}>
                  {panels.map(({ key, ...panel }) => (
                    <ListPanel key={key} {...panel} />
                  ))}
                </section>
              )}

              {isTalent && <QuickLinksPanel links={quickLinks} wide />}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

/* ============================================================
   SKELETON
============================================================ */

function DashboardSkeleton() {
  const pulse = "animate-pulse rounded-xl bg-white dark:bg-[#131E47]";
  return (
    <div className="space-y-5" role="status" aria-label="Chargement du tableau de bord">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-32 ${pulse}`} />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className={`h-80 lg:col-span-2 ${pulse}`} />
        <div className={`h-80 ${pulse}`} />
      </div>
    </div>
  );
}

/* ============================================================
   COMPOSANTS DE BASE
============================================================ */

function Panel({ title, description, action, children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm sm:p-6 dark:border-white/10 dark:bg-[#131E47] ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-white">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function AlertBanner({ label, count, to }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/60 bg-amber-50/50 p-4 transition hover:bg-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-amber-500/20 dark:bg-amber-500/5 dark:hover:bg-amber-500/10"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-amber-500 shadow-sm dark:bg-amber-500/10">
          <Target size={18} />
        </div>
        <div>
          <p className="font-medium text-amber-900 dark:text-amber-100">{label}</p>
          <p className="text-xs text-amber-700/80 dark:text-amber-300/80">{count} élément(s) nécessitent ton attention.</p>
        </div>
      </div>
      <ArrowRight size={16} className="shrink-0 text-amber-500" />
    </Link>
  );
}

function EmptyState({ icon: Icon, title, text, compact = false }) {
  return (
    <div
      className={`flex flex-col items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 text-center dark:border-white/10 dark:bg-[#0A1230] ${
        compact ? "py-6" : "py-10"
      }`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm dark:bg-white/5 dark:text-slate-500">
        <Icon size={18} />
      </div>
      {title && <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">{title}</p>}
      <p className={`max-w-xs text-xs text-slate-400 dark:text-slate-500 ${title ? "mt-1" : "mt-3"}`}>{text}</p>
    </div>
  );
}

/* ============================================================
   STATISTIQUES
============================================================ */

function StatsGrid({ cards }) {
  const cols = STATS_COLS[cards.length] || "sm:grid-cols-2 lg:grid-cols-4";
  return (
    <section aria-label="Statistiques" className={`grid grid-cols-1 gap-4 ${cols}`}>
      {cards.map((c, i) => (
        <StatTile key={c.key} card={c} featured={i === 0} />
      ))}
    </section>
  );
}

/* ✅ LA CARTE STATISTIQUE RE-DESIGNÉE AVEC COULEURS */
function StatTile({ card, featured }) {
  const { title, value, suffix = "", icon: Icon, accent = "navy", to } = card;
  // On récupère le thème de la carte
  const theme = CARD_PALETTES[accent] || CARD_PALETTES.navy;
  const num = number(value);

  // Si c'est la carte mise en avant (featured), elle utilise le thème "navy" (Bleu Marine foncé)
  const activeTheme = featured ? CARD_PALETTES.navy : theme;

  const body = (
    <>
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${activeTheme.iconBg}`}>
          <Icon size={18} strokeWidth={2} />
        </span>
        {to && (
          <span className={`flex h-7 w-7 items-center justify-center rounded-full transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${featured ? "bg-white/10 text-white" : "bg-black/5 text-black/40 dark:bg-white/10 dark:text-white/50"}`}>
            <ArrowUpRight size={14} />
          </span>
        )}
      </div>

      <div className="relative mt-5">
        <p className={`text-2xl font-semibold leading-none tracking-tight ${activeTheme.textMain}`}>
          {num.toLocaleString("fr-FR")}
          {suffix && <span className="ml-1 text-sm font-medium opacity-60">{suffix}</span>}
        </p>
        <p className={`mt-1.5 truncate text-xs font-medium ${activeTheme.textSub}`}>{title}</p>
      </div>
    </>
  );

  const cls = `group relative block overflow-hidden rounded-xl p-4 transition duration-200 border ${activeTheme.bg} ${activeTheme.hover}`;

  return to ? (
    <Link to={to} className={cls}>{body}</Link>
  ) : (
    <article className={cls}>{body}</article>
  );
}

/* ============================================================
   GRAPHIQUE D'ÉVOLUTION (courbes lissées)
============================================================ */

function smoothPath(pts) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return d;
}

function EvolutionChart({ series, className = "", isDark }) {
  const [weeks, setWeeks] = useState(8);

  const { buckets, lines } = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - (weeks - 1) * 7);

    const starts = Array.from({ length: weeks }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i * 7);
      return d;
    });

    const computed = series.map((s) => ({
      ...s,
      values: starts.map((from, i) => {
        const a = from.getTime();
        const b = i < weeks - 1 ? starts[i + 1].getTime() : Infinity;
        return s.dates.filter((d) => d && d.getTime() >= a && d.getTime() < b).length;
      }),
    }));

    return { buckets: starts, lines: computed };
  }, [series, weeks]);

  const max = Math.max(...lines.flatMap((l) => l.values), 0);
  const maxY = Math.max(4, Math.ceil(max / 4) * 4);

  const W = 640;
  const H = 240;
  const pl = 34;
  const pr = 12;
  const pt = 14;
  const pb = 28;
  const x = (i) => pl + (i * (W - pl - pr)) / Math.max(1, weeks - 1);
  const y = (v) => pt + (H - pt - pb) * (1 - v / maxY);
  const labelStep = weeks > 8 ? 2 : 1;

  const axisColor = isDark ? "#64748B" : "#94A3B8";
  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9";

  return (
    <Panel
      title="Évolution de l'activité"
      description="Nombre d'éléments créés par semaine."
      className={className}
      action={
        <div role="group" aria-label="Période" className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-white/5">
          {[4, 8, 12].map((w) => (
            <button
              key={w}
              type="button"
              aria-pressed={weeks === w}
              onClick={() => setWeeks(w)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                weeks === w ? "bg-white text-slate-800 shadow-sm dark:bg-white/10 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {w} sem.
            </button>
          ))}
        </div>
      }
    >
      <ul className="mb-4 flex flex-wrap gap-x-5 gap-y-2">
        {lines.map((l) => (
          <li key={l.key} className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-600 dark:bg-white/5 dark:text-slate-300">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.hex }} />
            {l.label}
            <span className="font-semibold text-slate-800 dark:text-white">{l.values.reduce((a, b) => a + b, 0)}</span>
          </li>
        ))}
      </ul>

      {max === 0 ? (
        <EmptyState icon={TrendingUp} title="Aucune activité sur cette période" text="Les courbes apparaîtront dès que tu auras de l'activité." />
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Évolution sur ${weeks} semaines : ${lines.map((l) => `${l.label} ${l.values.join(", ")}`).join(" ; ")}`}
        >
          <defs>
            {lines.map((l) => (
              <linearGradient key={l.key} id={`evo-${l.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={l.hex} stopOpacity="0.15" />
                <stop offset="100%" stopColor={l.hex} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {[0, 1, 2, 3, 4].map((i) => {
            const v = (maxY * i) / 4;
            return (
              <g key={i}>
                <line x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} stroke={gridColor} strokeWidth="1" strokeDasharray={i === 0 ? "0" : "4 5"} />
                <text x={pl - 8} y={y(v) + 3} textAnchor="end" fontSize="10" fill={axisColor}>
                  {v}
                </text>
              </g>
            );
          })}

          {buckets.map((b, i) =>
            i % labelStep === 0 ? (
              <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill={axisColor}>
                {b.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
              </text>
            ) : null
          )}

          {lines.map((l) => {
            const pts = l.values.map((v, i) => [x(i), y(v)]);
            const line = smoothPath(pts);
            const area = `${line} L${x(weeks - 1)},${y(0)} L${x(0)},${y(0)} Z`;
            return (
              <g key={l.key}>
                <path d={area} fill={`url(#evo-${l.key})`} />
                <path d={line} fill="none" stroke={l.hex} strokeWidth="2" strokeLinecap="round" />
                {l.values.map((v, i) => (
                  <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill={isDark ? "#131E47" : "#fff"} stroke={l.hex} strokeWidth="2">
                    <title>{`${l.label} — semaine du ${buckets[i].toLocaleDateString("fr-FR")} : ${v}`}</title>
                  </circle>
                ))}
              </g>
            );
          })}
        </svg>
      )}
    </Panel>
  );
}

/* ============================================================
   DONUT
============================================================ */

function StatusDonut({ title, description, items, isDark }) {
  const visible = items.filter((i) => i.value > 0);
  const total = visible.reduce((sum, i) => sum + i.value, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const gap = visible.length > 1 ? 3 : 0;
  let acc = 0;

  return (
    <Panel title={title} description={description}>
      {total === 0 ? (
        <EmptyState icon={Activity} title="Rien à répartir" text="Le graphique apparaîtra avec ta première activité." />
      ) : (
        <div className="flex flex-col items-center">
          <div
            className="relative h-40 w-40"
            role="img"
            aria-label={`Répartition : ${visible.map((i) => `${i.title} ${i.value}`).join(", ")}`}
          >
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r={radius} fill="none" stroke={isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9"} strokeWidth="10" />
              {visible.map((item) => {
                const len = (item.value / total) * circumference;
                const dash = Math.max(len - gap, 0.5);
                const circle = (
                  <circle
                    key={item.key}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={item.hex}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={-acc}
                  />
                );
                acc += len;
                return circle;
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>{total.toLocaleString("fr-FR")}</span>
              <span className={`text-[10px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>au total</span>
            </div>
          </div>

          <ul className="mt-5 w-full space-y-2">
            {visible.map((item) => (
              <li key={item.key} className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs ${isDark ? "bg-[#0A1230]" : "bg-slate-50"}`}>
                <span className={`flex items-center gap-2 font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.hex }} />
                  {item.title}
                </span>
                <span className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>
                  {item.value} <span className={`font-normal ${isDark ? "text-slate-500" : "text-slate-400"}`}>· {Math.round((item.value / total) * 100)} %</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

/* ============================================================
   ACTIVITÉ RÉCENTE & LISTES
============================================================ */

function SkeletonRows() {
  return (
    <div className="space-y-3" role="status" aria-label="Chargement">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-50 dark:bg-white/5" />
      ))}
    </div>
  );
}

function Row({ icon: Icon, tone = "slate", title, subtitle, meta, badge, to }) {
  const body = (
    <div className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition hover:bg-slate-50 dark:hover:bg-white/5">
      <span className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-4 ring-white dark:ring-[#131E47] ${TONES[tone]}`}>
        <Icon size={16} strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{title}</p>
        {subtitle && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {badge && <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.cls}`}>{badge.label}</span>}
        {meta && <span className="text-[10px] text-slate-400 dark:text-slate-500">{meta}</span>}
      </div>
    </div>
  );

  return to ? (
    <Link to={to} className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400">
      {body}
    </Link>
  ) : (
    body
  );
}

function RecentActivity({ events, loading, className = "" }) {
  return (
    <Panel title="Activité récente" description="Tes dernières actions sur TalentShare." className={className}>
      {loading ? (
        <SkeletonRows />
      ) : events.length === 0 ? (
        <EmptyState icon={Activity} title="Aucune activité récente" text="Tes candidatures, publications et notifications apparaîtront ici." />
      ) : (
        <ul className="relative">
          <span className="absolute bottom-6 left-[28px] top-6 w-px bg-slate-100 dark:bg-white/5" aria-hidden="true" />
          {events.map((e) => (
            <li key={e.key}>
              <Row icon={e.icon} tone={e.tone} title={e.text} subtitle={e.detail} meta={timeAgo(e.date)} to={e.to} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function ListPanel({ title, description, to, linkLabel, state, items, emptyIcon, emptyText, row }) {
  return (
    <Panel
      title={title}
      description={description}
      action={
        <Link
          to={to}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
        >
          {linkLabel} <ChevronRight size={12} />
        </Link>
      }
    >
      {state.loading ? (
        <SkeletonRows />
      ) : state.error ? (
        <EmptyState compact icon={Activity} text="Ces données sont momentanément indisponibles." />
      ) : items.length === 0 ? (
        <EmptyState compact icon={emptyIcon} text={emptyText} />
      ) : (
        <ul className="space-y-0.5">
          {items.map((item, index) => (
            <li key={item.id ?? index}>
              <Row {...row(item)} tone="slate" />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* ============================================================
   PROFIL & RACCOURCIS
============================================================ */

function ProfilePanel({ completion, nextStep, breakdown }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - completion / 100);
  const missing = Array.isArray(breakdown) ? breakdown.filter((item) => !item.done).slice(0, 4) : [];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60 dark:bg-[#131E47] dark:ring-white/10 sm:p-6">
      <div className="relative">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Complétion du profil</h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Calculée à partir de ton profil.</p>
      </div>

      <div className="relative mt-5 flex items-center gap-4">
        <div
          className="relative h-20 w-20 shrink-0"
          role="progressbar"
          aria-valuenow={completion}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Complétion du profil"
        >
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="8" className="dark:stroke-white/5" />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#16B8B1"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-base font-semibold text-slate-700 dark:text-slate-200">{completion} %</span>
        </div>

        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
          {nextStep || "Un profil complet met en valeur tes compétences."}
        </p>
      </div>

      {missing.length > 0 && (
        <ul className="relative mt-5 space-y-2">
          {missing.map((item) => (
            <li key={item.key} className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-white/5 dark:text-slate-300">
              <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-slate-300 dark:border-slate-600" />
              {item.label}
            </li>
          ))}
        </ul>
      )}

      <Link
        to="/profile"
        className="relative mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-50 px-4 py-2.5 text-xs font-medium text-teal-700 transition hover:bg-teal-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20"
      >
        Compléter mon profil
        <ChevronRight size={14} />
      </Link>
    </div>
  );
}

function QuickLinksPanel({ links, wide = false, className = "" }) {
  return (
    <Panel title="Actions rapides" description="Va directement où tu veux." className={className}>
      <ul className={`grid gap-3 ${wide ? "grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" : "grid-cols-2"}`}>
        {links.map(({ to, icon: Icon, title }) => (
          <li key={to}>
            <Link
              to={to}
              className="group flex h-full flex-col items-start gap-3 rounded-xl bg-slate-50 p-3.5 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm transition group-hover:text-teal-600 dark:bg-[#131E47] dark:text-slate-400 dark:group-hover:text-teal-400">
                <Icon size={16} strokeWidth={1.8} />
              </span>
              <span className="flex w-full items-center justify-between gap-2 text-xs font-medium leading-tight text-slate-600 dark:text-slate-300">
                {title}
                <ArrowUpRight size={13} className="shrink-0 text-slate-300 transition group-hover:text-teal-600 dark:text-slate-600 dark:group-hover:text-teal-400" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export default Dashboard;