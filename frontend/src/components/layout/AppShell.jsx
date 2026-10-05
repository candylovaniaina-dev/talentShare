import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard, User, Briefcase, Search, MessageSquare,
    LogOut, Circle, Building2, Handshake, FileText, Plus,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "./NotificationBell";
import DropdownMenu from "./DropdownMenu";

const navByRole = {
  company: [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/company", label: "Mon entreprise", icon: Building2 },
    { to: "/resource-requests", label: "Mes demandes", icon: Search },
    { to: "/resource-offers", label: "Mes offres de ressources", icon: Handshake },
    { to: "/resource-offers/browse", label: "Ressources disponibles", icon: Search },
    { to: "/proposals", label: "Propositions", icon: FileText },
    { to: "/missions", label: "Missions", icon: Briefcase },
    { to: "/job-offers", label: "Mes offres d'emploi", icon: Briefcase },
    { to: "/messages", label: "Messagerie", icon: MessageSquare },
  ],
  employee: [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/profile", label: "Mon profil", icon: User },
    { to: "/opportunites", label: "Opportunités", icon: Search },
    { to: "/browse-requests", label: "Demandes des entreprises", icon: FileText },
    { to: "/proposals", label: "Mes propositions", icon: Handshake },
    { to: "/missions", label: "Mes missions", icon: Briefcase },
    { to: "/messages", label: "Messagerie", icon: MessageSquare },
  ],
  student: [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/profile", label: "Mon profil", icon: User },
    { to: "/job-offers", label: "Offres & stages", icon: Briefcase },
    { to: "/browse-requests", label: "Demandes des entreprises", icon: FileText },
    { to: "/proposals", label: "Mes propositions", icon: Handshake },
    { to: "/missions", label: "Mes missions", icon: Briefcase },
    { to: "/messages", label: "Messagerie", icon: MessageSquare },
  ],
  university: [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/universities", label: "Universités", icon: Building2 },
    { to: "/universities/new", label: "Ajouter une université", icon: Plus },
    { to: "/messages", label: "Messagerie", icon: MessageSquare },
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

  return (
    <div className="min-h-screen bg-[var(--bg-app)] font-sans text-[var(--text-app)] transition-colors">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--border-app)] bg-[var(--bg-app)] p-5 md:flex">
          <Link to="/" className="mb-8 flex items-center gap-2 font-bold text-[var(--text-app)]">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
              <Circle size={14} strokeWidth={3} />
            </span>
            TalentShare
          </Link>

          <nav className="flex-1 space-y-1">
            {nav.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to || location.pathname.startsWith(to + "/");
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
                  {label}
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

        {/* Main */}
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