import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Circle, Moon, Sun, LayoutDashboard } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";

export default function PublicNavbar({ variant = "dark" }) {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang } = useLanguage();
  const { user, loading } = useAuth();
  const location = useLocation();
  const isDark = variant === "dark";
  const currentPath = location.pathname;

  // ✅ Détecte l'ancre active
  const [activeAnchor, setActiveAnchor] = useState("");
  useEffect(() => {
    const handleHashChange = () => setActiveAnchor(window.location.hash);
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const isActive = (path, anchor = null) => {
    if (anchor) return currentPath === "/" && activeAnchor === anchor;
    if (path === "/") return currentPath === "/" && !activeAnchor;
    return currentPath === path || currentPath.startsWith(path + "/");
  };

  // ✅ Scroll smooth vers les ancres
  const scrollToAnchor = (e, anchor) => {
    e.preventDefault();
    if (currentPath !== "/") {
      window.location.href = `/${anchor}`;
      return;
    }
    const el = document.querySelector(anchor);
    if (el) {
      const offset = 100;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
      window.history.pushState(null, "", anchor);
      setActiveAnchor(anchor);
    }
  };

  const linkClass = (active) =>
    `px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
      active
        ? isDark
          ? "bg-mint/15 text-mint font-semibold"
          : "bg-navy/10 text-navy font-semibold"
        : isDark
          ? "text-slate-300 hover:text-white hover:bg-white/5"
          : "text-slate-600 hover:text-navy hover:bg-slate-100"
    }`;

  return (
    <header
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex w-[calc(100%-3rem)] max-w-6xl items-center justify-between gap-4 rounded-2xl border px-5 py-3 backdrop-blur-xl shadow-lg ${
        isDark
          ? "border-white/10 bg-navy-light/90 text-white"
          : "border-slate-200 bg-white/90 text-navy"
      }`}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 font-bold shrink-0">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-mint/40 bg-mint/10 text-mint">
          <Circle size={14} strokeWidth={3} />
        </span>
        <span className="hidden sm:inline whitespace-nowrap">TalentShare</span>
      </Link>

      {/* Nav */}
      <nav className="hidden md:flex items-center gap-1 flex-1 min-w-0 justify-center">
        {!user && !loading && (
          <>
            <a
              href="#comment-ca-marche"
              onClick={(e) => scrollToAnchor(e, "#comment-ca-marche")}
              className={linkClass(isActive("/", "#comment-ca-marche"))}
            >
              Comment ça marche
            </a>
            <a
              href="#pour-qui"
              onClick={(e) => scrollToAnchor(e, "#pour-qui")}
              className={linkClass(isActive("/", "#pour-qui"))}
            >
              Pour qui ?
            </a>
            <a
              href="#confiance"
              onClick={(e) => scrollToAnchor(e, "#confiance")}
              className={linkClass(isActive("/", "#confiance"))}
            >
              Confiance
            </a>
          </>
        )}

        <Link to="/explore" className={linkClass(isActive("/explore"))}>
          Explorer
        </Link>

        {user && (
          <Link to="/browse-requests" className={linkClass(isActive("/browse-requests"))}>
            Demandes
          </Link>
        )}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={toggleTheme}
          className={`hidden sm:flex rounded-full p-2 transition-colors ${
            isDark ? "text-slate-300 hover:bg-white/10" : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <div
          className={`hidden sm:flex items-center rounded-full border p-0.5 text-xs font-semibold ${
            isDark ? "border-white/15" : "border-slate-200"
          }`}
        >
          {["FR", "EN", "MG"].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`rounded-full px-2.5 py-1 transition-colors ${
                lang === l
                  ? isDark
                    ? "bg-white text-navy font-bold"
                    : "bg-navy text-white font-bold"
                  : isDark
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-500 hover:text-navy"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="hidden h-9 w-20 animate-pulse rounded-full bg-slate-500/20 sm:block" />
        ) : user ? (
          <>
            <Link
              to="/dashboard"
              className={`hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap ${
                isDark ? "text-slate-200 hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <LayoutDashboard size={14} /> Mon espace
            </Link>
            <div
              className={`flex items-center gap-2 rounded-full border pl-1 pr-3 py-1 ${
                isDark ? "border-white/15 bg-white/5" : "border-slate-200 bg-white"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                  isDark ? "bg-mint text-navy" : "bg-navy text-white"
                }`}
              >
                {user.name?.charAt(0)?.toUpperCase() || "?"}
              </span>
              <span
                className={`hidden sm:inline text-xs font-semibold whitespace-nowrap ${
                  isDark ? "text-white" : "text-navy"
                }`}
              >
                {user.name?.split(" ")[0] || user.email}
              </span>
            </div>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className={`hidden sm:block text-sm font-medium whitespace-nowrap ${
                isDark ? "text-slate-200 hover:text-white" : "text-slate-600 hover:text-navy"
              }`}
            >
              Se connecter
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#0A1229] whitespace-nowrap transition-all hover:bg-emerald-400"
            >
              Rejoindre
            </Link>
          </>
        )}
      </div>
    </header>
  );
}