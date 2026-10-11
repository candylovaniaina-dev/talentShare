import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, ArrowLeft, X, RotateCcw, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import RobotMascot from "../../components/RobotMascot";

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

  const handleSwitchUser = () => {
    clearLastUser();
    setLastUser(null);
    setShowFullForm(true);
    setForm({ email: "", password: "" });
    setFocusField("email");
  };

  const handleBackToQuickLogin = () => {
    if (lastUser) {
      setShowFullForm(false);
      setForm({ email: lastUser.email, password: "" });
    }
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
    "w-full rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-2)] px-4 py-3.5 pr-12 text-sm text-[var(--text-app)] placeholder:text-[var(--text-faint)] transition focus:border-mint/50 focus:outline-none focus:ring-2 focus:ring-mint/20";

  const renderQuickLogin = () => (
    <div className="flex flex-col items-center">
      {lastUser.avatar_path ? (
        <img
          src={`http://localhost:8000/storage/${lastUser.avatar_path}`}
          alt={lastUser.name}
          className="h-20 w-20 rounded-2xl border-2 border-mint/40 object-cover shadow-lg"
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-navy-800 text-3xl font-bold text-white shadow-lg">
          {lastUser.name?.charAt(0)?.toUpperCase()}
        </div>
      )}

      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-mint">Bon retour</p>
      <h2 className="mt-2 text-xl font-bold text-[var(--text-app)]">{lastUser.name}</h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{lastUser.email}</p>

      <form onSubmit={handleSubmit} className="mt-6 w-full space-y-3">
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            autoFocus
            className={inputClass}
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
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] transition hover:text-[var(--text-app)]"
          >
            {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-50 dark:bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-400">
            <X size={16} strokeWidth={1.75} /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-mint py-3.5 text-sm font-bold text-navy-900 transition-all hover:bg-mint-light disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy-900 border-t-transparent" />
              Connexion...
            </>
          ) : (
            <>
              Se connecter <ArrowRight size={16} strokeWidth={1.75} />
            </>
          )}
        </button>
      </form>

      <Link to="/forgot-password" className="mt-3 text-xs font-semibold text-mint hover:text-mint-light">
        Mot de passe oublié ?
      </Link>

      <button
        onClick={handleSwitchUser}
        className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] transition hover:text-[var(--text-app)]"
      >
        <RotateCcw size={12} strokeWidth={1.75} /> Ce n'est pas vous ?
      </button>

      <div className="mt-5 w-full border-t border-[var(--border-app)] pt-5">
        <Link
          to="/register"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-mint/20 bg-mint/5 py-3 text-sm font-semibold text-mint transition hover:bg-mint/10"
        >
          Créer un nouveau compte
        </Link>
      </div>
    </div>
  );

  const renderFullForm = () => (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mint">Connexion</p>
      <h1 className="mt-3 text-2xl font-bold leading-tight text-[var(--text-app)]">Content de vous revoir.</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">Retrouvez vos profils, missions et opportunités.</p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-5">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            className="mt-2 w-full rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-2)] px-4 py-3.5 text-sm text-[var(--text-app)] placeholder:text-[var(--text-faint)] transition focus:border-mint/50 focus:outline-none focus:ring-2 focus:ring-mint/20"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            onFocus={() => setFocusField("email")}
            onBlur={() => setFocusField(null)}
            placeholder="vous@exemple.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Mot de passe</label>
            <Link to="/forgot-password" className="text-xs font-semibold text-mint hover:text-mint-light">
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative mt-2">
            <input
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-2)] px-4 py-3.5 pr-12 text-sm text-[var(--text-app)] placeholder:text-[var(--text-faint)] transition focus:border-mint/50 focus:outline-none focus:ring-2 focus:ring-mint/20"
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
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] transition hover:text-[var(--text-app)]"
            >
              {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-50 dark:bg-rose-500/10 p-3.5 text-sm text-rose-600 dark:text-rose-400">
            <X size={16} strokeWidth={1.75} /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-mint py-3.5 text-sm font-bold text-navy-900 transition-all hover:bg-mint-light disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy-900 border-t-transparent" />
              Connexion...
            </>
          ) : (
            <>
              Se connecter <ArrowRight size={16} strokeWidth={1.75} />
            </>
          )}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-[var(--text-muted)]">
        Pas encore de compte ?{" "}
        <Link to="/register" className="font-semibold text-mint hover:text-mint-light">S'inscrire</Link>
      </p>

      {lastUser && (
        <button
          onClick={handleBackToQuickLogin}
          className="mt-5 flex w-full items-center justify-center gap-1.5 text-xs text-[var(--text-faint)] transition hover:text-[var(--text-muted)]"
        >
          <ArrowLeft size={12} strokeWidth={1.75} /> Revenir à {lastUser.name}
        </button>
      )}
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-app)]">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-mint/10 blur-[120px]" />
        <div className="absolute -right-32 bottom-0 h-[420px] w-[420px] rounded-full bg-navy-500/15 blur-[120px]" />
      </div>

      <Link
        to="/"
        className="absolute left-6 top-6 z-20 flex items-center gap-2 rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)] px-4 py-2 text-sm font-semibold text-[var(--text-app)] backdrop-blur-md transition hover:bg-[var(--bg-surface-hover)]"
      >
        <ArrowLeft size={15} strokeWidth={1.75} /> Accueil
      </Link>

      <main className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-8">
        {/* Left panel — branding */}
        <section className="hidden lg:flex lg:flex-col lg:justify-center">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-800 shadow-lg">
              <Sparkles size={24} strokeWidth={2} className="text-mint" />
            </span>
            <span className="text-2xl font-bold text-[var(--text-app)]">
              Talent<span className="text-mint">Share</span>
            </span>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-mint">Accéder à votre espace</p>
          <h2 className="mt-3 text-4xl font-bold leading-[1.1] xl:text-5xl text-[var(--text-app)]">
            Les bonnes compétences<br />
            <span className="text-mint">sont déjà là.</span>
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--text-muted)]">
            Connectez-vous pour découvrir des profils vérifiés et lancer votre prochaine collaboration.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: ShieldCheck, text: "Profils et organisations vérifiables" },
              { icon: Zap, text: "Matching fondé sur des critères lisibles" },
              { icon: Sparkles, text: "Une plateforme pour entreprises, talents et universités" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint/10 text-mint">
                  <item.icon size={16} strokeWidth={1.5} />
                </span>
                {item.text}
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <RobotMascot mode={robotMode} />
          </div>
        </section>

        {/* Right panel — form card */}
        <section className="flex justify-center lg:justify-end">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-8 shadow-pop backdrop-blur-xl sm:p-10">
            {lastUser && !showFullForm ? renderQuickLogin() : renderFullForm()}
          </div>
        </section>
      </main>
    </div>
  );
}
