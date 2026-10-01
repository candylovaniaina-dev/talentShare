import React, { useState } from "react";
import { X, Calendar, Clock, Video, Loader2, AlertCircle, Link2 } from "lucide-react";
import api from "../services/api";

export default function ScheduleInterviewModal({ application, onClose, onSuccess }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [link, setLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!date || !time) {
      setError("Date et heure obligatoires.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const interview_at = `${date}T${time}:00`;
      const res = await api.post(`/applications/${application.id}/schedule-interview`, {
        interview_at,
        interview_link: link || null,
      });
      onSuccess(res.data.application);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la programmation.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0F1E45] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Entretien</p>
            <h2 className="mt-0.5 text-lg font-bold text-white">Proposer un créneau</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <p className="mb-4 text-sm text-slate-400">
          Un email sera automatiquement envoyé au candidat avec une invitation
          qui s'ajoute à son calendrier (Google Calendar, Outlook...).
        </p>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <Calendar size={11} /> Date *
            </label>
            <input
              type="date"
              required
              min={new Date().toISOString().split("T")[0]}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <Clock size={11} /> Heure *
            </label>
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <Link2 size={11} /> Lien visio (optionnel)
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://meet.google.com/... (auto si vide)"
              className={inputCls}
            />
            <p className="mt-1 text-xs text-slate-500">
              Laisse vide pour générer un lien Jitsi automatique
            </p>
          </div>

          <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Video size={14} />}
              {saving ? "Envoi..." : "Envoyer l'invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}