import React, { useEffect, useRef, useState } from "react";
import {
  Bell,
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
  CheckCheck,
  Inbox,
  LoaderCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

/* ============================================================
   CONFIG ICÔNES / BADGES
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

  default: { icon: Bell, color: "text-slate-600", bg: "bg-slate-500" },
};

const API_BASE = "http://localhost:8001";
const STORAGE_URL = `${API_BASE}/storage`;

/* ============================================================
   HELPERS
============================================================ */
function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function buildImageUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  return `${STORAGE_URL}/${pathOrUrl}`;
}

function getNotificationData(payload) {
  const data = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.notifications)
      ? payload.notifications
      : [];

  const unread =
    !Array.isArray(payload) && payload?.unread_count != null
      ? payload.unread_count
      : data.filter((n) => !n.read_at).length;

  return { data, unread };
}

/* ============================================================
   AVATAR ACTEUR (photo OU initiales)
============================================================ */
function ActorAvatar({ actor, size = 48, typeConfig, isUnread }) {
  const [error, setError] = useState(false);
  const Icon = typeConfig.icon;
  const badgeBg = typeConfig.bg;

  const initials = actor?.name
    ? actor.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : null;

  const imageUrl = buildImageUrl(actor?.avatar_path);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {/* Photo ou initiales */}
      {imageUrl && !error ? (
        <img
          src={imageUrl}
          alt={actor?.name || ""}
          onError={() => setError(true)}
          className="h-full w-full rounded-full border border-slate-200 object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#16B8B1] to-[#0F9691] text-sm font-bold text-white">
          {initials || "?"}
        </div>
      )}

      {/* Badge icône en coin */}
      <span
        className={`absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white ${badgeBg} text-white shadow-sm`}
      >
        <Icon size={10} strokeWidth={2.5} />
      </span>

      {/* Point bleu (non lu) */}
      {isUnread && (
        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-blue-500" />
      )}
    </div>
  );
}

/* ============================================================
   COMPOSANT PRINCIPAL
============================================================ */
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef(null);
  const navigate = useNavigate();

  const load = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await api.get("/notifications");
      const { data, unread } = getNotificationData(res.data);
      setItems(data);
      setUnreadCount(unread);
      setError("");
    } catch {
      setError("Impossible de charger les notifications.");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
    const interval = setInterval(() => load(), 15000);
    return () => clearInterval(interval);
  }, []);

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

  const markRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setItems((cur) =>
        cur.map((it) =>
          it.id === id ? { ...it, read_at: it.read_at || new Date().toISOString() } : it
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      return true;
    } catch {
      return false;
    }
  };

  const markAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await api.post("/notifications/read-all");
      const now = new Date().toISOString();
      setItems((cur) => cur.map((it) => ({ ...it, read_at: it.read_at || now })));
      setUnreadCount(0);
      setError("");
    } catch {
      setError("Impossible de marquer tout comme lu.");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleClick = async (n) => {
    if (!n.action_url) return;
    if (!n.read_at) await markRead(n.id);
    setOpen(false);

    if (n.action_url.includes("#")) {
      const [path, hash] = n.action_url.split("#");
      navigate(path || "/");
      window.setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-2", "ring-[#16B8B1]", "rounded-xl");
          window.setTimeout(() => {
            el.classList.remove("ring-2", "ring-[#16B8B1]", "rounded-xl");
          }, 2500);
        }
      }, 800);
    } else {
      navigate(n.action_url);
    }
  };

  return (
    <div className="relative" ref={ref}>
      {/* BOUTON CLOCHE */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} non lues` : ""}`}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-all ${
          open
            ? "bg-[#E6FAF6] text-[#0F9691]"
            : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        <Bell size={20} strokeWidth={1.9} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* PANNEAU */}
      {open && (
        <section
          className="absolute right-0 top-full z-50 mt-2 flex max-h-[min(620px,calc(100vh-100px))] w-[min(400px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.25)]"
        >
          {/* HEADER style Facebook */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-[20px] font-bold text-[#102A43]">Notifications</h2>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                disabled={markingAll}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-[#0F9691] transition hover:bg-[#E6FAF6] disabled:opacity-50"
              >
                {markingAll ? (
                  <LoaderCircle size={13} className="animate-spin" />
                ) : (
                  <CheckCheck size={13} />
                )}
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* CONTENU */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {error && (
              <div className="mx-3 mt-3 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs text-rose-700">
                <p>{error}</p>
                <button
                  onClick={() => load(true)}
                  className="mt-2 font-bold underline"
                >
                  Réessayer
                </button>
              </div>
            )}

            {loading ? (
              <div className="space-y-4 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex animate-pulse gap-3">
                    <div className="h-12 w-12 shrink-0 rounded-full bg-slate-100" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 w-3/4 rounded bg-slate-100" />
                      <div className="h-3 w-full rounded bg-slate-100" />
                      <div className="h-2.5 w-1/3 rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Inbox size={28} strokeWidth={1.5} />
                </span>
                <h3 className="mt-4 text-sm font-bold text-[#102A43]">
                  Rien de nouveau
                </h3>
                <p className="mx-auto mt-1.5 max-w-[230px] text-xs leading-5 text-slate-500">
                  Vos nouvelles activités apparaîtront ici.
                </p>
              </div>
            ) : (
              <div>
                {items.map((n) => {
                  const cfg = ICONS[n.type] || ICONS.default;
                  const isUnread = !n.read_at;
                  const clickable = Boolean(n.action_url);
                  const actor = n.actor;

                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleClick(n)}
                      disabled={!clickable}
                      className={`flex w-full items-start gap-3 px-3 py-3 text-left transition ${
                        clickable ? "cursor-pointer hover:bg-slate-50" : "cursor-default"
                      } ${isUnread ? "bg-[#E7F3FF]/40 hover:bg-[#E7F3FF]/60" : "bg-white"}`}
                    >
                      {/* Photo acteur + badge */}
                      <ActorAvatar
                        actor={actor}
                        size={48}
                        typeConfig={cfg}
                        isUnread={isUnread}
                      />

                      {/* Contenu texte */}
                      <div className="min-w-0 flex-1">
                        {/* Ligne principale : nom en gras + action */}
                        <p className="text-[14px] leading-[1.35] text-[#050505]">
                          {actor?.name && (
                            <strong className="font-semibold text-[#050505]">
                              {actor.name}
                            </strong>
                          )}{" "}
                          <span className={isUnread ? "font-normal text-[#050505]" : "text-[#65676B]"}>
                            {n.title}
                          </span>
                        </p>

                        {/* Extrait body */}
                        {n.body && (
                          <p className="mt-0.5 line-clamp-2 text-[13px] leading-[1.35] text-[#65676B]">
                            {n.body}
                          </p>
                        )}

                        {/* Timestamp + point bleu */}
                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={`text-[12px] font-semibold ${
                              isUnread ? "text-[#0866FF]" : "text-[#65676B]"
                            }`}
                          >
                            {formatRelativeTime(n.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Point bleu côté droit (style FB) */}
                      {isUnread && (
                        <span className="mt-2 h-3 w-3 shrink-0 rounded-full bg-[#0866FF]" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2.5">
            <span className="text-[11px] font-medium text-slate-400">
              Mis à jour automatiquement
            </span>
            <button
              onClick={() => load(true)}
              className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-[#0F9691] transition hover:bg-[#E6FAF6]"
            >
              Actualiser
            </button>
          </div>
        </section>
      )}
    </div>
  );
}