import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-2)] text-sm font-bold text-[var(--text-app)] transition hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)]"
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
        <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl2 border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-pop">
          {/* En-tête */}
          <div className="p-2">
            <button
              onClick={() => go("/profile")}
              className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition hover:bg-[var(--bg-surface-hover)]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-navy-800 text-sm font-bold text-white">
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
                <span className="block truncate text-sm font-semibold text-[var(--text-app)]">
                  {user?.name}
                </span>
              </span>
              <span className="text-xs text-[var(--text-faint)]">›</span>
            </button>
          </div>

          <div className="mx-2 border-t border-[var(--border-app)]" />

          {/* Liens */}
          <div className="p-2">
            <MenuLink label="Paramètres et confidentialité" onClick={() => go("/account-settings")} />
            <MenuLink label="Aide et assistance" onClick={() => go("/help")} />
            <MenuLink label="Affichage et accessibilité" onClick={() => go("/appearance")} />
          </div>

          <div className="mx-2 border-t border-[var(--border-app)]" />

          <div className="p-2">
            <MenuLink label="Se déconnecter" onClick={handleLogout} danger />
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({ label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium transition hover:bg-[var(--bg-surface-hover)] ${
        danger ? "text-rose-600 dark:text-rose-400" : "text-[var(--text-muted)] hover:text-[var(--text-app)]"
      }`}
    >
      {label}
    </button>
  );
}
