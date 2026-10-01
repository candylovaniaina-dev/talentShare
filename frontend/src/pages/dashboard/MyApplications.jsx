import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase, Clock, Eye, Check, X, Calendar,
  Loader2, FileText, Building2, UserCheck, Video,
  ChevronRight, Plus,
} from "lucide-react";
import AppShell from "../../components/layout/AppShell";
import api from "../../services/api";

const STATUS_CFG = {
  sent:        { label: "Envoyée",        icon: Clock,     color: "text-slate-600",   bg: "bg-slate-100",   border: "border-slate-200" },
  viewed:      { label: "Consultée",      icon: Eye,       color: "text-blue-700",    bg: "bg-blue-100",    border: "border-blue-200" },
  shortlisted: { label: "Présélectionnée", icon: UserCheck, color: "text-violet-700",  bg: "bg-violet-100",  border: "border-violet-200" },
  interview:   { label: "Entretien",      icon: Video,     color: "text-amber-700",   bg: "bg-amber-100",   border: "border-amber-200" },
  accepted:    { label: "Acceptée",       icon: Check,     color: "text-emerald-700", bg: "bg-emerald-100", border: "border-emerald-200" },
  rejected:    { label: "Refusée",        icon: X,         color: "text-rose-700",    bg: "bg-rose-100",    border: "border-rose-200" },
};

const FILTERS = [
  { key: "all",         label: "Toutes" },
  { key: "sent",        label: "Envoyées" },
  { key: "viewed",      label: "Consultées" },
  { key: "shortlisted", label: "Présélectionnées" },
  { key: "interview",   label: "Entretiens" },
  { key: "accepted",    label: "Acceptées" },
  { key: "rejected",    label: "Refusées" },
];

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const [appsRes, statsRes] = await Promise.all([
        api.get("/applications"),
        api.get("/applications/stats"),
      ]);
      setApplications(appsRes.data || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "all"
    ? applications
    : applications.filter((a) => a.status === filter);

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Mes candidatures</h1>
          <p className="mt-1 text-sm text-slate-500">
            Suivez l'état de vos candidatures en temps réel.
          </p>
        </div>

        {/* Stats */}
        {stats && stats.total > 0 && (
          <div className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { key: "total",       label: "Total",           color: "text-slate-900" },
              { key: "sent",        label: "Envoyées",        color: "text-slate-600" },
              { key: "viewed",      label: "Consultées",      color: "text-blue-600" },
              { key: "shortlisted", label: "Présélectionnées", color: "text-violet-600" },
              { key: "interview",   label: "Entretiens",      color: "text-amber-600" },
              { key: "accepted",    label: "Acceptées",       color: "text-emerald-600" },
            ].map((s) => (
              <div key={s.key} className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{s.label}</p>
                <p className={`mt-1 text-2xl font-bold ${s.color}`}>{stats[s.key] || 0}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filtres */}
        <div className="mb-4 flex flex-wrap gap-2 overflow-x-auto">
          {FILTERS.map((f) => {
            const count = f.key === "all"
              ? applications.length
              : applications.filter((a) => a.status === f.key).length;
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                }`}
              >
                {f.label}
                {count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <Briefcase size={40} className="mx-auto text-slate-300" />
            <p className="mt-3 font-semibold text-slate-600">
              {filter === "all" ? "Aucune candidature pour l'instant" : "Aucune candidature dans cette catégorie"}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Parcourez les opportunités et postulez !
            </p>
            <Link
              to="/opportunites"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              <Plus size={14} /> Voir les opportunités
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((app) => {
              const cfg = STATUS_CFG[app.status] || STATUS_CFG.sent;
              const Icon = cfg.icon;
              return (
                <Link
                  key={app.id}
                  to={`/applications/${app.id}`}
                  className="group block rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-400 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      {/* Statut */}
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cfg.bg} ${cfg.color}`}>
                          <Icon size={11} /> {cfg.label}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(app.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>

                      {/* Titre + entreprise */}
                      <h3 className="text-base font-bold text-slate-900">
                        {app.job_offer?.title || "Offre supprimée"}
                      </h3>
                      {app.job_offer?.company && (
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                          <Building2 size={13} /> {app.job_offer.company.name}
                          {app.job_offer.city && <span className="text-slate-400"> · {app.job_offer.city}</span>}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                        {app.portfolio && (
                          <span className="flex items-center gap-1">
                            <Briefcase size={11} /> Portfolio joint
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <FileText size={11} /> CV joint
                        </span>
                      </div>
                    </div>

                    <ChevronRight size={18} className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-500" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}