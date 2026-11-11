import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Search, Check } from "lucide-react";
import api from "../../services/api";

const BASE_URL = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
const fileUrl = (p) =>
  !p ? null : /^https?:/.test(p) ? p : `${BASE_URL}/storage/${String(p).replace(/^\/+/, "")}`;

const normalize = (s = "") =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function Avatar({ path, name, selected }) {
  const [err, setErr] = useState(false);
  const src = fileUrl(path);

  useEffect(() => setErr(false), [src]);

  const initials = (name || "?")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const ring = selected ? "ring-[#16B8B1]" : "ring-slate-100 dark:ring-white/10";

  if (src && !err) {
    return (
      <img
        src={src}
        alt={`Photo de ${name || "salarié"}`}
        onError={() => setErr(true)}
        className={`h-12 w-12 shrink-0 rounded-full object-cover ring-4 ${ring}`}
      />
    );
  }

  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#16B8B1] text-sm font-bold text-[#0B1F33] ring-4 ${ring}`}
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

  /*
    ✅ Correctif : la modale principale (CreateResourceOfferModal) est en z-[9999].
    Celle-ci était en z-[60], donc elle s'ouvrait DERRIÈRE (seul le voile sombre
    se voyait). Elle passe en z-[10050] et est rendue dans document.body.
  */
  return createPortal(
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center bg-[#06141F]/60 p-3 backdrop-blur-sm font-['Plus_Jakarta_Sans',sans-serif] sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-picker-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-950/30 dark:bg-[#131E47]"
      >
        {/* En-tête bleu marine avec recherche */}
        <header className="relative shrink-0 overflow-hidden bg-[#0B1F33] px-5 pb-5 pt-5 text-white sm:px-6">
          <div className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full bg-[#16B8B1]/20 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <h2 id="employee-picker-title" className="text-lg font-semibold tracking-tight">
                Choisir un collaborateur
              </h2>
              <p className="mt-0.5 text-sm text-white/70">
                {employees.length} collaborateur{employees.length > 1 ? "s" : ""} dans votre équipe
              </p>
            </div>

            <button
              type="button"
              aria-label="Fermer"
              onClick={onClose}
              className="rounded-lg bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="relative mt-5 flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-lg shadow-black/10 transition focus-within:ring-4 focus-within:ring-[#16B8B1]/30">
            <Search size={17} className="shrink-0 text-slate-400" />
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
              <button
                type="button"
                aria-label="Effacer la recherche"
                onClick={() => setSearch("")}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </header>

        {/* Liste */}
        <main className="min-h-0 flex-1 overflow-y-auto bg-[#F5F7FB] p-3 sm:p-4 dark:bg-[#0A1230]">
          {filtered.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
              <h3 className="text-sm font-bold text-[#0B1F33] dark:text-white">Aucun résultat</h3>
              <p className="mt-1 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {employees.length === 0
                  ? "Aucun collaborateur n’est disponible pour le moment."
                  : "Essayez avec un autre nom, une adresse e-mail ou un intitulé de poste."}
              </p>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-[#0F9691] transition hover:bg-[#16B8B1]/10"
                >
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
                    className={`group relative flex items-center gap-3.5 overflow-hidden rounded-xl border p-3.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16B8B1] ${
                      isSelected
                        ? "border-[#16B8B1] bg-white shadow-md ring-4 ring-[#16B8B1]/10 dark:bg-[#131E47]"
                        : "border-slate-200 bg-white hover:border-[#16B8B1]/50 hover:shadow-md dark:border-white/10 dark:bg-[#131E47]"
                    }`}
                  >
                    <span
                      className={`absolute inset-y-0 left-0 w-1 bg-[#16B8B1] transition ${
                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                      }`}
                    />

                    <Avatar path={info.avatar} name={info.name} selected={isSelected} />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#0B1F33] dark:text-white">
                        {info.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs font-medium text-[#0F9691]">
                        {info.position}
                      </p>
                      {info.email && (
                        <p className="mt-0.5 truncate text-xs text-slate-400">{info.email}</p>
                      )}
                    </div>

                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${
                        isSelected
                          ? "bg-[#16B8B1] text-[#0B1F33]"
                          : "border border-slate-200 text-transparent group-hover:border-[#16B8B1] group-hover:text-[#16B8B1] dark:border-white/10"
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

        {/* Pied */}
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-6 dark:border-white/10 dark:bg-[#131E47]">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold text-[#0B1F33] dark:text-white">{filtered.length}</span> sur{" "}
            {employees.length} collaborateur{employees.length > 1 ? "s" : ""}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:bg-transparent dark:text-slate-300 dark:hover:bg-white/5"
          >
            Annuler
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}