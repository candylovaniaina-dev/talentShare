import React, { useEffect, useState } from "react";
import {
  X, Plus, Loader2, AlertCircle, GraduationCap, RotateCcw, Briefcase,
  MapPin, Globe, Calendar, Laptop, Banknote, Clock, FileText, Check, ShieldCheck,
} from "lucide-react";
import api from "../../services/api";

export const JOB_OFFER_TYPES = [
  { value: "internship", label: "Stage", hint: "Durée déterminée", icon: GraduationCap },
  { value: "apprenticeship", label: "Alternance", hint: "Rythme école / entreprise", icon: RotateCcw },
  { value: "fixed_term", label: "CDD", hint: "Contrat à durée déterminée", icon: Calendar },
  { value: "permanent", label: "Recrutement permanent", hint: "CDI · sans date de fin", icon: Briefcase },
];

// Durée proposée par défaut selon le type (en mois) — la date de fin est calculée automatiquement à l'embauche
const DEFAULT_MONTHS = { internship: 3, apprenticeship: 12, fixed_term: 6 };
const DURATION_CHOICES = {
  internship: [2, 3, 4, 6],
  apprenticeship: [6, 12, 24, 36],
  fixed_term: [3, 6, 12, 18, 24],
};

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition " +
  "focus:border-[#16B8B1] focus:ring-4 focus:ring-[#16B8B1]/15 dark:border-white/10 dark:bg-[#0A1230] dark:text-white";

function Field({ label, icon: Icon, children }) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
        {Icon && <Icon size={13} className="text-[#16B8B1]" />}
        {label}
      </label>
      {children}
    </div>
  );
}

export default function CreateJobOfferModal({ company, presetType = "internship", onClose, onSuccess }) {
  const initialType = JOB_OFFER_TYPES.some((t) => t.value === presetType) ? presetType : "internship";

  const [form, setForm] = useState({
    title: "",
    description: "",
    offer_type: initialType,
    duration_months: DEFAULT_MONTHS[initialType] ?? "",
    trial_enabled: true,
    remote: false,
    country: "Madagascar",
    city: "",
    application_deadline: "",
    salary_min: "",
    salary_max: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const update = (key, value) => setForm((c) => ({ ...c, [key]: value }));

  const isPermanent = ["permanent", "first_job"].includes(form.offer_type);
  const needsDuration = !isPermanent;

  const changeType = (value) => {
    setForm((c) => ({
      ...c,
      offer_type: value,
      duration_months: DEFAULT_MONTHS[value] ?? "",
    }));
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !saving) onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, saving]);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.title.trim().length < 5) return setError("Le titre doit faire au moins 5 caractères.");
    if (form.description.trim().length < 20) return setError("La description doit faire au moins 20 caractères.");

    const months = Number(form.duration_months);
    if (needsDuration && (!months || months < 1 || months > 60)) {
      return setError("Indiquez une durée entre 1 et 60 mois.");
    }

    const min = form.salary_min === "" ? null : Number(form.salary_min);
    const max = form.salary_max === "" ? null : Number(form.salary_max);
    if (min !== null && max !== null && max < min) {
      return setError("La rémunération maximale doit être supérieure au minimum.");
    }

    setSaving(true);
    try {
      const payload = {
        company_id: company.id,
        title: form.title.trim(),
        description: form.description.trim(),
        offer_type: form.offer_type,
        remote: form.remote,
        country: form.country,
        city: form.city || null,
        status: "published",
        application_deadline: form.application_deadline || null,
        // La date de fin du contrat sera calculée automatiquement : début + durée
        duration_months: needsDuration ? months : null,
        duration_text: needsDuration ? `${months} mois` : null,
        // Période d'essai de 1 mois pour un CDI (optionnelle)
        trial_enabled: isPermanent ? form.trial_enabled : false,
        salary_min: min,
        salary_max: max,
      };
      if (min !== null || max !== null) payload.currency = "MGA";

      await api.post("/job-offers", payload);
      onSuccess();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(
        (errors && Object.values(errors).flat()[0]) ||
          err.response?.data?.message ||
          "Impossible de publier l'offre."
      );
    } finally {
      setSaving(false);
    }
  };

  const choices = DURATION_CHOICES[form.offer_type] || [];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#06141F]/70 p-3 font-['Plus_Jakarta_Sans',sans-serif] backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-offer-title"
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,.6)] dark:bg-[#131E47]"
      >
        {/* En-tête */}
        <header className="relative shrink-0 overflow-hidden bg-[#0B1F33] px-6 py-5 text-white">
          <span className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#16B8B1]/20 blur-3xl" />
          <span
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "18px 18px" }}
          />
          <div className="relative flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#16B8B1] ring-1 ring-white/15">
              <Briefcase size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="job-offer-title" className="truncate text-lg font-bold tracking-tight">
                Publier une offre de recrutement
              </h2>
              <p className="mt-0.5 truncate text-xs text-white/70">
                Stage, alternance ou emploi · {company?.name || "Votre entreprise"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Fermer"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white disabled:opacity-50"
            >
              <X size={17} />
            </button>
          </div>
        </header>

        {/* Corps */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <form id="job-offer-form" onSubmit={submit} className="space-y-5">
            {error && (
              <div role="alert" className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Type de recrutement</p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {JOB_OFFER_TYPES.map((opt) => {
                  const active = form.offer_type === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => changeType(opt.value)}
                      className={`relative flex items-start gap-3 rounded-2xl border p-3.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16B8B1] ${
                        active
                          ? "border-[#16B8B1] bg-[#16B8B1]/5 ring-4 ring-[#16B8B1]/10"
                          : "border-slate-200 bg-white hover:border-[#16B8B1]/40 hover:bg-slate-50 dark:border-white/10 dark:bg-[#0A1230] dark:hover:bg-white/5"
                      }`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active ? "bg-[#0B1F33] text-[#16B8B1]" : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"}`}>
                        <opt.icon size={17} />
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-[13px] font-bold ${active ? "text-[#0B1F33] dark:text-white" : "text-slate-800 dark:text-slate-200"}`}>{opt.label}</span>
                        <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">{opt.hint}</span>
                      </span>
                      {active && (
                        <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#16B8B1] text-[#0B1F33]">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label="Intitulé du poste *" icon={Briefcase}>
              <input
                required
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Ex. Développeur web junior"
                className={inputCls}
              />
            </Field>

            <Field label="Description *" icon={FileText}>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Missions, profil recherché, compétences attendues…"
                className={`${inputCls} resize-y`}
              />
              <p className={`mt-1 text-right text-[11px] ${form.description.trim().length < 20 ? "text-amber-500" : "text-slate-400"}`}>
                {form.description.length} caractères · 20 minimum
              </p>
            </Field>

            {/* Durée du contrat (stage / alternance / CDD) */}
            {needsDuration && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                <Field label="Durée du contrat (en mois) *" icon={Clock}>
                  <div className="flex flex-wrap items-center gap-2">
                    {choices.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => update("duration_months", m)}
                        aria-pressed={Number(form.duration_months) === m}
                        className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                          Number(form.duration_months) === m
                            ? "border-[#16B8B1] bg-[#0B1F33] text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-[#16B8B1]/50 dark:border-white/10 dark:bg-[#0A1230] dark:text-slate-300"
                        }`}
                      >
                        {m} mois
                      </button>
                    ))}
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={form.duration_months}
                      onChange={(e) => update("duration_months", e.target.value)}
                      aria-label="Durée en mois"
                      className={`${inputCls} !w-24`}
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">mois</span>
                  </div>
                </Field>
                <p className="mt-2.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                  À l'embauche, la date de fin est calculée automatiquement : date de début + {form.duration_months || "…"} mois.
                </p>
              </div>
            )}

            {/* Période d'essai (CDI) */}
            {isPermanent && (
              <button
                type="button"
                role="switch"
                aria-checked={form.trial_enabled}
                onClick={() => update("trial_enabled", !form.trial_enabled)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                  form.trial_enabled
                    ? "border-[#16B8B1] bg-[#16B8B1]/5 ring-4 ring-[#16B8B1]/10"
                    : "border-slate-200 bg-white hover:border-[#16B8B1]/40 dark:border-white/10 dark:bg-[#0A1230]"
                }`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${form.trial_enabled ? "bg-[#0B1F33] text-[#16B8B1]" : "bg-slate-100 text-slate-500 dark:bg-white/5"}`}>
                  <ShieldCheck size={17} />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold text-slate-800 dark:text-white">Période d'essai d'1 mois</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    Après l'essai, vous confirmez le talent en CDI (sans date de fin).
                  </span>
                </span>
                <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${form.trial_enabled ? "bg-[#16B8B1]" : "bg-slate-300 dark:bg-slate-600"}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.trial_enabled ? "left-[22px]" : "left-0.5"}`} />
                </span>
              </button>
            )}

            <Field label="Date limite de candidature" icon={Calendar}>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={form.application_deadline}
                onChange={(e) => update("application_deadline", e.target.value)}
                className={inputCls}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Rémunération minimum (Ar / mois)" icon={Banknote}>
                <input type="number" min="0" value={form.salary_min} onChange={(e) => update("salary_min", e.target.value)} placeholder="Optionnel" className={inputCls} />
              </Field>
              <Field label="Rémunération maximum (Ar / mois)" icon={Banknote}>
                <input type="number" min="0" value={form.salary_max} onChange={(e) => update("salary_max", e.target.value)} placeholder="Optionnel" className={inputCls} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ville" icon={MapPin}>
                <input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Antananarivo" className={inputCls} />
              </Field>
              <Field label="Pays" icon={Globe}>
                <input value={form.country} onChange={(e) => update("country", e.target.value)} className={inputCls} />
              </Field>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={form.remote}
              onClick={() => update("remote", !form.remote)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                form.remote
                  ? "border-[#16B8B1] bg-[#16B8B1]/5 ring-4 ring-[#16B8B1]/10"
                  : "border-slate-200 bg-white hover:border-[#16B8B1]/40 dark:border-white/10 dark:bg-[#0A1230]"
              }`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${form.remote ? "bg-[#0B1F33] text-[#16B8B1]" : "bg-slate-100 text-slate-500 dark:bg-white/5"}`}>
                <Laptop size={17} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-bold text-slate-800 dark:text-white">Télétravail possible</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">Le poste peut être effectué à distance.</span>
              </span>
              <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${form.remote ? "bg-[#16B8B1]" : "bg-slate-300 dark:bg-slate-600"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.remote ? "left-[22px]" : "left-0.5"}`} />
              </span>
            </button>
          </form>
        </div>

        {/* Pied */}
        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-3.5 dark:border-white/10 dark:bg-white/5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-transparent dark:text-slate-300"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="job-offer-form"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#16B8B1] px-5 py-2.5 text-sm font-bold text-[#0B1F33] shadow-lg shadow-[#16B8B1]/20 transition hover:bg-[#0F9691] hover:text-white disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {saving ? "Publication…" : "Publier l'offre"}
          </button>
        </footer>
      </div>
    </div>
  );
}