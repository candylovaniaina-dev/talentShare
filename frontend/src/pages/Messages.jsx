import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search, Send, Plus, MoreHorizontal, X, Users,
  Image as ImageIcon, Smile, Check, CheckCheck, ArrowLeft, Info, FileText,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import ConversationContextMenu from "../components/ConversationContextMenu";
import NewGroupModal from "../components/NewGroupModal";
import ConversationInfoModal from "../components/ConversationInfoModal";

// ============================================
// CONFIG & HELPERS
// ============================================
const API_BASE = "http://127.0.0.1:8001";

function initials(name) {
  return (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
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
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800) return d.toLocaleDateString("fr-FR", { weekday: "short" });
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function formatMessageTime(date) {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatDateHeader(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

// ✅ COMPOSANT AVATAR AVEC FALLBACK API POUR LES ENTREPRISES
function AvatarBubble({ path, name, size = 48, highlight = false, className = "", role, userId }) {
  const [err, setErr] = useState(false);
  const [fallbackLogo, setFallbackLogo] = useState(null);

  // Si le backend n'envoie pas le logo dans le message, on va le chercher via l'API /companies
  useEffect(() => {
    if (path || role !== "company" || !userId) return;
    
    api.get(`/companies`)
      .then((res) => {
        const list = res.data?.data || res.data || [];
        const comp = list.find(c => c.user_id === userId || c.owner_user_id === userId);
        if (comp) {
          const logo = comp.logo_path || comp.logo || comp.logo_url;
          if (logo) setFallbackLogo(logo);
        }
      })
      .catch(() => {});
  }, [path, role, userId]);

  useEffect(() => setErr(false), [path, fallbackLogo]);

  const finalPath = path || fallbackLogo;
  const imageUrl = buildImageUrl(finalPath);

  return (
    <div
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full font-extrabold ${
        highlight
          ? "bg-gradient-to-br from-emerald-400 to-teal-600 text-[#04201C]"
          : "bg-gradient-to-br from-emerald-100 to-teal-100 text-[#0B3A36] dark:from-emerald-500/20 dark:to-teal-500/20 dark:text-emerald-400"
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
        <span style={{ fontSize: size * 0.34 }}>{initials(name)}</span>
      )}
    </div>
  );
}

function GroupBubble({ size = 48 }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0E4B42] to-[#0B2A35] text-emerald-300"
    >
      <Users size={size * 0.42} />
    </div>
  );
}

// ============================================
// PAGE PRINCIPALE
// ============================================
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
  const targetHandledRef = useRef(false);

  const loadConversations = () => {
    return api.get("/conversations")
      .then((res) => {
        const list = res.data || [];
        setConversations(list);
        return list;
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadConversations().then((list) => {
      if (!activeId && list.length > 0) setActiveId(list[0].id);
    });
    const i = setInterval(() => loadConversations(), 10000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (!targetUserId || targetHandledRef.current) return;
    targetHandledRef.current = true;

    const openConversationWith = async () => {
      try {
        const res = await api.post("/conversations/direct", { user_id: Number(targetUserId) });
        const data = res.data;

        if (data?.conversation?.id) {
          setActiveId(data.conversation.id);
          setMessages([]);
          setShowMobileList(false);
          await loadConversations();
        }
      } catch (err) {
        console.error("Erreur:", err);
      } finally {
        setSearchParams({}, { replace: true });
        setTimeout(() => { targetHandledRef.current = false; }, 500);
      }
    };

    openConversationWith();
  }, [targetUserId]);

  useEffect(() => {
    if (!activeId) return;
    setShowMobileList(false);

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/conversations/${activeId}/messages`);
        setMessages(res.data || []);
        loadConversations();
      } catch (err) {
        console.error("Erreur messages:", err);
      }
    };

    fetchMessages();
    const i = setInterval(fetchMessages, 5000);
    return () => clearInterval(i);
  }, [activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onEmojiClick = (emojiData) => {
    setBody((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Fichier trop lourd (5 Mo max).");
      return;
    }
    const isImage = file.type.startsWith("image/");
    const preview = isImage ? URL.createObjectURL(file) : null;
    setAttachment({ file, preview, isImage, name: file.name });
    e.target.value = "";
  };

  const removeAttachment = () => {
    if (attachment?.preview) URL.revokeObjectURL(attachment.preview);
    setAttachment(null);
  };

  const send = async (e) => {
    e?.preventDefault();
    if ((!body.trim() && !attachment) || !activeId || sending) return;

    const text = body;
    const file = attachment?.file;
    setBody("");
    setSending(true);

    const tempMsg = {
      id: `temp-${Date.now()}`,
      body: text,
      attachment_url: attachment?.preview || null,
      attachment_name: attachment?.name || null,
      sender_id: user?.id,
      created_at: new Date().toISOString(),
      pending: true,
    };
    setMessages((m) => [...m, tempMsg]);
    setAttachment(null);

    try {
      const formData = new FormData();
      formData.append("body", text || "");
      if (file) formData.append("attachment", file);

      const res = await api.post(`/conversations/${activeId}/messages`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessages((m) => m.map((msg) => (msg.id === tempMsg.id ? res.data : msg)));
      loadConversations();
    } catch (err) {
      console.error("Erreur envoi:", err);
      setMessages((m) => m.filter((msg) => msg.id !== tempMsg.id));
      alert("Erreur d'envoi");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleContextAction = async (action, conv) => {
    try {
      if (action === "open") return setActiveId(conv.id);
      if (action === "mark-unread") {
        await api.post(`/conversations/${conv.id}/mark-unread`);
        return loadConversations();
      }
      if (action === "archive") {
        await api.post(`/conversations/${conv.id}/archive`);
        if (activeId === conv.id) setActiveId(null);
        return loadConversations();
      }
      if (action === "delete") {
        if (!confirm("Supprimer cette conversation ?")) return;
        await api.delete(`/conversations/${conv.id}`);
        if (activeId === conv.id) setActiveId(null);
        return loadConversations();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Erreur");
    }
  };

  const filtered = conversations.filter((c) => {
    if (filter === "unread" && !c.unread_count) return false;
    if (filter === "groups" && c.participants?.length <= 2 && !c.title) return false;
    if (search.trim()) {
      const other = getOtherParticipant(c);
      const haystack = `${other?.name || ""} ${c.title || ""} ${c.messages?.[0]?.body || ""}`.toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const activeConv = conversations.find((c) => c.id === activeId);
  const otherUser = activeConv ? getOtherParticipant(activeConv) : null;
  const hasActiveChat = Boolean(activeConv);

  function getOtherParticipant(conv) {
    return conv.participants?.find((p) => p.id !== user?.id) || conv.participants?.[0];
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-emerald-500 border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  const activeIsGroup = Boolean(activeConv?.title || activeConv?.participants?.length > 2);

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-11rem)] min-h-[520px] overflow-hidden rounded-3xl border border-slate-200 bg-white/80 shadow-[0_20px_60px_rgba(15,60,60,0.10)] ring-1 ring-slate-900/[0.04] backdrop-blur dark:border-white/10 dark:bg-[#112A3A]/80 dark:ring-white/5">

        <aside className={`w-full shrink-0 flex-col border-r border-slate-100 bg-white/90 md:flex md:w-[380px] dark:border-white/10 dark:bg-[#112A3A] ${
          showMobileList ? "flex" : "hidden"
        }`}>
          <div className="flex items-end justify-between px-5 pb-3 pt-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Messagerie</p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#0B1F33] dark:text-white">Discussions</h2>
            </div>
            <div className="flex items-center gap-1.5">
              <button className="rounded-full p-2.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-white" aria-label="Plus d'options">
                <MoreHorizontal size={18} />
              </button>
              <button
                onClick={() => setShowNewModal(true)}
                aria-label="Nouveau message"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400 text-[#04201C] shadow-[0_8px_20px_rgba(52,211,153,0.4)] transition hover:bg-emerald-300 dark:bg-emerald-500 dark:text-white dark:hover:bg-emerald-400"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div className="px-5 pb-3">
            <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2.5 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100 dark:border-white/10 dark:bg-white/5 dark:focus-within:border-emerald-500/50 dark:focus-within:bg-white/10 dark:focus-within:ring-emerald-500/10">
              <Search size={16} className="text-slate-400 dark:text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher dans Messagerie"
                className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-white dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="px-5 pb-3">
            <div className="inline-flex rounded-full bg-[#EEF3F6] p-1 dark:bg-white/5">
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
                      ? "bg-[#0B2A35] text-white shadow-sm dark:bg-emerald-500 dark:text-white"
                      : "text-slate-500 hover:text-[#0B2A35] dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-0.5 overflow-y-auto px-2.5 pb-3">
            {filtered.length === 0 && (
              <div className="px-4 py-12 text-center">
                <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:ring-emerald-500/20">
                  <span className="h-3 w-3 rounded-full bg-gradient-to-br from-emerald-300 to-teal-500" />
                </span>
                <p className="text-sm text-slate-500 dark:text-slate-400">Aucune conversation</p>
              </div>
            )}
            {filtered.map((conv) => {
              const other = getOtherParticipant(conv);
              const lastMsg = conv.messages?.[0];
              const isActive = conv.id === activeId;
              const isUnread = conv.unread_count > 0;
              const isGroup = conv.participants?.length > 2 || !!conv.title;
              const avatarPath = getAvatarPath(other);

              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveId(conv.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, conversation: conv });
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                    isActive
                      ? "bg-emerald-50 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:ring-emerald-500/20"
                      : "hover:bg-[#F4F8FA] dark:hover:bg-white/5"
                  }`}
                >
                  <div className="relative shrink-0">
                    {isGroup ? (
                      <GroupBubble size={48} />
                    ) : (
                      <AvatarBubble path={avatarPath} name={other?.name} size={48} highlight={isUnread} role={other?.role} userId={other?.id} />
                    )}
                    {!isGroup && (
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-[#112A3A]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate text-sm ${isUnread ? "font-extrabold text-[#0B1F33] dark:text-white" : "font-semibold text-slate-700 dark:text-slate-200"}`}>
                        {isGroup ? conv.title || "Groupe" : (other?.name || "Conversation")}
                      </p>
                      <span className={`shrink-0 text-[11px] ${isUnread ? "font-bold text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
                        {timeAgo(lastMsg?.created_at)}
                      </span>
                    </div>
                    <p className={`mt-0.5 truncate text-xs ${
                      isUnread ? "font-bold text-slate-700 dark:text-slate-300" : "text-slate-500 dark:text-slate-400"
                    }`}>
                      {lastMsg?.attachment_url && !lastMsg?.body ? "Pièce jointe" : (
                        lastMsg ? `${lastMsg.sender_id === user?.id ? "Vous : " : ""}${lastMsg.body}` : "Aucun message"
                      )}
                    </p>
                  </div>

                  {isUnread && (
                    <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-extrabold text-white shadow-sm">
                      {conv.unread_count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        <section className={`flex-1 flex-col bg-gradient-to-b from-[#F5F9FA] to-[#EBF3F3] md:flex dark:from-[#0B1F33] dark:to-[#081D2D] ${
          !showMobileList && hasActiveChat ? "flex" : "hidden md:flex"
        }`}>
          {!hasActiveChat ? (
            <div className="flex flex-1 flex-col items-center justify-center text-slate-500 dark:text-slate-400">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-[#0E4B42] to-[#0B2A35] text-emerald-300 shadow-[0_16px_40px_rgba(8,60,55,0.3)]">
                <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-emerald-400/30 blur-2xl" />
                <Send size={34} className="relative" />
              </div>
              <p className="mt-5 text-base font-extrabold text-[#0B1F33] dark:text-white">Vos messages</p>
              <p className="mt-1 text-sm">Sélectionne une conversation pour commencer.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 bg-white/85 px-5 py-3.5 backdrop-blur dark:border-white/10 dark:bg-[#112A3A]/85">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    onClick={() => setShowMobileList(true)}
                    aria-label="Retour"
                    className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 md:hidden dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <div className="relative shrink-0">
                    {activeIsGroup ? (
                      <GroupBubble size={42} />
                    ) : (
                      <AvatarBubble path={getAvatarPath(otherUser)} name={otherUser?.name} size={42} role={otherUser?.role} userId={otherUser?.id} />
                    )}
                    {!activeIsGroup && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-[#112A3A]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    {activeIsGroup ? (
                      <>
                        <p className="truncate text-[15px] font-extrabold text-[#0B1F33] dark:text-white">
                          {activeConv.title || "Groupe"}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {activeConv.participants?.length || 0} participants
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="truncate text-[15px] font-extrabold text-[#0B1F33] dark:text-white">{otherUser?.name || "Conversation"}</p>
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Actif maintenant
                        </p>
                      </>
                    )}
                  </div>
                </div>
                {activeConv && (
                  <button
                    onClick={() => setShowInfoModal(true)}
                    className="rounded-full p-2.5 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                    title="Infos"
                    aria-label="Informations de la conversation"
                  >
                    <Info size={18} />
                  </button>
                )}
              </div>

              <div className="flex-1 space-y-1 overflow-y-auto p-5">
                {messages.length === 0 && (
                  <div className="py-10 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Aucun message. Envoyez le premier !</p>
                  </div>
                )}

                {messages.map((msg, i) => {
                  const isMine = msg.sender_id === user?.id;
                  const prevMsg = messages[i - 1];
                  const nextMsg = messages[i + 1];

                  const showDateHeader = !prevMsg ||
                    new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();

                  const showAvatar = !isMine && (!prevMsg || prevMsg.sender_id !== msg.sender_id);

                  const isLastInGroup = !nextMsg ||
                    nextMsg.sender_id !== msg.sender_id ||
                    new Date(nextMsg.created_at).getTime() - new Date(msg.created_at).getTime() > 60000;

                  const senderAvatar = getAvatarPath(msg.sender);

                  return (
                    <React.Fragment key={msg.id}>
                      {showDateHeader && (
                        <div className="flex justify-center py-3">
                          <span className="rounded-full bg-white px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 shadow-sm ring-1 ring-slate-100 dark:bg-[#112A3A] dark:text-slate-400 dark:ring-white/10">
                            {formatDateHeader(msg.created_at)}
                          </span>
                        </div>
                      )}

                      <div className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                        {!isMine && (
                          <div className="w-8 shrink-0">
                            {showAvatar && (
                              <AvatarBubble path={senderAvatar} name={msg.sender?.name} size={32} role={msg.sender?.role} userId={msg.sender?.id} />
                            )}
                          </div>
                        )}

                        <div className={`flex max-w-[72%] flex-col ${isMine ? "items-end" : "items-start"}`}>
                          {!isMine && showAvatar && (
                            <p className="mb-1 px-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                              {msg.sender?.name}
                            </p>
                          )}

                          <div className={`overflow-hidden rounded-3xl ${
                            isMine
                              ? `bg-gradient-to-br from-[#0E4B42] to-[#0B3A36] text-white shadow-[0_8px_20px_rgba(8,60,55,0.22)] dark:from-emerald-600 dark:to-teal-700 ${isLastInGroup ? "rounded-br-lg" : ""}`
                              : `bg-white text-[#0B1F33] shadow-sm ring-1 ring-slate-100 dark:bg-[#0B1F33] dark:text-slate-200 dark:ring-white/5 ${isLastInGroup ? "rounded-bl-lg" : ""}`
                          } ${msg.pending ? "opacity-60" : ""}`}>

                            {msg.attachment_url && msg.attachment_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                              <img src={msg.attachment_url} alt="image" className="max-w-xs" />
                            )}

                            {msg.attachment_url && !msg.attachment_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                              <a href={msg.attachment_url} target="_blank" rel="noreferrer"
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold underline underline-offset-4">
                                <FileText size={16} /> Télécharger
                              </a>
                            )}

                            {msg.body && (
                              <p className="whitespace-pre-wrap break-words px-4 py-2.5 text-sm leading-6">{msg.body}</p>
                            )}
                          </div>

                          {isLastInGroup && (
                            <div className="mt-1 flex items-center gap-1 px-1">
                              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                {formatMessageTime(msg.created_at)}
                              </span>
                              {isMine && (
                                msg.pending
                                  ? <Check size={12} className="text-slate-400 dark:text-slate-500" />
                                  : <CheckCheck size={12} className="text-emerald-500 dark:text-emerald-400" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              {attachment && (
                <div className="mx-4 mb-2 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100 dark:bg-[#112A3A] dark:ring-white/10">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-emerald-50 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:ring-emerald-500/20">
                    {attachment.isImage ? (
                      <img src={attachment.preview} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <FileText size={20} className="text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#0B1F33] dark:text-white">{attachment.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Prêt à envoyer</p>
                  </div>
                  <button onClick={removeAttachment}
                    aria-label="Retirer la pièce jointe"
                    className="rounded-full p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400">
                    <X size={16} />
                  </button>
                </div>
              )}

              {showEmojiPicker && (
                <div className="relative">
                  <div className="absolute bottom-2 right-4 z-20 overflow-hidden rounded-2xl shadow-[0_20px_50px_rgba(15,60,60,0.25)] ring-1 ring-slate-200 dark:ring-white/10">
                    <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" height={350} width={300} searchDisabled={false} skinTonesDisabled />
                  </div>
                </div>
              )}

              <form onSubmit={send} className="relative border-t border-slate-100 bg-white/85 p-3.5 backdrop-blur dark:border-white/10 dark:bg-[#112A3A]/85">
                <div className="flex items-end gap-1.5 rounded-[26px] border border-slate-200 bg-slate-50/80 px-3 py-2 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100 dark:border-white/10 dark:bg-white/5 dark:focus-within:border-emerald-500/50 dark:focus-within:bg-white/10 dark:focus-within:ring-emerald-500/10">

                  <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-full p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white" title="Joindre un fichier">
                    <Plus size={18} />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.doc,.docx" className="hidden" onChange={handleFilePick} />

                  <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-full p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white" title="Envoyer une photo">
                    <ImageIcon size={18} />
                  </button>

                  <textarea
                    ref={inputRef}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Écrire un message..."
                    rows={1}
                    className="max-h-24 flex-1 resize-none bg-transparent py-2 text-sm text-[#0B1F33] placeholder:text-slate-400 focus:outline-none dark:text-white dark:placeholder:text-slate-500"
                  />

                  <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`rounded-full p-2 transition ${showEmojiPicker ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"}`} title="Emojis">
                    <Smile size={18} />
                  </button>

                  {(body.trim() || attachment) && (
                    <button type="submit" disabled={sending} className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400 text-[#04201C] shadow-[0_8px_20px_rgba(52,211,153,0.4)] transition hover:bg-emerald-300 disabled:opacity-40 dark:bg-emerald-500 dark:text-white dark:hover:bg-emerald-400">
                      <Send size={16} />
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </section>
      </div>

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
              loadConversations();
              setActiveId(conv.id);
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
          }}
        />
      )}

      {showInfoModal && activeConv && (
        <ConversationInfoModal
          conversation={activeConv}
          onClose={() => setShowInfoModal(false)}
          onUpdated={() => loadConversations()}
          onLeft={() => {
            setShowInfoModal(false);
            setActiveId(null);
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

// ============================================
// MODAL NOUVELLE CONVERSATION
// ============================================
function NewConversationModal({ onClose, onCreated }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.get("/users/suggestions?limit=10")
      .then((res) => setSuggestions(res.data || []))
      .catch(() => setSuggestions([]))
      .finally(() => setLoadingSuggestions(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (search.trim().length < 2) { setResults([]); return; }
      setLoading(true);
      api.get(`/users/search?q=${encodeURIComponent(search)}`)
        .then((res) => setResults(res.data || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const startDirect = async (userId) => {
    setCreating(true);
    try {
      const res = await api.post("/conversations/direct", { user_id: userId });
      const data = res.data;
      if (data?.conversation?.id) {
        onCreated(data.conversation);
      }
    } catch {
      alert("Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  };

  const displayUsers = search.trim().length >= 2 ? results : suggestions;
  const showingSuggestions = search.trim().length < 2;

  const spinner = (
    <div className="flex justify-center py-6">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06141F]/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(6,25,35,0.35)] dark:bg-[#112A3A] dark:ring-1 dark:ring-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="relative flex items-center justify-between overflow-hidden bg-gradient-to-r from-[#0B2A35] via-[#0B3A36] to-[#0E4B42] px-6 py-4 text-white">
          <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-emerald-400/25 blur-2xl" />
          <h2 className="relative text-[15px] font-extrabold tracking-tight">Nouveau message</h2>
          <button onClick={onClose} aria-label="Fermer" className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20">
            <X size={18} />
          </button>
        </div>

        <button onClick={() => onCreated(null, "openGroup")} className="flex w-full items-center gap-3 border-b border-slate-100 px-6 py-3.5 text-left transition hover:bg-emerald-50/60 dark:border-white/10 dark:hover:bg-white/5">
          <GroupBubble size={42} />
          <div className="flex-1">
            <p className="text-sm font-extrabold text-[#0B1F33] dark:text-white">Créer un canal / groupe</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Discussion à plusieurs</p>
          </div>
        </button>

        <div className="px-5 pb-2 pt-4">
          <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2.5 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100 dark:border-white/10 dark:bg-white/5 dark:focus-within:border-emerald-500/50 dark:focus-within:bg-white/10 dark:focus-within:ring-emerald-500/10">
            <Search size={16} className="text-slate-400 dark:text-slate-500" />
            <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="À : rechercher un utilisateur..." className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-white dark:placeholder:text-slate-500" />
          </div>
        </div>

        <div className="px-6 pb-2 pt-2">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
            {showingSuggestions ? "Suggestions" : "Résultats"}
          </p>
        </div>

        <div className="max-h-80 overflow-y-auto px-2.5 pb-3">
          {loadingSuggestions && showingSuggestions && spinner}
          {loading && !showingSuggestions && spinner}

          {!loading && !showingSuggestions && displayUsers.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">Aucun utilisateur trouvé</p>
          )}

          {!loadingSuggestions && showingSuggestions && displayUsers.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">Aucune suggestion</p>
          )}

          {displayUsers.map((u) => {
            const avatarPath = getAvatarPath(u);
            return (
              <button key={u.id} onClick={() => startDirect(u.id)} disabled={creating} className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition hover:bg-emerald-50/60 disabled:opacity-50 dark:hover:bg-white/5">
                <AvatarBubble path={avatarPath} name={u.name} size={42} role={u.role} userId={u.id} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-[#0B1F33] dark:text-white">{u.name}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {u.role === "company" ? "Entreprise" : u.role === "student" ? "Étudiant" : "Talent"}
                    {u.email && ` · ${u.email}`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}