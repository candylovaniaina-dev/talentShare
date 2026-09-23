import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Récupère depuis localStorage en fallback, mais sera remplacé par la préférence user
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [fontSize, setFontSize] = useState(() => localStorage.getItem("font_size") || "normal");
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem("high_contrast") === "true");
  const [reduceMotion, setReduceMotion] = useState(() => localStorage.getItem("reduce_motion") === "true");

  // Applique les classes sur <html>
  useEffect(() => {
    const root = document.documentElement;

    // Thème
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");

    // Taille de police
    root.classList.remove("font-small", "font-normal", "font-large");
    root.classList.add(`font-${fontSize}`);

    // Contraste élevé
    root.classList.toggle("high-contrast", highContrast);

    // Réduction des animations
    root.classList.toggle("reduce-motion", reduceMotion);

    // Persistance locale
    localStorage.setItem("theme", theme);
    localStorage.setItem("font_size", fontSize);
    localStorage.setItem("high_contrast", String(highContrast));
    localStorage.setItem("reduce_motion", String(reduceMotion));
  }, [theme, fontSize, highContrast, reduceMotion]);

  /**
   * ✅ Synchronise avec la préférence de l'utilisateur connecté
   * Appelé depuis AuthContext ou App.jsx après login
   */
const syncFromUser = (user) => {
  if (!user) return;
  if (user.theme_preference && user.theme_preference !== "system") {
    setTheme(user.theme_preference);
  }
  if (user.font_size) setFontSize(user.font_size);
  if (typeof user.high_contrast === "boolean") setHighContrast(user.high_contrast);
  if (typeof user.reduce_motion === "boolean") setReduceMotion(user.reduce_motion);
};

  /**
   * ✅ Change une préférence ET la sauvegarde côté backend
   */
  const updatePreference = async (key, value) => {
    // 1. Change localement (effet immédiat)
    if (key === "theme_preference") setTheme(value);
    if (key === "font_size") setFontSize(value);
    if (key === "high_contrast") setHighContrast(value);
    if (key === "reduce_motion") setReduceMotion(value);

    // 2. Sauvegarde côté backend
    try {
      await api.patch("/account/preferences", { [key]: value });
    } catch (err) {
      console.error("Erreur sauvegarde préférence :", err);
    }
  };

  // Compat ancien code : toggleTheme
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    updatePreference("theme_preference", next);
  };

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

export const useTheme = () => useContext(ThemeContext);