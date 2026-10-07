// frontend/src/pages/dashboard/Dashboard.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase, Users, FileText, Handshake, User, Layers, Building2,
  ArrowRight, AlertCircle, ArrowRightCircle, Sparkles, TrendingUp,
  CheckCircle2, Circle, Plus, Target, Calendar, Bell, MoreVertical,
  RefreshCw, EyeOff, MessageCircle, MapPin, Clock, Zap, Search,
  FolderPlus, Compass, Gauge,
} from "lucide-react";
import AppShell from "../../components/layout/AppShell";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/dashboard")
      .then((res) => setStats(res.data))
      .catch(() => setError("Impossible de charger le tableau de bord."));

    api.get("/profile/me")
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null));
  }, []);

  const hasProfile = Boolean(profile);
  const firstName = user?.first_name || user?.name?.split(" ")[0] || user?.name || "Utilisateur";

  return (
    <AppShell>
      {/* ===== HEADER ===== */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Espace personnel
          </p>
          <h1 className="mt-1 text-3xl font-bold text-white">
            Bonjour {firstName} —{" "}
            <span className="text-emerald-400">prêt à grandir ?</span>
          </h1>
        </div>
      </div>

      {/* ===== CARTE PROFIL ===== */}
      {user && (
        <ProfileCard user={user} profile={profile} hasProfile={hasProfile} />
      )}

      {error && (
        <div className="mb-6 mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* ===== CHARGEMENT ===== */}
      {!stats && !error && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      )}

      {/* ===== BANDEAU D'ACTION (missions en attente) ===== */}
      {stats?.pending_missions > 0 && (
        <div className="mb-6 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
              <AlertCircle size={20} />
            </span>
            <div>
              <p className="font-semibold text-amber-200">
                {stats.pending_missions} mission{stats.pending_missions > 1 ? "s" : ""} en attente d'action
              </p>
              <p className="text-xs text-amber-300/80">
                Accepter ou démarrer les missions en cours.
              </p>
            </div>
          </div>
          <Link
            to="/missions"
            className="flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-[#0A1229] transition hover:bg-amber-400"
          >
            Voir les missions <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* ===== CONTENU PAR RÔLE ===== */}
      <div className="mt-6">
        {stats && user?.role === "company" && (
          <CompanyDashboard stats={stats} user={user} />
        )}
        {stats && (user?.role === "employee" || user?.role === "student") && (
          <TalentDashboard stats={stats} user={user} profile={profile} hasProfile={hasProfile} />
        )}
        {stats && user?.role === "university" && (
          <UniversityDashboard stats={stats} user={user} />
        )}
        {stats && user?.role === "admin" && (
          <AdminDashboard stats={stats} />
        )}
      </div>
    </AppShell>
  );
}

/* ============================================================
   CARTE PROFIL (avatar, statut, disponibilité)
============================================================ */

function ProfileCard({ user, profile, hasProfile }) {
  const initials = user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const isStudent = user?.role === "student";
  const location = profile?.city
    ? `${profile.city}${profile.country ? `, ${profile.country}` : ""}`
    : null;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      {profile?.avatar_path ? (
        <img
          src={`http://localhost:8000/storage/${profile.avatar_path}`}
          alt={user.name}
          className="h-16 w-16 rounded-full border-2 border-emerald-400/40 object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-xl font-bold text-white">
          {initials}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-lg font-bold text-white">{user.name}</p>
          <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
            {isStudent ? "🎓 Jeune talent" : "💼 Talent"}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                hasProfile ? "bg-emerald-400" : "bg-slate-500"
              }`}
            />
            {hasProfile ? "Profil actif" : "Profil à compléter"}
          </span>
          {location && (
            <span className="flex items-center gap-1.5">
              <MapPin size={12} /> {location}
            </span>
          )}
        </div>
      </div>

      <Link
        to="/profile"
        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-emerald-500/40 hover:text-emerald-300"
      >
        Voir mon profil
      </Link>
    </div>
  );
}

/* ============================================================
   COMPOSANTS RÉUTILISABLES
============================================================ */

function CardMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg p-1 text-slate-600 transition hover:bg-white/10 hover:text-slate-300"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-white/10 bg-[#0F1E45] py-1 shadow-2xl">
          <button
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-300 transition hover:bg-white/5"
          >
            <RefreshCw size={13} /> Actualiser
          </button>
          <button
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-300 transition hover:bg-white/5"
          >
            <EyeOff size={13} /> Masquer la carte
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, to, color = "mint" }) {
  const Wrapper = to ? Link : "div";
  const wrapperProps = to ? { to } : {};

  const colorMap = {
    mint:    { bg: "bg-emerald-500/15", text: "text-emerald-400" },
    violet:  { bg: "bg-violet-500/15",  text: "text-violet-400" },
    blue:    { bg: "bg-blue-500/15",    text: "text-blue-400" },
    amber:   { bg: "bg-amber-500/15",   text: "text-amber-400" },
    rose:    { bg: "bg-rose-500/15",    text: "text-rose-400" },
  };
  const c = colorMap[color] || colorMap.mint;

  return (
    <Wrapper
      {...wrapperProps}
      className={`group block rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition ${
        to ? "hover:border-emerald-500/40 hover:bg-white/[0.06] cursor-pointer" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.bg} ${c.text}`}>
          <Icon size={18} />
        </span>
        <div className="flex items-center gap-1">
          {to && (
            <ArrowRightCircle
              size={16}
              className="text-slate-600 transition group-hover:text-emerald-400"
            />
          )}
          <CardMenu />
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
      {trend && (
        <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-400">
          <TrendingUp size={12} /> {trend}
        </p>
      )}
    </Wrapper>
  );
}

function SectionTitle({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <Icon size={18} />
          </span>
        )}
        <div>
          <h2 className="text-lg font-bold text-white">{title}</h2>
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ============================================================
   GRAPHIQUE EN COURBE (SVG, sans dépendance)
============================================================ */

function LineChart({ data, labels }) {
  const width = 700;
  const height = 220;
  const padding = 24;
  const max = Math.max(...data, 1);

  const points = data.map((v, i) => {
    const x = padding + (i * (width - padding * 2)) / (data.length - 1);
    const y = height - padding - (v / max) * (height - padding * 2);
    return [x, y];
  });

  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1][0]},${height - padding} L${points[0][0]},${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-48 w-full">
      <defs>
        <linearGradient id="dashLineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={padding}
          x2={width - padding}
          y1={height - padding - f * (height - padding * 2)}
          y2={height - padding - f * (height - padding * 2)}
          stroke="rgba(255,255,255,0.06)"
        />
      ))}

      <path d={areaPath} fill="url(#dashLineFill)" />
      <path d={linePath} fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill="#0A1229" stroke="#34d399" strokeWidth="2.5" />
      ))}

      {labels.map((l, i) => (
        <text
          key={l}
          x={points[i][0]}
          y={height - 4}
          textAnchor="middle"
          fontSize="11"
          fill="rgba(148,163,184,0.8)"
        >
          {l}
        </text>
      ))}
    </svg>
  );
}

/* ============================================================
   ✅ NOUVEAU : JAUGE SEMI-CIRCULAIRE (SVG, sans dépendance)
   Inspirée du "Taux d'avancement moyen" d'un tableau de bord projet
============================================================ */

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function GaugeChart({ percent, label }) {
  const cx = 110;
  const cy = 108;
  const r = 82;
  const strokeWidth = 16;
  const clamped = Math.max(0, Math.min(100, percent));
  const sweep = (clamped / 100) * 180;

  const color = clamped >= 80 ? "#34d399" : clamped >= 40 ? "#fbbf24" : "#64748b";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 220 128" className="w-full max-w-[220px]">
        <path
          d={describeArc(cx, cy, r, -90, 90)}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {clamped > 0 && (
          <path
            d={describeArc(cx, cy, r, -90, -90 + sweep)}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{ transition: "all 0.6s ease" }}
          />
        )}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="30" fontWeight="800" fill="#ffffff">
          {clamped}%
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="11" fill="rgba(148,163,184,0.9)">
          {label}
        </text>
      </svg>
    </div>
  );
}

/* ============================================================
   ✅ NOUVEAU : LISTE DE PROGRESSION (barres horizontales)
============================================================ */

function ProgressList({ items }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold text-slate-400">
                {i + 1}
              </span>
              {item.label}
            </span>
            <span className={`font-bold ${item.done ? "text-emerald-400" : "text-slate-500"}`}>
              {item.percent}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10">
            <div
              className={`h-1.5 rounded-full transition-all ${item.done ? "bg-emerald-400" : "bg-slate-600"}`}
              style={{ width: `${item.percent}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   ✅ NOUVEAU : RÉSUMÉ DE L'ACTIVITÉ (jauge + progression + KPIs)
============================================================ */

function ActivitySummary({ completion, breakdown, applications, pendingProposals, activeMissions, skillsCount }) {
  const kpis = [
    { label: "Candidatures", value: applications, color: "border-blue-500/30 bg-blue-500/10 text-blue-300" },
    { label: "Missions actives", value: activeMissions, color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
    { label: "Propositions en attente", value: pendingProposals, color: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
    { label: "Compétences", value: skillsCount, color: "border-violet-500/30 bg-violet-500/10 text-violet-300" },
  ];

  const progressItems = (breakdown.length > 0 ? breakdown : []).map((item) => ({
    label: item.label,
    done: item.done,
    percent: item.done ? 100 : 0,
  }));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
      <SectionTitle
        icon={Gauge}
        title="Résumé de votre activité"
        subtitle="Vue d'ensemble de votre progression sur TalentShare."
      />

      {/* Bande de KPIs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {kpis.map((k) => (
          <span
            key={k.label}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${k.color}`}
          >
            <span className="text-sm font-bold">{k.value}</span> {k.label}
          </span>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        {/* Jauge */}
        <div className="flex items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] py-4">
          <GaugeChart percent={completion} label="Taux de complétion" />
        </div>

        {/* Progression détaillée */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Progression</p>
          {progressItems.length > 0 ? (
            <ProgressList items={progressItems} />
          ) : (
            <p className="text-sm text-slate-500">Aucune donnée de progression disponible.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DASHBOARD ENTREPRISE
============================================================ */

function CompanyDashboard({ stats, user }) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Building2} label="Entreprises gérées" value={stats.companies_count || 0} color="mint" />
        <StatCard icon={Layers} label="Demandes publiées" value={stats.resource_requests_open || 0} to="/resource-requests" color="violet" />
        <StatCard icon={Handshake} label="Propositions reçues" value={stats.proposals_received || 0} to="/proposals" color="blue" />
        <StatCard icon={Briefcase} label="Missions actives" value={stats.active_missions || 0} to="/missions" color="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activité récente */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <SectionTitle
            icon={Sparkles}
            title="Mon activité récente"
            subtitle="Les derniers mouvements de votre parcours."
          />
          <ul className="space-y-3">
            <ActivityItem icon={Handshake} label="Proposition reçue" status="En attente" tone="amber" time="il y a 2 h" />
            <ActivityItem icon={FileText} label="Nouvelle candidature" status="À suivre" tone="blue" time="il y a 5 h" />
            <ActivityItem icon={Briefcase} label="Mission démarrée" status="Nouveau" tone="emerald" time="hier" />
          </ul>
        </div>

        {/* CTA */}
        <div className="rounded-2xl bg-gradient-to-br from-[#0B1633] to-[#0A1229] p-6 text-white">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <Target size={14} /> Prochaine action
          </p>
          <h3 className="mt-3 text-xl font-bold">Publiez une nouvelle demande de ressource.</h3>
          <p className="mt-2 text-sm text-slate-300">
            Décrivez votre besoin, laissez le matching trouver les meilleurs profils pour vous.
          </p>
          <Link
            to="/resource-requests"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400"
          >
            <Plus size={15} /> Créer une demande
          </Link>
        </div>
      </div>

      {/* Détails */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={AlertCircle} label="Missions en attente" value={stats.pending_missions || 0} to="/missions" color="rose" />
        <StatCard icon={FileText} label="Offres d'emploi ouvertes" value={stats.job_offers_open || 0} to="/job-offers" color="mint" />
      </div>

      <QuickActions
        role="company"
        actions={[
          { icon: FolderPlus, label: "Publier une demande", to: "/resource-requests" },
          { icon: Search, label: "Explorer les talents", to: "/explore" },
          { icon: FileText, label: "Publier une offre", to: "/job-offers" },
        ]}
      />
    </div>
  );
}

/* ============================================================
   DASHBOARD TALENT (employee + student)
============================================================ */

function TalentDashboard({ stats, user, profile, hasProfile }) {
  const completion = stats.completion ?? (hasProfile ? 0 : 0);
  const nextStep = stats.completion_next_step || "Compléter votre profil";
  const breakdown = stats.completion_breakdown || [];

  const skillsCount = stats.skills_count || 0;
  const applications = stats.applications_count || 0;
  const pendingProposals = stats.proposals_pending || 0;
  const activeMissions = stats.active_missions || 0;
  const unreadMessages = stats.unread_messages ?? 0;
  const nextAvailability = stats.next_availability_label || "Non renseignée";

  return (
    <div className="space-y-6">
      {/* ✅ Résumé de l'activité (nouveau) */}
      <ActivitySummary
        completion={completion}
        breakdown={breakdown}
        applications={applications}
        pendingProposals={pendingProposals}
        activeMissions={activeMissions}
        skillsCount={skillsCount}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={User}
          label="Profil complété"
          value={`${completion}%`}
          trend={completion >= 80 ? "Bien !" : completion >= 50 ? "+ Continue" : "À compléter"}
          color="violet"
        />
        <StatCard
          icon={Layers}
          label="Compétences renseignées"
          value={skillsCount}
          trend={skillsCount > 0 ? "+2 nouvelles" : "À compléter"}
          color="mint"
        />
        <StatCard
          icon={FileText}
          label="Candidatures envoyées"
          value={applications}
          to={applications > 0 ? "/missions" : undefined}
          color="blue"
        />
        <StatCard
          icon={Handshake}
          label="Propositions en attente"
          value={pendingProposals}
          to={pendingProposals > 0 ? "/proposals" : undefined}
          color="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Graphique / Visibilité */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <SectionTitle
            icon={TrendingUp}
            title="Votre visibilité progresse"
            subtitle="Vues de profil et mises en relation sur 6 mois."
            action={
              <Link
                to="/profile"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-emerald-500/40 hover:text-emerald-300"
              >
                Voir le portfolio →
              </Link>
            }
          />
          <LineChart
            data={[20, 30, 32, 28, 45, 50, 62]}
            labels={["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil"]}
          />
        </div>

        {/* CTA Profile — Complétion réelle */}
        <div className="rounded-2xl bg-gradient-to-br from-[#0B1633] to-[#0A1229] p-6 text-white">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <Target size={14} /> Prochaine action
          </p>
          <h3 className="mt-3 text-xl font-bold">{nextStep}</h3>
          <p className="mt-2 text-sm text-slate-300">
            Complétez votre profil pour apparaître dans plus de recherches.
          </p>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Profil à {completion}%</span>
              <span>Objectif 100%</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-white/10">
              <div
                className="h-1.5 rounded-full bg-emerald-400 transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>
          <Link
            to="/profile"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400"
          >
            Compléter mon profil <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Checklist détaillée */}
      {breakdown.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <SectionTitle
            icon={CheckCircle2}
            title="Complétion du profil"
            subtitle="Cochez chaque étape pour atteindre 100%."
            action={
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">
                {completion}%
              </span>
            }
          />
          <div className="grid gap-2 sm:grid-cols-2">
            {breakdown.map((item) => (
              <div
                key={item.key}
                className={`flex items-start gap-3 rounded-lg border p-3 transition ${
                  item.done
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-white/5 bg-white/[0.02]"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    item.done
                      ? "bg-emerald-500 text-white"
                      : "border-2 border-slate-600 bg-transparent"
                  }`}
                >
                  {item.done && <CheckCircle2 size={12} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold ${item.done ? "text-emerald-300" : "text-white"}`}>
                    {item.label}
                  </p>
                  {!item.done && (
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      {item.action}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-[10px] text-slate-500">
                  {item.weight}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disponibilité + Messages + Notifications */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MiniWidget
          icon={Calendar}
          color="mint"
          label="Prochaine disponibilité"
          value={nextAvailability}
          action={{ label: "Gérer mes disponibilités", to: "/profile" }}
        />
        <MiniWidget
          icon={MessageCircle}
          color="blue"
          label="Messages non lus"
          value={unreadMessages}
          action={{ label: "Ouvrir la messagerie", to: "/messages" }}
        />
        <MiniWidget
          icon={Bell}
          color="amber"
          label="Notifications"
          value={stats.notifications_count ?? 0}
          action={{ label: "Tout voir", to: "/notifications" }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <SectionTitle
            icon={Sparkles}
            title="Mon activité récente"
            subtitle="Les derniers mouvements de votre parcours."
            action={
              <Link to="/missions" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">
                Tout voir →
              </Link>
            }
          />
          <ul className="space-y-3">
            {activeMissions > 0 ? (
              <ActivityItem
                icon={Briefcase}
                label={`${activeMissions} mission${activeMissions > 1 ? "s" : ""} active${activeMissions > 1 ? "s" : ""}`}
                status="En cours"
                tone="emerald"
                time="maintenant"
              />
            ) : (
              <EmptyActivity label="Aucune mission active" />
            )}
            {pendingProposals > 0 ? (
              <ActivityItem
                icon={Handshake}
                label={`${pendingProposals} proposition${pendingProposals > 1 ? "s" : ""} en attente`}
                status="En attente"
                tone="amber"
                time="à traiter"
              />
            ) : (
              <EmptyActivity label="Aucune proposition en attente" />
            )}
            {skillsCount > 0 ? (
              <ActivityItem
                icon={CheckCircle2}
                label={`${skillsCount} compétence${skillsCount > 1 ? "s" : ""} renseignée${skillsCount > 1 ? "s" : ""}`}
                status="À jour"
                tone="emerald"
                time="profil"
              />
            ) : (
              <EmptyActivity label="Ajoutez vos premières compétences" />
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <SectionTitle
            icon={Target}
            title="Opportunités suggérées"
            subtitle={`Pour le profil ${user?.name?.split(" ")[0] || ""}.`}
          />
          <ul className="space-y-3">
            <OpportunityItem icon={Briefcase} title="Explorer les ressources disponibles" company="TalentShare" match="Nouveau" to="/explore" />
            <OpportunityItem icon={FileText} title="Parcourir les offres d'emploi" company="Job Board" match="Recommandé" to="/job-offers" />
            <OpportunityItem icon={Handshake} title="Voir les demandes des entreprises" company="Réseau B2B" match="Nouveau" to="/browse-requests" />
          </ul>
        </div>
      </div>

      <QuickActions
        role="talent"
        actions={[
          { icon: User, label: "Compléter mon profil", to: "/profile" },
          { icon: Compass, label: "Explorer le réseau", to: "/explore" },
          { icon: Calendar, label: "Mettre à jour mes disponibilités", to: "/profile" },
        ]}
      />

      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <Plus size={20} />
            </span>
            <div>
              <p className="font-semibold text-white">Vous avez un projet en tête ?</p>
              <p className="text-sm text-slate-400">
                Explorez les ressources disponibles pour trouver le bon point de départ.
              </p>
            </div>
          </div>
          <Link
            to="/explore"
            className="flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400"
          >
            Explorer le réseau <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   NOUVEAUX PETITS WIDGETS
============================================================ */

function MiniWidget({ icon: Icon, color, label, value, action }) {
  const colorMap = {
    mint:  { bg: "bg-emerald-500/15", text: "text-emerald-400" },
    blue:  { bg: "bg-blue-500/15",    text: "text-blue-400" },
    amber: { bg: "bg-amber-500/15",   text: "text-amber-400" },
  };
  const c = colorMap[color] || colorMap.mint;

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.bg} ${c.text}`}>
          <Icon size={16} />
        </span>
        <p className="text-sm text-slate-400">{label}</p>
      </div>
      <p className="mt-3 truncate text-xl font-bold text-white">{value}</p>
      {action && (
        <Link
          to={action.to}
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
        >
          {action.label} <ArrowRight size={12} />
        </Link>
      )}
    </div>
  );
}

function QuickActions({ actions }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
      <SectionTitle icon={Zap} title="Raccourcis rapides" subtitle="Les actions les plus utiles, en un clic." />
      <div className="grid gap-3 sm:grid-cols-3">
        {actions.map(({ icon: Icon, label, to }) => (
          <Link
            key={label}
            to={to}
            className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3.5 transition hover:border-emerald-500/40 hover:bg-white/[0.08]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Icon size={16} />
            </span>
            <span className="text-sm font-semibold text-white">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   DASHBOARD UNIVERSITÉ
============================================================ */

function UniversityDashboard({ stats }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Building2} label="Universités gérées" value={stats.universities_count || 0} color="mint" />
      </div>
      <QuickActions
        role="university"
        actions={[
          { icon: Search, label: "Explorer les talents", to: "/explore" },
          { icon: FileText, label: "Voir les offres publiées", to: "/job-offers" },
        ]}
      />
    </div>
  );
}

/* ============================================================
   DASHBOARD ADMIN
============================================================ */

function AdminDashboard({ stats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={Users} label="Utilisateurs" value={stats.users_count || 0} color="mint" />
      <StatCard icon={Building2} label="Entreprises" value={stats.companies_count || 0} color="violet" />
      <StatCard icon={Building2} label="Universités" value={stats.universities_count || 0} color="blue" />
      <StatCard icon={Briefcase} label="Missions" value={stats.missions_count || 0} to="/missions" color="amber" />
      <StatCard icon={FileText} label="Vérifications en attente" value={stats.pending_verifications || 0} color="rose" />
    </div>
  );
}

/* ============================================================
   PETITS COMPOSANTS D'ACTIVITÉ
============================================================ */

function ActivityItem({ icon: Icon, label, status, tone = "emerald", time }) {
  const toneMap = {
    emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    amber:   "bg-amber-500/10 text-amber-300 border-amber-500/30",
    blue:    "bg-blue-500/10 text-blue-300 border-blue-500/30",
    rose:    "bg-rose-500/10 text-rose-300 border-rose-500/30",
  };
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/5 p-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
          <Icon size={16} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{label}</p>
          <p className="text-xs text-slate-500">{time}</p>
        </div>
      </div>
      <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${toneMap[tone]}`}>
        {status}
      </span>
    </li>
  );
}

function EmptyActivity({ label }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-3 text-sm text-slate-500">
      <Circle size={16} className="text-slate-600" />
      {label}
    </li>
  );
}

function OpportunityItem({ icon: Icon, title, company, match, to }) {
  return (
    <li>
      <Link
        to={to}
        className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/5 p-3 transition hover:border-emerald-500/40 hover:bg-white/[0.08]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <Icon size={16} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{title}</p>
            <p className="text-xs text-slate-500">{company}</p>
          </div>
        </div>
        <span className="shrink-0 text-xs font-bold text-emerald-400">{match}</span>
      </Link>
    </li>
  );
}