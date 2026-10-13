import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Building2,
  Users,
  GraduationCap,
  Sparkles,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  X,
  Mail,
  UserRound,
  LockKeyhole,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import RobotBuddy from "../../components/RobotBuddy";

const roles = [
  {
    value: "company",
    icon: Building2,
    title: "Entreprise",
    subtitle: "Mobiliser des compétences",
  },
  {
    value: "employee",
    icon: Users,
    title: "Talent / salarié",
    subtitle: "Partager mon expertise",
  },
  {
    value: "student",
    icon: GraduationCap,
    title: "Étudiant / diplômé",
    subtitle: "Lancer mon parcours",
  },
  {
    value: "university",
    icon: Sparkles,
    title: "Université",
    subtitle: "Connecter les filières",
  },
];

const getStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
};

const STRENGTH_LABELS = [
  "Très faible",
  "Faible",
  "Moyen",
  "Bon",
  "Excellent",
];

const STRENGTH_COLORS = [
  "bg-rose-500",
  "bg-rose-500",
  "bg-amber-400",
  "bg-emerald-300",
  "bg-emerald-400",
];

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-[#0A1229]/70 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10";

const labelClass =
  "mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300";

export default function Register() {
  const [params] = useSearchParams();
  const [role, setRole] = useState(() => {
    const requestedRole = params.get("role");
    return roles.some((item) => item.value === requestedRole)
      ? requestedRole
      : "employee";
  });

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focus, setFocus] = useState(null);
  const [robotError, setRobotError] = useState(false);
  const errorTimer = useRef(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    return () => clearTimeout(errorTimer.current);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError(null);

    if (form.password !== form.password_confirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      setRobotError(true);
      clearTimeout(errorTimer.current);
      errorTimer.current = setTimeout(() => setRobotError(false), 2200);
      return;
    }

    setLoading(true);

    try {
      await register({ ...form, role });
      navigate("/dashboard");
    } catch (err) {
      const errors = err.response?.data?.errors;
      const firstValidationError = errors
        ? Object.values(errors).flat()[0]
        : null;

      setError(
        firstValidationError ||
          err.response?.data?.message ||
          "Impossible de créer le compte. Vérifiez les informations."
      );

      setRobotError(true);
      clearTimeout(errorTimer.current);
      errorTimer.current = setTimeout(() => setRobotError(false), 2200);
    } finally {
      setLoading(false);
    }
  };

  const confirmFilled = form.password_confirmation.length > 0;
  const isMatch =
    confirmFilled && form.password === form.password_confirmation;
  const isMismatch =
    confirmFilled && form.password !== form.password_confirmation;

  let robotMode = "idle";

  if (loading) robotMode = "loading";
  else if (robotError) robotMode = "error";
  else if (focus === "password") {
    robotMode = showPassword ? "look" : "closed";
  } else if (focus === "confirm") {
    robotMode = isMatch ? "match" : isMismatch ? "mismatch" : "confirm";
  } else if (focus === "name" || focus === "email") {
    robotMode = "look";
  } else if (isMatch && form.password) {
    robotMode = "match";
  }

  const strength = getStrength(form.password);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A1229] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-10 h-[420px] w-[420px] rounded-full bg-emerald-400/10 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-[420px] w-[420px] rounded-full bg-blue-500/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
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

      <main className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 pb-10 pt-24 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:py-12">
        <section className="hidden lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
            Rejoindre l'écosystème
          </p>
          <h2 className="mt-4 text-4xl font-bold leading-[1.12] xl:text-5xl">
            Une place pour votre{" "}
            <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
              prochain chapitre
            </span>{" "}
            professionnel.
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-400">
            Choisissez le parcours qui vous correspond, créez votre compte et
            commencez à développer vos opportunités.
          </p>
          <div className="mt-4 flex justify-center">
            <RobotBuddy mode={robotMode} role={role} />
          </div>
        </section>

        <section className="flex justify-center lg:justify-end">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#111B35]/80 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
              Créer mon accès
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Bienvenue dans TalentShare.
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Commencez par choisir le type de compte qui vous correspond.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {roles.map(({ value, icon: Icon, title, subtitle }) => {
                const active = role === value;

                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setRole(value)}
                    className={`flex min-w-0 items-center gap-3 rounded-2xl border p-3.5 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-300/40 ${
                      active
                        ? "border-emerald-300/50 bg-emerald-300/[0.08] shadow-lg shadow-emerald-950/10"
                        : "border-white/[0.08] bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        active
                          ? "bg-emerald-300/15 text-emerald-200"
                          : "bg-white/[0.05] text-slate-400"
                      }`}
                    >
                      <Icon size={19} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">
                        {title}
                      </span>
                      <span className="mt-0.5 block text-xs leading-4 text-slate-400">
                        {subtitle}
                      </span>
                    </span>
                    {active && (
                      <CheckCircle2
                        size={16}
                        className="shrink-0 text-emerald-300"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label htmlFor="register-name" className={labelClass}>
                  Nom ou raison sociale
                </label>
                <div className="relative">
                  <UserRound
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    id="register-name"
                    type="text"
                    required
                    maxLength={255}
                    autoComplete="name"
                    placeholder="Ex. Sarah Andrianina"
                    className={`${inputClass} pl-11`}
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    onFocus={() => setFocus("name")}
                    onBlur={() => setFocus(null)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="register-email" className={labelClass}>
                  Adresse e-mail
                </label>
                <div className="relative">
                  <Mail
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    id="register-email"
                    type="email"
                    required
                    maxLength={255}
                    autoComplete="email"
                    placeholder="vous@exemple.com"
                    className={`${inputClass} pl-11`}
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    onFocus={() => setFocus("email")}
                    onBlur={() => setFocus(null)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="register-password" className={labelClass}>
                    Mot de passe
                  </label>
                  <div className="relative">
                    <LockKeyhole
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      placeholder="8 caractères minimum"
                      className={`${inputClass} pl-11 pr-11`}
                      value={form.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      onFocus={() => setFocus("password")}
                      onBlur={() => setFocus(null)}
                    />
                    <button
                      type="button"
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:text-emerald-300"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="register-password-confirmation"
                    className={labelClass}
                  >
                    Confirmation
                  </label>
                  <div className="relative">
                    <LockKeyhole
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      id="register-password-confirmation"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      placeholder="Répétez le mot de passe"
                      className={`${inputClass} pl-11 pr-11 ${
                        isMatch
                          ? "border-emerald-400/40"
                          : isMismatch
                            ? "border-rose-400/40"
                            : ""
                      }`}
                      value={form.password_confirmation}
                      onChange={(e) =>
                        updateField("password_confirmation", e.target.value)
                      }
                      onFocus={() => setFocus("confirm")}
                      onBlur={() => setFocus(null)}
                    />
                    <button
                      type="button"
                      aria-label={
                        showConfirmPassword
                          ? "Masquer la confirmation"
                          : "Afficher la confirmation"
                      }
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() =>
                        setShowConfirmPassword((value) => !value)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:text-emerald-300"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {form.password && (
                <div>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex flex-1 gap-1.5"
                      aria-label={`Force du mot de passe : ${STRENGTH_LABELS[strength]}`}
                    >
                      {[1, 2, 3, 4].map((step) => (
                        <span
                          key={step}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            step <= strength
                              ? STRENGTH_COLORS[strength]
                              : "bg-white/10"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="min-w-20 text-right text-xs text-slate-400">
                      {STRENGTH_LABELS[strength]}
                    </span>
                  </div>
                  {isMismatch && (
                    <p className="mt-2 text-xs text-rose-300">
                      Les mots de passe ne correspondent pas encore.
                    </p>
                  )}
                  {isMatch && (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-300">
                      <CheckCircle2 size={14} />
                      Les mots de passe correspondent.
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-2xl border border-rose-400/20 bg-rose-400/[0.08] p-3.5 text-sm leading-5 text-rose-200"
                >
                  <X size={17} className="mt-0.5 shrink-0 text-rose-300" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 py-3.5 text-sm font-bold text-[#0A1229] shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-200 focus:outline-none focus:ring-4 focus:ring-emerald-300/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A1229] border-t-transparent" />
                    Création en cours…
                  </>
                ) : (
                  <>
                    Créer mon compte <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Déjà un compte ?{" "}
              <Link
                to="/login"
                className="font-semibold text-emerald-300 transition hover:text-emerald-200"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}