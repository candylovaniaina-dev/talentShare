import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  CircleHelp,
  Palette,
  LogOut,
  ChevronRight,
  UserRound,
  ShieldCheck,
  Layers3,
  BriefcaseBusiness,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_STORAGE_URL = "/storage/";

function getInitials(name) {
  return (
    name
      ?.trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "TS"
  );
}

function getRoleLabel(role) {
  return {
    company: "Entreprise",
    employee: "Talent",
    student: "Étudiant",
    university: "Université",
    admin: "Administrateur",
  }[role] || "Membre";
}

export default function DropdownMenu({ variant = "header" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef(null);

  const initials = getInitials(user?.name);
  const avatarUrl = user?.avatar_path
    ? `${API_STORAGE_URL}${user.avatar_path}`
    : null;

  const isSidebar = variant === "sidebar";

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setOpen(false);
    setLoggingOut(true);

    try {
      if (logout) {
        await logout();
      } else {
        localStorage.removeItem("token");
      }
    } finally {
      navigate("/login");
      setLoggingOut(false);
    }
  };

  return (
    <div ref={ref} className="relative w-full">
      {/* Bouton du profil */}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Ouvrir le menu du compte"
        aria-haspopup="menu"
        aria-expanded={open}
        className={
          isSidebar
            ? `group flex w-full items-center gap-3 rounded-2xl p-2.5 text-left ring-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
                open ? "bg-white/15 ring-white/20" : "bg-white/[0.06] ring-white/10 hover:bg-white/10"
              }`
            : `group flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-emerald-50 ${
                open ? "bg-emerald-50" : ""
              }`
        }
      >
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-sm font-extrabold text-[#04201C] ring-2 ring-white/20">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user?.name || "Photo de profil"}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </span>

        <span className={`min-w-0 flex-1 text-left ${isSidebar ? "block" : "hidden sm:block"}`}>
          <span className={`block truncate text-[13px] font-bold ${isSidebar ? "text-white" : "text-[#0B1F33]"}`}>
            {user?.name || "Mon compte"}
          </span>
          <span className={`mt-0.5 block truncate text-[11px] font-semibold ${isSidebar ? "text-emerald-300" : "text-emerald-600"}`}>
            {getRoleLabel(user?.role)}
          </span>
        </span>

        <ChevronRight
          size={15}
          className={`shrink-0 transition-transform ${isSidebar ? "text-white/40" : "text-[#8A9BB0]"} ${
            open ? (isSidebar ? "-rotate-90" : "rotate-90") : ""
          } ${isSidebar ? "" : "hidden sm:block"}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-[60] flex max-h-[min(640px,calc(100vh-110px))] flex-col overflow-hidden rounded-3xl border border-white bg-white/95 shadow-[0_24px_70px_-10px_rgba(6,25,35,0.35)] ring-1 ring-slate-900/[0.06] backdrop-blur-xl ${
            isSidebar
              ? "bottom-full left-0 mb-3 w-[min(320px,calc(100vw-48px))]"
              : "right-0 top-full mt-3 w-[min(340px,calc(100vw-24px))]"
          }`}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {/* Carte de profil uniquement dans le header (pas en sidebar) */}
            {!isSidebar && (
              <div className="relative overflow-hidden bg-gradient-to-br from-[#0B2A35] via-[#0B3A36] to-[#0E4B42] p-4">
                <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-emerald-400/25 blur-2xl" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => go("/profile")}
                  className="relative flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-white/10"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-base font-extrabold text-[#04201C]">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={user?.name || "Photo de profil"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-white">
                      {user?.name || "Mon compte"}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-white/60">
                      {user?.email || getRoleLabel(user?.role)}
                    </span>
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-300/30">
                      <ShieldCheck size={11} />
                      {getRoleLabel(user?.role)}
                    </span>
                  </span>

                  <ChevronRight size={16} className="shrink-0 text-white/40" />
                </button>
              </div>
            )}

            {/* MON COMPTE */}
            <div className="p-2.5">
              <SectionLabel>Mon compte</SectionLabel>

              <MenuLink
                icon={Layers3}
                label="Mon espace personnel"
                description="Revenir au tableau de bord"
                onClick={() => go("/dashboard")}
              />

              <MenuLink
                icon={UserRound}
                label="Voir mon profil"
                description="Mes informations personnelles"
                onClick={() => go("/profile")}
              />

              <MenuLink
                icon={Settings}
                label="Paramètres du compte"
                description="Gérer mes préférences"
                onClick={() => go("/account-settings")}
              />

              <MenuLink
                icon={Palette}
                label="Affichage et accessibilité"
                description="Personnaliser mon expérience"
                onClick={() => go("/appearance")}
              />
            </div>

            <div className="mx-4 h-px bg-slate-100" />

            {/* ASSISTANCE */}
            <div className="p-2.5">
              <SectionLabel>Assistance</SectionLabel>

              <MenuLink
                icon={CircleHelp}
                label="Aide et assistance"
                description="Consulter le centre d'aide"
                onClick={() => go("/help")}
              />
            </div>

            <div className="mx-4 h-px bg-slate-100" />

            {/* DÉCONNEXION */}
            <div className="p-2.5">
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                disabled={loggingOut}
                className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition group-hover:bg-rose-100">
                  <LogOut size={17} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-rose-600">
                    {loggingOut ? "Déconnexion..." : "Se déconnecter"}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-[#8A9BB0]">
                    Quitter ma session
                  </span>
                </span>
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 bg-[#F5F9FA] px-4 py-3">
            <div className="flex items-center justify-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#0B2A35] text-emerald-300">
                <BriefcaseBusiness size={11} />
              </span>
              <span className="text-[10px] font-bold tracking-[0.14em] text-[#8A9BB0]">
                TALENTSHARE · ESPACE PROFESSIONNEL
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="flex items-center gap-2 px-3 pb-2 pt-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-600">
      <span className="h-3 w-1 rounded-full bg-gradient-to-b from-emerald-400 to-teal-600" />
      {children}
    </p>
  );
}

function MenuLink({ icon: Icon, label, description, onClick }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-emerald-50/70"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF3F6] text-[#64788C] transition group-hover:bg-emerald-500 group-hover:text-white">
        <Icon size={17} strokeWidth={1.9} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold text-[#334B63] transition group-hover:text-[#0B1F33]">
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-[11px] leading-4 text-[#8A9BB0]">
            {description}
          </span>
        )}
      </span>

      <ChevronRight
        size={14}
        className="shrink-0 text-[#C1CCD7] transition group-hover:translate-x-0.5 group-hover:text-emerald-600"
      />
    </button>
  );
}