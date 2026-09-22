import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase, Users, FileText, Handshake, User, Layers, Building2,
  ArrowRight, AlertCircle, ArrowRightCircle,
} from "lucide-react";
import AppShell from "../../components/layout/AppShell";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    api.get("/dashboard")
      .then((res) => setStats(res.data))
      .catch(() => setError("Impossible de charger le tableau de bord."));

    api.get("/profile/me")
      .then(() => setHasProfile(true))
      .catch(() => setHasProfile(false));
  }, []);

  return (
    <AppShell>
      <h1 className="text-2xl font-bold">Tableau de bord</h1>
      <p className="mt-1 text-sm text-slate-500">
        Vue d'ensemble de votre activité sur TalentShare.
      </p>

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {!stats && !error && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      )}

      {/* ✅ Bandeau d'action (si missions en attente) */}
      {stats?.pending_missions > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">
                {stats.pending_missions} mission{stats.pending_missions > 1 ? "s" : ""} en attente d'action
              </p>
              <p className="text-xs text-amber-700">
                Accepter ou démarrer les missions en cours.
              </p>
            </div>
          </div>
          <Link
            to="/missions"
            className="flex items-center gap-1.5 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition"
          >
            Voir les missions <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {stats && user?.role === "company" && <CompanyStats stats={stats} />}
      {stats && (user?.role === "employee" || user?.role === "student") && (
        <TalentStats stats={stats} hasProfile={hasProfile} />
      )}
      {stats && user?.role === "university" && <UniversityStats stats={stats} />}
      {stats && user?.role === "admin" && <AdminStats stats={stats} />}
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value, accent, to }) {
  const Wrapper = to ? Link : "div";
  const wrapperProps = to ? { to } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`block rounded-2xl border border-slate-200 bg-white p-5 transition ${to ? "hover:shadow-md hover:border-navy cursor-pointer" : ""}`}
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent ? "bg-mint/15 text-navy" : "bg-slate-100 text-slate-500"}`}>
        <Icon size={18} />
      </span>
      <p className="mt-4 text-2xl font-bold">{value}</p>
      <p className="text-sm text-slate-500 flex items-center gap-1">
        {label}
        {to && <ArrowRightCircle size={12} className="text-slate-300" />}
      </p>
    </Wrapper>
  );
}

function CompanyStats({ stats }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={Building2} label="Entreprises gérées" value={stats.companies_count || 0} accent />
      <StatCard icon={Layers} label="Demandes publiées" value={stats.resource_requests_open || 0} to="/resource-requests" />
      <StatCard icon={Handshake} label="Propositions reçues" value={stats.proposals_received || 0} to="/proposals" />
      <StatCard icon={Briefcase} label="Missions actives" value={stats.active_missions || 0} to="/missions" />
      {stats.pending_missions > 0 && (
        <StatCard
          icon={AlertCircle}
          label="Missions en attente"
          value={stats.pending_missions}
          to="/missions"
          accent
        />
      )}
      <StatCard icon={FileText} label="Offres d'emploi ouvertes" value={stats.job_offers_open || 0} to="/job-offers" />
    </div>
  );
}

function TalentStats({ stats, hasProfile }) {
  const pendingProposals = stats.proposals_pending || 0;

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={User} label="Profil complété" value={hasProfile ? "✅ Oui" : "❌ Non"} accent />
      <StatCard icon={Layers} label="Compétences renseignées" value={stats.skills_count || 0} />
      <StatCard icon={FileText} label="Candidatures envoyées" value={stats.applications_count || 0} />
      <StatCard
        icon={Handshake}
        label="Propositions en attente"
        value={pendingProposals}
        to={pendingProposals > 0 ? "/proposals" : undefined}
      />
      <StatCard
        icon={Briefcase}
        label="Missions actives"
        value={stats.active_missions || 0}
        to="/missions"
      />
      {stats.pending_missions > 0 && (
        <StatCard
          icon={AlertCircle}
          label="Missions en attente"
          value={stats.pending_missions}
          to="/missions"
          accent
        />
      )}

     

      {!hasProfile && (
        <div className="col-span-full rounded-2xl border border-mint/30 bg-mint/10 p-5">
          <p className="font-semibold">Complétez votre profil pour être visible.</p>
          <Link to="/profile" className="mt-2 inline-block text-sm font-semibold text-navy underline">
            Créer mon profil professionnel →
          </Link>
        </div>
      )}
    </div>
  );
}

function UniversityStats({ stats }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={Building2} label="Universités gérées" value={stats.universities_count || 0} accent />
    </div>
  );
}

function AdminStats({ stats }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={Users} label="Utilisateurs" value={stats.users_count || 0} accent />
      <StatCard icon={Building2} label="Entreprises" value={stats.companies_count || 0} />
      <StatCard icon={Building2} label="Universités" value={stats.universities_count || 0} />
      <StatCard icon={Briefcase} label="Missions" value={stats.missions_count || 0} to="/missions" />
      <StatCard icon={FileText} label="Vérifications en attente" value={stats.pending_verifications || 0} />
    </div>
  );
}