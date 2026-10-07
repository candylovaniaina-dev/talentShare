import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, User, Briefcase, Search, MessageSquare,
  Circle, Building2, Handshake, FileText,
  Layers,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "./NotificationBell";
import DropdownMenu from "./DropdownMenu";
import api from "../../services/api";

const navByRole = {
  company: [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/company", label: "Mon entreprise", icon: Building2 },
    { to: "/my-offers", label: "Mes offres", icon: Briefcase },
    { to: "/resource-requests", label: "Mes demandes", icon: Search },
    { to: "/resource-offers/browse", label: "Ressources disponibles", icon: Search },
    { to: "/my-activity", label: "Mon activité", icon: Layers },
    { to: "/messages", label: "Messagerie", icon: MessageSquare, badge: "messages" },
  ],
  employee: [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/profile", label: "Mon profil", icon: User },
    { to: "/explore-dashboard", label: "Explorer", icon: Search },
    { to: "/my-activity", label: "Mon activité", icon: Layers },
    { to: "/messages", label: "Messagerie", icon: MessageSquare, badge: "messages" },
  ],
  student: [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/profile", label: "Mon profil", icon: User },
    { to: "/explore-dashboard", label: "Explorer", icon: Search },
    { to: "/my-activity", label: "Mon activité", icon: Layers },
    { to: "/messages", label: "Messagerie", icon: MessageSquare, badge: "messages" },
  ],
  university: [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/messages", label: "Messagerie", icon: MessageSquare, badge: "messages" },
  ],
  admin: [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/admin/verifications", label: "Vérifications", icon: User },
  ],
};

export default function AppShell({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const nav = navByRole[user?.role] || navByRole.employee;

  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

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

  const getBadgeCount = (badgeType) => {
    if (badgeType === "messages") return isOnMessagesPage ? 0 : unreadMessages;
    if (badgeType === "notifications") return unreadNotifs;
    return 0;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] font-sans text-[var(--text-app)] transition-colors">
      <div className="flex">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--border-app)] bg-[var(--bg-app)] p-5 md:flex">
          <Link to="/" className="mb-8 flex items-center gap-2 font-bold text-[var(--text-app)]">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
              <Circle size={14} strokeWidth={3} />
            </span>
            TalentShare
          </Link>

          <nav className="flex-1 space-y-1">
            {nav.map(({ to, label, icon: Icon, badge }) => {
              const active = location.pathname === to || location.pathname.startsWith(to + "/");
              const badgeCount = badge ? getBadgeCount(badge) : 0;

              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? "bg-emerald-500 text-[#0A1229] shadow-lg shadow-emerald-500/20"
                      : "text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
                  }`}
                >
                  <Icon size={18} />
                  <span className="flex-1">{label}</span>
                  {badgeCount > 0 && (
                    <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                      active ? "bg-[#0A1229] text-emerald-400" : "bg-emerald-500 text-[#0A1229]"
                    }`}>
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
              Version Beta
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Vos données sont protégées.
            </p>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <header className="flex items-center justify-between border-b border-[var(--border-app)] bg-[var(--bg-app)]/80 backdrop-blur-xl px-6 py-4 sticky top-0 z-30">
            <div>
              <p className="text-xs text-[var(--text-faint)]">Bienvenue</p>
              <p className="font-semibold text-[var(--text-app)]">{user?.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                {roleLabel(user?.role)}
              </span>
              <DropdownMenu />
            </div>
          </header>

          <main className="p-6">
            {children}
          </main>
        </div>
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