import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Building2, FileText, Search, Handshake,
  MessageCircle, User, ShieldCheck, Menu, X, Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "./NotificationBell";
import DropdownMenu from "./DropdownMenu";
import api from "../../services/api";

const navByRole = {
  company: [
    { to: "/dashboard",              label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/company",                label: "Mon entreprise",  icon: Building2 },
    { to: "/my-publications",        label: "Mes publications", icon: FileText },
    { to: "/resource-offers/browse", label: "Ressources",      icon: Search },
    { to: "/my-activity",            label: "Mon activité",    icon: Handshake },
    { to: "/messages",               label: "Messagerie",      icon: MessageCircle, badge: "messages" },
  ],
  employee: [
    { to: "/dashboard",              label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/profile",                label: "Mon profil",      icon: User },
    { to: "/explore-dashboard",      label: "Explorer",        icon: Search },
    { to: "/my-activity",            label: "Mon activité",    icon: Handshake },
    { to: "/messages",               label: "Messagerie",      icon: MessageCircle, badge: "messages" },
  ],
  student: [
    { to: "/dashboard",              label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/profile",                label: "Mon profil",      icon: User },
    { to: "/explore-dashboard",      label: "Explorer",        icon: Search },
    { to: "/my-activity",            label: "Mon activité",    icon: Handshake },
    { to: "/messages",               label: "Messagerie",      icon: MessageCircle, badge: "messages" },
  ],
  university: [
    { to: "/dashboard",              label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/messages",               label: "Messagerie",      icon: MessageCircle, badge: "messages" },
  ],
  admin: [
    { to: "/dashboard",              label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/admin/verifications",    label: "Vérifications",   icon: ShieldCheck },
  ],
};

export default function AppShell({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const nav = navByRole[user?.role] || navByRole.employee;

  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isOnMessagesPage = location.pathname.startsWith("/messages");

  useEffect(() => {
    const fetchCounts = () => {
      if (!isOnMessagesPage) {
        api.get("/conversations/unread-count")
          .then((res) => setUnreadMessages(res.data?.unread_count || 0))
          .catch(() => {});
      }
      api.get("/notifications")
        .then((res) => {
          const data = res.data?.notifications || res.data || [];
          const unread = res.data?.unread_count ?? data.filter((n) => !n.read_at).length;
          setUnreadNotifs(unread);
        })
        .catch(() => {});
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, [user?.id, isOnMessagesPage]);

  useEffect(() => {
    if (isOnMessagesPage) {
      setUnreadMessages(0);
    } else {
      api.get("/conversations/unread-count")
        .then((res) => setUnreadMessages(res.data?.unread_count || 0))
        .catch(() => {});
    }
  }, [location.pathname, isOnMessagesPage]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const getBadgeCount = (badgeType) => {
    if (badgeType === "messages") return isOnMessagesPage ? 0 : unreadMessages;
    if (badgeType === "notifications") return unreadNotifs;
    return 0;
  };

  const renderNavItems = () =>
    nav.map(({ to, label, icon: Icon, badge }) => {
      const active = location.pathname === to || location.pathname.startsWith(to + "/");
      const badgeCount = badge ? getBadgeCount(badge) : 0;

      return (
        <Link
          key={to}
          to={to}
          className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
            active
              ? "bg-navy-800 text-white shadow-sm"
              : "text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
          }`}
        >
          {Icon && (
            <Icon
              size={18}
              strokeWidth={active ? 2 : 1.5}
              className={active ? "text-mint" : "text-[var(--text-faint)] group-hover:text-[var(--text-muted)]"}
            />
          )}
          <span>{label}</span>
          {badgeCount > 0 && (
            <span
              className={`ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-lg px-1.5 text-[10px] font-bold ${
                active ? "bg-mint text-navy-900" : "bg-mint/15 text-mint"
              }`}
            >
              {badgeCount > 99 ? "99+" : badgeCount}
            </span>
          )}
          {active && (
            <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-mint" />
          )}
        </Link>
      );
    });

  const Logo = ({ onClick }) => (
    <Link
      to="/"
      onClick={onClick}
      className="flex items-center gap-2.5 px-5 py-5 text-base font-bold text-[var(--text-app)] transition hover:opacity-80"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-800 shadow-sm">
        <Sparkles size={18} strokeWidth={2} className="text-mint" />
      </span>
      <span>
        Talent<span className="text-mint">Share</span>
      </span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-app)] font-sans text-[var(--text-app)] transition-colors">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 shrink-0 flex-col border-r border-[var(--border-app)] bg-[var(--bg-surface)] md:flex">
        <Logo />
        <div className="px-3 pb-2">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-faint)]">
            Menu
          </p>
        </div>
        <nav className="flex-1 space-y-1 px-3">{renderNavItems()}</nav>

        <div className="mx-3 mb-4 rounded-xl border border-[var(--border-app)] bg-gradient-to-br from-navy-800 to-navy-900 p-4 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} strokeWidth={1.5} className="text-mint" />
            <p className="text-xs font-bold">Version Beta</p>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">
            Vos données sont protégées et chiffrées.
          </p>
        </div>
      </aside>

      {/* Sidebar — mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--border-app)] bg-[var(--bg-surface)] md:hidden animate-slide-up">
            <div className="flex items-center justify-between">
              <Logo />
              <button
                onClick={() => setMobileOpen(false)}
                className="mr-4 rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-3">{renderNavItems()}</nav>
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="md:pl-64">
        <header className="flex items-center justify-between border-b border-[var(--border-app)] bg-[var(--bg-surface)] px-4 py-3.5 md:px-8 md:py-4 sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-app)] text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-hover)] md:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu size={18} strokeWidth={1.5} />
            </button>

            <div className="hidden md:block">
              <p className="text-xs text-[var(--text-faint)]">Bienvenue,</p>
              <p className="font-semibold text-[var(--text-app)]">{user?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <NotificationBell />
            <span className="hidden sm:inline-flex rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-2)] px-2.5 py-1 text-xs font-semibold text-[var(--text-muted)]">
              {roleLabel(user?.role)}
            </span>
            <DropdownMenu />
          </div>
        </header>

        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

function roleLabel(role) {
  return {
    company: "Entreprise",
    employee: "Talent",
    student: "Étudiant",
    university: "Université",
    admin: "Administrateur",
  }[role] || role;
}
