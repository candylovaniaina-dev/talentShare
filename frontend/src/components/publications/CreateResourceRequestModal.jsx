
import React, { useEffect, useState, useRef } from "react";
import {
  Check, ChevronLeft, ChevronRight, X, DollarSign, Zap, Users,
  Tag, AlertCircle, Plus, Sparkles, Loader2, BriefcaseBusiness,
  CalendarDays, MapPin, SlidersHorizontal,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

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

const SUGGESTED_TAGS = [
  "Développement", "Design", "Marketing", "Data", "DevOps",
  "Mobile", "Cloud", "Sécurité", "IA", "E-commerce",
];

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10";

const asArray = (data) =>
  Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];

export default function CreateResourceRequestModal({
  requestId,
  onClose,
  onSuccess,
}) {
  const { user } = useAuth();
  const isEdit = Boolean(requestId);

  const [step, setStep] = useState(0);
  const [company, setCompany] = useState(null);
  const [allSkills, setAllSkills] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingRequest, setLoadingRequest] = useState(isEdit);
  const [error, setError] = useState(null);
  const [tagInput, setTagInput] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    mission_type: "mission",
    skills: [],
    start_at: "",
    end_at: "",
    workload_percent: 100,
    remote: false,
    country: "Madagascar",
    city: "",
    expires_at: "",
    budget_min: "",
    budget_max: "",
    positions_count: 1,
    urgency: "normal",
    tags: [],
  });

  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    let active = true;

    api.get("/companies")
      .then((res) => {
        const all = asArray(res.data);
        if (active) {
          setCompany(all.find((c) => c.owner_user_id === user?.id) || null);
        }
      })
      .catch(() => {
        if (active) setError("Impossible de charger les informations de l’entreprise.");
      });

    api.get("/skills", { params: { limit: 500 } })
      .then((res) => {
        if (active) setAllSkills(asArray(res.data));
      })
      .catch(() => {
        if (active) setAllSkills([]);
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!isEdit) {
      setLoadingRequest(false);
      return;
    }

    let active = true;

    api.get(`/resource-requests/${requestId}`)
      .then((res) => {
        if (!active) return;
        const r = res.data;

        setForm({
          title: r.title || "",
          description: r.description || "",
          mission_type: r.mission_type || "mission",
          skills: (r.skills || []).map((s) => ({
            skill_id: s.id,
            name: s.name,
            min_level: s.pivot?.min_level || "intermediate",
            isCustom: false,
          })),
          start_at: r.start_at?.slice(0, 10) || "",
          end_at: r.end_at?.slice(0, 10) || "",
          workload_percent: r.workload_percent ?? 100,
          remote: r.remote || false,
          country: r.country || "Madagascar",
          city: r.city || "",
          expires_at: r.expires_at?.slice(0, 10) || "",
          budget_min: r.budget_min ?? "",
          budget_max: r.budget_max ?? "",
          positions_count: r.positions_count || 1,
          urgency: r.urgency || "normal",
          tags: Array.isArray(r.tags) ? r.tags : [],
        });
      })
      .catch(() => {
        if (active) setError("Impossible de charger cette demande.");
      })
      .finally(() => {
        if (active) setLoadingRequest(false);
      });

    return () => {
      active = false;
    };
  }, [requestId, isEdit]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const addSkillFromAutocomplete = (skill) => {
    const cleanName = skill.name.trim();
    if (!cleanName) return;

    if (
      form.skills.some(
        (s) => s.name.toLowerCase() === cleanName.toLowerCase()
      )
    ) return;

    const newSkill = skill.id
      ? {
          skill_id: skill.id,
          name: skill.name,
          min_level: "intermediate",
          isCustom: false,
        }
      : {
          skill_id: null,
          name: cleanName,
          min_level: "intermediate",
          isCustom: true,
        };

    setForm((current) => ({
      ...current,
      skills: [...current.skills, newSkill],
    }));
  };

  const setSkillLevel = (index, level) => {
    setForm((current) => ({
      ...current,
      skills: current.skills.map((s, i) =>
        i === index ? { ...s, min_level: level } : s
      ),
    }));
  };

  const removeSkill = (index) => {
    setForm((current) => ({
      ...current,
      skills: current.skills.filter((_, i) => i !== index),
    }));
  };

  const addTag = (tag) => {
    const clean = tag.trim();
    if (
      !clean ||
      form.tags.includes(clean) ||
      form.tags.length >= 10
    ) return;

    setForm((current) => ({
      ...current,
      tags: [...current.tags, clean],
    }));
    setTagInput("");
  };

  const removeTag = (tag) => {
    setForm((current) => ({
      ...current,
      tags: current.tags.filter((t) => t !== tag),
    }));
  };

  const canProceed = () => {
    if (step === 0) return Boolean(form.title.trim() && form.description.trim());
    if (step === 1) return form.skills.length > 0;
    if (step === 2) {
      return Boolean(
        form.start_at &&
        form.end_at &&
        form.end_at >= form.start_at
      );
    }
    return true;
  };

  const submit = async (status) => {
    setError(null);

    if (!company?.id) {
      setError("Votre entreprise est introuvable. Vérifiez votre compte entreprise.");
      return;
    }
    if (!form.title.trim()) {
      setStep(0);
      setError("Le titre de la demande est requis.");
      return;
    }
    if (!form.description.trim()) {
      setStep(0);
      setError("La description du besoin est requise.");
      return;
    }
    if (!form.skills.length) {
      setStep(1);
      setError("Ajoutez au moins une compétence requise.");
      return;
    }
    if (!form.start_at || !form.end_at || form.end_at < form.start_at) {
      setStep(2);
      setError("Vérifiez les dates de début et de fin.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        company_id: company.id,
        title: form.title,
        description: form.description,
        mission_type: form.mission_type,
        start_at: form.start_at,
        end_at: form.end_at,
        workload_percent: form.workload_percent,
        remote: form.remote,
        country: form.country,
        city: form.city || null,
        status,
        expires_at: form.expires_at || null,
        budget_min: form.budget_min === "" ? null : Number(form.budget_min),
        budget_max: form.budget_max === "" ? null : Number(form.budget_max),
        positions_count: Number(form.positions_count) || 1,
        urgency: form.urgency,
        tags: form.tags,
        skills: form.skills.map((s) =>
          s.skill_id
            ? { skill_id: s.skill_id, min_level: s.min_level }
            : { name: s.name, min_level: s.min_level }
        ),
      };

      if (isEdit) {
        await api.patch(`/resource-requests/${requestId}`, payload);
      } else {
        await api.post("/resource-requests", payload);
      }

      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message;
      const errors = err.response?.data?.errors;

      setError(
        msg ||
        (errors ? Object.values(errors).flat().join(" · ") : null) ||
        "Une erreur est survenue."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="resource-request-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/70 bg-slate-50 shadow-2xl shadow-slate-950/20"
      >
        <header className="border-b border-slate-200 bg-white px-5 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                <BriefcaseBusiness size={21} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700">
                  Espace entreprise
                </p>
                <h2 id="resource-request-title" className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  {isEdit ? "Modifier la demande" : "Trouver le bon talent"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Décrivez votre besoin pour trouver les compétences adaptées.
                </p>
              </div>
            </div>
            <button type="button" aria-label="Fermer" onClick={onClose} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
              <X size={19} />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-2">
            {STEPS.map((label, index) => {
              const active = index === step;
              const complete = index < step;

              return (
                <button
                  type="button"
                  key={label}
                  onClick={() => {
                    if (index < step) setStep(index);
                    else if (index === step + 1 && canProceed()) setStep(index);
                  }}
                  className="min-w-0 text-left"
                >
                  <div className={`mb-2 h-1.5 rounded-full transition ${
                    complete || active ? "bg-teal-600" : "bg-slate-200"
                  }`} />
                  <div className="flex items-center gap-1.5">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      complete
                        ? "bg-teal-600 text-white"
                        : active
                          ? "bg-slate-900 text-white"
                          : "bg-slate-200 text-slate-500"
                    }`}>
                      {complete ? <Check size={12} /> : index + 1}
                    </span>
                    <span className={`truncate text-[10px] font-semibold sm:text-xs ${
                      active ? "text-slate-900" : "text-slate-400"
                    }`}>{label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </header>

        <main className="flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-7">
          {error && (
            <div role="alert" className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loadingRequest ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 size={28} className="animate-spin text-teal-600" />
              <p className="text-sm">Chargement de la demande…</p>
            </div>
          ) : (
            <>
              {step === 0 && (
                <div className="space-y-5">
                  <SectionTitle icon={BriefcaseBusiness} number="01" title="Présentez votre besoin" description="Le titre et la description aideront les talents à comprendre votre projet." />

                  <Field label="Titre de la mission *">
                    <input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Ex. Développeur Laravel pour une refonte API" className={inputCls} />
                  </Field>

                  <Field label="Description du besoin *">
                    <textarea rows={5} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Contexte, objectifs, livrables attendus et compétences recherchées…" className={`${inputCls} resize-y`} />
                  </Field>

                  <Field label="Type de mission">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {MISSION_TYPES.map((t) => (
                        <Choice key={t.value} active={form.mission_type === t.value} onClick={() => update("mission_type", t.value)} label={t.label} />
                      ))}
                    </div>
                  </Field>

                  <Field label="Niveau d’urgence">
                    <div className="grid grid-cols-2 gap-3">
                      <Choice active={form.urgency === "normal"} onClick={() => update("urgency", "normal")} label="Normal" />
                      <Choice active={form.urgency === "urgent"} onClick={() => update("urgency", "urgent")} label={<span className="inline-flex items-center gap-2"><Zap size={15} /> Urgent</span>} />
                    </div>
                  </Field>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <SectionTitle icon={Sparkles} number="02" title="Compétences recherchées" description="Ajoutez les compétences indispensables et précisez le niveau minimum attendu." />

                  <SkillAutocomplete
                    allSkills={allSkills}
                    existingSkills={form.skills}
                    onAdd={addSkillFromAutocomplete}
                  />

                  {form.skills.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
                      <Sparkles className="mx-auto mb-3 text-slate-300" size={27} />
                      <p className="text-sm font-semibold text-slate-700">Aucune compétence ajoutée</p>
                      <p className="mt-1 text-xs text-slate-400">Recherchez une compétence ou ajoutez-en une personnalisée.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {form.skills.map((s, idx) => (
                        <div key={`${s.skill_id ?? "custom"}-${idx}`} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                              <Check size={15} />
                            </span>
                            <span className="truncate text-sm font-semibold text-slate-800">{s.name}</span>
                            {s.isCustom && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Personnalisée</span>}
                          </div>
                          <div className="flex items-center gap-2 pl-10 sm:pl-0">
                            <select value={s.min_level} onChange={(e) => setSkillLevel(idx, e.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 outline-none focus:border-teal-500 sm:flex-none">
                              {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                            </select>
                            <button type="button" aria-label={`Retirer ${s.name}`} onClick={() => removeSkill(idx)} className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600">
                              <X size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <SectionTitle icon={CalendarDays} number="03" title="Conditions de la mission" description="Planifiez la disponibilité, la localisation et les paramètres de votre demande." />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Début souhaité *">
                      <input type="date" value={form.start_at} onChange={(e) => update("start_at", e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Fin prévue *">
                      <input type="date" min={form.start_at || undefined} value={form.end_at} onChange={(e) => update("end_at", e.target.value)} className={inputCls} />
                    </Field>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Charge de travail</p>
                        <p className="mt-1 text-xs text-slate-500">Pourcentage de temps consacré à la mission</p>
                      </div>
                      <span className="rounded-xl bg-teal-50 px-3 py-2 text-sm font-bold text-teal-800">{form.workload_percent}%</span>
                    </div>
                    <input type="range" min="10" max="100" step="10" value={form.workload_percent} onChange={(e) => update("workload_percent", Number(e.target.value))} className="w-full accent-teal-600" />
                    <div className="mt-2 flex justify-between text-[10px] text-slate-400"><span>10 %</span><span>50 %</span><span>100 %</span></div>
                  </div>

                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-teal-200">
                    <input type="checkbox" checked={form.remote} onChange={(e) => update("remote", e.target.checked)} className="h-4 w-4 accent-teal-600" />
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">Télétravail possible</span>
                      <span className="mt-0.5 block text-xs text-slate-500">Le talent pourra travailler à distance.</span>
                    </span>
                  </label>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Pays">
                      <input value={form.country} onChange={(e) => update("country", e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Ville">
                      <input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Ex. Antananarivo" className={inputCls} />
                    </Field>
                  </div>

                  <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4 sm:p-5">
                    <p className="flex items-center gap-2 text-sm font-bold text-teal-900"><DollarSign size={17} /> Budget journalier <span className="text-xs font-medium text-teal-700">(optionnel)</span></p>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Minimum (€ / jour)">
                        <input type="number" min="0" value={form.budget_min} onChange={(e) => update("budget_min", e.target.value)} placeholder="300" className={inputCls} />
                      </Field>
                      <Field label="Maximum (€ / jour)">
                        <input type="number" min="0" value={form.budget_max} onChange={(e) => update("budget_max", e.target.value)} placeholder="500" className={inputCls} />
                      </Field>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                    <p className="flex items-center gap-2 text-sm font-bold text-slate-800"><Users size={17} className="text-teal-700" /> Nombre de postes</p>
                    <div className="mt-4 flex items-center gap-3">
                      <button type="button" aria-label="Diminuer le nombre de postes" onClick={() => update("positions_count", Math.max(1, Number(form.positions_count) - 1))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-lg font-semibold text-slate-700 transition hover:border-teal-400 hover:text-teal-700">−</button>
                      <span className="min-w-10 text-center text-xl font-bold text-slate-900">{form.positions_count}</span>
                      <button type="button" aria-label="Augmenter le nombre de postes" onClick={() => update("positions_count", Math.min(50, Number(form.positions_count) + 1))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-lg font-semibold text-slate-700 transition hover:border-teal-400 hover:text-teal-700">+</button>
                      <span className="text-sm text-slate-500">{form.positions_count > 1 ? "postes à pourvoir" : "poste à pourvoir"}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                    <p className="flex items-center gap-2 text-sm font-bold text-slate-800"><Tag size={17} className="text-teal-700" /> Domaines et tags <span className="text-xs font-medium text-slate-400">({form.tags.length}/10)</span></p>

                    {form.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {form.tags.map((tag) => (
                          <span key={tag} className="inline-flex items-center gap-1.5 rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-800">
                            {tag}
                            <button type="button" aria-label={`Retirer le tag ${tag}`} onClick={() => removeTag(tag)} className="text-teal-700/60 hover:text-rose-600"><X size={12} /></button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex gap-2">
                      <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); } }} placeholder="Ajouter un domaine…" className={`${inputCls} min-w-0 flex-1`} />
                      <button type="button" onClick={() => addTag(tagInput)} disabled={!tagInput.trim() || form.tags.length >= 10} className="flex items-center justify-center rounded-xl bg-slate-900 px-4 text-white transition hover:bg-teal-700 disabled:opacity-40"><Plus size={17} /></button>
                    </div>

                    {form.tags.length < 10 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {SUGGESTED_TAGS.filter((tag) => !form.tags.includes(tag)).slice(0, 6).map((tag) => (
                          <button type="button" key={tag} onClick={() => addTag(tag)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-500 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800">+ {tag}</button>
                        ))}
                      </div>
                    )}
                  </div>

                  <Field label="Expiration de l’annonce (optionnel)">
                    <input type="date" min={new Date().toISOString().split("T")[0]} value={form.expires_at} onChange={(e) => update("expires_at", e.target.value)} className={inputCls} />
                    <p className="mt-1.5 text-xs text-slate-400">Par défaut : 60 jours si publiée.</p>
                  </Field>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <SectionTitle icon={SlidersHorizontal} number="04" title="Vérifiez votre demande" description="Relisez les informations avant de publier votre annonce." />

                  <div className="rounded-2xl bg-slate-900 p-5 text-white sm:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      {form.urgency === "urgent" && <span className="inline-flex items-center gap-1 rounded-full bg-rose-400/15 px-2.5 py-1 text-[11px] font-semibold text-rose-200"><Zap size={12} /> Urgent</span>}
                      {form.positions_count > 1 && <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-200">{form.positions_count} postes</span>}
                      {form.remote && <span className="rounded-full bg-teal-400/15 px-2.5 py-1 text-[11px] font-semibold text-teal-200">Télétravail possible</span>}
                    </div>
                    <h3 className="mt-4 text-xl font-bold">{form.title || "Titre de votre demande"}</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{form.description || "La description de votre besoin apparaîtra ici."}</p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-300"><MapPin size={14} /> {[form.city, form.country].filter(Boolean).join(", ")}</div>
                  </div>

                  {form.skills.length > 0 && (
                    <PreviewSection title="Compétences recherchées">
                      <div className="flex flex-wrap gap-2">
                        {form.skills.map((s, i) => (
                          <span key={`${s.name}-${i}`} className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-800">
                            {s.name} · {LEVELS.find((l) => l.value === s.min_level)?.label}
                          </span>
                        ))}
                      </div>
                    </PreviewSection>
                  )}

                  {form.tags.length > 0 && (
                    <PreviewSection title="Domaines">
                      <div className="flex flex-wrap gap-2">
                        {form.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">{tag}</span>)}
                      </div>
                    </PreviewSection>
                  )}

                  <PreviewSection title="Conditions de la mission">
                    <div className="space-y-0 rounded-2xl border border-slate-200 bg-white px-4">
                      <PreviewRow label="Type" value={MISSION_TYPES.find((t) => t.value === form.mission_type)?.label || form.mission_type} />
                      <PreviewRow label="Période" value={`${form.start_at || "—"} → ${form.end_at || "—"}`} />
                      <PreviewRow label="Charge" value={`${form.workload_percent}%`} />
                      <PreviewRow label="Localisation" value={[form.city, form.country].filter(Boolean).join(", ") || "—"} />
                      <PreviewRow label="Expiration" value={form.expires_at || "60 jours par défaut"} />
                      <PreviewRow label="Budget" value={form.budget_min !== "" && form.budget_max !== "" ? `${form.budget_min} – ${form.budget_max} €/jour` : "Non précisé"} />
                    </div>
                  </PreviewSection>
                </div>
              )}
            </>
          )}
        </main>

        <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep((s) => Math.max(0, s - 1));
            }}
            disabled={step === 0 || submitting || loadingRequest}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:invisible"
          >
            <ChevronLeft size={16} /> Retour
          </button>

          <div className="flex flex-1 justify-end gap-2">
            {step < STEPS.length - 1 ? (
              <>
                <button type="button" onClick={onClose} className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 sm:block">Annuler</button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    if (!canProceed()) {
                      setError(
                        step === 0
                          ? "Le titre et la description sont requis."
                          : step === 1
                            ? "Ajoutez au moins une compétence."
                            : "Vérifiez les dates de la mission."
                      );
                      return;
                    }
                    setStep((s) => Math.min(STEPS.length - 1, s + 1));
                  }}
                  disabled={loadingRequest}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
                >
                  Continuer <ChevronRight size={16} />
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => submit("draft")} disabled={submitting || loadingRequest} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:px-4">
                  Brouillon
                </button>
                <button type="button" onClick={() => submit("published")} disabled={submitting || loadingRequest} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50 sm:px-5">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  <span>{submitting ? "Publication…" : "Publier la demande"}</span>
                </button>
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

function SkillAutocomplete({ allSkills, existingSkills, onAdd }) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const cleanQuery = query.trim().toLowerCase();

  const suggestions = cleanQuery
    ? allSkills.filter((skill) => {
        const alreadyAdded = existingSkills.some(
          (existing) =>
            existing.skill_id === skill.id ||
            existing.name?.toLowerCase() === skill.name.toLowerCase()
        );
        return !alreadyAdded && skill.name.toLowerCase().includes(cleanQuery);
      }).slice(0, 6)
    : [];

  const exactMatch = suggestions.find(
    (s) => s.name.toLowerCase() === cleanQuery
  );

  const handleSubmit = () => {
    const clean = query.trim();
    if (!clean) return;

    if (exactMatch) onAdd({ id: exactMatch.id, name: exactMatch.name });
    else onAdd({ id: null, name: clean });

    setQuery("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Field label="Rechercher ou créer une compétence *">
        <div className="relative">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ex. Laravel, React, UX design…"
            className={`${inputCls} pr-20`}
          />
          <button type="button" onClick={handleSubmit} disabled={!query.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:opacity-40">
            <Plus size={13} /> Ajouter
          </button>
        </div>
      </Field>

      {showSuggestions && cleanQuery && (
        <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          {suggestions.length === 0 ? (
            <button type="button" onClick={handleSubmit} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-teal-50">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Plus size={15} /></span>
              <span className="min-w-0 flex-1 text-slate-700">Créer <strong>« {query.trim()} »</strong></span>
              <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">Personnalisée</span>
            </button>
          ) : (
            <>
              {suggestions.map((skill) => (
                <button key={skill.id} type="button" onClick={() => { onAdd({ id: skill.id, name: skill.name }); setQuery(""); setShowSuggestions(false); inputRef.current?.focus(); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-teal-50">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><Plus size={15} /></span>
                  {skill.name}
                </button>
              ))}
              {!exactMatch && (
                <button type="button" onClick={handleSubmit} className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-amber-50">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Plus size={15} /></span>
                  Créer « {query.trim()} »
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ icon: Icon, number, title, description }) {
  return (
    <div className="mb-2 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-700"><Icon size={18} /></div>
      <div>
        <p className="text-[10px] font-bold tracking-[0.16em] text-teal-700">{number}</p>
        <h3 className="mt-0.5 text-base font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function Choice({ active, onClick, label }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
      active
        ? "border-teal-500 bg-teal-50 text-teal-800 ring-2 ring-teal-500/10"
        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
    }`}>
      <span className="flex items-center justify-center gap-2">{active && <Check size={15} />}{label}</span>
    </button>
  );
}

function PreviewSection({ title, children }) {
  return (
    <section>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
      {children}
    </section>
  );
}

function PreviewRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-0">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="max-w-[65%] text-right text-xs font-semibold text-slate-800">{value}</dd>
    </div>
  );
}
