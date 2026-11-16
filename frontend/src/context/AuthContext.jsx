import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";
import api from "../services/api";
import { useTheme } from "./ThemeContext";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const requestId = useRef(0);
  const { syncFromUser } = useTheme();

  const saveLastUser = useCallback((currentUser, email) => {
    if (!currentUser) return;

    try {
      const avatarOrLogo =
        currentUser.avatar_path ||
        currentUser.professional_profile?.avatar_path ||
        currentUser.company?.logo_url ||
        currentUser.company?.logo_path ||
        currentUser.companies?.[0]?.logo_url ||
        currentUser.companies?.[0]?.logo_path ||
        null;

      localStorage.setItem(
        "last_user",
        JSON.stringify({
          id: currentUser.id,
          email: email || currentUser.email,
          name: currentUser.name,
          avatar_path: avatarOrLogo,
          role: currentUser.role,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error("Erreur saveLastUser:", error);
    }
  }, []);

  const fetchUser = useCallback(async () => {
    const currentRequest = ++requestId.current;

    try {
      const response = await api.get("/me");

      if (currentRequest !== requestId.current) return null;

      setUser(response.data);
      syncFromUser(response.data);
      return response.data;
    } catch (error) {
      if (currentRequest === requestId.current) {
        console.error("Erreur fetch user:", error);
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      }
      return null;
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
      }
    }
  }, [syncFromUser]);

  useEffect(() => {
    if (token) {
      setLoading(true);
      fetchUser();
    } else {
      requestId.current += 1;
      setUser(null);
      setLoading(false);
    }
  }, [token, fetchUser]);

  const login = async (email, password) => {
    const response = await api.post("/login", { email, password });
    const { token: newToken, user: loggedInUser } = response.data;

    if (!newToken || !loggedInUser) {
      throw new Error("Réponse de connexion invalide.");
    }

    requestId.current += 1;
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(loggedInUser);
    setLoading(false);
    syncFromUser(loggedInUser);
    saveLastUser(loggedInUser, email);

    return loggedInUser;
  };

  const register = async (userData) => {
    const response = await api.post("/register", userData);
    const { token: newToken, user: registeredUser } = response.data;

    if (!newToken || !registeredUser) {
      throw new Error("Réponse d'inscription invalide.");
    }

    // ✅ 1. ON FORCE LE THÈME CLAIR DANS L'OBJET UTILISATEUR
    const userWithLightTheme = {
      ...registeredUser,
      theme_preference: "light",
    };

    // ✅ 2. ON FORCE LE THÈME CLAIR DANS LE STORAGE
    localStorage.setItem("theme", "light");

    // ✅ 3. ON FORCE LE THÈME CLAIR DANS LE DOM
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    document.documentElement.setAttribute("data-theme", "light");

    requestId.current += 1;
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(userWithLightTheme);
    setLoading(false);
    
    // ✅ 4. ON SYNCHRONISE LE CONTEXTE AVEC LA VALEUR FORCÉE
    syncFromUser(userWithLightTheme);
    saveLastUser(userWithLightTheme, userData.email);

    return userWithLightTheme;
  };

  const setAuthFromOAuth = useCallback((newToken, oauthUser) => {
    if (!newToken || !oauthUser) {
      console.error("setAuthFromOAuth: payload invalide");
      return;
    }

    requestId.current += 1;
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(oauthUser);
    setLoading(false);
    syncFromUser(oauthUser);
    saveLastUser(oauthUser, oauthUser.email);
  }, [syncFromUser, saveLastUser]);

  const logout = () => {
    requestId.current += 1;

    const logoutRequest = api.post("/logout").catch((error) => {
      console.error("Erreur logout:", error);
    });

    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setLoading(false);

    return logoutRequest;
  };

  const refreshUser = async () => {
    if (!localStorage.getItem("token")) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return null;
    }

    setLoading(true);
    return fetchUser();
  };

  const getLastUser = () => {
    try {
      const stored = localStorage.getItem("last_user");
      if (!stored) return null;

      const data = JSON.parse(stored);

      if (
        !data.timestamp ||
        Date.now() - data.timestamp > 30 * 24 * 60 * 60 * 1000
      ) {
        localStorage.removeItem("last_user");
        return null;
      }

      return data;
    } catch {
      return null;
    }
  };

  const clearLastUser = () => {
    localStorage.removeItem("last_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        getLastUser,
        clearLastUser,
        setAuthFromOAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);