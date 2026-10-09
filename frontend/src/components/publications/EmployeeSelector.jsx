import React from "react";
import { Plus, ChevronRight } from "lucide-react";

/* ============================================
   AVATAR LOCAL
============================================ */
function Avatar({ path, name, size = "md" }) {
  const sizes = {
    sm: "h-9 w-9 text-xs",
    md: "h-11 w-11 text-sm",
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
export default function EmployeeSelector({ employee, onOpenPicker }) {
  // Fonction utilitaire pour extraire nom + avatar + poste
  const getInfo = (emp) => {
    if (!emp) return null;
    const name = emp.user?.name || `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || "Salarié";
    const position = emp.position || emp.user?.professional_profile?.headline || "Poste non défini";
    const avatar =
      emp.photo_path ||
      emp.user?.professional_profile?.avatar_path ||
      emp.user?.professionalProfile?.avatar_path;
    return { name, position, avatar };
  };

  const info = getInfo(employee);

  // ===== ÉTAT VIDE =====
  if (!employee) {
    return (
      <button
        type="button"
        onClick={onOpenPicker}
        className="group flex w-full items-center gap-3 rounded-xl border border-dashed border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-4 py-3.5 text-left transition hover:border-emerald-500/40 hover:bg-[var(--bg-surface)]"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 transition group-hover:bg-emerald-500/20">
          <Plus size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--text-app)]">
            Sélectionner un salarié
          </p>
          <p className="text-[11px] text-[var(--text-faint)]">
            Choisissez un talent à proposer
          </p>
        </div>
        <ChevronRight size={16} className="shrink-0 text-[var(--text-faint)] transition group-hover:translate-x-0.5 group-hover:text-emerald-400" />
      </button>
    );
  }

  // ===== ÉTAT REMPLI =====
  return (
    <button
      type="button"
      onClick={onOpenPicker}
      className="group flex w-full items-center gap-3 rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-4 py-3.5 text-left transition hover:border-emerald-500/40 hover:bg-[var(--bg-surface)]"
    >
      <Avatar path={info.avatar} name={info.name} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-[var(--text-app)]">
          {info.name}
        </p>
        <p className="truncate text-[11px] text-[var(--text-muted)]">
          {info.position}
        </p>
      </div>
      <span className="shrink-0 text-[11px] font-semibold text-emerald-400 transition group-hover:text-emerald-300">
        Changer →
      </span>
    </button>
  );
}