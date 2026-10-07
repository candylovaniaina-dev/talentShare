import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Loader2, Search, Briefcase, TrendingUp, Users, Building2,
  Heart, MessageCircle, Send, Plus, Eye,
} from "lucide-react";

export default function Accueil() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    offers: 0,
    talents: 0,
    companies: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/job-offers?per_page=1").then(r => r.data.total || 0).catch(() => 0),
      api.get("/professional-profiles?per_page=1").then(r => r.data.total || 0).catch(() => 0),
      api.get("/companies?per_page=1").then(r => r.data.total || 0).catch(() => 0),
    ]).then(([offers, talents, companies]) => {
      setStats({ offers, talents, companies });
      setLoading(false);
    });
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        {/* Composer style LinkedIn */}
        <div className="mb-5 rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <Link
              to={user?.role === "company" ? "/company" : "/profile"}
              className="flex-1 rounded-full border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-4 py-2.5 text-left text-sm text-[var(--text-muted)] transition hover:border-emerald-500/40 hover:bg-[var(--bg-surface)]"
            >
              Commencer un post...
            </Link>
          </div>
          <div className="mt-3 flex items-center justify-around border-t border-[var(--border-app)] pt-3">
            <Link
              to="/actualite"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-hover)] hover:text-emerald-400"
            >
              <Briefcase size={14} className="text-emerald-400" /> Voir les offres
            </Link>
            <Link
              to="/explore-dashboard"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-hover)] hover:text-amber-400"
            >
              <Search size={14} className="text-amber-400" /> Explorer les talents
            </Link>
            <Link
              to="/resource-requests"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-hover)] hover:text-blue-400"
            >
              <Plus size={14} className="text-blue-400" /> Nouvelle demande
            </Link>
          </div>
        </div>

        {/* Statistiques */}
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <StatCard
            icon={Briefcase}
            label="Offres publiées"
            value={loading ? "…" : stats.offers}
            tone="emerald"
            link="/actualite"
          />
          <StatCard
            icon={Users}
            label="Talents inscrits"
            value={loading ? "…" : stats.talents}
            tone="blue"
            link="/explore-dashboard"
          />
          <StatCard
            icon={Building2}
            label="Entreprises"
            value={loading ? "…" : stats.companies}
            tone="violet"
            link="/"
          />
        </div>

        {/* Section placeholder feed */}
        <div className="rounded-2xl border border-dashed border-[var(--border-app)] bg-[var(--bg-surface)] p-10 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
            <TrendingUp size={26} />
          </span>
          <p className="mt-4 text-base font-bold text-[var(--text-app)]">
            Bienvenue sur TalentShare 👋
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Votre fil d'actualité arrive bientôt. En attendant, explorez les offres et les talents.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              to="/actualite"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400"
            >
              <Briefcase size={14} /> Voir les offres
            </Link>
            <Link
              to="/explore-dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-4 py-2 text-sm font-semibold text-[var(--text-app)] transition hover:bg-[var(--bg-surface)]"
            >
              <Search size={14} /> Explorer les talents
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value, tone, link }) {
  const tones = {
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    blue: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    violet: "border-violet-500/30 bg-violet-500/10 text-violet-400",
  };
  const Wrapper = link ? Link : "div";
  const props = link ? { to: link } : {};
  return (
    <Wrapper
      {...props}
      className="block rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-4 transition hover:border-emerald-500/40"
    >
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${tones[tone]}`}>
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-[var(--text-muted)]">{label}</p>
          <p className="text-lg font-bold text-[var(--text-app)]">{value}</p>
        </div>
      </div>
    </Wrapper>
  );
}