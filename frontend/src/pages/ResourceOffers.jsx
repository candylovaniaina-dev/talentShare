import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus, Search, Edit3, Trash2, Calendar, Clock, MapPin, Inbox, Briefcase,
  Globe, Lock, Building2, Handshake, Send, Eye,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import api from "../services/api";
import {
  MISSION_TYPES, LOCATION_LABELS, VISIBILITY, OFFER_STATUS, StatusBadge, Badge, Avatar,
  MetaChip, SkillChips, EmptyState, Spinner, fmtDate, durationLabel, workloadLabel, apiError,
  cardCls, btnPrimary, btnGhost, inputCls,
} from "../components/resource-sharing/shared";

const TABS = [
  { key: "all", label: "Toutes", match: () => true },
  { key: "published", label: "Publiées", match: (o) => o.display_status === "published" },
  { key: "draft", label: "Brouillons", match: (o) => o.display_status === "draft" },
  { key: "mission", label: "En mission", match: (o) => String(o.display_status).startsWith("mission_") },
  { key: "closed", label: "Clôturées", match: (o) => ["closed", "expired"].includes(o.display_status) },
];

export default function ResourceOffers() {
  const navigate = useNavigate();
  const { toast, show, close } = useToast();
  const [data, setData] = useState({ has_company: true, offers: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = () =>
    api.get("/resource-sharing/mine")
      .then((r) => setData(r.data))
      .catch(() => setData({ has_company: true, offers: [] }))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const offers = data.offers || [];

  const stats = useMemo(() => ({
    published: offers.filter((o) => o.display_status === "published").length,
    drafts: offers.filter((o) => o.display_status === "draft").length,
    pending: offers.reduce((n, o) => n + (o.pending_proposals_count || 0), 0),
    missions: offers.filter((o) => String(o.display_status).startsWith("mission_")).length,
  }), [offers]);

  const visible = useMemo(() => {
    const tabCfg = TABS.find((t) => t.key === tab) || TABS[0];
    const q = search.trim().toLowerCase();
    return offers.filter((o) => tabCfg.match(o) && (!q ||
      `${o.title} ${o.profile?.user?.name || ""} ${o.location_city || ""}`.toLowerCase().includes(q)));
  }, [offers, tab, search]);

  const changeStatus = async (offer, status) => {
    setBusyId(offer.id);
    try {
      await api.patch(`/resource-sharing/${offer.id}/status`, { status });
      show(status === "published" ? "✅ Offre publiée" : status === "closed" ? "Offre clôturée" : "Offre repassée en brouillon", "success");
      await load();
    } catch (e) { show(apiError(e), "error"); }
    finally { setBusyId(null); }
  };

  const remove = async (offer) => {
    if (!window.confirm(`Supprimer l'offre « ${offer.title} » ?`)) return;
    setBusyId(offer.id);
    try {
      await api.delete(`/resource-sharing/${offer.id}`);
      show("Offre supprimée", "success");
      await load();
    } catch (e) { show(apiError(e), "error"); }
    finally { setBusyId(null); }
  };

  if (loading) return <AppShell><Spinner /></AppShell>;

  if (!data.has_company) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl px-4 py-16">
          <EmptyState
            title="Créez d'abord votre entreprise"
            text="Pour partager un salarié, votre entreprise doit exister sur la plateforme."
            action={<Link to="/company" className={btnPrimary}>Créer mon entreprise</Link>}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[1100px] space-y-5 px-3 pb-10 pt-5 sm:px-5 lg:px-8">
        {/* Hero */}
        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B3B3A] via-[#0E4B47] to-[#0B253B] p-6 text-white shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Partage de ressources</h1>
              <p className="mt-1 max-w-xl text-sm text-emerald-100/80">
                Déclarez vos salariés disponibles, laissez d'autres entreprises les découvrir et suivez les propositions reçues.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/resource-offers/browse" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20">
                <Search size={15} /> Parcourir les offres
              </Link>
              <Link to="/resource-proposals" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20">
                <Handshake size={15} /> Propositions
              </Link>
              <Link to="/resource-offers/new" className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-bold text-[#06251F] transition hover:bg-emerald-300">
                <Plus size={15} /> Prêter un salarié
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Offres publiées", value: stats.published, icon: Globe },
            { label: "Brouillons", value: stats.drafts, icon: Edit3 },
            { label: "Propositions en attente", value: stats.pending, icon: Inbox, hot: stats.pending > 0 },
            { label: "Missions liées", value: stats.missions, icon: Briefcase },
          ].map((s) => (
            <div key={s.label} className={`${cardCls} flex items-center gap-3 p-4`}>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.hot ? "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"}`}>
                <s.icon size={18} />
              </div>
              <div>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((t) => {
              const n = offers.filter(t.match).length;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${tab === t.key
                    ? "bg-[#0B253B] text-white dark:bg-emerald-500 dark:text-[#06251F]"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"}`}>
                  {t.label} <span className="opacity-60">{n}</span>
                </button>
              );
            })}
          </div>
          <div className="relative sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une offre..." className={`${inputCls} pl-9`} />
          </div>
        </div>

        {/* Liste */}
        {visible.length === 0 ? (
          <EmptyState
            title={offers.length === 0 ? "Aucune offre pour l'instant" : "Aucun résultat"}
            text={offers.length === 0 ? "Prêtez un salarié disponible à une entreprise qui a besoin de ses compétences." : "Essayez un autre filtre."}
            action={offers.length === 0 && <Link to="/resource-offers/new" className={btnPrimary}><Plus size={15} /> Créer ma première offre</Link>}
          />
        ) : (
          <div className="space-y-3">
            {visible.map((o) => {
              const key = o.display_status || o.status;
              const cfg = OFFER_STATUS[key] || OFFER_STATUS.draft;
              const hasMission = String(key).startsWith("mission_");
              const vis = VISIBILITY[o.visibility || "public"];
              return (
                <article key={o.id} className={`${cardCls} relative overflow-hidden transition hover:shadow-md`}>
                  <span className={`absolute inset-y-0 left-0 w-1 ${cfg.bar}`} />
                  <div className="flex flex-col gap-4 p-5 pl-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/resource-offers/${o.id}`)}>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 hover:underline dark:text-white">{o.title}</h3>
                        <StatusBadge map={OFFER_STATUS} status={key} />
                        <Badge cls="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{MISSION_TYPES[o.mission_type] || o.mission_type}</Badge>
                        <Badge cls="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {o.visibility === "private" ? <Lock size={10} /> : o.visibility === "companies" ? <Building2 size={10} /> : <Globe size={10} />} {vis?.label}
                        </Badge>
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <Avatar name={o.profile?.user?.name} path={o.profile?.avatar_path} size={38} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{o.profile?.user?.name || "Salarié"}</p>
                          {o.profile?.headline && <p className="truncate text-xs text-emerald-600 dark:text-emerald-400">{o.profile.headline}</p>}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                        <MetaChip icon={Calendar}>{fmtDate(o.start_at)} → {fmtDate(o.end_at)} · {durationLabel(o.start_at, o.end_at)}</MetaChip>
                        <MetaChip icon={Clock}>{workloadLabel(o.workload_value, o.workload_unit)}</MetaChip>
                        <MetaChip icon={MapPin}>{LOCATION_LABELS[o.location_type] || "—"}{o.location_city ? ` · ${o.location_city}` : ""}</MetaChip>
                        {o.daily_rate ? <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{o.daily_rate} € / jour</span> : null}
                      </div>

                      <div className="mt-3"><SkillChips skills={o.skills} /></div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 lg:items-end">
                      <Link to={`/resource-offers/${o.id}?tab=proposals`}
                        className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${o.pending_proposals_count > 0
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-300"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}>
                        <Inbox size={14} />
                        {o.proposals_count || 0} proposition{(o.proposals_count || 0) > 1 ? "s" : ""}
                        {o.pending_proposals_count > 0 && <span className="rounded-full bg-amber-500 px-1.5 text-[10px] text-white">{o.pending_proposals_count} à traiter</span>}
                      </Link>

                      {o.active_mission && (
                        <Link to={`/missions/${o.active_mission.id}`} className={btnGhost}><Briefcase size={14} /> Voir la mission</Link>
                      )}

                      {!hasMission && (
                        <div className="flex flex-wrap gap-2">
                          {o.status === "published" ? (
                            <button disabled={busyId === o.id} onClick={() => changeStatus(o, "closed")} className={btnGhost}>Clôturer</button>
                          ) : (
                            <button disabled={busyId === o.id} onClick={() => changeStatus(o, "published")} className={btnPrimary}><Send size={13} /> Publier</button>
                          )}
                          <Link to={`/resource-offers/${o.id}/edit`} title="Modifier" className={btnGhost}><Edit3 size={14} /></Link>
                          <button disabled={busyId === o.id} onClick={() => remove(o)} title="Supprimer"
                            className="inline-flex items-center rounded-xl border border-slate-200 px-3 text-slate-500 transition hover:border-rose-300 hover:text-rose-600 dark:border-slate-700">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                      {o.status === "published" && (
                        <Link to={`/resource-offers/${o.id}`} className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-emerald-600">
                          <Eye size={12} /> {o.views_count || 0} vue{(o.views_count || 0) > 1 ? "s" : ""}
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={close} />}
    </AppShell>
  );
}