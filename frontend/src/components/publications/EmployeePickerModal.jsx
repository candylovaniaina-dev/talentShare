import React, { useEffect, useMemo, useState } from "react";
import { X, Search, Check, Users, Mail, BriefcaseBusiness } from "lucide-react";

const normalize = (s = "") =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function Avatar({ path, name, selected }) {
  const initials = (name || "?")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const ring = selected ? "ring-teal-400" : "ring-slate-100";

  if (path) {
    return (
      <img
        src={`/storage/${path}`}
        alt={`Photo de ${name || "salarié"}`}
        className={`h-12 w-12 shrink-0 rounded-full object-cover ring-4 ${ring}`}
      />
    );
  }

  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0b3b44] to-teal-600 text-sm font-semibold text-white ring-4 ${ring}`}
    >
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
    const query = normalize(search.trim());
    return employees.filter((employee) => {
      if (!query) return true;
      const info = getInfo(employee);
      return (
        normalize(info.name).includes(query) ||
        normalize(info.email).includes(query) ||
        normalize(info.position).includes(query)
      );
    });
  }, [employees, search]);

  const choose = (employee) => {
    onSelect(employee);
    onClose();
  };

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
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-950/30"
      >
        {/* ===== En-tête dégradé avec recherche ===== */}
        <header className="relative overflow-hidden bg-gradient-to-br from-[#052e2b] via-[#0a4a43] to-teal-700 px-5 pb-5 pt-5 text-white sm:px-6">
          <div className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
          />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <Users size={21} />
              </div>
              <div>
                <h2 id="employee-picker-title" className="text-lg font-semibold tracking-tight">
                  Choisir un collaborateur
                </h2>
                <p className="mt-0.5 text-sm text-teal-50/70">
                  {employees.length} collaborateur{employees.length > 1 ? "s" : ""} disponible{employees.length > 1 ? "s" : ""} dans votre équipe
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Fermer"
              onClick={onClose}
              className="rounded-xl bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="relative mt-5 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg shadow-black/10 transition focus-within:ring-4 focus-within:ring-emerald-300/40">
            <Search size={18} className="shrink-0 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filtered.length === 1) choose(filtered[0]);
              }}
              placeholder="Nom, adresse e-mail ou poste…"
              aria-label="Rechercher un collaborateur"
              className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              autoFocus
            />
            {search && (
              <button type="button" aria-label="Effacer la recherche" onClick={() => setSearch("")} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X size={14} />
              </button>
            )}
          </div>
        </header>

        {/* ===== Liste ===== */}
        <main className="flex-1 overflow-y-auto bg-slate-50/70 p-3 sm:p-4">
          {filtered.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-100 text-teal-700 ring-1 ring-teal-100">
                <Search size={24} />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-800">Aucun résultat</h3>
              <p className="mt-1 max-w-xs text-sm leading-relaxed text-slate-500">
                {employees.length === 0
                  ? "Aucun collaborateur n’est disponible pour le moment."
                  : "Essayez avec un autre nom, une adresse e-mail ou un intitulé de poste."}
              </p>
              {search && (
                <button type="button" onClick={() => setSearch("")} className="mt-4 rounded-xl px-4 py-2 text-sm font-medium text-teal-700 transition hover:bg-teal-50">
                  Effacer la recherche
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {filtered.map((employee) => {
                const info = getInfo(employee);
                const isSelected = String(info.profileId) === String(selectedId);

                return (
                  <button
                    key={employee.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => choose(employee)}
                    className={`group relative flex items-center gap-3.5 overflow-hidden rounded-2xl border p-3.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                      isSelected
                        ? "border-teal-400 bg-white shadow-md shadow-teal-900/5 ring-4 ring-teal-500/10"
                        : "border-slate-200 bg-white hover:border-teal-200 hover:shadow-md hover:shadow-teal-900/5"
                    }`}
                  >
                    <span
                      className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-teal-500 to-emerald-400 transition ${
                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                      }`}
                    />

                    <Avatar path={info.avatar} name={info.name} selected={isSelected} />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{info.name}</p>

                      <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-teal-700">
                        <BriefcaseBusiness size={13} className="shrink-0" />
                        <span className="truncate">{info.position}</span>
                      </p>

                      {info.email && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                          <Mail size={12} className="shrink-0" />
                          <span className="truncate">{info.email}</span>
                        </p>
                      )}
                    </div>

                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${
                        isSelected
                          ? "bg-teal-600 text-white"
                          : "border border-slate-200 text-transparent group-hover:border-teal-300 group-hover:text-teal-500"
                      }`}
                    >
                      <Check size={14} strokeWidth={2.5} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </main>

        {/* ===== Pied ===== */}
        <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-800">{filtered.length}</span> sur {employees.length} collaborateur{employees.length > 1 ? "s" : ""}
          </p>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900">
            Annuler
          </button>
        </footer>
      </div>
    </div>
  );
}