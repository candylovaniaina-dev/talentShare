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
        await api.post("/proposals/recruiter-apply", {
          resource_request_id: requestId,
          proposed_by_company_id: senderCompany.id,
          message,
          conditions: conditions || null,
          status: "sent",
        });
      } else {
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

  const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#16B8B1] focus:bg-white focus:ring-4 focus:ring-[#16B8B1]/15 dark:border-white/10 dark:bg-[#0B1F33] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#16B8B1] dark:focus:bg-[#112A3A]";
  const labelClass = "mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true">
      <button type="button" aria-label="Fermer" onClick={onClose} className="absolute inset-0 bg-[#0B1F33]/60 backdrop-blur-md dark:bg-black/80" />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_100px_rgba(6,20,31,0.4)] dark:border-white/10 dark:bg-[#112A3A] dark:shadow-[0_30px_100px_rgba(0,0,0,0.6)]">

        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1F33] to-[#122b45] px-5 pb-10 pt-8 text-white sm:px-7 sm:pt-10">
          <button type="button" onClick={onClose} className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:rotate-90 hover:bg-white/20">
            <X size={18} />
          </button>

          <div className="relative flex flex-col gap-5 pr-10">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#16B8B1]">
                {isRecruiter ? "Proposer une offre" : "Proposition de candidature"}
              </p>
              <h2 className="mt-2 text-xl font-black leading-snug tracking-tight sm:text-2xl">
                {request.title || "Demande de ressource"}
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 py-1.5 pl-1.5 pr-3 text-xs font-semibold text-white">
                {senderLogo ? (
                  <img src={senderLogo} alt={senderName} className="h-6 w-6 rounded-full bg-white object-contain p-0.5" />
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

        <form onSubmit={submit} className="flex flex-1 flex-col overflow-y-auto bg-white dark:bg-[#112A3A]">
          <div className="space-y-6 p-5 sm:p-7">
            {error && (
              <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
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
              <p className={`mt-1.5 text-right text-[11px] ${message.length < 20 ? "text-rose-500 dark:text-rose-400" : "text-slate-400 dark:text-slate-500"}`}>
                {message.length} caractères · 20 minimum
              </p>
            </div>

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

            {!isRecruiter && (
              <div>
                <label className={labelClass}>Curriculum vitæ (Optionnel)</label>
                <label className="group flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-4 transition-all duration-200 hover:border-[#16B8B1] dark:border-white/10 dark:bg-[#0B1F33] dark:hover:border-[#16B8B1]/50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-400">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-bold text-slate-700 dark:text-white">{cvFile ? cvFile.name : "Importer votre CV"}</p>
                  </div>
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setCvFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/50 p-5 dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-end sm:px-7">
            <button type="button" onClick={onClose} disabled={sending} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-transparent dark:text-slate-300 dark:hover:bg-white/5">
              Annuler
            </button>
            <button type="submit" disabled={sending || message.length < 20} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#16B8B1] px-6 py-3 text-sm font-bold text-[#0B1F33] shadow-[0_8px_20px_rgba(22,184,177,0.25)] transition hover:-translate-y-0.5 hover:bg-[#0F9691] hover:text-white disabled:opacity-50 dark:bg-[#16B8B1] dark:text-[#0B1F33]">
              {sending ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0B1F33]/30 border-t-[#0B1F33]" />Envoi...</> : <>Envoyer ma proposition <Send size={16} /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}