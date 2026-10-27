import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard, UserRound, BriefcaseBusiness, MessageCircle,
  Building2, Layers3, Menu, X, Settings, ChevronDown, LogOut,
  Home, Compass, Contact, Users, ShieldCheck, LifeBuoy,
  Globe, Briefcase,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "./NotificationBell";
import api from "../../services/api";
import ActivityHistory from "./ActivityHistory";

const navByRole = {
  company: [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/company", label: "Mon entreprise", icon: Building2 },
    { to: "/my-publications", label: "Espace recrutement", icon: BriefcaseBusiness },
    { to: "/resource-offers/browse", label: "Ressources disponibles", icon: Users },
  ],
  employee: [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/profile", label: "Mon Portfolio", icon: Contact },
    { to: "/explorer", label: "Explorer", icon: Compass, badge: "newExplorer" },
  ],
  student: [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/profile", label: "Mon Portfolio", icon: Contact },
    { to: "/explorer", label: "Explorer", icon: Compass, badge: "newExplorer" },
  ],
  university: [{ to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard }],
  admin: [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/admin/verifications", label: "Vérifications", icon: ShieldCheck },
  ],
};

/* Accès rapide « Mon activité » (en-tête) */
const TABS = [
  { id: "home", label: "Accueil", icon: Home },
  { id: "profile", label: "Profil", icon: UserRound },
  { id: "companies", label: "Réseau", icon: Globe, roles: ["student", "employee"] } 
];

const EXTRA_LABELS = [
  ["/messages", "Messagerie"],
  ["/account-settings", "Paramètres du compte"],
  ["/help", "Aide"],
  ["/guide", "Guide"],
  ["/history", "Historique"],
  ["/job-offers", "Offres d'emploi"],
  ["/browse-requests", "Demandes de ressources"],
  ["/resource-requests", "Demandes de ressources"],
  ["/companies", "Entreprise"],
];

function roleLabel(role) {
  return {
    company: "Entreprise",
    employee: "Talent",
    student: "Étudiant",
    university: "Université",
    admin: "Administrateur",
  }[role] || "Membre";
}

function isRouteActive(pathname, to) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

const getFirstName = (user) => {
  if (user?.first_name) return user.first_name;
  const name = user?.name || user?.full_name || "";
  return name.trim().split(/\s+/)[0] || "";
};

const BASE_URL = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
const fileUrl = (p) => (!p ? null : /^https?:/.test(p) ? p : `${BASE_URL}/storage/${p}`);

function UserAvatar({ user, size = 40 }) {
  const [err, setErr] = useState(false);
  
  const rawPath = 
    user?.avatar_path || 
    user?.professional_profile?.avatar_path || 
    user?.professionalProfile?.avatar_path ||
    user?.company?.logo_url ||   
    user?.company?.logo_path ||  
    user?.logo_url ||            
    user?.logo_path;             

  const src = fileUrl(rawPath);
  
  const initials = (user?.name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

  return (
    <span
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-xs font-extrabold text-[#04201C]"
    >
      {src && !err ? (
        <img
          key={src}
          src={src}
          alt=""
          onError={() => setErr(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        initials
      )}
    </span>
  );
}

function HeaderDivider() {
  return <span aria-hidden="true" className="mx-0.5 hidden h-7 w-px bg-[#E4EBF1] dark:bg-white/10 sm:block" />;
}

function SectionLabel({ children }) {
  return (
    <p className="relative mb-2 mt-6 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
      {children}
    </p>
  );
}

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const nav = navByRole[user?.role] || navByRole.employee;

  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newOffersCount, setNewOffersCount] = useState(0);
  const [newRequestsCount, setNewRequestsCount] = useState(0);
  const [newProposalsCount, setNewProposalsCount] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("talentshare_sidebar_collapsed") === "1"; } catch { return false; }
  });

  const isOnMessagesPage = location.pathname.startsWith("/messages");
  const firstName = getFirstName(user);

  const isMyActivity = location.pathname.startsWith("/my-activity");
  const currentTab = searchParams.get("tab") || "home";

  useEffect(() => {
    try { localStorage.setItem("talentshare_sidebar_collapsed", collapsed ? "1" : "0"); } catch { /* ignore */ }
  }, [collapsed]);

  useEffect(() => {
    setMobileNavOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  const currentLabel = useMemo(() => {
    if (isMyActivity) {
      const tab = TABS.find((t) => t.id === currentTab);
      return tab ? `Mon activité · ${tab.label}` : "Mon activité";
    }
    const inMenu = nav.find((i) => isRouteActive(location.pathname, i.to));
    if (inMenu) return inMenu.label;
    const extra = EXTRA_LABELS.find(([path]) => isRouteActive(location.pathname, path));
    return extra ? extra[1] : "Espace de travail";
  }, [nav, location.pathname, isMyActivity, currentTab]);

  /* FETCH COUNTS */
  useEffect(() => {
    let cancelled = false;
    const fetchCounts = async () => {
      if (isOnMessagesPage) { setUnreadMessages(0); return; }
      try {
        const res = await api.get("/conversations/unread-count");
        if (!cancelled) setUnreadMessages(res.data?.unread_count || 0);
      } catch { /* silencieux */ }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user?.id, isOnMessagesPage]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const fetchNewOffers = async () => {
      if (location.pathname.startsWith("/job-offers") || location.pathname.startsWith("/explorer")) { if (!cancelled) setNewOffersCount(0); return; }
      try {
        const res = await api.get("/job-offers/count-new");
        if (!cancelled) setNewOffersCount(res.data?.count || 0);
      } catch { /* silencieux */ }
    };
    fetchNewOffers();
    const interval = setInterval(fetchNewOffers, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user?.id, location.pathname]);

  useEffect(() => {
    if ((!location.pathname.startsWith("/job-offers") && !location.pathname.startsWith("/explorer")) || !user?.id) return;
    api.post("/job-offers/mark-seen").then(() => setNewOffersCount(0)).catch(() => setNewOffersCount(0));
  }, [location.pathname, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const fetchNewRequests = async () => {
      if (location.pathname.startsWith("/browse-requests") || location.pathname.startsWith("/explorer")) { if (!cancelled) setNewRequestsCount(0); return; }
      try {
        const res = await api.get("/resource-requests/count-new");
        if (!cancelled) setNewRequestsCount(res.data?.count || 0);
      } catch { /* silencieux */ }
    };
    fetchNewRequests();
    const interval = setInterval(fetchNewRequests, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user?.id, location.pathname]);

  useEffect(() => {
    if ((!location.pathname.startsWith("/browse-requests") && !location.pathname.startsWith("/explorer")) || !user?.id) return;
    api.post("/resource-requests/mark-seen").then(() => setNewRequestsCount(0)).catch(() => setNewRequestsCount(0));
  }, [location.pathname, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    if (location.pathname.startsWith("/my-activity")) { setNewProposalsCount(0); return; }
    let cancelled = false;
    const fetchNewProposals = async () => {
      try {
        const res = await api.get("/proposals/count-new");
        if (!cancelled) setNewProposalsCount(res.data?.count || 0);
      } catch { /* silencieux */ }
    };
    fetchNewProposals();
    const interval = setInterval(fetchNewProposals, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user?.id, location.pathname]);

  useEffect(() => {
    if (!location.pathname.startsWith("/my-activity") || !user?.id) return;
    api.post("/proposals/mark-seen").then(() => setNewProposalsCount(0)).catch(() => setNewProposalsCount(0));
  }, [location.pathname, user?.id]);

  const countFor = (badge) =>
    badge === "newExplorer" ? newOffersCount + newRequestsCount :
    badge === "newOffers" ? newOffersCount :
    badge === "newRequests" ? newRequestsCount :
    badge === "newProposals" ? newProposalsCount : 0;

  const renderBadge = (count, active, compact) => {
    if (count <= 0) return null;
    if (compact) {
      return <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-[#0A2530]" />;
    }
    return (
      <span className={`ml-auto flex h-5 min-w-[24px] shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold leading-none ${active ? "bg-white text-rose-600" : "bg-rose-500 text-white"}`}>
        +{count > 99 ? "99" : count}
      </span>
    );
  };

  const renderNavLink = ({ to, label, icon: Icon, badge }, compact) => {
    const active = isRouteActive(location.pathname, to);
    const count = active ? 0 : countFor(badge);

    return (
      <Link
        key={to}
        to={to}
        title={compact ? label : undefined}
        onClick={() => setMobileNavOpen(false)}
        aria-current={active ? "page" : undefined}
        className={`group relative flex items-center rounded-2xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60 ${
          compact ? "h-12 w-12 justify-center self-center" : "min-h-[46px] gap-3 px-2.5 py-2 text-[14px]"
        } ${
          active
            ? "bg-gradient-to-r from-emerald-400/25 to-emerald-400/5 font-semibold text-white ring-1 ring-emerald-300/30"
            : "font-medium text-white/65 hover:bg-white/[0.07] hover:text-white"
        }`}
      >
        {active && !compact && (
          <span aria-hidden="true" className="absolute -left-4 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-emerald-300" />
        )}
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
            active
              ? "bg-emerald-400 text-[#04201C] shadow-[0_0_18px_rgba(52,211,153,0.55)]"
              : "bg-white/[0.06] text-white/70 group-hover:text-emerald-300"
          }`}
        >
          <Icon size={18} strokeWidth={1.9} />
        </span>
        {!compact && <span className="min-w-0 flex-1 truncate">{label}</span>}
        {renderBadge(count, active, compact)}
      </Link>
    );
  };

  const renderSidebarBody = (compact, onClose) => (
    <>
      <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-teal-400/10 blur-3xl" />

      {/* Marque */}
      <div className={`relative flex items-center ${compact ? "justify-center" : "justify-between"}`}>
        <Link to="/dashboard" className="flex items-center gap-3" aria-label="TalentShare, tableau de bord">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 to-teal-500 text-[#04201C] shadow-[0_8px_24px_rgba(16,185,129,0.4)]">
            <Layers3 size={22} strokeWidth={2.2} />
          </span>
          {!compact && (
            <span>
              <span className="block text-[18px] font-extrabold leading-none tracking-tight">TalentShare</span>
              <span className="mt-1.5 block text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-300/70">Connecter les talents</span>
            </span>
          )}
        </Link>
        {onClose && (
          <button onClick={onClose} aria-label="Fermer le menu" className="rounded-xl p-2 text-white/60 hover:bg-white/10 hover:text-white">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Espace actif */}
      {!compact && (
        <div className="relative mt-6 rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10 backdrop-blur">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">Espace actif</p>
          <div className="mt-2 flex items-center gap-3">
            <UserAvatar user={user} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{user?.name || "Mon espace"}</p>
              <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {roleLabel(user?.role)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation principale */}
      {!compact && <SectionLabel>Espace de travail</SectionLabel>}

      <nav
        aria-label="Navigation principale"
        className={`relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          compact ? "mt-6 flex flex-col gap-2" : "flex flex-col gap-1"
        }`}
      >
        {nav.map((item) => renderNavLink(item, compact))}
      </nav>

      {/* Support + statut */}
      <div className="relative mt-4 border-t border-white/10 pt-4">
        {!compact && <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Support</p>}
        {renderNavLink({ to: "/help", label: "Aide et guide", icon: LifeBuoy }, compact)}

        {!compact && (
          <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-white/[0.04] px-3 py-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-medium text-white/70">Connecté · <span className="text-emerald-300">TalentShare</span></span>
          </div>
        )}
      </div>
    </>
  );

  const headerBtn =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E4EBF1] bg-white text-[#526B83] transition " +
    "hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 " +
    "dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400";

  const menuLink =
    "flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-emerald-600 " +
    "dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-emerald-400";

  return (
    <div className="app-shell min-h-screen font-sans text-[#102A43] antialiased bg-[#E6F2F0] dark:bg-[#0B1F33]">
      <aside
        className={`fixed bottom-0 left-0 top-0 z-40 hidden flex-col overflow-hidden bg-gradient-to-b from-[#0B1F2E] via-[#0A2530] to-[#07302F] py-5 text-white shadow-[4px_0_24px_rgba(6,25,35,0.15)] ring-1 ring-white/10 transition-[width] duration-300 lg:flex ${
          collapsed ? "w-[84px] px-3" : "w-[272px] px-4"
        }`}
      >
        {renderSidebarBody(collapsed)}
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Fermer le menu" onClick={() => setMobileNavOpen(false)} className="absolute inset-0 bg-[#06141F]/50 backdrop-blur-sm" />
          <aside className="absolute bottom-3 left-3 top-3 flex w-[290px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-[28px] bg-gradient-to-b from-[#0B1F2E] via-[#0A2530] to-[#07302F] px-4 py-5 text-white shadow-2xl ring-1 ring-white/10">
            {renderSidebarBody(false, () => setMobileNavOpen(false))}
          </aside>
        </div>
      )}

      <div className={`flex min-h-screen min-w-0 flex-col px-3 pb-3 pt-3 transition-[margin] duration-300 lg:pl-0 lg:pr-4 ${collapsed ? "lg:ml-[84px]" : "lg:ml-[272px]"}`}>
        <header className="sticky top-3 z-30 rounded-2xl bg-white/80 shadow-[0_10px_35px_rgba(15,60,60,0.08)] ring-1 ring-white backdrop-blur-xl dark:bg-[#112A3A]/90 dark:ring-white/5">
          <div className="relative flex min-h-[68px] items-center justify-between gap-3 px-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={() => setMobileNavOpen(true)} aria-label="Ouvrir le menu" className={`${headerBtn} lg:hidden`}>
                <Menu size={19} strokeWidth={1.9} />
              </button>
             <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
                aria-expanded={!collapsed}
                className={`${headerBtn} hidden lg:flex`}
              >
                <Menu size={19} strokeWidth={1.9} />
              </button>

              <div className="min-w-0 leading-tight">
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">{currentLabel}</p>
                {firstName && (
                  <h1 className="mt-0.5 truncate text-[17px] font-bold tracking-tight text-[#0B1F33] dark:text-white sm:text-[19px]">
                    Bonjour, {firstName} <span className="ml-0.5">👋</span>
                  </h1>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
              <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 dark:border-emerald-500/30 dark:bg-emerald-500/10 xl:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[12px] font-semibold text-emerald-700 dark:text-emerald-400">{roleLabel(user?.role)}</span>
              </div>

              <HeaderDivider />

              {/* 👇 C'EST ICI QU'ON CACHE LES ONGLETS POUR L'ENTREPRISE */}
              {user?.role !== "company" && (
                <>
                  <div
                    role="group"
                    aria-label="Mon activité"
                    className="flex items-center gap-0.5 rounded-xl border border-[#E4EBF1] bg-white/70 p-1 dark:border-white/10 dark:bg-white/5"
                  >
                    {TABS.filter((t) => !t.roles || t.roles.includes(user?.role)).map((t) => {
                      const isActive = isMyActivity && currentTab === t.id;
                      return (
                        <Link
                          key={t.id}
                          to={`/my-activity?tab=${t.id}`}
                          title={t.label}
                          aria-label={t.label}
                          aria-current={isActive ? "page" : undefined}
                          className={`flex h-8 items-center gap-1.5 rounded-lg px-2 text-[12px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 xl:px-2.5 ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30"
                              : "text-[#526B83] hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                          }`}
                        >
                          <t.icon size={17} strokeWidth={1.9} />
                          <span className="hidden xl:inline">{t.label}</span>
                          {t.id === "home" && newProposalsCount > 0 && !isMyActivity && (
                            <span className="h-2 w-2 rounded-full bg-rose-500" aria-label="Nouvelles propositions" />
                          )}
                        </Link>
                      );
                    })}
                  </div>

                  <HeaderDivider />
                </>
              )}

              <div className="flex items-center gap-2">
                <Link
                  to="/messages"
                  aria-label={unreadMessages > 0 ? `Messagerie, ${unreadMessages} message(s) non lu(s)` : "Messagerie"}
                  title="Messagerie"
                  className={`${headerBtn} relative`}
                >
                  <MessageCircle size={19} strokeWidth={1.9} />
                  {unreadMessages > 0 && (
                    <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-[18px] text-white shadow-sm">
                      {unreadMessages > 99 ? "99+" : unreadMessages}
                    </span>
                  )}
                </Link>

                <ActivityHistory />
                <NotificationBell />
              </div>

              <HeaderDivider />

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((open) => !open)}
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 rounded-xl border border-[#E4EBF1] bg-white p-1.5 pr-2 transition hover:border-emerald-300 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-500/10"
                >
                  <UserAvatar user={user} size={32} />
                  <ChevronDown size={14} className={`text-slate-400 transition dark:text-slate-500 ${profileMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {profileMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileMenuOpen(false)} />
                    <div role="menu" className="absolute right-0 top-full z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-xl dark:border-white/10 dark:bg-[#112A3A]">
                      <div className="mb-1 flex items-center gap-3 border-b border-slate-100 px-4 pb-3 pt-2 dark:border-white/10">
                        <UserAvatar user={user} size={40} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{user?.name}</p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                        </div>
                      </div>

                      <Link role="menuitem" to="/profile" onClick={() => setProfileMenuOpen(false)} className={menuLink}>
                        <Contact size={16} strokeWidth={1.9} /> {user?.role === "company" ? "Mon Espace Entreprise" : "Mon Portfolio"}
                      </Link>
                      <Link role="menuitem" to="/account-settings" onClick={() => setProfileMenuOpen(false)} className={menuLink}>
                        <Settings size={16} strokeWidth={1.9} /> Paramètres du compte
                      </Link>
                      <Link role="menuitem" to="/help" onClick={() => setProfileMenuOpen(false)} className={menuLink}>
                        <LifeBuoy size={16} strokeWidth={1.9} /> Aide et guide
                      </Link>

                      <div className="my-1 border-t border-slate-100 dark:border-white/10" />
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => { setProfileMenuOpen(false); if (logout) logout(); }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
                      >
                        <LogOut size={16} strokeWidth={1.9} /> Se déconnecter
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="app-content w-full flex-1 bg-[#F2F7F5] px-0 py-5 sm:px-1 dark:bg-[#0B1F33]">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>

        <footer className="px-4 py-3">
          <p className="text-center text-xs text-[#8A9BB0] dark:text-slate-500">
            © {new Date().getFullYear()} TalentShare · Ensemble, créons des opportunités.
          </p>
        </footer>
      </div>
    </div>
  );
}