import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import api from "../services/api";

const ThemeContext = createContext(null);

/**
 * false : le thème vient uniquement du navigateur (localStorage). Le serveur le reçoit mais ne l'impose plus.
 * true  : le thème du serveur (user.theme_preference) écrase le thème local à chaque /me.
 * À repasser à true seulement quand le défaut de la colonne users.theme_preference sera 'light'.
 */
const SYNC_THEME_FROM_SERVER = false;

const getStoredValue = (key, fallback) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

const getStoredBoolean = (key) => getStoredValue(key, "false") === "true";

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const stored = getStoredValue("theme", null);
    return stored === "dark" || stored === "light" ? stored : "light"; // défaut : clair
  });

  const [fontSize, setFontSize] = useState(() => getStoredValue("font_size", "normal"));
  const [highContrast, setHighContrast] = useState(() => getStoredBoolean("high_contrast"));
  const [reduceMotion, setReduceMotion] = useState(() => getStoredBoolean("reduce_motion"));

  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;

    root.classList.remove("font-small", "font-normal", "font-large");
    root.classList.add(`font-${fontSize}`);

    root.classList.toggle("high-contrast", highContrast);
    root.classList.toggle("reduce-motion", reduceMotion);

    try {
      localStorage.setItem("theme", theme);
      localStorage.setItem("font_size", fontSize);
      localStorage.setItem("high_contrast", String(highContrast));
      localStorage.setItem("reduce_motion", String(reduceMotion));
    } catch (error) {
      console.error("Erreur de sauvegarde des préférences locales :", error);
    }
  }, [theme, fontSize, highContrast, reduceMotion]);

  const syncFromUser = useCallback((user) => {
    if (!user) return;

    // Le thème du serveur n'est appliqué que si on l'autorise explicitement.
    if (SYNC_THEME_FROM_SERVER) {
      setTheme(user.theme_preference === "dark" ? "dark" : "light");
    }

    if (["small", "normal", "large"].includes(user.font_size)) {
      setFontSize(user.font_size);
    }
    if (typeof user.high_contrast === "boolean") {
      setHighContrast(user.high_contrast);
    }
    if (typeof user.reduce_motion === "boolean") {
      setReduceMotion(user.reduce_motion);
    }
  }, []);

  const updatePreference = useCallback(async (key, value) => {
    const setters = {
      theme_preference: (v) => setTheme(v === "dark" ? "dark" : "light"), // "system" → clair
      font_size: setFontSize,
      high_contrast: setHighContrast,
      reduce_motion: setReduceMotion,
    };

    const isValid = {
      theme_preference: ["dark", "light", "system"].includes(value),
      font_size: ["small", "normal", "large"].includes(value),
      high_contrast: typeof value === "boolean",
      reduce_motion: typeof value === "boolean",
    };

    if (!setters[key] || !isValid[key]) {
      console.warn("Préférence invalide :", key, value);
      return;
    }

    // 1) Appliqué tout de suite en local (source de vérité)
    setters[key](value);

    // 2) Copie envoyée au serveur ; une erreur ici ne change jamais l'affichage
    let token = null;
    try {
      token = localStorage.getItem("token");
    } catch {
      token = null;
    }
    if (token) {
      try {
        await api.patch("/account/preferences", { [key]: value });
      } catch (error) {
        console.warn("Préférence non synchronisée avec le serveur :", error?.response?.status);
      }
    }
  }, []);

  const toggleTheme = useCallback(() => {
    updatePreference("theme_preference", theme === "dark" ? "light" : "dark");
  }, [theme, updatePreference]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        fontSize,
        highContrast,
        reduceMotion,
        toggleTheme,
        updatePreference,
        syncFromUser,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme doit être utilisé dans un composant enveloppé par ThemeProvider.");
  }
  return context;
};