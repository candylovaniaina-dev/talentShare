import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  X, Loader2, AlertCircle, Check, BriefcaseBusiness, CalendarDays, MapPin, Sparkles,
  ChevronRight, ChevronLeft, Search, Laptop, Users, Plus, Minus, Clock, Zap, Wallet,
  Rocket, Handshake,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const STEPS = [
  { label: "Le besoin", icon: BriefcaseBusiness },
  { label: "Compétences", icon: Sparkles },
  { label: "Conditions", icon: CalendarDays },
];

const MISSION_TYPES = [
  { value: "mission", label: "Mission ponctuelle", hint: "Projet à durée limitée", icon: Rocket },
  { value: "staffing", label: "Mise à disposition", hint: "Renfort d'équipe", icon: Handshake },
  { value: "freelance", label: "Prestation freelance", hint: "Travailleur indépendant", icon: Laptop },
];

const LEVELS = [
  { value: "beginner", label: "Débutant" },
  { value: "intermediate", label: "Intermédiaire" },
  { value: "advanced", label: "Avancé" },
  { value: "expert", label: "Expert" },
];

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition " +
  "focus:border-[#16B8B1] focus:ring-4 focus:ring-[#16B8B1]/15 dark:border-white/10 dark:bg-[#0A1230] dark:text-white";

const asArray = (data) => (Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []);
const normalize = (s = "") => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function CreateResourceRequestModal({ requestId, onClose, onSuccess }) {
  const { user } = useAuth();
  const isEdit = Boolean(requestId);

  const [step, setStep] = useState(0);
  const [company, setCompany] = useState(null);
  const [allSkills, setAllSkills] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingRequest, setLoadingRequest] = useState(isEdit);
  const [error, setError] = useState(null);

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

  const update = (key, value) => setForm((c) => ({ ...c, [key]: value }));

  /* ---------- Chargements ---------- */
  useEffect(() => {
    let active = true;

    api.get("/companies")
      .then((res) => {
        const all = asArray(res.data);
        if (active) setCompany(all.find((c) => c.owner_user_id === user?.id) || null);
      })
      .catch(() => active && setError("Impossible de charger les informations de l’entreprise."));

    api.get("/skills", { params: { limit: 500 } })
      .then((res) => active && setAllSkills(asArray(res.data)))
      .catch(() => active && setAllSkills([]));

    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    if (!isEdit) { setLoadingRequest(false); return; }
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
      .catch(() => active && setError("Impossible de charger cette demande."))
      .finally(() => active && setLoadingRequest(false));

    return () => { active = false; };
  }, [requestId, isEdit]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  /* ---------- Compétences ---------- */
  const addSkill = (skill) => {
    const cleanName = skill.name.trim();
    if (!cleanName) return;
    if (form.skills.some((s) => s.name.toLowerCase() === cleanName.toLowerCase())) return;

    const newSkill = skill.id
      ? { skill_id: skill.id, name: skill.name, min_level: "intermediate", isCustom: false }
      : { skill_id: null, name: cleanName, min_level: "intermediate", isCustom: true };

    setForm((c) => ({ ...c, skills: [...c.skills, newSkill] }));
  };

  const setSkillLevel = (index, level) =>
    setForm((c) => ({ ...c, skills: c.skills.map((s, i) => (i === index ? { ...s, min_level: level } : s)) }));

  const removeSkill = (index) =>
    setForm((c) => ({ ...c, skills: c.skills.filter((_, i) => i !== index) }));

  /* ---------- Navigation ---------- */
  const canProceed = (s = step) => {
    if (s === 0) return Boolean(form.title.trim() && form.description.trim());
    if (s === 1) return form.skills.length > 0;
    if (s === 2) return Boolean(form.start_at && form.end_at && form.end_at >= form.start_at);
    return true;
  };

  const stepError = (s) =>
    s === 0 ? "Le titre et la description sont requis."
    : s === 1 ? "Ajoutez au moins une compétence."
    : "Vérifiez les dates de la mission.";

  const goNext = () => {
    setError(null);
    if (!canProceed()) return setError(stepError(step));
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const goTo = (target) => {
    if (target > step) {
      for (let s = step; s < target; s += 1) {
        if (!canProceed(s)) return setError(stepError(s));
      }
    }
    setError(null);
    setStep(target);
  };

  const submit = async (status) => {
    setError(null);

    if (!company?.id) return setError("Votre entreprise est introuvable. Vérifiez votre compte entreprise.");
    for (let s = 0; s < STEPS.length; s += 1) {
      if (!canProceed(s)) { setStep(s); return setError(stepError(s)); }
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
          s.skill_id ? { skill_id: s.skill_id, min_level: s.min_level } : { name: s.name, min_level: s.min_level }
        ),
      };

      if (isEdit) await api.patch(`/resource-requests/${requestId}`, payload);
      else await api.post("/resource-requests", payload);

      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message;
      const errors = err.response?.data?.errors;
      setError(msg || (errors ? Object.values(errors).flat().join(" · ") : null) || "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  const isLast = step === STEPS.length - 1;
  const missionLabel = MISSION_TYPES.find((t) => t.value === form.mission_type)?.label || "Autre besoin";
  const budgetText =
    form.budget_min !== "" && form.budget_max !== "" ? `${form.budget_min} – ${form.budget_max} €/jour`
    : form.budget_min !== "" ? `dès ${form.budget_min} €/jour`
    : form.budget_max !== "" ? `jusqu’à ${form.budget_max} €/jour`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#06141F]/70 p-3 backdrop-blur-sm sm:p-6 font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="resource-request-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-[#0B1F33]/40 dark:bg-[#131E47]"
      >
        {/* ===== En-tête marine + progression ===== */}
        <header className="relative shrink-0 overflow-hidden bg-[#0B1F33] px-5 pb-5 pt-5 text-white sm:px-7">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#16B8B1]/20 blur-3xl" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
          />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#16B8B1] ring-1 ring-white/15">
                <BriefcaseBusiness size={20} />
              </div>
              <div className="min-w-0">
                <h2 id="resource-request-title" className="text-lg font-bold tracking-tight sm:text-xl">
                  {isEdit ? "Modifier la demande" : "Trouver le bon talent"}
                </h2>
                <p className="mt-0.5 text-sm text-white/70">
                  Décrivez un besoin de compétences pour une mission.
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Fermer"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <ol className="relative mt-5 grid grid-cols-3 gap-3">
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              const Icon = s.icon;
              return (
                <li key={s.label}>
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    disabled={loadingRequest}
                    aria-current={active ? "step" : undefined}
                    className="group w-full text-left focus:outline-none"
                  >
                    <span className={`block h-1 rounded-full transition-all ${done || active ? "bg-[#16B8B1]" : "bg-white/20"} ${active ? "shadow-[0_0_12px_rgba(22,184,177,0.7)]" : ""}`} />
                    <span className="mt-3 flex items-center gap-2">
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition ${active ? "bg-white text-[#0B1F33]" : done ? "bg-[#16B8B1] text-[#0B1F33]" : "bg-white/10 text-white/70"}`}>
                        {done ? <Check size={13} /> : i + 1}
                      </span>
                      <span className={`truncate text-xs font-medium ${active ? "text-white" : "text-white/60 group-hover:text-white/90"}`}>{s.label}</span>
                      <Icon size={14} className="ml-auto hidden text-white/40 lg:block" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </header>

        {/* ===== Corps ===== */}
        <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[1fr_300px]">
          <main className="min-h-0 space-y-6 overflow-y-auto px-5 py-6 sm:px-7">
            {error && (
              <div role="alert" className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {loadingRequest ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-500">
                <Loader2 size={28} className="animate-spin text-[#16B8B1]" />
                <p className="text-sm">Chargement de la demande…</p>
              </div>
            ) : (
              <>
                {/* ----- 1. Le besoin ----- */}
                {step === 0 && (
                  <StepBlock title="Présentez votre besoin" text="Le titre et la description aideront les talents à comprendre votre projet.">
                    <Field label="Titre de la mission *">
                      <input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Ex. Développeur Laravel pour une refonte API" className={inputCls} />
                    </Field>

                    <Field label="Description du besoin *">
                      <textarea rows={5} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Contexte, objectifs, livrables attendus…" className={`${inputCls} resize-y`} />
                    </Field>

                    <Field label="Type de mission">
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                        {MISSION_TYPES.map((t) => (
                          <ChoiceCard key={t.value} active={form.mission_type === t.value} onClick={() => update("mission_type", t.value)} {...t} />
                        ))}
                      </div>
                    </Field>

                    <Field label="Niveau d’urgence">
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        <ChoiceCard active={form.urgency === "normal"} onClick={() => update("urgency", "normal")} label="Normal" hint="Sans échéance pressante" icon={Clock} />
                        <ChoiceCard active={form.urgency === "urgent"} onClick={() => update("urgency", "urgent")} label="Urgent" hint="Mis en avant auprès des talents" icon={Zap} tone="rose" />
                      </div>
                    </Field>
                  </StepBlock>
                )}

                {/* ----- 2. Compétences ----- */}
                {step === 1 && (
                  <StepBlock title="Compétences recherchées" text="Ajoutez les compétences indispensables et le niveau minimum attendu.">
                    <SkillAutocomplete allSkills={allSkills} existingSkills={form.skills} onAdd={addSkill} />

                    {form.skills.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center dark:border-white/10 dark:bg-white/5">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B1F33] text-[#16B8B1]">
                          <Sparkles size={22} />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Aucune compétence ajoutée</p>
                        <p className="mt-1 text-xs text-slate-400">Recherchez une compétence ou créez-en une personnalisée.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {form.skills.map((s, idx) => (
                          <div key={`${s.skill_id ?? "custom"}-${idx}`} className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-white/10 dark:bg-[#0A1230]">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-2.5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#16B8B1]/10 text-[#0F9691]"><Check size={15} /></span>
                                <span className="truncate text-sm font-semibold text-slate-800 dark:text-white">{s.name}</span>
                                {s.isCustom && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">Personnalisée</span>}
                              </div>
                              <button type="button" aria-label={`Retirer ${s.name}`} onClick={() => removeSkill(idx)} className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"><X size={15} /></button>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-slate-100/80 p-1 sm:grid-cols-4 dark:bg-white/5">
                              {LEVELS.map((l) => (
                                <button
                                  key={l.value}
                                  type="button"
                                  aria-pressed={s.min_level === l.value}
                                  onClick={() => setSkillLevel(idx, l.value)}
                                  className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                                    s.min_level === l.value
                                      ? "bg-[#0B1F33] text-white shadow-sm"
                                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                                  }`}
                                >
                                  {l.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </StepBlock>
                )}

                {/* ----- 3. Conditions ----- */}
                {step === 2 && (
                  <StepBlock title="Conditions de la mission" text="Période, charge de travail, lieu et budget de votre demande.">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Début souhaité *">
                        <input type="date" value={form.start_at} onChange={(e) => update("start_at", e.target.value)} className={inputCls} />
                      </Field>
                      <Field label="Fin prévue *">
                        <input type="date" min={form.start_at || undefined} value={form.end_at} onChange={(e) => update("end_at", e.target.value)} className={inputCls} />
                      </Field>
                    </div>

                    <Card>
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-white">Charge de travail</p>
                          <p className="mt-0.5 text-xs text-slate-500">Part du temps consacrée à la mission</p>
                        </div>
                        <span className="rounded-xl bg-[#0B1F33] px-3 py-2 text-sm font-semibold text-white">{form.workload_percent} %</span>
                      </div>
                      <input type="range" min="10" max="100" step="10" value={form.workload_percent} onChange={(e) => update("workload_percent", Number(e.target.value))} className="w-full accent-[#16B8B1]" />
                      <div className="mt-2 flex justify-between text-[10px] text-slate-400"><span>10 %</span><span>50 %</span><span>100 %</span></div>
                    </Card>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={form.remote}
                      onClick={() => update("remote", !form.remote)}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
                        form.remote ? "border-[#16B8B1] bg-[#16B8B1]/5 ring-4 ring-[#16B8B1]/10" : "border-slate-200 bg-white hover:border-[#16B8B1]/40 dark:border-white/10 dark:bg-[#0A1230]"
                      }`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${form.remote ? "bg-[#0B1F33] text-[#16B8B1]" : "bg-slate-100 text-slate-500 dark:bg-white/5"}`}><Laptop size={17} /></span>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold text-slate-800 dark:text-white">Télétravail possible</span>
                        <span className="mt-0.5 block text-xs text-slate-500">Le talent pourra travailler à distance.</span>
                      </span>
                      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${form.remote ? "bg-[#16B8B1]" : "bg-slate-300 dark:bg-slate-600"}`}>
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.remote ? "left-[22px]" : "left-0.5"}`} />
                      </span>
                    </button>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Pays">
                        <input value={form.country} onChange={(e) => update("country", e.target.value)} className={inputCls} />
                      </Field>
                      <Field label="Ville">
                        <div className="relative">
                          <MapPin size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Ex. Antananarivo" className={`${inputCls} pl-10`} />
                        </div>
                      </Field>
                    </div>

                    <div className="rounded-2xl border border-[#16B8B1]/25 bg-[#16B8B1]/5 p-4 sm:p-5">
                      <p className="flex items-center gap-2 text-sm font-semibold text-[#0B1F33] dark:text-white">
                        <Wallet size={17} className="text-[#0F9691]" /> Budget journalier <span className="text-xs font-normal text-slate-500">(optionnel)</span>
                      </p>
                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Minimum (€ / jour)">
                          <input type="number" min="0" value={form.budget_min} onChange={(e) => update("budget_min", e.target.value)} placeholder="300" className={inputCls} />
                        </Field>
                        <Field label="Maximum (€ / jour)">
                          <input type="number" min="0" value={form.budget_max} onChange={(e) => update("budget_max", e.target.value)} placeholder="500" className={inputCls} />
                        </Field>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Card>
                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white"><Users size={17} className="text-[#0F9691]" /> Nombre de postes</p>
                        <div className="mt-3 flex items-center gap-3">
                          <button type="button" aria-label="Diminuer" onClick={() => update("positions_count", Math.max(1, Number(form.positions_count) - 1))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-[#16B8B1] hover:text-[#0F9691] dark:border-white/10 dark:text-slate-300"><Minus size={16} /></button>
                          <span className="min-w-8 text-center text-xl font-semibold text-slate-900 dark:text-white">{form.positions_count}</span>
                          <button type="button" aria-label="Augmenter" onClick={() => update("positions_count", Math.min(50, Number(form.positions_count) + 1))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-[#16B8B1] hover:text-[#0F9691] dark:border-white/10 dark:text-slate-300"><Plus size={16} /></button>
                        </div>
                      </Card>

                      <Card>
                        <Field label="Expiration de l’annonce (optionnel)">
                          <input type="date" min={new Date().toISOString().split("T")[0]} value={form.expires_at} onChange={(e) => update("expires_at", e.target.value)} className={inputCls} />
                        </Field>
                        <p className="mt-1.5 text-xs text-slate-400">Par défaut : 60 jours si publiée.</p>
                      </Card>
                    </div>
                  </StepBlock>
                )}
              </>
            )}
          </main>

          {/* ===== Aperçu en direct ===== */}
          <aside className="hidden min-h-0 border-l border-slate-100 bg-[#F3F6FC]/70 p-5 lg:block lg:overflow-y-auto dark:border-white/10 dark:bg-[#0A1230]/60">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Aperçu de la demande</p>

            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#131E47]">
              <div className={`h-1.5 ${form.urgency === "urgent" ? "bg-rose-500" : "bg-[#16B8B1]"}`} />
              <div className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-md bg-[#0B1F33] px-2 py-0.5 text-[11px] font-bold text-white">Demande de talent</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Brouillon
                  </span>
                  {form.urgency === "urgent" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-medium text-rose-700"><Zap size={11} /> Urgente</span>
                  )}
                </div>

                <h4 className={`break-words text-sm font-bold leading-5 ${form.title ? "text-[#0B1F33] dark:text-white" : "text-slate-300 dark:text-slate-600"}`}>
                  {form.title || "Titre de la demande"}
                </h4>

                {form.description && <p className="line-clamp-3 text-xs leading-5 text-slate-500">{form.description}</p>}

                <span className="inline-block rounded-md bg-[#16B8B1]/10 px-2 py-0.5 text-xs font-bold text-[#0F9691]">{missionLabel}</span>

                {form.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.skills.slice(0, 5).map((s, i) => (
                      <span key={`${s.name}-${i}`} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-white/10 dark:text-slate-300">{s.name}</span>
                    ))}
                    {form.skills.length > 5 && <span className="text-[11px] text-slate-400">+{form.skills.length - 5}</span>}
                  </div>
                )}

                <dl className="space-y-1.5 border-t border-slate-100 pt-3 text-xs dark:border-white/10">
                  <Row label="Début" value={fmt(form.start_at)} />
                  <Row label="Fin" value={fmt(form.end_at)} />
                  <Row label="Charge" value={`${form.workload_percent} %`} />
                  <Row label="Postes" value={form.positions_count} />
                  <Row label="Lieu" value={[form.city, form.country].filter(Boolean).join(", ")} />
                </dl>

                {budgetText && (
                  <div className="rounded-xl bg-[#16B8B1]/10 px-3 py-2 text-sm font-bold text-[#0B1F33] ring-1 ring-[#16B8B1]/20 dark:text-white">{budgetText}</div>
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* ===== Pied ===== */}
        <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-7 dark:border-white/10 dark:bg-[#131E47]">
          <button
            type="button"
            onClick={() => goTo(Math.max(0, step - 1))}
            disabled={step === 0 || submitting || loadingRequest}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:invisible dark:hover:bg-white/5"
          >
            <ChevronLeft size={16} /> Retour
          </button>

          <div className="flex flex-1 justify-end gap-2">
            <button type="button" onClick={onClose} className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 sm:block dark:hover:bg-white/5">Annuler</button>
            {!isLast ? (
              <button type="button" onClick={goNext} disabled={loadingRequest} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B1F33] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#16324F] disabled:opacity-50 dark:bg-[#16B8B1] dark:text-[#0B1F33]">
                Continuer <ChevronRight size={16} />
              </button>
            ) : (
              <>
                <button type="button" onClick={() => submit("draft")} disabled={submitting || loadingRequest} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-transparent dark:text-slate-300">
                  Brouillon
                </button>
                <button type="button" onClick={() => submit("published")} disabled={submitting || loadingRequest} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#16B8B1] px-5 py-2.5 text-sm font-bold text-[#0B1F33] shadow-lg shadow-[#16B8B1]/20 transition hover:bg-[#0F9691] hover:text-white disabled:opacity-50">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {submitting ? "Publication…" : "Publier la demande"}
                </button>
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ============================================
   Recherche / création de compétence
============================================ */
function SkillAutocomplete({ allSkills, existingSkills, onAdd }) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const cleanQuery = normalize(query.trim());

  const suggestions = useMemo(() => {
    if (!cleanQuery) return [];
    return allSkills
      .filter((skill) => {
        const added = existingSkills.some(
          (e) => e.skill_id === skill.id || normalize(e.name || "") === normalize(skill.name)
        );
        return !added && normalize(skill.name).includes(cleanQuery);
      })
      .slice(0, 6);
  }, [cleanQuery, allSkills, existingSkills]);

  const exactMatch = suggestions.find((s) => normalize(s.name) === cleanQuery);

  const reset = () => {
    setQuery("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleSubmit = () => {
    const clean = query.trim();
    if (!clean) return;
    if (exactMatch) onAdd({ id: exactMatch.id, name: exactMatch.name });
    else onAdd({ id: null, name: clean });
    reset();
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Field label="Rechercher ou créer une compétence *">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(); } }}
            placeholder="Ex. Laravel, React, UX design…"
            className={`${inputCls} pl-10 pr-28`}
          />
          <button type="button" onClick={handleSubmit} disabled={!query.trim()} className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-lg bg-[#0B1F33] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#16324F] disabled:opacity-40">
            <Plus size={13} /> Ajouter
          </button>
        </div>
      </Field>

      {showSuggestions && cleanQuery && (
        <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-white/10 dark:bg-[#131E47]">
          {suggestions.length === 0 ? (
            <button type="button" onClick={handleSubmit} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-[#16B8B1]/10">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Plus size={15} /></span>
              <span className="min-w-0 flex-1 text-slate-700 dark:text-slate-200">Créer <strong>« {query.trim()} »</strong></span>
              <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700">Personnalisée</span>
            </button>
          ) : (
            <>
              {suggestions.map((skill) => (
                <button key={skill.id} type="button" onClick={() => { onAdd({ id: skill.id, name: skill.name }); reset(); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-[#16B8B1]/10 dark:text-slate-200">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#16B8B1]/10 text-[#0F9691]"><Plus size={15} /></span>
                  {skill.name}
                </button>
              ))}
              {!exactMatch && (
                <button type="button" onClick={handleSubmit} className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-amber-50 dark:border-white/10 dark:text-slate-300">
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

/* ============================================
   Briques
============================================ */
function StepBlock({ title, text, children }) {
  return (
    <section className="space-y-5">
      <div>
        <h3 className="text-lg font-bold tracking-tight text-[#0B1F33] dark:text-white">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{text}</p>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div className="w-full min-w-0">
      <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      {children}
    </div>
  );
}

function Card({ children }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-white/10 dark:bg-[#0A1230]">{children}</div>;
}

function ChoiceCard({ active, onClick, label, hint, icon: Icon, tone }) {
  const rose = tone === "rose";
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`relative flex items-start gap-3 rounded-2xl border p-3.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16B8B1] ${
        active
          ? rose ? "border-rose-400 bg-rose-50/70 ring-4 ring-rose-500/10" : "border-[#16B8B1] bg-[#16B8B1]/5 ring-4 ring-[#16B8B1]/10"
          : "border-slate-200 bg-white hover:border-[#16B8B1]/40 hover:bg-slate-50 dark:border-white/10 dark:bg-[#0A1230] dark:hover:bg-white/5"
      }`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
        active ? (rose ? "bg-rose-500 text-white" : "bg-[#0B1F33] text-[#16B8B1]") : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"
      }`}>
        <Icon size={17} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-800 dark:text-white">{label}</span>
        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{hint}</span>
      </span>
      {active && (
        <span className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full ${rose ? "bg-rose-500 text-white" : "bg-[#16B8B1] text-[#0B1F33]"}`}>
          <Check size={12} />
        </span>
      )}
    </button>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className="truncate font-medium text-slate-700 dark:text-slate-300">{value || "—"}</dd>
    </div>
  );
}