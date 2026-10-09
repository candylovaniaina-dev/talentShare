import React, { useEffect, useState } from "react";
import { X, Search, Check, Loader2, Users } from "lucide-react";

/* ============================================
   AVATAR LOCAL
============================================ */
function Avatar({ path, name, size = "md" }) {
  const sizes = {
    sm: "h-10 w-10 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-14 w-14 text-base",
  };
  const initials = (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (path) {
    return (
      <img
        src={`http://localhost:8000/storage/${path}`}
        alt={name}
        className={`${sizes[size]} shrink-0 rounded-full border border-[var(--border-app)] object-cover`}
      />
    );
  }

  return (
    <div className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 font-bold text-white`}>
      {initials}
    </div>
  );
}

/* ============================================
   COMPOSANT
============================================ */
export default function EmployeePickerModal({ employees = [], selectedId, onSelect, onClose }) {
  const [search, setSearch] = useState("");

  // Fermeture avec Échap
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Helper : normalise les infos du salarié
  const getInfo = (emp) => {
    const name = emp.user?.name || `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || "Salarié";
    const position = emp.position || emp.user?.professional_profile?.headline || "Poste non défini";
    const email = emp.user?.email || emp.email || "";
    const avatar =
      emp.photo_path ||
      emp.user?.professional_profile?.avatar_path ||
      emp.user?.professionalProfile?.avatar_path;
    const profileId = emp.user?.professional_profile?.id;
    return { name, position, email, avatar, profileId };
  };

  // Filtre par nom / email / poste
  const q = search.trim().toLowerCase();
  const filtered = employees.filter((emp) => {
    if (!q) return true;
    const info = getInfo(emp);
    return (
      info.name.toLowerCase().includes(q) ||
      info.email.toLowerCase().includes(q) ||
      info.position.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-modalOverlay"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-2xl animate-modalContent"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ===== HEADER ===== */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-app)] px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <Users size={18} />
            </span>
            <div>
              <h2 className="text-base font-bold text-[var(--text-app)]">
                Sélectionner un salarié
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {employees.length} salarié{employees.length > 1 ? "s" : ""} disponible{employees.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-faint)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* ===== RECHERCHE ===== */}
        <div className="border-b border-[var(--border-app)] px-6 py-3">
          <div className="flex items-center gap-2 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2 transition focus-within:border-emerald-500/50">
            <Search size={14} className="shrink-0 text-[var(--text-faint)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, email ou poste..."
              className="w-full bg-transparent text-sm text-[var(--text-app)] placeholder:text-[var(--text-faint)] focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* ===== LISTE ===== */}
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-[var(--text-app)]">
                Aucun salarié trouvé
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Essayez un autre mot-clé
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((emp) => {
                const info = getInfo(emp);
                const isSelected = String(info.profileId) === String(selectedId);

                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => { onSelect(emp); onClose(); }}
                    className={`group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                      isSelected
                        ? "border-emerald-500/40 bg-emerald-500/[0.08]"
                        : "border-[var(--border-app)] bg-[var(--bg-surface-hover)] hover:border-emerald-500/40 hover:bg-[var(--bg-surface)]"
                    }`}
                  >
                    <Avatar path={info.avatar} name={info.name} size="md" />

                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-bold ${isSelected ? "text-emerald-400" : "text-[var(--text-app)]"}`}>
                        {info.name}
                      </p>
                      <p className="truncate text-[11px] text-[var(--text-muted)]">
                        {info.position}
                      </p>
                      {info.email && (
                        <p className="truncate text-[10px] text-[var(--text-faint)]">
                          {info.email}
                        </p>
                      )}
                    </div>

                    {isSelected ? (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[#0A1229]">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="shrink-0 text-[11px] font-semibold text-[var(--text-faint)] transition group-hover:text-emerald-400">
                        Sélectionner
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ===== FOOTER ===== */}
        <div className="flex items-center justify-between border-t border-[var(--border-app)] bg-[var(--bg-surface)] px-6 py-3">
          <p className="text-xs text-[var(--text-muted)]">
            {filtered.length} sur {employees.length}
          </p>
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-4 py-2 text-xs font-semibold text-[var(--text-app)] transition hover:bg-[var(--bg-surface)]"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}