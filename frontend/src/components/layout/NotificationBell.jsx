
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
  ArrowRight,
  CheckCheck,
  Inbox,
  LoaderCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const ICONS = {
  new_message: { icon: MessageSquare, color: "text-blue-700", bg: "bg-blue-50" },
  resource_offer_published: { icon: Sparkles, color: "text-violet-700", bg: "bg-violet-50" },
  offer_viewed: { icon: Eye, color: "text-amber-700", bg: "bg-amber-50" },
  offer_contacted: { icon: Handshake, color: "text-teal-700", bg: "bg-teal-50" },
  proposal_accepted: { icon: CheckCircle, color: "text-emerald-700", bg: "bg-emerald-50" },
  proposal_declined: { icon: XCircle, color: "text-rose-700", bg: "bg-rose-50" },
  talent_available: { icon: Sparkles, color: "text-teal-700", bg: "bg-teal-50" },

  mission_pending_approval: { icon: Target, color: "text-amber-700", bg: "bg-amber-50" },
  mission_created_pending: { icon: Target, color: "text-blue-700", bg: "bg-blue-50" },
  mission_accepted: { icon: CheckCircle, color: "text-emerald-700", bg: "bg-emerald-50" },
  mission_declined: { icon: XCircle, color: "text-rose-700", bg: "bg-rose-50" },

  availability_expiring: { icon: Clock, color: "text-amber-700", bg: "bg-amber-50" },
  saved_search_match: { icon: Sparkles, color: "text-blue-700", bg: "bg-blue-50" },

  resource_request_published: { icon: Target, color: "text-emerald-700", bg: "bg-emerald-50" },
  resource_request_matched: { icon: UserPlus, color: "text-blue-700", bg: "bg-blue-50" },
  resource_request_expiring: { icon: AlertCircle, color: "text-amber-700", bg: "bg-amber-50" },
  resource_request_closed: { icon: FileText, color: "text-slate-600", bg: "bg-slate-100" },

  proposal_received: { icon: FileText, color: "text-blue-700", bg: "bg-blue-50" },
  proposal_expired: { icon: AlertCircle, color: "text-slate-600", bg: "bg-slate-100" },

  new_application: { icon: FileText, color: "text-emerald-700", bg: "bg-emerald-50" },
  application_viewed: { icon: Eye, color: "text-blue-700", bg: "bg-blue-50" },
  application_shortlisted: { icon: UserCheck, color: "text-violet-700", bg: "bg-violet-50" },
  application_interview: { icon: Video, color: "text-amber-700", bg: "bg-amber-50" },
  application_accepted: { icon: CheckCircle, color: "text-emerald-700", bg: "bg-emerald-50" },
  application_rejected: { icon: XCircle, color: "text-rose-700", bg: "bg-rose-50" },

  offer_liked: { icon: Heart, color: "text-rose-700", bg: "bg-rose-50" },
  offer_commented: { icon: MessageCircle, color: "text-blue-700", bg: "bg-blue-50" },

  default: { icon: Bell, color: "text-slate-600", bg: "bg-slate-100" },
};

function formatDate(date) {
  if (!date) return "";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
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
      : data.filter((notification) => !notification.read_at).length;

  return { data, unread };
}

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

    const interval = setInterval(() => {
      load();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const onEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
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
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, read_at: item.read_at || new Date().toISOString() } : item
        )
      );
      setUnreadCount((count) => Math.max(0, count - 1));
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

      setItems((current) =>
        current.map((item) => ({
          ...item,
          read_at: item.read_at || now,
        }))
      );
      setUnreadCount(0);
      setError("");
    } catch {
      setError("Impossible de marquer toutes les notifications comme lues.");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleClick = async (notification) => {
    if (!notification.action_url) return;

    if (!notification.read_at) {
      await markRead(notification.id);
    }

    setOpen(false);

    if (notification.action_url.includes("#")) {
      const [path, hash] = notification.action_url.split("#");
      navigate(path || "/");

      window.setTimeout(() => {
        const element = document.getElementById(hash);

        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("ring-2", "ring-[#16B8A6]", "rounded-xl");

          window.setTimeout(() => {
            element.classList.remove("ring-2", "ring-[#16B8A6]", "rounded-xl");
          }, 2500);
        }
      }, 800);
    } else {
      navigate(notification.action_url);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} non lues` : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
          open
            ? "bg-[#E6FAF6] text-[#0F766E]"
            : "text-slate-500 hover:bg-slate-100 hover:text-[#102A43]"
        }`}
      >
        <Bell size={20} strokeWidth={1.9} />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[9px] font-extrabold text-white shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <section
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-3 flex max-h-[min(590px,calc(100vh-100px))] w-[min(410px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.25)]"
        >
          {/* En-tête */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6FAF6] text-[#0F766E]">
                <Bell size={19} />
              </span>
              <div>
                <h2 className="text-sm font-bold text-[#102A43]">Notifications</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {unreadCount > 0
                    ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
                    : "Vous êtes à jour"}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                disabled={markingAll}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold text-[#0F766E] transition hover:bg-[#E6FAF6] disabled:opacity-50"
              >
                {markingAll ? (
                  <LoaderCircle size={14} className="animate-spin" />
                ) : (
                  <CheckCheck size={14} />
                )}
                <span className="hidden sm:inline">Tout marquer comme lu</span>
                <span className="sm:hidden">Tout lire</span>
              </button>
            )}
          </div>

          {/* Contenu */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {error && (
              <div className="mx-4 mt-3 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs text-rose-700">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => load(true)}
                  className="mt-2 font-bold underline underline-offset-2"
                >
                  Réessayer
                </button>
              </div>
            )}

            {loading ? (
              <div className="space-y-4 p-5">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex animate-pulse gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100" />
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
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F1F5F9] text-slate-400">
                  <Inbox size={29} strokeWidth={1.5} />
                </span>
                <h3 className="mt-4 text-sm font-bold text-[#102A43]">
                  Rien de nouveau
                </h3>
                <p className="mx-auto mt-1.5 max-w-[230px] text-xs leading-5 text-slate-500">
                  Vos nouvelles activités et opportunités apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100/80">
                {items.map((notification) => {
                  const config = ICONS[notification.type] || ICONS.default;
                  const Icon = config.icon;
                  const isUnread = !notification.read_at;
                  const clickable = Boolean(notification.action_url);

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleClick(notification)}
                      disabled={!clickable}
                      className={`group flex w-full gap-3 px-4 py-4 text-left transition sm:px-5 ${
                        clickable ? "cursor-pointer hover:bg-slate-50" : "cursor-default"
                      } ${
                        isUnread
                          ? "bg-[#F0FDFA]/70 hover:bg-[#E6FAF6]/80"
                          : "bg-white"
                      }`}
                    >
                      <span
                        className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.bg} ${config.color}`}
                      >
                        <Icon size={18} strokeWidth={1.9} />
                        {isUnread && (
                          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#16B8A6]" />
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-[13px] leading-5 ${
                            isUnread
                              ? "font-bold text-[#102A43]"
                              : "font-semibold text-slate-700"
                          }`}
                        >
                          {notification.title}
                        </span>

                        {notification.body && (
                          <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500">
                            {notification.body}
                          </span>
                        )}

                        <span className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                          <Clock size={11} />
                          {formatDate(notification.created_at)}
                          {clickable && (
                            <span className="ml-auto inline-flex items-center gap-1 text-[#0F766E] opacity-0 transition group-hover:opacity-100">
                              Ouvrir <ArrowRight size={12} />
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pied de panneau */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-4 py-3">
            <span className="text-[10px] font-medium text-slate-400">
              Mis à jour automatiquement
            </span>
            <button
              type="button"
              onClick={() => load(true)}
              className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-[#0F766E] transition hover:bg-[#E6FAF6]"
            >
              Actualiser
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
