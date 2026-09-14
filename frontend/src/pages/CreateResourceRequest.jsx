import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const STEPS = ["Le besoin", "Compétences", "Conditions", "Aperçu"];
const MISSION_TYPES = [
  { value: "mission", label: "Mission ponctuelle" },
  { value: "staffing", label: "Mise à disposition" },
  { value: "freelance", label: "Freelance" },
  { value: "other", label: "Autre" },
];
const LEVELS = [
  { value: "beginner", label: "Débutant" },
  { value: "intermediate", label: "Intermédiaire" },
  { value: "advanced", label: "Avancé" },
  { value: "expert", label: "Expert" },
];

export default function CreateResourceRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [company, setCompany] = useState(null);
  const [allSkills, setAllSkills] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    title: "", description: "", mission_type: "mission",
    skills: [], // [{ skill_id, name, min_level }]
    start_at: "", end_at: "", workload_percent: 100, remote: false,
    country: "Madagascar", city: "", expires_at: "",
  });

  useEffect(() => {
    api.get("/companies").then((res) => setCompany(res.data.find((c) => c.owner_user_id === user.id)));
    api.get("/skills").then((res) => setAllSkills(res.data));
  }, [user.id]);

  const addSkill = (skillId) => {
    const skill = allSkills.find((s) => s.id === Number(skillId));
    if (!skill || form.skills.some((s) => s.skill_id === skill.id)) return;
    setForm({ ...form, skills: [...form.skills, { skill_id: skill.id, name: skill.name, min_level: "intermediate" }] });
  };

  const setSkillLevel = (skillId, level) => {
    setForm({ ...form, skills: form.skills.map((s) => s.skill_id === skillId ? { ...s, min_level: level } : s) });
  };

  const removeSkill = (skillId) => {
    setForm({ ...form, skills: form.skills.filter((s) => s.skill_id !== skillId) });
  };

  const canProceed = () => {
    if (step === 0) return form.title.trim() && form.description.trim();
    if (step === 1) return form.skills.length > 0;
    if (step === 2) return form.start_at && form.end_at;
    return true;
  };

  const submit = async (status) => {
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/resource-requests", {
        company_id: company.id,
        title: form.title,
        description: form.description,
        start_at: form.start_at,
        end_at: form.end_at,
        workload_percent: form.workload_percent,
        remote: form.remote,
        country: form.country,
        city: form.city || null,
        status,
        expires_at: form.expires_at || null,
        skills: form.skills.map(({ skill_id, min_level }) => ({ skill_id, min_level })),
      });
      navigate("/resource-requests");
    } catch (err) {
      setError(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!company) {
    return <AppShell><p className="text-slate-500">Créez d'abord votre entreprise dans "Mon entreprise".</p></AppShell>;
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-bold">Nouvelle demande de ressource</h1>

      {/* Barre de progression */}
      <div className="mt-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              i < step ? "bg-mint text-navy" : i === step ? "bg-navy text-white" : "bg-slate-100 text-slate-400"
            }`}>
              {i < step ? <Check size={14} /> : i + 1}
            </div>
            <span className={`hidden text-xs font-semibold sm:block ${i === step ? "text-navy" : "text-slate-400"}`}>{s}</span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-slate-200" />}
          </div>
        ))}
      </div>

      <div className="mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6">
        {/* Étape 1 */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Titre de la mission</label>
              <input required placeholder="Ex. Développeur Laravel senior pour refonte API"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Description du besoin</label>
              <textarea required rows={5} placeholder="Décrivez le contexte, les objectifs et les livrables attendus..."
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Type de mission</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {MISSION_TYPES.map((t) => (
                  <button key={t.value} type="button" onClick={() => setForm({ ...form, mission_type: t.value })}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium ${form.mission_type === t.value ? "border-mint bg-mint/10" : "border-slate-200"}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Étape 2 */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Ajouter une compétence requise</label>
              <select onChange={(e) => { addSkill(e.target.value); e.target.value = ""; }}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" defaultValue="">
                <option value="" disabled>Choisir une compétence...</option>
                {allSkills.filter((s) => !form.skills.some((fs) => fs.skill_id === s.id)).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {form.skills.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-400">Aucune compétence ajoutée pour l'instant.</p>
            ) : (
              <div className="space-y-2">
                {form.skills.map((s) => (
                  <div key={s.skill_id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                    <span className="font-medium">{s.name}</span>
                    <div className="flex items-center gap-2">
                      <select value={s.min_level} onChange={(e) => setSkillLevel(s.skill_id, e.target.value)}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-sm">
                        {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                      <button onClick={() => removeSkill(s.skill_id)} className="text-red-500"><X size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Étape 3 */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Début souhaité</label>
                <input type="date" required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Fin prévue</label>
                <input type="date" required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Charge de travail : {form.workload_percent}%</label>
              <input type="range" min="10" max="100" step="10" className="mt-2 w-full"
                value={form.workload_percent} onChange={(e) => setForm({ ...form, workload_percent: Number(e.target.value) })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.remote} onChange={(e) => setForm({ ...form, remote: e.target.checked })} />
              Télétravail possible
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Pays</label>
                <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Ville</label>
                <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Date d'expiration de l'annonce (optionnel)</label>
              <input type="date" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
            </div>
          </div>
        )}

        {/* Étape 4 */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Titre</p>
              <p className="font-bold">{form.title}</p>
              <p className="mt-1 text-sm text-slate-500">{form.description}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Compétences requises</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {form.skills.map((s) => (
                  <span key={s.skill_id} className="rounded-full bg-mint/15 px-3 py-1 text-xs font-semibold text-navy">
                    {s.name} · {LEVELS.find((l) => l.value === s.min_level)?.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs font-semibold uppercase text-slate-400">Période</p><p>{form.start_at} → {form.end_at}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-400">Charge</p><p>{form.workload_percent}% {form.remote && "· télétravail"}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-400">Lieu</p><p>{form.city ? `${form.city}, ` : ""}{form.country}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-400">Expiration</p><p>{form.expires_at || "Non définie"}</p></div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3 border-t border-slate-100 pt-4">
              <button onClick={() => submit("draft")} disabled={submitting}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold hover:border-navy disabled:opacity-60">
                Enregistrer en brouillon
              </button>
              <button onClick={() => submit("published")} disabled={submitting}
                className="flex-1 rounded-xl bg-navy py-2.5 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-60">
                {submitting ? "Publication..." : "Publier la demande"}
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        {step < 3 && (
          <div className="mt-6 flex justify-between border-t border-slate-100 pt-4">
            <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
              className="flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 disabled:opacity-0">
              <ChevronLeft size={16} /> Retour
            </button>
            <button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}
              className="flex items-center gap-1 rounded-xl bg-navy px-5 py-2 text-sm font-semibold text-white disabled:opacity-40">
              Continuer <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}