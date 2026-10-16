import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  X,
  RotateCcw,
  Mail,
  LockKeyhole,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import RobotMascot from "../../components/RobotMascot";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lastUser, setLastUser] = useState(null);
  const [showFullForm, setShowFullForm] = useState(false);
  const [focusField, setFocusField] = useState(null);
  const [robotError, setRobotError] = useState(false);
  const errorTimer = useRef(null);

  const { login, getLastUser, clearLastUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const stored = getLastUser();

    if (stored) {
      setLastUser(stored);
      setForm({ email: stored.email || "", password: "" });
    } else {
      setShowFullForm(true);
    }

    return () => clearTimeout(errorTimer.current);
  }, [getLastUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setRobotError(false);
    setLoading(true);

    try {
      await login(form.email.trim(), form.password);
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

  const handleSwitchUser = () => {
    clearLastUser();
    setLastUser(null);
    setShowFullForm(true);
    setForm({ email: "", password: "" });
    setError(null);
    setFocusField("email");
  };

  const handleBackToQuickLogin = () => {
    if (!lastUser) return;

    setShowFullForm(false);
    setForm({ email: lastUser.email || "", password: "" });
    setError(null);
  };

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

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-[#0B1F33]/70 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10";

  const renderError = () =>
    error ? (
      <div
        role="alert"
        className="flex items-start gap-2.5 rounded-2xl border border-rose-400/20 bg-rose-400/[0.08] p-3.5 text-sm leading-5 text-rose-200"
      >
        <X size={17} className="mt-0.5 shrink-0 text-rose-300" />
        <span>{error}</span>
      </div>
    ) : null;

  const renderPasswordInput = () => (
    <div className="relative">
      <LockKeyhole
        size={17}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
      />
      <input
        id="login-password"
        type={showPassword ? "text" : "password"}
        required
        autoComplete="current-password"
        value={form.password}
        onChange={(e) =>
          setForm((current) => ({ ...current, password: e.target.value }))
        }
        onFocus={() => setFocusField("password")}
        onBlur={() => setFocusField(null)}
        placeholder="Votre mot de passe"
        className={`${inputClass} pl-11 pr-12`}
      />
      <button
        type="button"
        aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={showPassword}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setShowPassword((value) => !value)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );

  const renderSubmitButton = () => (
    <button
      type="submit"
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 py-3.5 text-sm font-bold text-[#0B1F33] shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-200 focus:outline-none focus:ring-4 focus:ring-emerald-300/20 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0B1F33] border-t-transparent" />
          Connexion en cours…
        </>
      ) : (
        <>
          Se connecter <ArrowRight size={17} />
        </>
      )}
    </button>
  );

  // ✅ BLOC BOUTONS OAUTH
  const renderSocialLogin = () => (
    <>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#111B35] px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Ou continuer avec
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <SocialButton
          provider="google"
          label="Google"
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/>
            </svg>
          }
        />
        <SocialButton
          provider="linkedin-openid"
          label="LinkedIn"
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <path fill="#0A66C2" d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/>
            </svg>
          }
        />
        <SocialButton
          provider="facebook"
          label="Facebook"
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/>
            </svg>
          }
        />
      </div>
    </>
  );

  const renderQuickLogin = () => (
    <div className="flex flex-col items-center">
      {lastUser.avatar_path ? (
        <img
          src={`/storage/${lastUser.avatar_path}`}
          alt={lastUser.name || "Avatar"}
          className="h-24 w-24 rounded-full border-2 border-emerald-300/50 object-cover shadow-xl shadow-emerald-950/30 sm:h-28 sm:w-28"
        />
      ) : (
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-teal-600 text-3xl font-bold text-[#0B1F33] shadow-xl shadow-emerald-950/30 sm:h-28 sm:w-28 sm:text-4xl">
          {lastUser.name?.charAt(0)?.toUpperCase() || "T"}
        </div>
      )}

      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
        Bon retour
      </p>
      <h1 className="mt-2 max-w-full break-words text-center text-2xl font-bold text-white">
        {lastUser.name}
      </h1>
      <p className="mt-1 max-w-full break-all text-sm text-slate-400">
        {lastUser.email}
      </p>

      <form onSubmit={handleSubmit} className="mt-7 w-full space-y-4">
        <div>
          <label
            htmlFor="login-password"
            className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            Mot de passe
          </label>
          {renderPasswordInput()}
        </div>

        {renderError()}
        {renderSubmitButton()}
      </form>

      {/* ✅ OAuth aussi en mode "quick login" */}
      {renderSocialLogin()}

      <Link
        to="/forgot-password"
        className="mt-4 text-sm font-medium text-emerald-300 transition hover:text-emerald-200"
      >
        Mot de passe oublié ?
      </Link>

      <button
        type="button"
        onClick={handleSwitchUser}
        className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-slate-400 transition hover:text-white"
      >
        <RotateCcw size={14} />
        Ce n'est pas vous ?
      </button>

      <div className="mt-6 w-full border-t border-white/[0.08] pt-6">
        <Link
          to="/register"
          className="flex w-full items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] px-4 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-300/[0.12]"
        >
          Créer un nouveau compte
        </Link>
      </div>
    </div>
  );

  const renderFullForm = () => (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
        Espace personnel
      </p>
      <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-white">
        Content de vous revoir.
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        Retrouvez vos profils, vos missions et vos prochaines opportunités.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label
            htmlFor="login-email"
            className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            Adresse e-mail
          </label>
          <div className="relative">
            <Mail
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) =>
                setForm((current) => ({ ...current, email: e.target.value }))
              }
              onFocus={() => setFocusField("email")}
              onBlur={() => setFocusField(null)}
              placeholder="vous@exemple.com"
              className={`${inputClass} pl-11`}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              htmlFor="login-password"
              className="text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              Mot de passe
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-emerald-300 transition hover:text-emerald-200"
            >
              Oublié ?
            </Link>
          </div>
          {renderPasswordInput()}
        </div>

        {renderError()}
        {renderSubmitButton()}
      </form>

      {/* ✅ BLOC OAUTH */}
      {renderSocialLogin()}

      <p className="mt-7 text-center text-sm text-slate-400">
        Pas encore de compte ?{" "}
        <Link
          to="/register"
          className="font-semibold text-emerald-300 transition hover:text-emerald-200"
        >
          S'inscrire
        </Link>
      </p>

      {lastUser && (
        <button
          type="button"
          onClick={handleBackToQuickLogin}
          className="mt-5 flex w-full items-center justify-center gap-2 text-xs text-slate-500 transition hover:text-slate-300"
        >
          <ArrowLeft size={14} />
          Revenir au profil de {lastUser.name}
        </button>
      )}
    </>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B1F33] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-10 h-[420px] w-[420px] rounded-full bg-emerald-400/10 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-[420px] w-[420px] rounded-full bg-blue-500/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <Link
        to="/"
        className="absolute left-4 top-5 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 backdrop-blur transition hover:bg-white/[0.08] hover:text-white sm:left-6 sm:top-6"
      >
        <ArrowLeft size={16} />
        Accueil
      </Link>

      <main className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 pb-10 pt-24 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-12">
        <section className="hidden lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
            Accéder à votre espace
          </p>
          <h2 className="mt-4 text-4xl font-bold leading-[1.12] xl:text-5xl">
            Les bonnes compétences
            <br />
            <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
              sont déjà là.
            </span>
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-400">
            Connectez-vous pour découvrir des profils, développer votre réseau
            et lancer votre prochaine collaboration.
          </p>
          <div className="mt-4 flex justify-center">
            <RobotMascot mode={robotMode} />
          </div>
        </section>

        <section className="flex justify-center lg:justify-end">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111B35]/80 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-9">
            {lastUser && !showFullForm
              ? renderQuickLogin()
              : renderFullForm()}
          </div>
        </section>
      </main>
    </div>
  );
}

/* ============================================================
   BOUTON OAUTH SOCIAL
============================================================ */
function SocialButton({ provider, label, icon }) {
  const handleClick = () => {
    // ✅ Redirige vers le backend qui redirige vers le provider
    window.location.href = `${API_URL}/auth/${provider}/redirect`;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 transition hover:border-emerald-400/40 hover:bg-white/[0.08]"
      title={`Continuer avec ${label}`}
    >
      {icon}
      <span className="text-[10px] font-semibold text-slate-300">{label}</span>
    </button>
  );
}