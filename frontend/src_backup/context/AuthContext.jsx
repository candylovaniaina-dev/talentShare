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
      localStorage.setItem(
        "last_user",
        JSON.stringify({
          id: currentUser.id,
          email: email || currentUser.email,
          name: currentUser.name,
          avatar_path:
            currentUser.avatar_path ||
            currentUser.professional_profile?.avatar_path ||
            null,
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

    requestId.current += 1;
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(registeredUser);
    setLoading(false);
    syncFromUser(registeredUser);
    saveLastUser(registeredUser, userData.email);

    return registeredUser;
  };

  /**
   * ✅ NOUVEAU : Auth depuis OAuth (Google / LinkedIn / Facebook)
   * Appelé par OAuthCallback.jsx
   */
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
        setAuthFromOAuth,   // ✅ AJOUT
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);