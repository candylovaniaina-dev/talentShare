import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
    `px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
      active
        ? isDark
          ? "bg-mint/10 text-mint font-semibold"
          : "bg-navy-50 text-navy-800 font-semibold"
        : isDark
          ? "text-slate-300 hover:text-white hover:bg-white/5"
          : "text-slate-600 hover:text-navy-800 hover:bg-slate-100"
    }`;

  return (
    <header
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex w-[calc(100%-2rem)] max-w-6xl items-center justify-between gap-4 rounded-xl2 border px-5 py-3 backdrop-blur-xl shadow-card ${
        isDark
          ? "border-white/10 bg-navy-900/90 text-white"
          : "border-slate-200 bg-white/90 text-navy-800"
      }`}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 font-bold shrink-0">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-800 text-white">
          <span className="text-sm font-extrabold">T</span>
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
          className={`hidden sm:flex rounded-lg p-2 text-xs font-medium transition-colors ${
            isDark ? "text-slate-300 hover:bg-white/10" : "text-slate-500 hover:bg-slate-100"
          }`}
          aria-label="Changer de thème"
        >
          {theme === "dark" ? "Clair" : "Sombre"}
        </button>

        <div
          className={`hidden sm:flex items-center rounded-lg border p-0.5 text-xs font-semibold ${
            isDark ? "border-white/15" : "border-slate-200"
          }`}
        >
          {["FR", "EN", "MG"].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`rounded-md px-2.5 py-1 transition-colors ${
                lang === l
                  ? isDark
                    ? "bg-white text-navy-900 font-bold"
                    : "bg-navy-800 text-white font-bold"
                  : isDark
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-500 hover:text-navy-800"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="hidden h-9 w-20 animate-pulse rounded-lg bg-slate-500/20 sm:block" />
        ) : user ? (
          <>
            <Link
              to="/dashboard"
              className={`hidden sm:flex items-center rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap ${
                isDark ? "text-slate-200 hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Mon espace
            </Link>
            <div
              className={`flex items-center gap-2 rounded-lg border pl-1 pr-3 py-1 ${
                isDark ? "border-white/15 bg-white/5" : "border-slate-200 bg-white"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold shrink-0 ${
                  isDark ? "bg-mint text-navy-900" : "bg-navy-800 text-white"
                }`}
              >
                {user.name?.charAt(0)?.toUpperCase() || "?"}
              </span>
              <span
                className={`hidden sm:inline text-xs font-semibold whitespace-nowrap ${
                  isDark ? "text-white" : "text-navy-800"
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
                isDark ? "text-slate-200 hover:text-white" : "text-slate-600 hover:text-navy-800"
              }`}
            >
              Se connecter
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-navy-800 px-4 py-2 text-sm font-semibold text-white whitespace-nowrap transition-all hover:bg-navy-700"
            >
              Rejoindre
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
