import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  Loader2,
  Search,
  Briefcase,
  TrendingUp,
  Users,
  Building2,
  Plus,
  ArrowUpRight,
  Sparkles,
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
    let active = true;

    Promise.all([
      api
        .get("/job-offers?per_page=1")
        .then((r) => r.data.total || 0)
        .catch(() => 0),
      api
        .get("/professional-profiles?per_page=1")
        .then((r) => r.data.total || 0)
        .catch(() => 0),
      api
        .get("/companies?per_page=1")
        .then((r) => r.data.total || 0)
        .catch(() => 0),
    ]).then(([offers, talents, companies]) => {
      if (!active) return;

      setStats({ offers, talents, companies });
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const firstName = user?.name?.trim()?.split(" ")[0] || "Bienvenue";

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 pb-8">
        {/* Welcome banner */}
        <section className="relative overflow-hidden rounded-3xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                <Sparkles size={13} />
                Votre espace TalentShare
              </span>

              <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--text-app)] sm:text-3xl">
                Bonjour, {firstName} !
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-muted)] sm:text-base">
                Découvrez de nouvelles opportunités, développez votre réseau
                professionnel et connectez-vous avec les talents et les
                entreprises.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/actualite"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-[#0B1F33] shadow-lg shadow-emerald-500/10 transition hover:-translate-y-0.5 hover:bg-emerald-400"
                >
                  <Briefcase size={16} />
                  Explorer les offres
                  <ArrowUpRight size={15} />
                </Link>

                <Link
                  to="/explore-dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-5 py-3 text-sm font-semibold text-[var(--text-app)] transition hover:border-emerald-500/40"
                >
                  <Search size={16} />
                  Explorer les talents
                </Link>
              </div>
            </div>

            <div className="hidden shrink-0 sm:flex">
              <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-emerald-500/20 bg-emerald-500/10">
                <TrendingUp size={48} className="text-emerald-400" />
              </div>
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <section>
          <div className="mb-3">
            <h2 className="text-base font-bold text-[var(--text-app)]">
              Accès rapides
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Accédez directement aux fonctionnalités principales.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <QuickAction
              to="/actualite"
              icon={Briefcase}
              title="Offres d'emploi"
              description="Trouvez votre prochaine opportunité."
              tone="emerald"
            />

            <QuickAction
              to="/explore-dashboard"
              icon={Users}
              title="Explorer les talents"
              description="Découvrez des profils professionnels."
              tone="blue"
            />

            <QuickAction
              to="/resource-requests"
              icon={Plus}
              title="Demandes"
              description="Accédez à vos demandes de ressources."
              tone="violet"
            />
          </div>
        </section>

        {/* Platform statistics */}
        <section>
          <div className="mb-3">
            <h2 className="text-base font-bold text-[var(--text-app)]">
              TalentShare en chiffres
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Quelques indicateurs de la plateforme.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              icon={Briefcase}
              label="Offres publiées"
              value={stats.offers}
              loading={loading}
              tone="emerald"
              link="/actualite"
            />

            <StatCard
              icon={Users}
              label="Profils professionnels"
              value={stats.talents}
              loading={loading}
              tone="blue"
              link="/explore-dashboard"
            />

            <StatCard
              icon={Building2}
              label="Entreprises"
              value={stats.companies}
              loading={loading}
              tone="violet"
            />
          </div>
        </section>

        {/* Community section */}
        <section className="relative overflow-hidden rounded-3xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
              <TrendingUp size={26} className="text-emerald-400" />
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-bold text-[var(--text-app)]">
                Faites avancer votre carrière
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
                Parcourez les offres disponibles, découvrez les entreprises
                et identifiez les opportunités qui correspondent à vos
                objectifs professionnels.
              </p>
            </div>

            <Link
              to="/actualite"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-4 py-3 text-sm font-semibold text-[var(--text-app)] transition hover:border-emerald-500/40 hover:text-emerald-400"
            >
              Découvrir
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function QuickAction({ to, icon: Icon, title, description, tone }) {
  const tones = {
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    blue: "border-blue-500/20 bg-blue-500/10 text-blue-400",
    violet: "border-violet-500/20 bg-violet-500/10 text-violet-400",
  };

  return (
    <Link
      to={to}
      className="group rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-black/5"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl border ${tones[tone]}`}
        >
          <Icon size={20} />
        </span>

        <ArrowUpRight
          size={17}
          className="text-[var(--text-faint)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-400"
        />
      </div>

      <h3 className="mt-4 text-sm font-bold text-[var(--text-app)]">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
        {description}
      </p>
    </Link>
  );
}

function StatCard({ icon: Icon, label, value, loading, tone, link }) {
  const tones = {
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    blue: "border-blue-500/20 bg-blue-500/10 text-blue-400",
    violet: "border-violet-500/20 bg-violet-500/10 text-violet-400",
  };

  const Wrapper = link ? Link : "div";
  const wrapperProps = link ? { to: link } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`group block rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-5 transition ${
        link ? "hover:border-emerald-500/40 hover:shadow-lg hover:shadow-black/5" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl border ${tones[tone]}`}
        >
          <Icon size={19} />
        </span>

        {link && (
          <ArrowUpRight
            size={16}
            className="text-[var(--text-faint)] transition group-hover:text-emerald-400"
          />
        )}
      </div>

      <p className="mt-4 text-xs font-medium text-[var(--text-muted)]">
        {label}
      </p>

      <div className="mt-1 flex items-center gap-2">
        {loading ? (
          <Loader2 size={19} className="animate-spin text-emerald-400" />
        ) : (
          <p className="text-2xl font-bold tracking-tight text-[var(--text-app)]">
            {Number(value || 0).toLocaleString("fr-FR")}
          </p>
        )}
      </div>
    </Wrapper>
  );
}