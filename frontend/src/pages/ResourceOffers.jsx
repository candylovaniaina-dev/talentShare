import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus, Search, Edit3, Trash2, Calendar, Clock, MapPin, Inbox, Briefcase,
  Globe, Lock, Building2, Handshake, Send, Eye, LayoutGrid, Rows3,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import api from "../services/api";
import {
  MISSION_TYPES, LOCATION_LABELS, VISIBILITY, OFFER_STATUS, Avatar, Spinner,
  fmtDate, durationLabel, workloadLabel, apiError,
} from "../components/resource-sharing/shared";

/* ───────────────────────── Styles (police + animations) ───────────────────────── */
const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
.ts-font{font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif}
@keyframes ts-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.ts-rise{animation:ts-rise .4s ease both}
@keyframes ts-bar{from{width:0}}
.ts-bar{animation:ts-bar .9s ease both}
`;

/* ───────────────────────── Config ───────────────────────── */
const TABS = [
  { key: "all", label: "Toutes", match: () => true },
  { key: "published", label: "Publiées", match: (o) => o.display_status === "published" },
  { key: "draft", label: "Brouillons", match: (o) => o.display_status === "draft" },
  { key: "mission", label: "En mission", match: (o) => String(o.display_status).startsWith("mission_") },
  { key: "closed", label: "Clôturées", match: (o) => ["closed", "expired"].includes(o.display_status) },
];

const SORTS = [
  { key: "recent", label: "Plus récentes" },
  { key: "proposals", label: "Plus de propositions" },
  { key: "start", label: "Date de début" },
];

const TONES = {
  published: {
    label: "Publiée",
    pill: "bg-[#16B8B1]/12 text-[#0E8F8A] dark:text-[#5EE0DA]",
    dot: "bg-[#16B8B1]",
    bar: "from-[#16B8B1] to-[#3478E8]",
  },
  draft: {
    label: "Brouillon",
    pill: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
    dot: "bg-slate-400",
    bar: "from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-500",
  },
  mission: {
    label: "En mission",
    pill: "bg-[#3478E8]/12 text-[#2A62C4] dark:text-[#8DB4F5]",
    dot: "bg-[#3478E8]",
    bar: "from-[#3478E8] to-[#16B8B1]",
  },
  closed: {
    label: "Clôturée",
    pill: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400",
    dot: "bg-slate-400",
    bar: "from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-500",
  },
  expired: {
    label: "Expirée",
    pill: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    dot: "bg-amber-500",
    bar: "from-amber-300 to-amber-500",
  },
};

const toneOf = (key) => {
  const k = String(key);
  const base = k.startsWith("mission_") ? TONES.mission : TONES[k] || TONES.draft;
  const label = OFFER_STATUS?.[k]?.label || base.label;
  return { ...base, label };
};

function timeline(o) {
  const s = new Date(o.start_at);
  const e = new Date(o.end_at);
  const n = new Date();
  if (isNaN(s) || isNaN(e)) return null;
  const day = 864e5;
  const pct = Math.min(100, Math.max(0, ((n - s) / Math.max(e - s, 1)) * 100));
  if (n < s) return { pct: 0, label: `Débute dans ${Math.ceil((s - n) / day)} j`, state: "upcoming" };
  if (n > e) return { pct: 100, label: "Période terminée", state: "past" };
  return { pct, label: `${Math.max(0, Math.ceil((e - n) / day))} j restants`, state: "live" };
}

const card = "rounded-2xl border border-slate-200/70 bg-white dark:border-white/10 dark:bg-[#0F2A40]";
const btnMain = "inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#16B8B1] px-3.5 py-2 text-xs font-bold text-[#0B2235] transition hover:bg-[#2BD0C9] disabled:opacity-50";
const btnSoft = "inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-[#16B8B1] hover:text-[#0E8F8A] disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:text-[#5EE0DA]";

/* ───────────────────────── Sous-composants ───────────────────────── */
function Kpi({ label, value, hint, hot }) {
  return (
    <div className="relative px-5 py-4">
      <div className="flex items-center gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300/70">{label}</p>
        {hot && (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
          </span>
        )}
      </div>
      <p className={`mt-1.5 text-3xl font-extrabold tracking-tight ${hot ? "text-amber-300" : "text-white"}`}>{value}</p>
      <p className="mt-0.5 text-[11px] text-slate-300/60">{hint}</p>
    </div>
  );
}

function OfferCard({ o, idx, busy, onStatus, onRemove, navigate }) {
  const key = o.display_status || o.status;
  const tone = toneOf(key);
  const hasMission = String(key).startsWith("mission_");
  const vis = VISIBILITY[o.visibility || "public"];
  const VisIcon = o.visibility === "private" ? Lock : o.visibility === "companies" ? Building2 : Globe;
  const tl = timeline(o);
  const pending = o.pending_proposals_count || 0;
  const skills = o.skills || [];
  const open = () => navigate(`/resource-offers/${o.id}`);

  return (
    <article
      style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}
      className={`${card} ts-rise group relative flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#0B2235]/10`}
    >
      <span className={`h-1 w-full bg-gradient-to-r ${tone.bar}`} />

      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Statut + visibilité */}
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${tone.pill}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} /> {tone.label}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
            <VisIcon size={12} /> {vis?.label}
          </span>
        </div>

        {/* Salarié + tarif */}
        <div className="flex cursor-pointer items-center gap-3" onClick={open}>
          <Avatar name={o.profile?.user?.name} path={o.profile?.avatar_path} size={46} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{o.profile?.user?.name || "Salarié"}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{o.profile?.headline || "—"}</p>
          </div>
          <div className="text-right">
            {o.daily_rate ? (
              <>
                <p className="text-lg font-extrabold leading-none text-[#0E8F8A] dark:text-[#5EE0DA]">{o.daily_rate} €</p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-400">par jour</p>
              </>
            ) : (
              <p className="text-[11px] font-semibold text-slate-400">Tarif à discuter</p>
            )}
          </div>
        </div>

        {/* Titre */}
        <h3 onClick={open} className="line-clamp-2 min-h-[2.5rem] cursor-pointer text-[15px] font-bold leading-5 text-[#0B2235] transition group-hover:text-[#0E8F8A] dark:text-white dark:group-hover:text-[#5EE0DA]">
          {o.title}
        </h3>

        {/* Frise de disponibilité */}
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-[#0B2235]">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5"><Calendar size={12} className="text-slate-400" /> {fmtDate(o.start_at)}</span>
            <span className="text-slate-400">{durationLabel(o.start_at, o.end_at)}</span>
            <span>{fmtDate(o.end_at)}</span>
          </div>
          <div className="relative mt-2.5 h-1.5 rounded-full bg-slate-200 dark:bg-white/10">
            {tl && (
              <>
                <div className="ts-bar h-full rounded-full bg-gradient-to-r from-[#16B8B1] to-[#3478E8]" style={{ width: `${tl.pct}%` }} />
                {tl.state === "live" && (
                  <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#3478E8] shadow dark:border-[#0B2235]" style={{ left: `${tl.pct}%` }} />
                )}
              </>
            )}
          </div>
          {tl && <p className="mt-2 text-[11px] font-bold text-[#0E8F8A] dark:text-[#5EE0DA]">{tl.label}</p>}
        </div>

        {/* Puces */}
        <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#3478E8]/10 px-2 py-1 text-[#2A62C4] dark:text-[#8DB4F5]">
            <Briefcase size={11} /> {MISSION_TYPES[o.mission_type] || o.mission_type}
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-slate-600 dark:bg-white/10 dark:text-slate-300">
            <Clock size={11} /> {workloadLabel(o.workload_value, o.workload_unit)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-slate-600 dark:bg-white/10 dark:text-slate-300">
            <MapPin size={11} /> {LOCATION_LABELS[o.location_type] || "—"}{o.location_city ? ` · ${o.location_city}` : ""}
          </span>
        </div>

        {/* Compétences */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skills.slice(0, 4).map((s) => (
              <span key={s.id} className="rounded-md border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-white/10 dark:text-slate-300">{s.name}</span>
            ))}
            {skills.length > 4 && <span className="px-1 py-0.5 text-[11px] font-semibold text-slate-400">+{skills.length - 4}</span>}
          </div>
        )}
      </div>

      {/* Pied de carte */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3.5 dark:border-white/10">
        <Link
          to={`/resource-offers/${o.id}?tab=proposals`}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${pending > 0
            ? "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-300"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300"}`}
        >
          <Inbox size={13} /> {o.proposals_count || 0} proposition{(o.proposals_count || 0) > 1 ? "s" : ""}
          {pending > 0 && <span className="rounded-full bg-amber-500 px-1.5 text-[10px] text-white">{pending} à traiter</span>}
        </Link>

        <div className="flex items-center gap-1.5">
          {o.status === "published" && (
            <span className="mr-1 inline-flex items-center gap-1 text-[11px] font-medium text-slate-400"><Eye size={12} /> {o.views_count || 0}</span>
          )}
          {o.active_mission && (
            <Link to={`/missions/${o.active_mission.id}`} className={btnSoft}>Voir la mission</Link>
          )}
          {!hasMission && (
            <>
              {o.status === "published" ? (
                <button disabled={busy} onClick={() => onStatus(o, "closed")} className={btnSoft}>Clôturer</button>
              ) : (
                <button disabled={busy} onClick={() => onStatus(o, "published")} className={btnMain}><Send size={12} /> Publier</button>
              )}
              <Link to={`/resource-offers/${o.id}/edit`} title="Modifier" className={`${btnSoft} !px-2.5`}><Edit3 size={13} /></Link>
              <button disabled={busy} onClick={() => onRemove(o)} title="Supprimer" className={`${btnSoft} !px-2.5 hover:!border-rose-300 hover:!text-rose-600`}>
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

/* ───────────────────────── Page ───────────────────────── */
export default function ResourceOffers() {
  const navigate = useNavigate();
  const { toast, show, close } = useToast();
  const [data, setData] = useState({ has_company: true, offers: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [cols, setCols] = useState(2);
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
    const list = offers.filter((o) => tabCfg.match(o) && (!q ||
      `${o.title} ${o.profile?.user?.name || ""} ${o.location_city || ""}`.toLowerCase().includes(q)));
    const sorted = [...list];
    if (sort === "proposals") sorted.sort((a, b) => (b.proposals_count || 0) - (a.proposals_count || 0));
    else if (sort === "start") sorted.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
    else sorted.sort((a, b) => b.id - a.id);
    return sorted;
  }, [offers, tab, search, sort]);

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
        <style>{FONT_CSS}</style>
        <div className="ts-font mx-auto max-w-md px-4 py-20 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#16B8B1]/15 text-[#16B8B1]"><Building2 size={24} /></div>
          <h2 className="mt-5 text-lg font-extrabold text-[#0B2235] dark:text-white">Créez d'abord votre entreprise</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Pour partager un salarié, votre entreprise doit exister sur la plateforme.</p>
          <Link to="/company" className={`${btnMain} mt-6 !px-5 !py-2.5`}>Créer mon entreprise</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <style>{FONT_CSS}</style>
      <div className="ts-font mx-auto max-w-[1200px] space-y-6 px-3 pb-12 pt-5 sm:px-5 lg:px-8">

        {/* En-tête compact */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
          
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/resource-offers/browse" className={btnSoft}><Search size={14} /> Parcourir</Link>
            <Link to="/resource-proposals" className={btnSoft}><Handshake size={14} /> Propositions</Link>
           
          </div>
        </div>

        {/* Bandeau d'indicateurs */}
        <section className="grid grid-cols-2 divide-white/10 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B2235] via-[#0E2B42] to-[#163650] shadow-lg shadow-[#0B2235]/20 lg:grid-cols-4 lg:divide-x">
          <Kpi label="Publiées" value={stats.published} hint="visibles par les entreprises" />
          <Kpi label="Brouillons" value={stats.drafts} hint="à finaliser" />
          <Kpi label="À traiter" value={stats.pending} hint="propositions en attente" hot={stats.pending > 0} />
          <Kpi label="En mission" value={stats.missions} hint="collaborations actives" />
        </section>

        {/* Barre d'outils */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex max-w-full overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-white/5">
            {TABS.map((t) => {
              const n = offers.filter(t.match).length;
              const on = tab === t.key;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${on
                    ? "bg-white text-[#0B2235] shadow-sm dark:bg-[#163650] dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}>
                  {t.label} <span className={on ? "text-[#16B8B1]" : "opacity-60"}>{n}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1 lg:w-64 lg:flex-none">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs text-slate-900 outline-none transition focus:border-[#16B8B1] focus:ring-4 focus:ring-[#16B8B1]/15 dark:border-white/10 dark:bg-[#0F2A40] dark:text-white" />
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 outline-none focus:border-[#16B8B1] dark:border-white/10 dark:bg-[#0F2A40] dark:text-slate-300">
              {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <div className="hidden rounded-xl border border-slate-200 p-1 dark:border-white/10 md:flex">
              <button onClick={() => setCols(2)} title="2 colonnes" className={`rounded-lg p-1.5 transition ${cols === 2 ? "bg-[#16B8B1] text-[#0B2235]" : "text-slate-400 hover:text-slate-700"}`}><LayoutGrid size={14} /></button>
              <button onClick={() => setCols(1)} title="1 colonne" className={`rounded-lg p-1.5 transition ${cols === 1 ? "bg-[#16B8B1] text-[#0B2235]" : "text-slate-400 hover:text-slate-700"}`}><Rows3 size={14} /></button>
            </div>
          </div>
        </div>

        {/* Liste */}
        {visible.length === 0 ? (
          <div className="ts-rise flex flex-col items-center rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center dark:border-white/15">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#16B8B1]/12 text-[#16B8B1]"><Handshake size={24} /></div>
            <h3 className="mt-4 text-base font-bold text-[#0B2235] dark:text-white">
              {offers.length === 0 ? "Aucune offre pour l'instant" : "Aucun résultat"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {offers.length === 0
                ? "Prêtez un salarié disponible à une entreprise qui a besoin de ses compétences."
                : "Essayez un autre filtre ou une autre recherche."}
            </p>
            {offers.length === 0 && (
              <Link to="/resource-offers/new" className={`${btnMain} mt-5 !px-5 !py-2.5`}><Plus size={14} /> Créer ma première offre</Link>
            )}
          </div>
        ) : (
          <div className={`grid gap-4 ${cols === 2 ? "md:grid-cols-2" : "grid-cols-1"}`}>
            {visible.map((o, i) => (
              <OfferCard key={o.id} o={o} idx={i} busy={busyId === o.id}
                onStatus={changeStatus} onRemove={remove} navigate={navigate} />
            ))}
          </div>
        )}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={close} />}
    </AppShell>
  );
}