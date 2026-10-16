import React, { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Loader2 } from "lucide-react";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthFromOAuth } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    // ✅ Empêcher le double traitement (React StrictMode)
    if (processed.current) return;
    processed.current = true;

    const error = searchParams.get("error");
    const data  = searchParams.get("data");

    // ❌ Erreur renvoyée par le backend
    if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true });
      return;
    }

    // ✅ Pas de data → redirige
    if (!data) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      // ✅ Décoder base64 → JSON
      const decoded = JSON.parse(decodeURIComponent(escape(atob(data))));
      const { token, user } = decoded;

      if (!token || !user) {
        throw new Error("Payload incomplet");
      }

      // ✅ Stocker le token + user
      setAuthFromOAuth(token, user);

      // ✅ Rediriger vers dashboard
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("OAuth callback error:", err);
      navigate("/login?error=" + encodeURIComponent("Erreur de décodage"), { replace: true });
    }
  }, [searchParams, navigate, setAuthFromOAuth]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B1F33]">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="animate-spin text-emerald-400" size={40} />
        <p className="text-sm text-slate-400">Connexion en cours…</p>
      </div>
    </div>
  );
}