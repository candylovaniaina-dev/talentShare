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
// HELPERS
// ============================================
function initials(name) {
  return (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
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

  // ============================================
  // CHARGEMENT
  // ============================================
  const loadConversations = () => {
    api.get("/conversations")
      .then((res) => {
        const list = res.data || [];
        setConversations(list);
        if (!activeId && list.length > 0) setActiveId(list[0].id);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadConversations();
    const i = setInterval(loadConversations, 10000);
    return () => clearInterval(i);
  }, []);

  // ✅ Gestion du paramètre ?to=userId
  useEffect(() => {
    if (!targetUserId || targetHandledRef.current) return;
    targetHandledRef.current = true;

    const openConversationWith = async () => {
      try {
        // 1) Charge les conversations
        const convRes = await api.get("/conversations");
        const list = convRes.data || [];
        setConversations(list);

        // 2) Cherche une conversation existante
        const existing = list.find((c) =>
          c.participants?.some((p) => String(p.id) === String(targetUserId))
        );

        if (existing) {
          setActiveId(existing.id);
          setShowMobileList(false);
        } else {
          // 3) Crée une nouvelle conversation directe
          const createRes = await api.post("/conversations/direct", {
            user_id: Number(targetUserId),
          });
          const newConv = createRes.data;

          // 4) Recharge la liste
          const refresh = await api.get("/conversations");
          setConversations(refresh.data || []);

          setActiveId(newConv.id);
          setShowMobileList(false);
        }
      } catch (err) {
        console.error("Erreur ouverture conversation:", err);
      } finally {
        // 5) Nettoie l'URL
        setSearchParams({}, { replace: true });
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

        setTimeout(async () => {
          const convRes = await api.get("/conversations");
          setConversations(convRes.data || []);
        }, 300);
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

  // ============================================
  // EMOJIS
  // ============================================
  const onEmojiClick = (emojiData) => {
    setBody((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  // ============================================
  // PIÈCE JOINTE
  // ============================================
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

  // ============================================
  // ENVOI
  // ============================================
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
    } catch {
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

  // ============================================
  // CONTEXT MENU ACTIONS
  // ============================================
  const handleContextAction = async (action, conv) => {
    try {
      if (action === "open") {
        setActiveId(conv.id);
        return;
      }

      if (action === "mark-unread") {
        await api.post(`/conversations/${conv.id}/mark-unread`);
        loadConversations();
        return;
      }

      if (action === "archive") {
        await api.post(`/conversations/${conv.id}/archive`);
        if (activeId === conv.id) setActiveId(null);
        loadConversations();
        return;
      }

      if (action === "delete") {
        if (!confirm("Supprimer cette conversation ?")) return;
        await api.delete(`/conversations/${conv.id}`);
        if (activeId === conv.id) setActiveId(null);
        loadConversations();
        return;
      }
    } catch (err) {
      alert(err.response?.data?.message || "Erreur");
    }
  };

  // ============================================
  // FILTRES
  // ============================================
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

  function getOtherParticipant(conv) {
    return conv.participants?.find((p) => p.id !== user?.id) || conv.participants?.[0];
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-500" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#0F1E45] shadow-xl">

        {/* ==================== COLONNE LISTE ==================== */}
        <aside className={`w-full shrink-0 flex-col border-r border-white/10 bg-[#0F1E45] md:flex md:w-96 ${
          showMobileList ? "flex" : "hidden"
        }`}>

          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <h2 className="text-2xl font-bold text-white">Discussions</h2>
            <div className="flex items-center gap-1">
              <button className="rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white">
                <MoreHorizontal size={18} />
              </button>
              <button
                onClick={() => setShowNewModal(true)}
                className="rounded-full bg-emerald-500 p-2 text-[#0A1229] transition hover:bg-emerald-400"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-2">
              <Search size={16} className="text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher dans Messagerie"
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-1 px-4 pb-3">
            {[
              { id: "all", label: "Tout" },
              { id: "unread", label: "Non lu" },
              { id: "groups", label: "Groupes" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  filter === tab.id
                    ? "bg-emerald-500 text-[#0A1229]"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-slate-500">Aucune conversation</p>
              </div>
            )}
            {filtered.map((conv) => {
              const other = getOtherParticipant(conv);
              const lastMsg = conv.messages?.[0];
              const isActive = conv.id === activeId;
              const isUnread = conv.unread_count > 0;
              const isGroup = conv.participants?.length > 2 || !!conv.title;

              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveId(conv.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, conversation: conv });
                  }}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${
                    isActive ? "bg-emerald-500/10" : "hover:bg-white/5"
                  }`}
                >
                  <div className="relative shrink-0">
                    {isGroup ? (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                        <Users size={20} />
                      </div>
                    ) : other?.avatar_path ? (
                      <img src={`http://localhost:8000/storage/${other.avatar_path}`}
                        className="h-12 w-12 rounded-full object-cover"
                        alt={other.name} />
                    ) : (
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full font-bold text-[#0A1229] ${
                        isUnread ? "bg-emerald-400" : "bg-emerald-500/30 text-emerald-300"
                      }`}>
                        {initials(other?.name)}
                      </div>
                    )}
                    {!isGroup && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#0F1E45] bg-emerald-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate text-sm ${isUnread ? "font-bold text-white" : "font-medium text-slate-200"}`}>
                        {isGroup ? conv.title || "Groupe" : (other?.name || "Conversation")}
                      </p>
                      <span className={`shrink-0 text-[11px] ${isUnread ? "font-semibold text-emerald-400" : "text-slate-500"}`}>
                        {timeAgo(lastMsg?.created_at)}
                      </span>
                    </div>
                    <p className={`mt-0.5 truncate text-xs ${
                      isUnread ? "font-semibold text-slate-200" : "text-slate-500"
                    }`}>
                      {lastMsg?.attachment_url && !lastMsg?.body ? "📎 Pièce jointe" : (
                        lastMsg ? `${lastMsg.sender_id === user?.id ? "Vous : " : ""}${lastMsg.body}` : "Aucun message"
                      )}
                    </p>
                  </div>

                  {isUnread && (
                    <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-[#0A1229]">
                      {conv.unread_count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* ==================== COLONNE CHAT ==================== */}
        <section className={`flex-1 flex-col bg-[#0A1229] md:flex ${
          !showMobileList && activeConv ? "flex" : "hidden md:flex"
        }`}>
          {!activeConv ? (
            <div className="flex flex-1 flex-col items-center justify-center text-slate-500">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
                <Send size={32} />
              </div>
              <p className="mt-4 text-sm">Sélectionne une conversation</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-white/10 bg-[#0F1E45] px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setShowMobileList(true)}
                    className="rounded-full p-1.5 text-slate-400 hover:bg-white/5 hover:text-white md:hidden"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <div className="relative shrink-0">
                    {activeConv.title || activeConv.participants?.length > 2 ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                        <Users size={18} />
                      </div>
                    ) : otherUser?.avatar_path ? (
                      <img
                        src={`http://localhost:8000/storage/${otherUser.avatar_path}`}
                        className="h-10 w-10 rounded-full object-cover"
                        alt={otherUser.name}
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/30 font-bold text-emerald-300">
                        {initials(otherUser?.name)}
                      </div>
                    )}
                    {!(activeConv.title || activeConv.participants?.length > 2) && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0F1E45] bg-emerald-500" />
                    )}
                  </div>

                  <div className="min-w-0">
                    {activeConv.title || activeConv.participants?.length > 2 ? (
                      <>
                        <p className="truncate font-semibold text-white">
                          {activeConv.title || "Groupe"}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {activeConv.participants?.length || 0} participants
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="truncate font-semibold text-white">{otherUser?.name || "Conversation"}</p>
                        <p className="text-[11px] text-emerald-400">● Actif maintenant</p>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowInfoModal(true)}
                  className="rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white"
                  title="Infos"
                >
                  <Info size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {messages.length === 0 && (
                  <div className="py-10 text-center">
                    <p className="text-sm text-slate-500">Aucun message. Envoyez le premier !</p>
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

                  return (
                    <React.Fragment key={msg.id}>
                      {showDateHeader && (
                        <div className="flex items-center gap-3 py-3">
                          <div className="h-px flex-1 bg-white/5" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {formatDateHeader(msg.created_at)}
                          </span>
                          <div className="h-px flex-1 bg-white/5" />
                        </div>
                      )}

                      <div className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                        {!isMine && (
                          <div className="w-7 shrink-0">
                            {showAvatar && (
                              msg.sender?.avatar_path ? (
                                <img src={`http://localhost:8000/storage/${msg.sender.avatar_path}`}
                                  className="h-7 w-7 rounded-full object-cover" alt="" />
                              ) : (
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
                                  {initials(msg.sender?.name)}
                                </div>
                              )
                            )}
                          </div>
                        )}

                        <div className={`flex max-w-[70%] flex-col ${isMine ? "items-end" : "items-start"}`}>
                          {!isMine && showAvatar && (
                            <p className="mb-0.5 px-1 text-[10px] font-semibold text-slate-400">
                              {msg.sender?.name}
                            </p>
                          )}

                          <div className={`rounded-2xl overflow-hidden shadow-sm ${
                            isMine
                              ? `bg-emerald-500 text-[#0A1229] ${isLastInGroup ? "rounded-br-md" : ""}`
                              : `bg-white/10 text-white ${isLastInGroup ? "rounded-bl-md" : ""}`
                          } ${msg.pending ? "opacity-60" : ""}`}>

                            {msg.attachment_url && msg.attachment_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                              <img src={msg.attachment_url} alt="image" className="max-w-xs" />
                            )}

                            {msg.attachment_url && !msg.attachment_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                              <a href={msg.attachment_url} target="_blank" rel="noreferrer"
                                className="flex items-center gap-2 px-3 py-2 text-sm underline">
                                <FileText size={16} /> Télécharger
                              </a>
                            )}

                            {msg.body && (
                              <p className="whitespace-pre-wrap break-words px-3.5 py-2 text-sm">{msg.body}</p>
                            )}
                          </div>

                          {isLastInGroup && (
                            <div className="mt-0.5 flex items-center gap-1 px-1">
                              <span className={`text-[10px] ${isMine ? "text-slate-500" : "text-slate-600"}`}>
                                {formatMessageTime(msg.created_at)}
                              </span>
                              {isMine && (
                                msg.pending
                                  ? <Check size={11} className="text-slate-500" />
                                  : <CheckCheck size={11} className="text-emerald-400" />
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
                <div className="flex items-center gap-3 border-t border-white/10 bg-[#0F1E45] px-4 py-2">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5">
                    {attachment.isImage ? (
                      <img src={attachment.preview} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <FileText size={20} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm text-white">{attachment.name}</p>
                    <p className="text-xs text-slate-500">Prêt à envoyer</p>
                  </div>
                  <button onClick={removeAttachment}
                    className="rounded-full p-1.5 text-slate-400 hover:bg-white/5 hover:text-rose-400">
                    <X size={16} />
                  </button>
                </div>
              )}

              {showEmojiPicker && (
                <div className="relative border-t border-white/10 bg-[#0F1E45]">
                  <div className="absolute bottom-2 right-4 z-20">
                    <EmojiPicker
                      onEmojiClick={onEmojiClick}
                      theme="dark"
                      height={350}
                      width={300}
                      searchDisabled={false}
                      skinTonesDisabled
                    />
                  </div>
                </div>
              )}

              <form onSubmit={send} className="relative border-t border-white/10 bg-[#0F1E45] p-3">
                <div className="flex items-end gap-2 rounded-2xl bg-white/5 px-3 py-2">

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
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
                    className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                    title="Envoyer une photo"
                  >
                    <ImageIcon size={18} />
                  </button>

                  <textarea
                    ref={inputRef}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Aa"
                    rows={1}
                    className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none max-h-24 py-1.5"
                  />

                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`rounded-full p-1.5 transition ${
                      showEmojiPicker ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400 hover:bg-white/10 hover:text-white"
                    }`}
                    title="Emojis"
                  >
                    <Smile size={18} />
                  </button>

                  {(body.trim() || attachment) && (
                    <button
                      type="submit"
                      disabled={sending}
                      className="rounded-full bg-emerald-500 p-2 text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-40"
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
      onCreated(res.data);
    } catch {
      alert("Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  };

  const displayUsers = search.trim().length >= 2 ? results : suggestions;
  const showingSuggestions = search.trim().length < 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0F1E45] shadow-2xl" onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-bold text-white">Nouveau message</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <button
          onClick={() => onCreated(null, "openGroup")}
          className="flex w-full items-center gap-3 border-b border-white/10 px-5 py-3 text-left transition hover:bg-white/5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <Users size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Créer un canal / groupe</p>
            <p className="text-xs text-slate-500">Discussion à plusieurs</p>
          </div>
        </button>

        <div className="p-4 pb-2">
          <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-2">
            <Search size={16} className="text-slate-500" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="À : rechercher un utilisateur..."
              className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="px-4 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {showingSuggestions ? "Suggestions" : "Résultats"}
          </p>
        </div>

        <div className="max-h-80 overflow-y-auto pb-2">
          {loadingSuggestions && showingSuggestions && (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          )}

          {loading && !showingSuggestions && (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          )}

          {!loading && !showingSuggestions && displayUsers.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">Aucun utilisateur trouvé</p>
          )}

          {!loadingSuggestions && showingSuggestions && displayUsers.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">Aucune suggestion</p>
          )}

          {displayUsers.map((u) => (
            <button
              key={u.id}
              onClick={() => startDirect(u.id)}
              disabled={creating}
              className="flex w-full items-center gap-3 px-4 py-2 text-left transition hover:bg-white/5 disabled:opacity-50"
            >
              {u.avatar_path ? (
                <img src={`http://localhost:8000/storage/${u.avatar_path}`}
                  className="h-10 w-10 rounded-full object-cover" alt="" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 font-bold text-emerald-300">
                  {initials(u.name)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{u.name}</p>
                <p className="truncate text-xs text-slate-500">
                  {u.role === "company" ? "Entreprise" : u.role === "student" ? "Étudiant" : "Talent"}
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