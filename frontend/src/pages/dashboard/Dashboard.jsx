// frontend/src/pages/dashboard/Dashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase, Users, FileText, Handshake, User, Layers, Building2,
  ArrowRight, AlertCircle, ArrowRightCircle, Sparkles, TrendingUp,
  CheckCircle2, Circle, Plus, Target, Calendar, Bell, MoreVertical,
  RefreshCw, EyeOff, MessageCircle, MapPin, Zap, Search,
  FolderPlus, Compass, Gauge, Check, X,
} from "lucide-react";
import AppShell from "../../components/layout/AppShell";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    api.get("/dashboard")
      .then((res) => setStats(res.data))
      .catch(() => setError("Impossible de charger le tableau de bord."));

    api.get("/profile/me")
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null));
  }, []);

  const hasProfile = Boolean(profile);

  return (
    <AppShell>
      {/* ===== HEADER ===== */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--text-app)]">Mon activité</h1>
            {stats?.proposals_pending > 0 && (
              <span className="relative inline-flex h-6 min-w-[24px] items-center justify-center rounded-lg bg-mint px-2 text-xs font-bold text-navy-900">
                {stats.proposals_pending}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Suivez vos propositions et missions en un seul endroit.
          </p>
        </div>

        <Link
          to="/proposals/new"
          className="flex items-center gap-2 rounded-xl2 bg-navy-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-navy-700"
        >
          <Plus size={15} strokeWidth={2} /> Nouvelle proposition
        </Link>
      </div>

      {/* ===== CARTE PROFIL ===== */}
      {user && (
        <ProfileCard user={user} profile={profile} hasProfile={hasProfile} />
      )}

      {error && (
        <div className="mb-6 mt-6 rounded-xl2 border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* ===== CHARGEMENT ===== */}
      {!stats && !error && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl2 bg-[var(--bg-surface-hover)]" />
          ))}
        </div>
      )}

      {/* ===== BANDEAU D'ACTION ===== */}
      {stats?.pending_missions > 0 && (
        <div className="mb-6 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl2 border border-amber-500/25 bg-amber-50 dark:bg-amber-500/10 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl2 bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <AlertCircle size={20} strokeWidth={1.5} />
            </span>
            <div>
              <p className="font-semibold text-amber-700 dark:text-amber-300">
                {stats.pending_missions} mission{stats.pending_missions > 1 ? "s" : ""} en attente d'action
              </p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
                Accepter ou démarrer les missions en cours.
              </p>
            </div>
          </div>
          <Link
            to="/missions"
            className="flex items-center gap-1.5 rounded-xl2 bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-400"
          >
            Voir les missions <ArrowRight size={14} strokeWidth={1.75} />
          </Link>
        </div>
      )}

      {/* ===== ONGLETS ===== */}
      {stats && (user?.role === "employee" || user?.role === "student") && (
        <div className="mt-6 flex items-center gap-6 border-b border-[var(--border-app)]">
          <TabButton
            active={tab === "all"}
            onClick={() => setTab("all")}
            icon={Layers}
            label="Tout"
            count={stats.proposals_pending + stats.active_missions}
            accent
          />
          <TabButton
            active={tab === "proposals"}
            onClick={() => setTab("proposals")}
            icon={Handshake}
            label="Propositions"
            count={stats.proposals_pending}
          />
          <TabButton
            active={tab === "missions"}
            onClick={() => setTab("missions")}
            icon={Briefcase}
            label="Missions"
            count={stats.active_missions}
          />
        </div>
      )}

      {/* ===== CONTENU PAR RÔLE ===== */}
      <div className="mt-6">
        {stats && user?.role === "company" && (
          <CompanyDashboard stats={stats} user={user} />
        )}
        {stats && (user?.role === "employee" || user?.role === "student") && (
          <TalentDashboard
            stats={stats}
            user={user}
            profile={profile}
            hasProfile={hasProfile}
            tab={tab}
          />
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
   ONGLET (avec badge numérique)
============================================================ */

function TabButton({ active, onClick, icon: Icon, label, count = 0, accent = false }) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center gap-2 pb-3 text-sm font-semibold transition ${
        active ? "text-[var(--text-app)]" : "text-[var(--text-muted)] hover:text-[var(--text-app)]"
      }`}
    >
      <Icon size={15} strokeWidth={1.75} className={active ? "text-mint" : ""} />
      {label}
      {count > 0 && (
        <span
          className={`flex h-5 min-w-[20px] items-center justify-center rounded-md px-1.5 text-[10px] font-bold ${
            accent
              ? "bg-mint text-navy-900"
              : "bg-[var(--bg-surface-hover)] text-[var(--text-muted)]"
          }`}
        >
          {count}
        </span>
      )}
      {active && (
        <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-mint" />
      )}
    </button>
  );
}

/* ============================================================
   CARTE PROFIL
============================================================ */

function ProfileCard({ user, profile, hasProfile }) {
  const initials = user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const isStudent = user?.role === "student";
  const location = profile?.city
    ? `${profile.city}${profile.country ? `, ${profile.country}` : ""}`
    : null;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface)] p-5 shadow-card">
      {profile?.avatar_path ? (
        <img
          src={`http://localhost:8000/storage/${profile.avatar_path}`}
          alt={user.name}
          className="h-16 w-16 rounded-xl2 border-2 border-mint/30 object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-xl2 bg-navy-800 text-xl font-bold text-white">
          {initials}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-lg font-bold text-[var(--text-app)]">{user.name}</p>
          <span className="flex items-center gap-1.5 rounded-md border border-[var(--border-app)] bg-[var(--bg-surface-2)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
            {isStudent ? "Jeune talent" : "Talent"}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${hasProfile ? "bg-mint" : "bg-[var(--text-faint)]"}`} />
            {hasProfile ? "Profil actif" : "Profil à compléter"}
          </span>
          {location && (
            <span className="flex items-center gap-1.5">
              <MapPin size={12} strokeWidth={1.5} /> {location}
            </span>
          )}
        </div>
      </div>

      <Link
        to="/profile"
        className="rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface-2)] px-4 py-2 text-xs font-semibold text-[var(--text-muted)] transition hover:border-mint hover:text-mint"
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
        className="rounded-lg p-1 text-[var(--text-faint)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-muted)]"
      >
        <MoreVertical size={16} strokeWidth={1.5} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface)] py-1 shadow-pop">
          <button
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-hover)]"
          >
            <RefreshCw size={13} strokeWidth={1.5} /> Actualiser
          </button>
          <button
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-hover)]"
          >
            <EyeOff size={13} strokeWidth={1.5} /> Masquer la carte
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, to, color = "mint", badge = 0 }) {
  const Wrapper = to ? Link : "div";
  const wrapperProps = to ? { to } : {};

  const colorMap = {
    mint:   { bg: "bg-mint/10",     text: "text-mint" },
    violet: { bg: "bg-violet-500/10",  text: "text-violet-600 dark:text-violet-400" },
    blue:   { bg: "bg-blue-500/10",    text: "text-blue-600 dark:text-blue-400" },
    amber:  { bg: "bg-amber-500/10",   text: "text-amber-600 dark:text-amber-400" },
    rose:   { bg: "bg-rose-500/10",    text: "text-rose-600 dark:text-rose-400" },
  };
  const c = colorMap[color] || colorMap.mint;

  return (
    <Wrapper
      {...wrapperProps}
      className={`group relative block rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface)] p-5 shadow-card transition ${
        to ? "hover:border-mint/40 hover:shadow-cardHover cursor-pointer" : ""
      }`}
    >
      {badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-6 min-w-[24px] items-center justify-center rounded-lg bg-mint px-1.5 text-[11px] font-bold text-navy-900 shadow-card">
          {badge}
        </span>
      )}

      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl2 ${c.bg} ${c.text}`}>
          <Icon size={18} strokeWidth={1.5} />
        </span>
        <div className="flex items-center gap-1">
          {to && (
            <ArrowRightCircle
              size={16}
              strokeWidth={1.5}
              className="text-[var(--text-faint)] transition group-hover:text-mint"
            />
          )}
          <CardMenu />
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold text-[var(--text-app)]">{value}</p>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{label}</p>
      {trend && (
        <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-mint">
          <TrendingUp size={12} strokeWidth={2} /> {trend}
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
          <span className="flex h-9 w-9 items-center justify-center rounded-xl2 bg-mint/10 text-mint">
            <Icon size={18} strokeWidth={1.5} />
          </span>
        )}
        <div>
          <h2 className="text-lg font-bold text-[var(--text-app)]">{title}</h2>
          {subtitle && <p className="text-sm text-[var(--text-muted)]">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ============================================================
   GRAPHIQUE EN COURBE (SVG)
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
          <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={padding}
          x2={width - padding}
          y1={height - padding - f * (height - padding * 2)}
          y2={height - padding - f * (height - padding * 2)}
          stroke="var(--border-app)"
        />
      ))}

      <path d={areaPath} fill="url(#dashLineFill)" />
      <path d={linePath} fill="none" stroke="#14B8A6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill="var(--bg-surface)" stroke="#14B8A6" strokeWidth="2.5" />
      ))}

      {labels.map((l, i) => (
        <text
          key={l}
          x={points[i][0]}
          y={height - 4}
          textAnchor="middle"
          fontSize="11"
          fill="var(--text-faint)"
        >
          {l}
        </text>
      ))}
    </svg>
  );
}

/* ============================================================
   JAUGE SEMI-CIRCULAIRE
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

  const color = clamped >= 80 ? "#14B8A6" : clamped >= 40 ? "#fbbf24" : "#64748b";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 220 128" className="w-full max-w-[220px]">
        <path
          d={describeArc(cx, cy, r, -90, 90)}
          fill="none"
          stroke="var(--border-app)"
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
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="30" fontWeight="800" fill="var(--text-app)">
          {clamped}%
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="11" fill="var(--text-muted)">
          {label}
        </text>
      </svg>
    </div>
  );
}

/* ============================================================
   LISTE DE PROGRESSION
============================================================ */

function ProgressList({ items }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-[var(--text-muted)]">
              <span className="flex h-4 w-4 items-center justify-center rounded-md bg-[var(--bg-surface-hover)] text-[9px] font-bold text-[var(--text-faint)]">
                {i + 1}
              </span>
              {item.label}
            </span>
            <span className={`font-bold ${item.done ? "text-mint" : "text-[var(--text-faint)]"}`}>
              {item.percent}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--bg-surface-hover)]">
            <div
              className={`h-1.5 rounded-full transition-all ${item.done ? "bg-mint" : "bg-[var(--text-faint)]"}`}
              style={{ width: `${item.percent}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   RÉSUMÉ DE L'ACTIVITÉ
============================================================ */

function ActivitySummary({ completion, breakdown, applications, pendingProposals, activeMissions, skillsCount }) {
  const kpis = [
    { label: "Candidatures", value: applications, color: "border-blue-500/25 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" },
    { label: "Missions actives", value: activeMissions, color: "border-mint/25 bg-mint/5 text-mint" },
    { label: "Propositions en attente", value: pendingProposals, color: "border-amber-500/25 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" },
    { label: "Compétences", value: skillsCount, color: "border-violet-500/25 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400" },
  ];

  const progressItems = (breakdown.length > 0 ? breakdown : []).map((item) => ({
    label: item.label,
    done: item.done,
    percent: item.done ? 100 : 0,
  }));

  return (
    <div className="rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface)] p-6 shadow-card">
      <SectionTitle
        icon={Gauge}
        title="Résumé de votre activité"
        subtitle="Vue d'ensemble de votre progression sur TalentShare."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {kpis.map((k) => (
          <span
            key={k.label}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${k.color}`}
          >
            <span className="text-sm font-bold">{k.value}</span> {k.label}
          </span>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="flex items-center justify-center rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface-2)] py-4">
          <GaugeChart percent={completion} label="Taux de complétion" />
        </div>

        <div className="rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface-2)] p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--text-faint)]">Progression</p>
          {progressItems.length > 0 ? (
            <ProgressList items={progressItems} />
          ) : (
            <p className="text-sm text-[var(--text-faint)]">Aucune donnée de progression disponible.</p>
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Building2} label="Entreprises gérées" value={stats.companies_count || 0} color="mint" />
        <StatCard icon={Layers} label="Demandes publiées" value={stats.resource_requests_open || 0} to="/resource-requests" color="violet" />
        <StatCard icon={Handshake} label="Propositions reçues" value={stats.proposals_received || 0} to="/proposals" color="blue" badge={stats.proposals_received || 0} />
        <StatCard icon={Briefcase} label="Missions actives" value={stats.active_missions || 0} to="/missions" color="amber" badge={stats.pending_missions || 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface)] p-6 shadow-card">
          <SectionTitle
            icon={Sparkles}
            title="Mon activité récente"
            subtitle="Les derniers mouvements de votre parcours."
          />
          <ul className="space-y-3">
            <ActivityItem icon={Handshake} label="Proposition reçue" status="En attente" tone="amber" time="il y a 2 h" />
            <ActivityItem icon={FileText} label="Nouvelle candidature" status="À suivre" tone="blue" time="il y a 5 h" />
            <ActivityItem icon={Briefcase} label="Mission démarrée" status="Nouveau" tone="mint" time="hier" />
          </ul>
        </div>

        <div className="rounded-xl2 bg-navy-900 p-6 text-white shadow-card">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-mint">
            <Target size={14} strokeWidth={2} /> Prochaine action
          </p>
          <h3 className="mt-3 text-xl font-bold">Publiez une nouvelle demande de ressource.</h3>
          <p className="mt-2 text-sm text-slate-300">
            Décrivez votre besoin, laissez le matching trouver les meilleurs profils pour vous.
          </p>
          <Link
            to="/resource-requests"
            className="mt-5 inline-flex items-center gap-2 rounded-xl2 bg-mint px-5 py-2.5 text-sm font-bold text-navy-900 transition hover:bg-mint-light"
          >
            <Plus size={15} strokeWidth={2} /> Créer une demande
          </Link>
        </div>
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

function TalentDashboard({ stats, user, profile, hasProfile, tab = "all" }) {
  const completion = stats.completion ?? 0;
  const nextStep = stats.completion_next_step || "Compléter votre profil";
  const breakdown = stats.completion_breakdown || [];

  const skillsCount = stats.skills_count || 0;
  const applications = stats.applications_count || 0;
  const pendingProposals = stats.proposals_pending || 0;
  const activeMissions = stats.active_missions || 0;
  const unreadMessages = stats.unread_messages ?? 0;
  const nextAvailability = stats.next_availability_label || "Non renseignée";

  const showProposals = tab === "all" || tab === "proposals";
  const showMissions = tab === "all" || tab === "missions";
  const showProfileBlocks = tab === "all";

  return (
    <div className="space-y-6">
      {showProfileBlocks && (
        <ActivitySummary
          completion={completion}
          breakdown={breakdown}
          applications={applications}
          pendingProposals={pendingProposals}
          activeMissions={activeMissions}
          skillsCount={skillsCount}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {showProposals && (
          <StatCard
            icon={Handshake}
            label="Propositions en attente"
            value={pendingProposals}
            to={pendingProposals > 0 ? "/proposals" : undefined}
            color="amber"
            badge={pendingProposals}
          />
        )}
        {showMissions && (
          <StatCard
            icon={Briefcase}
            label="Missions actives"
            value={activeMissions}
            to={activeMissions > 0 ? "/missions" : undefined}
            color="mint"
            badge={stats.pending_missions || 0}
          />
        )}
        {showProfileBlocks && (
          <>
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
          </>
        )}
      </div>

      {showProfileBlocks && (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface)] p-6 shadow-card">
              <SectionTitle
                icon={TrendingUp}
                title="Votre visibilité progresse"
                subtitle="Vues de profil et mises en relation sur 6 mois."
                action={
                  <Link
                    to="/profile"
                    className="rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface-2)] px-4 py-2 text-xs font-semibold text-[var(--text-muted)] transition hover:border-mint hover:text-mint"
                  >
                    Voir le portfolio
                  </Link>
                }
              />
              <LineChart
                data={[20, 30, 32, 28, 45, 50, 62]}
                labels={["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil"]}
              />
            </div>

            <div className="rounded-xl2 bg-navy-900 p-6 text-white shadow-card">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-mint">
                <Target size={14} strokeWidth={2} /> Prochaine action
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
                    className="h-1.5 rounded-full bg-mint transition-all"
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>
              <Link
                to="/profile"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl2 bg-mint px-5 py-2.5 text-sm font-bold text-navy-900 transition hover:bg-mint-light"
              >
                Compléter mon profil <ArrowRight size={15} strokeWidth={1.75} />
              </Link>
            </div>
          </div>

          {breakdown.length > 0 && (
            <div className="rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface)] p-6 shadow-card">
              <SectionTitle
                icon={CheckCircle2}
                title="Complétion du profil"
                subtitle="Cochez chaque étape pour atteindre 100%."
                action={
                  <span className="rounded-lg bg-mint/10 px-3 py-1 text-xs font-bold text-mint">
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
                        ? "border-mint/20 bg-mint/5"
                        : "border-[var(--border-app)] bg-[var(--bg-surface-2)]"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                        item.done
                          ? "bg-mint text-white"
                          : "border-2 border-[var(--border-app)] bg-transparent"
                      }`}
                    >
                      {item.done && <CheckCircle2 size={12} strokeWidth={2} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold ${item.done ? "text-mint" : "text-[var(--text-app)]"}`}>
                        {item.label}
                      </p>
                      {!item.done && (
                        <p className="mt-0.5 text-[10px] text-[var(--text-faint)]">{item.action}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] text-[var(--text-faint)]">{item.weight}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
        </>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface)] p-6 shadow-card">
          <SectionTitle
            icon={Sparkles}
            title="Mon activité récente"
            subtitle="Les derniers mouvements de votre parcours."
            action={
              <Link to="/missions" className="text-xs font-semibold text-mint hover:text-mint-light">
                Tout voir
              </Link>
            }
          />
          <ul className="space-y-3">
            {showProposals && (
              pendingProposals > 0 ? (
                <ActivityItem
                  icon={Handshake}
                  label={`${pendingProposals} proposition${pendingProposals > 1 ? "s" : ""} en attente`}
                  status="En attente"
                  tone="amber"
                  time="à traiter"
                  badge={pendingProposals}
                />
              ) : (
                <EmptyActivity label="Aucune proposition en attente" />
              )
            )}
            {showMissions && (
              activeMissions > 0 ? (
                <ActivityItem
                  icon={Briefcase}
                  label={`${activeMissions} mission${activeMissions > 1 ? "s" : ""} active${activeMissions > 1 ? "s" : ""}`}
                  status="En cours"
                  tone="mint"
                  time="maintenant"
                />
              ) : (
                <EmptyActivity label="Aucune mission active" />
              )
            )}
            {skillsCount > 0 ? (
              <ActivityItem
                icon={CheckCircle2}
                label={`${skillsCount} compétence${skillsCount > 1 ? "s" : ""} renseignée${skillsCount > 1 ? "s" : ""}`}
                status="À jour"
                tone="mint"
                time="profil"
              />
            ) : (
              <EmptyActivity label="Ajoutez vos premières compétences" />
            )}
          </ul>
        </div>

        <div className="rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface)] p-6 shadow-card">
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

      <div className="rounded-xl2 border border-mint/20 bg-mint/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl2 bg-mint/10 text-mint">
              <Plus size={20} strokeWidth={1.75} />
            </span>
            <div>
              <p className="font-semibold text-[var(--text-app)]">Vous avez un projet en tête ?</p>
              <p className="text-sm text-[var(--text-muted)]">
                Explorez les ressources disponibles pour trouver le bon point de départ.
              </p>
            </div>
          </div>
          <Link
            to="/explore"
            className="flex items-center gap-2 rounded-xl2 bg-mint px-5 py-2.5 text-sm font-bold text-navy-900 transition hover:bg-mint-light"
          >
            Explorer le réseau <ArrowRight size={15} strokeWidth={1.75} />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PETITS WIDGETS
============================================================ */

function MiniWidget({ icon: Icon, color, label, value, action }) {
  const colorMap = {
    mint:  { bg: "bg-mint/10",        text: "text-mint" },
    blue:  { bg: "bg-blue-500/10",    text: "text-blue-600 dark:text-blue-400" },
    amber: { bg: "bg-amber-500/10",   text: "text-amber-600 dark:text-amber-400" },
  };
  const c = colorMap[color] || colorMap.mint;

  return (
    <div className="flex flex-col justify-between rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface)] p-5 shadow-card">
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl2 ${c.bg} ${c.text}`}>
          <Icon size={16} strokeWidth={1.5} />
        </span>
        <p className="text-sm text-[var(--text-muted)]">{label}</p>
      </div>
      <p className="mt-3 truncate text-xl font-bold text-[var(--text-app)]">{value}</p>
      {action && (
        <Link
          to={action.to}
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-mint hover:text-mint-light"
        >
          {action.label} <ArrowRight size={12} strokeWidth={2} />
        </Link>
      )}
    </div>
  );
}

function QuickActions({ actions }) {
  return (
    <div className="rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface)] p-6 shadow-card">
      <SectionTitle icon={Zap} title="Raccourcis rapides" subtitle="Les actions les plus utiles, en un clic." />
      <div className="grid gap-3 sm:grid-cols-3">
        {actions.map(({ icon: Icon, label, to }) => (
          <Link
            key={label}
            to={to}
            className="flex items-center gap-3 rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface-2)] p-3.5 transition hover:border-mint/40 hover:bg-[var(--bg-surface-hover)]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl2 bg-mint/10 text-mint">
              <Icon size={16} strokeWidth={1.5} />
            </span>
            <span className="text-sm font-semibold text-[var(--text-app)]">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   DASHBOARD UNIVERSITÉ
============================================================ */

function UniversityDashboard({ stats, user }) {
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

function ActivityItem({ icon: Icon, label, status, tone = "mint", time, badge = 0 }) {
  const toneMap = {
    mint:    "bg-mint/10 text-mint border-mint/25",
    amber:   "bg-amber-50 text-amber-700 border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400",
    blue:    "bg-blue-50 text-blue-700 border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-400",
    rose:    "bg-rose-50 text-rose-700 border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400",
  };
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface-2)] p-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl2 bg-mint/10 text-mint">
          <Icon size={16} strokeWidth={1.5} />
          {badge > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-md bg-mint px-1 text-[9px] font-bold text-navy-900">
              {badge}
            </span>
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--text-app)]">{label}</p>
          <p className="text-xs text-[var(--text-faint)]">{time}</p>
        </div>
      </div>
      <span className={`shrink-0 rounded-md border px-2.5 py-0.5 text-[10px] font-bold uppercase ${toneMap[tone]}`}>
        {status}
      </span>
    </li>
  );
}

function EmptyActivity({ label }) {
  return (
    <li className="flex items-center gap-3 rounded-xl2 border border-dashed border-[var(--border-app)] bg-[var(--bg-surface-2)] p-3 text-sm text-[var(--text-faint)]">
      <Circle size={16} strokeWidth={1.5} className="text-[var(--text-faint)]" />
      {label}
    </li>
  );
}

function OpportunityItem({ icon: Icon, title, company, match, to }) {
  return (
    <li>
      <Link
        to={to}
        className="flex items-center justify-between gap-3 rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface-2)] p-3 transition hover:border-mint/40 hover:bg-[var(--bg-surface-hover)]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl2 bg-mint/10 text-mint">
            <Icon size={16} strokeWidth={1.5} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--text-app)]">{title}</p>
            <p className="text-xs text-[var(--text-faint)]">{company}</p>
          </div>
        </div>
        <span className="shrink-0 text-xs font-bold text-mint">{match}</span>
      </Link>
    </li>
  );
}
