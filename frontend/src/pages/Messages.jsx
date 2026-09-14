import React, { useEffect, useState, useRef } from "react";
import { Search, Send, Plus, MoreHorizontal, Users } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | unread | groups
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // ============================================
  // Charger les conversations
  // ============================================
  const loadConversations = () => {
    api.get("/conversations")
      .then((res) => {
        setConversations(res.data || []);
        if (!activeId && res.data?.length > 0) {
          setActiveId(res.data[0].id);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 15000);
    return () => clearInterval(interval);
  }, []);

  // ============================================
  // Charger les messages de la conversation active
  // ============================================
  useEffect(() => {
    if (!activeId) return;
    api.get(`/conversations/${activeId}/messages`)
      .then((res) => setMessages(res.data || []))
      .catch(() => setMessages([]));

    // Rafraîchir toutes les 5s
    const interval = setInterval(() => {
      api.get(`/conversations/${activeId}/messages`)
        .then((res) => setMessages(res.data || []))
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, [activeId]);

  // Scroll en bas à chaque nouveau message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ============================================
  // Envoyer un message
  // ============================================
  const send = async (e) => {
    e.preventDefault();
    if (!body.trim() || !activeId || sending) return;

    setSending(true);
    try {
      const res = await api.post(`/conversations/${activeId}/messages`, { body });
      setMessages((m) => [...m, res.data]);
      setBody("");
      loadConversations();
    } catch (err) {
      alert("Erreur d'envoi");
    } finally {
      setSending(false);
    }
  };

  // ============================================
  // Filtres & Recherche
  // ============================================
  const filtered = conversations.filter((c) => {
    // Onglet actif
    if (filter === "unread" && !c.unread_count) return false;
    if (filter === "groups" && c.participants?.length <= 2) return false;

    // Recherche
    if (search.trim()) {
      const other = getOtherParticipant(c);
      const haystack = `${other?.name || ""} ${c.messages?.[0]?.body || ""}`.toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }

    return true;
  });

  const activeConv = conversations.find((c) => c.id === activeId);
  const otherUser = activeConv ? getOtherParticipant(activeConv) : null;

  // ============================================
  // Helpers
  // ============================================
  function getOtherParticipant(conv) {
    return conv.participants?.find((p) => p.id !== user?.id) || conv.participants?.[0];
  }

  function timeAgo(date) {
    if (!date) return "";
    const d = new Date(date);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return "à l'instant";
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  function initials(name) {
    return (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  }

  if (loading) {
    return <AppShell><p className="text-slate-400">Chargement...</p></AppShell>;
  }

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white">

        {/* ============ PANNEAU GAUCHE : DISCUSSIONS ============ */}
        <aside className="w-96 shrink-0 border-r border-slate-200 flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h2 className="text-2xl font-bold">Discussions</h2>
            <div className="flex items-center gap-1">
              <button className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                <MoreHorizontal size={18} />
              </button>
              <button className="rounded-full bg-slate-100 p-2 text-navy hover:bg-slate-200">
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
              <Search size={16} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher dans Messagerie"
                className="w-full bg-transparent text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Onglets */}
          <div className="flex gap-1 px-4 pb-2">
            {[
              { id: "all", label: "Tout" },
              { id: "unread", label: "Non lu" },
              { id: "groups", label: "Groupes" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  filter === tab.id
                    ? "bg-navy text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Liste des conversations */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="p-4 text-center text-sm text-slate-400">
                Aucune conversation
              </p>
            )}

            {filtered.map((conv) => {
              const other = getOtherParticipant(conv);
              const lastMsg = conv.messages?.[0];
              const isActive = conv.id === activeId;
              const isUnread = conv.unread_count > 0;

              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveId(conv.id)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50 ${
                    isActive ? "bg-mint/10" : ""
                  }`}
                >
                  {/* Avatar avec statut en ligne */}
                  <div className="relative shrink-0">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full font-bold text-navy ${
                      isUnread ? "bg-navy text-white" : "bg-mint/20"
                    }`}>
                      {initials(other?.name)}
                    </div>
                    {/* Point vert = en ligne */}
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate text-sm ${isUnread ? "font-bold" : "font-medium"}`}>
                        {other?.name || "Conversation"}
                      </p>
                      <span className="shrink-0 text-xs text-slate-400">
                        {timeAgo(lastMsg?.created_at)}
                      </span>
                    </div>
                    <p className={`mt-0.5 truncate text-xs ${
                      isUnread ? "font-semibold text-navy" : "text-slate-500"
                    }`}>
                      {lastMsg ? `${lastMsg.sender_id === user?.id ? "Vous : " : ""}${lastMsg.body}` : "Aucun message"}
                    </p>
                  </div>

                  {/* Point bleu non lu */}
                  {isUnread && (
                    <span className="h-3 w-3 shrink-0 rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 p-3 text-center">
            <button className="text-xs font-semibold text-blue-600 hover:underline">
              Tout voir dans Messagerie
            </button>
          </div>
        </aside>

        {/* ============ PANNEAU DROIT : CONVERSATION ============ */}
        <section className="flex-1 flex flex-col">
          {!activeConv ? (
            <div className="flex flex-1 items-center justify-center text-slate-400">
              <p>Sélectionne une conversation</p>
            </div>
          ) : (
            <>
              {/* Header conversation */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mint/20 font-bold text-navy">
                      {initials(otherUser?.name)}
                    </div>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold">{otherUser?.name || "Conversation"}</p>
                    <p className="text-xs text-green-600">● En ligne</p>
                  </div>
                </div>
                <button className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                  <MoreHorizontal size={18} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-1">
                {messages.map((msg, i) => {
                  const isMine = msg.sender_id === user?.id;
                  const showAvatar = i === 0 || messages[i - 1]?.sender_id !== msg.sender_id;

                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                      {!isMine && showAvatar && (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mint/20 text-xs font-bold text-navy">
                          {initials(msg.sender?.name)}
                        </div>
                      )}
                      {!isMine && !showAvatar && <div className="w-7" />}

                      <div className={`max-w-md rounded-2xl px-4 py-2 text-sm ${
                        isMine
                          ? "bg-navy text-white"
                          : "bg-white text-navy border border-slate-200"
                      }`}>
                        <p>{msg.body}</p>
                      </div>
                    </div>
                  );
                })}

                {messages.length === 0 && (
                  <p className="text-center text-sm text-slate-400 py-8">
                    Aucun message. Envoyez le premier !
                  </p>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Formulaire d'envoi */}
              <form onSubmit={send} className="border-t border-slate-100 p-3">
                <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
                  <input
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Écrivez un message..."
                    className="flex-1 bg-transparent text-sm focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!body.trim() || sending}
                    className="rounded-full bg-navy p-2 text-white hover:bg-navy-light disabled:opacity-40"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}