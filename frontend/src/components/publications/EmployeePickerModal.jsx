
import React, { useEffect, useMemo, useState } from "react";
import { X, Search, Check, Users, UserRound, Mail, BriefcaseBusiness } from "lucide-react";

function Avatar({ path, name, size = "md" }) {
  const sizes = {
    sm: "h-10 w-10 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-14 w-14 text-base",
  };

  const initials = (name || "?")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (path) {
    return (
      <img
        src={`/storage/${path}`}
        alt={`Photo de ${name || "salarié"}`}
        className={`${sizes[size]} shrink-0 rounded-2xl border border-slate-200 object-cover`}
      />
    );
  }

  return (
    <div className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-teal-700 font-bold text-white`}>
      {initials}
    </div>
  );
}

export default function EmployeePickerModal({
  employees = [],
  selectedId,
  onSelect,
  onClose,
}) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const getInfo = (emp) => {
    const name =
      emp.user?.name ||
      `${emp.first_name || ""} ${emp.last_name || ""}`.trim() ||
      "Salarié";

    const position =
      emp.position ||
      emp.user?.professional_profile?.headline ||
      "Poste non défini";

    const email = emp.user?.email || emp.email || "";

    const avatar =
      emp.photo_path ||
      emp.user?.professional_profile?.avatar_path ||
      emp.user?.professionalProfile?.avatar_path;

    const profileId = emp.user?.professional_profile?.id;

    return { name, position, email, avatar, profileId };
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return employees.filter((employee) => {
      if (!query) return true;

      const info = getInfo(employee);

      return (
        info.name.toLowerCase().includes(query) ||
        info.email.toLowerCase().includes(query) ||
        info.position.toLowerCase().includes(query)
      );
    });
  }, [employees, search]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-picker-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/70 bg-slate-50 shadow-2xl shadow-slate-950/25"
      >
        <header className="border-b border-slate-200 bg-white px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                <Users size={21} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-teal-700">Équipe entreprise</p>
                <h2 id="employee-picker-title" className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                  Choisir un collaborateur
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {employees.length} collaborateur{employees.length > 1 ? "s" : ""} disponible{employees.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Fermer"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={19} />
            </button>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-500/10">
            <Search size={18} className="shrink-0 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, adresse e-mail ou poste…"
              aria-label="Rechercher un collaborateur"
              className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              autoFocus
            />
            {search && (
              <button type="button" aria-label="Effacer la recherche" onClick={() => setSearch("")} className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700">
                <X size={14} />
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-4">
          {filtered.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Search size={24} />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-800">Aucun résultat</h3>
              <p className="mt-1 max-w-xs text-sm leading-relaxed text-slate-500">
                {employees.length === 0
                  ? "Aucun collaborateur n’est disponible pour le moment."
                  : "Essayez avec un autre nom, une adresse e-mail ou un intitulé de poste."}
              </p>
              {search && (
                <button type="button" onClick={() => setSearch("")} className="mt-4 rounded-xl px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50">
                  Effacer la recherche
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((employee) => {
                const info = getInfo(employee);
                const isSelected =
                  String(info.profileId) === String(selectedId);

                return (
                  <button
                    key={employee.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      onSelect(employee);
                      onClose();
                    }}
                    className={`group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition sm:gap-4 sm:p-4 ${
                      isSelected
                        ? "border-teal-400 bg-teal-50/80 ring-2 ring-teal-500/10"
                        : "border-slate-200 bg-white hover:border-teal-200 hover:bg-teal-50/30"
                    }`}
                  >
                    <Avatar path={info.avatar} name={info.name} />

                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-bold ${isSelected ? "text-teal-900" : "text-slate-900"}`}>
                        {info.name}
                      </p>

                      <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
                        <BriefcaseBusiness size={13} className="shrink-0" />
                        <span className="truncate">{info.position}</span>
                      </p>

                      {info.email && (
                        <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-400">
                          <Mail size={12} className="shrink-0" />
                          <span className="truncate">{info.email}</span>
                        </p>
                      )}
                    </div>

                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${
                      isSelected
                        ? "bg-teal-600 text-white"
                        : "border border-slate-200 bg-white text-slate-300 group-hover:border-teal-200 group-hover:text-teal-600"
                    }`}>
                      <Check size={16} strokeWidth={2.5} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </main>

        <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-800">{filtered.length}</span> sur {employees.length} collaborateurs
          </p>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900">
            Annuler
          </button>
        </footer>
      </div>
    </div>
  );
}
