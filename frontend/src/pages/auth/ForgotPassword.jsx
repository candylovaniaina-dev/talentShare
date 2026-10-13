import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import api from "../../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const redirectTimer = useRef(null);

  useEffect(() => {
    return () => clearTimeout(redirectTimer.current);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await api.post("/forgot-password", { email: email.trim() });
      setSuccess(true);

      redirectTimer.current = setTimeout(() => {
        navigate("/login");
      }, 4000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Impossible d'envoyer le lien pour le moment. Réessayez."
      );
    } finally {
      setLoading(false);
    }
  };

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
        className="absolute left-4 top-5 z-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 backdrop-blur transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white sm:left-6 sm:top-6"
      >
        <ArrowLeft size={16} />
        Connexion
      </Link>

      <main className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-[#111B35]/80 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-9">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-300/15 bg-emerald-400/10 text-emerald-300 shadow-lg shadow-emerald-950/20">
            {success ? (
              <CheckCircle size={28} />
            ) : (
              <Mail size={28} />
            )}
          </div>

          <p className="mt-6 text-center text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
            Récupération du compte
          </p>

          <h1 className="mt-3 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            {success ? "Vérifiez votre boîte mail" : "Mot de passe oublié ?"}
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-6 text-slate-400">
            {success
              ? "Si cette adresse correspond à un compte, un lien de réinitialisation vous a été envoyé."
              : "Indiquez l'adresse e-mail associée à votre compte pour demander un lien de réinitialisation."}
          </p>

          {success && (
            <div
              role="status"
              className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.08] p-4 text-sm leading-6 text-emerald-100"
            >
              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-emerald-300"
              />
              <p>
                Consultez votre boîte de réception ainsi que vos courriers
                indésirables. Vous allez être redirigé vers la connexion.
              </p>
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
                  htmlFor="forgot-email"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Adresse e-mail
                </label>
                <div className="relative mt-2">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={255}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    className="w-full rounded-2xl border border-white/10 bg-[#0A1229]/70 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 py-3.5 text-sm font-bold text-[#0A1229] shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-200 focus:outline-none focus:ring-4 focus:ring-emerald-300/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Envoi en cours…
                  </>
                ) : (
                  <>
                    Envoyer le lien
                    <ArrowLeft className="rotate-180" size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-7 border-t border-white/[0.07] pt-6 text-center">
            <p className="text-sm text-slate-400">
              Vous vous souvenez de votre mot de passe ?
            </p>
            <Link
              to="/login"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300 transition hover:text-emerald-200"
            >
              Retour à la connexion
              <ArrowLeft className="rotate-180" size={15} />
            </Link>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-slate-600">
          TalentShare · Votre prochain chapitre commence ici.
        </p>
      </main>
    </div>
  );
}