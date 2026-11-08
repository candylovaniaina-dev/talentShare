import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Clock, Eye, Check, X, UserCheck, Video, Briefcase, FileText,
  ExternalLink, Calendar, Mail, AlertCircle, Inbox, RefreshCw, Search,
  LayoutGrid, List as ListIcon, GripVertical, ChevronRight, Users, Building2,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import ScheduleInterviewModal from "../components/ScheduleInterviewModal";
import { ConfirmDialog, initials } from "../components/publications/PublicationsUI";
import api from "../services/api";

/* ============================================
   Configuration des statuts
============================================ */
const ORDER = ["sent", "viewed", "shortlisted", "interview", "accepted", "rejected"];
const STEPS = ["sent", "viewed", "shortlisted", "interview", "accepted"];
const CLOSED = ["accepted", "rejected"];

const STATUS = {
  sent:        { label: "Envoyée",         plural: "Nouvelles",        icon: Clock,     step: 1, dot: "bg-slate-400",  bar: "bg-slate-300",  pill: "bg-slate-100 text-slate-700 ring-slate-200" },
  viewed:      { label: "Consultée",       plural: "Consultées",       icon: Eye,       step: 2, dot: "bg-sky-500",    bar: "bg-sky-400",    pill: "bg-sky-50 text-sky-800 ring-sky-200" },
  shortlisted: { label: "Présélectionnée", plural: "Présélectionnées", icon: UserCheck, step: 3, dot: "bg-violet-500", bar: "bg-violet-400", pill: "bg-violet-50 text-violet-800 ring-violet-200" },
  interview:   { label: "Entretien",       plural: "Entretiens",       icon: Video,     step: 4, dot: "bg-amber-500",  bar: "bg-amber-400",  pill: "bg-amber-50 text-amber-800 ring-amber-200" },
  accepted:    { label: "Acceptée",        plural: "Acceptées",        icon: Check,     step: 5, dot: "bg-[#16B8B1]", bar: "bg-[#16B8B1]",  pill: "bg-[#16B8B1]/10 text-[#0F9691] ring-[#16B8B1]/30" },
  rejected:    { label: "Refusée",         plural: "Refusées",         icon: X,         step: 0, dot: "bg-rose-500",   bar: "bg-rose-400",   pill: "bg-rose-50 text-rose-700 ring-rose-200" },
};

const GROUPS = {
  todo: ["sent", "viewed"],
  progress: ["shortlisted", "interview"],
  done: ["accepted", "rejected"],
};

const TABS = [
  { id: "all", label: "Toutes" },
  { id: "todo", label: "À traiter" },
  { id: "progress", label: "En cours" },
  { id: "done", label: "Terminées" },
];

const TONES = [
  "from-[#16B8B1] to-[#0F9691]",
  "from-sky-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-[#0F2340] to-[#1A2F4A]",
];
const toneOf = (s = "") => TONES[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];

/* ============================================
   Utilitaires
============================================ */
const fmtLong = (v) => new Date(v).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
const fmtTime = (v) => new Date(v).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const fmtFull = (v) =>
  new Date(v).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const ago = (v) => {
  const d = Math.floor((Date.now() - new Date(v).getTime()) / 86400000);
  if (d <= 0) return "Aujourd’hui";
  if (d === 1) return "Hier";
  if (d < 7) return `Il y a ${d} j`;
  return new Date(v).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

const canDrop = (app, to) => {
  if (!app || CLOSED.includes(app.status) || to === app.status) return false;
  if (to === "rejected") return true;
  return STATUS[to].step > STATUS[app.status].step;
};

const CSS = `
@keyframes ja-slide { from { transform: translateX(32px); opacity: 0 } to { transform: none; opacity: 1 } }
@keyframes ja-fade { from { opacity: 0 } to { opacity: 1 } }
.ja-slide { animation: ja-slide .22s ease-out both }
.ja-fade { animation: ja-fade .2s ease-out both }
@media (prefers-reduced-motion: reduce) { .ja-slide, .ja-fade { animation: none } }
`;

/* ============================================
   Page
============================================ */
export default function JobOfferApplications() {
  const { id } = useParams();
  const [applications, setApplications] = useState([]);
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState("board");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [interviewModal, setInterviewModal] = useState(null);
  const [pendingReject, setPendingReject] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const [toast, setToast] = useState(null);

  const flash = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const load = useCallback(
    (silent = false) => {
      if (!silent) setLoading(true);
      return api
        .get(`/job-offers/${id}/applications`)
        .then((res) => setApplications(res.data.data || res.data || []))
        .catch(() => flash("Impossible de charger les candidatures", "error"))
        .finally(() => setLoading(false));
    },
    [id, flash]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api
      .get(`/job-offers/${id}`)
      .then((res) => setOffer(res.data.data || res.data))
      .catch(() => {});
  }, [id]);

  const refresh = () => {
    setRefreshing(true);
    load(true).finally(() => setRefreshing(false));
  };

  const patchStatus = (applicationId, status) =>
    api.patch(`/applications/${applicationId}/status`, { status });

  const updateStatus = async (applicationId, status) => {
    const previous = applications;
    setApplications((list) => list.map((a) => (a.id === applicationId ? { ...a, status } : a)));
    try {
      await patchStatus(applicationId, status);
      flash(`Candidature passée en « ${STATUS[status].label.toLowerCase()} »`);
      load(true);
    } catch (err) {
      setApplications(previous);
      flash(err.response?.data?.message || "Le changement de statut a échoué", "error");
    }
  };

  const confirmReject = async () => {
    await patchStatus(pendingReject.id, "rejected");
    setPendingReject(null);
    flash("Candidature refusée");
    load(true);
  };

  const moveTo = (app, status) => {
    if (status === "interview") return setInterviewModal(app);
    if (status === "rejected")
      return setPendingReject({ id: app.id, name: app.profile?.user?.name || "ce candidat" });
    return updateStatus(app.id, status);
  };

  const offerTitle = offer?.title || applications[0]?.job_offer?.title || "Offre";
  const companyName = offer?.company?.name || applications[0]?.job_offer?.company?.name;

  const counts = useMemo(() => {
    const by = (list) => applications.filter((a) => list.includes(a.status)).length;
    const total = applications.length;
    const accepted = by(["accepted"]);
    return {
      all: total,
      todo: by(GROUPS.todo),
      progress: by(GROUPS.progress),
      done: by(GROUPS.done),
      interview: by(["interview"]),
      accepted,
      rate: total ? Math.round((accepted / total) * 100) : 0,
      byStatus: Object.fromEntries(ORDER.map((s) => [s, by([s])])),
    };
  }, [applications]);

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter((a) => {
      const u = a.profile?.user;
      return [u?.name, u?.email].filter(Boolean).some((v) => v.toLowerCase().includes(q));
    });
  }, [applications, query]);

  const visibleStatuses = filter === "all" ? ORDER : GROUPS[filter];
  const visible = useMemo(
    () => searched.filter((a) => visibleStatuses.includes(a.status)),
    [searched, visibleStatuses]
  );

  const dragApp = applications.find((a) => a.id === dragId);
  const selected = applications.find((a) => a.id === selectedId);

  const handleDrop = (status) => {
    setOverCol(null);
    if (dragApp && canDrop(dragApp, status)) moveTo(dragApp, status);
    setDragId(null);
  };

  return (
    <AppShell>
      <style>{CSS}</style>

      <div className="mx-auto max-w-[1400px] space-y-5 py-2 font-['Plus_Jakarta_Sans',sans-serif]">
        {/* ============ EN-TÊTE ============ */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <Link
              to="/job-offers"
              className="inline-flex items-center gap-1.5 rounded-md text-sm text-slate-500 transition hover:text-[#0F9691] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16B8B1]"
            >
              <ArrowLeft size={15} /> Recrutement permanent
            </Link>
            <h1 className="mt-2 truncate text-2xl font-bold tracking-tight text-[#0F2340] dark:text-white sm:text-3xl">
              {offerTitle}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              {companyName && (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 size={14} className="text-slate-400" /> {companyName}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Users size={14} className="text-slate-400" />
                {counts.all} candidature{counts.all > 1 ? "s" : ""} reçue{counts.all > 1 ? "s" : ""}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-[#131E47]" role="group" aria-label="Affichage">
              <ViewButton active={view === "board"} onClick={() => setView("board")} icon={LayoutGrid} label="Pipeline" />
              <ViewButton active={view === "list"} onClick={() => setView("list")} icon={ListIcon} label="Liste" />
            </div>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-[#0F2340] shadow-sm transition hover:border-[#16B8B1] hover:text-[#0F9691] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16B8B1] dark:border-white/10 dark:bg-[#131E47] dark:text-white dark:hover:border-[#16B8B1]/50 dark:hover:text-[#16B8B1]"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Actualiser
            </button>
          </div>
        </header>

        {/* ============ ENTONNOIR ============ */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-white/10 dark:bg-[#131E47]">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-bold text-[#0F2340] dark:text-white">Où en sont vos candidats</p>
              <FunnelBar counts={counts} />
            </div>

            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4 lg:min-w-[520px]">
              <Stat label="À traiter" value={counts.todo} accent={counts.todo > 0 ? "text-[#0F9691] dark:text-[#16B8B1]" : ""} />
              <Stat label="En cours" value={counts.progress} />
              <Stat label="Entretiens" value={counts.interview} />
              <Stat label="Taux d’acceptation" value={`${counts.rate} %`} />
            </dl>
          </div>
        </section>

        {/* ============ BARRE D'OUTILS ============ */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filtrer par groupe">
            {TABS.map((t) => {
              const active = filter === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(t.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16B8B1] ${
                    active
                      ? "bg-[#0F2340] text-white shadow-sm dark:bg-[#16B8B1] dark:text-[#0F2340]"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-[#0F2340] hover:ring-[#16B8B1]/50 dark:bg-[#131E47] dark:text-slate-300 dark:ring-white/10 dark:hover:text-white"
                  }`}
                >
                  {t.label}
                  <span
                    className={`rounded-full px-1.5 text-xs tabular-nums ${
                      active ? "bg-white/20 text-white dark:bg-[#0F2340]/10 dark:text-[#0F2340]" : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300"
                    }`}
                  >
                    {counts[t.id]}
                  </span>
                </button>
              );
            })}
          </div>

          <label className="relative block w-full sm:w-80">
            <span className="sr-only">Rechercher un candidat</span>
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un nom ou un e-mail"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-[#16B8B1] focus:outline-none focus:ring-4 focus:ring-[#16B8B1]/10 dark:border-white/10 dark:bg-[#0A1230] dark:text-white dark:placeholder:text-slate-500"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Effacer la recherche"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </label>
        </div>

        {/* ============ CONTENU ============ */}
        {loading ? (
          <Skeleton view={view} />
        ) : applications.length === 0 ? (
          <Empty
            icon={Users}
            title="Aucune candidature pour l’instant"
            text="Dès qu’un candidat postule à cette offre, il apparaît ici et vous pouvez le faire avancer dans le pipeline."
          />
        ) : view === "board" ? (
          <>
            {searched.length === 0 && (
              <Empty
                icon={Search}
                title="Aucun résultat"
                text="Aucun candidat ne correspond à votre recherche. Essayez un autre nom ou e-mail."
              />
            )}
            {searched.length > 0 && (
              <>
                <div className="grid auto-cols-[minmax(264px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-3">
                  {visibleStatuses.map((status) => (
                    <Column
                      key={status}
                      status={status}
                      items={searched.filter((a) => a.status === status)}
                      dragApp={dragApp}
                      isOver={overCol === status}
                      onOver={setOverCol}
                      onDropTo={handleDrop}
                      onOpen={setSelectedId}
                      onDragStart={(app) => setDragId(app.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverCol(null);
                      }}
                      draggingId={dragId}
                    />
                  ))}
                </div>
                <p className="hidden text-center text-xs text-slate-400 md:block">
                  Glissez une carte vers une colonne pour faire avancer un candidat, ou ouvrez-la pour voir tout son dossier.
                </p>
              </>
            )}
          </>
        ) : visible.length === 0 ? (
          <Empty
            icon={Inbox}
            title="Aucune candidature ne correspond"
            text="Modifiez le filtre ou la recherche pour afficher d’autres candidats."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#131E47]">
            <div className="hidden grid-cols-[2.4fr_1.2fr_1fr_1fr_auto] gap-4 border-b border-slate-100 bg-[#F3F6FC]/70 px-5 py-3 text-xs font-bold text-slate-500 md:grid dark:border-white/10 dark:bg-white/5">
              <span>Candidat</span>
              <span>Statut</span>
              <span>Reçue</span>
              <span>Documents</span>
              <span className="w-[172px] text-right">Actions</span>
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-white/5">
              {visible.map((app) => (
                <ListRow
                  key={app.id}
                  app={app}
                  onOpen={() => setSelectedId(app.id)}
                  onMove={moveTo}
                />
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ============ TIROIR DE DÉTAIL ============ */}
      {selected && (
        <Drawer
          app={selected}
          onClose={() => setSelectedId(null)}
          onMove={moveTo}
        />
      )}

      {interviewModal && (
        <ScheduleInterviewModal
          application={interviewModal}
          onClose={() => setInterviewModal(null)}
          onSuccess={() => {
            setInterviewModal(null);
            flash("Entretien programmé et invitation envoyée");
            load(true);
          }}
        />
      )}

      {pendingReject && (
        <ConfirmDialog
          title="Refuser cette candidature ?"
          message={`La candidature de ${pendingReject.name} sera marquée comme refusée.`}
          confirmLabel="Refuser"
          fallbackError="Impossible de refuser cette candidature."
          onConfirm={confirmReject}
          onCancel={() => setPendingReject(null)}
        />
      )}

      {toast && (
        <div
          role="status"
          className={`ja-fade fixed bottom-6 right-6 z-[70] flex max-w-sm items-center gap-3 rounded-xl border bg-white p-4 text-sm shadow-xl dark:bg-[#131E47] ${
            toast.type === "error" ? "border-rose-200 text-rose-700 dark:border-rose-500/20 dark:text-rose-400" : "border-[#16B8B1]/30 text-[#0F9691] dark:border-[#16B8B1]/30 dark:text-[#16B8B1]"
          }`}
        >
          {toast.type === "error" ? <AlertCircle size={18} /> : <Check size={18} />}
          {toast.msg}
        </div>
      )}
    </AppShell>
  );
}

/* ============================================
   Petits composants
============================================ */
function ViewButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16B8B1] ${
        active ? "bg-[#16B8B1] text-[#0F2340] shadow-sm" : "text-slate-500 hover:text-[#0F2340] dark:text-slate-400 dark:hover:text-white"
      }`}
    >
      <Icon size={15} /> {label}
    </button>
  );
}

function Stat({ label, value, accent = "" }) {
  return (
    <div>
      <dt className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className={`mt-1 text-2xl font-extrabold tabular-nums text-[#0F2340] dark:text-white ${accent}`}>{value}</dd>
    </div>
  );
}

function FunnelBar({ counts }) {
  const total = counts.all;
  return (
    <div className="mt-3">
      <div className="flex h-3 w-full gap-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5" aria-hidden="true">
        {total > 0 &&
          ORDER.filter((s) => counts.byStatus[s] > 0).map((s) => (
            <span
              key={s}
              className={`${STATUS[s].bar} first:rounded-l-full last:rounded-r-full transition-all duration-500`}
              style={{ flexGrow: counts.byStatus[s], flexBasis: 0 }}
            />
          ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
        {ORDER.map((s) => (
          <li key={s} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${STATUS[s].dot}`} />
            {STATUS[s].plural}
            <span className="font-bold tabular-nums text-[#0F2340] dark:text-white">{counts.byStatus[s]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Avatar({ name, size = "h-10 w-10 text-sm" }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white ${toneOf(name)} ${size}`}
    >
      {initials(name)}
    </span>
  );
}

function StatusPill({ status }) {
  const cfg = STATUS[status] || STATUS.sent;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${cfg.pill}`}>
      <Icon size={12} /> {cfg.label}
    </span>
  );
}

function DocLink({ href, icon: Icon, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200 transition hover:text-[#0F9691] hover:ring-[#16B8B1]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16B8B1] dark:bg-[#0A1230] dark:text-slate-300 dark:ring-white/10 dark:hover:text-[#16B8B1]"
    >
      <Icon size={13} /> {children} <ExternalLink size={11} className="text-slate-400" />
    </a>
  );
}

function Docs({ app }) {
  if (!app.portfolio && !app.cv_path) return <span className="text-xs text-slate-400">Aucun document</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {app.portfolio && (
        <DocLink href={`/portfolio/${app.portfolio.public_slug}`} icon={Briefcase}>Portfolio</DocLink>
      )}
      {app.cv_path && <DocLink href={`/storage/${app.cv_path}`} icon={FileText}>CV</DocLink>}
    </div>
  );
}

/* ============================================
   Pipeline (kanban)
============================================ */
function Column({ status, items, dragApp, isOver, onOver, onDropTo, onOpen, onDragStart, onDragEnd, draggingId }) {
  const cfg = STATUS[status];
  const dragging = !!dragApp;
  const allowed = canDrop(dragApp, status);

  return (
    <section
      onDragOver={(e) => {
        if (!allowed) return;
        e.preventDefault();
        onOver(status);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) onOver(null);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDropTo(status);
      }}
      aria-label={cfg.plural}
      className={`flex min-h-[220px] flex-col rounded-2xl p-2 transition ${
        isOver && allowed
          ? "bg-[#16B8B1]/10 ring-2 ring-[#16B8B1]"
          : dragging && !allowed
          ? "bg-slate-100/40 opacity-60 dark:bg-white/5"
          : "bg-[#F3F6FC]/70 dark:bg-white/5"
      }`}
    >
      <div className="flex items-center justify-between px-2 pb-2 pt-1.5">
        <h2 className="inline-flex items-center gap-2 text-sm font-bold text-[#0F2340] dark:text-white">
          <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
          {cfg.plural}
        </h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold tabular-nums text-slate-500 ring-1 ring-slate-200 dark:bg-[#0A1230] dark:text-slate-300 dark:ring-white/10">
          {items.length}
        </span>
      </div>

      <div className="flex max-h-[62vh] flex-1 flex-col gap-2 overflow-y-auto px-0.5 pb-1">
        {items.map((app) => (
          <BoardCard
            key={app.id}
            app={app}
            onOpen={() => onOpen(app.id)}
            onDragStart={() => onDragStart(app)}
            onDragEnd={onDragEnd}
            isDragging={draggingId === app.id}
          />
        ))}
        {items.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-300/80 p-6 text-center text-xs text-slate-400 dark:border-white/10 dark:text-slate-500">
            {dragging && allowed ? "Déposez ici" : "Aucun candidat"}
          </div>
        )}
      </div>
    </section>
  );
}

function BoardCard({ app, onOpen, onDragStart, onDragEnd, isDragging }) {
  const user = app.profile?.user;
  const name = user?.name || "Candidat";
  const closed = CLOSED.includes(app.status);

  return (
    <article
      draggable={!closed}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(app.id));
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      tabIndex={0}
      className={`group rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-[#16B8B1]/30 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16B8B1] dark:border-white/10 dark:bg-[#131E47] ${
        closed ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
      } ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="flex items-start gap-3">
        <Avatar name={name} size="h-9 w-9 text-xs" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-[#0F2340] dark:text-white">{name}</h3>
          {user?.email && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>}
        </div>
        {!closed && (
          <GripVertical size={16} className="mt-0.5 shrink-0 text-slate-300 transition group-hover:text-slate-400" aria-hidden="true" />
        )}
      </div>

      {app.status === "interview" && app.interview_at && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-amber-900 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20">
          <Calendar size={13} className="shrink-0 text-amber-600" />
          <span>
            Le <strong className="font-bold">{fmtLong(app.interview_at)}</strong> à{" "}
            <strong className="font-bold">{fmtTime(app.interview_at)}</strong>
          </span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>{ago(app.created_at)}</span>
        <span className="inline-flex items-center gap-2">
          {app.cover_letter && <FileText size={13} aria-label="Lettre de motivation" />}
          {app.cv_path && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-white/10 dark:text-slate-400">CV</span>}
          {app.portfolio && <Briefcase size={13} aria-label="Portfolio" />}
        </span>
      </div>
    </article>
  );
}

/* ============================================
   Vue liste
============================================ */
function ListRow({ app, onOpen, onMove }) {
  const user = app.profile?.user;
  const name = user?.name || "Candidat";
  const closed = CLOSED.includes(app.status);

  return (
    <li className="grid items-center gap-3 px-5 py-4 transition hover:bg-[#F3F6FC]/50 md:grid-cols-[2.4fr_1.2fr_1fr_1fr_auto] md:gap-4 dark:hover:bg-white/5">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 items-center gap-3 rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16B8B1]"
      >
        <Avatar name={name} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-[#0F2340] dark:text-white">{name}</span>
          {user?.email && (
            <span className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-500 dark:text-slate-400">
              <Mail size={12} className="shrink-0 text-slate-400" /> {user.email}
            </span>
          )}
        </span>
      </button>

      <div className="flex flex-col items-start gap-1">
        <StatusPill status={app.status} />
        {app.status === "interview" && app.interview_at && (
          <span className="text-xs text-amber-700 dark:text-amber-400">
            {fmtLong(app.interview_at)}, {fmtTime(app.interview_at)}
          </span>
        )}
      </div>

      <span className="text-sm text-slate-500 dark:text-slate-400">{ago(app.created_at)}</span>

      <Docs app={app} />

      <div className="flex w-full items-center justify-end gap-1.5 md:w-[172px]">
        {!closed && (
          <>
            <IconAction label="Accepter" tone="ok" onClick={() => onMove(app, "accepted")}>
              <Check size={15} />
            </IconAction>
            <IconAction label="Refuser" tone="no" onClick={() => onMove(app, "rejected")}>
              <X size={15} />
            </IconAction>
          </>
        )}
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-1 rounded-lg bg-[#0F2340] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#1A2F4A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16B8B1] dark:bg-[#16B8B1] dark:text-[#0F2340] dark:hover:bg-[#0F9691]"
        >
          Dossier <ChevronRight size={13} />
        </button>
      </div>
    </li>
  );
}

function IconAction({ children, label, tone, onClick }) {
  const tones = {
    ok: "text-[#0F9691] ring-[#16B8B1]/30 hover:bg-[#16B8B1]/10 dark:text-[#16B8B1]",
    no: "text-rose-600 ring-rose-200 hover:bg-rose-50 dark:text-rose-400 dark:ring-rose-500/20 dark:hover:bg-rose-500/10",
  };
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16B8B1] dark:bg-[#0A1230] ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

/* ============================================
   Tiroir de détail
============================================ */
function Drawer({ app, onClose, onMove }) {
  const [full, setFull] = useState(false);
  const cfg = STATUS[app.status] || STATUS.sent;
  const user = app.profile?.user;
  const name = user?.name || "Candidat";
  const closed = CLOSED.includes(app.status);
  const rejected = app.status === "rejected";

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const letter = app.cover_letter || "";
  const long = letter.length > 420;

  return (
    <div className="fixed inset-0 z-50 font-['Plus_Jakarta_Sans',sans-serif]" role="dialog" aria-modal="true" aria-label={`Dossier de ${name}`}>
      <div className="ja-fade absolute inset-0 bg-[#0F2340]/40 backdrop-blur-[2px]" onClick={onClose} />

      <aside className="ja-slide absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl dark:bg-[#131E47]">
        <div className="flex items-start gap-4 border-b border-slate-100 p-6 dark:border-white/10">
          <Avatar name={name} size="h-14 w-14 text-base" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold text-[#0F2340] dark:text-white">{name}</h2>
            {user?.email && (
              <a
                href={`mailto:${user.email}`}
                className="mt-0.5 inline-flex max-w-full items-center gap-1.5 truncate text-sm text-slate-500 hover:text-[#0F9691] dark:text-slate-400 dark:hover:text-[#16B8B1]"
              >
                <Mail size={14} className="shrink-0" /> <span className="truncate">{user.email}</span>
              </a>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusPill status={app.status} />
              <span className="text-xs text-slate-400">Reçue le {fmtFull(app.created_at)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16B8B1] dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-7 overflow-y-auto p-6">
          <section>
            <h3 className="text-sm font-bold text-[#0F2340] dark:text-white">Progression</h3>
            {rejected ? (
              <p className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20">
                <X size={16} /> Cette candidature a été refusée.
              </p>
            ) : (
              <ol className="mt-4 flex">
                {STEPS.map((s, i) => {
                  const st = STATUS[s];
                  const done = st.step <= cfg.step;
                  const current = s === app.status;
                  const Icon = st.icon;
                  return (
                    <li key={s} className="min-w-0 flex-1">
                      <div className="flex items-center">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                            done ? "bg-[#16B8B1] text-[#0F2340]" : "bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-slate-500"
                          } ${current ? "ring-4 ring-[#16B8B1]/20" : ""}`}
                        >
                          <Icon size={14} />
                        </span>
                        {i < STEPS.length - 1 && (
                          <span className={`mx-1 h-0.5 flex-1 rounded ${st.step < cfg.step ? "bg-[#16B8B1]" : "bg-slate-200 dark:bg-white/10"}`} />
                        )}
                      </div>
                      <p className={`mt-1.5 truncate pr-1 text-[11px] ${current ? "font-bold text-[#0F2340] dark:text-white" : "text-slate-400"}`}>
                        {st.label}
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {app.status === "interview" && app.interview_at && (
            <section className="flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3.5 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:ring-amber-500/20">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm dark:bg-white/10 dark:text-amber-400">
                <Calendar size={18} />
              </span>
              <p className="text-sm text-amber-900 dark:text-amber-400">
                Entretien le <strong className="font-bold">{fmtLong(app.interview_at)}</strong> à{" "}
                <strong className="font-bold">{fmtTime(app.interview_at)}</strong>
              </p>
            </section>
          )}

          <section>
            <h3 className="text-sm font-bold text-[#0F2340] dark:text-white">Documents</h3>
            <div className="mt-3">
              <Docs app={app} />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#0F2340] dark:text-white">Lettre de motivation</h3>
            {letter ? (
              <div className="mt-3">
                <p
                  className={`whitespace-pre-line rounded-xl bg-[#F3F6FC] p-4 text-sm leading-6 text-slate-600 dark:bg-white/5 dark:text-slate-300 ${
                    long && !full ? "max-h-40 overflow-hidden" : ""
                  }`}
                >
                  {letter}
                </p>
                {long && (
                  <button
                    type="button"
                    onClick={() => setFull((v) => !v)}
                    className="mt-2 text-xs font-bold text-[#0F9691] hover:underline dark:text-[#16B8B1]"
                  >
                    {full ? "Réduire" : "Lire la suite"}
                  </button>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-400">Ce candidat n’a pas joint de lettre.</p>
            )}
          </section>
        </div>

        {!closed && (
          <div className="space-y-2 border-t border-slate-100 bg-[#F3F6FC]/50 p-4 dark:border-white/10 dark:bg-white/5">
            {["sent", "viewed", "shortlisted"].includes(app.status) && (
              <button
                type="button"
                onClick={() => onMove(app, "interview")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#16B8B1] px-4 py-3 text-sm font-bold text-[#0F2340] shadow-sm transition hover:bg-[#0F9691] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16B8B1] focus-visible:ring-offset-2"
              >
                <Video size={16} /> Proposer un entretien
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              {app.status === "sent" && (
                <SecondaryButton onClick={() => onMove(app, "viewed")}>Marquer consultée</SecondaryButton>
              )}
              {["sent", "viewed"].includes(app.status) && (
                <SecondaryButton onClick={() => onMove(app, "shortlisted")}>Présélectionner</SecondaryButton>
              )}
              <SecondaryButton tone="ok" onClick={() => onMove(app, "accepted")}>
                <Check size={15} /> Accepter
              </SecondaryButton>
              <SecondaryButton tone="no" onClick={() => onMove(app, "rejected")}>
                <X size={15} /> Refuser
              </SecondaryButton>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function SecondaryButton({ children, onClick, tone = "default" }) {
  const tones = {
    default: "text-slate-700 hover:bg-white hover:ring-[#16B8B1]/50 dark:text-slate-300 dark:hover:bg-white/10",
    ok: "text-[#0F9691] hover:bg-[#16B8B1]/10 hover:ring-[#16B8B1]/50 dark:text-[#16B8B1]",
    no: "text-rose-700 hover:bg-rose-50 hover:ring-rose-300 dark:text-rose-400 dark:hover:bg-rose-500/10",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold ring-1 ring-slate-200 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16B8B1] dark:ring-white/10 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

/* ============================================
   États vide / chargement
============================================ */
function Empty({ icon: Icon, title, text }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-white/10 dark:bg-[#131E47]">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#16B8B1]/10 text-[#16B8B1] ring-8 ring-[#16B8B1]/5 dark:bg-[#16B8B1]/20">
        <Icon size={24} />
      </span>
      <h3 className="mt-5 text-base font-bold text-[#0F2340] dark:text-white">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );
}

function Skeleton({ view }) {
  if (view === "list") {
    return (
      <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-white/10 dark:border-white/10 dark:bg-[#131E47]" aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex animate-pulse items-center gap-3 px-5 py-4">
            <span className="h-10 w-10 rounded-full bg-slate-200 dark:bg-white/10" />
            <span className="flex-1 space-y-2">
              <span className="block h-3 w-40 rounded bg-slate-200 dark:bg-white/10" />
              <span className="block h-3 w-56 rounded bg-slate-100 dark:bg-white/5" />
            </span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid auto-cols-[minmax(264px,1fr)] grid-flow-col gap-3 overflow-hidden" aria-busy="true">
      {[0, 1, 2, 3].map((c) => (
        <div key={c} className="animate-pulse space-y-2 rounded-2xl bg-slate-100/70 p-2 dark:bg-white/5">
          <div className="h-5 w-28 rounded bg-slate-200 dark:bg-white/10" />
          {[0, 1].map((r) => (
            <div key={r} className="space-y-3 rounded-xl bg-white p-3.5 dark:bg-[#131E47]">
              <div className="flex gap-3">
                <span className="h-9 w-9 rounded-full bg-slate-200 dark:bg-white/10" />
                <span className="flex-1 space-y-2">
                  <span className="block h-3 w-24 rounded bg-slate-200 dark:bg-white/10" />
                  <span className="block h-3 w-32 rounded bg-slate-100 dark:bg-white/5" />
                </span>
              </div>
              <div className="h-3 w-16 rounded bg-slate-100 dark:bg-white/5" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}