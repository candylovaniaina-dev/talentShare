import React, { useEffect, useState } from "react";
import {
  X, Calendar, Clock, Video, Loader2, AlertCircle, Link2, Send,
} from "lucide-react";
import api from "../services/api";

const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const nextMonday = () => {
  const d = new Date();
  const diff = ((8 - d.getDay()) % 7) || 7;
  d.setDate(d.getDate() + diff);
  return d;
};

const DATE_SHORTCUTS = [
  { label: "Demain", get: () => addDays(1) },
  { label: "Dans 2 jours", get: () => addDays(2) },
  { label: "Lundi prochain", get: nextMonday },
];

const TIME_SHORTCUTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#16B8B1] focus:ring-4 focus:ring-[#16B8B1]/10 dark:border-white/10 dark:bg-[#0A1230] dark:text-white dark:placeholder:text-slate-500";

export default function ScheduleInterviewModal({ application, onClose, onSuccess }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [link, setLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const minDate = toISO(new Date());
  const candidate = application?.profile?.user?.name;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const submit = async (event) => {
    event.preventDefault();

    if (!date || !time) {
      setError("La date et l’heure sont obligatoires.");
      return;
    }
    if (date < minDate) {
      setError("Choisissez une date qui n’est pas déjà passée.");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const interview_at = `${date}T${time}:00`;
      const response = await api.post(
        `/applications/${application.id}/schedule-interview`,
        { interview_at, interview_link: link.trim() || null }
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

  const recap =
    date && time
      ? `${new Date(`${date}T${time}:00`).toLocaleDateString("fr-FR", {
          weekday: "long", day: "numeric", month: "long",
        })} à ${time}`
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F33]/60 p-3 backdrop-blur-sm sm:p-5 font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={() => !saving && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-interview-title"
        className="flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-[#0B1F33]/30 dark:bg-[#131E47]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* ===== En-tête Bleu Marine ===== */}
        <header className="relative overflow-hidden bg-[#0B1F33] px-5 py-5 text-white sm:px-6">
          <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[#16B8B1]/20 blur-3xl" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
          />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 text-[#16B8B1]">
                <Video size={21} />
              </div>
              <div>
                <h2 id="schedule-interview-title" className="text-lg font-bold tracking-tight">
                  Programmer un entretien
                </h2>
                <p className="mt-0.5 text-sm text-white/70">
                  {candidate ? `Avec ${candidate}` : "Proposez un créneau au candidat"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="rounded-xl bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* ===== Formulaire ===== */}
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
            {/* Info : Icône supprimée */}
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-[#F3F6FC] p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">
                Une invitation sera envoyée par e-mail. Selon la configuration du
                service, elle pourra être ajoutée au calendrier du candidat.
              </p>
            </div>

            {error && (
              <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                <p className="leading-5">{error}</p>
              </div>
            )}

            {/* Date */}
            <div>
              <label htmlFor="interview-date" className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Calendar size={15} className="text-[#16B8B1]" />
                Date de l’entretien <span className="text-rose-500">*</span>
              </label>
              <input
                id="interview-date"
                type="date"
                required
                min={minDate}
                value={date}
                onChange={(e) => { setDate(e.target.value); setError(null); }}
                className={inputClass}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {DATE_SHORTCUTS.map((s) => {
                  const value = toISO(s.get());
                  const active = date === value;
                  return (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => { setDate(value); setError(null); }}
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                        active
                          ? "border-[#16B8B1] bg-[#16B8B1]/10 text-[#0F9691] dark:text-[#16B8B1]"
                          : "border-slate-200 text-slate-500 hover:border-[#16B8B1]/30 hover:bg-[#16B8B1]/5 hover:text-[#0F9691] dark:border-white/10 dark:text-slate-400 dark:hover:text-[#16B8B1]"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Heure */}
            <div>
              <label htmlFor="interview-time" className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Clock size={15} className="text-[#16B8B1]" />
                Heure de l’entretien <span className="text-rose-500">*</span>
              </label>
              <input
                id="interview-time"
                type="time"
                required
                value={time}
                onChange={(e) => { setTime(e.target.value); setError(null); }}
                className={inputClass}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {TIME_SHORTCUTS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTime(t); setError(null); }}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold tabular-nums transition ${
                      time === t
                        ? "border-[#16B8B1] bg-[#16B8B1]/10 text-[#0F9691] dark:text-[#16B8B1]"
                        : "border-slate-200 text-slate-500 hover:border-[#16B8B1]/30 hover:bg-[#16B8B1]/5 hover:text-[#0F9691] dark:border-white/10 dark:text-slate-400 dark:hover:text-[#16B8B1]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Vérifiez le fuseau horaire avant d’envoyer l’invitation.
              </p>
            </div>

            {/* Lien */}
            <div>
              <label htmlFor="interview-link" className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Link2 size={15} className="text-[#16B8B1]" />
                Lien de visioconférence
                <span className="font-normal text-slate-400">(facultatif)</span>
              </label>
              <input
                id="interview-link"
                type="url"
                value={link}
                onChange={(e) => { setLink(e.target.value); setError(null); }}
                placeholder="https://meet.google.com/…"
                className={inputClass}
              />
              <p className="mt-2 text-[11px] leading-5 text-slate-400">
                Laissez ce champ vide si votre application génère automatiquement un lien.
              </p>
            </div>

            {/* Récapitulatif */}
            {recap && (
              <div className="flex items-center gap-3 rounded-2xl bg-[#0B1F33] px-4 py-3.5 text-white shadow-md">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#16B8B1]">
                  <Calendar size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] text-white/60">Créneau proposé</p>
                  <p className="truncate text-sm font-bold capitalize">{recap}</p>
                </div>
              </div>
            )}
          </div>

          {/* ===== Pied ===== */}
          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-[#131E47] sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-white/5"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !date || !time}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#16B8B1] px-5 py-2.5 text-sm font-bold text-[#0B1F33] shadow-md transition hover:bg-[#0F9691] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16B8B1] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {saving ? "Envoi en cours…" : "Envoyer l’invitation"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}