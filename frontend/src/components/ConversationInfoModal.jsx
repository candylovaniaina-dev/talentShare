import React, { useEffect, useState } from "react";
import {
  X, Users, UserPlus, LogOut, Edit2, Check, Loader2, Search, Trash2,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function initials(name) {
  return (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function ConversationInfoModal({ conversation, onClose, onUpdated, onLeft }) {
  const { user } = useAuth();

  const [conv, setConv] = useState(conversation);
  const [participants, setParticipants] = useState(conversation?.participants || []);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(conversation?.title || "");
  const [savingTitle, setSavingTitle] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);

  const isGroup = participants.length > 2 || !!conv.title;

  // ✅ Refresh au démarrage
  useEffect(() => {
    api.get(`/conversations/${conversation.id}`)
      .then((res) => {
        setConv(res.data);
        setParticipants(res.data.participants || []);
        setTitleDraft(res.data.title || "");
      })
      .catch(() => {});
  }, [conversation.id]);

  // ✅ Recherche d'utilisateurs à ajouter
  useEffect(() => {
    if (!showAddMember) return;
    const t = setTimeout(() => {
      if (search.trim().length < 2) { setSearchResults([]); return; }
      setSearching(true);
      api.get(`/users/search?q=${encodeURIComponent(search)}`)
        .then((res) => {
          const existingIds = participants.map((p) => p.id);
          const filtered = (res.data || []).filter((u) => !existingIds.includes(u.id));
          setSearchResults(filtered);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search, showAddMember, participants]);

  // ✅ Renommer le groupe
  const saveTitle = async () => {
    if (!titleDraft.trim() || titleDraft === conv.title) {
      setEditingTitle(false);
      return;
    }
    setSavingTitle(true);
    try {
      const res = await api.patch(`/conversations/${conv.id}`, { title: titleDraft.trim() });
      setConv(res.data.conversation);
      setEditingTitle(false);
      onUpdated?.(res.data.conversation);
    } catch {
      alert("Erreur");
    } finally {
      setSavingTitle(false);
    }
  };

  // ✅ Ajouter un participant
  const addParticipant = async (userId) => {
    setLoading(true);
    try {
      const res = await api.post(`/conversations/${conv.id}/participants`, { user_id: userId });
      setParticipants(res.data.participants);
      setSearch("");
      setSearchResults([]);
      setShowAddMember(false);
      onUpdated?.(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Retirer un participant
  const removeParticipant = async (userId) => {
    if (!confirm("Retirer ce participant du groupe ?")) return;
    setLoading(true);
    try {
      const res = await api.delete(`/conversations/${conv.id}/participants/${userId}`);
      setParticipants(res.data.participants);
      onUpdated?.(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Quitter le groupe
  const leaveGroup = async () => {
    if (!confirm("Quitter ce groupe ? Vous ne verrez plus les messages.")) return;
    try {
      await api.post(`/conversations/${conv.id}/leave`);
      onLeft?.();
    } catch {
      alert("Erreur");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#06141F]/70 p-4 backdrop-blur-sm font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/10 bg-[#0B1F33] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <h2 className="text-[17px] font-extrabold text-white">
            {isGroup ? "Infos du groupe" : "Infos du contact"}
          </h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Avatar + Titre */}
        <div className="flex flex-col items-center gap-3 border-b border-white/10 p-6">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#16B8B1]/15 text-[#16B8B1]">
            {isGroup ? (
              <Users size={40} strokeWidth={1.5} />
            ) : participants[0]?.avatar_path ? (
              <img
                src={`/storage/${participants[0].avatar_path}`}
                className="h-24 w-24 rounded-full object-cover"
                alt=""
              />
            ) : (
              <span className="text-3xl font-extrabold">{initials(participants[0]?.name)}</span>
            )}
          </div>

          {/* Titre éditable (si groupe) */}
          {isGroup && (
            <div className="flex w-full items-center justify-center gap-2">
              {editingTitle ? (
                <>
                  <input
                    autoFocus
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    maxLength={180}
                    className="flex-1 max-w-[250px] rounded-xl border border-[#16B8B1]/50 bg-white/5 px-3 py-2 text-center text-sm font-bold text-white focus:border-[#16B8B1] focus:outline-none focus:ring-2 focus:ring-[#16B8B1]/20"
                  />
                  <button
                    onClick={saveTitle}
                    disabled={savingTitle}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#16B8B1] text-[#0B1F33] transition hover:bg-[#0F9691] disabled:opacity-50"
                  >
                    {savingTitle ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  </button>
                </>
              ) : (
                <>
                  <h3 className="max-w-[80%] text-center text-lg font-extrabold leading-tight text-white">
                    {conv.title || "Groupe"}
                  </h3>
                  <button
                    onClick={() => setEditingTitle(true)}
                    className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    title="Renommer"
                  >
                    <Edit2 size={16} />
                  </button>
                </>
              )}
            </div>
          )}

          {!isGroup && (
            <div className="text-center">
              <h3 className="text-lg font-extrabold text-white">{participants[0]?.name || "Contact"}</h3>
              <p className="mt-1 text-xs text-slate-400">{participants[0]?.email}</p>
            </div>
          )}

          <p className="text-xs font-medium text-slate-400">
            {participants.length} participant{participants.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Membres */}
        <div className="border-b border-white/10 p-5">
          <div className="mb-4 flex items-center justify-between px-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
              Membres ({participants.length})
            </p>
            {isGroup && (
              <button
                onClick={() => setShowAddMember(!showAddMember)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#16B8B1]/15 px-3 py-1.5 text-[11px] font-bold text-[#16B8B1] transition hover:bg-[#16B8B1]/25"
              >
                <UserPlus size={13} /> Ajouter
              </button>
            )}
          </div>

          {/* Formulaire d'ajout */}
          {showAddMember && (
            <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5">
                <Search size={16} className="text-slate-400" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un utilisateur..."
                  className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              {searching && (
                <div className="flex justify-center py-4">
                  <Loader2 size={18} className="animate-spin text-[#16B8B1]" />
                </div>
              )}

              {!searching && search.trim().length >= 2 && searchResults.length === 0 && (
                <p className="py-4 text-center text-xs text-slate-400">Aucun utilisateur trouvé</p>
              )}

              {!searching && searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => addParticipant(u.id)}
                  disabled={loading}
                  className="mt-1.5 flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/5 disabled:opacity-50"
                >
                  {u.avatar_path ? (
                    <img src={`/storage/${u.avatar_path}`}
                      className="h-9 w-9 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#16B8B1]/20 text-xs font-bold text-[#16B8B1]">
                      {initials(u.name)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">{u.name}</p>
                    <p className="truncate text-[11px] text-slate-400">{u.email}</p>
                  </div>
                  <UserPlus size={16} className="text-[#16B8B1]" />
                </button>
              ))}
            </div>
          )}

          {/* Liste des participants */}
          <div className="space-y-1">
            {participants.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-white/5"
              >
                {p.avatar_path ? (
                  <img src={`/storage/${p.avatar_path}`}
                    className="h-10 w-10 rounded-full object-cover" alt="" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0F9691] text-xs font-extrabold text-white">
                    {initials(p.name)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">
                    {p.name}
                    {p.id === user?.id && <span className="ml-1.5 text-[11px] font-medium text-[#16B8B1]">(Vous)</span>}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">{p.email}</p>
                </div>
                {isGroup && p.id !== user?.id && (
                  <button
                    onClick={() => removeParticipant(p.id)}
                    disabled={loading}
                    className="rounded-full p-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-50"
                    title="Retirer"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {isGroup && (
          <div className="p-5">
            <button
              onClick={leaveGroup}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-900/50 bg-rose-950/20 px-4 py-3 text-sm font-bold text-rose-400 transition hover:bg-rose-950/40 hover:text-rose-300"
            >
              <LogOut size={18} /> Quitter le groupe
            </button>
          </div>
        )}
      </div>
    </div>
  );
}