import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import api from "../../services/api";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectTimer = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    password_confirmation: "",
    token: "",
  });

  useEffect(() => {
    const token = searchParams.get("token") || "";
    const email = searchParams.get("email") || "";

    setFormData((current) => ({
      ...current,
      token,
      email,
    }));
  }, [searchParams]);

  useEffect(() => {
    return () => clearTimeout(redirectTimer.current);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setSuccess("");

    if (!formData.token || !formData.email) {
      setError(
        "Le lien de réinitialisation est incomplet. Demandez un nouveau lien."
      );
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/reset-password", formData);
      setSuccess("Votre mot de passe a été réinitialisé avec succès.");

      redirectTimer.current = setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err) {
      const errors = err.response?.data?.errors;
      const firstValidationError = errors
        ? Object.values(errors).flat()[0]
        : null;

      setError(
        firstValidationError ||
          err.response?.data?.message ||
          "Impossible de réinitialiser le mot de passe. Le lien est peut-être expiré."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-[#0A1229]/70 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10";

  const passwordField = (
    name,
    label,
    visible,
    setVisible,
    placeholder
  ) => (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300"
      >
        {label}
      </label>
      <div className="relative">
        <LockKeyhole
          size={17}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          value={formData[name]}
          onChange={handleChange}
          required
          minLength={8}
          autoComplete="new-password"
          placeholder={placeholder}
          className={`${inputClass} pl-11 pr-12`}
        />
        <button
          type="button"
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A1229] px-4 py-20 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-emerald-400/10 blur-[120px]" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-blue-500/10 blur-[120px]" />
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
        to="/login"
        className="absolute left-4 top-5 z-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 backdrop-blur transition hover:bg-white/[0.08] hover:text-white sm:left-6 sm:top-6"
      >
        <ArrowLeft size={16} />
        Connexion
      </Link>

      <main className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-[#111B35]/80 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-9">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-300/15 bg-emerald-400/10 text-emerald-300">
            {success ? (
              <CheckCircle2 size={28} />
            ) : (
              <ShieldCheck size={28} />
            )}
          </div>

          <p className="mt-6 text-center text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
            Sécurité du compte
          </p>
          <h1 className="mt-3 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Nouveau mot de passe
          </h1>
          <p className="mt-3 text-center text-sm leading-6 text-slate-400">
            Choisissez un nouveau mot de passe pour retrouver l'accès à votre
            compte TalentShare.
          </p>

          {success && (
            <div
              role="status"
              className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.08] p-4 text-sm leading-6 text-emerald-100"
            >
              <CheckCircle2
                size={19}
                className="mt-0.5 shrink-0 text-emerald-300"
              />
              <span>{success} Redirection vers la connexion…</span>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/[0.08] p-4 text-sm leading-6 text-rose-200"
            >
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-rose-300"
              />
              <span>{error}</span>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="reset-email"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Adresse e-mail
                </label>
                <input
                  id="reset-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  placeholder="vous@exemple.com"
                  className={inputClass}
                />
              </div>

              {passwordField(
                "password",
                "Nouveau mot de passe",
                showPassword,
                setShowPassword,
                "8 caractères minimum"
              )}

              {passwordField(
                "password_confirmation",
                "Confirmer le mot de passe",
                showConfirmation,
                setShowConfirmation,
                "Répétez le mot de passe"
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 py-3.5 text-sm font-bold text-[#0A1229] shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-200 focus:outline-none focus:ring-4 focus:ring-emerald-300/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Réinitialisation…
                  </>
                ) : (
                  <>
                    Réinitialiser le mot de passe
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-7 border-t border-white/[0.07] pt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 transition hover:text-emerald-200"
            >
              <ArrowLeft size={15} />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;