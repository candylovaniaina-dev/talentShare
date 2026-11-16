
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search, Send, Plus, MoreHorizontal, X, Users,
  Image as ImageIcon, Smile, Check, CheckCheck,
  ArrowLeft, Info, FileText,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import ConversationContextMenu from "../components/ConversationContextMenu";
import NewGroupModal from "../components/NewGroupModal";
import ConversationInfoModal from "../components/ConversationInfoModal";

const API_BASE = "http://127.0.0.1:8001";
const PLACEHOLDER_MESSAGE = "nouvelle conversation";

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function isPlaceholderMessage(message) {
  return (message?.body || "").trim().toLowerCase() === PLACEHOLDER_MESSAGE;
}

function buildImageUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  if (pathOrUrl.startsWith("/storage/")) return `${API_BASE}${pathOrUrl}`;
  if (pathOrUrl.startsWith("storage/")) return `${API_BASE}/${pathOrUrl}`;
  return `${API_BASE}/storage/${pathOrUrl}`;
}

function getAvatarPath(user) {
  if (!user) return null;

  return (
    user.avatar_path ||
    user.logo_path ||
    user.logo_url ||
    user.company?.logo_path ||
    user.company?.logo_url ||
    user.professional_profile?.avatar_path ||
    user.professionalProfile?.avatar_path ||
    null
  );
}

function timeAgo(date) {
  if (!date) return "";

  const d = new Date(date);
  const diff = (Date.now() - d.getTime()) / 1000;

  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;

  if (diff < 86400) {
    return d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (diff < 604800) {
    return d.toLocaleDateString("fr-FR", { weekday: "short" });
  }

  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function formatMessageTime(date) {
  if (!date) return "";

  return new Date(date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateHeader(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";

  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/*
|--------------------------------------------------------------------------
| Élimination des doublons visuels
|--------------------------------------------------------------------------
| Deux conversations directes ayant les mêmes participants
| ne doivent apparaître qu'une seule fois.
| Les groupes ne sont jamais fusionnés.
*/

function removeDuplicateConversations(list) {
  const direct = new Map();
  const groups = [];

  list.forEach((conv) => {
    const participants = conv.participants || [];

    const isGroup =
      Boolean(conv.title) ||
      participants.length > 2;

    if (isGroup) {
      groups.push(conv);
      return;
    }

    const ids = participants
      .map((p) => Number(p.id))
      .sort((a, b) => a - b);

    const key = ids.join("-");

    if (!key) {
      groups.push(conv);
      return;
    }

    const previous = direct.get(key);

    if (!previous) {
      direct.set(key, conv);
      return;
    }

    const previousDate = new Date(
      previous.updated_at || previous.created_at || 0
    ).getTime();

    const currentDate = new Date(
      conv.updated_at || conv.created_at || 0
    ).getTime();

    if (currentDate > previousDate) {
      direct.set(key, conv);
    }
  });

  return [...direct.values(), ...groups].sort(
    (a, b) =>
      new Date(b.updated_at || b.created_at || 0) -
      new Date(a.updated_at || a.created_at || 0)
  );
}

function AvatarBubble({
  path,
  name,
  size = 48,
  highlight = false,
  className = "",
  role,
  userId,
}) {
  const [err, setErr] = useState(false);
  const [fallbackLogo, setFallbackLogo] = useState(null);

  useEffect(() => {
    if (path || role !== "company" || !userId) return;

    let cancelled = false;

    api.get("/companies")
      .then((res) => {
        if (cancelled) return;

        const list = res.data?.data || res.data || [];

        const comp = list.find(
          (c) =>
            c.user_id === userId ||
            c.owner_user_id === userId
        );

        if (comp) {
          setFallbackLogo(
            comp.logo_path || comp.logo || comp.logo_url
          );
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [path, role, userId]);

  useEffect(() => {
    setErr(false);
  }, [path, fallbackLogo]);

  const imageUrl = buildImageUrl(path || fallbackLogo);

  return (
    <div
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full font-extrabold ${
        highlight
          ? "bg-gradient-to-br from-[#16B8B1] to-[#0F9691] text-white"
          : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
      } ${className}`}
    >
      {imageUrl && !err ? (
        <img
          src={imageUrl}
          alt={name || ""}
          onError={() => setErr(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span style={{ fontSize: size * 0.34 }}>
          {initials(name)}
        </span>
      )}
    </div>
  );
}

function GroupBubble({ size = 48 }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-[#0B1F33] text-[#16B8B1]"
    >
      <Users size={size * 0.42} />
    </div>
  );
}

function formatSystemMessage(msg, currentUser) {
  if (!msg.body) return "";

  let text = msg.body.replace(/\*\*/g, "").trim();

  if (text.includes("a ajouté") && text.includes("au groupe")) {
    const senderName = msg.sender?.name;
    const currentUserName = currentUser?.name;

    if (senderName && msg.sender_id === currentUser?.id) {
      text = text.replace(senderName, "Vous");
    } else if (currentUserName && text.includes(currentUserName)) {
      const match = text.match(/^(.*?) a ajouté/);

      if (match?.[1]) {
        text = text.replace(
          `${match[1]} a ajouté ${currentUserName}`,
          `${match[1]} vous a ajouté`
        );
      }
    }
  }

  return text;
}

export default function Messages() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const targetUserId = searchParams.get("to");

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);

  const [body, setBody] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [showNewModal, setShowNewModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);

  const [contextMenu, setContextMenu] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachment, setAttachment] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Empêche le traitement multiple d'un même destinataire.
  const handledTargetsRef = useRef(new Set());

  const getOtherParticipant = useCallback(
    (conv) => {
      return (
        conv?.participants?.find(
          (p) => Number(p.id) !== Number(user?.id)
        ) || conv?.participants?.[0]
      );
    },
    [user?.id]
  );

  const getLastMessage = useCallback((conv) => {
    const list = (conv?.messages || [])
      .filter((m) => !isPlaceholderMessage(m));

    if (!list.length) return null;

    return [...list].sort(
      (a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
    )[0];
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Charger les conversations
  |--------------------------------------------------------------------------
  */

  const loadConversations = useCallback(async () => {
    try {
      const res = await api.get("/conversations");

      const list = removeDuplicateConversations(
        res.data || []
      );

      setConversations(list);

      return list;
    } catch (err) {
      console.error("Erreur chargement conversations:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      const list = await loadConversations();

      if (!mounted) return;

      if (!targetUserId && !activeId && list.length > 0) {
        setActiveId(list[0].id);
      }
    };

    initialize();

    const interval = setInterval(() => {
      loadConversations();
    }, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [loadConversations]);

  /*
  |--------------------------------------------------------------------------
  | Ouvrir une conversation depuis un lien ?to=
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!targetUserId) return;
    if (!user) return;

    const targetKey = `${user.id}-${targetUserId}`;

    if (handledTargetsRef.current.has(targetKey)) return;

    handledTargetsRef.current.add(targetKey);

    let cancelled = false;

    const openConversation = async () => {
      try {
        const userId = Number(targetUserId);

        if (!Number.isInteger(userId) || userId <= 0) {
          throw new Error("Identifiant utilisateur invalide.");
        }

        if (userId === Number(user.id)) {
          throw new Error("Vous ne pouvez pas discuter avec vous-même.");
        }

        const res = await api.post(
          "/conversations/direct",
          { user_id: userId }
        );

        const conversation = res.data?.conversation;

        if (!conversation?.id) {
          throw new Error("Conversation introuvable.");
        }

        if (cancelled) return;

        setMessages([]);
        setActiveId(conversation.id);
        setShowMobileList(false);

        await loadConversations();

        // On retire le destinataire de l'URL.
        // Cela évite de rouvrir la conversation au prochain rendu.
        setSearchParams(
          (params) => {
            params.delete("to");
            params.delete("name");
            return params;
          },
          { replace: true }
        );
      } catch (err) {
        console.error("Erreur ouverture conversation:", err);

        if (!cancelled) {
          alert(
            err.response?.data?.message ||
            err.message ||
            "Impossible d'ouvrir la conversation."
          );
        }
      }
    };

    openConversation();

    return () => {
      cancelled = true;
    };
  }, [targetUserId, user, loadConversations, setSearchParams]);

  /*
  |--------------------------------------------------------------------------
  | Chargement des messages
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    setShowMobileList(false);

    const fetchMessages = async () => {
      try {
        const res = await api.get(
          `/conversations/${activeId}/messages`
        );

        if (cancelled) return;

        const cleanMessages = (res.data || []).filter(
          (msg) => !isPlaceholderMessage(msg)
        );

        setMessages(cleanMessages);
      } catch (err) {
        console.error("Erreur chargement messages:", err);
      }
    };

    fetchMessages();

    const interval = setInterval(fetchMessages, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  /*
  |--------------------------------------------------------------------------
  | Emojis
  |--------------------------------------------------------------------------
  */

  const onEmojiClick = (emojiData) => {
    setBody((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  /*
  |--------------------------------------------------------------------------
  | Pièces jointes
  |--------------------------------------------------------------------------
  */

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Fichier trop lourd (5 Mo maximum).");
      return;
    }

    const isImage = file.type.startsWith("image/");
    const preview = isImage
      ? URL.createObjectURL(file)
      : null;

    setAttachment({
      file,
      preview,
      isImage,
      name: file.name,
    });

    e.target.value = "";
  };

  const removeAttachment = () => {
    if (attachment?.preview) {
      URL.revokeObjectURL(attachment.preview);
    }

    setAttachment(null);
  };

  /*
  |--------------------------------------------------------------------------
  | Envoyer un message
  |--------------------------------------------------------------------------
  */

  const send = async (e) => {
    e?.preventDefault();

    if (
      (!body.trim() && !attachment) ||
      !activeId ||
      sending
    ) {
      return;
    }

    const text = body.trim();
    const file = attachment?.file;
    const preview = attachment?.preview;

    setBody("");
    setShowEmojiPicker(false);
    setSending(true);

    const tempMsg = {
      id: `temp-${Date.now()}`,
      body: text,
      attachment_url: preview || null,
      attachment_name: attachment?.name || null,
      sender_id: user?.id,
      sender: user,
      created_at: new Date().toISOString(),
      pending: true,
    };

    setMessages((previous) => [...previous, tempMsg]);

    setAttachment(null);

    try {
      const formData = new FormData();

      formData.append("body", text);

      if (file) {
        formData.append("attachment", file);
      }

      const res = await api.post(
        `/conversations/${activeId}/messages`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessages((previous) => [
        ...previous.filter((m) => m.id !== tempMsg.id),
        res.data,
      ]);

      await loadConversations();

    } catch (err) {
      console.error("Erreur envoi:", err);

      setMessages((previous) =>
        previous.filter((m) => m.id !== tempMsg.id)
      );

      alert(
        err.response?.data?.message || "Erreur lors de l'envoi."
      );

    } finally {
      setSending(false);
      inputRef.current?.focus();

      if (preview) URL.revokeObjectURL(preview);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Actions conversation
  |--------------------------------------------------------------------------
  */

  const handleContextAction = async (action, conv) => {
    try {
      if (action === "open") {
        setActiveId(conv.id);
        setShowMobileList(false);
        return;
      }

      if (action === "mark-unread") {
        await api.post(
          `/conversations/${conv.id}/mark-unread`
        );

        await loadConversations();
        return;
      }

      if (action === "archive") {
        await api.post(`/conversations/${conv.id}/archive`);

        if (activeId === conv.id) {
          setActiveId(null);
          setMessages([]);
        }

        await loadConversations();
        return;
      }

      if (action === "delete") {
        if (!window.confirm("Supprimer cette conversation ?")) {
          return;
        }

        await api.delete(`/conversations/${conv.id}`);

        if (activeId === conv.id) {
          setActiveId(null);
          setMessages([]);
        }

        await loadConversations();
      }
    } catch (err) {
      alert(
        err.response?.data?.message || "Erreur."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Filtres
  |--------------------------------------------------------------------------
  */

  const filtered = conversations.filter((c) => {
    // Les conversations sans message restent visibles.
    if (filter === "unread" && !c.unread_count) {
      return false;
    }

    if (
      filter === "groups" &&
      c.participants?.length <= 2 &&
      !c.title
    ) {
      return false;
    }

    if (search.trim()) {
      const other = getOtherParticipant(c);
      const lastMsg = getLastMessage(c);

      const haystack = [
        other?.name || "",
        c.title || "",
        lastMsg?.body || "",
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(search.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  const activeConv = conversations.find(
    (c) => c.id === activeId
  );

  const otherUser = activeConv
    ? getOtherParticipant(activeConv)
    : null;

  const hasActiveChat = Boolean(activeConv);

  const activeIsGroup = Boolean(
    activeConv?.title ||
    activeConv?.participants?.length > 2
  );

  if (loading || !user) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#16B8B1] border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-11rem)] min-h-[520px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,60,60,0.10)] dark:border-white/10 dark:bg-[#112A3A]">

        {/* =====================================================
            LISTE DES CONVERSATIONS
        ====================================================== */}

        <aside
          className={`w-full shrink-0 flex-col border-r border-slate-100 bg-white md:flex md:w-[380px] dark:border-white/10 dark:bg-[#112A3A] ${
            showMobileList ? "flex" : "hidden"
          }`}
        >
          <div className="flex items-end justify-between px-5 pb-3 pt-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#16B8B1]">
                Messagerie
              </p>

              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#0B1F33] dark:text-white">
                Discussions
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                className="rounded-full p-2.5 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-white/10"
                aria-label="Plus d'options"
              >
                <MoreHorizontal size={18} />
              </button>

              <button
                onClick={() => setShowNewModal(true)}
                aria-label="Nouveau message"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B1F33] text-white shadow-sm transition hover:bg-[#16324F]"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Recherche */}
          <div className="px-5 pb-3">
            <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 focus-within:border-[#16B8B1] focus-within:ring-4 focus-within:ring-[#16B8B1]/10 dark:border-white/10 dark:bg-white/5">
              <Search size={16} className="text-slate-400" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher dans Messagerie"
                className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-white"
              />
            </div>
          </div>

          {/* Filtres */}
          <div className="px-5 pb-3">
            <div className="inline-flex rounded-full bg-slate-100 p-1 dark:bg-white/5">
              {[
                { id: "all", label: "Tout" },
                { id: "unread", label: "Non lu" },
                { id: "groups", label: "Groupes" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                    filter === tab.id
                      ? "bg-[#0B1F33] text-white shadow-sm"
                      : "text-slate-500 hover:text-[#0B1F33] dark:text-slate-400"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Liste */}
          <div className="flex-1 space-y-0.5 overflow-y-auto px-2.5 pb-3">
            {filtered.length === 0 && (
              <div className="px-4 py-12 text-center">
                <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5">
                  <span className="h-3 w-3 rounded-full bg-[#16B8B1]" />
                </span>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Aucune conversation
                </p>
              </div>
            )}

            {filtered.map((conv) => {
              const other = getOtherParticipant(conv);
              const lastMsg = getLastMessage(conv);

              const isActive = conv.id === activeId;
              const isUnread = conv.unread_count > 0;

              const isGroup =
                conv.participants?.length > 2 ||
                Boolean(conv.title);

              const avatarPath = getAvatarPath(other);

              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setActiveId(conv.id);
                    setShowMobileList(false);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();

                    setContextMenu({
                      x: e.clientX,
                      y: e.clientY,
                      conversation: conv,
                    });
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                    isActive
                      ? "bg-[#16B8B1]/10 ring-1 ring-[#16B8B1]/20"
                      : "hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  <div className="relative shrink-0">
                    {isGroup ? (
                      <GroupBubble size={48} />
                    ) : (
                      <AvatarBubble
                        path={avatarPath}
                        name={other?.name}
                        size={48}
                        highlight={isUnread}
                        role={other?.role}
                        userId={other?.id}
                      />
                    )}

                    {!isGroup && (
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#16B8B1] dark:border-[#112A3A]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`truncate text-sm ${
                          isUnread
                            ? "font-extrabold text-[#0B1F33] dark:text-white"
                            : "font-semibold text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {isGroup
                          ? conv.title || "Groupe"
                          : other?.name || "Conversation"}
                      </p>

                      <span className="shrink-0 text-[11px] text-slate-400">
                        {timeAgo(lastMsg?.created_at)}
                      </span>
                    </div>

                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                      {lastMsg
                        ? `${
                            lastMsg.sender_id === user.id
                              ? "Vous : "
                              : ""
                          }${lastMsg.body || "Pièce jointe"}`
                        : ""}
                    </p>
                  </div>

                  {isUnread && (
                    <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[#16B8B1] px-1.5 text-[10px] font-extrabold text-[#0B1F33]">
                      {conv.unread_count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* =====================================================
            FENÊTRE DE DISCUSSION
        ====================================================== */}

        <section
          className={`flex-1 flex-col bg-slate-50/50 md:flex dark:bg-[#0B1F33]/40 ${
            !showMobileList && hasActiveChat
              ? "flex"
              : "hidden md:flex"
          }`}
        >
          {!hasActiveChat ? (
            <div className="flex flex-1 flex-col items-center justify-center text-slate-500 dark:text-slate-400">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-[28px] bg-[#0B1F33] text-[#16B8B1] shadow-lg">
                <Send size={34} />
              </div>

              <p className="mt-5 text-base font-extrabold text-[#0B1F33] dark:text-white">
                Vos messages
              </p>

              <p className="mt-1 text-sm">
                Sélectionnez une conversation pour commencer.
              </p>
            </div>
          ) : (
            <>
              {/* En-tête */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3.5 dark:border-white/10 dark:bg-[#112A3A]">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    onClick={() => setShowMobileList(true)}
                    aria-label="Retour"
                    className="rounded-full p-2 text-slate-500 hover:bg-slate-100 md:hidden"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <div className="relative shrink-0">
                    {activeIsGroup ? (
                      <GroupBubble size={42} />
                    ) : (
                      <AvatarBubble
                        path={getAvatarPath(otherUser)}
                        name={otherUser?.name}
                        size={42}
                        role={otherUser?.role}
                        userId={otherUser?.id}
                      />
                    )}

                    {!activeIsGroup && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#16B8B1]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-extrabold text-[#0B1F33] dark:text-white">
                      {activeIsGroup
                        ? activeConv.title || "Groupe"
                        : otherUser?.name || "Conversation"}
                    </p>

                    {activeIsGroup ? (
                      <p className="text-[11px] text-slate-500">
                        {activeConv.participants?.length || 0} participants
                      </p>
                    ) : (
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#16B8B1]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#16B8B1]" />
                        Messagerie privée
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setShowInfoModal(true)}
                  className="rounded-full p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#0B1F33] dark:hover:bg-white/10 dark:hover:text-white"
                  title="Informations"
                >
                  <Info size={18} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-1 overflow-y-auto p-5">
                {messages.length === 0 && (
                  <div className="flex min-h-[250px] flex-col items-center justify-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#16B8B1]/10 text-[#16B8B1]">
                      <Send size={26} />
                    </div>

                    <p className="text-sm font-bold text-[#0B1F33] dark:text-white">
                      Commencez la discussion
                    </p>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Votre premier message apparaîtra ici.
                    </p>
                  </div>
                )}

                {messages.map((msg, i) => {
                  const isMine =
                    Number(msg.sender_id) === Number(user.id);

                  const prevMsg = messages[i - 1];
                  const nextMsg = messages[i + 1];

                  const isSystem =
                    msg.type === "system" ||
                    (
                      msg.body?.includes("a ajouté") &&
                      msg.body?.includes("au groupe")
                    );

                  const showDateHeader =
                    !prevMsg ||
                    new Date(msg.created_at).toDateString() !==
                    new Date(prevMsg.created_at).toDateString();

                  const showAvatar =
                    !isMine &&
                    !isSystem &&
                    (!prevMsg ||
                      Number(prevMsg.sender_id) !==
                      Number(msg.sender_id));

                  const isLastInGroup =
                    !nextMsg ||
                    Number(nextMsg.sender_id) !==
                    Number(msg.sender_id) ||
                    new Date(nextMsg.created_at).getTime() -
                      new Date(msg.created_at).getTime() > 60000;

                  const senderAvatar = getAvatarPath(msg.sender);

                  const attachmentUrl =
                    msg.attachment_url ||
                    (
                      msg.attachment_path
                        ? buildImageUrl(msg.attachment_path)
                        : null
                    );

                  const isImage = attachmentUrl
                    ? /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(
                        attachmentUrl
                      )
                    : false;

                  return (
                    <React.Fragment key={msg.id}>
                      {showDateHeader && (
                        <div className="flex justify-center py-3">
                          <span className="rounded-full bg-white px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 shadow-sm ring-1 ring-slate-100 dark:bg-[#112A3A] dark:text-slate-400 dark:ring-white/10">
                            {formatDateHeader(msg.created_at)}
                          </span>
                        </div>
                      )}

                      {isSystem ? (
                        <div className="flex justify-center py-2">
                          <p className="max-w-[80%] text-center text-xs text-slate-500">
                            {formatSystemMessage(msg, user)}
                          </p>
                        </div>
                      ) : (
                        <div
                          className={`flex items-end gap-2 ${
                            isMine ? "justify-end" : "justify-start"
                          }`}
                        >
                          {!isMine && (
                            <div className="w-8 shrink-0">
                              {showAvatar && (
                                <AvatarBubble
                                  path={senderAvatar}
                                  name={msg.sender?.name}
                                  size={32}
                                  role={msg.sender?.role}
                                  userId={msg.sender?.id}
                                />
                              )}
                            </div>
                          )}

                          <div
                            className={`flex max-w-[72%] flex-col ${
                              isMine ? "items-end" : "items-start"
                            }`}
                          >
                            {!isMine && showAvatar && (
                              <p className="mb-1 px-1 text-[11px] font-bold text-slate-500">
                                {msg.sender?.name}
                              </p>
                            )}

                            <div
                              className={`overflow-hidden rounded-3xl ${
                                isMine
                                  ? `bg-[#0B1F33] text-white ${
                                      isLastInGroup ? "rounded-br-lg" : ""
                                    }`
                                  : `bg-white text-[#0B1F33] shadow-sm ring-1 ring-slate-100 dark:bg-[#0B1F33] dark:text-slate-200 dark:ring-white/5 ${
                                      isLastInGroup ? "rounded-bl-lg" : ""
                                    }`
                              } ${msg.pending ? "opacity-60" : ""}`}
                            >
                              {attachmentUrl && isImage && (
                                <img
                                  src={attachmentUrl}
                                  alt="Pièce jointe"
                                  className="max-w-xs"
                                />
                              )}

                              {attachmentUrl && !isImage && (
                                <a
                                  href={attachmentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold underline"
                                >
                                  <FileText size={16} />
                                  {msg.attachment_name || "Télécharger"}
                                </a>
                              )}

                              {msg.body && (
                                <p className="whitespace-pre-wrap break-words px-4 py-2.5 text-sm leading-6">
                                  {msg.body}
                                </p>
                              )}
                            </div>

                            {isLastInGroup && (
                              <div className="mt-1 flex items-center gap-1 px-1">
                                <span className="text-[10px] text-slate-400">
                                  {formatMessageTime(msg.created_at)}
                                </span>

                                {isMine && (
                                  msg.pending
                                    ? <Check size={12} />
                                    : <CheckCheck size={12} className="text-[#16B8B1]" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              {/* Prévisualisation pièce jointe */}
              {attachment && (
                <div className="mx-4 mb-2 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100 dark:bg-[#112A3A] dark:ring-white/10">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                    {attachment.isImage ? (
                      <img
                        src={attachment.preview}
                        className="h-full w-full object-cover"
                        alt=""
                      />
                    ) : (
                      <FileText size={20} className="text-[#16B8B1]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#0B1F33] dark:text-white">
                      {attachment.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Prêt à envoyer
                    </p>
                  </div>

                  <button
                    onClick={removeAttachment}
                    aria-label="Retirer"
                    className="rounded-full p-2 text-slate-400 hover:text-rose-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Emoji picker */}
              {showEmojiPicker && (
                <div className="relative">
                  <div className="absolute bottom-2 right-4 z-20 overflow-hidden rounded-2xl shadow-xl">
                    <EmojiPicker
                      onEmojiClick={onEmojiClick}
                      theme="light"
                      height={350}
                      width={300}
                      searchDisabled={false}
                      skinTonesDisabled
                    />
                  </div>
                </div>
              )}

              {/* Zone d'envoi */}
              <form
                onSubmit={send}
                className="relative border-t border-slate-100 bg-white p-3.5 dark:border-white/10 dark:bg-[#112A3A]"
              >
                <div className="flex items-end gap-1.5 rounded-[26px] border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-[#16B8B1] focus-within:ring-4 focus-within:ring-[#16B8B1]/10 dark:border-white/10 dark:bg-white/5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
                    title="Joindre un fichier"
                  >
                    <Plus size={18} />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleFilePick}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
                    title="Envoyer une photo"
                  >
                    <ImageIcon size={18} />
                  </button>

                  <textarea
                    ref={inputRef}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Écrire un message..."
                    rows={1}
                    className="max-h-24 flex-1 resize-none bg-transparent py-2 text-sm text-[#0B1F33] placeholder:text-slate-400 focus:outline-none dark:text-white"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowEmojiPicker((prev) => !prev)
                    }
                    className={`rounded-full p-2 transition ${
                      showEmojiPicker
                        ? "bg-[#16B8B1]/20 text-[#0B1F33]"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                    title="Emojis"
                  >
                    <Smile size={18} />
                  </button>

                  {(body.trim() || attachment) && (
                    <button
                      type="submit"
                      disabled={sending}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0B1F33] text-white shadow-sm transition hover:bg-[#16324F] disabled:opacity-40"
                    >
                      <Send size={16} />
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </section>
      </div>

      {/* =====================================================
          MODALES
      ====================================================== */}

      {showNewModal && (
        <NewConversationModal
          onClose={() => setShowNewModal(false)}
          onCreated={(conv, action) => {
            setShowNewModal(false);

            if (action === "openGroup") {
              setShowGroupModal(true);
              return;
            }

            if (conv) {
              setMessages([]);
              setActiveId(conv.id);
              setShowMobileList(false);
              loadConversations();
            }
          }}
        />
      )}

      {showGroupModal && (
        <NewGroupModal
          onClose={() => setShowGroupModal(false)}
          onCreated={(conv) => {
            setShowGroupModal(false);
            loadConversations();
            setActiveId(conv.id);
            setShowMobileList(false);
          }}
        />
      )}

      {showInfoModal && activeConv && (
        <ConversationInfoModal
          conversation={activeConv}
          onClose={() => setShowInfoModal(false)}
          onUpdated={loadConversations}
          onLeft={() => {
            setShowInfoModal(false);
            setActiveId(null);
            setMessages([]);
            loadConversations();
          }}
        />
      )}

      {contextMenu && (
        <ConversationContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          conversation={contextMenu.conversation}
          onClose={() => setContextMenu(null)}
          onAction={handleContextAction}
        />
      )}
    </AppShell>
  );
}

/*
|--------------------------------------------------------------------------
| MODALE NOUVELLE CONVERSATION
|--------------------------------------------------------------------------
*/

function NewConversationModal({ onClose, onCreated }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    api.get("/users/suggestions?limit=10")
      .then((res) => {
        if (!cancelled) {
          setSuggestions(res.data || []);
        }
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSuggestions(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (search.trim().length < 2) {
      setResults([]);
      return;
    }

    let cancelled = false;

    const timeout = setTimeout(() => {
      setLoading(true);

      api.get(
        `/users/search?q=${encodeURIComponent(search)}`
      )
        .then((res) => {
          if (!cancelled) setResults(res.data || []);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [search]);

  const startDirect = async (userId) => {
    if (creating) return;

    setCreating(true);

    try {
      const res = await api.post(
        "/conversations/direct",
        { user_id: userId }
      );

      const conversation = res.data?.conversation;

      if (conversation?.id) {
        onCreated(conversation);
      }
    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Erreur lors de l'ouverture de la conversation."
      );
    } finally {
      setCreating(false);
    }
  };

  const displayUsers =
    search.trim().length >= 2 ? results : suggestions;

  const showingSuggestions = search.trim().length < 2;

  const spinner = (
    <div className="flex justify-center py-6">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#16B8B1] border-t-transparent" />
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#06141F]/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#112A3A] dark:ring-1 dark:ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex items-center justify-between overflow-hidden bg-gradient-to-br from-[#0B1F33] to-[#142B49] px-6 py-4 text-white">
          <h2 className="text-[15px] font-extrabold">
            Nouveau message
          </h2>

          <button
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          >
            <X size={18} />
          </button>
        </div>

        <button
          onClick={() => onCreated(null, "openGroup")}
          className="flex w-full items-center gap-3 border-b border-slate-100 px-6 py-3.5 text-left transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
        >
          <GroupBubble size={42} />

          <div className="flex-1">
            <p className="text-sm font-extrabold text-[#0B1F33] dark:text-white">
              Créer un canal / groupe
            </p>

            <p className="text-xs text-slate-500">
              Discussion à plusieurs
            </p>
          </div>
        </button>

        <div className="px-5 pb-2 pt-4">
          <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 focus-within:border-[#16B8B1] focus-within:ring-4 focus-within:ring-[#16B8B1]/10 dark:border-white/10 dark:bg-white/5">
            <Search size={16} className="text-slate-400" />

            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="À : rechercher un utilisateur..."
              className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-white"
            />
          </div>
        </div>

        <div className="px-6 pb-2 pt-2">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#16B8B1]">
            {showingSuggestions ? "Suggestions" : "Résultats"}
          </p>
        </div>

        <div className="max-h-80 overflow-y-auto px-2.5 pb-3">
          {(loadingSuggestions && showingSuggestions) ||
          (loading && !showingSuggestions)
            ? spinner
            : null}

          {!loading &&
            !showingSuggestions &&
            displayUsers.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500">
                Aucun utilisateur trouvé
              </p>
            )}

          {!loadingSuggestions &&
            showingSuggestions &&
            displayUsers.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500">
                Aucune suggestion
              </p>
            )}

          {displayUsers.map((u) => (
            <button
              key={u.id}
              onClick={() => startDirect(u.id)}
              disabled={creating}
              className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition hover:bg-slate-50 disabled:opacity-50 dark:hover:bg-white/5"
            >
              <AvatarBubble
                path={getAvatarPath(u)}
                name={u.name}
                size={42}
                role={u.role}
                userId={u.id}
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-[#0B1F33] dark:text-white">
                  {u.name}
                </p>

                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {u.role === "company"
                    ? "Entreprise"
                    : u.role === "student"
                    ? "Étudiant"
                    : "Talent"}
                  {u.email && ` · ${u.email}`}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
