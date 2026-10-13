import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Loader2,
  MailCheck,
} from "lucide-react";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Vérification en cours…");

  useEffect(() => {
    let redirectTimer;

    const statusParam = searchParams.get("status");
    const messageParam = searchParams.get("message");

    if (statusParam === "success") {
      setStatus("success");
      setMessage(messageParam || "Votre adresse e-mail a été vérifiée avec succès.");

      redirectTimer = setTimeout(() => {
        navigate("/login");
      }, 3000);
    } else if (statusParam === "error") {
      setStatus("error");
      setMessage(messageParam || "Le lien est invalide ou a expiré.");
    } else {
      setStatus("error");
      setMessage("Lien de vérification invalide ou incomplet.");
    }

    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [searchParams, navigate]);

  const isSuccess = status === "success";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A1229] px-4 py-20 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={`absolute -left-32 top-0 h-96 w-96 rounded-full blur-[120px] ${
            isSuccess ? "bg-emerald-400/10" : "bg-rose-500/10"
          }`}
        />
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
        to="/"
        className="absolute left-4 top-5 z-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 backdrop-blur transition hover:bg-white/[0.08] hover:text-white sm:left-6 sm:top-6"
      >
        <ArrowLeft size={16} />
        Accueil
      </Link>

      <main className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-[#111B35]/80 p-7 text-center shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-10">
          <div
            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border ${
              status === "loading"
                ? "border-sky-300/20 bg-sky-300/10 text-sky-300"
                : isSuccess
                  ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-300"
                  : "border-rose-300/20 bg-rose-300/10 text-rose-300"
            }`}
          >
            {status === "loading" ? (
              <Loader2 size={34} className="animate-spin" />
            ) : isSuccess ? (
              <MailCheck size={34} />
            ) : (
              <XCircle size={34} />
            )}
          </div>

          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
            <ShieldCheck size={14} className="mr-1.5 inline-block" />
            Sécurité TalentShare
          </p>

          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            {status === "loading"
              ? "Vérification en cours"
              : isSuccess
                ? "Adresse vérifiée !"
                : "Vérification échouée"}
          </h1>

          <p
            role={status === "error" ? "alert" : "status"}
            className="mt-4 text-sm leading-7 text-slate-400"
          >
            {message}
          </p>

          {status === "loading" && (
            <div className="mt-7 flex items-center justify-center gap-2 text-sm text-slate-400">
              <Loader2 size={16} className="animate-spin text-emerald-300" />
              Merci de patienter…
            </div>
          )}

          {isSuccess && (
            <div className="mt-7 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.06] p-4">
              <CheckCircle2
                size={20}
                className="mx-auto text-emerald-300"
              />
              <p className="mt-2 text-sm font-medium text-emerald-100">
                Votre compte est prêt à être utilisé.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Redirection vers la connexion dans quelques instants…
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="mt-7 space-y-3">
              <Link
                to="/login"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 py-3.5 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-200"
              >
                Retour à la connexion
                <ArrowRight size={17} />
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-400 transition hover:text-white"
              >
                Créer un compte
              </Link>
            </div>
          )}

          {isSuccess && (
            <Link
              to="/login"
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 py-3.5 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-200"
            >
              Continuer vers la connexion
              <ArrowRight size={17} />
            </Link>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-slate-600">
          TalentShare · Des connexions qui font avancer.
        </p>
      </main>
    </div>
  );
};

export default VerifyEmail;