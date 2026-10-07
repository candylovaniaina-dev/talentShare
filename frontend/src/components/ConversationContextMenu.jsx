import React, { useEffect, useRef } from "react";
import { MailOpen, MessageSquare, Archive, Trash2 } from "lucide-react";

export default function ConversationContextMenu({ x, y, conversation, onClose, onAction }) {
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [onClose]);

  const items = [
    { icon: MailOpen,      label: "Marquer comme non lu",   action: () => onAction("mark-unread", conversation) },
    { icon: MessageSquare, label: "Ouvrir la messagerie",   action: () => onAction("open", conversation) },
    { icon: Archive,       label: "Archiver la discussion", action: () => onAction("archive", conversation) },
    { icon: Trash2,        label: "Supprimer la discussion", danger: true, action: () => onAction("delete", conversation) },
  ];

  return (
    <div
      ref={ref}
      style={{ position: "fixed", top: y, left: x }}
      className="z-[100] w-64 overflow-hidden rounded-xl border border-white/10 bg-[#0F1E45] py-1 shadow-2xl"
    >
      {items.map((item, idx) => (
        <button
          key={idx}
          onClick={() => { item.action(); onClose(); }}
          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${
            item.danger ? "text-rose-400 hover:bg-rose-500/10" : "text-slate-200 hover:bg-white/5"
          }`}
        >
          <item.icon size={16} />
          {item.label}
        </button>
      ))}
    </div>
  );
}