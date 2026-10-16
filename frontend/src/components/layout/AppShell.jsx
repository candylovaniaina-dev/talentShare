import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  UserRound,
  BriefcaseBusiness,
  Search,
  MessageCircle,
  Building2,
  Layers3,
  ChevronRight,
  Menu,
  X,
  Handshake,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "./NotificationBell";
import DropdownMenu from "./DropdownMenu";
import api from "../../services/api";
import ActivityHistory from "./ActivityHistory";

const navByRole = {
  company: [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/company", label: "Mon entreprise", icon: Building2 },
    { to: "/my-publications", label: "Mes publications", icon: BriefcaseBusiness },
    { to: "/resource-offers/browse", label: "Ressources disponibles", icon: Search },
    { to: "/my-activity", label: "Mon activité", icon: Layers3 },
  ],
  employee: [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/profile", label: "Mon profil", icon: UserRound },
    {
      label: "Explorer",
      icon: Search,
      children: [
        { to: "/job-offers", label: "Offres d'emploi", icon: BriefcaseBusiness, badge: "newOffers" },
        { to: "/browse-requests", label: "Demandes de ressources", icon: Handshake },
        { to: "/resource-offers/browse", label: "Ressources disponibles", icon: Layers3 },
      ],
    },
    { to: "/my-activity", label: "Mon activité", icon: Layers3 },
  ],
  student: [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/profile", label: "Mon profil", icon: UserRound },
    {
      label: "Explorer",
      icon: Search,
      children: [
        { to: "/job-offers", label: "Offres d'emploi", icon: BriefcaseBusiness, badge: "newOffers" },
        { to: "/browse-requests", label: "Demandes de ressources", icon: Handshake },
        { to: "/resource-offers/browse", label: "Ressources disponibles", icon: Layers3 },
      ],
    },
    { to: "/my-activity", label: "Mon activité", icon: Layers3 },
  ],
  university: [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  ],
  admin: [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/admin/verifications", label: "Vérifications", icon: UserRound },
  ],
};

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

export default function AppShell({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const nav = navByRole[user?.role] || navByRole.employee;

  const [unreadMessages, setUnreadMessages] = useState(0);
  const [newOffersCount, setNewOffersCount] = useState(0);  // ✅ NOUVEAU
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(false);

  const isOnMessagesPage = location.pathname.startsWith("/messages");
  const firstName = getFirstName(user);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const explorer = nav.find((item) => item.children);
    if (explorer?.children?.some((item) => isRouteActive(location.pathname, item.to))) {
      setExplorerOpen(true);
    }
  }, [location.pathname, nav]);

  useEffect(() => {
    let cancelled = false;

    const fetchCounts = async () => {
      if (isOnMessagesPage) {
        setUnreadMessages(0);
        return;
      }

      try {
        const res = await api.get("/conversations/unread-count");
        if (!cancelled) setUnreadMessages(res.data?.unread_count || 0);
      } catch {
        // silencieux
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user?.id, isOnMessagesPage]);

 // ✅ Charger le nombre de nouvelles offres
useEffect(() => {
  if (!user?.id) return;
  let cancelled = false;

  const fetchNewOffers = async () => {
    // ⚠️ Si on est déjà sur /job-offers, on considère qu'il n'y a rien de nouveau
    if (location.pathname.startsWith("/job-offers")) {
      if (!cancelled) setNewOffersCount(0);
      return;
    }

    try {
      const res = await api.get("/job-offers/count-new");
      if (!cancelled) setNewOffersCount(res.data?.count || 0);
    } catch {
      // silencieux
    }
  };

  fetchNewOffers();
  const interval = setInterval(fetchNewOffers, 60000);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}, [user?.id, location.pathname]);  // ✅ Ajouter location.pathname
  // ✅ Marquer les offres comme vues quand on visite /job-offers
 useEffect(() => {
  if (!location.pathname.startsWith("/job-offers")) return;
  if (!user?.id) return;

  // ✅ 1. Mettre à jour côté serveur EN PREMIER
  api.post("/job-offers/mark-seen")
    .then(() => {
      // ✅ 2. Une fois le serveur OK, on met à jour le state local
      setNewOffersCount(0);
    })
    .catch(() => {
      // En cas d'erreur, on remet quand même à 0 localement
      setNewOffersCount(0);
    });
}, [location.pathname, user?.id]);

  const renderNavLink = ({ to, label, icon: Icon, badge }) => {
    const active = isRouteActive(location.pathname, to);
    const badgeCount = badge === "newOffers" ? newOffersCount : 0;

    return (
      <Link
        key={to}
        to={to}
        onClick={() => setMobileNavOpen(false)}
        aria-current={active ? "page" : undefined}
        className={`group flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors duration-150 ${
          active
            ? "bg-[#102A43] font-semibold text-white shadow-sm"
            : "font-medium text-[#334B63] hover:bg-[#F1F6FA] hover:text-[#102A43]"
        }`}
      >
        <Icon
          size={19}
          strokeWidth={1.8}
          className={active ? "text-[#76DED7]" : "text-[#70849B] group-hover:text-[#0F9691]"}
        />
        <span className="min-w-0 flex-1 truncate">{label}</span>
       {badgeCount > 0 && (
  <span className={`ml-auto flex h-6 min-w-[26px] shrink-0 items-center justify-center rounded-full px-2 text-[11px] font-extrabold leading-none shadow-sm ${
    active ? "bg-white text-rose-600" : "bg-rose-500 text-white"
  }`}>
    +{badgeCount > 99 ? "99" : badgeCount}
  </span>
)}
      </Link>
    );
  };

  const renderNavigation = () => (
    <nav className="space-y-1">
      {nav.map((item) => {
        if (!item.children) return renderNavLink(item);

        const Icon = item.icon;
        const active = item.children.some((child) =>
          isRouteActive(location.pathname, child.to)
        );

        return (
          <div key={item.label} className="space-y-1">
            <button
              type="button"
              onClick={() => setExplorerOpen((open) => !open)}
              aria-expanded={explorerOpen}
              className={`group flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] transition-colors ${
                active
                  ? "font-semibold text-[#102A43]"
                  : "font-medium text-[#334B63] hover:bg-[#F1F6FA]"
              }`}
            >
              <Icon
                size={19}
                strokeWidth={1.8}
                className={active ? "text-[#0F9691]" : "text-[#70849B] group-hover:text-[#0F9691]"}
              />
              <span className="flex-1">Explorer</span>
              <ChevronRight
                size={16}
                className={`text-slate-400 transition-transform ${explorerOpen ? "rotate-90" : ""}`}
              />
            </button>

            {explorerOpen && (
              <div className="ml-5 space-y-1 border-l border-[#DFE8EF] pl-3">
                {item.children.map((child) => {
                  const ChildIcon = child.icon;
                  const childActive = isRouteActive(location.pathname, child.to);
                  const badgeCount = child.badge === "newOffers" ? newOffersCount : 0;

                  return (
                    <Link
                      key={child.to}
                      to={child.to}
                      onClick={() => setMobileNavOpen(false)}
                      aria-current={childActive ? "page" : undefined}
                      className={`flex min-h-[39px] items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                        childActive
                          ? "bg-[#E5F8F5] font-semibold text-[#087F73]"
                          : "text-[#64788C] hover:bg-[#F4F8FB] hover:text-[#102A43]"
                      }`}
                    >
                      <ChildIcon size={16} strokeWidth={1.8} />
                      <span className="min-w-0 flex-1 truncate">{child.label}</span>
                     {badgeCount > 0 && (
  <span className="ml-auto flex h-6 min-w-[26px] shrink-0 items-center justify-center rounded-full bg-rose-500 px-2 text-[11px] font-extrabold leading-none text-white shadow-sm">
    +{badgeCount > 99 ? "99" : badgeCount}
  </span>
)}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="app-shell min-h-screen bg-[#F5F8FA] font-sans text-[#102A43] antialiased">
      <div className="min-h-screen">
        {/* Barre latérale desktop */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col border-r border-[#E4EBF1] bg-white px-5 py-6 lg:flex">
          <Link to="/dashboard" className="mb-9 flex items-center gap-3 px-1">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#102A43] text-[#76DED7]">
              <Layers3 size={23} strokeWidth={2} />
            </span>
            <span>
              <span className="block text-[20px] font-extrabold tracking-tight text-[#102A43]">
                TalentShare
              </span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.17em] text-[#8A9BB0]">
                Connecter les talents
              </span>
            </span>
          </Link>

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.17em] text-[#8A9BB0]">
            Espace de travail
          </p>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {renderNavigation()}
          </div>

          <div className="mt-5 border-t border-[#E8EEF3] pt-4">
            <DropdownMenu variant="sidebar" />
          </div>
        </aside>

        {/* Contenu */}
        <div className="flex min-h-screen min-w-0 flex-col lg:ml-[272px]">
          <header className="sticky top-0 z-30 border-b border-[#E4EBF1] bg-white/95 backdrop-blur-xl">
            <div className="flex min-h-[72px] items-center justify-between gap-3 px-4 sm:px-7 xl:px-9">
              <button
                type="button"
                onClick={() => setMobileNavOpen((open) => !open)}
                aria-label={mobileNavOpen ? "Fermer le menu" : "Ouvrir le menu"}
                aria-expanded={mobileNavOpen}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E4EBF1] text-[#526B83] hover:bg-[#F5F8FA] lg:hidden"
              >
                {mobileNavOpen ? <X size={19} /> : <Menu size={19} />}
              </button>

              <div className="hidden min-w-0 flex-1 lg:block">
                {firstName && (
                  <h1 className="truncate text-[20px] font-bold tracking-tight text-[#0B1F33]">
                    Bonjour, {firstName} <span className="ml-0.5">👋</span>
                  </h1>
                )}
              </div>

              <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">
                <div className="hidden items-center gap-2 rounded-full border border-[#BDEFE7] bg-[#F0FDFA] px-3.5 py-1.5 sm:flex">
                  <span className="h-2 w-2 rounded-full bg-[#10B8A6]" />
                  <span className="text-[12px] font-semibold text-[#0F9691]">
                    {roleLabel(user?.role)}
                  </span>
                </div>

                <Link
                  to="/messages"
                  aria-label={
                    unreadMessages > 0
                      ? `Messagerie, ${unreadMessages} message(s) non lu(s)`
                      : "Messagerie"
                  }
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#E4EBF1] text-[#526B83] transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <MessageCircle size={19} strokeWidth={1.9} />
                  {unreadMessages > 0 && (
                    <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold leading-[18px] text-white">
                      {unreadMessages > 99 ? "99+" : unreadMessages}
                    </span>
                  )}
                </Link>
<ActivityHistory />
                <NotificationBell />
              </div>
            </div>
          </header>

          {mobileNavOpen && (
            <div className="fixed inset-0 top-[72px] z-40 lg:hidden">
              <button
                type="button"
                aria-label="Fermer le menu"
                onClick={() => setMobileNavOpen(false)}
                className="absolute inset-0 bg-[#102A43]/35 backdrop-blur-[2px]"
              />
              <nav className="relative flex max-h-[calc(100vh-72px)] w-full max-w-sm flex-col overflow-y-auto border-r border-[#E4EBF1] bg-white p-5 shadow-xl">
                <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.17em] text-[#8A9BB0]">
                  Espace de travail
                </p>
                {renderNavigation()}
                <div className="mt-5 border-t border-[#E8EEF3] pt-4">
                  <DropdownMenu variant="sidebar" />
                </div>
              </nav>
            </div>
          )}

          <main className="app-content w-full flex-1 px-4 py-6 sm:px-7 sm:py-8 xl:px-9">
            <div className="mx-auto w-full max-w-[1600px]">{children}</div>
          </main>

          <footer className="border-t border-[#E4EBF1] bg-white/70 px-4 py-4 sm:px-8">
            <p className="text-center text-xs text-[#8A9BB0]">
              © {new Date().getFullYear()} TalentShare · Ensemble, créons des opportunités.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}