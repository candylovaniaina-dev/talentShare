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
  Clock,
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

/* ============================================================
   HELPERS
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

const STATUS_META = {
  accepted: { label: "Acceptée", cls: "bg-emerald-50 text-emerald-700", hex: "#16B8B1" },
  pending: { label: "En cours", cls: "bg-blue-50 text-blue-700", hex: "#3B82F6" },
  rejected: { label: "Refusée", cls: "bg-slate-100 text-slate-600", hex: "#94A3B8" },
};

const COLORS = {
  emerald: { icon: "bg-emerald-50 text-emerald-600", hex: "#16B8B1", hover: "hover:border-emerald-200" },
  blue: { icon: "bg-blue-50 text-blue-600", hex: "#3B82F6", hover: "hover:border-blue-200" },
  violet: { icon: "bg-violet-50 text-violet-600", hex: "#8B5CF6", hover: "hover:border-violet-200" },
  amber: { icon: "bg-amber-50 text-amber-600", hex: "#F59E0B", hover: "hover:border-amber-200" },
};

const TONES = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-amber-50 text-amber-600",
  slate: "bg-slate-100 text-slate-500",
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
      { key: "jobs", title: "Offres actives", value: s.job_offers_open, icon: FileText, to: "/my-publications", accent: "blue" },
      { key: "recv", title: "Candidatures reçues", value: x.applicationsReceived, icon: Inbox, to: "/my-publications", accent: "emerald" },
      { key: "req", title: "Demandes ouvertes", value: s.resource_requests_open, icon: BriefcaseBusiness, to: "/my-publications", accent: "amber" },
      { key: "prop", title: "Propositions reçues", value: s.proposals_received, icon: Handshake, to: "/my-activity", accent: "violet" },
      { key: "accp", title: "Propositions acceptées", value: x.proposalsAccepted, icon: CheckCircle2, to: "/my-activity", accent: "emerald" },
      { key: "mis", title: "Missions actives", value: s.active_missions, icon: Target, to: "/my-activity", accent: "amber" },
      { key: "pub", title: "Offres publiées", value: x.jobsPublished, icon: TrendingUp, to: "/my-publications", accent: "blue" },
      { key: "unread", title: "Messages non lus", value: x.unread, icon: MessageCircle, to: "/messages", accent: "violet" },
    ];
  } else if (role === "university") {
    list = [
      { key: "uni", title: "Universités", value: s.universities_count, icon: Building2, accent: "blue" },
      { key: "unread", title: "Messages non lus", value: x.unread, icon: MessageCircle, to: "/messages", accent: "violet" },
    ];
  } else if (role === "admin") {
    list = [
      { key: "usr", title: "Utilisateurs", value: s.users_count, icon: Users, accent: "blue" },
      { key: "cmp", title: "Entreprises", value: s.companies_count, icon: Building2, accent: "emerald" },
      { key: "uni", title: "Universités", value: s.universities_count, icon: Building2, accent: "violet" },
      { key: "mis", title: "Missions", value: s.missions_count, icon: Target, accent: "amber" },
    ];
  } else {
    list = [
      { key: "app", title: "Candidatures envoyées", value: x.applicationsTotal ?? s.applications_count, icon: Send, to: "/my-activity", accent: "blue" },
      { key: "accp", title: "Candidatures acceptées", value: x.applicationsAccepted, icon: CheckCircle2, to: "/my-activity", accent: "emerald" },
      { key: "rate", title: "Taux d'acceptation", value: x.acceptanceRate, suffix: " %", icon: Percent, accent: "violet" },
      { key: "mis", title: "Missions actives", value: s.active_missions, icon: Target, to: "/my-activity", accent: "emerald" },
      { key: "opp", title: "Opportunités disponibles", value: x.opportunities, icon: BriefcaseBusiness, to: "/job-offers", accent: "amber" },
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

function buildFeed({ appList, proposalList, myJobList, myRequestList, notifList }) {
  const events = [];

  appList.forEach((a, i) => {
    const bucket = bucketOf(a.status);
    events.push({
      key: `app-${a.id ?? i}`,
      icon: Send,
      tone: bucket === "accepted" ? "emerald" : bucket === "rejected" ? "slate" : "blue",
      text: bucket === "accepted" ? "Candidature acceptée" : bucket === "rejected" ? "Candidature refusée" : "Candidature envoyée",
      detail: applicationTitle(a),
      date: dateOf(a),
      to: "/my-activity",
    });
  });

  proposalList.forEach((p, i) => {
    events.push({
      key: `prop-${p.id ?? i}`,
      icon: Handshake,
      tone: "violet",
      text: bucketOf(p.status) === "accepted" ? "Proposition acceptée" : "Proposition reçue",
      detail: proposalTitle(p),
      date: dateOf(p),
      to: "/my-activity",
    });
  });

  myJobList.forEach((o, i) => {
    events.push({
      key: `job-${o.id ?? i}`,
      icon: FileText,
      tone: "blue",
      text: "Offre publiée",
      detail: o.title || "",
      date: dateOf(o),
      to: "/my-publications",
    });
  });

  myRequestList.forEach((r, i) => {
    events.push({
      key: `req-${r.id ?? i}`,
      icon: BriefcaseBusiness,
      tone: "amber",
      text: "Demande de ressources publiée",
      detail: r.title || "",
      date: dateOf(r),
      to: "/my-publications",
    });
  });

  notifList.forEach((n, i) => {
    const link = n?.url || n?.link || n?.data?.url || n?.data?.link;
    events.push({
      key: `notif-${n.id ?? i}`,
      icon: Bell,
      tone: "slate",
      text: n?.title || n?.message || n?.data?.title || n?.data?.message || "Nouvelle notification",
      detail: n?.title && n?.message ? n.message : "",
      date: dateOf(n),
      to: typeof link === "string" && link.startsWith("/") ? link : null,
    });
  });

  return events
    .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
    .slice(0, 8);
}

/* ============================================================
   DASHBOARD
============================================================ */

const PANEL_GRID = { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3" };

function Dashboard() {
  const { user: authUser } = useAuth();

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
      setError(
        err?.response?.data?.message ||
          "Impossible de charger le tableau de bord. Réessaie dans un instant."
      );
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

  const apps = useEndpoint("/applications", isTalent, reloadKey);
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
    () => buildFeed({ appList, proposalList, myJobList, myRequestList, notifList }),
    [appList, proposalList, myJobList, myRequestList, notifList]
  );

  const completion = Math.min(100, Math.max(0, number(stats.completion)));

  const series = useMemo(() => {
    if (isTalent) {
      return [
        apps.data && { key: "apps", label: "Candidatures", hex: "#3B82F6", dates: appList.map(dateOf) },
        proposals.data && { key: "prop", label: "Propositions reçues", hex: "#8B5CF6", dates: proposalList.map(dateOf) },
      ].filter(Boolean);
    }
    if (isCompany) {
      return [
        myJobs.data && { key: "jobs", label: "Offres publiées", hex: "#3B82F6", dates: myJobList.map(dateOf) },
        myRequests.data && { key: "req", label: "Demandes publiées", hex: "#16B8B1", dates: myRequestList.map(dateOf) },
        proposals.data && { key: "prop", label: "Propositions reçues", hex: "#8B5CF6", dates: proposalList.map(dateOf) },
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
      items: statCards.map((c) => ({ key: c.key, title: c.title, value: number(c.value), hex: (COLORS[c.accent] || COLORS.emerald).hex })),
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
        badge: count > 0 ? { label: String(count), cls: "bg-emerald-100 text-emerald-700" } : null,
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
      <div className="text-[#17213A]">
        <div className="mx-auto max-w-7xl space-y-5">
          {error && (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-2">
                <Activity size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 font-semibold transition hover:bg-red-100 disabled:opacity-60"
              >
                <RefreshCw size={15} className={refreshing ? "animate-spin motion-reduce:animate-none" : ""} />
                Réessayer
              </button>
            </div>
          )}

          {loading ? (
            <DashboardSkeleton />
          ) : (
            <>
              {/* Barre d'outils discrète */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => loadDashboard(true)}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#E4EBF1] bg-white px-3 py-1.5 text-xs font-semibold text-[#334B63] transition hover:border-emerald-300 hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-60"
                >
                  <RefreshCw size={13} className={refreshing ? "animate-spin motion-reduce:animate-none" : ""} />
                  Actualiser
                </button>
              </div>

              {/* ✅ Grille de statistiques visuelles */}
              {statCards.length > 0 && <StatsGrid cards={statCards} />}

              {alerts.map((alert) => (
                <AlertBanner key={alert.key} {...alert} />
              ))}

              {/* Graphiques */}
              <section className="grid gap-5 lg:grid-cols-3">
                {series.length > 0 ? (
                  <>
                    <EvolutionChart series={series} className="lg:col-span-2" />
                    <StatusDonut {...donut} />
                  </>
                ) : (
                  <>
                    <StatusDonut {...donut} />
                    <QuickLinksPanel links={quickLinks} className="lg:col-span-2" />
                  </>
                )}
              </section>

              {/* Activité récente + profil / raccourcis */}
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

              {/* Listes détaillées */}
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
  const pulse = "animate-pulse motion-reduce:animate-none rounded-2xl bg-white";
  return (
    <div className="space-y-5" role="status" aria-label="Chargement du tableau de bord">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-32 ${pulse}`} />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className={`h-72 lg:col-span-2 ${pulse}`} />
        <div className={`h-72 ${pulse}`} />
      </div>
    </div>
  );
}

/* ============================================================
   COMPOSANTS DE BASE
============================================================ */

function Panel({ title, description, action, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-[#E4EBF1] bg-white p-5 shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-[#0B1F33]">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-[#64788C]">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function AlertBanner({ label, count, to }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 transition hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <Target size={20} />
        </div>
        <div>
          <p className="font-semibold text-amber-950">{label}</p>
          <p className="text-sm text-amber-800">{count} élément(s) nécessitent ton attention.</p>
        </div>
      </div>
      <ArrowRight size={18} className="shrink-0 text-amber-900" />
    </Link>
  );
}

function EmptyState({ icon: Icon, title, text, compact = false }) {
  return (
    <div
      className={`flex flex-col items-center rounded-xl border border-dashed border-[#D5DFE8] bg-[#F9FBFC] px-4 text-center ${
        compact ? "py-6" : "py-9"
      }`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#8A9BB0] shadow-sm">
        <Icon size={19} />
      </div>
      {title && <p className="mt-3 text-sm font-semibold text-[#0B1F33]">{title}</p>}
      <p className={`max-w-xs text-xs text-[#64788C] ${title ? "mt-1" : "mt-3"}`}>{text}</p>
    </div>
  );
}

/* ============================================================
   GRILLE DE STATISTIQUES (remplace les cartes-boutons)
============================================================ */

function StatsGrid({ cards }) {
  return (
    <section aria-label="Statistiques" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <StatTile key={c.key} card={c} />
      ))}
    </section>
  );
}

function StatTile({ card }) {
  const { title, value, suffix = "", icon: Icon, accent = "emerald" } = card;
  const palette = COLORS[accent] || COLORS.emerald;
  const num = number(value);
  const pct = Math.min(100, Math.max(6, num));

  return (
    <article className="group flex flex-col gap-3 rounded-2xl border border-[#E4EBF1] bg-white p-4 transition hover:border-[#D5DFE8] hover:shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${palette.icon}`}>
          <Icon size={17} strokeWidth={1.9} />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A9BB0]">
          {title.split(" ").slice(-1)[0]}
        </span>
      </div>

      <div>
        <p className="text-[26px] font-bold leading-none tracking-tight text-[#0B1F33]">
          {num.toLocaleString("fr-FR")}
          <span className="ml-0.5 text-base font-semibold text-[#8A9BB0]">{suffix}</span>
        </p>
        <p className="mt-1 truncate text-[13px] font-medium text-[#334B63]">{title}</p>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-[#F1F6FA]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: palette.hex }}
        />
      </div>
    </article>
  );
}

/* ============================================================
   GRAPHIQUE D'ÉVOLUTION
============================================================ */

function EvolutionChart({ series, className = "" }) {
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
  const H = 230;
  const pl = 34;
  const pr = 12;
  const pt = 14;
  const pb = 28;
  const x = (i) => pl + (i * (W - pl - pr)) / Math.max(1, weeks - 1);
  const y = (v) => pt + (H - pt - pb) * (1 - v / maxY);
  const labelStep = weeks > 8 ? 2 : 1;

  return (
    <Panel
      title="Évolution de l'activité"
      description="Nombre d'éléments créés par semaine."
      className={className}
      action={
        <div role="group" aria-label="Période" className="inline-flex rounded-lg border border-[#E4EBF1] bg-[#F5F8FA] p-0.5">
          {[4, 8, 12].map((w) => (
            <button
              key={w}
              type="button"
              aria-pressed={weeks === w}
              onClick={() => setWeeks(w)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                weeks === w ? "bg-white text-[#0B1F33] shadow-sm" : "text-[#64788C] hover:text-[#0B1F33]"
              }`}
            >
              {w} sem.
            </button>
          ))}
        </div>
      }
    >
      <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1">
        {lines.map((l) => (
          <li key={l.key} className="flex items-center gap-2 text-xs text-[#334B63]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.hex }} />
            {l.label}
            <span className="font-bold text-[#0B1F33]">{l.values.reduce((a, b) => a + b, 0)}</span>
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
          {[0, 1, 2, 3, 4].map((i) => {
            const v = (maxY * i) / 4;
            return (
              <g key={i}>
                <line x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} stroke="#EDF2F6" strokeWidth="1" />
                <text x={pl - 6} y={y(v) + 3} textAnchor="end" fontSize="10" fill="#8A9BB0">
                  {v}
                </text>
              </g>
            );
          })}

          {buckets.map((b, i) =>
            i % labelStep === 0 ? (
              <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#8A9BB0">
                {b.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
              </text>
            ) : null
          )}

          {lines.map((l) => {
            const points = l.values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
            const area = `M${x(0)},${y(0)} L${points.replace(/ /g, " L")} L${x(weeks - 1)},${y(0)} Z`;
            return (
              <g key={l.key}>
                <path d={area} fill={l.hex} opacity="0.08" />
                <polyline points={points} fill="none" stroke={l.hex} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                {l.values.map((v, i) => (
                  <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill="#fff" stroke={l.hex} strokeWidth="2">
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

function StatusDonut({ title, description, items }) {
  const visible = items.filter((i) => i.value > 0);
  const total = visible.reduce((sum, i) => sum + i.value, 0);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  let acc = 0;

  return (
    <Panel title={title} description={description}>
      {total === 0 ? (
        <EmptyState icon={Activity} title="Rien à répartir" text="Le graphique apparaîtra avec ta première activité." />
      ) : (
        <div className="flex flex-col items-center">
          <div
            className="relative h-36 w-36"
            role="img"
            aria-label={`Répartition : ${visible.map((i) => `${i.title} ${i.value}`).join(", ")}`}
          >
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r={radius} fill="none" stroke="#E8EEF3" strokeWidth="10" />
              {visible.map((item) => {
                const len = (item.value / total) * circumference;
                const circle = (
                  <circle
                    key={item.key}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={item.hex}
                    strokeWidth="10"
                    strokeDasharray={`${len} ${circumference - len}`}
                    strokeDashoffset={-acc}
                  />
                );
                acc += len;
                return circle;
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-[#0B1F33]">{total.toLocaleString("fr-FR")}</span>
              <span className="text-xs text-[#64788C]">au total</span>
            </div>
          </div>

          <ul className="mt-4 w-full space-y-1.5">
            {visible.map((item) => (
              <li key={item.key} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 text-[#334B63]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.hex }} />
                  {item.title}
                </span>
                <span className="font-semibold text-[#0B1F33]">
                  {item.value} · {Math.round((item.value / total) * 100)} %
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
        <div key={i} className="h-12 animate-pulse rounded-xl bg-[#F1F6FA] motion-reduce:animate-none" />
      ))}
    </div>
  );
}

function Row({ icon: Icon, tone = "slate", title, subtitle, meta, badge, to }) {
  const body = (
    <div className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-[#F5F8FA]">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONES[tone]}`}>
        <Icon size={17} strokeWidth={1.9} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#0B1F33]">{title}</p>
        {subtitle && <p className="truncate text-xs text-[#64788C]">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {badge && <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.cls}`}>{badge.label}</span>}
        {meta && <span className="text-[11px] text-[#8A9BB0]">{meta}</span>}
      </div>
    </div>
  );

  return to ? (
    <Link to={to} className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
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
        <ul className="divide-y divide-[#EDF2F6]">
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
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 focus:outline-none focus-visible:underline"
        >
          {linkLabel} <ChevronRight size={13} />
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
        <ul className="divide-y divide-[#EDF2F6]">
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
    <Panel title="Complétion du profil" description="Calculée à partir de ton profil.">
      <div className="flex items-center gap-4">
        <div
          className="relative h-24 w-24 shrink-0"
          role="progressbar"
          aria-valuenow={completion}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Complétion du profil"
        >
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#E8EEF3" strokeWidth="10" />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#16B8B1"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700 motion-reduce:transition-none"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-[#0B1F33]">
            {completion} %
          </span>
        </div>

        <p className="text-sm leading-6 text-[#64788C]">
          {nextStep || "Un profil complet met en valeur tes compétences."}
        </p>
      </div>

      {missing.length > 0 && (
        <ul className="mt-4 space-y-2">
          {missing.map((item) => (
            <li key={item.key} className="flex items-center gap-2 text-sm text-[#334B63]">
              <span className="h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
              {item.label}
            </li>
          ))}
        </ul>
      )}

      <Link
        to="/profile"
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B1F33] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#17284B] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      >
        Compléter mon profil
        <ChevronRight size={16} />
      </Link>
    </Panel>
  );
}

function QuickLinksPanel({ links, wide = false, className = "" }) {
  return (
    <Panel title="Actions rapides" description="Va directement où tu veux." className={className}>
      <ul className={wide ? "grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3" : "space-y-1.5"}>
        {links.map(({ to, icon: Icon, title }) => (
          <li key={to}>
            <Link
              to={to}
              className="group flex items-center gap-3 rounded-xl px-2.5 py-2 transition hover:bg-emerald-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F1F6FA] text-[#334B63] transition group-hover:bg-emerald-100 group-hover:text-emerald-700">
                <Icon size={17} strokeWidth={1.9} />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#0B1F33]">{title}</span>
              <ChevronRight size={15} className="shrink-0 text-slate-300 group-hover:text-emerald-600" />
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export default Dashboard;