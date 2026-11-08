import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Building2, Users, GraduationCap, Sparkles, Eye, EyeOff, ArrowLeft, ArrowRight, X, Mail, UserRound, LockKeyhole, CheckCircle2, BriefcaseBusiness, ShieldCheck, Check, Layers,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const MINT_GRADIENT = "bg-gradient-to-br from-[#8DF0DC] to-[#5EDCC4]";

const roles = [
  { value: "company", icon: Building2, title: "Entreprise", subtitle: "Mobiliser des compétences" },
  { value: "employee", icon: Users, title: "Talent / salarié", subtitle: "Partager mon expertise" },
  { value: "student", icon: GraduationCap, title: "Étudiant / diplômé", subtitle: "Lancer mon parcours" },
  { value: "university", icon: Sparkles, title: "Université", subtitle: "Connecter les filières" },
];

const getStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
};

const STRENGTH_LABELS = ["Très faible", "Faible", "Moyen", "Bon", "Excellent"];
const STRENGTH_COLORS = ["bg-rose-500", "bg-rose-500", "bg-amber-400", "bg-[#5EDCC4]", "bg-[#2BC7AE]"];

const inputClass =
  "w-full rounded-lg border border-[color:var(--a-border)] bg-[color:var(--a-field)] py-2.5 pl-9 pr-3 text-xs text-[color:var(--a-ink)] outline-none transition placeholder:text-[color:var(--a-faint)] hover:border-[color:var(--a-accent-border)] focus:border-[color:var(--a-accent)] focus:ring-4 focus:ring-[color:var(--a-accent-soft)]";

const labelClass = "mb-1 block text-[11px] font-semibold text-[color:var(--a-ink)]";

const iconLeft =
  "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--a-faint)]";

const eyeBtn =
  "absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[color:var(--a-faint)] transition hover:bg-[color:var(--a-accent-soft)] hover:text-[color:var(--a-accent)]";

export default function Register() {
  const [params] = useSearchParams();

  const [role, setRole] = useState(() => {
    const requestedRole = params.get("role");
    return roles.some((item) => item.value === requestedRole) ? requestedRole : "employee";
  });

  const [form, setForm] = useState({ name: "", email: "", password: "", password_confirmation: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState(false);
  const errorTimer = useRef(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    return () => clearTimeout(errorTimer.current);
  }, []);

  const showTemporaryError = () => {
    setRegisterError(true);
    clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setRegisterError(false), 2200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError(null);

    if (form.password !== form.password_confirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      showTemporaryError();
      return;
    }

    setLoading(true);

    try {
      await register({ ...form, role });
      navigate("/dashboard");
    } catch (err) {
      const errors = err.response?.data?.errors;
      const firstValidationError = errors ? Object.values(errors).flat()[0] : null;
      setError(firstValidationError || err.response?.data?.message || "Impossible de créer le compte.");
      showTemporaryError();
    } finally {
      setLoading(false);
    }
  };

  const confirmFilled = form.password_confirmation.length > 0;
  const isMatch = confirmFilled && form.password === form.password_confirmation;
  const isMismatch = confirmFilled && form.password !== form.password_confirmation;

  const strength = getStrength(form.password);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <div
      className="ts-auth min-h-screen bg-[color:var(--a-page)] text-[color:var(--a-ink)]"
      style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        /* ---------- Palette claire ---------- */
        .ts-auth {
          --a-page: #F3F6FC;
          --a-panel: #FFFFFF;
          --a-field: #FFFFFF;
          --a-field-alt: #F5F8FD;
          --a-border: #DDE3F1;
          --a-ink: #0B1437;
          --a-muted: #5B6785;
          --a-faint: #8A94B0;
          --a-accent: #0E9F8E;
          --a-accent-strong: #0B7F72;
          --a-accent-soft: rgba(20,184,166,.12);
          --a-accent-border: rgba(14,159,142,.40);
        }
        /* ---------- Palette sombre (maquette) ---------- */
        .dark .ts-auth {
          --a-page: #0A1230;
          --a-panel: #0E1738;
          --a-field: #131E47;
          --a-field-alt: #172355;
          --a-border: rgba(255,255,255,.10);
          --a-ink: #FFFFFF;
          --a-muted: #A6B2D1;
          --a-faint: #7C89AD;
          --a-accent: #7BE9D3;
          --a-accent-strong: #A5F3E3;
          --a-accent-soft: rgba(123,233,211,.14);
          --a-accent-border: rgba(123,233,211,.45);
        }

        .ts-auth input:-webkit-autofill,
        .ts-auth input:-webkit-autofill:hover,
        .ts-auth input:-webkit-autofill:focus,
        .ts-auth input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px var(--a-field) inset !important;
          -webkit-text-fill-color: var(--a-ink) !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      <header className="relative z-10 border-b border-[color:var(--a-border)] bg-[color:var(--a-panel)] backdrop-blur-xl">
        <div className="mx-auto flex h-[56px] max-w-[1300px] items-center justify-between px-4 sm:px-6">
          <Link to="/" className="group flex items-center gap-2.5">
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${MINT_GRADIENT} text-[#0A1230] shadow-sm transition group-hover:scale-105`}>
              <Layers size={18} strokeWidth={2.2} />
            </span>
            <span>
              <span className="block text-[15px] font-bold tracking-tight text-[color:var(--a-ink)]">TalentShare</span>
              <span className="block text-[8px] font-semibold uppercase tracking-[0.2em] text-[color:var(--a-faint)]">Connecter les talents</span>
            </span>
          </Link>

          <Link to="/" className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-[color:var(--a-muted)] transition hover:bg-[color:var(--a-accent-soft)] hover:text-[color:var(--a-accent)]">
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Retour à l'accueil</span>
            <span className="sm:hidden">Accueil</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1300px] items-start gap-8 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-[1fr_1.1fr] lg:gap-12 lg:py-12">
        <section className="relative hidden min-h-[600px] overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-[#0A1230] via-[#0E1844] to-[#16256A] p-8 text-white lg:flex lg:flex-col xl:p-10">
          <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle, #CFFAF0 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          <div className="pointer-events-none absolute -right-20 top-12 h-56 w-56 rounded-full bg-[#5EDCC4]/20 blur-[70px]" />
          <div className="pointer-events-none absolute -left-24 bottom-0 h-56 w-56 rounded-full bg-indigo-500/25 blur-[80px]" />

          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7BE9D3]/25 bg-[#7BE9D3]/[0.08] px-2.5 py-1 text-[10px] font-medium text-[#7BE9D3]">
              <span className="h-1 w-1 rounded-full bg-[#7BE9D3]" />
              L’avenir du partage des compétences
            </span>
            <h1 className="mt-6 max-w-lg text-4xl font-extrabold leading-[1.12] tracking-[-0.04em] xl:text-[42px]">
              Les bonnes compétences.
              <span className="mt-2 block text-[#7BE9D3]">Au bon moment.</span>
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[#B7C2E0]">
              Rejoignez une communauté qui connecte les entreprises, les professionnels et les jeunes talents.
            </p>
          </div>

          <div className="relative z-10 mt-8 space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.09] bg-white/[0.045] p-3 transition hover:bg-white/[0.07]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7BE9D3]/10 text-[#7BE9D3]"><BriefcaseBusiness size={18} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white">Pour les entreprises</span>
                <span className="mt-0.5 block text-xs leading-4 text-[#9DAACB]">Trouvez les compétences.</span>
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.09] bg-white/[0.045] p-3 transition hover:bg-white/[0.07]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7BE9D3]/10 text-[#A5F3E3]"><Users size={18} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white">Pour les professionnels</span>
                <span className="mt-0.5 block text-xs leading-4 text-[#9DAACB]">Valorisez votre expérience.</span>
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.09] bg-white/[0.045] p-3 transition hover:bg-white/[0.07]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7BE9D3]/10 text-[#7BE9D3]"><GraduationCap size={18} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white">Pour les jeunes talents</span>
                <span className="mt-0.5 block text-xs leading-4 text-[#9DAACB]">Faites connaître vos projets.</span>
              </span>
            </div>
          </div>

          <div className="relative z-10 mt-auto flex items-center gap-3 border-t border-white/10 pt-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#7BE9D3]/20 bg-[#7BE9D3]/10 text-[#7BE9D3]"><ShieldCheck size={18} /></span>
            <span>
              <span className="block text-sm font-medium text-white">Un espace pensé pour vous</span>
              <span className="mt-0.5 block text-xs text-[#9DAACB]">Votre parcours commence ici.</span>
            </span>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[640px] lg:mx-0 lg:ml-auto">
          <div className="rounded-[24px] border border-[color:var(--a-border)] bg-[color:var(--a-panel)] p-6 shadow-[0_12px_40px_rgba(11,20,55,0.06)] dark:shadow-none sm:p-8 xl:p-10">
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--a-accent)]">
                <span className="h-1 w-1 rounded-full bg-[color:var(--a-accent)]" /> Créer mon accès
              </span>
              <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-[color:var(--a-ink)] sm:text-3xl">
                Bienvenue dans TalentShare
              </h2>
              <p className="mt-1.5 text-sm leading-5 text-[color:var(--a-muted)]">
                Créez votre compte et rejoignez notre écosystème.
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-xs font-semibold text-[color:var(--a-ink)]">Je rejoins en tant que</label>
                <span className="text-[10px] text-[color:var(--a-faint)]">Étape 1 sur 2</span>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {roles.map(({ value, icon: Icon, title, subtitle }) => {
                  const active = role === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRole(value)}
                      className={`group relative flex min-h-[68px] items-center gap-3 rounded-xl border p-3 text-left transition duration-200 ${
                        active
                          ? "border-[color:var(--a-accent)] bg-[color:var(--a-accent-soft)] shadow-sm"
                          : "border-[color:var(--a-border)] bg-[color:var(--a-field)] hover:border-[color:var(--a-accent-border)] hover:bg-[color:var(--a-field-alt)]"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                          active
                            ? "bg-[color:var(--a-accent-soft)] text-[color:var(--a-accent)]"
                            : "bg-[color:var(--a-field-alt)] text-[color:var(--a-muted)] group-hover:bg-[color:var(--a-accent-soft)] group-hover:text-[color:var(--a-accent)]"
                        }`}
                      >
                        <Icon size={18} strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-[color:var(--a-ink)]">{title}</span>
                        <span className="mt-0.5 block text-[10px] leading-3 text-[color:var(--a-muted)]">{subtitle}</span>
                      </span>
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition ${
                          active
                            ? `border-transparent ${MINT_GRADIENT} text-[#0A1230]`
                            : "border-[color:var(--a-border)] bg-transparent text-transparent"
                        }`}
                      >
                        {active && <Check size={10} strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="my-6 h-px bg-[color:var(--a-border)]" />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="register-name" className={labelClass}>Nom ou raison sociale</label>
                <div className="relative">
                  <UserRound size={16} className={iconLeft} />
                  <input id="register-name" type="text" required placeholder="Ex. Sarah Andrianina" className={inputClass} value={form.name} onChange={(e) => updateField("name", e.target.value)} />
                </div>
              </div>

              <div>
                <label htmlFor="register-email" className={labelClass}>Adresse e-mail</label>
                <div className="relative">
                  <Mail size={16} className={iconLeft} />
                  <input id="register-email" type="email" required placeholder="vous@exemple.com" className={inputClass} value={form.email} onChange={(e) => updateField("email", e.target.value)} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="register-password" className={labelClass}>Mot de passe</label>
                  <div className="relative">
                    <LockKeyhole size={16} className={iconLeft} />
                    <input id="register-password" type={showPassword ? "text" : "password"} required placeholder="8 car. min" className={`${inputClass} pr-9`} value={form.password} onChange={(e) => updateField("password", e.target.value)} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className={eyeBtn}>
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="register-password-confirmation" className={labelClass}>Confirmation</label>
                  <div className="relative">
                    <LockKeyhole size={16} className={iconLeft} />
                    <input
                      id="register-password-confirmation"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Répétez"
                      className={`${inputClass} pr-9 ${isMatch ? "!border-[#2BC7AE]" : isMismatch ? "!border-rose-400" : ""}`}
                      value={form.password_confirmation}
                      onChange={(e) => updateField("password_confirmation", e.target.value)}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className={eyeBtn}>
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {form.password && (
                <div className="rounded-lg bg-[color:var(--a-field-alt)] p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-1 gap-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <span key={step} className={`h-1.5 flex-1 rounded-full transition-colors ${step <= strength ? STRENGTH_COLORS[strength] : "bg-[color:var(--a-border)]"}`} />
                      ))}
                    </div>
                    <span className="min-w-[50px] text-right text-[10px] font-semibold text-[color:var(--a-muted)]">{STRENGTH_LABELS[strength]}</span>
                  </div>
                  {isMismatch && <p className="mt-1.5 text-[10px] text-rose-500">Ne correspondent pas.</p>}
                  {isMatch && (
                    <p className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-[color:var(--a-accent)]">
                      <CheckCircle2 size={12} /> Correspondent.
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
                  <X size={15} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                onClick={(e) => {
                  if (loading) e.preventDefault(); // Bloque les clics suivants
                }}
                className={`group flex w-full items-center justify-center gap-2 rounded-xl ${MINT_GRADIENT} px-4 py-3 text-sm font-bold text-[#0A1230] shadow-[0_8px_24px_-8px_rgba(94,220,196,0.55)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:opacity-60`}
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A1230] border-t-transparent" />
                    Création…
                  </>
                ) : (
                  <>
                    Créer mon compte <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
              <p className="text-center text-[10px] leading-4 text-[color:var(--a-faint)]">
                En créant votre compte, vous rejoignez l’écosystème TalentShare.
              </p>
            </form>

            <div className="my-5 h-px bg-[color:var(--a-border)]" />

            <p className="text-center text-xs text-[color:var(--a-muted)]">
              Déjà un compte ?{" "}
              <Link to="/login" className="font-semibold text-[color:var(--a-accent)] hover:text-[color:var(--a-accent-strong)]">
                Se connecter
              </Link>
            </p>
          </div>

          <p className="mt-4 text-center text-[10px] text-[color:var(--a-faint)]">
            © {new Date().getFullYear()} TalentShare · Share. Connect. Grow.
          </p>
        </section>
      </main>
    </div>
  );
}