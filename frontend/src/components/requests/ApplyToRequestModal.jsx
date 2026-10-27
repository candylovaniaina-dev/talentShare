import React, { useState } from "react";
import { X, Building2, AlertCircle, Send, FileText, UserRound } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function ApplyToRequestModal({ request, onClose, onSuccess }) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [conditions, setConditions] = useState("");
  const [cvFile, setCvFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const isRecruiter = user?.companies?.length > 0;
  const senderCompany = user?.companies?.[0];
  const senderProfile = user?.professional_profile || user?.professionalProfile;

  // ✅ Dans le fil, l'id est préfixé ("req-12") : on utilise l'id réel
  const requestId = request.real_id ?? String(request.id).replace(/^(req|job)-/, "");

  const BASE_URL = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
  const fileUrl = (p) => (!p ? null : /^https?:/.test(p) ? p : `${BASE_URL}/storage/${p}`);

  const senderLogo = isRecruiter
    ? fileUrl(senderCompany?.logo_path)
    : fileUrl(senderProfile?.avatar_path || user?.avatar_path);
  const senderName = isRecruiter ? senderCompany?.name : (user?.name || "Mon profil");

  const submit = async (e) => {
    e.preventDefault();
    if (message.trim().length < 20) {
      setError("La lettre d'accompagnement doit contenir au moins 20 caractères.");
      return;
    }

    setSending(true);
    setError(null);

    try {
      if (isRecruiter) {
        // ✅ FLUX INVERSÉ : le recruteur propose. Le backend retrouve lui-même
        // le profil du talent à partir de l'auteur de la demande.
        await api.post("/proposals/recruiter-apply", {
          resource_request_id: requestId,
          proposed_by_company_id: senderCompany.id,
          message,
          conditions: conditions || null,
          status: "sent",
        });
      } else {
        // ✅ FLUX CLASSIQUE : un talent postule
        const profileId = senderProfile?.id;
        if (!profileId) {
          setError("Complétez d'abord votre profil professionnel avant de postuler.");
          return;
        }
        const formData = new FormData();
        formData.append("resource_request_id", requestId);
        formData.append("professional_profile_id", profileId);
        formData.append("status", "sent");
        formData.append("message", message);
        if (conditions) formData.append("conditions", conditions);
        if (cvFile) formData.append("cv", cvFile);
        await api.post("/proposals", formData, { headers: { "Content-Type": "multipart/form-data" } });
      }

      onSuccess();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(
        errors
          ? Object.values(errors).flat().join(" · ")
          : err.response?.data?.message || "Impossible d'envoyer la proposition."
      );
    } finally {
      setSending(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-[#CFE4D9] bg-[#F8FCF9] px-4 py-3 text-sm text-[#173F3A] outline-none transition placeholder:text-[#91A69D] focus:border-[#18B99A] focus:bg-white focus:ring-4 focus:ring-[#18B99A]/15 dark:border-white/10 dark:bg-[#0B1F33] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:bg-[#112A3A]";
  const labelClass = "mb-2 block text-xs font-bold uppercase tracking-wider text-[#31564D] dark:text-slate-300";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true">
      <button type="button" aria-label="Fermer" onClick={onClose} className="absolute inset-0 bg-[#102F38]/65 backdrop-blur-md dark:bg-black/80" />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_30px_100px_rgba(16,47,56,0.28)] dark:border-white/10 dark:bg-[#112A3A] dark:shadow-[0_30px_100px_rgba(0,0,0,0.6)]">

        {/* HEADER */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#103F3B] via-[#0C6252] to-[#087F68] px-5 pb-10 pt-8 text-white dark:from-[#0B1F33] dark:via-[#0F9691]/40 dark:to-[#16B8B1]/30 sm:px-7 sm:pt-10">
          <button type="button" onClick={onClose} className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:rotate-90 hover:bg-white/20">
            <X size={18} />
          </button>

          <div className="relative flex flex-col gap-5 pr-10">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#6FE0C3]">
                {isRecruiter ? "Proposer une offre" : "Proposition de candidature"}
              </p>
              <h2 className="mt-2 text-xl font-black leading-snug tracking-tight sm:text-2xl">
                {request.title || "Demande de ressource"}
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 py-1.5 pl-1.5 pr-3 text-xs font-semibold text-[#D7F8E9]">
                {senderLogo ? (
                  <img src={senderLogo} alt={senderName} className="h-6 w-6 rounded-full object-cover bg-white" />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                    {isRecruiter ? <Building2 size={12} /> : <UserRound size={12} />}
                  </div>
                )}
                {senderName}
              </span>
            </div>
          </div>
        </div>

        {/* FORMULAIRE */}
        <form onSubmit={submit} className="flex flex-1 flex-col overflow-y-auto bg-white dark:bg-[#112A3A]">
          <div className="space-y-6 p-5 sm:p-7">
            {error && (
              <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="message" className={labelClass}>Lettre d'accompagnement</label>
              <textarea
                id="message"
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Présentez vos motivations, ce que vous pouvez apporter..."
                className={`${inputClass} resize-y leading-6`}
              />
              <p className={`mt-1.5 text-right text-[11px] ${message.length < 20 ? "text-rose-500 dark:text-rose-400" : "text-[#91A69D] dark:text-slate-500"}`}>
                {message.length} caractères · 20 minimum
              </p>
            </div>

            {/* ✅ Conditions de l'offre (recruteur uniquement) */}
            {isRecruiter && (
              <div>
                <label htmlFor="conditions" className={labelClass}>Conditions de l'offre (optionnel)</label>
                <textarea
                  id="conditions"
                  rows={3}
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  placeholder="Durée, rémunération, lieu, horaires..."
                  className={`${inputClass} resize-y leading-6`}
                />
              </div>
            )}

            {/* CV (uniquement pour les talents) */}
            {!isRecruiter && (
              <div>
                <label className={labelClass}>Curriculum vitæ (Optionnel)</label>
                <label className="group flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-[#B6DFCE] bg-gradient-to-br from-[#F8FCF9] to-[#EAF8F0] p-4 transition-all duration-200 hover:border-[#18B99A] dark:border-white/10 dark:from-[#0B1F33] dark:to-[#0B1F33] dark:hover:border-emerald-500/50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#C7ECDD] bg-white text-[#087F68] dark:border-white/10 dark:bg-white/10 dark:text-emerald-400">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-bold text-[#244E43] dark:text-white">{cvFile ? cvFile.name : "Importer votre CV"}</p>
                  </div>
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setCvFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex flex-col-reverse gap-3 border-t border-[#EAF0EC] bg-[#F8FCF9] p-5 dark:border-white/10 dark:bg-[#112A3A] sm:flex-row sm:items-center sm:justify-end sm:px-7">
            <button type="button" onClick={onClose} disabled={sending} className="rounded-xl border border-[#CFE2D9] bg-white px-5 py-3 text-sm font-bold text-[#42645D] shadow-sm transition hover:bg-[#EAF7F0] dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10">
              Annuler
            </button>
            <button type="submit" disabled={sending || message.length < 20} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#0D5148] bg-gradient-to-r from-[#103F3B] via-[#087F68] to-[#0BA985] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 disabled:opacity-50 dark:border-emerald-500/50 dark:from-emerald-600 dark:via-emerald-500 dark:to-emerald-400">
              {sending ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Envoi...</> : <>Envoyer ma proposition <Send size={16} /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}