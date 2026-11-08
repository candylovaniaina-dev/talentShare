import React, { useEffect, useMemo, useState } from "react";
import {
  X, Loader2, AlertCircle, Check, BriefcaseBusiness, UserRound,
  CalendarDays, MapPin, Sparkles, Euro, ChevronRight, ChevronLeft,
  Search, Building2, Laptop, Shuffle, Globe, Users, Lock,
  Handshake, Clock, Timer, Rocket,
} from "lucide-react";
import api from "../../services/api";
import EmployeeSelector from "./EmployeeSelector";
import EmployeePickerModal from "./EmployeePickerModal";

const MISSION_TYPES = [
  { value: "loan", label: "Mise à disposition", hint: "Prêt d'un salarié", icon: Handshake },
  { value: "mission", label: "Mission", hint: "Projet ponctuel", icon: Rocket },
  { value: "freelance", label: "Freelance", hint: "Prestation indépendante", icon: Laptop },
  { value: "part_time", label: "Temps partiel", hint: "Charge réduite", icon: Timer },
  { value: "full_time", label: "Temps plein", hint: "Disponibilité complète", icon: Clock },
];

const LOCATION_TYPES = [
  { value: "onsite", label: "Sur site", hint: "Dans vos locaux", icon: Building2 },
  { value: "remote", label: "Télétravail", hint: "100 % à distance", icon: Laptop },
  { value: "hybrid", label: "Hybride", hint: "Sur site et à distance", icon: Shuffle },
];

const VISIBILITY_TYPES = [
  { value: "public", label: "Public", hint: "Visible par tous", icon: Globe },
  { value: "network", label: "Réseau", hint: "Vos relations uniquement", icon: Users },
  { value: "private", label: "Privé", hint: "Visible par vous seul", icon: Lock },
];

const STEPS = [
  { id: 0, label: "Collaborateur", icon: UserRound },
  { id: 1, label: "Offre", icon: BriefcaseBusiness },
  { id: 2, label: "Période et lieu", icon: CalendarDays },
  { id: 3, label: "Conditions", icon: Euro },
];

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#16B8B1] focus:ring-4 focus:ring-[#16B8B1]/10 dark:border-white/10 dark:bg-[#0A1230] dark:text-white";

const normalize = (s = "") =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
    : "—";

const fileUrl = (p) => (!p ? null : /^https?:/.test(p) ? p : `http://localhost:8001/storage/${p}`);

function Avatar({ src, name, size = 40 }) {
  const [err, setErr] = useState(false);
  useEffect(() => setErr(false), [src]);
  return (
    <div style={{ width: size, height: size }} className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#16B8B1] font-semibold text-[#0F2340]">
      {src && !err ? (
        <img src={src} alt={name} onError={() => setErr(true)} className="h-full w-full object-cover" />
      ) : (
        <span style={{ fontSize: size * 0.4 }}>
          {(name || "?").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("")}
        </span>
      )}
    </div>
  );
}

export default function CreateResourceOfferModal({ offerId, onClose, onSuccess }) {
  const isEdit = Boolean(offerId);

  const [step, setStep] = useState(0);
  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [skillQuery, setSkillQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingOffer, setLoadingOffer] = useState(isEdit);
  const [error, setError] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [form, setForm] = useState({
    professional_profile_id: "",
    title: "",
    description: "",
    mission_type: "loan",
    start_at: "",
    end_at: "",
    workload_unit: "days_per_week",
    workload_value: 5,
    location_type: "hybrid",
    location_city: "",
    country: "Madagascar",
    city: "",
    visibility: "public",
    status: "published",
    conditions: "",
    daily_rate: "",
    hourly_rate: "",
    skills: [],
  });

  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    let active = true;

    api.get("/companies/me")
      .then((res) => active && setCompany(res.data))
      .catch(() => active && setError("Impossible de charger les informations de l’entreprise."));

    api.get("/skills")
      .then((res) => {
        if (!active) return;
        const data = res.data;
        setAllSkills(Array.isArray(data) ? data : data?.data || []);
      })
      .catch(() => active && setAllSkills([]));

    if (isEdit) {
      api.get(`/resource-offers/${offerId}`)
        .then((res) => {
          if (!active) return;
          const o = res.data;
          setForm({
            professional_profile_id: o.professional_profile_id,
            title: o.title || "",
            description: o.description || "",
            mission_type: o.mission_type || "loan",
            start_at: o.start_at?.slice(0, 10) || "",
            end_at: o.end_at?.slice(0, 10) || "",
            workload_unit: o.workload_unit || "days_per_week",
            workload_value: o.workload_value ?? 5,
            location_type: o.location_type || "hybrid",
            location_city: o.location_city || "",
            country: o.country || "Madagascar",
            city: o.city || "",
            visibility: o.visibility || "public",
            status: o.status || "published",
            conditions: o.conditions || "",
            daily_rate: o.daily_rate ?? "",
            hourly_rate: o.hourly_rate ?? "",
            skills: (o.skills || []).map((s) => ({
              skill_id: s.id,
              name: s.name,
              level: s.pivot?.level || "intermediate",
            })),
          });
        })
        .catch(() => active && setError("Impossible de charger cette offre."))
        .finally(() => active && setLoadingOffer(false));
    }

    return () => { active = false; };
  }, [offerId, isEdit]);

  useEffect(() => {
    if (!company?.id) return;
    api.get(`/companies/${company.id}/employees`)
      .then((res) => setEmployees(res.data.data || []))
      .catch(() => setEmployees([]));
  }, [company]);

  useEffect(() => {
    if (!form.professional_profile_id || employees.length === 0) return;
    const found = employees.find(
      (e) => String(e.user?.professional_profile?.id) === String(form.professional_profile_id)
    );
    if (found) setSelectedEmployee(found);
  }, [form.professional_profile_id, employees]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (showPicker) setShowPicker(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, showPicker]);

  const addSkill = (skill) => {
    if (form.skills.some((s) => Number(s.skill_id) === Number(skill.id))) return;
    setForm((c) => ({
      ...c,
      skills: [...c.skills, { skill_id: skill.id, name: skill.name, level: "intermediate" }],
    }));
    setSkillQuery("");
  };

  const removeSkill = (skillId) =>
    setForm((c) => ({
      ...c,
      skills: c.skills.filter((s) => Number(s.skill_id) !== Number(skillId)),
    }));

  const suggestions = useMemo(() => {
    const q = normalize(skillQuery.trim());
    if (!q) return [];
    return allSkills
      .filter(
        (s) =>
          normalize(s.name).includes(q) &&
          !form.skills.some((fs) => Number(fs.skill_id) === Number(s.id))
      )
      .slice(0, 8);
  }, [skillQuery, allSkills, form.skills]);

  const validate = () => {
    if (!form.professional_profile_id) return { step: 0, msg: "Sélectionnez un salarié." };
    if (!form.title.trim()) return { step: 1, msg: "Le titre est requis." };
    if (!form.start_at || !form.end_at) return { step: 2, msg: "Les dates sont requises." };
    if (form.end_at < form.start_at)
      return { step: 2, msg: "La date de fin doit être postérieure à la date de début." };
    if (!company?.id)
      return { step: 0, msg: "Les informations de votre entreprise ne sont pas disponibles." };
    return null;
  };

  const validateStep = (s) => {
    const v = validate();
    return v && v.step === s ? v : null;
  };

  const goNext = () => {
    const v = validateStep(step);
    if (v) return setError(v.msg);
    setError(null);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const goTo = (target) => {
    if (target > step) {
      for (let s = step; s < target; s += 1) {
        const v = validateStep(s);
        if (v) return setError(v.msg);
      }
    }
    setError(null);
    setStep(target);
  };

  const submit = async (status) => {
    setError(null);
    const v = validate();
    if (v) {
      setStep(v.step);
      return setError(v.msg);
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        company_id: company.id,
        status,
        daily_rate: form.daily_rate === "" ? null : Number(form.daily_rate),
        hourly_rate: form.hourly_rate === "" ? null : Number(form.hourly_rate),
        skills: form.skills.map(({ skill_id, level }) => ({ skill_id, level })),
      };

      if (isEdit) await api.patch(`/resource-offers/${offerId}`, payload);
      else await api.post("/resource-offers", payload);

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Une erreur est survenue lors de l’enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  const isLast = step === STEPS.length - 1;
  const showCity = form.location_type === "onsite" || form.location_type === "hybrid";
  const missionLabel = MISSION_TYPES.find((m) => m.value === form.mission_type)?.label;

  const empName = selectedEmployee?.user?.name;
  const empAvatar = selectedEmployee?.user?.professional_profile?.avatar_path || selectedEmployee?.user?.professionalProfile?.avatar_path || selectedEmployee?.photo_path;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F2340]/60 p-3 backdrop-blur-sm sm:p-6 font-['Plus_Jakarta_Sans',sans-serif]"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="resource-offer-title"
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-[#0F2340]/30 dark:bg-[#131E47]"
        >
          {/* ===== En-tête Bleu Marine + progression ===== */}
          <header className="relative shrink-0 overflow-hidden bg-[#0F2340] px-5 pb-5 pt-5 text-white sm:px-7">
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#16B8B1]/20 blur-3xl" />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
            />

            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 text-[#16B8B1]">
                  <BriefcaseBusiness size={21} />
                </div>
                <div>
                  <h2 id="resource-offer-title" className="text-xl font-bold tracking-tight sm:text-2xl">
                    {isEdit ? "Modifier l’offre" : "Proposer un talent"}
                  </h2>
                  <p className="mt-0.5 text-sm text-white/70">
                    Présentez un collaborateur disponible pour une nouvelle opportunité.
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Fermer"
                onClick={onClose}
                className="rounded-xl bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <ol className="relative mt-5 grid grid-cols-4 gap-2">
              {STEPS.map((s, i) => {
                const done = i < step;
                const active = i === step;
                const Icon = s.icon;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      disabled={loadingOffer}
                      aria-current={active ? "step" : undefined}
                      className="group w-full text-left focus:outline-none"
                    >
                      <span
                        className={`block h-1 rounded-full transition-all ${
                          done || active ? "bg-[#16B8B1]" : "bg-white/20"
                        } ${active ? "shadow-[0_0_12px_rgba(22,184,177,0.7)]" : ""}`}
                      />
                      <span className="mt-2.5 flex items-center gap-2">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition ${
                            active
                              ? "bg-white text-[#0F2340]"
                              : done
                              ? "bg-[#16B8B1] text-[#0F2340]"
                              : "bg-white/10 text-white/70"
                          }`}
                        >
                          {done ? <Check size={13} /> : i + 1}
                        </span>
                        <span
                          className={`hidden truncate text-xs font-medium sm:block ${
                            active ? "text-white" : "text-white/60 group-hover:text-white/90"
                          }`}
                        >
                          {s.label}
                        </span>
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

              {loadingOffer ? (
                <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-500">
                  <Loader2 className="animate-spin text-[#16B8B1]" size={28} />
                  <p className="text-sm">Chargement de l’offre…</p>
                </div>
              ) : (
                <>
                  {step === 0 && (
                    <StepBlock title="Quel collaborateur proposez-vous ?" text="Choisissez le talent de votre entreprise qui sera présenté dans l’offre.">
                      {employees.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-relaxed text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                          Aucun salarié n’est disponible dans votre entreprise. Vous pourrez en ajouter depuis la rubrique « Mon entreprise ».
                        </div>
                      ) : (
                        <EmployeeSelector
                          employee={selectedEmployee}
                          onOpenPicker={() => setShowPicker(true)}
                        />
                      )}
                    </StepBlock>
                  )}

                  {step === 1 && (
                    <StepBlock title="Décrivez votre offre" text="Un titre clair et des compétences précises augmentent vos chances d’être contacté.">
                      <Field label="Titre de l’offre *">
                        <input
                          value={form.title}
                          onChange={(e) => update("title", e.target.value)}
                          placeholder="Ex. Développeur Laravel senior disponible"
                          className={inputCls}
                        />
                      </Field>

                      <Field label="Description">
                        <textarea
                          rows={4}
                          value={form.description}
                          onChange={(e) => update("description", e.target.value)}
                          placeholder="Présentez le profil, son expertise et le contexte de la mission…"
                          className={`${inputCls} resize-y`}
                        />
                      </Field>

                      <Field label="Type de mission *">
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                          {MISSION_TYPES.map((m) => (
                            <ChoiceCard
                              key={m.value}
                              active={form.mission_type === m.value}
                              onClick={() => update("mission_type", m.value)}
                              {...m}
                            />
                          ))}
                        </div>
                      </Field>

                      <Field label="Compétences clés">
                        <div className="relative">
                          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            value={skillQuery}
                            onChange={(e) => setSkillQuery(e.target.value)}
                            placeholder="Rechercher une compétence…"
                            className={`${inputCls} pl-10`}
                          />
                          {suggestions.length > 0 && (
                            <ul className="absolute z-10 mt-1.5 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#131E47]">
                              {suggestions.map((s) => (
                                <li key={s.id}>
                                  <button
                                    type="button"
                                    onClick={() => addSkill(s)}
                                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-[#16B8B1]/10 hover:text-[#0F9691] dark:text-slate-300 dark:hover:text-[#16B8B1]"
                                  >
                                    {s.name}
                                    <Sparkles size={14} className="text-[#16B8B1]" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {form.skills.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {form.skills.map((skill) => (
                              <span key={skill.skill_id} className="inline-flex items-center gap-2 rounded-full border border-[#16B8B1]/30 bg-[#16B8B1]/10 px-3 py-1.5 text-sm font-medium text-[#0F9691] dark:text-[#16B8B1]">
                                {skill.name}
                                <button type="button" aria-label={`Retirer ${skill.name}`} onClick={() => removeSkill(skill.skill_id)} className="rounded-full p-0.5 text-[#0F9691]/60 transition hover:bg-rose-100 hover:text-rose-600 dark:text-[#16B8B1]/60 dark:hover:bg-rose-500/20">
                                  <X size={13} />
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 text-xs text-slate-400">Aucune compétence ajoutée pour le moment.</p>
                        )}
                      </Field>
                    </StepBlock>
                  )}

                  {step === 2 && (
                    <StepBlock title="Quand et où ?" text="Précisez la période de disponibilité et le mode de travail.">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Date de début *">
                          <input type="date" value={form.start_at} onChange={(e) => update("start_at", e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Date de fin *">
                          <input type="date" min={form.start_at || undefined} value={form.end_at} onChange={(e) => update("end_at", e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Charge de travail">
                          <input type="number" min="0" max="100" value={form.workload_value} onChange={(e) => update("workload_value", Number(e.target.value))} className={inputCls} />
                        </Field>
                        <Field label="Unité de charge">
                          <select value={form.workload_unit} onChange={(e) => update("workload_unit", e.target.value)} className={inputCls}>
                            <option value="percentage">Pourcentage (%)</option>
                            <option value="hours_per_week">Heures / semaine</option>
                            <option value="days_per_week">Jours / semaine</option>
                          </select>
                        </Field>
                      </div>

                      <Field label="Mode de travail">
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                          {LOCATION_TYPES.map((l) => (
                            <ChoiceCard
                              key={l.value}
                              active={form.location_type === l.value}
                              onClick={() => update("location_type", l.value)}
                              {...l}
                            />
                          ))}
                        </div>
                      </Field>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {showCity && (
                          <Field label="Ville de la mission">
                            <div className="relative">
                              <MapPin size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input value={form.location_city} onChange={(e) => update("location_city", e.target.value)} placeholder="Ex. Antananarivo" className={`${inputCls} pl-10`} />
                            </div>
                          </Field>
                        )}
                        <Field label="Pays">
                          <input value={form.country} onChange={(e) => update("country", e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Ville complémentaire">
                          <input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Ville, si nécessaire" className={inputCls} />
                        </Field>
                      </div>
                    </StepBlock>
                  )}

                  {step === 3 && (
                    <StepBlock title="Conditions et visibilité" text="Indiquez vos tarifs indicatifs et qui peut voir cette offre.">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Tarif journalier (€)">
                          <input type="number" min="0" value={form.daily_rate} onChange={(e) => update("daily_rate", e.target.value)} placeholder="Ex. 300" className={inputCls} />
                        </Field>
                        <Field label="Tarif horaire (€)">
                          <input type="number" min="0" value={form.hourly_rate} onChange={(e) => update("hourly_rate", e.target.value)} placeholder="Ex. 40" className={inputCls} />
                        </Field>
                      </div>

                      <Field label="Conditions particulières">
                        <textarea rows={3} value={form.conditions} onChange={(e) => update("conditions", e.target.value)} placeholder="Ex. NDA requis, durée minimale, conditions de collaboration…" className={`${inputCls} resize-y`} />
                      </Field>

                      <Field label="Visibilité de l’offre">
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                          {VISIBILITY_TYPES.map((v) => (
                            <ChoiceCard
                              key={v.value}
                              active={form.visibility === v.value}
                              onClick={() => update("visibility", v.value)}
                              {...v}
                            />
                          ))}
                        </div>
                      </Field>
                    </StepBlock>
                  )}
                </>
              )}
            </main>

            <aside className="hidden min-h-0 border-l border-slate-100 bg-[#F3F6FC]/60 p-5 lg:block lg:overflow-y-auto dark:border-white/10 dark:bg-[#0A1230]/60">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Aperçu de l’offre</p>

              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#131E47]">
                <div className="h-1.5 bg-[#16B8B1]" />
                <div className="space-y-3 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={fileUrl(empAvatar)} name={empName} size={40} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#0F2340] dark:text-white">
                        {empName || "Collaborateur non choisi"}
                      </p>
                      <p className="truncate text-xs text-slate-400">{company?.name || "Votre entreprise"}</p>
                    </div>
                  </div>

                  <h4 className={`text-sm font-bold leading-snug ${form.title ? "text-[#0F2340] dark:text-white" : "text-slate-300 dark:text-slate-600"}`}>
                    {form.title || "Titre de l’offre"}
                  </h4>

                  <span className="inline-block rounded-md bg-[#16B8B1]/10 px-2 py-0.5 text-xs font-bold text-[#0F9691] dark:text-[#16B8B1]">
                    {missionLabel}
                  </span>

                  {form.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {form.skills.slice(0, 4).map((s) => (
                        <span key={s.skill_id} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-white/10 dark:text-slate-300">
                          {s.name}
                        </span>
                      ))}
                      {form.skills.length > 4 && (
                        <span className="text-[11px] text-slate-400">+{form.skills.length - 4}</span>
                      )}
                    </div>
                  )}

                  <dl className="space-y-1.5 border-t border-slate-100 pt-3 text-xs dark:border-white/10">
                    <Row label="Début" value={fmt(form.start_at)} />
                    <Row label="Fin" value={fmt(form.end_at)} />
                    <Row
                      label="Lieu"
                      value={
                        (LOCATION_TYPES.find((l) => l.value === form.location_type)?.label || "") +
                        (showCity && form.location_city ? ` · ${form.location_city}` : "")
                      }
                    />
                    <Row label="Visibilité" value={VISIBILITY_TYPES.find((v) => v.value === form.visibility)?.label} />
                  </dl>

                  {form.daily_rate !== "" && (
                    <div className="rounded-xl bg-[#16B8B1]/10 px-3 py-2 ring-1 ring-[#16B8B1]/20">
                      <span className="text-base font-bold text-[#0F2340] dark:text-white">{form.daily_rate} €</span>
                      <span className="ml-1 text-xs font-medium text-[#0F9691] dark:text-[#16B8B1]">par jour</span>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>

          <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 dark:border-white/10 dark:bg-[#131E47]">
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button type="button" onClick={() => goTo(step - 1)} className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5">
                  <ChevronLeft size={16} />
                  Retour
                </button>
              )}
              <button type="button" onClick={onClose} className="rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5">
                Annuler
              </button>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button type="button" onClick={() => submit("draft")} disabled={submitting || loadingOffer} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-transparent dark:text-slate-300 dark:hover:bg-white/5">
                Enregistrer en brouillon
              </button>

              {isLast ? (
                <button type="button" onClick={() => submit("published")} disabled={submitting || loadingOffer} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#16B8B1] px-5 py-2.5 text-sm font-bold text-[#0F2340] shadow-lg shadow-[#16B8B1]/20 transition hover:bg-[#0F9691] disabled:opacity-50">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {submitting ? "Enregistrement…" : isEdit ? "Enregistrer" : "Publier l’offre"}
                </button>
              ) : (
                <button type="button" onClick={goNext} disabled={loadingOffer} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F2340] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1A2F4A] disabled:opacity-50 dark:bg-[#16B8B1] dark:text-[#0F2340] dark:hover:bg-[#0F9691]">
                  Continuer
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </footer>
        </div>
      </div>

      {showPicker && (
        <EmployeePickerModal
          employees={employees.filter((e) => e.user)}
          selectedId={form.professional_profile_id}
          onSelect={(emp) => {
            setSelectedEmployee(emp);
            update("professional_profile_id", emp.user?.professional_profile?.id || "");
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}

/* ============================================ */
/* Briques                                      */
/* ============================================ */
function StepBlock({ title, text, children }) {
  return (
    <section className="space-y-5">
      <div>
        <h3 className="text-lg font-bold tracking-tight text-[#0F2340] dark:text-white">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{text}</p>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">{label}</label>
      {children}
    </div>
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

function ChoiceCard({ active, onClick, label, hint, icon: Icon }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`relative flex items-start gap-3 rounded-2xl border p-3.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16B8B1] ${
        active
          ? "border-[#16B8B1] bg-[#16B8B1]/5 ring-4 ring-[#16B8B1]/10 dark:bg-[#16B8B1]/10"
          : "border-slate-200 bg-white hover:border-[#16B8B1]/30 hover:bg-slate-50 dark:border-white/10 dark:bg-[#0A1230] dark:hover:bg-white/5"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
          active ? "bg-[#16B8B1] text-[#0F2340]" : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"
        }`}
      >
        <Icon size={17} />
      </span>
      <span className="min-w-0">
        <span className={`block text-sm font-bold ${active ? "text-[#0F9691] dark:text-[#16B8B1]" : "text-[#0F2340] dark:text-white"}`}>
          {label}
        </span>
        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{hint}</span>
      </span>
      {active && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#16B8B1] text-[#0F2340]">
          <Check size={12} />
        </span>
      )}
    </button>
  );
}