
import React from "react";
import { Plus, ChevronRight } from "lucide-react";

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
        src={`http://localhost:8001/storage/${path}`}
        alt={name}
        className={`${sizes[size]} shrink-0 rounded-full border border-slate-200 object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-full bg-teal-700 font-semibold text-white`}
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

    const avatar =
      emp.photo_path ||
      emp.user?.professional_profile?.avatar_path ||
      emp.user?.professionalProfile?.avatar_path;

    return { name, position, avatar };
  };

  const info = getInfo(employee);

  if (!employee) {
    return (
      <button
        type="button"
        onClick={onOpenPicker}
        className="group flex w-full items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-left transition-all duration-200 hover:border-teal-500 hover:bg-teal-50/40 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-700 transition group-hover:bg-teal-100">
          <Plus size={19} strokeWidth={1.8} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-900">
            Sélectionner un salarié
          </span>
          <span className="mt-1 block text-xs text-slate-500">
            Choisissez un talent à proposer
          </span>
        </span>

        <ChevronRight
          size={18}
          className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-teal-700"
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpenPicker}
      className="group flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition-all duration-200 hover:border-teal-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
    >
      <Avatar path={info.avatar} name={info.name} size="md" />

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-slate-900">
          {info.name}
        </span>
        <span className="mt-1 block truncate text-xs text-slate-500">
          {info.position}
        </span>
      </span>

      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-teal-700 transition group-hover:text-teal-900">
        Changer
        <ChevronRight size={14} />
      </span>
    </button>
  );
}
