
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
  Building2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_STORAGE_URL = "http://localhost:8001/storage/";

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

export default function DropdownMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef(null);

  const initials = getInitials(user?.name);
  const avatarUrl = user?.avatar_path
    ? `${API_STORAGE_URL}${user.avatar_path}`
    : null;

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
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
    <div ref={ref} className="relative">
      {/* Bouton du profil */}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Ouvrir le menu du profil"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`group flex items-center gap-2 rounded-full p-1 pr-1.5 transition-all duration-200 hover:bg-slate-100 ${
          open ? "bg-slate-100" : ""
        }`}
      >
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#102A43] to-[#0F766E] text-sm font-bold text-white ring-2 ring-white">
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

        <span className="hidden min-w-0 text-left sm:block">
          <span className="block max-w-[120px] truncate text-xs font-bold text-[#102A43]">
            {user?.name || "Mon compte"}
          </span>
          <span className="mt-0.5 block text-[10px] font-medium text-slate-500">
            Mon espace
          </span>
        </span>

        <ChevronRight
          size={15}
          className={`hidden text-slate-400 transition-transform sm:block ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>

      {/* Menu déroulant */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-3 w-[min(340px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.22)] animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Carte de profil */}
          <div className="bg-gradient-to-br from-[#F0FDFA] via-white to-[#F5F8FC] p-4">
            <button
              type="button"
              role="menuitem"
              onClick={() => go("/profile")}
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/80"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#102A43] to-[#0F766E] text-base font-bold text-white shadow-sm">
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
                <span className="block truncate text-sm font-bold text-[#102A43]">
                  {user?.name || "Mon compte"}
                </span>
                <span className="mt-1 block truncate text-xs text-slate-500">
                  {user?.email || getRoleLabel(user?.role)}
                </span>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#BDEFE7] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#0F766E]">
                  <ShieldCheck size={11} />
                  {getRoleLabel(user?.role)}
                </span>
              </span>

              <ChevronRight size={16} className="shrink-0 text-slate-400" />
            </button>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Navigation du compte */}
          <div className="p-2.5">
            <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Mon compte
            </p>

            <MenuLink
              icon={UserRound}
              label="Voir mon profil"
              description="Vos informations personnelles"
              onClick={() => go("/profile")}
            />

            <MenuLink
              icon={Settings}
              label="Paramètres du compte"
              description="Gérer vos préférences"
              onClick={() => go("/account-settings")}
            />

            <MenuLink
              icon={Palette}
              label="Affichage et accessibilité"
              description="Personnaliser votre expérience"
              onClick={() => go("/appearance")}
            />
          </div>

          <div className="mx-4 h-px bg-slate-100" />

          {/* Aide */}
          <div className="p-2.5">
            <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Besoin d'aide ?
            </p>

            <MenuLink
              icon={CircleHelp}
              label="Aide et assistance"
              description="Retrouvez les informations utiles"
              onClick={() => go("/help")}
            />
          </div>

          <div className="h-px bg-slate-100" />

          {/* Déconnexion */}
          <div className="p-2.5">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={loggingOut}
              className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition group-hover:bg-rose-100">
                <LogOut size={17} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-rose-600">
                  {loggingOut ? "Déconnexion..." : "Se déconnecter"}
                </span>
                <span className="mt-0.5 block text-[11px] text-slate-500">
                  Quitter votre session
                </span>
              </span>
            </button>
          </div>

          <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-3">
            <div className="flex items-center justify-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#102A43] text-[#5EEAD4]">
                <Building2 size={11} />
              </span>
              <span className="text-[10px] font-semibold tracking-wide text-slate-400">
                TALENTSHARE · VOTRE ESPACE PROFESSIONNEL
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({ icon: Icon, label, description, onClick }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#F5F8FC]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-[#DDF8F3] group-hover:text-[#0F766E]">
        <Icon size={17} strokeWidth={1.9} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-slate-700 transition group-hover:text-[#102A43]">
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-[11px] leading-4 text-slate-400">
            {description}
          </span>
        )}
      </span>

      <ChevronRight
        size={14}
        className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#0F766E]"
      />
    </button>
  );
}
