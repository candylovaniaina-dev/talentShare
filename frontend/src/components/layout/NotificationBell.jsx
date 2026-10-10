import React, { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

const COLORS = {
  new_message:              "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10",
  resource_offer_published: "text-mint dark:text-mint-light bg-mint/10 dark:bg-mint/10",
  offer_viewed:             "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10",
  offer_contacted:          "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
  proposal_accepted:        "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
  proposal_declined:        "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10",
  talent_available:         "text-mint dark:text-mint-light bg-mint/10 dark:bg-mint/10",

  mission_pending_approval: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10",
  mission_created_pending:  "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10",
  mission_accepted:         "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
  mission_declined:         "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10",

  availability_expiring:    "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10",
  saved_search_match:       "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10",

  resource_request_published: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
  resource_request_matched:   "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10",
  resource_request_expiring:  "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10",
  resource_request_closed:    "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-500/10",

  proposal_received: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10",
  proposal_expired:  "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-500/10",

  new_application:         "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
  application_viewed:      "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10",
  application_shortlisted: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10",
  application_interview:   "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10",
  application_accepted:    "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
  application_rejected:    "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10",

  offer_liked:     "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10",
  offer_commented: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10",

  default: "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-500/10",
};

const DOT_COLOR = {
  new_message: "bg-blue-500",
  resource_offer_published: "bg-mint",
  offer_viewed: "bg-amber-500",
  offer_contacted: "bg-emerald-500",
  proposal_accepted: "bg-emerald-500",
  proposal_declined: "bg-rose-500",
  talent_available: "bg-mint",
  mission_pending_approval: "bg-amber-500",
  mission_created_pending: "bg-blue-500",
  mission_accepted: "bg-emerald-500",
  mission_declined: "bg-rose-500",
  availability_expiring: "bg-amber-500",
  saved_search_match: "bg-blue-500",
  resource_request_published: "bg-emerald-500",
  resource_request_matched: "bg-blue-500",
  resource_request_expiring: "bg-amber-500",
  resource_request_closed: "bg-slate-400",
  proposal_received: "bg-blue-500",
  proposal_expired: "bg-slate-400",
  new_application: "bg-emerald-500",
  application_viewed: "bg-blue-500",
  application_shortlisted: "bg-violet-500",
  application_interview: "bg-amber-500",
  application_accepted: "bg-emerald-500",
  application_rejected: "bg-rose-500",
  offer_liked: "bg-rose-500",
  offer_commented: "bg-blue-500",
  default: "bg-slate-400",
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);
  const navigate = useNavigate();

  const load = () =>
    api.get("/notifications").then((res) => {
      const payload = res.data;
      const data = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.notifications)
          ? payload.notifications
          : [];
      setItems(data);
      const unread = payload?.unread_count ?? data.filter((n) => !n.read_at).length;
      setUnreadCount(unread);
    });

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const markRead = async (id) => {
    await api.post(`/notifications/${id}/read`);
    load();
  };

  const markAllRead = async () => {
    await api.post("/notifications/read-all");
    load();
  };

  const handleClick = async (n) => {
    await markRead(n.id);

    if (n.action_url) {
      setOpen(false);

      if (n.action_url.includes("#")) {
        const [path, hash] = n.action_url.split("#");
        navigate(path);

        setTimeout(() => {
          const el = document.getElementById(hash);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("ring-2", "ring-mint", "rounded-xl2");
            setTimeout(() => {
              el.classList.remove("ring-2", "ring-mint", "rounded-xl2");
            }, 2500);
          }
        }, 800);
      } else {
        navigate(n.action_url);
      }
    } else {
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
      >
        <Bell size={18} strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-pop">
          <div className="flex items-center justify-between border-b border-[var(--border-app)] p-3">
            <p className="text-sm font-semibold text-[var(--text-app)]">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-navy-700 hover:text-mint dark:text-navy-200"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && (
              <div className="p-8 text-center">
                <Bell size={28} strokeWidth={1.5} className="mx-auto mb-2 text-[var(--text-faint)]" />
                <p className="text-sm text-[var(--text-muted)]">Aucune notification</p>
                <p className="mt-1 text-xs text-[var(--text-faint)]">Vos activités apparaîtront ici</p>
              </div>
            )}

            {items.map((n) => {
              const colorClass = COLORS[n.type] || COLORS.default;
              const dotClass = DOT_COLOR[n.type] || DOT_COLOR.default;
              const isClickable = !!n.action_url;

              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  disabled={!isClickable}
                  className={`flex w-full gap-3 border-b border-[var(--border-app)] p-3 text-left transition ${
                    isClickable ? "hover:bg-[var(--bg-surface-hover)] cursor-pointer" : "cursor-default"
                  } ${!n.read_at ? "bg-mint/5" : ""}`}
                >
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                    <span className={`h-2 w-2 rounded-full ${dotClass}`} />
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read_at ? "font-semibold text-[var(--text-app)]" : "font-medium text-[var(--text-muted)]"}`}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="mt-0.5 text-xs text-[var(--text-faint)] line-clamp-2">{n.body}</p>
                    )}
                    <p className="mt-1 text-[11px] text-[var(--text-faint)]">
                      {new Date(n.created_at).toLocaleString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {!n.read_at && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-mint" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
