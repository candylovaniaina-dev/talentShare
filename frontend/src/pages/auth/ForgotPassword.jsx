import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import api from "../../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await api.post("/forgot-password", { email });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A1526] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-mint/10 blur-[120px]" />
        <div className="absolute -right-32 bottom-0 h-[420px] w-[420px] rounded-full bg-navy-500/15 blur-[120px]" />
      </div>

      <Link
        to="/login"
        className="absolute left-6 top-6 z-20 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 backdrop-blur-md transition hover:bg-white/10"
      >
        <ArrowLeft size={15} /> Connexion
      </Link>

      <main className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-16">
        <div className="w-full rounded-xl2 border border-white/10 bg-white/[0.04] p-8 shadow-pop backdrop-blur-xl sm:p-10">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl2 bg-mint/15 text-mint">
              <Mail size={26} strokeWidth={1.5} />
            </div>
          </div>

          <h1 className="mt-6 text-center text-2xl font-bold text-white">
            Mot de passe oublié ?
          </h1>
          <p className="mt-2 text-center text-sm text-slate-400">
            Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>

          {success && (
            <div className="mt-6 flex items-start gap-2 rounded-xl2 border border-mint/30 bg-mint/10 p-3.5 text-sm text-mint">
              <CheckCircle size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" />
              <span>Un lien de réinitialisation a été envoyé à votre email.</span>
            </div>
          )}

          {error && (
            <div className="mt-6 flex items-start gap-2 rounded-xl2 border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-400">
              <AlertCircle size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                className="mt-2 w-full rounded-xl2 border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 transition focus:border-mint/50 focus:outline-none focus:ring-2 focus:ring-mint/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="flex w-full items-center justify-center gap-2 rounded-xl2 bg-mint py-3.5 text-sm font-bold text-navy-900 transition-all hover:bg-mint-light disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Envoi...
                </>
              ) : success ? (
                <>Lien envoyé</>
              ) : (
                <>Envoyer le lien</>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Vous vous souvenez de votre mot de passe ?{" "}
            <Link to="/login" className="font-semibold text-mint hover:text-mint-light">
              Se connecter
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
