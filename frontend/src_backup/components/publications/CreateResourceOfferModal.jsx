
import React, { useEffect, useState } from "react";
import {
  X, Loader2, AlertCircle, Check, BriefcaseBusiness,
  UserRound, CalendarDays, MapPin, Sparkles, Euro,
  Eye, ChevronDown,
} from "lucide-react";
import api from "../../services/api";
import EmployeeSelector from "./EmployeeSelector";
import EmployeePickerModal from "./EmployeePickerModal";

const MISSION_TYPES = [
  { value: "mission", label: "Mission" },
  { value: "loan", label: "Mise à disposition" },
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
  { value: "public", label: "Public" },
  { value: "network", label: "Réseau" },
  { value: "private", label: "Privé" },
];

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10";

export default function CreateResourceOfferModal({
  offerId,
  onClose,
  onSuccess,
}) {
  const isEdit = Boolean(offerId);

  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
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
      .then((res) => {
        if (active) setCompany(res.data);
      })
      .catch(() => {
        if (active) setError("Impossible de charger les informations de l’entreprise.");
      });

    api.get("/skills")
      .then((res) => {
        if (active) {
          const data = res.data;
          setAllSkills(Array.isArray(data) ? data : data?.data || []);
        }
      })
      .catch(() => {
        if (active) setAllSkills([]);
      });

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
        .catch(() => {
          if (active) setError("Impossible de charger cette offre.");
        })
        .finally(() => {
          if (active) setLoadingOffer(false);
        });
    }

    return () => {
      active = false;
    };
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
      (e) =>
        String(e.user?.professional_profile?.id) ===
        String(form.professional_profile_id)
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

  const addSkill = (skillId) => {
    const skill = allSkills.find((s) => s.id === Number(skillId));

    if (
      !skill ||
      form.skills.some((s) => Number(s.skill_id) === Number(skill.id))
    ) return;

    setForm((current) => ({
      ...current,
      skills: [
        ...current.skills,
        {
          skill_id: skill.id,
          name: skill.name,
          level: "intermediate",
        },
      ],
    }));
  };

  const removeSkill = (skillId) => {
    setForm((current) => ({
      ...current,
      skills: current.skills.filter(
        (s) => Number(s.skill_id) !== Number(skillId)
      ),
    }));
  };

  const submit = async (status) => {
    setError(null);

    if (!form.title.trim()) return setError("Le titre est requis.");
    if (!form.professional_profile_id) {
      return setError("Sélectionnez un salarié.");
    }
    if (!form.start_at || !form.end_at) {
      return setError("Les dates sont requises.");
    }
    if (form.end_at < form.start_at) {
      return setError("La date de fin doit être postérieure à la date de début.");
    }
    if (!company?.id) {
      return setError("Les informations de votre entreprise ne sont pas disponibles.");
    }

    setSubmitting(true);

    try {
      const payload = {
        ...form,
        company_id: company.id,
        status,
        daily_rate: form.daily_rate === "" ? null : Number(form.daily_rate),
        hourly_rate: form.hourly_rate === "" ? null : Number(form.hourly_rate),
        skills: form.skills.map(({ skill_id, level }) => ({
          skill_id,
          level,
        })),
      };

      if (isEdit) {
        await api.patch(`/resource-offers/${offerId}`, payload);
      } else {
        await api.post("/resource-offers", payload);
      }

      onSuccess();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Une erreur est survenue lors de l’enregistrement."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="resource-offer-title"
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/70 bg-slate-50 shadow-2xl shadow-slate-950/20"
        >
          <header className="relative overflow-hidden border-b border-slate-200 bg-white px-5 py-5 sm:px-7">
            <div className="absolute right-0 top-0 h-28 w-28 translate-x-8 -translate-y-8 rounded-full bg-teal-100/70 blur-2xl" />

            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                  <BriefcaseBusiness size={21} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700">
                    Espace entreprise
                  </p>
                  <h2 id="resource-offer-title" className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    {isEdit ? "Modifier l’offre" : "Proposer un talent"}
                  </h2>
                  <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-500">
                    Présentez un collaborateur disponible pour une nouvelle opportunité.
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Fermer"
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>
          </header>

          <main className="flex-1 space-y-7 overflow-y-auto px-5 py-6 sm:px-7">
            {error && (
              <div role="alert" className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {loadingOffer ? (
              <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-slate-500">
                <Loader2 className="animate-spin text-teal-600" size={28} />
                <p className="text-sm">Chargement de l’offre…</p>
              </div>
            ) : (
              <>
                <Section number="01" title="Collaborateur" description="Choisissez le talent proposé par votre entreprise." icon={UserRound}>
                  {employees.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm leading-relaxed text-slate-500">
                      Aucun salarié n’est disponible dans votre entreprise. Vous pourrez en ajouter depuis la rubrique « Mon entreprise ».
                    </div>
                  ) : (
                    <EmployeeSelector
                      employee={selectedEmployee}
                      onOpenPicker={() => setShowPicker(true)}
                    />
                  )}
                </Section>

                <Section number="02" title="Informations de l’offre" description="Donnez les informations essentielles de votre proposition." icon={BriefcaseBusiness}>
                  <div className="space-y-4">
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
                      <select value={form.mission_type} onChange={(e) => update("mission_type", e.target.value)} className={inputCls}>
                        {MISSION_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </Section>

                <Section number="03" title="Période et disponibilité" description="Précisez les dates et la charge de travail souhaitée." icon={CalendarDays}>
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
                </Section>

                <Section number="04" title="Localisation" description="Définissez le mode de travail et le lieu de la mission." icon={MapPin}>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {LOCATION_TYPES.map((item) => (
                      <Choice
                        key={item.value}
                        active={form.location_type === item.value}
                        onClick={() => update("location_type", item.value)}
                        label={item.label}
                      />
                    ))}
                  </div>

                  {(form.location_type === "onsite" || form.location_type === "hybrid") && (
                    <div className="mt-4">
                      <Field label="Ville de la mission">
                        <input value={form.location_city} onChange={(e) => update("location_city", e.target.value)} placeholder="Ex. Antananarivo" className={inputCls} />
                      </Field>
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Pays">
                      <input value={form.country} onChange={(e) => update("country", e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Ville complémentaire">
                      <input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Ville, si nécessaire" className={inputCls} />
                    </Field>
                  </div>
                </Section>

                <Section number="05" title="Compétences clés" description="Mettez en avant les compétences pertinentes pour cette offre." icon={Sparkles}>
                  <select
                    value=""
                    onChange={(e) => addSkill(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Ajouter une compétence…</option>
                    {allSkills
                      .filter((s) => !form.skills.some((fs) => Number(fs.skill_id) === Number(s.id)))
                      .map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>

                  {form.skills.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {form.skills.map((skill) => (
                        <span key={skill.skill_id} className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-800">
                          {skill.name}
                          <button type="button" aria-label={`Retirer ${skill.name}`} onClick={() => removeSkill(skill.skill_id)} className="rounded-full p-0.5 text-teal-700/60 transition hover:bg-rose-100 hover:text-rose-600">
                            <X size={13} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-400">Aucune compétence ajoutée pour le moment.</p>
                  )}
                </Section>

                <Section number="06" title="Conditions et tarifs" description="Ajoutez les conditions particulières et les tarifs indicatifs." icon={Euro}>
                  <div className="space-y-4">
                    <Field label="Conditions particulières">
                      <textarea rows={3} value={form.conditions} onChange={(e) => update("conditions", e.target.value)} placeholder="Ex. NDA requis, durée minimale, conditions de collaboration…" className={`${inputCls} resize-y`} />
                    </Field>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Tarif journalier (€)">
                        <input type="number" min="0" value={form.daily_rate} onChange={(e) => update("daily_rate", e.target.value)} placeholder="Ex. 300" className={inputCls} />
                      </Field>
                      <Field label="Tarif horaire (€)">
                        <input type="number" min="0" value={form.hourly_rate} onChange={(e) => update("hourly_rate", e.target.value)} placeholder="Ex. 40" className={inputCls} />
                      </Field>
                    </div>
                  </div>
                </Section>

                <Section number="07" title="Visibilité de l’offre" description="Choisissez qui peut consulter cette proposition." icon={Eye}>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {VISIBILITY_TYPES.map((item) => (
                      <Choice
                        key={item.value}
                        active={form.visibility === item.value}
                        onClick={() => update("visibility", item.value)}
                        label={item.label}
                      />
                    ))}
                  </div>
                </Section>
              </>
            )}
          </main>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="text-xs text-slate-400">
              <span className="font-semibold text-slate-600">*</span> Champs obligatoires
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
                Annuler
              </button>
              <button type="button" onClick={() => submit("draft")} disabled={submitting || loadingOffer} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
                Enregistrer en brouillon
              </button>
              <button type="button" onClick={() => submit("published")} disabled={submitting || loadingOffer} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-50">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {submitting ? "Enregistrement…" : isEdit ? "Enregistrer" : "Publier l’offre"}
              </button>
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

function Section({ number, title, description, icon: Icon, children }) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-700">
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest text-teal-700">{number}</span>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
        </div>
      </div>
      <div className="space-y-4 sm:pl-[52px]">{children}</div>
    </section>
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
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
        active
          ? "border-teal-500 bg-teal-50 text-teal-800 ring-2 ring-teal-500/10"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <span className="flex items-center justify-center gap-2">
        {active && <Check size={15} />}
        {label}
      </span>
    </button>
  );
}
