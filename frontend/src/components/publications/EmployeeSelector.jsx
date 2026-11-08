import React from "react";
import { Plus, ChevronRight, Mail, RefreshCw, UserRound } from "lucide-react";

function Avatar({ path, name }) {
  const initials = (name || "?")
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (path) {
    return (
      <img
        src={`/storage/${path}`}
        alt={name}
        className="h-16 w-16 shrink-0 rounded-full object-cover ring-4 ring-teal-50"
      />
    );
  }

  return (
    <div
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0b3b44] to-teal-600 text-lg font-semibold text-white ring-4 ring-teal-50"
      aria-label={name}
    >
      {initials}
    </div>
  );
}

export default function EmployeeSelector({ employee, onOpenPicker }) {
  const getInfo = (emp) => {
    if (!emp) return null;

    const name =
      emp.user?.name ||
      `${emp.first_name || ""} ${emp.last_name || ""}`.trim() ||
      "Salarié";

    const position =
      emp.position ||
      emp.user?.professional_profile?.headline ||
      emp.user?.professionalProfile?.headline ||
      "Poste non défini";

    const email = emp.user?.email || emp.email || "";

    const avatar =
      emp.photo_path ||
      emp.user?.professional_profile?.avatar_path ||
      emp.user?.professionalProfile?.avatar_path;

    return { name, position, email, avatar };
  };

  const info = getInfo(employee);

  /* ===== Aucun salarié choisi ===== */
  if (!employee) {
    return (
      <button
        type="button"
        onClick={onOpenPicker}
        className="group relative flex w-full items-center gap-5 overflow-hidden rounded-2xl border-2 border-dashed border-teal-200 bg-gradient-to-br from-teal-50/60 via-white to-emerald-50/50 p-5 text-left transition hover:border-teal-400 hover:shadow-lg hover:shadow-teal-900/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
      >
        <span className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-teal-200/30 blur-2xl" />

        {/* Silhouettes superposées */}
        <span className="relative flex shrink-0 items-center pl-2">
          <span className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-slate-400 ring-4 ring-white">
            <UserRound size={18} />
          </span>
          <span className="-ml-3 flex h-11 w-11 items-center justify-center rounded-full bg-teal-100 text-teal-600 ring-4 ring-white">
            <UserRound size={18} />
          </span>
          <span className="-ml-3 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-emerald-500 text-white ring-4 ring-white transition group-hover:scale-110">
            <Plus size={19} />
          </span>
        </span>

        <span className="relative min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-900">
            Sélectionner un salarié
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-slate-500">
            Parcourez votre équipe et choisissez le talent à proposer.
          </span>
        </span>

        <ChevronRight
          size={20}
          className="relative shrink-0 text-teal-400 transition group-hover:translate-x-1 group-hover:text-teal-700"
        />
      </button>
    );
  }

  /* ===== Salarié choisi ===== */
  return (
    <div className="relative overflow-hidden rounded-2xl border border-teal-200 bg-white shadow-sm">
      <div className="h-1.5 bg-gradient-to-r from-[#0b3b44] to-teal-500" />

      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <Avatar path={info.avatar} name={info.name} />

        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            Collaborateur choisi
          </span>

          <p className="mt-2 truncate text-base font-semibold text-slate-900">
            {info.name}
          </p>
          <p className="mt-0.5 truncate text-sm text-teal-700">{info.position}</p>

          {info.email && (
            <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-400">
              <Mail size={12} className="shrink-0" />
              <span className="truncate">{info.email}</span>
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenPicker}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          <RefreshCw size={15} />
          Changer
        </button>
      </div>
    </div>
  );
}