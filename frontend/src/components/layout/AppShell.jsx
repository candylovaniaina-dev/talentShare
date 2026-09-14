import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, User, Briefcase, Search, MessageSquare,
  LogOut, Circle, Building2, Handshake,
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
    { to: "/job-offers", label: "Mes offres d'emploi", icon: Briefcase },
    { to: "/messages", label: "Messagerie", icon: MessageSquare },
  ],
  employee: [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/profile", label: "Mon profil", icon: User },
    { to: "/opportunites", label: "Opportunités", icon: Search },
    { to: "/messages", label: "Messagerie", icon: MessageSquare },
  ],
  student: [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/profile", label: "Mon profil", icon: User },
    { to: "/job-offers", label: "Offres & stages", icon: Briefcase },
    { to: "/messages", label: "Messagerie", icon: MessageSquare },
  ],
  university: [
    { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
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
    <div className="min-h-screen bg-slate-50 font-sans text-navy">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-5 md:flex">
          <Link to="/" className="mb-8 flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-mint/40 bg-mint/10 text-mint">
              <Circle size={14} strokeWidth={3} />
            </span>
            TalentShare
          </Link>

          <nav className="flex-1 space-y-1">
            {nav.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active ? "bg-navy text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main */}
        <div className="flex-1">
          {/* Topbar */}
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
            <div>
              <p className="text-sm text-slate-400">Bienvenue</p>
              <p className="font-semibold">{user?.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <span className="rounded-full bg-mint/15 px-3 py-1 text-xs font-semibold text-navy">
                {roleLabel(user?.role)}
              </span>
              <DropdownMenu />
            </div>
          </header>

          <main className="p-6">{children}</main>
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