import React, { useEffect, useState, useRef } from "react";
import {
  Check, ChevronLeft, ChevronRight, X, DollarSign, Zap, Users,
  Tag, AlertCircle, Plus, Sparkles, Loader2,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const STEPS = ["Le besoin", "Compétences", "Conditions", "Aperçu"];

const MISSION_TYPES = [
  { value: "mission",   label: "Mission ponctuelle" },
  { value: "staffing",  label: "Mise à disposition" },
  { value: "freelance", label: "Freelance" },
  { value: "other",     label: "Autre" },
];

const LEVELS = [
  { value: "beginner",     label: "Débutant" },
  { value: "intermediate", label: "Intermédiaire" },
  { value: "advanced",     label: "Avancé" },
  { value: "expert",       label: "Expert" },
];

const SUGGESTED_TAGS = [
  "Développement", "Design", "Marketing", "Data", "DevOps",
  "Mobile", "Cloud", "Sécurité", "IA", "E-commerce",
];

const asArray = (data) => Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);

export default function CreateResourceRequestModal({ requestId, onClose, onSuccess }) {
  const { user } = useAuth();
  const isEdit = Boolean(requestId);

  const [step, setStep] = useState(0);
  const [company, setCompany] = useState(null);
  const [allSkills, setAllSkills] = useState([]);
  const [submitting, setSubmitting] = useState(false);
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

  /* ============ CHARGEMENT ============ */
  useEffect(() => {
    api.get("/companies").then((res) => {
      const all = asArray(res.data);
      setCompany(all.find((c) => c.owner_user_id === user.id));
    });
    api.get("/skills", { params: { limit: 500 } })
      .then((res) => setAllSkills(asArray(res.data)))
      .catch(console.error);
  }, [user.id]);

  useEffect(() => {
    if (isEdit) {
      api.get(`/resource-requests/${requestId}`).then((res) => {
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
          workload_percent: r.workload_percent || 100,
          remote: r.remote || false,
          country: r.country || "Madagascar",
          city: r.city || "",
          expires_at: r.expires_at?.slice(0, 10) || "",
          budget_min: r.budget_min || "",
          budget_max: r.budget_max || "",
          positions_count: r.positions_count || 1,
          urgency: r.urgency || "normal",
          tags: r.tags || [],
        });
      });
    }
  }, [requestId, isEdit]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  /* ============ SKILLS ============ */
  // Ajoute une compétence (existante ou custom)
  const addSkillFromAutocomplete = (skill) => {
    const cleanName = skill.name.trim();
    if (!cleanName) return;

    // Vérifier doublon par nom (case insensitive)
    if (form.skills.some((s) => s.name.toLowerCase() === cleanName.toLowerCase())) return;

    const newSkill = skill.id
      ? { skill_id: skill.id, name: skill.name, min_level: "intermediate", isCustom: false }
      : { skill_id: null, name: cleanName, min_level: "intermediate", isCustom: true };

    setForm({ ...form, skills: [...form.skills, newSkill] });
  };

  const setSkillLevel = (index, level) => {
    setForm({
      ...form,
      skills: form.skills.map((s, i) => i === index ? { ...s, min_level: level } : s),
    });
  };

  const removeSkill = (index) => {
    setForm({ ...form, skills: form.skills.filter((_, i) => i !== index) });
  };

  /* ============ TAGS ============ */
  const addTag = (tag) => {
    const clean = tag.trim();
    if (!clean || form.tags.includes(clean) || form.tags.length >= 10) return;
    setForm({ ...form, tags: [...form.tags, clean] });
    setTagInput("");
  };

  const removeTag = (tag) => {
    setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });
  };

  /* ============ VALIDATION ============ */
  const canProceed = () => {
    if (step === 0) return form.title.trim() && form.description.trim();
    if (step === 1) return form.skills.length > 0;
    if (step === 2) return form.start_at && form.end_at;
    return true;
  };

  /* ============ SUBMIT ============ */
  const submit = async (status) => {
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
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
        budget_min: form.budget_min === "" ? null : Number(form.budget_min),
        budget_max: form.budget_max === "" ? null : Number(form.budget_max),
        positions_count: Number(form.positions_count) || 1,
        urgency: form.urgency,
        tags: form.tags,
        // ✅ FIX : envoyer skill_id OU name selon le cas
        skills: form.skills.map((s) => {
          if (s.skill_id) return { skill_id: s.skill_id, min_level: s.min_level };
          return { name: s.name, min_level: s.min_level };
        }),
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
      setError(msg || (errors ? Object.values(errors).flat().join(" · ") : "Une erreur est survenue."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-modalOverlay"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-2xl animate-modalContent"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ===== HEADER ===== */}
        <div className="border-b border-[var(--border-app)] px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                {isEdit ? "Modifier" : "Nouvelle demande"}
              </p>
              <h2 className="mt-0.5 text-xl font-bold text-[var(--text-app)]">
                {isEdit ? "Modifier la demande" : "Nouvelle demande de ressource"}
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Décrivez votre besoin en 4 étapes.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--text-faint)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
            >
              <X size={18} />
            </button>
          </div>

          {/* ===== STEPPER ===== */}
          <div className="mt-5 flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition ${
                  i < step
                    ? "bg-emerald-500 text-[#0A1229]"
                    : i === step
                      ? "bg-emerald-500 text-[#0A1229] ring-2 ring-emerald-500/30"
                      : "bg-[var(--bg-surface-hover)] text-[var(--text-faint)]"
                }`}>
                  {i < step ? <Check size={13} strokeWidth={3} /> : i + 1}
                </div>
                <span className={`hidden text-[11px] font-semibold sm:block ${
                  i === step ? "text-[var(--text-app)]" : "text-[var(--text-faint)]"
                }`}>
                  {s}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`h-px flex-1 transition ${
                    i < step ? "bg-emerald-500/40" : "bg-[var(--border-app)]"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ===== BODY ===== */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* ---------- ÉTAPE 1 : LE BESOIN ---------- */}
          {step === 0 && (
            <div className="space-y-5">
              <Field label="Titre de la mission *">
                <input
                  required
                  placeholder="Ex. Développeur Laravel senior pour refonte API"
                  className={inputCls}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </Field>

              <Field label="Description du besoin *">
                <textarea
                  required
                  rows={4}
                  placeholder="Décrivez le contexte, les objectifs et les livrables attendus..."
                  className={inputCls}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </Field>

              <Field label="Type de mission">
                <div className="grid grid-cols-2 gap-2">
                  {MISSION_TYPES.map((t) => (
                    <Pill
                      key={t.value}
                      active={form.mission_type === t.value}
                      onClick={() => setForm({ ...form, mission_type: t.value })}
                    >
                      {t.label}
                    </Pill>
                  ))}
                </div>
              </Field>

              <Field label="Niveau d'urgence">
                <div className="grid grid-cols-2 gap-2">
                  <Pill
                    active={form.urgency === "normal"}
                    onClick={() => setForm({ ...form, urgency: "normal" })}
                  >
                    Normal
                  </Pill>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, urgency: "urgent" })}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                      form.urgency === "urgent"
                        ? "border-rose-500/40 bg-rose-500/10 text-rose-400"
                        : "border-[var(--border-app)] bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-app)]"
                    }`}
                  >
                    <Zap size={13} /> Urgent
                  </button>
                </div>
              </Field>
            </div>
          )}

          {/* ---------- ÉTAPE 2 : COMPÉTENCES ---------- */}
          {step === 1 && (
            <div className="space-y-4">
              {/* ✅ AUTOCOMPLETE */}
              <SkillAutocomplete
                allSkills={allSkills}
                existingSkills={form.skills}
                onAdd={addSkillFromAutocomplete}
              />

              {/* Liste des compétences ajoutées */}
              {form.skills.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[var(--border-app)] bg-[var(--bg-surface-hover)] p-4 text-center text-xs text-[var(--text-faint)]">
                  Aucune compétence ajoutée pour l'instant.
                </p>
              ) : (
                <div className="space-y-2">
                  {form.skills.map((s, idx) => (
                    <div
                      key={`${s.skill_id ?? "custom"}-${idx}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--text-app)]">{s.name}</span>
                        {s.isCustom && (
                          <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-400">
                            Nouveau
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={s.min_level}
                          onChange={(e) => setSkillLevel(idx, e.target.value)}
                          className="rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface)] px-2 py-1 text-xs text-[var(--text-app)]"
                        >
                          {LEVELS.map((l) => (
                            <option key={l.value} value={l.value}>{l.label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeSkill(idx)}
                          className="text-[var(--text-faint)] transition hover:text-rose-400"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---------- ÉTAPE 3 : CONDITIONS ---------- */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Début souhaité *">
                  <input
                    type="date"
                    required
                    className={inputCls}
                    value={form.start_at}
                    onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                  />
                </Field>
                <Field label="Fin prévue *">
                  <input
                    type="date"
                    required
                    min={form.start_at}
                    className={inputCls}
                    value={form.end_at}
                    onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                  />
                </Field>
              </div>

              <Field label={`Charge de travail : ${form.workload_percent}%`}>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  className="w-full accent-emerald-500"
                  value={form.workload_percent}
                  onChange={(e) => setForm({ ...form, workload_percent: Number(e.target.value) })}
                />
              </Field>

              <label className="flex items-center gap-2.5 rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2.5 text-sm text-[var(--text-app)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.remote}
                  onChange={(e) => setForm({ ...form, remote: e.target.checked })}
                  className="h-4 w-4 accent-emerald-500"
                />
                Télétravail possible
              </label>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Pays">
                  <input
                    className={inputCls}
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                  />
                </Field>
                <Field label="Ville">
                  <input
                    className={inputCls}
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </Field>
              </div>

              {/* Budget */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 space-y-3">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  <DollarSign size={12} /> Budget journalier (optionnel)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Minimum (€/jour)">
                    <input
                      type="number"
                      min="0"
                      placeholder="300"
                      className={inputCls}
                      value={form.budget_min}
                      onChange={(e) => setForm({ ...form, budget_min: e.target.value })}
                    />
                  </Field>
                  <Field label="Maximum (€/jour)">
                    <input
                      type="number"
                      min="0"
                      placeholder="500"
                      className={inputCls}
                      value={form.budget_max}
                      onChange={(e) => setForm({ ...form, budget_max: e.target.value })}
                    />
                  </Field>
                </div>
              </div>

              {/* Postes */}
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-4 space-y-3">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  <Users size={12} /> Nombre de postes à pourvoir
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, positions_count: Math.max(1, form.positions_count - 1) })}
                    className="h-9 w-9 rounded-full border border-[var(--border-app)] bg-[var(--bg-surface)] text-base font-bold text-[var(--text-app)] transition hover:border-emerald-500/40"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-xl font-bold text-[var(--text-app)]">
                    {form.positions_count}
                  </span>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, positions_count: Math.min(50, form.positions_count + 1) })}
                    className="h-9 w-9 rounded-full border border-[var(--border-app)] bg-[var(--bg-surface)] text-base font-bold text-[var(--text-app)] transition hover:border-emerald-500/40"
                  >
                    +
                  </button>
                  <span className="text-xs text-[var(--text-muted)]">
                    {form.positions_count > 1 ? "postes" : "poste"}
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-4 space-y-3">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-400">
                  <Tag size={12} /> Tags / domaine (max 10)
                </p>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.tags.map((t) => (
                      <span
                        key={t}
                        className="flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-400"
                      >
                        {t}
                        <button onClick={() => removeTag(t)} className="text-violet-400/70 hover:text-rose-400">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); }
                    }}
                    placeholder="Ex: Développement, Data..."
                    className={`${inputCls} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => addTag(tagInput)}
                    disabled={!tagInput.trim()}
                    className="rounded-lg bg-violet-500 px-3 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-violet-400 disabled:opacity-40"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {form.tags.length < 10 && (
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_TAGS.filter((t) => !form.tags.includes(t)).slice(0, 6).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => addTag(t)}
                        className="rounded-full border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-2.5 py-0.5 text-[11px] text-[var(--text-muted)] transition hover:border-violet-500/40 hover:text-violet-400"
                      >
                        + {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Expiration */}
              <Field label="Date d'expiration de l'annonce (optionnel)">
                <input
                  type="date"
                  className={inputCls}
                  value={form.expires_at}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                />
                <p className="mt-1 text-[10px] text-[var(--text-faint)]">
                  Par défaut : 60 jours si publiée.
                </p>
              </Field>
            </div>
          )}

          {/* ---------- ÉTAPE 4 : APERÇU ---------- */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-hover)] p-5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-[var(--text-app)]">{form.title}</h3>
                  {form.urgency === "urgent" && (
                    <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-400 flex items-center gap-1">
                      <Zap size={9} /> Urgent
                    </span>
                  )}
                  {form.positions_count > 1 && (
                    <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                      {form.positions_count} postes
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-[var(--text-muted)]">{form.description}</p>
              </div>

              {form.skills.length > 0 && (
                <PreviewSection title="Compétences requises">
                  <div className="flex flex-wrap gap-2">
                    {form.skills.map((s, i) => (
                      <span
                        key={i}
                        className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400"
                      >
                        {s.name} · {LEVELS.find((l) => l.value === s.min_level)?.label}
                      </span>
                    ))}
                  </div>
                </PreviewSection>
              )}

              {form.tags.length > 0 && (
                <PreviewSection title="Tags">
                  <div className="flex flex-wrap gap-1.5">
                    {form.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-400"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </PreviewSection>
              )}

              <PreviewSection title="Détails">
                <dl className="space-y-2 text-sm">
                  <PreviewRow label="Période" value={`${form.start_at} → ${form.end_at}`} />
                  <PreviewRow
                    label="Charge"
                    value={`${form.workload_percent}%${form.remote ? " · Télétravail" : ""}`}
                  />
                  <PreviewRow
                    label="Lieu"
                    value={`${form.city ? `${form.city}, ` : ""}${form.country}`}
                  />
                  <PreviewRow
                    label="Expiration"
                    value={form.expires_at || "Non définie (60j par défaut)"}
                  />
                  {form.budget_min && form.budget_max && (
                    <PreviewRow
                      label="Budget"
                      value={`${form.budget_min} – ${form.budget_max} €/jour`}
                      highlight
                    />
                  )}
                </dl>
              </PreviewSection>
            </div>
          )}

        </div>

        {/* ===== FOOTER ===== */}
        <div className="flex items-center justify-between gap-3 border-t border-[var(--border-app)] px-6 py-4">

          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)] disabled:opacity-0"
          >
            <ChevronLeft size={14} /> Retour
          </button>

          <div className="flex items-center gap-2">
            {step < STEPS.length - 1 ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-hover)]"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canProceed()}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-40"
                >
                  Continuer <ChevronRight size={14} />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => submit("draft")}
                  disabled={submitting}
                  className="rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-4 py-2 text-sm font-semibold text-[var(--text-app)] transition hover:bg-[var(--bg-surface)] disabled:opacity-50"
                >
                  Brouillon
                </button>
                <button
                  type="button"
                  onClick={() => submit("published")}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {submitting ? "Publication..." : "Publier la demande"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   AUTOCOMPLETE COMPÉTENCES
============================================ */
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

  const suggestions = query.trim()
    ? allSkills
        .filter((s) => {
          const isAdded = existingSkills.some(
            (es) => es.skill_id === s.id || (es.name && es.name.toLowerCase() === s.name.toLowerCase())
          );
          return !isAdded && s.name.toLowerCase().includes(query.toLowerCase());
        })
        .slice(0, 6)
    : [];

  const exactMatch = suggestions.some(
    (s) => s.name.toLowerCase() === query.trim().toLowerCase()
  );

  const handleSubmit = () => {
    const clean = query.trim();
    if (!clean) return;

    if (exactMatch) {
      const match = suggestions.find((s) => s.name.toLowerCase() === clean.toLowerCase());
      onAdd({ id: match.id, name: match.name });
    } else {
      onAdd({ id: null, name: clean });
    }

    setQuery("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Field label="Ajouter une compétence *">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder="Ex: Laravel, React, Photoshop..."
            className={inputCls}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-bold text-[#0A1229] transition hover:bg-emerald-400 disabled:opacity-30"
          >
            <Plus size={12} />
          </button>
        </div>
      </Field>

      {showSuggestions && query.trim() && (
        <div className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-2xl">
          {suggestions.length === 0 ? (
            <button
              type="button"
              onClick={handleSubmit}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-hover)]"
            >
              <Plus size={12} className="text-amber-400" />
              Créer <span className="font-semibold text-[var(--text-app)]">"{query.trim()}"</span>
              <span className="ml-auto rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-400">
                Nouveau
              </span>
            </button>
          ) : (
            <>
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onAdd({ id: s.id, name: s.name });
                    setQuery("");
                    setShowSuggestions(false);
                    inputRef.current?.focus();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-[var(--text-app)] transition hover:bg-[var(--bg-surface-hover)]"
                >
                  <Plus size={12} className="text-emerald-400" />
                  {s.name}
                </button>
              ))}
              {!exactMatch && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex w-full items-center gap-2 border-t border-[var(--border-app)] px-3 py-2.5 text-left text-xs text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-hover)]"
                >
                  <Plus size={12} className="text-amber-400" />
                  Créer <span className="font-semibold text-[var(--text-app)]">"{query.trim()}"</span>
                  <span className="ml-auto rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-400">
                    Nouveau
                  </span>
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
   UI HELPERS
============================================ */
const inputCls =
  "w-full rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2 text-sm text-[var(--text-app)] placeholder:text-[var(--text-faint)] transition focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </label>
      {children}
    </div>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
        active
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
          : "border-[var(--border-app)] bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-app)]"
      }`}
    >
      {children}
    </button>
  );
}

function PreviewSection({ title, children }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-faint)]">
        {title}
      </p>
      {children}
    </div>
  );
}

function PreviewRow({ label, value, highlight }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border-app)] pb-2 last:border-0">
      <dt className="text-xs text-[var(--text-muted)]">{label}</dt>
      <dd className={`text-right text-xs font-medium ${highlight ? "text-emerald-400" : "text-[var(--text-app)]"}`}>
        {value}
      </dd>
    </div>
  );
}