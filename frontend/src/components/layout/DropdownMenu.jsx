import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, HelpCircle, Moon, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function DropdownMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    setOpen(false);
    try {
      if (logout) await logout();
      else localStorage.removeItem("token");
    } finally {
      navigate("/login");
    }
  };

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white/10 text-sm font-bold text-white transition hover:opacity-90"
      >
        {user?.avatar_path ? (
          <img
            src={`http://localhost:8000/storage/${user.avatar_path}`}
            alt={user.name}
            className="h-full w-full object-cover"
          />
        ) : (
          initials || "?"
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-white/10 bg-[#242526] shadow-2xl">
          {/* En-tête */}
          <div className="p-2">
            <button
              onClick={() => go("/profile")}
              className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-white/10"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-300">
                {user?.avatar_path ? (
                  <img
                    src={`http://localhost:8000/storage/${user.avatar_path}`}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials || "?"
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-white">
                  {user?.name}
                </span>
              </span>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          </div>

          <div className="mx-2 border-t border-white/10" />

          {/* Liens */}
          <div className="p-2">
            <MenuLink
              icon={Settings}
              label="Paramètres et confidentialité"
              onClick={() => go("/account-settings")}
            />
            <MenuLink
              icon={HelpCircle}
              label="Aide et assistance"
              onClick={() => go("/help")}
            />
            <MenuLink
              icon={Moon}
              label="Affichage et accessibilité"
              onClick={() => go("/appearance")}
            />
          </div>

          <div className="mx-2 border-t border-white/10" />

          <div className="p-2">
            <MenuLink icon={LogOut} label="Se déconnecter" onClick={handleLogout} danger />
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-sm font-medium transition hover:bg-white/10 ${
        danger ? "text-rose-400" : "text-slate-100"
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          danger ? "bg-rose-500/15" : "bg-white/10"
        }`}
      >
        <Icon size={16} />
      </span>
      {label}
    </button>
  );
}