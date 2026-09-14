import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, X } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const MISSION_TYPES = [
  { value: "mission",   label: "Mission" },
  { value: "loan",      label: "Mise à disposition" },
  { value: "freelance", label: "Freelance" },
  { value: "part_time", label: "Temps partiel" },
  { value: "full_time", label: "Temps plein" },
];

const LOCATION_TYPES = [
  { value: "onsite", label: "🏢 Sur site" },
  { value: "remote", label: "🏠 Télétravail" },
  { value: "hybrid", label: "🔄 Hybride" },
];

const LEVELS = [
  { value: "beginner", label: "Débutant" },
  { value: "intermediate", label: "Intermédiaire" },
  { value: "advanced", label: "Avancé" },
  { value: "expert", label: "Expert" },
];

export default function CreateResourceOffer() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

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
      api.get(`/resource-offers/${id}`).then((res) => {
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
          skills: (o.skills || []).map((s) => ({ skill_id: s.id, name: s.name, level: s.pivot?.level || "intermediate" })),
        });
      });
    }
  }, [id]);

  useEffect(() => {
    if (company) {
      api.get(`/companies/${company.id}/employees`).then((res) => setEmployees(res.data.data || []));
    }
  }, [company]);

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
        await api.patch(`/resource-offers/${id}`, payload);
      } else {
        await api.post("/resource-offers", payload);
      }
      navigate("/resource-offers");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!company) {
    return <AppShell><p className="text-slate-500">Créez d'abord votre entreprise.</p></AppShell>;
  }

  return (
    <AppShell>
      <button onClick={() => navigate("/resource-offers")} className="flex items-center gap-1 text-sm text-slate-500 hover:text-navy">
        <ArrowLeft size={15} /> Mes offres
      </button>

      <h1 className="mt-4 text-2xl font-bold">
        {isEdit ? "Modifier l'offre" : "Prêter un salarié"}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Proposez un de vos salariés disponibles à d'autres entreprises.
      </p>

      <div className="mt-6 max-w-3xl space-y-6">
        {/* SALARIÉ */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold mb-3">Salarié à prêter</h2>
          {employees.length === 0 ? (
            <p className="text-sm text-slate-400">
              Aucun salarié dans votre entreprise. Ajoutez-en dans "Mon entreprise".
            </p>
          ) : (
            <select
              value={form.professional_profile_id}
              onChange={(e) => setForm({ ...form, professional_profile_id: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
              required
            >
              <option value="">Choisir un salarié...</option>
              {employees.filter((e) => e.user).map((emp) => (
                <option key={emp.id} value={emp.user?.professional_profile?.id || ""}>
                  {emp.user?.name} {emp.position && `· ${emp.position}`}
                </option>
              ))}
            </select>
          )}
        </section>

        {/* INFOS */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
          <h2 className="font-semibold">Informations</h2>
          <div>
            <label className="text-sm font-medium">Titre *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Développeur Laravel senior disponible"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Décrivez le profil, ses compétences, son contexte..."
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Type de mission *</label>
            <select
              value={form.mission_type}
              onChange={(e) => setForm({ ...form, mission_type: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            >
              {MISSION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </section>

        {/* PÉRIODE & CHARGE */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
          <h2 className="font-semibold">Période & Charge</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Début *</label>
              <input type="date" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-medium">Fin *</label>
              <input type="date" value={form.end_at} min={form.start_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Charge *</label>
              <input type="number" min="0" max="100" value={form.workload_value} onChange={(e) => setForm({ ...form, workload_value: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-medium">Unité</label>
              <select value={form.workload_unit} onChange={(e) => setForm({ ...form, workload_unit: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2">
                <option value="percentage">%</option>
                <option value="hours_per_week">heures/semaine</option>
                <option value="days_per_week">jours/semaine</option>
              </select>
            </div>
          </div>
        </section>

        {/* LOCALISATION */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
          <h2 className="font-semibold">Localisation</h2>
          <div className="grid grid-cols-3 gap-2">
            {LOCATION_TYPES.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => setForm({ ...form, location_type: l.value })}
                className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                  form.location_type === l.value ? "border-navy bg-navy/5 text-navy" : "border-slate-200"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
          {(form.location_type === "onsite" || form.location_type === "hybrid") && (
            <input
              placeholder="Ville (optionnel)"
              value={form.location_city}
              onChange={(e) => setForm({ ...form, location_city: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          )}
        </section>

        {/* COMPÉTENCES */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
          <h2 className="font-semibold">Compétences mises en avant</h2>
          <select
            onChange={(e) => { addSkill(e.target.value); e.target.value = ""; }}
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            defaultValue=""
          >
            <option value="" disabled>Ajouter une compétence...</option>
            {allSkills.filter((s) => !form.skills.some((fs) => fs.skill_id === s.id)).map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {form.skills.length > 0 && (
            <div className="space-y-2">
              {form.skills.map((s) => (
                <div key={s.skill_id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                  <span className="font-medium text-sm">{s.name}</span>
                  <button onClick={() => removeSkill(s.skill_id)} className="text-rose-500"><X size={16} /></button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CONDITIONS & TARIF */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
          <h2 className="font-semibold">Conditions & Tarif</h2>
          <div>
            <label className="text-sm font-medium">Conditions (optionnel)</label>
            <textarea
              rows={3}
              value={form.conditions}
              onChange={(e) => setForm({ ...form, conditions: e.target.value })}
              placeholder="Ex: NDA requis, pas de concurrence, 3 mois minimum..."
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Tarif/jour (€)</label>
              <input type="number" min="0" value={form.daily_rate} onChange={(e) => setForm({ ...form, daily_rate: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-medium">Tarif/heure (€)</label>
              <input type="number" min="0" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
            </div>
          </div>
        </section>

        {/* VISIBILITÉ */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
          <h2 className="font-semibold">Visibilité</h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: "public", label: "🌍 Public" },
              { v: "network", label: "🔗 Réseau" },
              { v: "private", label: "🔒 Privé" },
            ].map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setForm({ ...form, visibility: o.v })}
                className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                  form.visibility === o.v ? "border-navy bg-navy/5 text-navy" : "border-slate-200"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </section>

        {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

        <div className="flex gap-3 pb-8">
          <button
            onClick={() => submit("draft")}
            disabled={submitting}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold hover:border-navy disabled:opacity-60"
          >
            Enregistrer en brouillon
          </button>
          <button
            onClick={() => submit("published")}
            disabled={submitting}
            className="flex-1 rounded-xl bg-navy py-2.5 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-60"
          >
            {submitting ? "Publication..." : (isEdit ? "Mettre à jour" : "Publier l'offre")}
          </button>
        </div>
      </div>
    </AppShell>
  );
}