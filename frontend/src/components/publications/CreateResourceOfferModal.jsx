import React, { useEffect, useState } from "react";
import { X, Loader2, AlertCircle, Check } from "lucide-react";
import api from "../../services/api";
import EmployeeSelector from "./EmployeeSelector";
import EmployeePickerModal from "./EmployeePickerModal";

const MISSION_TYPES = [
  { value: "mission",   label: "Mission" },
  { value: "loan",      label: "Mise à disposition" },
  { value: "freelance", label: "Freelance" },
  { value: "part_time", label: "Temps partiel" },
  { value: "full_time", label: "Temps plein" },
];

const LOCATION_TYPES = [
  { value: "onsite", label: "Sur site" },
  { value: "remote", label: "Télétravail" },
  { value: "hybrid", label: "Hybride" },
];

const VISIBILITY_TYPES = [
  { value: "public",  label: "Public" },
  { value: "network", label: "Réseau" },
  { value: "private", label: "Privé" },
];

export default function CreateResourceOfferModal({ offerId, onClose, onSuccess }) {
  const isEdit = Boolean(offerId);

  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Picker salarié
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

  useEffect(() => {
    api.get("/companies/me").then((res) => setCompany(res.data));
    api.get("/skills").then((res) => setAllSkills(res.data));

    if (isEdit) {
      api.get(`/resource-offers/${offerId}`).then((res) => {
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
          daily_rate: o.daily_rate || "",
          hourly_rate: o.hourly_rate || "",
          skills: (o.skills || []).map((s) => ({
            skill_id: s.id,
            name: s.name,
            level: s.pivot?.level || "intermediate",
          })),
        });
      });
    }
  }, [offerId, isEdit]);

  useEffect(() => {
    if (company) {
      api.get(`/companies/${company.id}/employees`)
        .then((res) => setEmployees(res.data.data || []));
    }
  }, [company]);

  // ✅ Hydrate selectedEmployee quand form.professional_profile_id change
  useEffect(() => {
    if (!form.professional_profile_id || employees.length === 0) return;
    const found = employees.find(
      (e) => String(e.user?.professional_profile?.id) === String(form.professional_profile_id)
    );
    if (found) setSelectedEmployee(found);
  }, [form.professional_profile_id, employees]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const addSkill = (skillId) => {
    const skill = allSkills.find((s) => s.id === Number(skillId));
    if (!skill || form.skills.some((s) => s.skill_id === skill.id)) return;
    setForm({ ...form, skills: [...form.skills, { skill_id: skill.id, name: skill.name, level: "intermediate" }] });
  };

  const removeSkill = (skillId) => {
    setForm({ ...form, skills: form.skills.filter((s) => s.skill_id !== skillId) });
  };

  const submit = async (status) => {
    setError(null);

    if (!form.title.trim()) return setError("Le titre est requis.");
    if (!form.professional_profile_id) return setError("Sélectionnez un salarié.");
    if (!form.start_at || !form.end_at) return setError("Les dates sont requises.");

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

      if (isEdit) {
        await api.patch(`/resource-offers/${offerId}`, payload);
      } else {
        await api.post("/resource-offers", payload);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-modalOverlay"
        onClick={onClose}
      >
        <div
          className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] shadow-2xl animate-modalContent"
          onClick={(e) => e.stopPropagation()}
        >

          {/* ===== HEADER ===== */}
          <div className="flex items-start justify-between gap-3 border-b border-[var(--border-app)] px-6 py-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                {isEdit ? "Modifier" : "Nouvelle offre"}
              </p>
              <h2 className="mt-0.5 text-xl font-bold text-[var(--text-app)]">
                {isEdit ? "Modifier l'offre de ressource" : "Proposer un talent"}
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Proposez un de vos talents disponibles à d'autres entreprises.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--text-faint)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-app)]"
            >
              <X size={18} />
            </button>
          </div>

          {/* ===== BODY ===== */}
          <div className="flex-1 space-y-6 overflow-y-auto p-6">

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {/* ---- ① SALARIÉ ---- */}
            <Section title="Salarié concerné" step="1">
              {employees.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">
                  Aucun salarié dans votre entreprise. Ajoutez-en dans "Mon entreprise".
                </p>
              ) : (
                <EmployeeSelector
                  employee={selectedEmployee}
                  onOpenPicker={() => setShowPicker(true)}
                />
              )}
            </Section>

            {/* ---- ② INFORMATIONS ---- */}
            <Section title="Informations générales" step="2">
              <Field label="Titre de l'offre *">
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Développeur Laravel senior disponible"
                  className={inputCls}
                />
              </Field>

              <Field label="Description">
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Décrivez le profil, ses compétences, son contexte..."
                  className={inputCls}
                />
              </Field>

              <Field label="Type de mission *">
                <select
                  value={form.mission_type}
                  onChange={(e) => setForm({ ...form, mission_type: e.target.value })}
                  className={inputCls}
                >
                  {MISSION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </Field>
            </Section>

            {/* ---- ③ PÉRIODE & CHARGE ---- */}
            <Section title="Période et charge" step="3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Début *">
                  <input
                    type="date"
                    value={form.start_at}
                    onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Fin *">
                  <input
                    type="date"
                    value={form.end_at}
                    min={form.start_at}
                    onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Charge *">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.workload_value}
                    onChange={(e) => setForm({ ...form, workload_value: Number(e.target.value) })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Unité">
                  <select
                    value={form.workload_unit}
                    onChange={(e) => setForm({ ...form, workload_unit: e.target.value })}
                    className={inputCls}
                  >
                    <option value="percentage">%</option>
                    <option value="hours_per_week">heures / semaine</option>
                    <option value="days_per_week">jours / semaine</option>
                  </select>
                </Field>
              </div>
            </Section>

            {/* ---- ④ LOCALISATION ---- */}
            <Section title="Localisation" step="4">
              <div className="grid grid-cols-3 gap-2">
                {LOCATION_TYPES.map((l) => (
                  <Pill
                    key={l.value}
                    active={form.location_type === l.value}
                    onClick={() => setForm({ ...form, location_type: l.value })}
                  >
                    {l.label}
                  </Pill>
                ))}
              </div>

              {(form.location_type === "onsite" || form.location_type === "hybrid") && (
                <Field label="Ville">
                  <input
                    placeholder="Ex: Antananarivo"
                    value={form.location_city}
                    onChange={(e) => setForm({ ...form, location_city: e.target.value })}
                    className={inputCls}
                  />
                </Field>
              )}
            </Section>

            {/* ---- ⑤ COMPÉTENCES ---- */}
            <Section title="Compétences mises en avant" step="5">
              <select
                onChange={(e) => { addSkill(e.target.value); e.target.value = ""; }}
                className={inputCls}
                defaultValue=""
              >
                <option value="" disabled>Ajouter une compétence...</option>
                {allSkills
                  .filter((s) => !form.skills.some((fs) => fs.skill_id === s.id))
                  .map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
              </select>

              {form.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {form.skills.map((s) => (
                    <span
                      key={s.skill_id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400"
                    >
                      {s.name}
                      <button
                        onClick={() => removeSkill(s.skill_id)}
                        className="text-emerald-400/70 transition hover:text-rose-400"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </Section>

            {/* ---- ⑥ CONDITIONS & TARIF ---- */}
            <Section title="Conditions et tarif" step="6">
              <Field label="Conditions (optionnel)">
                <textarea
                  rows={3}
                  value={form.conditions}
                  onChange={(e) => setForm({ ...form, conditions: e.target.value })}
                  placeholder="Ex: NDA requis, pas de concurrence, 3 mois minimum..."
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Tarif / jour (€)">
                  <input
                    type="number"
                    min="0"
                    value={form.daily_rate}
                    onChange={(e) => setForm({ ...form, daily_rate: e.target.value })}
                    placeholder="Ex: 300"
                    className={inputCls}
                  />
                </Field>
                <Field label="Tarif / heure (€)">
                  <input
                    type="number"
                    min="0"
                    value={form.hourly_rate}
                    onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
                    placeholder="Ex: 40"
                    className={inputCls}
                  />
                </Field>
              </div>
            </Section>

            {/* ---- ⑦ VISIBILITÉ ---- */}
            <Section title="Visibilité" step="7">
              <div className="grid grid-cols-3 gap-2">
                {VISIBILITY_TYPES.map((o) => (
                  <Pill
                    key={o.value}
                    active={form.visibility === o.value}
                    onClick={() => setForm({ ...form, visibility: o.value })}
                  >
                    {o.label}
                  </Pill>
                ))}
              </div>
            </Section>

          </div>

          {/* ===== FOOTER ===== */}
          <div className="flex items-center justify-end gap-2 border-t border-[var(--border-app)] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-[var(--text-muted)] transition hover:bg-[var(--bg-surface-hover)]"
            >
              Annuler
            </button>
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
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
              {submitting ? "Publication..." : isEdit ? "Enregistrer" : "Publier l'offre"}
            </button>
          </div>
        </div>
      </div>

      {/* ✅ PICKER MODAL (empilé, au-dessus du modal principal) */}
      {showPicker && (
        <EmployeePickerModal
          employees={employees.filter((e) => e.user)}
          selectedId={form.professional_profile_id}
          onSelect={(emp) => {
            setSelectedEmployee(emp);
            setForm({
              ...form,
              professional_profile_id: emp.user?.professional_profile?.id || "",
            });
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}

/* ============================================
   UI HELPERS
============================================ */
const inputCls =
  "w-full rounded-lg border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-2 text-sm text-[var(--text-app)] placeholder:text-[var(--text-faint)] transition focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

function Section({ title, step, children }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/15 text-[10px] font-bold text-emerald-400">
          {step}
        </span>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

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