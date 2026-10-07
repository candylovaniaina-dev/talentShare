import React, { useEffect, useState } from "react";
import { X, Search, Users, Check, Loader2, ArrowLeft } from "lucide-react";
import api from "../services/api";

function initials(name) {
  return (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function NewGroupModal({ onClose, onCreated }) {
  const [step, setStep] = useState("members"); // "members" | "name"
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]); // array of users
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // ✅ Charger les suggestions au démarrage
  useEffect(() => {
    api.get("/users/suggestions?limit=20")
      .then((res) => setSuggestions(res.data || []))
      .catch(() => setSuggestions([]));
  }, []);

  // ✅ Recherche live
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

  const displayUsers = search.trim().length >= 2 ? results : suggestions;

  const toggleUser = (user) => {
    setSelected((prev) => {
      const exists = prev.find((u) => u.id === user.id);
      if (exists) return prev.filter((u) => u.id !== user.id);
      return [...prev, user];
    });
  };

  const isSelected = (userId) => selected.some((u) => u.id === userId);

  const goToNameStep = () => {
    if (selected.length < 2) {
      setError("Sélectionne au moins 2 personnes pour créer un groupe.");
      return;
    }
    setError("");
    setStep("name");
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      setError("Le nom du groupe est obligatoire.");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const res = await api.post("/conversations/group", {
        title: groupName.trim(),
        participant_ids: selected.map((u) => u.id),
      });
      onCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la création du groupe.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0F1E45] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            {step === "name" && (
              <button
                onClick={() => setStep("members")}
                className="rounded-full p-1 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold text-white">
                {step === "members" ? "Nouveau groupe" : "Nommer le groupe"}
              </h2>
              <p className="text-xs text-slate-500">
                {step === "members"
                  ? `${selected.length} personne${selected.length > 1 ? "s" : ""} sélectionnée${selected.length > 1 ? "s" : ""}`
                  : `${selected.length + 1} participants`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* ✅ ÉTAPE 1 : Sélection des membres */}
        {step === "members" && (
          <>
            {/* Barre de recherche */}
            <div className="p-4 pb-2">
              <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-2">
                <Search size={16} className="text-slate-500" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher des personnes..."
                  className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="text-slate-500 hover:text-white">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Chips des sélectionnés */}
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2 px-4 pb-2">
                {selected.map((u) => (
                  <span
                    key={u.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 py-1 pl-1 pr-2 text-xs font-medium text-emerald-300"
                  >
                    {u.avatar_path ? (
                      <img
                        src={`http://localhost:8000/storage/${u.avatar_path}`}
                        className="h-5 w-5 rounded-full object-cover"
                        alt=""
                      />
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[9px] font-bold">
                        {initials(u.name)}
                      </span>
                    )}
                    <span className="max-w-[100px] truncate">{u.name}</span>
                    <button onClick={() => toggleUser(u)} className="text-emerald-400 hover:text-white">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Titre section */}
            <div className="px-4 pb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {search.trim().length >= 2 ? "Résultats" : "Suggestions"}
              </p>
            </div>

            {/* Liste utilisateurs */}
            <div className="max-h-72 overflow-y-auto pb-2">
              {loading && (
                <div className="flex justify-center py-6">
                  <Loader2 size={20} className="animate-spin text-emerald-500" />
                </div>
              )}

              {!loading && displayUsers.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-500">
                  {search.trim().length >= 2 ? "Aucun utilisateur trouvé" : "Aucune suggestion"}
                </p>
              )}

              {!loading && displayUsers.map((u) => {
                const checked = isSelected(u.id);
                return (
                  <button
                    key={u.id}
                    onClick={() => toggleUser(u)}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left transition hover:bg-white/5"
                  >
                    <div className="relative shrink-0">
                      {u.avatar_path ? (
                        <img
                          src={`http://localhost:8000/storage/${u.avatar_path}`}
                          className="h-10 w-10 rounded-full object-cover"
                          alt=""
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 font-bold text-emerald-300">
                          {initials(u.name)}
                        </div>
                      )}
                      {checked && (
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#0F1E45] bg-emerald-500">
                          <Check size={9} className="text-[#0A1229]" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{u.name}</p>
                      <p className="truncate text-xs text-slate-500">{u.email}</p>
                    </div>
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
                        checked ? "border-emerald-500 bg-emerald-500" : "border-white/20"
                      }`}
                    >
                      {checked && <Check size={12} className="text-[#0A1229]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Error */}
            {error && (
              <div className="mx-4 mb-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                {error}
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t border-white/10 p-4">
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white"
              >
                Annuler
              </button>
              <button
                onClick={goToNameStep}
                disabled={selected.length < 2}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </>
        )}

        {/* ✅ ÉTAPE 2 : Nom du groupe */}
        {step === "name" && (
          <>
            <div className="p-5">
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Nom du groupe
              </label>
              <input
                autoFocus
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Ex: Équipe Marketing"
                maxLength={180}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <p className="mt-1 text-[10px] text-slate-500">
                {groupName.length} / 180 caractères
              </p>

              {/* Aperçu participants */}
              <div className="mt-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Participants ({selected.length + 1})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selected.map((u) => (
                    <span
                      key={u.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-2.5 text-xs text-slate-300"
                    >
                      {u.avatar_path ? (
                        <img
                          src={`http://localhost:8000/storage/${u.avatar_path}`}
                          className="h-5 w-5 rounded-full object-cover"
                          alt=""
                        />
                      ) : (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[9px] font-bold text-emerald-300">
                          {initials(u.name)}
                        </span>
                      )}
                      {u.name}
                    </span>
                  ))}
                </div>
              </div>

              {error && (
                <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  {error}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-white/10 p-4">
              <button
                onClick={() => setStep("members")}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white"
              >
                Retour
              </button>
              <button
                onClick={createGroup}
                disabled={creating || !groupName.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-50"
              >
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
                {creating ? "Création..." : "Créer le groupe"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}