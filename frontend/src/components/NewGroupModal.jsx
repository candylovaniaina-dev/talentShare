
import React, { useEffect, useState } from "react";
import {
  X,
  Search,
  Users,
  Check,
  Loader2,
  ArrowLeft,
  ArrowRight,
  UserPlus,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import api from "../services/api";

function initials(name) {
  return (name || "?")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Avatar({ user, size = "md" }) {
  const sizeClass = size === "sm" ? "h-7 w-7 text-[9px]" : "h-11 w-11 text-xs";

  return user?.avatar_path ? (
    <img
      src={`http://localhost:8001/storage/${user.avatar_path}`}
      alt=""
      className={`${sizeClass} shrink-0 rounded-full border border-white/10 object-cover`}
    />
  ) : (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-[#DDF8F0] font-bold text-[#087F70]`}
    >
      {initials(user?.name)}
    </div>
  );
}

export default function NewGroupModal({ onClose, onCreated }) {
  const [step, setStep] = useState("members");
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    api
      .get("/users/suggestions?limit=20")
      .then((res) => {
        if (!cancelled) {
          setSuggestions(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const query = search.trim();

    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    const timeout = setTimeout(async () => {
      setLoading(true);

      try {
        const res = await api.get(
          `/users/search?q=${encodeURIComponent(query)}`
        );

        if (!cancelled) {
          setResults(Array.isArray(res.data) ? res.data : []);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [search]);

  const isSearching = search.trim().length >= 2;
  const displayUsers = isSearching ? results : suggestions;

  const toggleUser = (user) => {
    setError("");

    setSelected((previous) => {
      const exists = previous.some((item) => item.id === user.id);

      if (exists) {
        return previous.filter((item) => item.id !== user.id);
      }

      return [...previous, user];
    });
  };

  const isSelected = (userId) =>
    selected.some((user) => user.id === userId);

  const goToNameStep = () => {
    if (selected.length < 2) {
      setError("Sélectionne au moins 2 personnes pour créer un groupe.");
      return;
    }

    setError("");
    setStep("name");
  };

  const createGroup = async (event) => {
    event?.preventDefault();

    if (selected.length < 2) {
      setError("Sélectionne au moins 2 personnes pour créer un groupe.");
      setStep("members");
      return;
    }

    if (!groupName.trim()) {
      setError("Le nom du groupe est obligatoire.");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const res = await api.post("/conversations/group", {
        title: groupName.trim(),
        participant_ids: selected.map((user) => user.id),
      });

      onCreated(res.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Erreur lors de la création du groupe."
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071126]/65 p-3 backdrop-blur-sm sm:p-5"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-group-title"
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {step === "name" && (
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep("members");
                }}
                aria-label="Retour à la sélection des membres"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-[#0F1E45]"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E8FBF5] text-[#087F70]">
              {step === "members" ? (
                <UserPlus size={21} />
              ) : (
                <MessageSquare size={21} />
              )}
            </div>

            <div className="min-w-0">
              <h2
                id="new-group-title"
                className="text-base font-bold text-[#0F1E45] sm:text-lg"
              >
                {step === "members" ? "Créer un groupe" : "Personnaliser le groupe"}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {step === "members"
                  ? `${selected.length} personne${selected.length > 1 ? "s" : ""} sélectionnée${selected.length > 1 ? "s" : ""}`
                  : `${selected.length + 1} participants au total`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-[#0F1E45]"
          >
            <X size={19} />
          </button>
        </header>

        <div className="flex items-center gap-2 px-5 pt-4 sm:px-6">
          <div
            className={`h-1.5 flex-1 rounded-full ${
              step === "members" ? "bg-[#0D9488]" : "bg-[#6EE7C8]"
            }`}
          />
          <div
            className={`h-1.5 flex-1 rounded-full ${
              step === "name" ? "bg-[#0D9488]" : "bg-slate-100"
            }`}
          />
        </div>

        {step === "members" && (
          <>
            <div className="px-5 pb-3 pt-4 sm:px-6">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-teal-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-500/10">
                <Search size={18} className="shrink-0 text-slate-400" />
                <input
                  autoFocus
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher par nom ou email..."
                  aria-label="Rechercher des personnes"
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm text-[#0F1E45] outline-none placeholder:text-slate-400"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Effacer la recherche"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            {selected.length > 0 && (
              <div className="px-5 pb-3 sm:px-6">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold text-[#0F1E45]">
                    Membres sélectionnés
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelected([])}
                    className="text-xs font-semibold text-slate-500 hover:text-rose-600"
                  >
                    Tout retirer
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selected.map((user) => (
                    <span
                      key={user.id}
                      className="inline-flex max-w-full items-center gap-2 rounded-full border border-teal-100 bg-[#E8FBF5] py-1 pl-1 pr-2 text-xs font-semibold text-[#087F70]"
                    >
                      <Avatar user={user} size="sm" />
                      <span className="max-w-[120px] truncate">{user.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleUser(user)}
                        aria-label={`Retirer ${user.name}`}
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition hover:bg-teal-100"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between px-5 pb-2 sm:px-6">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {isSearching ? "Résultats de recherche" : "Suggestions"}
              </p>
              <span className="text-xs text-slate-400">
                {isSearching ? results.length : suggestions.length}
              </span>
            </div>

            <div className="min-h-[160px] flex-1 overflow-y-auto px-2 pb-2 sm:px-3">
              {loading && (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 size={23} className="animate-spin text-teal-600" />
                  <p className="mt-2 text-xs text-slate-500">Recherche en cours…</p>
                </div>
              )}

              {!loading && displayUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    {isSearching ? <Search size={21} /> : <Users size={21} />}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#0F1E45]">
                    {isSearching
                      ? "Aucun utilisateur trouvé"
                      : "Aucune suggestion disponible"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {isSearching
                      ? "Essaie un autre nom ou une autre adresse email."
                      : "Tu peux rechercher des personnes avec la barre ci-dessus."}
                  </p>
                </div>
              )}

              {!loading &&
                displayUsers.map((user) => {
                  const checked = isSelected(user.id);

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleUser(user)}
                      aria-pressed={checked}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                        checked
                          ? "bg-[#E8FBF5]"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <Avatar user={user} />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#0F1E45]">
                          {user.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {user.email}
                        </p>
                      </div>

                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                          checked
                            ? "border-[#0D9488] bg-[#0D9488] text-white"
                            : "border-slate-200 bg-white text-transparent"
                        }`}
                      >
                        <Check size={14} />
                      </span>
                    </button>
                  );
                })}
            </div>

            {error && (
              <div className="mx-5 mb-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 sm:mx-6">
                {error}
              </div>
            )}

            <footer className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={goToNameStep}
                disabled={selected.length < 2}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0F1E45] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#172B5B] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuer
                <ArrowRight size={16} />
              </button>
            </footer>
          </>
        )}

        {step === "name" && (
          <form onSubmit={createGroup}>
            <div className="space-y-5 px-5 py-5 sm:px-6">
              <div className="rounded-2xl bg-[#F3F7FB] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#087F70] shadow-sm">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0F1E45]">
                      Donne un nom à ton groupe
                    </p>
                    <p className="text-xs text-slate-500">
                      Tu pourras identifier facilement cette conversation.
                    </p>
                  </div>
                </div>

                <label
                  htmlFor="new-group-name"
                  className="mb-2 block text-xs font-semibold text-slate-600"
                >
                  Nom du groupe
                </label>
                <input
                  id="new-group-name"
                  autoFocus
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  placeholder="Ex. : Équipe Marketing"
                  maxLength={180}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0F1E45] outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                />
                <p className="mt-1.5 text-right text-[11px] text-slate-400">
                  {groupName.length}/180 caractères
                </p>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Participants
                  </p>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-[#0F1E45]">
                    {selected.length + 1}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selected.map((user) => (
                    <div
                      key={user.id}
                      className="flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2"
                    >
                      <Avatar user={user} size="sm" />
                      <span className="max-w-[150px] truncate text-xs font-semibold text-[#0F1E45]">
                        {user.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                  {error}
                </div>
              )}
            </div>

            <footer className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep("members");
                }}
                disabled={creating}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={creating || !groupName.trim() || selected.length < 2}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0D9488] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#0F766E] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Users size={16} />
                )}
                {creating ? "Création…" : "Créer le groupe"}
              </button>
            </footer>
          </form>
        )}
      </section>
    </div>
  );
}
