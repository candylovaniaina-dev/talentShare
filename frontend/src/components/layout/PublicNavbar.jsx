import React from "react";
import { Link } from "react-router-dom";
import { Circle, Moon, Sun, LayoutDashboard } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";

export default function PublicNavbar({ variant = "dark" }) {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang } = useLanguage();
  const { user, loading } = useAuth();
  const isDark = variant === "dark";

  return (
    <header className={`sticky top-4 z-50 mx-auto flex max-w-6xl items-center justify-between rounded-2xl border px-6 py-3 backdrop-blur-md ${
      isDark ? "border-white/10 bg-navy-light/70 text-white" : "border-slate-200 bg-white/80 text-navy"
    }`}>
      <Link to="/" className="flex items-center gap-2 font-bold">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-mint/40 bg-mint/10 text-mint">
          <Circle size={14} strokeWidth={3} />
        </span>
        TalentShare
      </Link>

      <nav className={`hidden items-center gap-7 text-sm font-medium md:flex ${isDark ? "text-slate-300" : "text-slate-600"}`}>
        <a href="/#comment-ca-marche" className="hover:text-mint transition-colors">Comment ça marche</a>
        <a href="/#pour-qui" className="hover:text-mint transition-colors">Pour qui ?</a>
        <a href="/#confiance" className="hover:text-mint transition-colors">Confiance</a>
        <Link to="/opportunites" className="hover:text-mint transition-colors">Explorer</Link>
      </nav>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className={`hidden rounded-full p-2 sm:block ${isDark ? "text-slate-300 hover:bg-white/10" : "text-slate-500 hover:bg-slate-100"}`}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className={`hidden items-center rounded-full border p-0.5 text-xs font-semibold sm:flex ${isDark ? "border-white/15" : "border-slate-200"}`}>
          {["FR", "EN", "MG"].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`rounded-full px-2.5 py-1 transition-colors ${
                lang === l ? "bg-white text-navy" : isDark ? "text-slate-300" : "text-slate-500"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* ✅ Loading → user connecté → visiteur */}
        {loading ? (
          <div className="hidden h-9 w-24 animate-pulse rounded-full bg-slate-200 sm:block" />
        ) : user ? (
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
                isDark ? "text-slate-200 hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <LayoutDashboard size={14} /> Mon espace
            </Link>
            <div className={`flex items-center gap-2 rounded-full border px-3 py-1 ${
              isDark ? "border-white/15 bg-white/5" : "border-slate-200 bg-white"
            }`}>
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                isDark ? "bg-mint text-navy" : "bg-navy text-white"
              }`}>
                {user.name?.charAt(0)?.toUpperCase() || "?"}
              </span>
              <span className={`text-xs font-semibold ${isDark ? "text-white" : "text-navy"}`}>
                {user.name?.split(" ")[0] || user.email}
              </span>
            </div>
          </div>
        ) : (
          <>
            <Link
              to="/login"
              className={`hidden text-sm font-medium sm:block ${
                isDark ? "text-slate-200 hover:text-white" : "text-slate-600 hover:text-navy"
              }`}
            >
              Se connecter
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-light"
            >
              Rejoindre TalentShare
            </Link>
          </>
        )}
      </div>
    </header>
  );
}