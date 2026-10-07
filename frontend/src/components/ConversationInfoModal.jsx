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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#0F1E45] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-bold text-white">
            {isGroup ? "Infos du groupe" : "Infos du contact"}
          </h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Avatar + Titre */}
        <div className="flex flex-col items-center gap-3 border-b border-white/10 p-6">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-emerald-500/20 text-emerald-400">
            {isGroup ? (
              <Users size={40} />
            ) : participants[0]?.avatar_path ? (
              <img
                src={`http://localhost:8000/storage/${participants[0].avatar_path}`}
                className="h-24 w-24 rounded-full object-cover"
                alt=""
              />
            ) : (
              <span className="text-3xl font-bold">{initials(participants[0]?.name)}</span>
            )}
          </div>

          {/* Titre éditable (si groupe) */}
          {isGroup && (
            <div className="flex w-full items-center gap-2">
              {editingTitle ? (
                <>
                  <input
                    autoFocus
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    maxLength={180}
                    className="flex-1 rounded-lg border border-emerald-500/50 bg-white/5 px-3 py-2 text-center text-base font-semibold text-white focus:outline-none"
                  />
                  <button
                    onClick={saveTitle}
                    disabled={savingTitle}
                    className="rounded-full bg-emerald-500 p-2 text-[#0A1229] hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {savingTitle ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  </button>
                </>
              ) : (
                <>
                  <h3 className="flex-1 text-center text-lg font-bold text-white">
                    {conv.title || "Groupe"}
                  </h3>
                  <button
                    onClick={() => setEditingTitle(true)}
                    className="rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white"
                    title="Renommer"
                  >
                    <Edit2 size={14} />
                  </button>
                </>
              )}
            </div>
          )}

          {!isGroup && (
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">{participants[0]?.name || "Contact"}</h3>
              <p className="text-xs text-slate-500">{participants[0]?.email}</p>
            </div>
          )}

          <p className="text-xs text-slate-500">
            {participants.length} participant{participants.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Membres */}
        <div className="border-b border-white/10 p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Membres ({participants.length})
            </p>
            {isGroup && (
              <button
                onClick={() => setShowAddMember(!showAddMember)}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500/20"
              >
                <UserPlus size={11} /> Ajouter
              </button>
            )}
          </div>

          {/* Formulaire d'ajout */}
          {showAddMember && (
            <div className="mb-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-2">
                <Search size={14} className="text-slate-500" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un utilisateur..."
                  className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              {searching && (
                <div className="flex justify-center py-3">
                  <Loader2 size={16} className="animate-spin text-emerald-500" />
                </div>
              )}

              {!searching && search.trim().length >= 2 && searchResults.length === 0 && (
                <p className="py-3 text-center text-xs text-slate-500">Aucun utilisateur trouvé</p>
              )}

              {!searching && searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => addParticipant(u.id)}
                  disabled={loading}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/5 disabled:opacity-50"
                >
                  {u.avatar_path ? (
                    <img src={`http://localhost:8000/storage/${u.avatar_path}`}
                      className="h-8 w-8 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300">
                      {initials(u.name)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-white">{u.name}</p>
                    <p className="truncate text-[10px] text-slate-500">{u.email}</p>
                  </div>
                  <UserPlus size={14} className="text-emerald-400" />
                </button>
              ))}
            </div>
          )}

          {/* Liste des participants */}
          <div className="space-y-1">
            {participants.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-white/5"
              >
                {p.avatar_path ? (
                  <img src={`http://localhost:8000/storage/${p.avatar_path}`}
                    className="h-9 w-9 rounded-full object-cover" alt="" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300">
                    {initials(p.name)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {p.name}
                    {p.id === user?.id && <span className="ml-1 text-[10px] text-emerald-400">(Vous)</span>}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">{p.email}</p>
                </div>
                {isGroup && p.id !== user?.id && (
                  <button
                    onClick={() => removeParticipant(p.id)}
                    disabled={loading}
                    className="rounded-full p-1.5 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-50"
                    title="Retirer"
                  >
                    <Trash2 size={13} />
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
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20"
            >
              <LogOut size={15} /> Quitter le groupe
            </button>
          </div>
        )}
      </div>
    </div>
  );
}