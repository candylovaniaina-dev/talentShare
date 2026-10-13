
import React, { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  Video,
  Loader2,
  AlertCircle,
  Link2,
  CheckCircle2,
} from "lucide-react";
import api from "../services/api";

export default function ScheduleInterviewModal({
  application,
  onClose,
  onSuccess,
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [link, setLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const today = new Date();
  const minDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#0F1E45] outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10";

  const labelClass =
    "mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700";

  const submit = async (event) => {
    event.preventDefault();

    if (!date || !time) {
      setError("La date et l’heure sont obligatoires.");
      return;
    }

    if (date < minDate) {
      setError("Choisis une date qui n’est pas déjà passée.");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const interview_at = `${date}T${time}:00`;

      const response = await api.post(
        `/applications/${application.id}/schedule-interview`,
        {
          interview_at,
          interview_link: link.trim() || null,
        }
      );

      onSuccess(response.data.application);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Une erreur est survenue lors de la programmation de l’entretien."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071126]/65 p-3 backdrop-blur-sm sm:p-5"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-interview-title"
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8FBF5] text-[#087F70]">
              <Video size={21} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#087F70]">
                Recrutement
              </p>
              <h2
                id="schedule-interview-title"
                className="mt-0.5 text-base font-bold text-[#0F1E45] sm:text-lg"
              >
                Programmer un entretien
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-[#0F1E45]"
          >
            <X size={19} />
          </button>
        </header>

        <div className="p-5 sm:p-6">
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-teal-100 bg-[#F0FBF7] p-4">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#087F70] shadow-sm">
              <CheckCircle2 size={17} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F1E45]">
                Propose un créneau au candidat
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Une invitation sera envoyée par email. Selon la configuration
                du service, elle pourra être ajoutée au calendrier du candidat.
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700"
            >
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <p className="leading-5">{error}</p>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="interview-date" className={labelClass}>
                <Calendar size={15} className="text-[#087F70]" />
                Date de l’entretien
                <span className="text-rose-500">*</span>
              </label>
              <input
                id="interview-date"
                type="date"
                required
                min={minDate}
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setError(null);
                }}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="interview-time" className={labelClass}>
                <Clock size={15} className="text-[#087F70]" />
                Heure de l’entretien
                <span className="text-rose-500">*</span>
              </label>
              <input
                id="interview-time"
                type="time"
                required
                value={time}
                onChange={(event) => {
                  setTime(event.target.value);
                  setError(null);
                }}
                className={inputClass}
              />
              <p className="mt-1.5 text-[11px] text-slate-500">
                Vérifie le fuseau horaire avant d’envoyer l’invitation.
              </p>
            </div>

            <div>
              <label htmlFor="interview-link" className={labelClass}>
                <Link2 size={15} className="text-[#087F70]" />
                Lien de visioconférence
                <span className="font-normal text-slate-400">(facultatif)</span>
              </label>
              <input
                id="interview-link"
                type="url"
                value={link}
                onChange={(event) => {
                  setLink(event.target.value);
                  setError(null);
                }}
                placeholder="https://meet.google.com/..."
                className={inputClass}
              />
              <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
                Laisse ce champ vide si ton application génère automatiquement
                un lien de visioconférence.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={saving || !date || !time}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F1E45] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#172B5B] focus:outline-none focus:ring-4 focus:ring-[#0F1E45]/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Video size={16} />
                )}
                {saving ? "Envoi en cours…" : "Envoyer l’invitation"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
