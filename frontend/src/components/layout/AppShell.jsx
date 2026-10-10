import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "./NotificationBell";
import DropdownMenu from "./DropdownMenu";
import api from "../../services/api";

const navByRole = {
  company: [
    { to: "/dashboard",              label: "Tableau de bord" },
    { to: "/company",                label: "Mon entreprise" },
    { to: "/my-publications",        label: "Mes publications" },
    { to: "/resource-offers/browse", label: "Ressources disponibles" },
    { to: "/my-activity",            label: "Mon activité" },
    { to: "/messages",               label: "Messagerie", badge: "messages" },
  ],
  employee: [
    { to: "/dashboard",              label: "Tableau de bord" },
    { to: "/profile",                label: "Mon profil" },
    { to: "/explore-dashboard",      label: "Explorer" },
    { to: "/my-activity",            label: "Mon activité" },
    { to: "/messages",               label: "Messagerie", badge: "messages" },
  ],
  student: [
    { to: "/dashboard",              label: "Tableau de bord" },
    { to: "/profile",                label: "Mon profil" },
    { to: "/explore-dashboard",      label: "Explorer" },
    { to: "/my-activity",            label: "Mon activité" },
    { to: "/messages",               label: "Messagerie", badge: "messages" },
  ],
  university: [
    { to: "/dashboard",              label: "Tableau de bord" },
    { to: "/messages",               label: "Messagerie", badge: "messages" },
  ],
  admin: [
    { to: "/dashboard",              label: "Tableau de bord" },
    { to: "/admin/verifications",    label: "Vérifications" },
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

  return (
    <div className="min-h-screen bg-[var(--bg-app)] font-sans text-[var(--text-app)] transition-colors">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 shrink-0 flex-col border-r border-[var(--border-app)] bg-[var(--bg-surface)] md:flex">
        <Link to="/" className="flex items-center gap-2.5 px-6 py-5 text-base font-bold text-[var(--text-app)]">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-800 text-white">
            <span className="text-sm font-extrabold">T</span>
          </span>
          TalentShare
        </Link>

        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {nav.map(({ to, label, badge }) => {
            const active = location.pathname === to || location.pathname.startsWith(to + "/");
            const badgeCount = badge ? getBadgeCount(badge) : 0;

            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-navy-800 text-white"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
                }`}
              >
                <span>{label}</span>
                {badgeCount > 0 && (
                  <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                    active ? "bg-white/20 text-white" : "bg-[var(--accent)] text-white"
                  }`}>
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4">
          <div className="rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-2)] px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
              Version Beta
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              Vos données sont protégées.
            </p>
          </div>
        </div>
      </aside>

      {/* Sidebar — mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--border-app)] bg-[var(--bg-surface)] md:hidden">
            <Link to="/" className="flex items-center gap-2.5 px-6 py-5 text-base font-bold text-[var(--text-app)]">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-800 text-white">
                <span className="text-sm font-extrabold">T</span>
              </span>
              TalentShare
            </Link>
            <nav className="flex-1 space-y-0.5 px-3 py-2">
              {nav.map(({ to, label, badge }) => {
                const active = location.pathname === to || location.pathname.startsWith(to + "/");
                const badgeCount = badge ? getBadgeCount(badge) : 0;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      active
                        ? "bg-navy-800 text-white"
                        : "text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
                    }`}
                  >
                    <span>{label}</span>
                    {badgeCount > 0 && (
                      <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                        active ? "bg-white/20 text-white" : "bg-[var(--accent)] text-white"
                      }`}>
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="md:pl-60">
        <header className="flex items-center justify-between border-b border-[var(--border-app)] bg-[var(--bg-surface)] px-4 py-3.5 md:px-8 md:py-4 sticky top-0 z-30">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-app)] text-[var(--text-muted)] md:hidden"
            aria-label="Ouvrir le menu"
          >
            <span className="text-lg leading-none">≡</span>
          </button>

          <div className="hidden md:block">
            <p className="text-xs text-[var(--text-faint)]">Bienvenue</p>
            <p className="font-semibold text-[var(--text-app)]">{user?.name}</p>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <NotificationBell />
            <span className="hidden sm:inline-flex rounded-md border border-[var(--border-app)] bg-[var(--bg-surface-2)] px-2.5 py-1 text-xs font-semibold text-[var(--text-muted)]">
              {roleLabel(user?.role)}
            </span>
            <DropdownMenu />
          </div>
        </header>

        <main className="p-4 md:p-8">
          {children}
        </main>
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
