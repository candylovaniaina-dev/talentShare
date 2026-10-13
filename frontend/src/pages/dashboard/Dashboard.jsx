import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  Calendar,           // ✅ AJOUT
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Compass,
  FileText,
  Handshake,
  LoaderCircle,
  MessageCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";

import AppShell from "../../components/layout/AppShell";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const COLORS = {
  navy: "#0A1229",
  navyLight: "#101D3A",
  emerald: "#34D399",
  muted: "#718096",
};

const number = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getRole = (user) => {
  const role = String(user?.role || "").toLowerCase();

  if (role.includes("admin")) return "admin";
  if (role.includes("univers")) return "university";
  if (role.includes("company") || role.includes("entreprise")) {
    return "company";
  }

  if (
    role.includes("student") ||
    role.includes("étudiant") ||
    role.includes("etudiant")
  ) {
    return "student";
  }

  return "employee";
};

const getFirstName = (user) => {
  if (user?.first_name) return user.first_name;

  const name = user?.name || user?.full_name || "";
  return name.trim().split(/\s+/)[0] || "Utilisateur";
};

function Dashboard() {
  const { user: authUser } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const results = await Promise.allSettled([
        api.get("/dashboard"),
        api.get("/profile/me"),
      ]);

      const dashboardResult = results[0];
      const profileResult = results[1];

      if (dashboardResult.status === "fulfilled") {
        setDashboard(dashboardResult.value?.data ?? {});
      } else {
        throw dashboardResult.reason;
      }

      if (profileResult.status === "fulfilled") {
        const response = profileResult.value?.data;
        setProfile(response?.profile ?? response?.data ?? response ?? null);
      }
    } catch (err) {
      console.error("Erreur de chargement du dashboard :", err);
      setError(
        err?.response?.data?.message ||
          "Impossible de charger le tableau de bord. Réessaie dans un instant."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const user = profile?.user || profile || authUser || {};
  const role = getRole(authUser?.role ? authUser : user);
  const firstName = getFirstName(user);

  const stats =
    dashboard?.stats ||
    dashboard?.statistics ||
    dashboard ||
    {};

  const completion = Math.min(
    100,
    Math.max(0, number(stats.completion ?? profile?.completion_percentage))
  );

  return (
    <AppShell>
      <main className="min-h-screen bg-[#F5F7FB] px-4 py-6 text-[#17213A] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-7">
          <header className="relative overflow-hidden rounded-[28px] bg-[#0A1229] p-6 text-white shadow-lg sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 right-1/4 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />

            <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-center">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-emerald-300">
                  <Sparkles size={14} />
                  Ton espace TalentShare
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Bonjour, {firstName} 👋
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                  Retrouve tes activités, suis tes opportunités et avance dans
                  tes projets depuis un seul espace.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to={role === "company" ? "/resource-requests" : "/explore"}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-[#07172A] transition hover:bg-emerald-300"
                  >
                    {role === "company"
                      ? "Gérer mes demandes"
                      : "Explorer les opportunités"}
                    <ArrowRight size={17} />
                  </Link>

                  <Link
                    to="/profile"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    <CircleUserRound size={17} />
                    Mon profil
                  </Link>
                </div>
              </div>

              <div className="hidden shrink-0 md:block">
                <div className="flex h-36 w-36 items-center justify-center rounded-[32px] border border-white/10 bg-white/[0.05]">
                  <div className="flex h-24 w-24 items-center justify-center rounded-[26px] bg-emerald-400 text-[#07172A]">
                    <Zap size={44} strokeWidth={1.7} />
                  </div>
                </div>
              </div>
            </div>
          </header>

          {error && (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-2">
                <Activity size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>

              <button
                type="button"
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 font-semibold transition hover:bg-red-100 disabled:opacity-60"
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? "animate-spin" : ""}
                />
                Réessayer
              </button>
            </div>
          )}

          {loading ? (
            <DashboardSkeleton />
          ) : (
            <>
              {(role === "employee" || role === "student") && (
                <ProfileCompletion
                  completion={completion}
                  nextStep={stats.completion_next_step}
                />
              )}

              <RoleDashboard
                role={role}
                stats={stats}
                user={user}
                refreshing={refreshing}
                onRefresh={() => loadDashboard(true)}
              />
            </>
          )}
        </div>
      </main>
    </AppShell>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Chargement du tableau de bord">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-36 animate-pulse rounded-2xl border border-slate-100 bg-white"
          />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-2xl bg-white lg:col-span-2" />
        <div className="h-72 animate-pulse rounded-2xl bg-white" />
      </div>
    </div>
  );
}

function ProfileCompletion({ completion, nextStep }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Target size={23} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold text-[#0A1229]">
              Complète ton profil
            </h2>
            <span className="text-sm font-bold text-emerald-600">
              {completion} %
            </span>
          </div>

          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuenow={completion}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Complétion du profil"
          >
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>

          <p className="mt-2 text-sm text-slate-500">
            {nextStep ||
              "Un profil complet permet de mieux présenter tes compétences."}
          </p>
        </div>

        <Link
          to="/profile"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-[#0A1229] transition hover:border-emerald-300 hover:bg-emerald-50"
        >
          Compléter mon profil
          <ChevronRight size={16} />
        </Link>
      </div>
    </section>
  );
}

function RoleDashboard({ role, stats, user, refreshing, onRefresh }) {
  if (role === "company") {
    return (
      <CompanyDashboard
        stats={stats}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    );
  }

  if (role === "university") {
    return <UniversityDashboard stats={stats} />;
  }

  if (role === "admin") {
    return <AdminDashboard stats={stats} />;
  }

  return <TalentDashboard stats={stats} user={user} />;
}

function SectionHeading({ title, description, action }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-[#0A1229]">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>

      {action}
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  to,
  accent = "emerald",
}) {
  const accents = {
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    blue: "bg-blue-50 text-blue-600 ring-blue-100",
    violet: "bg-violet-50 text-violet-600 ring-violet-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
  };

  const content = (
    <div className="group h-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${
            accents[accent] || accents.emerald
          }`}
        >
          <Icon size={21} />
        </div>

        {to && (
          <ArrowUpRight
            size={18}
            className="text-slate-300 transition group-hover:text-emerald-500"
          />
        )}
      </div>

      <p className="mt-5 text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-[#0A1229]">
        {number(value).toLocaleString("fr-FR")}
      </p>

      {description && (
        <p className="mt-2 text-xs leading-5 text-slate-500">
          {description}
        </p>
      )}
    </div>
  );

  return to ? (
    <Link to={to} className="block h-full">
      {content}
    </Link>
  ) : (
    content
  );
}

function QuickLink({ to, icon: Icon, title, description }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-emerald-100 group-hover:text-emerald-700">
        <Icon size={19} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#0A1229]">{title}</p>
        {description && (
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        )}
      </div>

      <ChevronRight
        size={17}
        className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600"
      />
    </Link>
  );
}

function EmptyPanel({ title, description, to, actionLabel }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <FileText size={22} />
      </div>

      <h3 className="mt-4 font-semibold text-[#0A1229]">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {description}
      </p>

      {to && actionLabel && (
        <Link
          to={to}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0A1229] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#17284B]"
        >
          {actionLabel}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}

function CompanyDashboard({ stats, refreshing, onRefresh }) {
  return (
    <div className="space-y-7">
      <section>
        <SectionHeading
          title="Vue d'ensemble"
          description="Suis les demandes, les propositions et les missions de ton entreprise."
          action={
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-60"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
              Actualiser
            </button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Entreprises"
            value={stats.companies_count}
            description="Entreprises enregistrées"
            icon={Building2}
            accent="blue"
          />
          <StatCard
            title="Demandes ouvertes"
            value={stats.resource_requests_open}
            description="Demandes de ressources en cours"
            icon={BriefcaseBusiness}
            to="/resource-requests"
            accent="emerald"
          />
          <StatCard
            title="Propositions reçues"
            value={stats.proposals_received}
            description="Propositions disponibles"
            icon={Handshake}
            to="/proposals"
            accent="violet"
          />
          <StatCard
            title="Missions actives"
            value={stats.active_missions}
            description="Missions en cours"
            icon={Target}
            to="/missions"
            accent="amber"
          />
        </div>
      </section>

      {number(stats.pending_missions) > 0 && (
        <Link
          to="/missions"
          className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Bell size={20} />
            </div>
            <div>
              <p className="font-semibold text-amber-950">
                Des missions nécessitent ton attention
              </p>
              <p className="mt-1 text-sm text-amber-800">
                {number(stats.pending_missions)} mission(s) en attente.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-amber-900">
            Voir les missions <ArrowRight size={16} />
          </span>
        </Link>
      )}

      <section>
        <SectionHeading
          title="Accès rapides"
          description="Accède directement aux fonctionnalités principales."
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <QuickLink
            to="/resource-requests"
            icon={BriefcaseBusiness}
            title="Demandes de ressources"
            description="Consulte et gère tes demandes."
          />
          <QuickLink
            to="/proposals"
            icon={Handshake}
            title="Propositions"
            description="Retrouve les propositions reçues."
          />
          <QuickLink
            to="/missions"
            icon={Target}
            title="Mes missions"
            description="Suis l'avancement des missions."
          />
          <QuickLink
            to="/explore"
            icon={Compass}
            title="Explorer les talents"
            description="Découvre les profils disponibles."
          />
          <QuickLink
            to="/job-offers"
            icon={Users}
            title="Offres"
            description="Consulte les opportunités publiées."
          />
        </div>
      </section>
    </div>
  );
}

function TalentDashboard({ stats, user }) {
  const [activityFilter, setActivityFilter] = useState("all");

  const activityTabs = [
    { id: "all", label: "Vue d'ensemble" },
    { id: "applications", label: "Candidatures" },
    { id: "missions", label: "Missions" },
  ];

  const unreadMessages = number(stats.unread_messages);
  const applications = number(stats.applications_count);
  const proposals = number(stats.proposals_pending);
  const missions = number(stats.active_missions);

  return (
    <div className="space-y-7">
      <section>
        <SectionHeading
          title="Ton activité"
          description="Retrouve les informations principales de ton espace."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Candidatures"
            value={applications}
            description="Candidatures envoyées"
            icon={FileText}
            to="/applications"
            accent="blue"
          />
          <StatCard
            title="Propositions en attente"
            value={proposals}
            description="Propositions à consulter"
            icon={Handshake}
            to="/proposals"
            accent="violet"
          />
          <StatCard
            title="Missions actives"
            value={missions}
            description="Missions en cours"
            icon={Target}
            to="/missions"
            accent="emerald"
          />
          <StatCard
            title="Messages non lus"
            value={unreadMessages}
            description="Conversations à consulter"
            icon={MessageCircle}
            to="/messages"
            accent="amber"
          />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 lg:col-span-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Prochaine étape
              </p>
              <h2 className="mt-1 text-xl font-bold text-[#0A1229]">
                Développe ta présence
              </h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Sparkles size={22} />
            </div>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Mets à jour tes compétences et tes informations pour aider les
            entreprises à mieux comprendre ton profil.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0A1229] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#17284B]"
            >
              Modifier mon profil <ArrowRight size={16} />
            </Link>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-[#0A1229] transition hover:bg-slate-50"
            >
              Explorer <Compass size={16} />
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="font-bold text-[#0A1229]">Disponibilité</h2>
              <p className="text-xs text-slate-500">
                Information de ton profil
              </p>
            </div>
          </div>

          <p className="mt-5 text-lg font-semibold text-[#0A1229]">
            {stats.next_availability_label || "Non renseignée"}
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Maintiens tes informations de disponibilité à jour pour faciliter
            les prises de contact.
          </p>

          <Link
            to="/profile"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Mettre à jour <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section>
        <SectionHeading
          title="Accès rapides"
          description="Choisis ce que tu souhaites faire ensuite."
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <QuickLink
            to="/applications"
            icon={FileText}
            title="Mes candidatures"
            description="Consulte leur statut et leur évolution."
          />
          <QuickLink
            to="/proposals"
            icon={Handshake}
            title="Mes propositions"
            description="Retrouve les propositions reçues."
          />
          <QuickLink
            to="/missions"
            icon={Target}
            title="Mes missions"
            description="Consulte tes missions en cours."
          />
          <QuickLink
            to="/messages"
            icon={MessageCircle}
            title="Messagerie"
            description="Échange avec les autres membres."
          />
          <QuickLink
            to="/notifications"
            icon={Bell}
            title="Notifications"
            description={`${number(stats.notifications_count)} notification(s) indiquée(s) dans ton espace.`}
          />
          <QuickLink
            to="/job-offers"
            icon={BriefcaseBusiness}
            title="Offres d'emploi"
            description="Découvre de nouvelles opportunités."
          />
          <QuickLink
            to="/browse-requests"
            icon={Compass}
            title="Demandes de ressources"
            description="Trouve des projets correspondant à tes compétences."
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0A1229]">
              Mon espace personnel
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Consulte tes candidatures, missions et propositions.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {activityTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivityFilter(tab.id)}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  activityFilter === tab.id
                    ? "bg-[#0A1229] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {(activityFilter === "all" || activityFilter === "applications") && (
            <QuickLink
              to="/applications"
              icon={FileText}
              title="Candidatures"
              description={`${applications} candidature(s) enregistrée(s).`}
            />
          )}

          {(activityFilter === "all" || activityFilter === "missions") && (
            <QuickLink
              to="/missions"
              icon={Target}
              title="Missions"
              description={`${missions} mission(s) active(s).`}
            />
          )}

          {activityFilter === "all" && (
            <QuickLink
              to="/proposals"
              icon={Handshake}
              title="Propositions"
              description={`${proposals} proposition(s) en attente.`}
            />
          )}

          {activityFilter === "all" && (
            <QuickLink
              to="/profile"
              icon={CircleUserRound}
              title="Mon profil"
              description={`Profil de ${user?.name || user?.first_name || "l'utilisateur"}.`}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function UniversityDashboard({ stats }) {
  return (
    <div className="space-y-7">
      <section>
        <SectionHeading
          title="Vue d'ensemble"
          description="Retrouve les données disponibles pour ton espace universitaire."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Étudiants"
            value={stats.students_count ?? stats.students_total}
            icon={Users}
            accent="blue"
          />
          <StatCard
            title="Entreprises"
            value={stats.companies_count}
            icon={Building2}
            accent="emerald"
          />
          <StatCard
            title="Missions"
            value={stats.active_missions}
            icon={Target}
            to="/missions"
            accent="violet"
          />
          <StatCard
            title="Propositions"
            value={stats.proposals_received}
            icon={Handshake}
            to="/proposals"
            accent="amber"
          />
        </div>
      </section>

      <section>
        <SectionHeading
          title="Accès rapides"
          description="Retrouve rapidement les principales sections."
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <QuickLink
            to="/explore"
            icon={Users}
            title="Explorer les talents"
            description="Découvre les profils disponibles."
          />
          <QuickLink
            to="/missions"
            icon={Target}
            title="Missions"
            description="Consulte les missions de la plateforme."
          />
          <QuickLink
            to="/messages"
            icon={MessageCircle}
            title="Messagerie"
            description="Accède à tes conversations."
          />
          <QuickLink
            to="/profile"
            icon={CircleUserRound}
            title="Profil universitaire"
            description="Consulte les informations de ton profil."
          />
        </div>
      </section>
    </div>
  );
}

function AdminDashboard({ stats }) {
  return (
    <div className="space-y-7">
      <section>
        <SectionHeading
          title="Administration"
          description="Consulte les indicateurs fournis par la plateforme."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Utilisateurs"
            value={stats.users_count ?? stats.total_users}
            icon={Users}
            accent="blue"
          />
          <StatCard
            title="Entreprises"
            value={stats.companies_count}
            icon={Building2}
            accent="emerald"
          />
          <StatCard
            title="Missions actives"
            value={stats.active_missions}
            icon={Target}
            to="/missions"
            accent="violet"
          />
          <StatCard
            title="Demandes ouvertes"
            value={stats.resource_requests_open}
            icon={BriefcaseBusiness}
            to="/resource-requests"
            accent="amber"
          />
        </div>
      </section>

      <section>
        <SectionHeading
          title="Accès rapides"
          description="Accède aux espaces disponibles pour ton compte."
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <QuickLink
            to="/explore"
            icon={Users}
            title="Explorer les profils"
            description="Consulte les profils de la plateforme."
          />
          <QuickLink
            to="/missions"
            icon={Target}
            title="Missions"
            description="Consulte les missions disponibles."
          />
          <QuickLink
            to="/profile"
            icon={ShieldCheck}
            title="Mon profil"
            description="Consulte ton profil administrateur."
          />
        </div>
      </section>
    </div>
  );
}

export default Dashboard;