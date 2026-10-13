import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  UserRound,
  BriefcaseBusiness,
  Search,
  MessageSquare,
  Building2,
  Layers3,
  Sparkles,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "./NotificationBell";
import DropdownMenu from "./DropdownMenu";
import api from "../../services/api";

const navByRole = {
  company: [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/company", label: "Mon entreprise", icon: Building2 },
    { to: "/my-publications", label: "Mes publications", icon: BriefcaseBusiness },
    { to: "/resource-offers/browse", label: "Ressources disponibles", icon: Search },
    { to: "/my-activity", label: "Mon activité", icon: Layers3 },
    { to: "/messages", label: "Messagerie", icon: MessageSquare, badge: "messages" },
  ],
  employee: [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/profile", label: "Mon profil", icon: UserRound },
    { to: "/explore-dashboard", label: "Explorer", icon: Search },
    { to: "/my-activity", label: "Mon activité", icon: Layers3 },
    { to: "/messages", label: "Messagerie", icon: MessageSquare, badge: "messages" },
  ],
  student: [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/profile", label: "Mon profil", icon: UserRound },
    { to: "/explore-dashboard", label: "Explorer", icon: Search },
    { to: "/my-activity", label: "Mon activité", icon: Layers3 },
    { to: "/messages", label: "Messagerie", icon: MessageSquare, badge: "messages" },
  ],
  university: [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/messages", label: "Messagerie", icon: MessageSquare, badge: "messages" },
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
  }[role] || role || "Membre";
}

function isRouteActive(pathname, to) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

export default function AppShell({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const nav = navByRole[user?.role] || navByRole.employee;

  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isOnMessagesPage = location.pathname.startsWith("/messages");

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let cancelled = false;

    const fetchCounts = async () => {
      if (!isOnMessagesPage) {
        api
          .get("/conversations/unread-count")
          .then((res) => {
            if (!cancelled) {
              setUnreadMessages(res.data?.unread_count || 0);
            }
          })
          .catch(() => {});
      }

      api
        .get("/notifications")
        .then((res) => {
          if (cancelled) return;

          const data = res.data?.notifications || res.data || [];
          const unread =
            res.data?.unread_count ??
            (Array.isArray(data)
              ? data.filter((notification) => !notification.read_at).length
              : 0);

          setUnreadNotifs(unread);
        })
        .catch(() => {});
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user?.id, isOnMessagesPage]);

  useEffect(() => {
    if (isOnMessagesPage) {
      setUnreadMessages(0);
      return;
    }

    let cancelled = false;

    api
      .get("/conversations/unread-count")
      .then((res) => {
        if (!cancelled) {
          setUnreadMessages(res.data?.unread_count || 0);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [location.pathname, isOnMessagesPage]);

  const getBadgeCount = (badgeType) => {
    if (badgeType === "messages") {
      return isOnMessagesPage ? 0 : unreadMessages;
    }

    if (badgeType === "notifications") return unreadNotifs;
    return 0;
  };

  // ✅ NAV LINK COMPACTE
  const renderNavLink = ({ to, label, icon: Icon, badge }) => {
    const active = isRouteActive(location.pathname, to);
    const badgeCount = badge ? getBadgeCount(badge) : 0;

    return (
      <Link
        key={to}
        to={to}
        onClick={() => setMobileNavOpen(false)}
        aria-current={active ? "page" : undefined}
        className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-all duration-150 ${
          active
            ? "bg-[#102A43] font-semibold text-white shadow-sm"
            : "font-medium text-slate-600 hover:bg-slate-100 hover:text-[#102A43]"
        }`}
      >
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
            active
              ? "bg-[#16B8A6] text-[#082F49]"
              : "bg-transparent text-slate-500 group-hover:bg-white group-hover:text-[#0F766E]"
          }`}
        >
          <Icon size={16} strokeWidth={2} />
        </span>

        <span className="min-w-0 flex-1 truncate">{label}</span>

        {badgeCount > 0 && (
          <span
            className={`flex min-w-4 items-center justify-center rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
              active
                ? "bg-white text-[#102A43]"
                : "bg-[#DDF8F3] text-[#087F73]"
            }`}
          >
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F8FC] font-sans text-slate-800 antialiased">
      <div className="flex min-h-screen">
        {/* Navigation latérale desktop — COMPACTE */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col border-r border-slate-200/80 bg-white px-4 py-5 lg:flex">
          {/* Logo — plus compact */}
          <Link to="/" className="mb-6 flex items-center gap-2.5 px-1.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#102A43] text-[#5EEAD4] shadow-sm">
              <Layers3 size={19} strokeWidth={2.2} />
            </span>
            <span className="min-w-0">
              <span className="block text-[16px] font-extrabold tracking-tight text-[#102A43]">
                TalentShare
              </span>
              <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Connecter les talents
              </span>
            </span>
          </Link>

          {/* Section label — plus compact */}
          <div className="mb-2 px-2.5 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
            Espace de travail
          </div>

          {/* Nav — plus compact */}
          <nav className="flex-1 space-y-0.5 overflow-y-auto">
            {nav.map(renderNavLink)}
          </nav>

          {/* Carte promotion — plus compacte */}
          <div className="mt-4 overflow-hidden rounded-xl bg-gradient-to-br from-[#102A43] to-[#164E63] p-3.5 text-white">
            <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-[#5EEAD4]">
              <Sparkles size={14} />
            </div>
            <p className="text-[13px] font-semibold">Grandissez ensemble.</p>
            <p className="mt-1 text-[10px] leading-4 text-slate-300">
              Développez votre réseau et découvrez de nouvelles opportunités.
            </p>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-[#5EEAD4]" />
              <span className="text-[9px] font-medium text-slate-300">
                TalentShare · Version bêta
              </span>
            </div>
          </div>
        </aside>

        {/* Contenu principal */}
        <div className="flex min-w-0 flex-1 flex-col lg:ml-[240px]">
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
            <div className="flex min-h-[68px] items-center justify-between gap-3 px-4 sm:px-6 xl:px-9">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen((open) => !open)}
                  aria-label={mobileNavOpen ? "Fermer le menu" : "Ouvrir le menu"}
                  aria-expanded={mobileNavOpen}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
                >
                  {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                    <span className="hidden sm:inline">TalentShare</span>
                    <ChevronRight size={12} className="hidden sm:inline" />
                    <span className="truncate">Espace personnel</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm font-bold text-[#102A43] sm:text-base">
                    Bonjour{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <div className="hidden h-8 items-center gap-2 rounded-full border border-[#BDEFE7] bg-[#F0FDFA] px-3 sm:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#10B8A6]" />
                  <span className="text-[11px] font-semibold text-[#0F766E]">
                    {roleLabel(user?.role)}
                  </span>
                </div>

                <div className="flex items-center justify-center">
                  <NotificationBell />
                </div>

                <div className="h-7 w-px bg-slate-200" />

                <DropdownMenu />
              </div>
            </div>
          </header>

          {/* Menu mobile */}
          {mobileNavOpen && (
            <div className="fixed inset-0 top-[68px] z-40 lg:hidden">
              <button
                type="button"
                aria-label="Fermer le menu"
                onClick={() => setMobileNavOpen(false)}
                className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
              />
              <nav className="relative max-h-[calc(100vh-68px)] w-full overflow-y-auto border-b border-slate-200 bg-white p-4 shadow-xl sm:max-w-sm">
                <div className="mb-3 flex items-center gap-3 rounded-xl bg-[#F5F8FC] p-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#102A43] text-[#5EEAD4]">
                    <Layers3 size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#102A43]">TalentShare</p>
                    <p className="text-[11px] text-slate-500">{roleLabel(user?.role)}</p>
                  </div>
                </div>
                <div className="space-y-0.5">{nav.map(renderNavLink)}</div>
              </nav>
            </div>
          )}

          <main className="w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 xl:px-9">
            <div className="mx-auto w-full max-w-[1600px]">{children}</div>
          </main>

          <footer className="border-t border-slate-200/70 bg-white/70 px-4 py-4 sm:px-8">
            <p className="text-center text-xs text-slate-400">
              © {new Date().getFullYear()} TalentShare · Ensemble, créons des opportunités.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}