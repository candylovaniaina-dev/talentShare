import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import api from "../services/api";

const ThemeContext = createContext(null);

const getStoredValue = (key, fallback) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

const getStoredBoolean = (key) => getStoredValue(key, "false") === "true";

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() =>
    getStoredValue("theme", "dark")
  );
  const [fontSize, setFontSize] = useState(() =>
    getStoredValue("font_size", "normal")
  );
  const [highContrast, setHighContrast] = useState(() =>
    getStoredBoolean("high_contrast")
  );
  const [reduceMotion, setReduceMotion] = useState(() =>
    getStoredBoolean("reduce_motion")
  );

  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");

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

    if (
      user.theme_preference === "dark" ||
      user.theme_preference === "light"
    ) {
      setTheme(user.theme_preference);
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
      theme_preference: setTheme,
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

    // Applique immédiatement la préférence à l'interface.
    // "system" reste accepté pour compatibilité avec le backend.
    if (key === "theme_preference" && value === "system") {
      const prefersDark =
        window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;

      setTheme(prefersDark ? "dark" : "light");
    } else {
      setters[key](value);
    }

    try {
      await api.patch("/account/preferences", { [key]: value });
    } catch (error) {
      console.error("Erreur sauvegarde préférence :", error);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    updatePreference("theme_preference", nextTheme);
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
    throw new Error(
      "useTheme doit être utilisé dans un composant enveloppé par ThemeProvider."
    );
  }

  return context;
};