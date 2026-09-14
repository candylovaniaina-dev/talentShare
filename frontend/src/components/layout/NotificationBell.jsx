import React, { useEffect, useRef, useState } from "react";
import {
  Bell, MessageSquare, Eye, Sparkles, Handshake, CheckCircle,
  Target, PlayCircle, XCircle, Briefcase,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

// ✅ Icônes enrichies pour couvrir tous les types
const ICONS = {
  new_message:              { icon: MessageSquare, color: "text-blue-600",    bg: "bg-blue-50" },
  resource_offer_published: { icon: Sparkles,      color: "text-purple-600",  bg: "bg-purple-50" },
  offer_viewed:             { icon: Eye,           color: "text-amber-600",   bg: "bg-amber-50" },
  offer_contacted:          { icon: Handshake,     color: "text-emerald-600", bg: "bg-emerald-50" },
  proposal_accepted:        { icon: CheckCircle,   color: "text-emerald-600", bg: "bg-emerald-50" },
  talent_available:         { icon: Sparkles,      color: "text-mint",        bg: "bg-mint/10" },

  // ✅ Nouveaux types de mission
  mission_pending_approval: { icon: Target,        color: "text-amber-600",   bg: "bg-amber-50" },
  mission_created_pending:  { icon: Target,        color: "text-blue-600",    bg: "bg-blue-50" },
  mission_accepted:         { icon: CheckCircle,   color: "text-emerald-600", bg: "bg-emerald-50" },
  mission_declined:         { icon: XCircle,       color: "text-rose-600",    bg: "bg-rose-50" },

  default:                  { icon: Bell,          color: "text-slate-500",   bg: "bg-slate-100" },
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const ref = useRef(null);
  const navigate = useNavigate();

  const load = () => api.get("/notifications").then((res) => setItems(res.data));

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

  const unreadCount = items.filter((n) => !n.read_at).length;

  const markRead = async (id) => {
    await api.post(`/notifications/${id}/read`);
    load();
  };

  const markAllRead = async () => {
    await api.post("/notifications/read-all");
    load();
  };

  // ✅ Utilise action_url fournie par le backend
  const handleClick = async (n) => {
    await markRead(n.id);

    if (n.action_url) {
      setOpen(false);
      navigate(n.action_url);
    } else {
      // Fallback au cas où
      console.warn("Pas d'action_url pour la notification:", n.type);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-96 rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 p-3">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-navy hover:text-mint"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && (
              <div className="p-8 text-center">
                <Bell size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">Aucune notification</p>
                <p className="text-xs text-slate-300 mt-1">Vos activités apparaîtront ici</p>
              </div>
            )}

            {items.map((n) => {
              const cfg = ICONS[n.type] || ICONS.default;
              const Icon = cfg.icon;
              const isClickable = !!n.action_url;

              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  disabled={!isClickable}
                  className={`flex w-full gap-3 border-b border-slate-50 p-3 text-left transition ${
                    isClickable ? "hover:bg-slate-50 cursor-pointer" : "cursor-default"
                  } ${!n.read_at ? "bg-mint/5" : ""}`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cfg.bg} ${cfg.color}`}>
                    <Icon size={18} />
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read_at ? "font-semibold text-navy" : "font-medium text-slate-700"}`}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{n.body}</p>
                    )}
                    <p className="mt-1 text-[11px] text-slate-400">
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

          {items.length > 0 && (
            <Link
              to="/notifications"
              className="block border-t border-slate-100 p-3 text-center text-xs font-semibold text-navy hover:bg-slate-50"
            >
              Voir toutes les notifications
            </Link>
          )}
        </div>
      )}
    </div>
  );
}