
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Layers3,
  Moon,
  Sun,
  LayoutDashboard,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Globe2,
} from "lucide-react";
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

  const [activeAnchor, setActiveAnchor] = useState(
    typeof window !== "undefined" ? window.location.hash : ""
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const updateHash = () => setActiveAnchor(window.location.hash);

    window.addEventListener("hashchange", updateHash);
    window.addEventListener("popstate", updateHash);

    return () => {
      window.removeEventListener("hashchange", updateHash);
      window.removeEventListener("popstate", updateHash);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileOpen]);

  const isActive = (path, anchor = null) => {
    if (anchor) {
      return currentPath === "/" && activeAnchor === anchor;
    }

    if (path === "/") {
      return currentPath === "/" && !activeAnchor;
    }

    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  const scrollToAnchor = (event, anchor) => {
    event.preventDefault();
    setMobileOpen(false);

    if (currentPath !== "/") {
      window.location.href = `/${anchor}`;
      return;
    }

    const element = document.querySelector(anchor);

    if (element) {
      const offset = 100;
      const top =
        element.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({ top, behavior: "smooth" });
      window.history.pushState(null, "", anchor);
      setActiveAnchor(anchor);
    }
  };

  const shellClass = isDark
    ? "border-white/10 bg-[#102A43]/95 text-white shadow-[0_12px_40px_-12px_rgba(0,0,0,0.35)]"
    : "border-slate-200/80 bg-white/95 text-[#102A43] shadow-[0_12px_40px_-12px_rgba(15,23,42,0.14)]";

  const linkClass = (active) =>
    `inline-flex items-center justify-center rounded-xl px-3 py-2 text-[13px] font-semibold transition-all duration-200 ${
      active
        ? isDark
          ? "bg-white/10 text-[#76DED7]"
          : "bg-[#E6FAF6] text-[#0F9691]"
        : isDark
          ? "text-slate-300 hover:bg-white/5 hover:text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-[#102A43]"
    }`;

  const navItems = [
    { label: "Comment ça marche", anchor: "#comment-ca-marche" },
    { label: "Pour qui ?", anchor: "#pour-qui" },
    { label: "Confiance", anchor: "#confiance" },
  ];

  const renderNavItems = (mobile = false) => (
    <>
      {!user &&
        !loading &&
        navItems.map((item) => (
          <a
            key={item.anchor}
            href={item.anchor}
            onClick={(event) => scrollToAnchor(event, item.anchor)}
            className={`${linkClass(isActive("/", item.anchor))} ${
              mobile ? "w-full justify-start px-4 py-3" : ""
            }`}
          >
            {item.label}
          </a>
        ))}

      <Link
        to="/explore"
        onClick={() => setMobileOpen(false)}
        className={`${linkClass(isActive("/explore"))} ${
          mobile ? "w-full justify-start px-4 py-3" : ""
        }`}
      >
       
        Explorer
      </Link>

      {user && (
        <Link
          to="/browse-requests"
          onClick={() => setMobileOpen(false)}
          className={`${linkClass(isActive("/browse-requests"))} ${
            mobile ? "w-full justify-start px-4 py-3" : ""
          }`}
        >
          Demandes
        </Link>
      )}
    </>
  );

  return (
    <header className="fixed left-0 right-0 top-3 z-50 px-3 sm:top-4 sm:px-5">
      <div
        className={`relative mx-auto max-w-7xl rounded-2xl border backdrop-blur-2xl transition-colors duration-300 ${shellClass}`}
      >
        {/* Barre principale */}
        <div className="flex min-h-[66px] items-center justify-between gap-3 px-3 sm:px-5">
          {/* Logo */}
          <Link
            to="/"
            onClick={() => {
              setMobileOpen(false);
              setActiveAnchor("");
            }}
            aria-label="TalentShare, accueil"
            className="group flex shrink-0 items-center gap-2.5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16B8B1] text-[#102A43] shadow-sm transition-transform duration-200 group-hover:scale-105">
              <Layers3 size={22} strokeWidth={2.2} />
            </span>
            <span>
              <span
                className={`block text-[17px] font-extrabold leading-5 tracking-tight ${
                  isDark ? "text-white" : "text-[#102A43]"
                }`}
              >
                TalentShare
              </span>
              <span
                className={`mt-1 hidden text-[9px] font-semibold uppercase tracking-[0.15em] sm:block ${
                  isDark ? "text-slate-400" : "text-slate-400"
                }`}
              >
                Connecter les talents
              </span>
            </span>
          </Link>

          {/* Navigation desktop */}
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
            {renderNavItems()}
          </nav>

          {/* Actions desktop */}
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? "Activer le thème clair"
                  : "Activer le thème sombre"
              }
              title="Changer de thème"
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                isDark
                  ? "text-slate-300 hover:bg-white/10 hover:text-[#76DED7]"
                  : "text-slate-500 hover:bg-slate-100 hover:text-[#0F9691]"
              }`}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div
              className={`flex items-center gap-0.5 rounded-xl border p-1 ${
                isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"
              }`}
              aria-label="Choisir la langue"
            >
              <Globe2
                size={14}
                className={`ml-1.5 mr-1 ${
                  isDark ? "text-slate-400" : "text-slate-400"
                }`}
              />
              {["FR", "EN", "MG"].map((language) => (
                <button
                  key={language}
                  type="button"
                  onClick={() => setLang(language)}
                  aria-pressed={lang === language}
                  className={`rounded-lg px-2 py-1.5 text-[10px] font-bold transition ${
                    lang === language
                      ? isDark
                        ? "bg-white text-[#102A43]"
                        : "bg-[#102A43] text-white"
                      : isDark
                        ? "text-slate-400 hover:text-white"
                        : "text-slate-500 hover:text-[#102A43]"
                  }`}
                >
                  {language}
                </button>
              ))}
            </div>

            <div className="mx-1 h-7 w-px bg-current opacity-10" />

            {loading ? (
              <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-500/15" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
                    isDark
                      ? "text-slate-200 hover:bg-white/10"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <LayoutDashboard size={16} />
                  Mon espace
                </Link>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#16B8B1] text-sm font-extrabold text-[#102A43]">
                  {user.name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className={`rounded-xl px-3 py-2 text-[13px] font-semibold transition ${
                    isDark
                      ? "text-slate-200 hover:bg-white/10"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Se connecter
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#16B8B1] px-4 py-2.5 text-[13px] font-bold text-[#102A43] shadow-sm transition hover:bg-[#76DED7] hover:shadow-md"
                >
                  Rejoindre
                  <ChevronRight size={15} />
                </Link>
              </div>
            )}
          </div>

          {/* Actions mobile */}
          <div className="flex shrink-0 items-center gap-1 sm:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Changer de thème"
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                isDark
                  ? "text-slate-300 hover:bg-white/10"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((current) => !current)}
              aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileOpen}
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                isDark
                  ? "text-white hover:bg-white/10"
                  : "text-[#102A43] hover:bg-slate-100"
              }`}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        {mobileOpen && (
          <div
            className={`border-t px-3 pb-4 pt-3 sm:hidden ${
              isDark ? "border-white/10" : "border-slate-100"
            }`}
          >
            <nav className="flex flex-col gap-1">
              {renderNavItems(true)}
            </nav>

            <div
              className={`my-3 h-px ${
                isDark ? "bg-white/10" : "bg-slate-100"
              }`}
            />

            {/* Langues sur mobile */}
            <div className="flex items-center justify-between px-2 py-2">
              <span
                className={`text-xs font-semibold ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Langue
              </span>

              <div
                className={`flex items-center gap-1 rounded-xl border p-1 ${
                  isDark ? "border-white/10" : "border-slate-200"
                }`}
              >
                {["FR", "EN", "MG"].map((language) => (
                  <button
                    key={language}
                    type="button"
                    onClick={() => setLang(language)}
                    aria-pressed={lang === language}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      lang === language
                        ? isDark
                          ? "bg-white text-[#102A43]"
                          : "bg-[#102A43] text-white"
                        : isDark
                          ? "text-slate-400"
                          : "text-slate-500"
                    }`}
                  >
                    {language}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="mt-2 h-11 animate-pulse rounded-xl bg-slate-500/15" />
            ) : user ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#16B8B1] px-4 py-3 text-sm font-bold text-[#102A43]"
              >
                <LayoutDashboard size={17} />
                Accéder à mon espace
              </Link>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-center rounded-xl border px-3 py-3 text-sm font-semibold ${
                    isDark
                      ? "border-white/15 text-white"
                      : "border-slate-200 text-[#102A43]"
                  }`}
                >
                  Se connecter
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-1 rounded-xl bg-[#16B8B1] px-3 py-3 text-sm font-bold text-[#102A43]"
                >
                  Rejoindre
                  <ChevronRight size={15} />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
