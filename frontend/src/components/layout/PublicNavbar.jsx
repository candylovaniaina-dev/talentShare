import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Layers, Menu, Moon, Sun, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { label: "Comment ça marche", anchor: "#comment-ca-marche" },
  { label: "Pour qui ?", anchor: "#pour-qui" },
  { label: "Confiance", anchor: "#confiance" },
];

const LANGUAGES = ["FR", "EN", "MG"];

/**
 * Le thème (clair / sombre) est lu depuis ThemeContext : la barre s'adapte
 * automatiquement. La prop `variant` est conservée pour la compatibilité
 * avec les pages existantes, mais n'est plus nécessaire.
 */
// eslint-disable-next-line no-unused-vars
export default function PublicNavbar({ variant } = {}) {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang } = useLanguage();
  const { user, loading } = useAuth();
  const location = useLocation();
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
    if (anchor) return currentPath === "/" && activeAnchor === anchor;
    if (path === "/") return currentPath === "/" && !activeAnchor;
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
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
      window.history.pushState(null, "", anchor);
      setActiveAnchor(anchor);
    }
  };

  /* ---------- Styles (clair + sombre) ---------- */
  const shell =
    "border-slate-200/80 bg-white/80 text-[#0B2229] shadow-[0_10px_40px_-12px_rgba(11,34,41,0.18)] " +
    "dark:border-white/10 dark:bg-[#07272B]/75 dark:text-white dark:shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)]";

  const linkClass = (active) =>
    `relative inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${
      active
        ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
        : "text-slate-600 hover:bg-slate-900/5 hover:text-[#0B2229] dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
    }`;

  const iconButton =
    "flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-900/5 hover:text-[#0B2229] " +
    "dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60";

  const ghostLink =
    "rounded-full px-3.5 py-2 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-900/5 " +
    "dark:text-slate-200 dark:hover:bg-white/5";

  const primaryLink =
    "rounded-full bg-gradient-to-br from-emerald-300 to-emerald-500 px-4 py-2 text-[13px] font-bold text-[#04231D] " +
    "shadow-[0_8px_22px_-8px_rgba(16,185,129,0.7)] transition hover:brightness-105";

  const themeLabel =
    theme === "dark" ? "Activer le thème clair" : "Activer le thème sombre";

  const ThemeToggle = () => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleTheme();
      }}
      aria-label={themeLabel}
      title={themeLabel}
      className={iconButton}
    >
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );

  const LangSwitch = ({ large = false }) => (
    <div
      role="group"
      aria-label="Choisir la langue"
      className="flex items-center gap-0.5 rounded-full border border-slate-200 bg-slate-100/70 p-1 dark:border-white/10 dark:bg-white/[0.04]"
    >
      {LANGUAGES.map((language) => (
        <button
          key={language}
          type="button"
          onClick={() => setLang(language)}
          aria-pressed={lang === language}
          className={`rounded-full font-bold transition-colors ${
            large ? "px-3 py-1.5 text-xs" : "px-2.5 py-1 text-[10px]"
          } ${
            lang === language
              ? "bg-emerald-400 text-[#04231D]"
              : "text-slate-500 hover:text-[#0B2229] dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          {language}
        </button>
      ))}
    </div>
  );

  const renderNavItems = (mobile = false) => (
    <>
      {!user &&
        !loading &&
        NAV_ITEMS.map((item) => {
          const active = isActive("/", item.anchor);
          return (
            <a
              key={item.anchor}
              href={item.anchor}
              onClick={(event) => scrollToAnchor(event, item.anchor)}
              className={`${linkClass(active)} ${mobile ? "w-full rounded-xl py-3" : ""}`}
            >
              {item.label}
            </a>
          );
        })}

      <Link
        to="/explore"
        onClick={() => setMobileOpen(false)}
        aria-current={isActive("/explore") ? "page" : undefined}
        className={`${linkClass(isActive("/explore"))} ${mobile ? "w-full rounded-xl py-3" : ""}`}
      >
        Explorer
      </Link>

      {user && (
        <Link
          to="/browse-requests"
          onClick={() => setMobileOpen(false)}
          aria-current={isActive("/browse-requests") ? "page" : undefined}
          className={`${linkClass(isActive("/browse-requests"))} ${mobile ? "w-full rounded-xl py-3" : ""}`}
        >
          Demandes
        </Link>
      )}
    </>
  );

  return (
    <header className="fixed left-0 right-0 top-3 z-[9999] px-3 sm:top-4 sm:px-5">
      <div
        className={`mx-auto max-w-7xl rounded-[26px] border backdrop-blur-xl transition-colors duration-300 ${shell}`}
      >
        <div className="flex min-h-[64px] items-center justify-between gap-4 px-4 sm:px-5">
          {/* Marque */}
          <Link
            to="/"
            onClick={() => {
              setMobileOpen(false);
              setActiveAnchor("");
            }}
            aria-label="TalentShare, accueil"
            className="group flex shrink-0 items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-300 to-emerald-500 text-[#04231D] shadow-[0_8px_22px_-8px_rgba(16,185,129,0.8)] transition-transform group-hover:scale-105">
              <Layers size={20} strokeWidth={2.2} />
            </span>
            <span className="block leading-none">
              <span className="block text-[17px] font-extrabold tracking-[-0.03em]">
                TalentShare
              </span>
              <span className="mt-1 block text-[10px] font-medium text-slate-500 dark:text-emerald-200/60">
                Connecter les talents
              </span>
            </span>
          </Link>

          {/* Navigation */}
          <nav
            aria-label="Navigation principale"
            className="hidden flex-1 items-center justify-center gap-1 lg:flex"
          >
            {renderNavItems()}
          </nav>

          {/* Actions desktop */}
          <div className="hidden shrink-0 items-center gap-2.5 sm:flex">
            <ThemeToggle />
            <LangSwitch />
            <span className="mx-1 h-6 w-px bg-slate-200 dark:bg-white/10" />

            {loading ? (
              <span className="h-9 w-28 animate-pulse rounded-full bg-slate-500/15" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <Link to="/dashboard" className={ghostLink}>
                  Mon espace
                </Link>
                <span
                  title={user.name || "Utilisateur"}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-emerald-500 text-sm font-bold text-[#04231D]"
                >
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link to="/login" className={ghostLink}>
                  Se connecter
                </Link>
                <Link to="/register" className={primaryLink}>
                  Rejoindre
                </Link>
              </div>
            )}
          </div>

          {/* Actions mobiles */}
          <div className="flex shrink-0 items-center gap-1.5 sm:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileOpen((current) => !current)}
              aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileOpen}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-[#0B2229] transition-colors hover:bg-slate-900/5 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        {mobileOpen && (
          <div className="border-t border-slate-200/80 px-4 pb-4 pt-3 dark:border-white/10 sm:hidden">
            <nav className="flex flex-col gap-1" aria-label="Navigation mobile">
              {renderNavItems(true)}
            </nav>

            <div className="my-3 h-px bg-slate-200/80 dark:bg-white/10" />

            <div className="flex items-center justify-between px-1 py-1.5">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Langue
              </span>
              <LangSwitch large />
            </div>

            {loading ? (
              <div className="mt-3 h-11 animate-pulse rounded-full bg-slate-500/15" />
            ) : user ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="mt-3 flex justify-center rounded-full bg-gradient-to-br from-emerald-300 to-emerald-500 px-4 py-3 text-sm font-bold text-[#04231D]"
              >
                Accéder à mon espace
              </Link>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex justify-center rounded-full border border-slate-200 px-3 py-3 text-sm font-semibold text-[#0B2229] dark:border-white/15 dark:text-white"
                >
                  Se connecter
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex justify-center rounded-full bg-gradient-to-br from-emerald-300 to-emerald-500 px-3 py-3 text-sm font-bold text-[#04231D]"
                >
                  Rejoindre
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}