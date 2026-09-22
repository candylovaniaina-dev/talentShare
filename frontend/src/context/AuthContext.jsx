import React, { createContext, useState, useContext, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await api.get("/me");
      setUser(response.data);
    } catch (error) {
      console.error("Erreur fetch user:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // ✅ Sauvegarde le dernier utilisateur pour préremplir le login
  const saveLastUser = (user, email) => {
    try {
      localStorage.setItem("last_user", JSON.stringify({
        id: user.id,
        email: email || user.email,
        name: user.name,
        avatar_path: user.avatar_path || user.professional_profile?.avatar_path || null,
        role: user.role,
        timestamp: Date.now(),
      }));
    } catch (e) {
      console.error("Erreur saveLastUser:", e);
    }
  };

  const login = async (email, password) => {
    const response = await api.post("/login", { email, password });
    const { token, user } = response.data;

    localStorage.setItem("token", token);
    setToken(token);
    setUser(user);

    // ✅ Sauvegarder le dernier user
    saveLastUser(user, email);

    return user;
  };

  const register = async (userData) => {
    const response = await api.post("/register", userData);
    const { token, user } = response.data;

    localStorage.setItem("token", token);
    setToken(token);
    setUser(user);

    // ✅ Sauvegarder le dernier user
    saveLastUser(user, userData.email);

    return user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    // ⚠️ On garde "last_user" pour le préremplir au prochain login
    api.post("/logout").catch(console.error);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  // ✅ Récupère le dernier utilisateur (pour le login)
  const getLastUser = () => {
    try {
      const stored = localStorage.getItem("last_user");
      if (!stored) return null;
      const data = JSON.parse(stored);
      // Expire après 30 jours
      if (Date.now() - data.timestamp > 30 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem("last_user");
        return null;
      }
      return data;
    } catch {
      return null;
    }
  };

  // ✅ Supprime le "dernier utilisateur" (pour "Utiliser un autre profil")
  const clearLastUser = () => {
    localStorage.removeItem("last_user");
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      getLastUser,
      clearLastUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);