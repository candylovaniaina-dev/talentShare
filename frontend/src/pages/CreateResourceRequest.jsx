import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Check, ChevronLeft, ChevronRight, X, DollarSign, Zap, Users,
  Tag, AlertCircle, Plus, Sparkles,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

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

const asArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export default function CreateResourceRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams(); // Pour édition éventuelle
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
    skills: [], // [{ skill_id, name, min_level }]
    start_at: "",
    end_at: "",
    workload_percent: 100,
    remote: false,
    country: "Madagascar",
    city: "",
    expires_at: "",
    // ✅ NOUVEAUX CHAMPS P0-9
    budget_min: "",
    budget_max: "",
    positions_count: 1,
    urgency: "normal",
    tags: [],
  });

  // Chargement initial
  useEffect(() => {
    api.get("/companies").then((res) => {
      const all = asArray(res.data);
      setCompany(all.find((c) => c.owner_user_id === user.id));
    });
    api.get("/skills", { params: { limit: 500 } })
      .then((res) => setAllSkills(asArray(res.data)))
      .catch(console.error);
  }, [user.id]);

  // Charger en mode édition
  useEffect(() => {
    if (id) {
      api.get(`/resource-requests/${id}`).then((res) => {
        const r = res.data;
        setForm({
          title: r.title || "",
          description: r.description || "",
          mission_type: r.mission_type || "mission",
          skills: (r.skills || []).map((s) => ({
            skill_id: s.id, name: s.name, min_level: s.pivot?.min_level || "intermediate",
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
  }, [id]);

  // ============================================
  // Actions compétences
  // ============================================
  const addSkill = (skillId) => {
    const skill = allSkills.find((s) => s.id === Number(skillId));
    if (!skill || form.skills.some((s) => s.skill_id === skill.id)) return;
    setForm({
      ...form,
      skills: [...form.skills, { skill_id: skill.id, name: skill.name, min_level: "intermediate" }],
    });
  };

  const setSkillLevel = (skillId, level) => {
    setForm({
      ...form,
      skills: form.skills.map((s) => s.skill_id === skillId ? { ...s, min_level: level } : s),
    });
  };

  const removeSkill = (skillId) => {
    setForm({ ...form, skills: form.skills.filter((s) => s.skill_id !== skillId) });
  };

  // ============================================
  // Actions tags
  // ============================================
  const addTag = (tag) => {
    const clean = tag.trim();
    if (!clean || form.tags.includes(clean) || form.tags.length >= 10) return;
    setForm({ ...form, tags: [...form.tags, clean] });
    setTagInput("");
  };

  const removeTag = (tag) => {
    setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });
  };

  // ============================================
  // Validation step
  // ============================================
  const canProceed = () => {
    if (step === 0) return form.title.trim() && form.description.trim();
    if (step === 1) return form.skills.length > 0;
    if (step === 2) return form.start_at && form.end_at;
    return true;
  };

  // ============================================
  // Submit
  // ============================================
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
        // ✅ NOUVEAUX
        budget_min: form.budget_min === "" ? null : Number(form.budget_min),
        budget_max: form.budget_max === "" ? null : Number(form.budget_max),
        positions_count: Number(form.positions_count) || 1,
        urgency: form.urgency,
        tags: form.tags,
        skills: form.skills.map(({ skill_id, min_level }) => ({ skill_id, min_level })),
      };

      if (id) {
        await api.patch(`/resource-requests/${id}`, payload);
      } else {
        await api.post("/resource-requests", payload);
      }
      navigate("/resource-requests");
    } catch (err) {
      const msg = err.response?.data?.message;
      const errors = err.response?.data?.errors;
      setError(
        msg || (errors ? Object.values(errors).flat().join(" · ") : "Une erreur est survenue.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!company) {
    return (
      <AppShell>
        <p className="text-slate-500">Créez d'abord votre entreprise dans "Mon entreprise".</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold">
          {id ? "Modifier la demande" : "Nouvelle demande de ressource"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Décrivez votre besoin en 4 étapes. Vous pourrez le publier ou l'enregistrer en brouillon.
        </p>

        {/* Barre de progression */}
        <div className="mt-6 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                i < step ? "bg-mint text-navy" : i === step ? "bg-navy text-white" : "bg-slate-100 text-slate-400"
              }`}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span className={`hidden text-xs font-semibold sm:block ${i === step ? "text-navy" : "text-slate-400"}`}>
                {s}
              </span>
              {i < STEPS.length - 1 && <div className="h-px flex-1 bg-slate-200" />}
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          {/* ============================================
              ÉTAPE 1 — LE BESOIN
              ============================================ */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium">Titre de la mission *</label>
                <input
                  required
                  placeholder="Ex. Développeur Laravel senior pour refonte API"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description du besoin *</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Décrivez le contexte, les objectifs et les livrables attendus..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Type de mission</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {MISSION_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm({ ...form, mission_type: t.value })}
                      className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                        form.mission_type === t.value
                          ? "border-mint bg-mint/10 text-navy"
                          : "border-slate-200"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ✅ NOUVEAU : Urgence */}
              <div>
                <label className="text-sm font-medium">Niveau d'urgence</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, urgency: "normal" })}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium ${
                      form.urgency === "normal"
                        ? "border-navy bg-navy text-white"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, urgency: "urgent" })}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium ${
                      form.urgency === "urgent"
                        ? "border-rose-500 bg-rose-500 text-white"
                        : "border-slate-200 text-rose-600"
                    }`}
                  >
                    <Zap size={14} /> Urgent
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================
              ÉTAPE 2 — COMPÉTENCES
              ============================================ */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Ajouter une compétence requise *</label>
                <select
                  onChange={(e) => { addSkill(e.target.value); e.target.value = ""; }}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  defaultValue=""
                >
                  <option value="" disabled>Choisir une compétence...</option>
                  {allSkills
                    .filter((s) => !form.skills.some((fs) => fs.skill_id === s.id))
                    .map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
              </div>

              {form.skills.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-400">
                  Aucune compétence ajoutée pour l'instant.
                </p>
              ) : (
                <div className="space-y-2">
                  {form.skills.map((s) => (
                    <div
                      key={s.skill_id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2"
                    >
                      <span className="font-medium">{s.name}</span>
                      <div className="flex items-center gap-2">
                        <select
                          value={s.min_level}
                          onChange={(e) => setSkillLevel(s.skill_id, e.target.value)}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                        >
                          {LEVELS.map((l) => (
                            <option key={l.value} value={l.value}>{l.label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeSkill(s.skill_id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================
              ÉTAPE 3 — CONDITIONS
              ============================================ */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Période */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Début souhaité *</label>
                  <input
                    type="date"
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                    value={form.start_at}
                    onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Fin prévue *</label>
                  <input
                    type="date"
                    required
                    min={form.start_at}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                    value={form.end_at}
                    onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                  />
                </div>
              </div>

              {/* Charge */}
              <div>
                <label className="text-sm font-medium">
                  Charge de travail : <b>{form.workload_percent}%</b>
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  className="mt-2 w-full"
                  value={form.workload_percent}
                  onChange={(e) => setForm({ ...form, workload_percent: Number(e.target.value) })}
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.remote}
                  onChange={(e) => setForm({ ...form, remote: e.target.checked })}
                />
                🏠 Télétravail possible
              </label>

              {/* Localisation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Pays</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Ville</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
              </div>

              {/* ✅ NOUVEAU : Budget */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                <label className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5 mb-3">
                  <DollarSign size={13} /> Budget journalier (optionnel)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Minimum (€/jour)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Ex: 300"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 bg-white"
                      value={form.budget_min}
                      onChange={(e) => setForm({ ...form, budget_min: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Maximum (€/jour)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Ex: 500"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 bg-white"
                      value={form.budget_max}
                      onChange={(e) => setForm({ ...form, budget_max: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* ✅ NOUVEAU : Nombre de postes */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
                <label className="text-xs font-bold text-blue-800 uppercase flex items-center gap-1.5 mb-2">
                  <Users size={13} /> Nombre de postes à pourvoir
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, positions_count: Math.max(1, form.positions_count - 1) })}
                    className="h-9 w-9 rounded-full border border-slate-200 bg-white font-bold hover:border-navy"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-xl font-bold text-navy">
                    {form.positions_count}
                  </span>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, positions_count: Math.min(50, form.positions_count + 1) })}
                    className="h-9 w-9 rounded-full border border-slate-200 bg-white font-bold hover:border-navy"
                  >
                    +
                  </button>
                  <span className="text-xs text-slate-500">
                    {form.positions_count > 1 ? "postes" : "poste"}
                  </span>
                </div>
              </div>

              {/* ✅ NOUVEAU : Tags */}
              <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4">
                <label className="text-xs font-bold text-purple-800 uppercase flex items-center gap-1.5 mb-2">
                  <Tag size={13} /> Tags / domaine (max 10)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.tags.map((t) => (
                    <span
                      key={t}
                      className="flex items-center gap-1 rounded-full bg-white border border-purple-200 px-2.5 py-1 text-xs font-medium text-purple-700"
                    >
                      {t}
                      <button onClick={() => removeTag(t)} className="text-purple-400 hover:text-purple-700">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag(tagInput);
                      }
                    }}
                    placeholder="Ex: Développement, Data..."
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 bg-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => addTag(tagInput)}
                    disabled={!tagInput.trim()}
                    className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {SUGGESTED_TAGS.filter((t) => !form.tags.includes(t)).slice(0, 6).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => addTag(t)}
                      className="rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-xs text-slate-600 hover:border-purple-400 hover:text-purple-700"
                    >
                      + {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiration */}
              <div>
                <label className="text-sm font-medium">Date d'expiration de l'annonce (optionnel)</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={form.expires_at}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Par défaut : 60 jours si publiée.
                </p>
              </div>
            </div>
          )}

          {/* ============================================
              ÉTAPE 4 — APERÇU
              ============================================ */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="rounded-2xl bg-slate-50 p-5">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h3 className="font-bold text-lg">{form.title}</h3>
                  {form.urgency === "urgent" && (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700 flex items-center gap-1">
                      <Zap size={10} /> Urgent
                    </span>
                  )}
                  {form.positions_count > 1 && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                      {form.positions_count} postes
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600">{form.description}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-400 mb-2">
                  Compétences requises
                </p>
                <div className="flex flex-wrap gap-2">
                  {form.skills.map((s) => (
                    <span
                      key={s.skill_id}
                      className="rounded-full bg-mint/15 px-3 py-1 text-xs font-semibold text-navy"
                    >
                      {s.name} · {LEVELS.find((l) => l.value === s.min_level)?.label}
                    </span>
                  ))}
                </div>
              </div>

              {form.tags.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {form.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-purple-50 border border-purple-200 px-2.5 py-1 text-xs font-medium text-purple-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">Période</p>
                  <p className="mt-1">{form.start_at} → {form.end_at}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">Charge</p>
                  <p className="mt-1">{form.workload_percent}% {form.remote && "· 🏠 télétravail"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">Lieu</p>
                  <p className="mt-1">{form.city ? `${form.city}, ` : ""}{form.country}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">Expiration</p>
                  <p className="mt-1">{form.expires_at || "Non définie (60j par défaut)"}</p>
                </div>
                {form.budget_min && form.budget_max && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold uppercase text-slate-400">Budget</p>
                    <p className="mt-1 text-navy font-semibold">
                      💰 {form.budget_min} – {form.budget_max} €/jour
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700 flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 border-t border-slate-100 pt-4">
                <button
                  onClick={() => submit("draft")}
                  disabled={submitting}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold hover:border-navy disabled:opacity-60"
                >
                  💾 Enregistrer en brouillon
                </button>
                <button
                  onClick={() => submit("published")}
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-navy py-2.5 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Sparkles size={14} />
                  {submitting ? "Publication..." : "Publier la demande"}
                </button>
              </div>
            </div>
          )}

          {/* Navigation */}
          {step < 3 && (
            <div className="mt-6 flex justify-between border-t border-slate-100 pt-4">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 disabled:opacity-0"
              >
                <ChevronLeft size={16} /> Retour
              </button>
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-1 rounded-xl bg-navy px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                Continuer <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}