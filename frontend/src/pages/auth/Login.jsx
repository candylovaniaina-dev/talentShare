import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, ArrowLeft, X, RotateCcw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import RobotMascot from "../../components/RobotMascot";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lastUser, setLastUser] = useState(null);
  const [showFullForm, setShowFullForm] = useState(false);

  // États pour le robot
  const [focusField, setFocusField] = useState(null); // "email" | "password" | null
  const [robotError, setRobotError] = useState(false);
  const errorTimer = useRef(null);

  const { login, getLastUser, clearLastUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const stored = getLastUser();
    if (stored) {
      setLastUser(stored);
      setForm({ email: stored.email, password: "" });
    } else {
      setShowFullForm(true);
    }
    return () => clearTimeout(errorTimer.current);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Identifiants incorrects.");
      setRobotError(true);
      clearTimeout(errorTimer.current);
      errorTimer.current = setTimeout(() => setRobotError(false), 2200);
    } finally {
      setLoading(false);
    }
  };

  // ✅ "Ce n'est pas vous ?" → supprime le user mémorisé
  const handleSwitchUser = () => {
    clearLastUser();
    setLastUser(null);
    setShowFullForm(true);
    setForm({ email: "", password: "" });
    setFocusField("email");
  };

  // ✅ "Bon retour" → clique sur le nom = revenir à la carte
  const handleBackToQuickLogin = () => {
    if (lastUser) {
      setShowFullForm(false);
      setForm({ email: lastUser.email, password: "" });
    }
  };

  // Mode du robot selon ce que fait l'utilisateur
  const robotMode = loading
    ? "loading"
    : robotError
    ? "error"
    : focusField === "password"
    ? showPassword
      ? "peek"
      : "hide"
    : focusField === "email"
    ? "email"
    : "idle";

  // ============================================
  // VUE : Profil récent (avec champ mot de passe)
  // ============================================
  const renderQuickLogin = () => (
    <div className="flex flex-col items-center">
      {/* Avatar */}
      {lastUser.avatar_path ? (
        <img
          src={`http://localhost:8000/storage/${lastUser.avatar_path}`}
          alt={lastUser.name}
          className="h-28 w-28 rounded-full border-2 border-emerald-400/50 object-cover shadow-2xl shadow-emerald-500/20"
        />
      ) : (
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-4xl font-bold text-white shadow-2xl shadow-emerald-500/30">
          {lastUser.name?.charAt(0)?.toUpperCase()}
        </div>
      )}

      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
        Bon retour
      </p>
      <h2 className="mt-2 text-2xl font-bold text-white">{lastUser.name}</h2>
      <p className="mt-1 text-sm text-slate-400">{lastUser.email}</p>

      {/* ✅ Champ mot de passe directement sur la carte */}
      <form onSubmit={handleSubmit} className="mt-6 w-full space-y-3">
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            autoFocus
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 pr-12 text-sm text-white placeholder:text-slate-600 transition focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            onFocus={() => setFocusField("password")}
            onBlur={() => setFocusField(null)}
            placeholder="Mot de passe"
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
            <X size={16} /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-bold text-[#0A1229] transition-all hover:scale-[1.02] hover:bg-emerald-400 disabled:opacity-60 disabled:hover:scale-100"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A1229] border-t-transparent" />
              Connexion...
            </>
          ) : (
            <>
              Se connecter <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* ✅ Mot de passe oublié */}
      <Link
        to="/forgot-password"
        className="mt-3 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
      >
        Mot de passe oublié ?
      </Link>

      {/* ✅ Ce n'est pas vous ? */}
      <button
        onClick={handleSwitchUser}
        className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-white"
      >
        <RotateCcw size={12} /> Ce n'est pas vous ?
      </button>

      {/* Créer un compte */}
      <div className="mt-6 w-full border-t border-white/5 pt-6">
        <Link
          to="/register"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 py-3 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/10"
        >
          Créer un nouveau compte
        </Link>
      </div>
    </div>
  );

  // ============================================
  // VUE : Formulaire complet (email + password)
  // ============================================
  const renderFullForm = () => (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
        Connexion
      </p>
      <h1 className="mt-3 text-3xl font-bold leading-tight text-white">
        Content de vous revoir.
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        Retrouvez vos profils, missions et opportunités.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {/* Email */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Email
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-slate-600 transition focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            onFocus={() => setFocusField("email")}
            onBlur={() => setFocusField(null)}
            placeholder="vous@exemple.com"
          />
        </div>

        {/* Mot de passe */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Mot de passe
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative mt-2">
            <input
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 pr-12 text-sm text-white placeholder:text-slate-600 transition focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onFocus={() => setFocusField("password")}
              onBlur={() => setFocusField(null)}
              placeholder="••••••••"
            />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-300">
            <X size={16} /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-bold text-[#0A1229] transition-all hover:scale-[1.01] hover:bg-emerald-400 disabled:opacity-60 disabled:hover:scale-100"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A1229] border-t-transparent" />
              Connexion...
            </>
          ) : (
            <>
              Se connecter <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-400">
        Pas encore de compte ?{" "}
        <Link
          to="/register"
          className="font-semibold text-emerald-400 hover:text-emerald-300"
        >
          S'inscrire
        </Link>
      </p>

      {/* ✅ Retour à la carte utilisateur */}
      {lastUser && (
        <button
          onClick={handleBackToQuickLogin}
          className="mt-6 flex w-full items-center justify-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-300"
        >
          <ArrowLeft size={12} /> Revenir à {lastUser.name}
        </button>
      )}
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A1229] text-white">
      {/* ===== Fond : glows + grille de points ===== */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -right-32 bottom-0 h-[420px] w-[420px] rounded-full bg-blue-500/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* ===== Petit lien retour (discret) ===== */}
      <Link
        to="/"
        className="absolute left-6 top-6 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 backdrop-blur-md transition hover:bg-white/10"
      >
        <ArrowLeft size={15} />
        Accueil
      </Link>

      {/* ===== Contenu (centré verticalement, tient dans l'écran) ===== */}
      <main className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-8">
        {/* ---------- Gauche : message + robot ---------- */}
        <section className="hidden lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
            Accéder à votre espace
          </p>
          <h2 className="mt-3 text-4xl font-bold leading-[1.1] xl:text-5xl">
            Les bonnes compétences
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              sont déjà là.
            </span>
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-slate-400">
            Connectez-vous pour découvrir des profils vérifiés et lancer votre
            prochaine collaboration.
          </p>

          {/* Robot */}
          <div className="mt-6 flex justify-center">
            <RobotMascot mode={robotMode} />
          </div>
        </section>

        {/* ---------- Droite : carte de connexion ---------- */}
        <section className="flex justify-center lg:justify-end">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-10">
            {lastUser && !showFullForm ? renderQuickLogin() : renderFullForm()}
          </div>
        </section>
      </main>
    </div>
  );
}