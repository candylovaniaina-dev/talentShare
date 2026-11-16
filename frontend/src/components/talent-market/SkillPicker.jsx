import React, { useState, useEffect, useRef } from "react";
import { X, Plus, Search, Loader2 } from "lucide-react";
import api from "../../services/api";

export default function SkillPicker({ value = [], onChange, hint = "" }) {
  const [skills, setSkills] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const wrapperRef = useRef(null);

  // Chargement des suggestions depuis ton API basées sur le titre/poste
  useEffect(() => {
    if (!hint || hint.trim().length < 3) return;
    
    setLoading(true);
    const timer = setTimeout(() => {
      api.get("/skills", { params: { search: hint, per_page: 10 } })
        .then((res) => {
          const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
          setSuggestions(list.map(s => ({ id: s.id, name: s.name })));
        })
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false));
    }, 500);
    
    return () => clearTimeout(timer);
  }, [hint]);

  // Gestion du clic en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Recherche manuelle de compétences
  useEffect(() => {
    if (!open || search.trim().length < 2) return;
    
    setLoading(true);
    const timer = setTimeout(() => {
      api.get("/skills", { params: { search, per_page: 15 } })
        .then((res) => {
          const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
          setSkills(list.map(s => ({ id: s.id, name: s.name })));
        })
        .catch(() => setSkills([]))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [search, open]);

  const addSkill = (name) => {
    const clean = name.trim();
    if (!clean) return;
    if (value.some((s) => s.name.toLowerCase() === clean.toLowerCase())) return;
    onChange([...value, { name: clean, level: "intermediate" }]);
    setSearch("");
    setOpen(false);
  };

  const removeSkill = (index) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const changeLevel = (index, level) => {
    const next = [...value];
    next[index] = { ...next[index], level };
    onChange(next);
  };

  return (
    <div ref={wrapperRef} className="space-y-3">
      {/* Liste des compétences sélectionnées */}
      <div className="flex flex-wrap gap-2">
        {value.map((s, i) => (
          <div key={i} className="group flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm dark:border-white/10 dark:bg-[#0A1230] dark:text-slate-200">
            <span>{s.name}</span>
            <select
              value={s.level || "intermediate"}
              onChange={(e) => changeLevel(i, e.target.value)}
              className="rounded border-none bg-transparent py-0 pl-1 pr-4 text-[10px] text-slate-500 outline-none focus:ring-0 dark:text-slate-400"
            >
              <option value="beginner">Débutant</option>
              <option value="intermediate">Intermédiaire</option>
              <option value="advanced">Avancé</option>
              <option value="expert">Expert</option>
            </select>
            <button
              type="button"
              onClick={() => removeSkill(i)}
              className="rounded p-0.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/20"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 transition focus-within:border-[#16B8B1] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#16B8B1]/20 dark:border-white/10 dark:bg-[#0A1230]">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addSkill(search); }
            }}
            placeholder="Ajouter une compétence..."
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-white"
          />
          {loading && <Loader2 size={14} className="animate-spin text-[#16B8B1]" />}
        </div>

        {/* Dropdown des suggestions */}
        {open && (search.trim() || suggestions.length > 0) && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#131E47]">
            {/* Suggestions basées sur le poste */}
            {!search && suggestions.length > 0 && (
              <div className="mb-1 border-b border-slate-100 px-2 pb-1 pt-1 dark:border-white/10">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Suggestions pour ce poste</p>
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => addSkill(s.name)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
                  >
                    {s.name} <Plus size={12} className="text-slate-400" />
                  </button>
                ))}
              </div>
            )}

            {/* Résultats de recherche */}
            {search && skills.length > 0 && (
              <>
                {skills.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => addSkill(s.name)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
                  >
                    {s.name} <Plus size={12} className="text-slate-400" />
                  </button>
                ))}
              </>
            )}

            {/* Création manuelle */}
            {search && !skills.some(s => s.name.toLowerCase() === search.toLowerCase()) && (
              <button
                type="button"
                onClick={() => addSkill(search)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium text-[#0F9691] hover:bg-teal-50 dark:hover:bg-teal-500/10"
              >
                <Plus size={14} /> Créer "{search}"
              </button>
            )}
            
            {search && skills.length === 0 && !loading && (
              <p className="px-2 py-3 text-center text-xs text-slate-400">Aucune compétence trouvée</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}