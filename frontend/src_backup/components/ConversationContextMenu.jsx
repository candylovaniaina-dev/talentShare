
import React, { useEffect, useRef } from "react";
import {
  MailOpen,
  MessageSquare,
  Archive,
  Trash2,
} from "lucide-react";

export default function ConversationContextMenu({
  x,
  y,
  conversation,
  onClose,
  onAction,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };

    const onEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [onClose]);

  const items = [
    {
      icon: MailOpen,
      label: "Marquer comme non lu",
      action: () => onAction("mark-unread", conversation),
    },
    {
      icon: MessageSquare,
      label: "Ouvrir la messagerie",
      action: () => onAction("open", conversation),
    },
    {
      icon: Archive,
      label: "Archiver la discussion",
      action: () => onAction("archive", conversation),
    },
    {
      icon: Trash2,
      label: "Supprimer la discussion",
      danger: true,
      action: () => onAction("delete", conversation),
    },
  ];

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Actions de la conversation"
      style={{ position: "fixed", top: y, left: x }}
      className="z-[100] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_16px_50px_rgba(15,30,69,0.18)]"
    >
      {items.map((item, idx) => {
        const Icon = item.icon;

        return (
          <button
            key={idx}
            type="button"
            role="menuitem"
            onClick={() => {
              item.action();
              onClose();
            }}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
              item.danger
                ? "mt-1 border-t border-slate-100 pt-3 text-rose-600 hover:bg-rose-50"
                : "text-slate-600 hover:bg-[#F0FCF8] hover:text-[#12364D]"
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                item.danger
                  ? "bg-rose-50 text-rose-600"
                  : "bg-slate-50 text-[#087F70]"
              }`}
            >
              <Icon size={16} />
            </span>
            <span className="font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
