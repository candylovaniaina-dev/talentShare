import React, { useEffect, useRef, useState } from "react";
import {
  History,
  MessageSquare,
  Eye,
  Sparkles,
  Handshake,
  CheckCircle,
  Target,
  XCircle,
  Clock,
  UserPlus,
  AlertCircle,
  FileText,
  Video,
  UserCheck,
  Heart,
  MessageCircle,
  Inbox,
  LoaderCircle,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

/* ============================================================
   CONFIG ICÔNES
============================================================ */
const ICONS = {
  new_message: { icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-500" },
  resource_offer_published: { icon: Sparkles, color: "text-violet-600", bg: "bg-violet-500" },
  offer_viewed: { icon: Eye, color: "text-amber-600", bg: "bg-amber-500" },
  offer_contacted: { icon: Handshake, color: "text-teal-600", bg: "bg-teal-500" },
  proposal_accepted: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-500" },
  proposal_declined: { icon: XCircle, color: "text-rose-600", bg: "bg-rose-500" },
  talent_available: { icon: Sparkles, color: "text-teal-600", bg: "bg-teal-500" },
  mission_pending_approval: { icon: Target, color: "text-amber-600", bg: "bg-amber-500" },
  mission_created_pending: { icon: Target, color: "text-blue-600", bg: "bg-blue-500" },
  mission_accepted: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-500" },
  mission_declined: { icon: XCircle, color: "text-rose-600", bg: "bg-rose-500" },
  availability_expiring: { icon: Clock, color: "text-amber-600", bg: "bg-amber-500" },
  saved_search_match: { icon: Sparkles, color: "text-blue-600", bg: "bg-blue-500" },
  resource_request_published: { icon: Target, color: "text-emerald-600", bg: "bg-emerald-500" },
  resource_request_matched: { icon: UserPlus, color: "text-blue-600", bg: "bg-blue-500" },
  resource_request_expiring: { icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-500" },
  resource_request_closed: { icon: FileText, color: "text-slate-600", bg: "bg-slate-500" },
  proposal_received: { icon: FileText, color: "text-blue-600", bg: "bg-blue-500" },
  proposal_expired: { icon: AlertCircle, color: "text-slate-600", bg: "bg-slate-500" },
  new_application: { icon: FileText, color: "text-emerald-600", bg: "bg-emerald-500" },
  application_viewed: { icon: Eye, color: "text-blue-600", bg: "bg-blue-500" },
  application_shortlisted: { icon: UserCheck, color: "text-violet-600", bg: "bg-violet-500" },
  application_interview: { icon: Video, color: "text-amber-600", bg: "bg-amber-500" },
  application_accepted: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-500" },
  application_rejected: { icon: XCircle, color: "text-rose-600", bg: "bg-rose-500" },
  offer_liked: { icon: Heart, color: "text-rose-600", bg: "bg-rose-500" },
  offer_commented: { icon: MessageCircle, color: "text-blue-600", bg: "bg-blue-500" },
  default: { icon: History, color: "text-slate-600", bg: "bg-slate-500" },
};

const API_BASE = "http://localhost:8001";
const STORAGE_URL = `${API_BASE}/storage`;

/* ============================================================
   FILTRES
============================================================ */
const FILTERS = [
  { key: "all", label: "Tout", types: null },
  { key: "applications", label: "Candidatures", types: [
    "new_application", "application_viewed", "application_shortlisted",
    "application_interview", "application_accepted", "application_rejected",
  ]},
  { key: "missions", label: "Missions", types: [
    "mission_pending_approval", "mission_created_pending",
    "mission_accepted", "mission_declined", "proposal_accepted",
    "proposal_declined", "proposal_received", "proposal_expired",
  ]},
  { key: "messages", label: "Messages", types: ["new_message"] },
  { key: "social", label: "Interactions", types: ["offer_liked", "offer_commented"] },
];

/* ============================================================
   HELPERS
============================================================ */
function formatTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildImageUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  return `${STORAGE_URL}/${pathOrUrl}`;
}

/* ============================================================
   AVATAR
============================================================ */
function ActorAvatar({ actor, size = 40, typeConfig }) {
  const [error, setError] = useState(false);
  const Icon = typeConfig.icon;

  const initials = actor?.name
    ? actor.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : null;

  const imageUrl = buildImageUrl(actor?.avatar_path);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {imageUrl && !error ? (
        <img
          src={imageUrl}
          alt={actor?.name || ""}
          onError={() => setError(true)}
          className="h-full w-full rounded-full border border-slate-200 object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
          {initials || <Icon size={15} />}
        </div>
      )}
      <span
        className={`absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white ${typeConfig.bg} text-white shadow-sm`}
      >
        <Icon size={8} strokeWidth={2.5} />
      </span>
    </div>
  );
}

/* ============================================================
   COMPOSANT PRINCIPAL
============================================================ */
export default function ActivityHistory() {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const ref = useRef(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/notifications/history");
      setHistory(res.data?.history || []);
    } catch {
      setError("Impossible de charger l'historique.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && history.length === 0) {
      load();
    }
  }, [open]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onEscape = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const handleClick = (item) => {
    if (!item.action_url) return;
    setOpen(false);
    navigate(item.action_url);
  };

  /* Applique le filtre actif */
  const filterConfig = FILTERS.find((f) => f.key === activeFilter);
  const filteredHistory = history
    .map((group) => ({
      ...group,
      items: filterConfig?.types
        ? group.items.filter((it) => filterConfig.types.includes(it.type))
        : group.items,
    }))
    .filter((group) => group.items.length > 0);

  const totalItems = filteredHistory.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="relative" ref={ref}>
      {/* BOUTON */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Historique d'activité"
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition ${
          open
            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
            : "border-[#E4EBF1] text-[#526B83] hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
        }`}
      >
        <History size={19} strokeWidth={1.9} />
      </button>

      {/* PANNEAU */}
      {open && (
        <section className="absolute right-0 top-full z-50 mt-2 flex max-h-[min(620px,calc(100vh-100px))] w-[min(440px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.25)]">

          {/* HEADER */}
          <div className="border-b border-slate-100 px-4 py-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-[#102A43]">Historique</h2>
              <span className="text-[11px] font-medium text-slate-400">
                {totalItems} action{totalItems > 1 ? "s" : ""}
              </span>
            </div>

            {/* FILTRES */}
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition ${
                    activeFilter === f.key
                      ? "bg-[#102A43] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* CONTENU */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {error && (
              <div className="mx-4 mt-3 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs text-rose-700">
                <p>{error}</p>
                <button onClick={load} className="mt-2 font-bold underline">
                  Réessayer
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-14">
                <LoaderCircle size={24} className="animate-spin text-emerald-500" />
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Inbox size={24} strokeWidth={1.5} />
                </span>
                <h3 className="mt-3 text-[14px] font-bold text-[#102A43]">
                  Aucun élément
                </h3>
                <p className="mx-auto mt-1 max-w-[240px] text-[12px] text-slate-500">
                  Aucune action ne correspond à ce filtre.
                </p>
              </div>
            ) : (
              <div>
                {filteredHistory.map((group) => (
                  <div key={group.date}>
                    {/* SÉPARATEUR DATE */}
                    <div className="sticky top-0 z-10 flex items-center gap-2 bg-slate-50/95 px-4 py-2 backdrop-blur-sm">
                      <Calendar size={12} className="text-slate-400" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 capitalize">
                        {group.label}
                      </span>
                    </div>

                    {/* ITEMS */}
                    {group.items.map((item) => {
                      const cfg = ICONS[item.type] || ICONS.default;
                      const clickable = Boolean(item.action_url);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleClick(item)}
                          disabled={!clickable}
                          className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${
                            clickable
                              ? "cursor-pointer hover:bg-slate-50"
                              : "cursor-default"
                          }`}
                        >
                          {/* Heure à gauche */}
                          <span className="mt-1 w-[42px] shrink-0 text-[11px] font-semibold text-slate-400">
                            {formatTime(item.created_at)}
                          </span>

                          {/* Photo acteur + badge */}
                          <ActorAvatar
                            actor={item.actor}
                            typeConfig={cfg}
                            size={36}
                          />

                          {/* Texte */}
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold leading-snug text-slate-900">
                              {item.title}
                            </p>
                            {item.body && (
                              <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-slate-500">
                                {item.body}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5">
            <button
              onClick={load}
              className="w-full rounded-lg py-1.5 text-[11.5px] font-semibold text-[#0F9691] transition hover:bg-[#E6FAF6]"
            >
              Actualiser
            </button>
          </div>
        </section>
      )}
    </div>
  );
}