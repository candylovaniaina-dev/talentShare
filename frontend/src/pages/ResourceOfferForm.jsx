import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Save, Send, Globe, Building2, Lock, AlertTriangle } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import api from "../services/api";
import {
  MISSION_TYPES, LOCATION_LABELS, VISIBILITY, LEVEL_LABELS, Avatar, Field, Spinner,
  inputCls, cardCls, btnPrimary, btnGhost, durationLabel, fmtDate, toInputDate, apiError, workloadLabel,
} from "../components/resource-sharing/shared";

const EMPTY = {
  company_id: "", professional_profile_id: "", title: "", description: "",
  mission_type: "mission", start_at: "", end_at: "",
  workload_value: 100, workload_unit: "percentage",
  location_type: "onsite", location_city: "", daily_rate: "",
  conditions: "", visibility: "public", skill_ids: [],
};

const VIS_ICONS = { public: Globe, companies: Building2, private: Lock };

function Section({ step, title, desc, children }) {
  return (
    <section className={`${cardCls} p-5 sm:p-6`}>
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{step}</span>
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
          {desc && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{desc}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function ResourceOfferForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast, show, close } = useToast();

  const [form, setForm] = useState(EMPTY);
  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingEmp, setLoadingEmp] = useState(false);
  const [saving, setSaving] = useState(null); // "draft" | "published"
  const [offerStatus, setOfferStatus] = useState("draft");
  const [fallbackSkills, setFallbackSkills] = useState([]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Entreprises + (édition) offre
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/companies/my/all");
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setCompanies(list);

        if (isEdit) {
          const { data: o } = await api.get(`/resource-sharing/${id}`);
          setOfferStatus(o.status);
          setFallbackSkills(o.profile?.skills || []);
          setForm({
            company_id: o.company_id, professional_profile_id: o.professional_profile_id,
            title: o.title || "", description: o.description || "",
            mission_type: o.mission_type || "mission",
            start_at: toInputDate(o.start_at), end_at: toInputDate(o.end_at),
            workload_value: o.workload_value ?? 100, workload_unit: o.workload_unit || "percentage",
            location_type: o.location_type || "onsite", location_city: o.location_city || "",
            daily_rate: o.daily_rate ?? "", conditions: o.conditions || "",
            visibility: o.visibility || "public",
            skill_ids: (o.skills || []).map((s) => s.id),
          });
        } else if (list[0]) {
          set("company_id", list[0].id);
        }
      } catch (e) {
        show(isEdit ? "Offre introuvable" : apiError(e), "error");
      } finally { setLoading(false); }
    })();
    // eslint-disable-next-line
  }, [id]);

  // Salariés de l'entreprise choisie
  useEffect(() => {
    if (!form.company_id) return;
    setLoadingEmp(true);
    api.get("/resource-sharing/employees", { params: { company_id: form.company_id } })
      .then((r) => setEmployees(Array.isArray(r.data) ? r.data : []))
      .catch(() => setEmployees([]))
      .finally(() => setLoadingEmp(false));
  }, [form.company_id]);

  const selected = useMemo(
    () => employees.find((e) => e.professional_profile_id === Number(form.professional_profile_id)),
    [employees, form.professional_profile_id]
  );
  const skillOptions = selected?.skills?.length ? selected.skills : fallbackSkills.map((s) => ({ id: s.id, name: s.name, level: s.pivot?.level }));

  const pickEmployee = (e) => {
    if (!e.shareable || isEdit) return;
    setForm((f) => ({
      ...f,
      professional_profile_id: e.professional_profile_id,
      skill_ids: e.skills.map((s) => s.id),
      title: f.title || (e.headline ? `${e.headline} disponible` : f.title),
    }));
  };

  const toggleSkill = (sid) =>
    set("skill_ids", form.skill_ids.includes(sid) ? form.skill_ids.filter((x) => x !== sid) : [...form.skill_ids, sid]);

  const periodInvalid = form.start_at && form.end_at && form.end_at < form.start_at;
  const maxLoad = { percentage: 100, hours_per_week: 80, days_per_week: 7 }[form.workload_unit];
  const loadInvalid = Number(form.workload_value) < 1 || Number(form.workload_value) > maxLoad;

  const canSubmit =
    form.company_id && form.professional_profile_id && form.title.trim() &&
    form.description.trim().length >= 20 && form.start_at && form.end_at && !periodInvalid && !loadInvalid;

  const submit = async (status) => {
    if (!canSubmit) { show("Complétez les champs obligatoires (description : 20 caractères min.).", "error"); return; }
    setSaving(status);
    const payload = {
      ...form,
      company_id: Number(form.company_id),
      professional_profile_id: Number(form.professional_profile_id),
      workload_value: Number(form.workload_value),
      daily_rate: form.daily_rate === "" ? null : Number(form.daily_rate),
      location_city: form.location_city.trim() || null,
      conditions: form.conditions.trim() || null,
      status,
    };
    try {
      if (isEdit) await api.patch(`/resource-sharing/${id}`, payload);
      else await api.post("/resource-sharing", payload);
      show(status === "published" ? "✅ Offre publiée" : "Brouillon enregistré", "success");
      setTimeout(() => navigate("/resource-offers"), 700);
    } catch (e) {
      show(apiError(e), "error");
    } finally { setSaving(null); }
  };

  if (loading) return <AppShell><Spinner /></AppShell>;

  if (!companies.length) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl px-4 py-16 text-center text-sm text-slate-500">
          Créez d'abord votre entreprise pour pouvoir partager un salarié.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[1100px] space-y-5 px-3 pb-12 pt-5 sm:px-5 lg:px-8">
        <Link to="/resource-offers" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-600">
          <ArrowLeft size={15} /> Mes offres
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0B253B] dark:text-white">
            {isEdit ? "Modifier l'offre" : "Prêter un salarié"}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Décrivez la disponibilité de votre salarié : les autres entreprises pourront la découvrir et vous envoyer une proposition.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            {/* 1. Salarié */}
            <Section step="1" title="Salarié à partager" desc="Seuls les salariés actifs disposant d'un profil professionnel peuvent être partagés.">
              {companies.length > 1 && !isEdit && (
                <div className="mb-4 max-w-sm">
                  <Field label="Entreprise" required>
                    <select value={form.company_id} onChange={(e) => { set("company_id", e.target.value); set("professional_profile_id", ""); set("skill_ids", []); }} className={inputCls}>
                      {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </Field>
                </div>
              )}

              {loadingEmp ? (
                <div className="flex items-center gap-2 py-6 text-xs text-slate-500"><Loader2 size={15} className="animate-spin" /> Chargement des salariés...</div>
              ) : employees.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500 dark:bg-slate-900">
                  Aucun salarié actif. Ajoutez des salariés depuis « Mon entreprise » avant de créer une offre.
                </p>
              ) : (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {employees.map((e) => {
                    const active = Number(form.professional_profile_id) === e.professional_profile_id;
                    const locked = isEdit && !active;
                    return (
                      <button type="button" key={e.id} onClick={() => pickEmployee(e)} disabled={!e.shareable || locked}
                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${active
                          ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20 dark:bg-emerald-500/10"
                          : "border-slate-200 hover:border-emerald-300 dark:border-slate-700"} ${(!e.shareable || locked) ? "cursor-not-allowed opacity-50" : ""}`}>
                        <Avatar name={e.name} path={e.avatar_path} size={40} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{e.name}</p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {e.shareable ? (e.headline || e.position || "—") : "Pas de profil professionnel"}
                          </p>
                        </div>
                        {active && <Check size={16} className="text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {skillOptions.length > 0 && form.professional_profile_id && (
                <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <p className="mb-2 text-xs font-bold text-slate-700 dark:text-slate-300">Compétences mises en avant</p>
                  <div className="flex flex-wrap gap-2">
                    {skillOptions.map((s) => {
                      const on = form.skill_ids.includes(s.id);
                      return (
                        <button type="button" key={s.id} onClick={() => toggleSkill(s.id)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${on
                            ? "border-emerald-500 bg-emerald-600 text-white dark:bg-emerald-500 dark:text-[#06251F]"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>
                          {s.name}{s.level && <span className="ml-1 font-normal opacity-70">· {LEVEL_LABELS[s.level] || s.level}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </Section>

            {/* 2. Mission */}
            <Section step="2" title="Type et description de la mission">
              <div className="space-y-4">
                <Field label="Titre de l'offre" required>
                  <input value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={150} placeholder="Ex. Développeur Laravel disponible 3 mois" className={inputCls} />
                </Field>
                <div>
                  <p className="mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">Type de mission *</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(MISSION_TYPES).map(([k, label]) => (
                      <button type="button" key={k} onClick={() => set("mission_type", k)}
                        className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${form.mission_type === k
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "border-slate-200 text-slate-600 hover:border-emerald-300 dark:border-slate-700 dark:text-slate-300"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <Field label="Description" required hint={`${form.description.trim().length}/20 caractères minimum`}>
                  <textarea rows={5} value={form.description} onChange={(e) => set("description", e.target.value)}
                    placeholder="Quel type de travail ce salarié peut-il prendre en charge ? Contexte, livrables, points forts..." className={inputCls} />
                </Field>
              </div>
            </Section>

            {/* 3. Période & charge */}
            <Section step="3" title="Période et charge de travail">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Disponible à partir du" required>
                  <input type="date" value={form.start_at} min={isEdit ? undefined : new Date().toISOString().slice(0, 10)} onChange={(e) => set("start_at", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Jusqu'au" required>
                  <input type="date" value={form.end_at} min={form.start_at} onChange={(e) => set("end_at", e.target.value)} className={inputCls} />
                </Field>
              </div>
              {periodInvalid && <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-600"><AlertTriangle size={13} /> La date de fin précède la date de début.</p>}
              {form.start_at && form.end_at && !periodInvalid && (
                <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">Durée : {durationLabel(form.start_at, form.end_at)}</p>
              )}

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Charge de travail" required hint={`Maximum ${maxLoad}`}>
                  <input type="number" min={1} max={maxLoad} value={form.workload_value} onChange={(e) => set("workload_value", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Unité">
                  <select value={form.workload_unit} onChange={(e) => set("workload_unit", e.target.value)} className={inputCls}>
                    <option value="percentage">% du temps</option>
                    <option value="hours_per_week">heures / semaine</option>
                    <option value="days_per_week">jours / semaine</option>
                  </select>
                </Field>
              </div>
              {loadInvalid && <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-600"><AlertTriangle size={13} /> La charge doit être comprise entre 1 et {maxLoad}.</p>}
            </Section>

            {/* 4. Lieu */}
            <Section step="4" title="Localisation et tarif">
              <div className="flex flex-wrap gap-2">
                {Object.entries(LOCATION_LABELS).map(([k, label]) => (
                  <button type="button" key={k} onClick={() => set("location_type", k)}
                    className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${form.location_type === k
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "border-slate-200 text-slate-600 hover:border-emerald-300 dark:border-slate-700 dark:text-slate-300"}`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Ville"><input value={form.location_city} onChange={(e) => set("location_city", e.target.value)} placeholder="Antananarivo" className={inputCls} /></Field>
                <Field label="Tarif journalier (€)" hint="Laissez vide pour « à discuter »">
                  <input type="number" min={0} value={form.daily_rate} onChange={(e) => set("daily_rate", e.target.value)} className={inputCls} />
                </Field>
              </div>
            </Section>

            {/* 5. Conditions & visibilité */}
            <Section step="5" title="Conditions et visibilité">
              <Field label="Conditions éventuelles" hint="Facturation, matériel, préavis, exclusivité...">
                <textarea rows={3} value={form.conditions} onChange={(e) => set("conditions", e.target.value)} className={inputCls} />
              </Field>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                {Object.entries(VISIBILITY).map(([k, v]) => {
                  const Icon = VIS_ICONS[k];
                  const on = form.visibility === k;
                  return (
                    <button type="button" key={k} onClick={() => set("visibility", k)}
                      className={`rounded-xl border p-3 text-left transition ${on ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20 dark:bg-emerald-500/10" : "border-slate-200 hover:border-emerald-300 dark:border-slate-700"}`}>
                      <Icon size={16} className={on ? "text-emerald-600" : "text-slate-400"} />
                      <p className="mt-2 text-xs font-bold text-slate-900 dark:text-white">{v.label}</p>
                      <p className="mt-0.5 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{v.hint}</p>
                    </button>
                  );
                })}
              </div>
            </Section>
          </div>

          {/* Récapitulatif */}
          <aside className="lg:sticky lg:top-5 lg:self-start">
            <div className={`${cardCls} overflow-hidden`}>
              <div className="bg-gradient-to-br from-[#0B3B3A] to-[#0B253B] px-5 py-4 text-white">
                <p className="text-[11px] text-emerald-100/70">Aperçu de l'offre</p>
                <p className="mt-1 line-clamp-2 text-sm font-bold">{form.title || "Titre de l'offre"}</p>
              </div>
              <div className="space-y-3 p-5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-3">
                  <Avatar name={selected?.name} path={selected?.avatar_path} size={36} />
                  <p className="font-semibold">{selected?.name || "Aucun salarié choisi"}</p>
                </div>
                <dl className="space-y-1.5">
                  <div className="flex justify-between"><dt className="text-slate-400">Type</dt><dd>{MISSION_TYPES[form.mission_type]}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-400">Période</dt><dd>{form.start_at ? `${fmtDate(form.start_at)} → ${fmtDate(form.end_at)}` : "—"}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-400">Charge</dt><dd>{workloadLabel(form.workload_value, form.workload_unit)}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-400">Lieu</dt><dd>{LOCATION_LABELS[form.location_type]}{form.location_city ? ` · ${form.location_city}` : ""}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-400">Tarif</dt><dd>{form.daily_rate ? `${form.daily_rate} € / j` : "À discuter"}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-400">Visibilité</dt><dd>{VISIBILITY[form.visibility].label}</dd></div>
                </dl>
              </div>
              <div className="flex flex-col gap-2 border-t border-slate-100 p-4 dark:border-slate-800">
                <button onClick={() => submit("published")} disabled={!!saving || !canSubmit} className={btnPrimary}>
                  {saving === "published" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {isEdit && offerStatus === "published" ? "Enregistrer et garder publiée" : "Publier l'offre"}
                </button>
                <button onClick={() => submit("draft")} disabled={!!saving || !canSubmit} className={btnGhost}>
                  {saving === "draft" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Enregistrer en brouillon
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={close} />}
    </AppShell>
  );
}