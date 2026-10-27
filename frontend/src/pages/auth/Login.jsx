import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  Fingerprint,
  GraduationCap,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  LoaderCircle,
  RotateCcw,
  Layers,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export default function Login() {
  const navigate = useNavigate();
  const { login, getLastUser, clearLastUser } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [lastUser, setLastUser] = useState(null);
  const [showFullForm, setShowFullForm] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusField, setFocusField] = useState("");
  const [transition, setTransition] = useState(false);
  const [welcome, setWelcome] = useState(false);

  const transitionTimer = useRef(null);
  const welcomeTimer = useRef(null);

  useEffect(() => {
    const user = getLastUser();
    if (user?.email) {
      setLastUser(user);
      setForm((previous) => ({ ...previous, email: user.email }));
      setShowFullForm(false);
    }
  }, [getLastUser]);

  useEffect(() => {
    return () => {
      clearTimeout(transitionTimer.current);
      clearTimeout(welcomeTimer.current);
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    if (error) setError("");
  };

  const handleSwitchUser = () => {
    clearLastUser();
    setLastUser(null);
    setForm({ email: "", password: "" });
    setError("");
    setShowFullForm(true);
    setShowPassword(false);
  };

  const handleBackToQuickLogin = () => {
    setForm({ email: lastUser?.email || "", password: "" });
    setError("");
    setShowPassword(false);
    setShowFullForm(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading || transition) return;

    setError("");
    setLoading(true);

    try {
      await login(form.email.trim(), form.password);
      setLoading(false);
      setTransition(true);
      welcomeTimer.current = setTimeout(() => setWelcome(true), 1000);
      transitionTimer.current = setTimeout(() => navigate("/dashboard"), 2600);
    } catch (err) {
      setError(err?.response?.data?.message || "Identifiants incorrects.");
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    window.location.href = `${API_URL}/auth/${provider}/redirect`;
  };

  const renderError = () => {
    if (!error) return null;
    return (
      <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs leading-5 text-red-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
        <X size={15} className="mt-0.5 shrink-0" />
        <span>{error}</span>
      </div>
    );
  };

  const renderPasswordInput = () => (
    <div>
      <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-[#0B2229] dark:text-slate-300">
        Mot de passe
      </label>
      <div 
        className={`flex items-center rounded-xl border bg-white transition-all duration-200 dark:bg-[#0B1F33] ${
          focusField === "password" 
            ? "border-[#16B8B1] ring-4 ring-[#16B8B1]/10 dark:border-emerald-500 dark:ring-emerald-500/20" 
            : "border-[#E5ECEF] hover:border-[#16B8B1]/50 dark:border-white/10 dark:hover:border-emerald-500/50"
        }`}
      >
        <LockKeyhole size={16} className={`ml-3.5 shrink-0 ${focusField === "password" ? "text-[#0F9691] dark:text-emerald-400" : "text-[#82919D] dark:text-slate-500"}`} />
        <input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          value={form.password}
          onChange={handleChange}
          onFocus={() => setFocusField("password")}
          onBlur={() => setFocusField("")}
          placeholder="Entrez votre mot de passe"
          autoComplete="current-password"
          required
          style={{ background: "transparent", border: "none" }}
          className="min-w-0 flex-1 !bg-transparent px-3 py-3 text-sm text-[#0B2229] outline-none placeholder:text-[#9AAEA5] focus:ring-0 dark:text-white dark:placeholder:text-slate-500"
        />
        <button
          type="button"
          onClick={() => setShowPassword((value) => !value)}
          className="mr-1.5 flex h-8 w-8 items-center justify-center rounded-lg text-[#82919D] transition hover:bg-emerald-50 hover:text-[#0F9691] dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-emerald-400"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  const renderSubmitButton = () => (
    <button
      type="submit"
      disabled={loading || transition}
      className="group relative mt-5 flex min-h-[44px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#10B981] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(16,185,129,0.4)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#0D9668] disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
    >
      {loading ? (
        <><LoaderCircle size={16} className="animate-spin" /><span>Connexion...</span></>
      ) : (
        <><span>Se connecter</span><ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></>
      )}
    </button>
  );

  const renderSocialLogin = () => (
    <div className="mt-5">
      <div className="relative mb-4 flex items-center">
        <div className="h-px w-full bg-[#E5ECEF] dark:bg-white/10" />
        <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap bg-white px-3 text-[10px] font-medium text-[#82919D] dark:bg-[#112A3A] dark:text-slate-400">
          ou continuer avec
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button type="button" onClick={() => handleSocialLogin("google")} className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E5ECEF] bg-white px-2 py-2.5 text-xs font-semibold text-[#38534A] transition hover:border-[#16B8B1]/50 hover:bg-[#F5F8FA] dark:border-white/10 dark:bg-[#0B1F33] dark:text-slate-300 dark:hover:border-emerald-500/50 dark:hover:bg-white/5">
          <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/></svg>
          Google
        </button>
        <button type="button" onClick={() => handleSocialLogin("linkedin-openid")} className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E5ECEF] bg-white px-2 py-2.5 text-xs font-semibold text-[#38534A] transition hover:border-[#16B8B1]/50 hover:bg-[#F5F8FA] dark:border-white/10 dark:bg-[#0B1F33] dark:text-slate-300 dark:hover:border-emerald-500/50 dark:hover:bg-white/5">
          <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="#0A66C2" d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/></svg>
          LinkedIn
        </button>
        <button type="button" onClick={() => handleSocialLogin("facebook")} className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E5ECEF] bg-white px-2 py-2.5 text-xs font-semibold text-[#38534A] transition hover:border-[#16B8B1]/50 hover:bg-[#F5F8FA] dark:border-white/10 dark:bg-[#0B1F33] dark:text-slate-300 dark:hover:border-emerald-500/50 dark:hover:bg-white/5">
          <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/></svg>
          Facebook
        </button>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F5F8FA] font-sans text-[#0B2229] dark:bg-[#0B1F33] dark:text-slate-200 lg:grid lg:grid-cols-[1.04fr_0.96fr]">
      
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

      {/* PANNEAU GAUCHE (Image de fond) */}
      <section className="relative hidden min-h-screen overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0B253B] via-[#0A302F] to-[#07191D]" />
          <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "linear-gradient(rgba(110,231,183,.17) 1px, transparent 1px), linear-gradient(90deg, rgba(110,231,183,.17) 1px, transparent 1px)", backgroundSize: "46px 46px", maskImage: "linear-gradient(to bottom, black, transparent 90%)" }} />
          <div className="absolute -left-40 -top-32 h-[470px] w-[470px] rounded-full bg-[#16B8B1]/10 blur-[110px]" />
          <div className="absolute -bottom-36 -right-20 h-[480px] w-[480px] rounded-full bg-[#0F9691]/10 blur-[110px]" />
        </div>

        <Link to="/" className="relative z-10 inline-flex w-fit items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-200/20 bg-gradient-to-br from-emerald-300 to-emerald-500 text-[#04231D] shadow-lg shadow-emerald-500/20">
            <Layers size={22} strokeWidth={2.2} />
          </span>
          <span>
            <span className="block text-lg font-extrabold tracking-tight text-white">
              Talent<span className="text-emerald-300">Share</span>
            </span>
            <span className="mt-0.5 block text-[9px] font-semibold tracking-[0.18em] text-emerald-100/60">
              Connecter les talents
            </span>
          </span>
        </Link>

        <div className="relative z-10 my-8 max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200/20 bg-emerald-200/[0.06] px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-emerald-200 backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            LE RÉSEAU PROFESSIONNEL NOUVELLE GÉNÉRATION
          </div>
          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-[-0.045em] xl:text-5xl">
            Le talent existe.
            <br />
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent">
              Connectons-le aux bonnes opportunités.
            </span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-[#B4CCC3]">
            Retrouvez les entreprises, les professionnels et les jeunes talents qui font des compétences le point de départ de nouvelles collaborations.
          </p>

          <div className="relative mt-8 max-w-[480px]">
            <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/15 blur-[65px]" />
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 510 190" fill="none" aria-hidden="true">
              <path d="M85 70 L255 95 L425 70 M255 95 L255 160" stroke="#6EE7B7" strokeOpacity=".35" strokeWidth="1.5" strokeDasharray="5 6" />
              <circle cx="85" cy="70" r="3.5" fill="#6EE7B7" />
              <circle cx="425" cy="70" r="3.5" fill="#6EE7B7" />
              <circle cx="255" cy="160" r="3.5" fill="#6EE7B7" />
            </svg>
            <div className="relative grid grid-cols-3 gap-2.5">
              <div className="rounded-xl border border-white/10 bg-[#12353A]/90 p-3 backdrop-blur-md">
                <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-300/10 text-emerald-300"><Building2 size={17} /></span>
                <p className="text-xs font-bold text-white">Entreprises</p>
                <p className="mt-0.5 text-[10px] leading-4 text-[#A5BFB5]">Trouvez les compétences</p>
              </div>
              <div className="rounded-xl border border-emerald-300/30 bg-emerald-300/[0.09] p-3 backdrop-blur-md">
                <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-300/15 text-emerald-200"><Users size={17} /></span>
                <p className="text-xs font-bold text-white">Professionnels</p>
                <p className="mt-0.5 text-[10px] leading-4 text-[#A5BFB5]">Partagez vos talents</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#12353A]/90 p-3 backdrop-blur-md">
                <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-300/10 text-emerald-300"><GraduationCap size={17} /></span>
                <p className="text-xs font-bold text-white">Jeunes talents</p>
                <p className="mt-0.5 text-[10px] leading-4 text-[#A5BFB5]">Lancez votre carrière</p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2.5 text-xs text-[#A8C2B8]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-300/10 text-emerald-300"><ShieldCheck size={15} /></span>
            <span>Une communauté fondée sur la confiance et la collaboration.</span>
          </div>
        </div>
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4 text-[10px] text-[#8DAAA0]">
          <span>© {new Date().getFullYear()} TalentShare · Madagascar</span>
          <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-emerald-300" />Connecter les talents. Créer de la valeur.</span>
        </div>
      </section>

      {/* PANNEAU DROIT (Formulaire) */}
      <section className="relative flex min-h-screen flex-col bg-white px-5 py-4 dark:bg-[#112A3A] sm:px-10 lg:px-12 xl:px-16">
        <header className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-300 to-emerald-500 text-[#04231D]">
              <Layers size={19} />
            </span>
            <span>
              <span className="block text-sm font-extrabold tracking-tight text-[#0B2229] dark:text-white">Talent<span className="text-emerald-700 dark:text-emerald-400">Share</span></span>
              <span className="block text-[8px] font-semibold tracking-[0.13em] text-[#81958D] dark:text-slate-400">Connecter les talents</span>
            </span>
          </Link>
          <div className="hidden lg:block" />
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#587078] transition hover:text-emerald-800 dark:text-slate-400 dark:hover:text-emerald-400">
            <span className="hidden sm:inline">Retour à l'accueil</span>
            <span className="sm:hidden">Accueil</span>
            <ArrowUpRight size={14} />
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center py-4">
          <div className="w-full max-w-[420px]">
            
            <div className="mb-6">
              <div className="mb-3 hidden h-11 w-11 items-center justify-center rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-[#D9F7E9] text-emerald-700 shadow-sm dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-emerald-500/5 dark:text-emerald-400 lg:flex">
                <Fingerprint size={22} strokeWidth={1.7} />
              </div>
              <p className="mb-2 hidden text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400 lg:block">
                VOTRE ESPACE PROFESSIONNEL
              </p>
              <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-[#0B2229] dark:text-white">
                {showFullForm ? "Bon retour parmi nous." : "Heureux de vous revoir."}
              </h2>
              <p className="mt-2 text-xs leading-5 text-[#587078] dark:text-slate-400">
                {showFullForm ? "Connectez-vous à votre compte pour retrouver votre réseau et vos opportunités." : "Entrez votre mot de passe pour retrouver votre espace."}
              </p>
            </div>

            {renderError()}

            {!showFullForm && lastUser ? (
              <form onSubmit={handleSubmit}>
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#DCE9E2] bg-[#F7FAF8] p-3 dark:border-white/10 dark:bg-[#0B1F33]">
                 {lastUser.avatar_path ? (
  <img 
    src={lastUser.avatar_path.startsWith('http') ? lastUser.avatar_path : `${API_URL.replace('/api', '')}/storage/${lastUser.avatar_path}`} 
    alt="Avatar" 
    className="h-10 w-10 rounded-lg object-cover" 
  />
) : (
  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-300 to-emerald-500 text-sm font-extrabold text-[#04231D]">
    {(lastUser.name || lastUser.email || "U").charAt(0).toUpperCase()}
  </div>
)}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[#0B2229] dark:text-white">{lastUser.name || "Votre compte"}</p>
                    <p className="mt-0.5 truncate text-[10px] text-[#71877D] dark:text-slate-400">{lastUser.email}</p>
                  </div>
                  <button type="button" onClick={handleSwitchUser} title="Ce n'est pas vous ?" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#71877D] transition hover:bg-white hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-emerald-400"><RotateCcw size={14} /></button>
                </div>
                <input type="hidden" name="email" value={form.email} readOnly />
                {renderPasswordInput()}
                <div className="mt-3 flex justify-end"><Link to="/forgot-password" className="text-xs font-semibold text-emerald-700 transition hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300">Mot de passe oublié ?</Link></div>
                {renderSubmitButton()}
                
                <button
                  type="button"
                  onClick={handleSwitchUser}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 text-[11px] font-semibold text-[#82919D] transition hover:text-[#0F9691] dark:text-slate-400 dark:hover:text-emerald-400"
                >
                  Ce n'est pas vous ? Changer de compte
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-[#0B2229] dark:text-slate-300">Adresse e-mail</label>
                <div className={`flex items-center rounded-xl border bg-white transition-all duration-200 dark:bg-[#0B1F33] ${focusField === "email" ? "border-[#16B8B1] ring-4 ring-[#16B8B1]/10 dark:border-emerald-500 dark:ring-emerald-500/20" : "border-[#E5ECEF] hover:border-[#16B8B1]/50 dark:border-white/10 dark:hover:border-emerald-500/50"}`}>
                  <Mail size={16} className={`ml-3.5 shrink-0 ${focusField === "email" ? "text-[#0F9691] dark:text-emerald-400" : "text-[#82919D] dark:text-slate-500"}`} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    onFocus={() => setFocusField("email")}
                    onBlur={() => setFocusField("")}
                    placeholder="vous@entreprise.com"
                    autoComplete="username"
                    required
                    style={{ background: "transparent", border: "none" }}
                    className="min-w-0 flex-1 !bg-transparent px-3 py-3 text-sm text-[#0B2229] outline-none placeholder:text-[#9AAEA5] focus:ring-0 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>
                </div>
                {renderPasswordInput()}
                <div className="mt-3 flex justify-end"><Link to="/forgot-password" className="text-xs font-semibold text-emerald-700 transition hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300">Mot de passe oublié ?</Link></div>
                {renderSubmitButton()}
              </form>
            )}

            {renderSocialLogin()}

            <div className="mt-6 border-t border-[#E5ECEF] pt-5 text-center dark:border-white/10">
              <p className="flex items-center justify-center gap-1.5 text-xs text-[#71877D] dark:text-slate-400">
                Vous n'avez pas encore de compte ?
                <Link to="/register" className="group inline-flex items-center gap-1 font-bold text-emerald-700 transition hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300">
                  S'inscrire
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </p>
            </div>

            {lastUser && showFullForm && (
              <button type="button" onClick={handleBackToQuickLogin} className="mt-4 flex w-full items-center justify-center gap-1.5 text-[11px] text-[#81958D] transition hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400">
                <ArrowRight size={13} className="rotate-180" /> Revenir à la connexion rapide
              </button>
            )}

            <div className="mt-5 flex items-center justify-center gap-2 text-[8px] font-semibold uppercase tracking-[0.17em] text-[#91A69C] dark:text-slate-500">
              <span className="h-px w-5 bg-[#DCE9E2] dark:bg-white/10" /> Share. Connect. Grow. <span className="h-px w-5 bg-[#DCE9E2] dark:bg-white/10" />
            </div>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-[#E5ECEF] py-3 text-[10px] text-[#81958D] dark:border-white/10 dark:text-slate-500">
          <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-emerald-700 dark:text-emerald-400" /> Connexion sécurisée</span>
          <span>© {new Date().getFullYear()} TalentShare</span>
        </footer>
      </section>

      {transition && (
        <div role="status" aria-live="polite" className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-hidden bg-[#07191D] px-6 text-white dark:bg-black/90">
          <div className="absolute inset-0 z-[-1] opacity-[0.12]" style={{ backgroundImage: "linear-gradient(rgba(110,231,183,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(110,231,183,.15) 1px, transparent 1px)", backgroundSize: "48px 48px", maskImage: "radial-gradient(ellipse at center, black 5%, transparent 75%)" }} />
          <div className="absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/[0.07] blur-[90px] sm:h-[500px] sm:w-[500px]" />
          <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center text-center">
            <div className="relative flex h-36 w-36 items-center justify-center">
              <div className="absolute inset-0 rounded-[34px] border border-emerald-300/30" />
              <div className="absolute -inset-2 rounded-[38px] border border-emerald-300/15" />
              <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-emerald-300 to-emerald-500 text-[#04231D] shadow-[0_0_40px_rgba(16,185,129,.3)]">
                <Layers size={32} strokeWidth={1.8} />
              </div>
              <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-[#0B2A30] text-emerald-300"><Sparkles size={15} /></div>
              <div className="absolute -bottom-2 -left-2 flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-[#0B2A30] text-emerald-300"><Check size={15} /></div>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-sm font-extrabold tracking-tight">
              Talent<span className="text-emerald-300">Share</span>
            </div>
            <div className="mt-0.5 text-[8px] font-semibold tracking-[0.25em] text-emerald-100/40">SHARE. CONNECT. GROW.</div>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.07] px-3.5 py-1.5 text-[10px] font-semibold tracking-wide text-emerald-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> ACCÈS SÉCURISÉ
            </div>
            <h2 className="mt-4 text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl">
              {welcome ? "Bienvenue dans votre" : "Votre réseau."}
              <span className="mt-1 block bg-gradient-to-r from-emerald-300 via-teal-200 to-white bg-clip-text text-transparent">
                {welcome ? "nouvel espace." : "Vos opportunités."}
              </span>
            </h2>
            <p className="mx-auto mt-3 max-w-xs text-xs leading-6 text-emerald-50/60 sm:text-sm">
              {welcome ? "Votre espace professionnel est prêt. Faisons grandir vos opportunités." : "Nous préparons votre espace professionnel. Encore un instant..."}
            </p>
            <div className="mt-6 h-1 w-full max-w-[200px] overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-full origin-left scale-x-0 animate-[tsProgress_2.6s_cubic-bezier(.35,0,.2,1)_forwards] rounded-full bg-gradient-to-r from-emerald-300 to-teal-200" />
            </div>
            <div className="mt-8 flex items-center gap-1.5 text-[10px] text-white/40"><ShieldCheck size={12} className="text-emerald-300/70" /> Connecter les talents. Créer de la valeur.</div>
          </div>
          <style>{`@keyframes tsProgress { 0% { transform: scaleX(0); } 20% { transform: scaleX(.18); } 65% { transform: scaleX(.76); } 100% { transform: scaleX(1); } }`}</style>
        </div>
      )}
    </main>
  );
}