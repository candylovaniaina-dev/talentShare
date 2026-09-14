import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  User, Settings, HelpCircle, LogOut, ChevronDown, Shield, LayoutDashboard
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function DropdownMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fermer le menu si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Première lettre du nom pour l'avatar
  const initial = user?.name?.charAt(0).toUpperCase() || "U";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton - Avatar avec initiale */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-slate-100 transition"
      >
        <div className="h-8 w-8 rounded-full bg-navy text-white flex items-center justify-center text-sm font-semibold">
          {initial}
        </div>
        <ChevronDown size={16} className={`transition ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Menu déroulant */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-slate-200 py-2 z-50">
          {/* Header - Nom + Email + Rôle */}
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="font-semibold text-sm">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            <span className="mt-1 inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {user?.role === 'company' ? '🏢 Entreprise' : 
               user?.role === 'student' ? '🎓 Étudiant' :
               user?.role === 'university' ? '🏛️ Université' :
               user?.role === 'admin' ? '🛡️ Admin' : '👤 Talent'}
            </span>
          </div>

          {/* Items du menu */}
          <div className="py-1">
            {/* Tableau de bord */}
            <Link
              to="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 transition"
            >
              <LayoutDashboard size={18} className="text-slate-500" />
              <span>Tableau de bord</span>
            </Link>

            {/* Mon profil */}
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 transition"
            >
              <User size={18} className="text-slate-500" />
              <span>Mon profil</span>
            </Link>

            {/* Paramètres */}
            <Link
              to="/account-settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 transition"
            >
              <Settings size={18} className="text-slate-500" />
              <span>Paramètres</span>
            </Link>

            {/* Séparateur */}
            <hr className="my-1 border-slate-100" />

            {/* Aide et assistance */}
            <Link
              to="/help"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 transition"
            >
              <HelpCircle size={18} className="text-slate-500" />
              <span>Aide et assistance</span>
            </Link>

            {/* Déconnexion */}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
            >
              <LogOut size={18} />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}