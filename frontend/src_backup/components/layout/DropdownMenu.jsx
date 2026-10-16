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
            ? `group flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors ${
                open ? "bg-[#F1F6FA]" : "hover:bg-[#F1F6FA]"
              }`
            : `group flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-[#F1F6FA] ${
                open ? "bg-[#F1F6FA]" : ""
              }`
        }
      >
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#102A43] to-[#0F9691] text-sm font-bold text-white ring-2 ring-white">
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
          <span className="block truncate text-[13px] font-bold text-[#102A43]">
            {user?.name || "Mon compte"}
          </span>
          <span className="mt-0.5 block truncate text-[11px] font-medium text-[#7B8EA3]">
            {getRoleLabel(user?.role)}
          </span>
        </span>

        <ChevronRight
          size={15}
          className={`shrink-0 text-[#8A9BB0] transition-transform ${
            open ? "rotate-90" : ""
          } ${isSidebar ? "" : "hidden sm:block"}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-[60] flex max-h-[min(640px,calc(100vh-110px))] w-[min(340px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-[#E4EBF1] bg-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.28)] ${
            isSidebar
              ? "bottom-full left-0 mb-3"
              : "right-0 top-full mt-3"
          }`}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {/* ✅ Carte de profil UNIQUEMENT dans le header (pas en sidebar) */}
            {!isSidebar && (
              <>
                <div className="bg-gradient-to-br from-[#F0FDFA] via-white to-[#F5F8FA] p-4">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => go("/profile")}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/80"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#102A43] to-[#0F9691] text-base font-bold text-white">
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
                      <span className="mt-1 block truncate text-xs text-[#718096]">
                        {user?.email || getRoleLabel(user?.role)}
                      </span>
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#BDEFE7] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#0F9691]">
                        <ShieldCheck size={11} />
                        {getRoleLabel(user?.role)}
                      </span>
                    </span>

                    <ChevronRight size={16} className="shrink-0 text-[#8A9BB0]" />
                  </button>
                </div>

                <div className="h-px bg-[#E8EEF3]" />
              </>
            )}

            {/* MON COMPTE */}
            <div className="p-2.5">
              <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A9BB0]">
                Mon compte
              </p>

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

            <div className="mx-4 h-px bg-[#E8EEF3]" />

            {/* ASSISTANCE */}
            <div className="p-2.5">
              <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A9BB0]">
                Assistance
              </p>

              <MenuLink
                icon={CircleHelp}
                label="Aide et assistance"
                description="Consulter le centre d'aide"
                onClick={() => go("/help")}
              />
            </div>

            <div className="h-px bg-[#E8EEF3]" />

            {/* DÉCONNEXION */}
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
                  <span className="mt-0.5 block text-[11px] text-[#8A9BB0]">
                    Quitter ma session
                  </span>
                </span>
              </button>
            </div>
          </div>

          <div className="border-t border-[#E8EEF3] bg-[#F8FAFC] px-4 py-3">
            <div className="flex items-center justify-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#102A43] text-[#76DED7]">
                <BriefcaseBusiness size={11} />
              </span>
              <span className="text-[10px] font-semibold tracking-wide text-[#8A9BB0]">
                TALENTSHARE · ESPACE PROFESSIONNEL
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
      className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#F1F6FA]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1F5F9] text-[#64788C] transition group-hover:bg-[#DDF8F3] group-hover:text-[#0F9691]">
        <Icon size={17} strokeWidth={1.9} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-[#334B63] transition group-hover:text-[#102A43]">
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
        className="shrink-0 text-[#C1CCD7] transition group-hover:translate-x-0.5 group-hover:text-[#0F9691]"
      />
    </button>
  );
}