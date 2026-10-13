import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";

const LanguageContext = createContext(null);
const SUPPORTED_LANGUAGES = ["FR", "EN"];

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    const savedLang = localStorage.getItem("lang");
    return SUPPORTED_LANGUAGES.includes(savedLang) ? savedLang : "FR";
  });

  const setLang = useCallback((nextLang) => {
    if (!SUPPORTED_LANGUAGES.includes(nextLang)) {
      console.warn(`Langue non prise en charge : ${nextLang}`);
      return;
    }

    setLangState(nextLang);
    localStorage.setItem("lang", nextLang);
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage doit être utilisé dans un composant enveloppé par LanguageProvider."
    );
  }

  return context;
};