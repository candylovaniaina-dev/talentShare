import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import RobotBuddy from "../../components/RobotBuddy";

const roles = [
  { value: "company", icon: Building2, title: "Entreprise", subtitle: "Mobiliser des compétences" },
  { value: "employee", icon: Users, title: "Talent / salarié", subtitle: "Partager mon expertise" },
  { value: "student", icon: GraduationCap, title: "Étudiant / diplômé", subtitle: "Lancer mon parcours" },
  { value: "university", icon: Sparkles, title: "Université", subtitle: "Connecter les filières" },
];

// Force du mot de passe (0 à 4)
const getStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
};
const STRENGTH_LABELS = ["Très faible", "Faible", "Moyen", "Bon", "Excellent"];
const STRENGTH_COLORS = ["bg-rose-500", "bg-rose-500", "bg-amber-400", "bg-emerald-300", "bg-emerald-400"];

const inputClass =
  "mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 transition focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";
const labelClass = "text-xs font-semibold uppercase tracking-wider text-slate-400";

export default function Register() {
  const [params] = useSearchParams();
  const [role, setRole] = useState(params.get("role") || "employee");
  const [form, setForm] = useState({ name: "", email: "", password: "", password_confirmation: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // États pour le robot
  const [focus, setFocus] = useState(null); // "name" | "email" | "password" | "confirm" | null
  const [robotError, setRobotError] = useState(false);
  const errorTimer = useRef(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => () => clearTimeout(errorTimer.current), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({ ...form, role });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Une erreur est survenue.");
      setRobotError(true);
      clearTimeout(errorTimer.current);
      errorTimer.current = setTimeout(() => setRobotError(false), 2200);
    } finally {
      setLoading(false);
    }
  };

  // Correspondance des mots de passe
  const confirmFilled = form.password_confirmation.length > 0;
  const isMatch = confirmFilled && form.password === form.password_confirmation;
  const isMismatch =
    confirmFilled && !isMatch && form.password_confirmation.length >= form.password.length;

  // Mode du robot
  let robotMode = "idle";
  if (loading) robotMode = "loading";
  else if (robotError) robotMode = "error";
  else if (focus === "password") robotMode = showPassword ? "look" : "closed";
  else if (focus === "confirm")
    robotMode = isMatch ? "match" : isMismatch ? "mismatch" : "confirm";
  else if (focus === "name" || focus === "email") robotMode = "look";
  else if (isMatch && form.password) robotMode = "match";

  const strength = getStrength(form.password);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A1229] text-white">
      {/* ===== Fond : glows + grille de points ===== */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -right-32 bottom-0 h-[420px] w-[420px] rounded-full bg-blue-500/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* ===== Lien retour ===== */}
      <Link
        to="/"
        className="absolute left-6 top-6 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 backdrop-blur-md transition hover:bg-white/10"
      >
        <ArrowLeft size={15} />
        Accueil
      </Link>

      <main className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-6 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:py-8">
        {/* ---------- Gauche : message + robot ---------- */}
        <section className="hidden lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
            Rejoindre l'écosystème
          </p>
          <h2 className="mt-3 text-4xl font-bold leading-[1.1] xl:text-5xl">
            Une place pour votre{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              prochain chapitre
            </span>{" "}
            professionnel.
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-slate-400">
            Choisissez le parcours qui vous correspond, puis enrichissez votre
            profil et réglez votre visibilité.
          </p>

          <div className="mt-6 flex justify-center">
            <RobotBuddy mode={robotMode} role={role} />
          </div>
        </section>

        {/* ---------- Droite : formulaire ---------- */}
        <section className="flex justify-center lg:justify-end">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Créer mon accès
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white">
              Bienvenue dans TalentShare.
            </h1>

            {/* Choix du rôle */}
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {roles.map(({ value, icon: Icon, title, subtitle }) => {
                const active = role === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                      active
                        ? "border-emerald-400/60 bg-emerald-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        active ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-slate-400"
                      }`}
                    >
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-white">{title}</span>
                      <span className="block truncate text-xs text-slate-400">{subtitle}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Nom + Email */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Nom ou raison sociale</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex. Sarah Andrianina"
                    autoComplete="off"
                    className={inputClass}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    onFocus={() => setFocus("name")}
                    onBlur={() => setFocus(null)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Adresse email</label>
                  <input
                    type="email"
                    required
                    placeholder="vous@exemple.com"
                    autoComplete="off"
                    className={inputClass}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    onFocus={() => setFocus("email")}
                    onBlur={() => setFocus(null)}
                  />
                </div>
              </div>

              {/* Mot de passe + Confirmation */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Mot de passe</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className={`${inputClass} pr-11`}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      onFocus={() => setFocus("password")}
                      onBlur={() => setFocus(null)}
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-slate-500 transition hover:text-white"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Confirmer</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className={`${inputClass} pr-11`}
                      value={form.password_confirmation}
                      onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                      onFocus={() => setFocus("confirm")}
                      onBlur={() => setFocus(null)}
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-slate-500 transition hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Force du mot de passe */}
              {form.password && (
                <div className="flex items-center gap-3">
                  <div className="flex flex-1 gap-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i <= strength ? STRENGTH_COLORS[strength] : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="w-20 text-right text-xs text-slate-400">
                    {STRENGTH_LABELS[strength]}
                  </span>
                </div>
              )}

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
                    Création en cours...
                  </>
                ) : (
                  <>
                    Créer mon compte <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-400">
              Déjà un compte ?{" "}
              <Link to="/login" className="font-semibold text-emerald-400 hover:text-emerald-300">
                Se connecter
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}