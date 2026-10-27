import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Building2, Users, GraduationCap, Sparkles, Eye, EyeOff, ArrowLeft, ArrowRight, X, Mail, UserRound, LockKeyhole, CheckCircle2, BriefcaseBusiness, ShieldCheck, Check, Layers,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

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
const STRENGTH_COLORS = ["bg-rose-500", "bg-rose-500", "bg-amber-400", "bg-emerald-400", "bg-emerald-500"];

// ✅ CLASSE POUR ENLEVER LE PRÉREMPLISSAGE ET ADAPTER LE MODE SOMBRE
const inputClass = "w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs text-[#0B2229] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#10B981] focus:ring-4 focus:ring-[#10B981]/10 dark:border-white/10 dark:bg-[#0B1F33] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:bg-[#112A3A]";

const labelClass = "mb-1 block text-[11px] font-semibold text-[#203A40] dark:text-slate-300";

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
    <div className="min-h-screen bg-[#F2F7F5] text-[#0B2229] dark:bg-[#0B1F33] dark:text-slate-200">
      
      {/* ✅ CSS POUR ENLEVER LE PRÉREMPLISSAGE (AUTOFILL) DU NAVIGATEUR */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px white inset !important;
            -webkit-text-fill-color: #0B2229 !important;
            transition: background-color 5000s ease-in-out 0s;
        }
        .dark input:-webkit-autofill,
        .dark input:-webkit-autofill:hover, 
        .dark input:-webkit-autofill:focus, 
        .dark input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px #0B1F33 inset !important;
            -webkit-text-fill-color: #ffffff !important;
        }
      `}</style>

      <header className="relative z-10 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#112A3A]/90">
        <div className="mx-auto flex h-[56px] max-w-[1300px] items-center justify-between px-4 sm:px-6">
          <Link to="/" className="group flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-300 to-emerald-500 text-[#073C32] shadow-sm transition group-hover:scale-105">
              <Layers size={18} strokeWidth={2.2} />
            </span>
            <span>
              <span className="block text-[15px] font-bold tracking-tight text-[#0B2A30] dark:text-white">TalentShare</span>
              <span className="block text-[8px] font-semibold uppercase tracking-[0.2em] text-[#587078] dark:text-slate-400">Connecter les talents</span>
            </span>
          </Link>

          <Link to="/" className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-[#587078] transition hover:bg-[#F2F7F5] hover:text-[#0B2A30] dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white">
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Retour à l'accueil</span>
            <span className="sm:hidden">Accueil</span>
          </Link>
        </div>
      </header>

      {/* ✅ GRILLE AJUSTÉE (max-w-[1300px] et colonnes mieux réparties) */}
      <main className="mx-auto grid max-w-[1300px] items-start gap-8 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-[1fr_1.1fr] lg:gap-12 lg:py-12">
        
        <section className="relative hidden min-h-[600px] overflow-hidden rounded-[24px] bg-[#0B2A30] p-8 text-white lg:flex lg:flex-col dark:border dark:border-white/10 dark:bg-[#112A3A] xl:p-10">
          <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, #D1FAE5 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          <div className="pointer-events-none absolute -right-20 top-12 h-56 w-56 rounded-full bg-emerald-400/15 blur-[70px]" />
          
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-2.5 py-1 text-[10px] font-medium text-emerald-200">
              <span className="h-1 w-1 rounded-full bg-emerald-300" />
              L’avenir du partage des compétences
            </span>
            <h1 className="mt-6 max-w-lg text-4xl font-semibold leading-[1.12] tracking-tight xl:text-[42px]">
              Les bonnes compétences.
              <span className="mt-2 block text-emerald-300">Au bon moment.</span>
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
              Rejoignez une communauté qui connecte les entreprises, les professionnels et les jeunes talents.
            </p>
          </div>

          <div className="relative z-10 mt-8 space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.09] bg-white/[0.045] p-3 transition hover:bg-white/[0.07]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-300/10 text-emerald-300"><BriefcaseBusiness size={18} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white">Pour les entreprises</span>
                <span className="mt-0.5 block text-xs leading-4 text-slate-400">Trouvez les compétences.</span>
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.09] bg-white/[0.045] p-3 transition hover:bg-white/[0.07]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-300/10 text-teal-200"><Users size={18} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white">Pour les professionnels</span>
                <span className="mt-0.5 block text-xs leading-4 text-slate-400">Valorisez votre expérience.</span>
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.09] bg-white/[0.045] p-3 transition hover:bg-white/[0.07]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-300/10 text-sky-200"><GraduationCap size={18} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white">Pour les jeunes talents</span>
                <span className="mt-0.5 block text-xs leading-4 text-slate-400">Faites connaître vos projets.</span>
              </span>
            </div>
          </div>

          <div className="relative z-10 mt-auto flex items-center gap-3 border-t border-white/10 pt-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-300/10 text-emerald-300"><ShieldCheck size={18} /></span>
            <span>
              <span className="block text-sm font-medium text-white">Un espace pensé pour vous</span>
              <span className="mt-0.5 block text-xs text-slate-400">Votre parcours commence ici.</span>
            </span>
          </div>
        </section>

        {/* ✅ FORMULAIRE ÉLARGI (max-w-[640px]) */}
        <section className="mx-auto w-full max-w-[640px] lg:mx-0 lg:ml-auto">
          <div className="rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(11,42,48,0.05)] dark:border-white/10 dark:bg-[#112A3A] dark:shadow-none sm:p-8 xl:p-10">
            
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
                <span className="h-1 w-1 rounded-full bg-emerald-500" /> Créer mon accès
              </span>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0B2A30] dark:text-white sm:text-3xl">
                Bienvenue dans TalentShare
              </h2>
              <p className="mt-1.5 text-sm leading-5 text-[#587078] dark:text-slate-400">
                Créez votre compte et rejoignez notre écosystème.
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-xs font-semibold text-[#203A40] dark:text-slate-300">Je rejoins en tant que</label>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Étape 1 sur 2</span>
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
                          ? "border-[#10B981] bg-emerald-50/80 shadow-sm dark:border-emerald-500/50 dark:bg-emerald-500/10"
                          : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-[#FAFCFB] dark:border-white/10 dark:bg-[#0B1F33] dark:hover:border-emerald-500/30 dark:hover:bg-white/5"
                      }`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-[#F2F7F5] text-[#587078] group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:bg-white/10 dark:text-slate-400 dark:group-hover:bg-emerald-500/20 dark:group-hover:text-emerald-400"}`}>
                        <Icon size={18} strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-[#163239] dark:text-white">{title}</span>
                        <span className="mt-0.5 block text-[10px] leading-3 text-[#71858A] dark:text-slate-400">{subtitle}</span>
                      </span>
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition ${active ? "border-[#10B981] bg-[#10B981] text-white" : "border-slate-300 bg-white text-transparent dark:border-white/20 dark:bg-white/5"}`}>
                        {active && <Check size={10} strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="my-6 h-px bg-slate-100 dark:bg-white/10" />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="register-name" className={labelClass}>Nom ou raison sociale</label>
                <div className="relative">
                  <UserRound size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input id="register-name" type="text" required placeholder="Ex. Sarah Andrianina" className={inputClass} value={form.name} onChange={(e) => updateField("name", e.target.value)} />
                </div>
              </div>

              <div>
                <label htmlFor="register-email" className={labelClass}>Adresse e-mail</label>
                <div className="relative">
                  <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input id="register-email" type="email" required placeholder="vous@exemple.com" className={inputClass} value={form.email} onChange={(e) => updateField("email", e.target.value)} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="register-password" className={labelClass}>Mot de passe</label>
                  <div className="relative">
                    <LockKeyhole size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input id="register-password" type={showPassword ? "text" : "password"} required placeholder="8 car. min" className={`${inputClass} pr-9`} value={form.password} onChange={(e) => updateField("password", e.target.value)} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-emerald-400">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="register-password-confirmation" className={labelClass}>Confirmation</label>
                  <div className="relative">
                    <LockKeyhole size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input id="register-password-confirmation" type={showConfirmPassword ? "text" : "password"} required placeholder="Répétez" className={`${inputClass} pr-9 ${isMatch ? "border-emerald-400 dark:border-emerald-500" : isMismatch ? "border-rose-300 dark:border-rose-500" : ""}`} value={form.password_confirmation} onChange={(e) => updateField("password_confirmation", e.target.value)} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-emerald-400">
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {form.password && (
                <div className="rounded-lg bg-[#F7FAF8] p-3 dark:bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-1 gap-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <span key={step} className={`h-1.5 flex-1 rounded-full transition-colors ${step <= strength ? STRENGTH_COLORS[strength] : "bg-slate-200 dark:bg-white/10"}`} />
                      ))}
                    </div>
                    <span className="min-w-[50px] text-right text-[10px] font-semibold text-[#587078] dark:text-slate-400">{STRENGTH_LABELS[strength]}</span>
                  </div>
                  {isMismatch && <p className="mt-1.5 text-[10px] text-rose-600 dark:text-rose-400">Ne correspondent pas.</p>}
                  {isMatch && <p className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400"><CheckCircle2 size={12} /> Correspondent.</p>}
                </div>
              )}

              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
                  <X size={15} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#10B981] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0D9668] disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500">
                {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Création…</> : <>Créer mon compte <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></>}
              </button>

              <p className="text-center text-[10px] leading-4 text-slate-500 dark:text-slate-500">
                En créant votre compte, vous rejoignez l’écosystème TalentShare.
              </p>
            </form>

            <div className="my-5 h-px bg-slate-100 dark:bg-white/10" />

            <p className="text-center text-xs text-[#587078] dark:text-slate-400">
              Déjà un compte ? <Link to="/login" className="font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300">Se connecter</Link>
            </p>
          </div>
          
          <p className="mt-4 text-center text-[10px] text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} TalentShare · Share. Connect. Grow.
          </p>
        </section>
      </main>
    </div>
  );
}