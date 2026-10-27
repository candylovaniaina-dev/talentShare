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
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const ICONS = {
  new_message: { icon: MessageSquare, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500" },
  resource_offer_published: { icon: Sparkles, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500" },
  offer_viewed: { icon: Eye, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500" },
  offer_contacted: { icon: Handshake, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-500" },
  proposal_accepted: { icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500" },
  proposal_declined: { icon: XCircle, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500" },
  talent_available: { icon: Sparkles, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-500" },
  mission_pending_approval: { icon: Target, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500" },
  mission_created_pending: { icon: Target, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500" },
  mission_accepted: { icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500" },
  mission_declined: { icon: XCircle, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500" },
  availability_expiring: { icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500" },
  saved_search_match: { icon: Sparkles, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500" },
  resource_request_published: { icon: Target, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500" },
  resource_request_matched: { icon: UserPlus, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500" },
  resource_request_expiring: { icon: AlertCircle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500" },
  resource_request_closed: { icon: FileText, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-500" },
  proposal_received: { icon: FileText, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500" },
  proposal_expired: { icon: AlertCircle, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-500" },
  new_application: { icon: FileText, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500" },
  application_viewed: { icon: Eye, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500" },
  application_shortlisted: { icon: UserCheck, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500" },
  application_interview: { icon: Video, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500" },
  application_accepted: { icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500" },
  application_rejected: { icon: XCircle, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500" },
  offer_liked: { icon: Heart, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500" },
  offer_commented: { icon: MessageCircle, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500" },
  request_liked: { icon: Heart, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500" },
  request_commented: { icon: MessageCircle, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500" },
  default: { icon: Bell, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-500" },
};

// ⚠️ VÉRIFIE BIEN TON PORT ICI (8000 ou 8001 ?)
const API_BASE = "http://localhost:8001"; 
const STORAGE_URL = `${API_BASE}/storage`;

function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, Math.floor((now - then) / 1000));
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function buildImageUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  return `${STORAGE_URL}/${pathOrUrl.replace(/^\/+/, "")}`;
}

function getNotificationData(payload) {
  const data = Array.isArray(payload) ? payload : Array.isArray(payload?.notifications) ? payload.notifications : [];
  const unread = !Array.isArray(payload) && payload?.unread_count != null ? payload.unread_count : data.filter((notification) => !notification.read_at).length;
  return { data, unread };
}

function ActorAvatar({ actor, size = 48, typeConfig, isUnread }) {
  const [imageError, setImageError] = useState(false);
  const Icon = typeConfig.icon;

  // 1. On cherche la photo
  const imagePath = 
    actor?.avatar_path || 
    actor?.logo_path || 
    actor?.professional_profile?.avatar_path || 
    actor?.professionalProfile?.avatar_path;

  // 2. On construit l'URL de manière robuste (gère les slashs en trop)
  const imageUrl = imagePath
    ? (imagePath.startsWith("http") 
        ? imagePath 
        : `${API_BASE}${imagePath.startsWith("/") ? "" : "/"}${imagePath.startsWith("/storage") ? "" : "storage/"}${imagePath.replace(/^\/?(storage\/)?/, "")}`)
    : null;

  const initials = actor?.name
    ? actor.name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()
    : null;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {imageUrl && !imageError ? (
        <img
          src={imageUrl}
          alt={actor?.name || "Photo de profil"}
          onError={() => setImageError(true)}
          className="h-full w-full rounded-full border border-slate-200 object-cover dark:border-slate-600"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#16B8B1] to-[#0F9691] text-sm font-bold text-white">
          {initials || <Icon size={18} />}
        </div>
      )}

      <span className={`absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-white shadow-sm dark:border-[#112A3A] ${typeConfig.bg}`}>
        <Icon size={10} strokeWidth={2.5} />
      </span>

      {isUnread && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-blue-500 dark:border-[#112A3A]" />}
    </div>
  );
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const ref = useRef(null);
  const navigate = useNavigate();

  const load = async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
      setRefreshing(true);
    }

    try {
      const response = await api.get("/notifications");
      const { data, unread } = getNotificationData(response.data);
      setItems(data);
      setUnreadCount(unread);
      setError("");
    } catch {
      setError("Impossible de charger les notifications.");
    } finally {
      if (showLoader) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    load(true);
    const interval = setInterval(() => load(), 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
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
      setItems((current) => current.map((item) => item.id === id ? { ...item, read_at: item.read_at || new Date().toISOString() } : item));
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
      setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at || now })));
      setUnreadCount(0);
      setError("");
    } catch {
      setError("Impossible de marquer toutes les notifications comme lues.");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleClick = async (notification) => {
    if (!notification.read_at) await markRead(notification.id);
    setOpen(false);

    let url = notification.action_url;

    if (!url) {
      if (notification.type === "resource_request_published") {
        navigate(`/my-activity?tab=home&apply=${notification.subject_id}`);
        return;
      }
      if (notification.type?.includes("request") || notification.type?.includes("offer") || notification.type?.includes("proposal")) {
        url = `/resource-requests/${notification.subject_id}`;
      } else {
        return;
      }
    }

    if (url.startsWith("/resource-requests/")) {
      const id = url.split("/").filter(Boolean).pop();
      navigate("/my-activity?tab=profile", { state: { scrollToRequestId: id, nonce: Date.now() } });
      return;
    }
    navigate(url);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} non lues` : ""}`}
        aria-expanded={open}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/20 ${open ? "bg-[#E6FAF6] text-[#0F9691] dark:bg-teal-400/15 dark:text-teal-300" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"}`}
      >
        <Bell size={20} strokeWidth={1.9} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-bold text-white dark:border-[#112A3A]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <section
          aria-label="Centre de notifications"
          className="absolute right-0 top-full z-50 mt-2 flex max-h-[min(620px,calc(100vh-100px))] w-[min(400px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.25)] dark:border-white/10 dark:bg-[#112A3A] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#112A3A]">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
                <Bell size={18} />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-[#102A43] dark:text-slate-100">Notifications</h2>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Vous êtes à jour"}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                disabled={markingAll}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-teal-300 dark:hover:bg-teal-400/10"
              >
                {markingAll ? <LoaderCircle size={14} className="animate-spin" /> : <CheckCheck size={14} />}
                <span className="hidden sm:inline">Tout marquer comme lu</span>
                <span className="sm:hidden">Tout lire</span>
              </button>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-white dark:bg-[#112A3A]">
            {error && (
              <div className="mx-3 mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300">
                <p>{error}</p>
                <button type="button" onClick={() => load(true)} className="mt-2 font-bold underline underline-offset-2 hover:no-underline">Réessayer</button>
              </div>
            )}

            {loading ? (
              <div className="space-y-4 p-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex animate-pulse gap-3">
                    <div className="h-12 w-12 shrink-0 rounded-full bg-slate-100 dark:bg-white/10" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 w-3/4 rounded bg-slate-100 dark:bg-white/10" />
                      <div className="h-3 w-full rounded bg-slate-100 dark:bg-white/10" />
                      <div className="h-2.5 w-1/3 rounded bg-slate-100 dark:bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/[0.06] dark:text-slate-500">
                  <Inbox size={28} strokeWidth={1.5} />
                </span>
                <h3 className="mt-4 text-sm font-bold text-[#102A43] dark:text-slate-100">Rien de nouveau</h3>
                <p className="mx-auto mt-1.5 max-w-[230px] text-xs leading-5 text-slate-500 dark:text-slate-400">Vos nouvelles activités apparaîtront ici.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {items.map((notification) => {
                  const config = ICONS[notification.type] || ICONS.default;
                  const isUnread = !notification.read_at;
                  const actor = notification.actor;
                  const clickable = Boolean(notification.action_url) || notification.type?.includes("request") || notification.type?.includes("offer");

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleClick(notification)}
                      disabled={!clickable}
                      className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors duration-200 ${clickable ? "cursor-pointer" : "cursor-default"} ${isUnread ? "bg-blue-50/80 hover:bg-blue-50 dark:bg-blue-400/[0.09] dark:hover:bg-blue-400/[0.14]" : "bg-white hover:bg-slate-50 dark:bg-[#112A3A] dark:hover:bg-white/[0.04]"}`}
                    >
                      <ActorAvatar actor={actor} size={44} typeConfig={config} isUnread={isUnread} />

                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] leading-[1.5] text-slate-700 dark:text-slate-200">
                          {notification.type === "resource_request_published" ? (
                            <>
                              <strong className="font-bold text-[#102A43] dark:text-white">{actor?.name || "Un talent"}</strong>{" "}
                              <span className={isUnread ? "font-medium text-slate-800 dark:text-slate-100" : "text-slate-600 dark:text-slate-400"}>
                                a publié la demande : <strong className="text-slate-900 dark:text-white">« {notification.body} »</strong>
                              </span>
                            </>
                          ) : (
                            <>
                              {actor?.name && (
                                <strong className="font-bold text-[#102A43] dark:text-white">{actor.name}</strong>
                              )}
                              {actor?.name ? " " : ""}
                              <span className={isUnread ? "font-medium text-slate-800 dark:text-slate-100" : "text-slate-600 dark:text-slate-400"}>
                                {notification.title}
                              </span>
                            </>
                          )}
                        </p>

                        {/* ✅ Affichage du body UNE SEULE FOIS */}
                        {notification.body && notification.type !== "resource_request_published" && (
                          <p className="mt-1 line-clamp-2 text-xs leading-[1.5] text-slate-500 dark:text-slate-400">
                            {notification.body}
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`text-[11px] font-semibold ${isUnread ? "text-blue-700 dark:text-blue-300" : "text-slate-500 dark:text-slate-500"}`}>
                            {formatRelativeTime(notification.created_at)}
                          </span>
                          {isUnread && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
                              Nouveau
                            </span>
                          )}
                        </div>
                      </div>

                      {isUnread && (
                        <span aria-label="Non lue" className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600 ring-4 ring-blue-100 dark:bg-blue-400 dark:ring-blue-400/10" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-[#0B1F33]">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Actualisation automatique</span>
            <button
              type="button"
              onClick={() => load(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-teal-700 transition hover:bg-teal-50 disabled:opacity-50 dark:text-teal-300 dark:hover:bg-teal-400/10"
            >
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
              Actualiser
            </button>
          </div>
        </section>
      )}
    </div>
  );
}