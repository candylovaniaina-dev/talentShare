import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Loader2, Mail, Phone, Briefcase, Calendar, Check, X, Video,
  UserCheck, Eye, FileText, Download, ExternalLink, Building2, Users, Send,
  RefreshCw, Search, StickyNote, Inbox, LayoutGrid, List as ListIcon,
  GripVertical, ChevronRight,
} from "lucide-react";

import AppShell from "../../components/layout/AppShell";
import ScheduleInterviewModal from "../../components/ScheduleInterviewModal";
import api from "../../services/api";
import { useToast } from "../../hooks/useToast";
import Toast from "../../components/ui/Toast";

/* ============================================
   Configuration
============================================ */
const ORDER = ["sent", "viewed", "shortlisted", "interview", "accepted", "rejected"];
const STEPS = ["sent", "viewed", "shortlisted", "interview", "accepted"];
const CLOSED = ["accepted", "rejected"];

const STATUS = {
  sent: {
    label: "Envoyée", plural: "Envoyées", icon: Send, step: 1,
    dot: "bg-slate-400", bar: "bg-slate-300 dark:bg-slate-500",
    pill: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10",
  },
  viewed: {
    label: "Consultée", plural: "Consultées", icon: Eye, step: 2,
    dot: "bg-[#0F2340]", bar: "bg-[#0F2340]",
    pill: "bg-[#0F2340]/10 text-[#0F2340] ring-[#0F2340]/20 dark:bg-white/10 dark:text-white dark:ring-white/20",
  },
  shortlisted: {
    label: "Présélectionnée", plural: "Présélectionnées", icon: UserCheck, step: 3,
    dot: "bg-violet-500", bar: "bg-violet-400",
    pill: "bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20",
  },
  interview: {
    label: "Entretien", plural: "Entretiens", icon: Video, step: 4,
    dot: "bg-amber-500", bar: "bg-amber-400",
    pill: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
  },
  accepted: {
    label: "Acceptée", plural: "Acceptées", icon: Check, step: 5,
    dot: "bg-[#16B8B1]", bar: "bg-[#16B8B1]",
    pill: "bg-[#16B8B1]/10 text-[#0F9691] ring-[#16B8B1]/20 dark:bg-[#16B8B1]/20 dark:text-[#16B8B1] dark:ring-[#16B8B1]/30",
  },
  rejected: {
    label: "Refusée", plural: "Refusées", icon: X, step: 0,
    dot: "bg-rose-500", bar: "bg-rose-400",
    pill: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20",
  },
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

const ACTIONS = [
  { key: "viewed", label: "Marquer consultée", icon: Eye },
  { key: "shortlisted", label: "Présélectionner", icon: UserCheck },
  { key: "accepted", label: "Accepter", icon: Check, tone: "ok" },
  { key: "rejected", label: "Refuser", icon: X, tone: "no" },
];

const card =
  "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#131E47]";

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16B8B1]";

const CSS = `
@keyframes oa-slide { from { transform: translateX(32px); opacity: 0 } to { transform: none; opacity: 1 } }
@keyframes oa-fade { from { opacity: 0 } to { opacity: 1 } }
.oa-slide { animation: oa-slide .22s ease-out both }
.oa-fade { animation: oa-fade .18s ease-out both }
@media (prefers-reduced-motion: reduce) { .oa-slide, .oa-fade { animation: none } }
`;

/* ============================================
   Utilitaires
============================================ */
const toDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDate = (v, options = {}) => {
  const d = toDate(v);
  if (!d) return "Date inconnue";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", ...options });
};

const fmtLong = (v) => toDate(v)?.toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) || "";
const fmtTime = (v) => toDate(v)?.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) || "";

const ago = (v) => {
  const d = toDate(v);
  if (!d) return "Date inconnue";
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "Aujourd’hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} j`;
  return formatDate(v, { year: undefined });
};

const getInitials = (name) =>
  (name || "?").trim().split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();

const TONES = [
  "from-[#16B8B1] to-[#0F9691]",
  "from-[#0F2340] to-[#1A2F4A]",
  "from-violet-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-slate-600 to-slate-800",
];
const toneOf = (s = "") => TONES[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];

const canDrop = (app, to) => {
  if (!app || CLOSED.includes(app.status) || to === app.status) return false;
  if (to === "rejected") return true;
  return STATUS[to].step > STATUS[app.status].step;
};

/* ============================================
   Petits composants
============================================ */
function Avatar({ name, user, profile, size = "md" }) {
  const [imageFailed, setImageFailed] = useState(false);
  const sizes = { sm: "h-9 w-9 text-xs", md: "h-11 w-11 text-sm", lg: "h-16 w-16 text-lg" };

  const rawPhoto =
    profile?.avatar_path || user?.avatar_path || user?.avatar_url || user?.profile_photo_url ||
    user?.profile_picture || user?.photo_url || user?.image_url || user?.avatar ||
    profile?.avatar_url || profile?.profile_photo_url || profile?.profile_picture ||
    profile?.photo_url || null;

  const photoSrc = rawPhoto
    ? /^(https?:|data:|blob:)/i.test(rawPhoto)
      ? rawPhoto
      : rawPhoto.startsWith("/")
      ? rawPhoto
      : `/storage/${rawPhoto.replace(/^storage\//, "")}`
    : null;

  return (
    <span
      className={`${sizes[size]} relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${toneOf(name)} font-bold text-white ring-2 ring-white dark:ring-[#131E47]`}
    >
      {photoSrc && !imageFailed ? (
        <img src={photoSrc} alt={name} className="h-full w-full object-cover" onError={() => setImageFailed(true)} />
      ) : (
        getInitials(name)
      )}
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

function Stat({ label, value, accent = "" }) {
  return (
    <div>
      <dt className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className={`mt-1 text-2xl font-extrabold tabular-nums text-[#0F2340] dark:text-white ${accent}`}>{value}</dd>
    </div>
  );
}

function FunnelBar({ counts }) {
  return (
    <div className="mt-3">
      <div className="flex h-3 w-full gap-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5" aria-hidden="true">
        {counts.total > 0 &&
          ORDER.filter((s) => counts[s] > 0).map((s) => (
            <span
              key={s}
              className={`${STATUS[s].bar} transition-all duration-500 first:rounded-l-full last:rounded-r-full`}
              style={{ flexGrow: counts[s], flexBasis: 0 }}
            />
          ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
        {ORDER.map((s) => (
          <li key={s} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${STATUS[s].dot}`} />
            {STATUS[s].plural}
            <span className="font-bold tabular-nums text-[#0F2340] dark:text-slate-100">{counts[s]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ViewButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition ${focusRing} ${
        active
          ? "bg-[#16B8B1] text-[#0F2340] shadow-sm"
          : "text-slate-500 hover:text-[#0F2340] dark:text-slate-400 dark:hover:text-white"
      }`}
    >
      <Icon size={15} /> {label}
    </button>
  );
}

function DocChip({ href, icon: Icon, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200 transition hover:text-[#0F9691] hover:ring-[#16B8B1]/50 dark:bg-[#0A1230] dark:text-slate-300 dark:ring-white/10 dark:hover:text-[#16B8B1] ${focusRing}`}
    >
      <Icon size={13} /> {children} <ExternalLink size={11} className="text-slate-400" />
    </a>
  );
}

function Docs({ app }) {
  if (!app.portfolio && !app.cv_path)
    return <span className="text-xs text-slate-400">Aucun document</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {app.portfolio && (
        <DocChip href={`/portfolio/${app.portfolio.public_slug}`} icon={Briefcase}>Portfolio</DocChip>
      )}
      {app.cv_path && <DocChip href={`/storage/${app.cv_path}`} icon={FileText}>CV</DocChip>}
    </div>
  );
}

/* ============================================
   Pipeline
============================================ */
function Column({ status, items, dragApp, draggingId, isOver, onOver, onDropTo, onOpen, onDragStart, onDragEnd }) {
  const cfg = STATUS[status];
  const dragging = !!dragApp;
  const allowed = canDrop(dragApp, status);

  return (
    <section
      aria-label={cfg.plural}
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
      className={`flex min-h-[220px] flex-col rounded-2xl p-2 transition ${
        isOver && allowed
          ? "bg-[#16B8B1]/10 ring-2 ring-[#16B8B1]"
          : dragging && !allowed
          ? "bg-slate-100/40 opacity-60 dark:bg-white/5"
          : "bg-[#F3F6FC]/70 dark:bg-white/5"
      }`}
    >
      <div className="flex items-center justify-between px-2 pb-2 pt-1.5">
        <h2 className="inline-flex items-center gap-2 text-sm font-bold text-[#0F2340] dark:text-slate-100">
          <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
          {cfg.plural}
        </h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold tabular-nums text-slate-500 ring-1 ring-slate-200 dark:bg-[#0A1230] dark:text-slate-400 dark:ring-white/10">
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
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-300/80 p-6 text-center text-xs text-slate-400 dark:border-white/10">
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
  const headline = app.profile?.headline;

  return (
    <article
      draggable={!closed}
      tabIndex={0}
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
      className={`group rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-[#16B8B1]/30 hover:shadow-md dark:border-white/10 dark:bg-[#131E47] dark:hover:border-[#16B8B1]/50 ${focusRing} ${
        closed ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
      } ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="flex items-start gap-3">
        <Avatar name={name} user={user} profile={app.profile} size="sm" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-[#0F2340] dark:text-slate-100">{name}</h3>
          {headline && headline.toLowerCase() !== name.toLowerCase() ? (
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{headline}</p>
          ) : (
            user?.email && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
          )}
        </div>
        {!closed && (
          <GripVertical size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-slate-300 transition group-hover:text-slate-400 dark:text-slate-600" />
        )}
      </div>

      {app.status === "interview" && toDate(app.interview_at) && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-amber-900 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20">
          <Calendar size={13} className="shrink-0 text-amber-600 dark:text-amber-400" />
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
          {app.cv_path && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-white/10 dark:text-slate-400">CV</span>
          )}
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
  const headline = app.profile?.headline;

  return (
    <li className="grid items-center gap-3 px-5 py-4 transition hover:bg-[#F3F6FC]/70 dark:hover:bg-white/5 md:grid-cols-[2.4fr_1.2fr_1fr_1.2fr_auto] md:gap-4">
      <button type="button" onClick={onOpen} className={`flex min-w-0 items-center gap-3 rounded-lg text-left ${focusRing}`}>
        <Avatar name={name} user={user} profile={app.profile} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-[#0F2340] dark:text-slate-100">{name}</span>
          <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
            {headline && headline.toLowerCase() !== name.toLowerCase() ? headline : user?.email}
          </span>
        </span>
      </button>

      <div className="flex flex-col items-start gap-1">
        <StatusPill status={app.status} />
        {app.status === "interview" && toDate(app.interview_at) && (
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
            <button
              type="button"
              title="Accepter"
              aria-label="Accepter"
              onClick={() => onMove(app, "accepted")}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#0F9691] ring-1 ring-[#16B8B1]/30 transition hover:bg-[#16B8B1]/10 dark:bg-[#0A1230] dark:text-[#16B8B1] dark:ring-[#16B8B1]/30 dark:hover:bg-[#16B8B1]/20 ${focusRing}`}
            >
              <Check size={15} />
            </button>
            <button
              type="button"
              title="Refuser"
              aria-label="Refuser"
              onClick={() => onMove(app, "rejected")}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-50 dark:bg-[#0A1230] dark:text-rose-400 dark:ring-rose-500/20 dark:hover:bg-rose-500/10 ${focusRing}`}
            >
              <X size={15} />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onOpen}
          className={`inline-flex items-center gap-1 rounded-lg bg-[#0F2340] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#1A2F4A] dark:bg-[#16B8B1] dark:text-[#0F2340] dark:hover:bg-[#0F9691] ${focusRing}`}
        >
          Dossier <ChevronRight size={13} />
        </button>
      </div>
    </li>
  );
}

/* ============================================
   Tiroir de dossier
============================================ */
function Panel({ title, icon: Icon, children }) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#0F2340] dark:text-slate-100">
        {Icon && <Icon size={14} className="text-slate-400" />}
        {title}
      </h3>
      {children}
    </section>
  );
}

function ContactLink({ href, icon: Icon, children }) {
  return (
    <a
      href={href}
      className="flex items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 transition hover:border-[#16B8B1] hover:bg-[#16B8B1]/5 hover:text-[#0F9691] dark:border-white/10 dark:text-slate-300 dark:hover:bg-[#16B8B1]/10"
    >
      <Icon size={14} className="shrink-0 text-[#16B8B1]" />
      <span className="break-all">{children}</span>
    </a>
  );
}

function DocLink({ href, icon: Icon, title, subtitle, action }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-[#16B8B1]/50 hover:bg-[#16B8B1]/5 dark:border-white/10 dark:hover:bg-[#16B8B1]/10"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#16B8B1]/10 text-[#0F9691] dark:bg-[#16B8B1]/20 dark:text-[#16B8B1]">
          <Icon size={16} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#0F2340] dark:text-slate-100">{title}</p>
          <p className="truncate text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
      <span className="shrink-0 text-slate-300 transition group-hover:text-[#16B8B1]">{action}</span>
    </a>
  );
}

function Drawer({ app, onClose, onMove, onNotesSaved, showToast }) {
  const user = app.profile?.user;
  const name = user?.name || "Candidat";
  const cfg = STATUS[app.status] || STATUS.sent;
  const rejected = app.status === "rejected";
  const interviewDate = toDate(app.interview_at);
  const letter = app.cover_letter || "";
  const longLetter = letter.length > 420;

  const [notes, setNotes] = useState(app.recruiter_notes || "");
  const [saving, setSaving] = useState(false);
  const [notesError, setNotesError] = useState("");
  const [fullLetter, setFullLetter] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const saveNotes = async () => {
    setSaving(true);
    setNotesError("");
    try {
      await api.patch(`/applications/${app.id}/status`, {
        status: app.status,
        recruiter_notes: notes,
      });
      onNotesSaved(app.id, notes);
      showToast("Notes enregistrées", "success");
    } catch (err) {
      setNotesError(err.response?.data?.message || "Impossible d’enregistrer les notes.");
    } finally {
      setSaving(false);
    }
  };

  const canSchedule = ["sent", "viewed", "shortlisted"].includes(app.status);

  return (
    <div className="fixed inset-0 z-50 font-['Plus_Jakarta_Sans',sans-serif]" role="dialog" aria-modal="true" aria-label={`Dossier de ${name}`}>
      <div className="oa-fade absolute inset-0 bg-[#0F2340]/50 backdrop-blur-[2px]" onClick={onClose} />

      <aside className="oa-slide absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-white shadow-2xl dark:bg-[#131E47]">
        {/* En-tête */}
        <div className="flex items-start gap-4 border-b border-slate-100 p-6 dark:border-white/10">
          <Avatar name={name} user={user} profile={app.profile} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold text-[#0F2340] dark:text-white">{name}</h2>
            {app.profile?.headline && app.profile.headline.toLowerCase() !== name.toLowerCase() && (
              <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">{app.profile.headline}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusPill status={app.status} />
              <span className="text-xs text-slate-400">Reçue le {formatDate(app.created_at)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer les détails"
            className={`rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200 ${focusRing}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Corps */}
        <div className="flex-1 space-y-7 overflow-y-auto p-6">
          <Panel title="Progression">
            {rejected ? (
              <p className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20">
                <X size={16} /> Cette candidature a été refusée.
              </p>
            ) : (
              <ol className="flex">
                {STEPS.map((s, i) => {
                  const st = STATUS[s];
                  const done = st.step <= cfg.step;
                  const current = s === app.status;
                  const Icon = st.icon;
                  return (
                    <li key={s} className="min-w-0 flex-1">
                      <div className="flex items-center">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            done ? "bg-[#16B8B1] text-[#0F2340]" : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500"
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
          </Panel>

          {app.status === "interview" && interviewDate && (
            <section className="flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3.5 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:ring-amber-500/20">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm dark:bg-[#0A1230]">
                <Calendar size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-400">Entretien programmé</p>
                <p className="mt-0.5 text-sm font-bold capitalize text-[#0F2340] dark:text-slate-100">
                  {interviewDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} à {fmtTime(app.interview_at)}
                </p>
                {app.interview_link && (
                  <a
                    href={app.interview_link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-amber-700"
                  >
                    Rejoindre <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </section>
          )}

          <Panel title="Contact">
            <div className="space-y-2">
              {user?.email && <ContactLink href={`mailto:${user.email}`} icon={Mail}>{user.email}</ContactLink>}
              {user?.phone && <ContactLink href={`tel:${user.phone}`} icon={Phone}>{user.phone}</ContactLink>}
              {!user?.email && !user?.phone && (
                <p className="text-sm text-slate-400">Aucune information de contact disponible.</p>
              )}
            </div>
          </Panel>

          <Panel title="Documents joints">
            <div className="space-y-2">
              {app.portfolio && (
                <DocLink
                  href={`/portfolio/${app.portfolio.public_slug}`}
                  icon={Briefcase}
                  title="Portfolio"
                  subtitle={app.portfolio.title || "Voir le portfolio"}
                  action={<ExternalLink size={14} />}
                />
              )}
              {app.cv_path && (
                <DocLink
                  href={`/storage/${app.cv_path}`}
                  icon={FileText}
                  title="CV"
                  subtitle="Consulter le document"
                  action={<Download size={14} />}
                />
              )}
              {!app.portfolio && !app.cv_path && <p className="text-sm text-slate-400">Aucun document joint.</p>}
            </div>
          </Panel>

          {letter && (
            <Panel title="Lettre de motivation">
              <p
                className={`whitespace-pre-line rounded-xl bg-[#F3F6FC] p-4 text-sm leading-6 text-slate-600 dark:bg-white/5 dark:text-slate-300 ${
                  longLetter && !fullLetter ? "max-h-40 overflow-hidden" : ""
                }`}
              >
                {letter}
              </p>
              {longLetter && (
                <button
                  type="button"
                  onClick={() => setFullLetter((v) => !v)}
                  className="mt-2 text-xs font-bold text-[#0F9691] hover:underline dark:text-[#16B8B1]"
                >
                  {fullLetter ? "Réduire" : "Lire la suite"}
                </button>
              )}
            </Panel>
          )}

          <Panel title="Notes internes" icon={StickyNote}>
            <p className="mb-3 text-xs leading-5 text-slate-400">Visibles uniquement par votre équipe de recrutement.</p>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ajoutez vos observations sur ce candidat…"
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#16B8B1] focus:ring-4 focus:ring-[#16B8B1]/10 dark:border-white/10 dark:bg-[#0A1230] dark:text-slate-100"
            />
            {notesError && <p className="mt-2 text-xs text-rose-600">{notesError}</p>}
            {notes !== (app.recruiter_notes || "") && (
              <button
                type="button"
                onClick={saveNotes}
                disabled={saving}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#16B8B1] px-4 py-2.5 text-sm font-bold text-[#0F2340] transition hover:bg-[#0F9691] disabled:opacity-50"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {saving ? "Enregistrement…" : "Enregistrer les notes"}
              </button>
            )}
          </Panel>
        </div>

        {/* Actions */}
        <div className="space-y-2 border-t border-slate-100 bg-[#F3F6FC]/50 p-4 dark:border-white/10 dark:bg-white/5">
          {canSchedule && (
            <button
              type="button"
              onClick={() => onMove(app, "interview")}
              className={`flex w-full items-center justify-center gap-2 rounded-xl bg-[#16B8B1] px-4 py-3 text-sm font-bold text-[#0F2340] shadow-sm transition hover:bg-[#0F9691] ${focusRing}`}
            >
              <Video size={16} /> Proposer un entretien
            </button>
          )}
          <div className="grid grid-cols-2 gap-2">
            {ACTIONS.map(({ key, label, icon: Icon, tone }) => {
              const hidden =
                (key === "viewed" && app.status !== "sent") ||
                (key === "shortlisted" && !["sent", "viewed"].includes(app.status));
              if (hidden) return null;
              const disabled = app.status === key;
              const tones = {
                ok: "text-[#0F9691] hover:bg-[#16B8B1]/10 dark:text-[#16B8B1] dark:hover:bg-[#16B8B1]/20",
                no: "text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10",
                undefined: "text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-white/10",
              };
              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => onMove(app, key)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold ring-1 ring-slate-200 transition disabled:cursor-not-allowed disabled:opacity-40 dark:ring-white/10 ${tones[tone]} ${focusRing}`}
                >
                  <Icon size={15} /> {label}
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ============================================
   Confirmation de refus
============================================ */
function RejectDialog({ name, busy, onCancel, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div
      className="oa-fade fixed inset-0 z-[60] flex items-center justify-center bg-[#0F2340]/60 p-4 backdrop-blur-sm font-['Plus_Jakarta_Sans',sans-serif]"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="reject-title"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#131E47]">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
          <X size={20} />
        </span>
        <h2 id="reject-title" className="mt-4 text-base font-bold text-[#0F2340] dark:text-white">
          Refuser cette candidature ?
        </h2>
        <p className="mt-1.5 text-sm leading-6 text-slate-500 dark:text-slate-400">
          La candidature de {name} sera marquée comme refusée.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-white/10 ${focusRing}`}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-60 ${focusRing}`}
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />} Refuser
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   États vide / chargement
============================================ */
function Empty({ icon: Icon, title, text }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-white/10 dark:bg-[#131E47]">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#16B8B1]/10 text-[#16B8B1] ring-8 ring-[#16B8B1]/5 dark:bg-[#16B8B1]/20 dark:ring-[#16B8B1]/10">
        <Icon size={24} />
      </span>
      <h3 className="mt-5 text-base font-bold text-[#0F2340] dark:text-white">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1400px] space-y-5 py-2 font-['Plus_Jakarta_Sans',sans-serif]" aria-busy="true">
        <div className="h-16 w-80 animate-pulse rounded-xl bg-slate-200 dark:bg-white/10" />
        <div className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#131E47]" />
        <div className="grid auto-cols-[minmax(264px,1fr)] grid-flow-col gap-3 overflow-hidden">
          {[0, 1, 2, 3].map((c) => (
            <div key={c} className="animate-pulse space-y-2 rounded-2xl bg-[#F3F6FC]/70 p-2 dark:bg-white/5">
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
        <div className="flex items-center justify-center gap-2 py-3 text-sm text-slate-400">
          <Loader2 size={17} className="animate-spin text-[#16B8B1]" /> Chargement des candidatures…
        </div>
      </div>
    </AppShell>
  );
}

/* ============================================
   Page
============================================ */
export default function OfferApplications() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState("board");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [interviewModal, setInterviewModal] = useState(null);
  const [pendingReject, setPendingReject] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);

  const { toast, show: showToast, close: closeToast } = useToast();

  const load = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await api.get(`/job-offers/${id}/applications`);
        setData(res.data);
      } catch (err) {
        console.error("Erreur de chargement des candidatures :", err);
        showToast("Impossible de charger les candidatures", "error");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, showToast]
  );

  useEffect(() => {
    load();
  }, [load]);

  const applications = useMemo(
    () => (Array.isArray(data?.applications) ? data.applications : []),
    [data]
  );

  const counts = useMemo(() => {
    const total = applications.length;
    const by = (s) => applications.filter((a) => a.status === s).length;
    const result = { total };
    ORDER.forEach((s) => (result[s] = by(s)));
    result.todo = result.sent + result.viewed;
    result.progress = result.shortlisted + result.interview;
    result.done = result.accepted + result.rejected;
    result.all = total;
    result.rate = total ? Math.round((result.accepted / total) * 100) : 0;
    return result;
  }, [applications]);

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter((a) => {
      const haystack = [
        a.profile?.user?.name, a.profile?.user?.email, a.profile?.headline, a.profile?.company_name,
      ].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [applications, query]);

  const visibleStatuses = filter === "all" ? ORDER : GROUPS[filter];
  const visible = useMemo(
    () => searched.filter((a) => visibleStatuses.includes(a.status)),
    [searched, visibleStatuses]
  );

  const dragApp = applications.find((a) => a.id === dragId);
  const selected = applications.find((a) => a.id === selectedId);

  const patchLocal = (applicationId, patch) =>
    setData((d) =>
      d
        ? { ...d, applications: (d.applications || []).map((a) => (a.id === applicationId ? { ...a, ...patch } : a)) }
        : d
    );

  const patchStatus = (applicationId, status) =>
    api.patch(`/applications/${applicationId}/status`, { status });

  const updateStatus = async (applicationId, status) => {
    const previous = applications.find((a) => a.id === applicationId)?.status;
    if (status !== "accepted") patchLocal(applicationId, { status });

    try {
      const res = await patchStatus(applicationId, status);

      if (status === "accepted") {
        showToast("Candidature acceptée, la mission a été créée !", "success");
        const missionId = res.data?.mission_id;
        setTimeout(() => navigate(missionId ? `/missions/${missionId}` : "/missions"), 1500);
      } else {
        showToast("Statut mis à jour", "success");
        load(true);
      }
    } catch (err) {
      if (previous) patchLocal(applicationId, { status: previous });
      showToast(err.response?.data?.message || "Le changement de statut a échoué", "error");
    }
  };

  const moveTo = (app, status) => {
    if (status === "interview") {
      setSelectedId(null);
      return setInterviewModal(app);
    }
    if (status === "rejected") return setPendingReject(app);
    if (status === "accepted") setSelectedId(null);
    return updateStatus(app.id, status);
  };

  const confirmReject = async () => {
    setRejecting(true);
    try {
      await patchStatus(pendingReject.id, "rejected");
      setPendingReject(null);
      setSelectedId(null);
      showToast("Candidature refusée", "info");
      load(true);
    } catch (err) {
      showToast(err.response?.data?.message || "Impossible de refuser cette candidature", "error");
    } finally {
      setRejecting(false);
    }
  };

  const handleDrop = (status) => {
    setOverCol(null);
    if (dragApp && canDrop(dragApp, status)) moveTo(dragApp, status);
    setDragId(null);
  };

  if (loading) return <LoadingState />;

  if (!data) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl py-10 font-['Plus_Jakarta_Sans',sans-serif]">
          <div className={`${card} p-10 text-center`}>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/5">
              <Users size={26} />
            </div>
            <h1 className="mt-4 text-lg font-bold text-[#0F2340] dark:text-slate-100">
              Impossible de charger les candidatures
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Vérifiez votre connexion, puis réessayez de charger cette offre.
            </p>
            <button
              type="button"
              onClick={() => load()}
              className={`mt-5 inline-flex items-center gap-2 rounded-xl bg-[#16B8B1] px-4 py-2.5 text-sm font-bold text-[#0F2340] transition hover:bg-[#0F9691] ${focusRing}`}
            >
              <RefreshCw size={15} /> Réessayer
            </button>
          </div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      </AppShell>
    );
  }

  const offer = data.job_offer || {};

  return (
    <AppShell>
      <style>{CSS}</style>

      <div className="mx-auto max-w-[1400px] space-y-5 py-2 font-['Plus_Jakarta_Sans',sans-serif]">
        {/* ============ EN-TÊTE ============ */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={() => navigate("/my-offers")}
              aria-label="Retour à mes offres"
              className={`mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-[#16B8B1] hover:bg-[#16B8B1]/5 hover:text-[#0F9691] dark:border-white/10 dark:bg-[#131E47] dark:text-slate-300 dark:hover:bg-[#16B8B1]/10 ${focusRing}`}
            >
              <ArrowLeft size={17} />
            </button>
            <div className="min-w-0">
              <h1 className="break-words text-2xl font-extrabold tracking-tight text-[#0F2340] dark:text-white sm:text-3xl">
                {offer.title || "Candidatures de l’offre"}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                {offer.company?.name && (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 size={14} className="text-slate-400" /> {offer.company.name}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Users size={14} className="text-slate-400" />
                  {counts.total} candidature{counts.total > 1 ? "s" : ""} reçue{counts.total > 1 ? "s" : ""}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-[#131E47]"
              role="group"
              aria-label="Affichage"
            >
              <ViewButton active={view === "board"} onClick={() => setView("board")} icon={LayoutGrid} label="Pipeline" />
              <ViewButton active={view === "list"} onClick={() => setView("list")} icon={ListIcon} label="Liste" />
            </div>
            <button
              type="button"
              onClick={() => load(true)}
              disabled={refreshing}
              className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-[#16B8B1] hover:text-[#0F9691] disabled:opacity-50 dark:border-white/10 dark:bg-[#131E47] dark:text-slate-200 dark:hover:text-[#16B8B1] ${focusRing}`}
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Actualiser
            </button>
          </div>
        </header>

        {/* ============ ENTONNOIR ============ */}
        <section className={`${card} p-5 sm:p-6`}>
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-bold text-[#0F2340] dark:text-white">Où en sont vos candidats</p>
              <FunnelBar counts={counts} />
            </div>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4 lg:min-w-[520px]">
              <Stat label="À traiter" value={counts.todo} accent={counts.todo > 0 ? "!text-[#0F9691] dark:!text-[#16B8B1]" : ""} />
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
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-bold transition ${focusRing} ${
                    active
                      ? "bg-[#0F2340] text-white shadow-sm dark:bg-[#16B8B1] dark:text-[#0F2340]"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-[#0F2340] hover:ring-[#16B8B1]/50 dark:bg-[#131E47] dark:text-slate-300 dark:ring-white/10 dark:hover:text-white"
                  }`}
                >
                  {t.label}
                  <span
                    className={`rounded-full px-1.5 text-xs tabular-nums ${
                      active ? "bg-white/20 text-white dark:bg-[#0F2340]/10 dark:text-[#0F2340]" : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"
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
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un nom ou un e-mail"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-[#16B8B1] focus:outline-none focus:ring-4 focus:ring-[#16B8B1]/10 dark:border-white/10 dark:bg-[#0A1230] dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </label>
        </div>

        {/* ============ CONTENU ============ */}
        {applications.length === 0 ? (
          <Empty
            icon={Users}
            title="Aucune candidature pour l’instant"
            text="Dès qu’un candidat postule à cette offre, il apparaît ici et vous pouvez le faire avancer dans le pipeline."
          />
        ) : searched.length === 0 ? (
          <Empty
            icon={Search}
            title="Aucun résultat"
            text="Aucun candidat ne correspond à votre recherche. Essayez un autre nom ou e-mail."
          />
        ) : view === "board" ? (
          <>
            <div className="grid auto-cols-[minmax(264px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-3">
              {visibleStatuses.map((status) => (
                <Column
                  key={status}
                  status={status}
                  items={searched.filter((a) => a.status === status)}
                  dragApp={dragApp}
                  draggingId={dragId}
                  isOver={overCol === status}
                  onOver={setOverCol}
                  onDropTo={handleDrop}
                  onOpen={setSelectedId}
                  onDragStart={(app) => setDragId(app.id)}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverCol(null);
                  }}
                />
              ))}
            </div>
            <p className="hidden text-center text-xs text-slate-400 md:block">
              Glissez une carte vers une colonne pour faire avancer un candidat, ou ouvrez-la pour voir tout son dossier.
            </p>
          </>
        ) : visible.length === 0 ? (
          <Empty
            icon={Inbox}
            title="Aucune candidature dans cette catégorie"
            text="Modifiez le filtre ou la recherche pour afficher d’autres candidats."
          />
        ) : (
          <div className={`${card} overflow-hidden`}>
            <div className="hidden grid-cols-[2.4fr_1.2fr_1fr_1.2fr_auto] gap-4 border-b border-slate-100 bg-[#F3F6FC]/70 px-5 py-3 text-xs font-bold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 md:grid">
              <span>Candidat</span>
              <span>Statut</span>
              <span>Reçue</span>
              <span>Documents</span>
              <span className="w-[172px] text-right">Actions</span>
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-white/5">
              {visible.map((app) => (
                <ListRow key={app.id} app={app} onOpen={() => setSelectedId(app.id)} onMove={moveTo} />
              ))}
            </ul>
          </div>
        )}
      </div>

      {selected && (
        <Drawer
          key={selected.id}
          app={selected}
          onClose={() => setSelectedId(null)}
          onMove={moveTo}
          onNotesSaved={(appId, notes) => patchLocal(appId, { recruiter_notes: notes })}
          showToast={showToast}
        />
      )}

      {interviewModal && (
        <ScheduleInterviewModal
          application={interviewModal}
          onClose={() => setInterviewModal(null)}
          onSuccess={() => {
            setInterviewModal(null);
            showToast("Entretien programmé et invitation envoyée", "success");
            load(true);
          }}
        />
      )}

      {pendingReject && (
        <RejectDialog
          name={pendingReject.profile?.user?.name || "ce candidat"}
          busy={rejecting}
          onCancel={() => setPendingReject(null)}
          onConfirm={confirmReject}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </AppShell>
  );
}