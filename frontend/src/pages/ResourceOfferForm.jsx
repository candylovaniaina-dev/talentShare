import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Check, Loader2, Save, Send, Globe, Building2, Lock, AlertTriangle,
  Sparkles, CalendarDays, Wand2,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import api from "../services/api";
import {
  MISSION_TYPES, LOCATION_LABELS, VISIBILITY, LEVEL_LABELS, Avatar, Spinner,
  durationLabel, fmtDate, toInputDate, apiError, workloadLabel,
} from "../components/resource-sharing/shared";

/* ───────────────────────── Styles ───────────────────────── */
const FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
.ts-font{font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif}
@keyframes ts-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.ts-rise{animation:ts-rise .4s ease both}
`;

const EMPTY = {
  company_id: "", professional_profile_id: "", title: "", description: "",
  mission_type: "mission", start_at: "", end_at: "",
  workload_value: 100, workload_unit: "percentage",
  location_type: "onsite", location_city: "", daily_rate: "",
  conditions: "", visibility: "public", skill_ids: [],
};

const VIS_ICONS = { public: Globe, companies: Building2, private: Lock };

const STEPS = [
  { n: 1, t: "Salarié", d: "Qui partager" },
  { n: 2, t: "Mission", d: "Titre et description" },
  { n: 3, t: "Période", d: "Dates et charge" },
  { n: 4, t: "Lieu et tarif", d: "Optionnel" },
  { n: 5, t: "Visibilité", d: "Qui peut voir" },
];

const UNITS = [
  { key: "percentage", label: "% du temps", max: 100, presets: [100, 80, 50, 20] },
  { key: "hours_per_week", label: "h / semaine", max: 80, presets: [40, 35, 20, 10] },
  { key: "days_per_week", label: "j / semaine", max: 7, presets: [5, 4, 3, 2, 1] },
];

const RATE_PRESETS = [150, 250, 350, 500];

const inp = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#16B8B1] focus:ring-4 focus:ring-[#16B8B1]/15 dark:border-white/10 dark:bg-[#0B2235] dark:text-white";
const surface = "rounded-2xl border border-slate-200/70 bg-white dark:border-white/10 dark:bg-[#0F2A40]";
const choice = (on) =>
  `rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${on
    ? "border-[#16B8B1] bg-[#16B8B1]/10 text-[#0E8F8A] ring-2 ring-[#16B8B1]/20 dark:text-[#5EE0DA]"
    : "border-slate-200 text-slate-600 hover:border-[#16B8B1]/60 dark:border-white/10 dark:text-slate-300"}`;
const quick = "rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-[#16B8B1]/15 hover:text-[#0E8F8A] dark:bg-white/10 dark:text-slate-300 dark:hover:text-[#5EE0DA]";

/* ───────────────────────── Sous-composants ───────────────────────── */
function F({ label, required, hint, right, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
          {label} {required && <span className="text-[#16B8B1]">*</span>}
        </span>
        {right}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

function Block({ step, title, desc, done, optional, children }) {
  return (
    <section id={`sec-${step}`} data-step={step} className={`${surface} ts-rise scroll-mt-6 p-5 sm:p-6`}>
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold transition ${done
            ? "bg-[#16B8B1] text-[#0B2235]"
            : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300"}`}>
            {done ? <Check size={14} /> : step}
          </span>
          <div>
            <h2 className="text-sm font-extrabold text-[#0B2235] dark:text-white">{title}</h2>
            {desc && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{desc}</p>}
          </div>
        </div>
        {optional && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:bg-white/10">Optionnel</span>
        )}
      </header>
      {children}
    </section>
  );
}

function Ring({ pct, size = 56 }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="6" className="stroke-slate-200 dark:stroke-white/10" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="6" stroke="#16B8B1" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} className="transition-all duration-500" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-[#0B2235] dark:text-white">{pct}%</span>
    </div>
  );
}

/* ───────────────────────── Page ───────────────────────── */
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
  const [activeStep, setActiveStep] = useState(1);

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

  // Suivi de la section visible
  useEffect(() => {
    const els = [1, 2, 3, 4, 5].map((n) => document.getElementById(`sec-${n}`)).filter(Boolean);
    if (!els.length) return undefined;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) setActiveStep(Number(en.target.dataset.step)); });
    }, { rootMargin: "-20% 0px -65% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [loading, companies.length]);

  const selected = useMemo(
    () => employees.find((e) => e.professional_profile_id === Number(form.professional_profile_id)),
    [employees, form.professional_profile_id]
  );
  const skillOptions = selected?.skills?.length
    ? selected.skills
    : fallbackSkills.map((s) => ({ id: s.id, name: s.name, level: s.pivot?.level }));

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

  const unitCfg = UNITS.find((u) => u.key === form.workload_unit) || UNITS[0];
  const maxLoad = unitCfg.max;
  const periodInvalid = form.start_at && form.end_at && form.end_at < form.start_at;
  const loadInvalid = Number(form.workload_value) < 1 || Number(form.workload_value) > maxLoad;

  const canSubmit =
    form.company_id && form.professional_profile_id && form.title.trim() &&
    form.description.trim().length >= 20 && form.start_at && form.end_at && !periodInvalid && !loadInvalid;

  // Progression
  const checks = [
    { k: "emp", label: "Salarié choisi", ok: !!form.professional_profile_id },
    { k: "title", label: "Titre renseigné", ok: !!form.title.trim() },
    { k: "desc", label: "Description (20 caractères min.)", ok: form.description.trim().length >= 20 },
    { k: "dates", label: "Période valide", ok: !!form.start_at && !!form.end_at && !periodInvalid },
    { k: "load", label: "Charge valide", ok: !loadInvalid },
  ];
  const pct = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  const stepDone = {
    1: checks[0].ok,
    2: checks[1].ok && checks[2].ok,
    3: checks[3].ok && checks[4].ok,
    4: !!(form.location_city.trim() || form.daily_rate !== ""),
    5: true,
  };

  const goStep = (n) => document.getElementById(`sec-${n}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  // Automatismes
  const addDuration = (months) => {
    const start = form.start_at || new Date().toISOString().slice(0, 10);
    const d = new Date(start);
    d.setUTCMonth(d.getUTCMonth() + months);
    setForm((f) => ({ ...f, start_at: start, end_at: d.toISOString().slice(0, 10) }));
  };

  const changeUnit = (key) => {
    const u = UNITS.find((x) => x.key === key);
    setForm((f) => ({ ...f, workload_unit: key, workload_value: u.presets[0] }));
  };

  const generateDescription = () => {
    if (!selected) { show("Choisissez d'abord un salarié.", "error"); return; }
    const names = skillOptions.filter((s) => form.skill_ids.includes(s.id)).map((s) => s.name);
    const type = (MISSION_TYPES[form.mission_type] || "mission").toLowerCase();
    const period = form.start_at && form.end_at ? ` du ${fmtDate(form.start_at)} au ${fmtDate(form.end_at)}` : "";
    const lines = [
      `${selected.name}${selected.headline ? `, ${selected.headline},` : ""} est disponible pour une collaboration de type « ${type} »${period}.`,
      names.length ? `Compétences mises en avant : ${names.join(", ")}.` : null,
      `Charge proposée : ${workloadLabel(form.workload_value, form.workload_unit)}. Le contexte et les livrables peuvent être définis ensemble selon votre besoin.`,
    ].filter(Boolean);
    set("description", lines.join("\n\n"));
  };

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
        <style>{FONT_CSS}</style>
        <div className="ts-font mx-auto max-w-md px-4 py-20 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#16B8B1]/15 text-[#16B8B1]"><Building2 size={24} /></div>
          <h2 className="mt-5 text-lg font-extrabold text-[#0B2235] dark:text-white">Créez d'abord votre entreprise</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Vous devez avoir une entreprise pour pouvoir partager un salarié.</p>
        </div>
      </AppShell>
    );
  }

  const skillChosen = skillOptions.filter((s) => form.skill_ids.includes(s.id));

  return (
    <AppShell>
      <style>{FONT_CSS}</style>
      <div className="ts-font mx-auto max-w-[1280px] space-y-5 px-3 pb-12 pt-5 sm:px-5 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link to="/resource-offers" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-[#16B8B1]">
              <ArrowLeft size={14} /> Mes offres
            </Link>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0B2235] dark:text-white">
              {isEdit ? "Modifier l'offre" : "Prêter un salarié"}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Décrivez sa disponibilité : les autres entreprises pourront la découvrir et vous envoyer une proposition.
            </p>
          </div>
          {isEdit && (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#3478E8]/10 px-3 py-1.5 text-xs font-bold text-[#2A62C4] dark:text-[#8DB4F5]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3478E8]" /> {offerStatus === "published" ? "Offre publiée" : "Brouillon"}
            </span>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[190px_minmax(0,1fr)_320px]">

          {/* Rail d'étapes */}
          <nav className="hidden xl:block">
            <div className="sticky top-5 space-y-5">
              <div className="flex items-center gap-3">
                <Ring pct={pct} />
                <div>
                  <p className="text-xs font-extrabold text-[#0B2235] dark:text-white">Progression</p>
                  <p className="text-[11px] text-slate-400">{pct === 100 ? "Prêt à publier" : "Champs requis"}</p>
                </div>
              </div>
              <ol className="relative space-y-1 border-l border-slate-200 pl-4 dark:border-white/10">
                {STEPS.map((s) => {
                  const on = activeStep === s.n;
                  return (
                    <li key={s.n}>
                      <button type="button" onClick={() => goStep(s.n)}
                        className={`relative w-full rounded-lg px-3 py-2 text-left transition ${on ? "bg-[#16B8B1]/10" : "hover:bg-slate-100 dark:hover:bg-white/5"}`}>
                        <span className={`absolute -left-[22px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-white dark:border-[#0B2235] ${stepDone[s.n] ? "bg-[#16B8B1]" : on ? "bg-[#3478E8]" : "bg-slate-300 dark:bg-slate-600"}`} />
                        <p className={`text-xs font-bold ${on ? "text-[#0E8F8A] dark:text-[#5EE0DA]" : "text-slate-700 dark:text-slate-200"}`}>{s.t}</p>
                        <p className="text-[11px] text-slate-400">{s.d}</p>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          </nav>

          {/* Formulaire */}
          <div className="space-y-5">
            {/* 1. Salarié */}
            <Block step={1} title="Salarié à partager" desc="Seuls les salariés actifs disposant d'un profil professionnel peuvent être partagés." done={stepDone[1]}>
              {companies.length > 1 && !isEdit && (
                <div className="mb-4 max-w-sm">
                  <F label="Entreprise" required>
                    <select value={form.company_id}
                      onChange={(e) => { set("company_id", e.target.value); set("professional_profile_id", ""); set("skill_ids", []); }}
                      className={inp}>
                      {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </F>
                </div>
              )}

              {loadingEmp ? (
                <div className="flex items-center gap-2 py-6 text-xs text-slate-500"><Loader2 size={15} className="animate-spin" /> Chargement des salariés...</div>
              ) : employees.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500 dark:bg-[#0B2235]">
                  Aucun salarié actif. Ajoutez des salariés depuis « Mon entreprise » avant de créer une offre.
                </p>
              ) : (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {employees.map((e) => {
                    const active = Number(form.professional_profile_id) === e.professional_profile_id;
                    const locked = isEdit && !active;
                    const off = !e.shareable || locked;
                    return (
                      <button type="button" key={e.id} onClick={() => pickEmployee(e)} disabled={off}
                        className={`relative flex items-center gap-3 rounded-xl border p-3 text-left transition ${active
                          ? "border-[#16B8B1] bg-[#16B8B1]/10 ring-2 ring-[#16B8B1]/20"
                          : "border-slate-200 hover:border-[#16B8B1]/60 dark:border-white/10"} ${off ? "cursor-not-allowed opacity-45" : ""}`}>
                        <Avatar name={e.name} path={e.avatar_path} size={42} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{e.name}</p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {e.shareable ? (e.headline || e.position || "—") : "Pas de profil professionnel"}
                          </p>
                          {e.shareable && e.skills?.length > 0 && (
                            <p className="mt-0.5 text-[10px] font-semibold text-slate-400">{e.skills.length} compétence{e.skills.length > 1 ? "s" : ""}</p>
                          )}
                        </div>
                        {active && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#16B8B1] text-[#0B2235]"><Check size={12} /></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {skillOptions.length > 0 && form.professional_profile_id && (
                <div className="mt-5 border-t border-slate-100 pt-4 dark:border-white/10">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Compétences mises en avant</p>
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => set("skill_ids", skillOptions.map((s) => s.id))} className={quick}>Tout</button>
                      <button type="button" onClick={() => set("skill_ids", [])} className={quick}>Aucune</button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skillOptions.map((s) => {
                      const on = form.skill_ids.includes(s.id);
                      return (
                        <button type="button" key={s.id} onClick={() => toggleSkill(s.id)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${on
                            ? "border-[#16B8B1] bg-[#16B8B1] text-[#0B2235]"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:border-[#16B8B1]/60 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"}`}>
                          {s.name}{s.level && <span className="ml-1 font-normal opacity-70">· {LEVEL_LABELS[s.level] || s.level}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </Block>

            {/* 2. Mission */}
            <Block step={2} title="Type et description de la mission" done={stepDone[2]}>
              <div className="space-y-5">
                <F label="Titre de l'offre" required right={<span className="text-[11px] text-slate-400">{form.title.length}/150</span>}>
                  <input value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={150}
                    placeholder="Ex. Développeur Laravel disponible 3 mois" className={inp} />
                </F>

                <div>
                  <p className="mb-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">Type de mission <span className="text-[#16B8B1]">*</span></p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(MISSION_TYPES).map(([k, label]) => (
                      <button type="button" key={k} onClick={() => set("mission_type", k)} className={choice(form.mission_type === k)}>{label}</button>
                    ))}
                  </div>
                </div>

                <F label="Description" required
                  right={
                    <button type="button" onClick={generateDescription}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#3478E8]/10 px-2.5 py-1 text-[11px] font-bold text-[#2A62C4] transition hover:bg-[#3478E8]/20 dark:text-[#8DB4F5]">
                      <Wand2 size={12} /> Générer un brouillon
                    </button>
                  }>
                  <textarea rows={6} value={form.description} onChange={(e) => set("description", e.target.value)}
                    placeholder="Quel type de travail ce salarié peut-il prendre en charge ? Contexte, livrables, points forts..." className={inp} />
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#16B8B1] to-[#3478E8] transition-all"
                      style={{ width: `${Math.min(100, (form.description.trim().length / 20) * 100)}%` }} />
                  </div>
                  <span className="mt-1.5 block text-[11px] text-slate-400">{form.description.trim().length}/20 caractères minimum</span>
                </F>
              </div>
            </Block>

            {/* 3. Période & charge */}
            <Block step={3} title="Période et charge de travail" desc="Définissez quand le salarié est disponible et à quel rythme." done={stepDone[3]}>
              <div className="grid gap-4 sm:grid-cols-2">
                <F label="Disponible à partir du" required>
                  <input type="date" value={form.start_at}
                    min={isEdit ? undefined : new Date().toISOString().slice(0, 10)}
                    onChange={(e) => set("start_at", e.target.value)} className={inp} />
                </F>
                <F label="Jusqu'au" required>
                  <input type="date" value={form.end_at} min={form.start_at} onChange={(e) => set("end_at", e.target.value)} className={inp} />
                </F>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400"><CalendarDays size={12} /> Durée rapide</span>
                {[[1, "1 mois"], [3, "3 mois"], [6, "6 mois"], [12, "1 an"]].map(([m, l]) => (
                  <button type="button" key={m} onClick={() => addDuration(m)} className={quick}>{l}</button>
                ))}
              </div>

              {periodInvalid && (
                <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-rose-600"><AlertTriangle size={13} /> La date de fin précède la date de début.</p>
              )}
              {form.start_at && form.end_at && !periodInvalid && (
                <p className="mt-3 inline-flex rounded-lg bg-[#16B8B1]/10 px-3 py-1.5 text-xs font-bold text-[#0E8F8A] dark:text-[#5EE0DA]">
                  Durée : {durationLabel(form.start_at, form.end_at)}
                </p>
              )}

              <div className="mt-6 border-t border-slate-100 pt-5 dark:border-white/10">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Charge de travail <span className="text-[#16B8B1]">*</span></p>
                  <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-white/5">
                    {UNITS.map((u) => (
                      <button type="button" key={u.key} onClick={() => changeUnit(u.key)}
                        className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${form.workload_unit === u.key
                          ? "bg-white text-[#0B2235] shadow-sm dark:bg-[#163650] dark:text-white"
                          : "text-slate-500 dark:text-slate-400"}`}>
                        {u.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <input type="range" min={1} max={maxLoad} value={Math.min(Number(form.workload_value) || 1, maxLoad)}
                    onChange={(e) => set("workload_value", e.target.value)} className="h-1.5 flex-1 cursor-pointer accent-[#16B8B1]" />
                  <input type="number" min={1} max={maxLoad} value={form.workload_value}
                    onChange={(e) => set("workload_value", e.target.value)} className={`${inp} !w-24 text-center font-bold`} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {unitCfg.presets.map((p) => (
                    <button type="button" key={p} onClick={() => set("workload_value", p)}
                      className={`${quick} ${Number(form.workload_value) === p ? "!bg-[#16B8B1] !text-[#0B2235]" : ""}`}>{p}</button>
                  ))}
                  <span className="ml-1 self-center text-[11px] text-slate-400">Maximum {maxLoad}</span>
                </div>
                {loadInvalid && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-rose-600"><AlertTriangle size={13} /> La charge doit être comprise entre 1 et {maxLoad}.</p>
                )}
              </div>
            </Block>

            {/* 4. Lieu & tarif */}
            <Block step={4} title="Localisation et tarif" done={stepDone[4]} optional>
              <div className="flex flex-wrap gap-2">
                {Object.entries(LOCATION_LABELS).map(([k, label]) => (
                  <button type="button" key={k} onClick={() => set("location_type", k)} className={choice(form.location_type === k)}>{label}</button>
                ))}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <F label="Ville">
                  <input value={form.location_city} onChange={(e) => set("location_city", e.target.value)} placeholder="Antananarivo" className={inp} />
                </F>
                <F label="Tarif journalier" hint="Laissez vide pour « à discuter »">
                  <div className="relative">
                    <input type="number" min={0} value={form.daily_rate} onChange={(e) => set("daily_rate", e.target.value)} className={`${inp} pr-10`} />
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">€</span>
                  </div>
                </F>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {RATE_PRESETS.map((r) => (
                  <button type="button" key={r} onClick={() => set("daily_rate", r)}
                    className={`${quick} ${Number(form.daily_rate) === r ? "!bg-[#16B8B1] !text-[#0B2235]" : ""}`}>{r} €</button>
                ))}
                <button type="button" onClick={() => set("daily_rate", "")} className={quick}>À discuter</button>
              </div>
            </Block>

            {/* 5. Conditions & visibilité */}
            <Block step={5} title="Conditions et visibilité" done={stepDone[5]}>
              <F label="Conditions éventuelles" hint="Facturation, matériel, préavis, exclusivité...">
                <textarea rows={3} value={form.conditions} onChange={(e) => set("conditions", e.target.value)} className={inp} />
              </F>
              <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
                {Object.entries(VISIBILITY).map(([k, v]) => {
                  const Icon = VIS_ICONS[k];
                  const on = form.visibility === k;
                  return (
                    <button type="button" key={k} onClick={() => set("visibility", k)}
                      className={`rounded-xl border p-3.5 text-left transition ${on
                        ? "border-[#16B8B1] bg-[#16B8B1]/10 ring-2 ring-[#16B8B1]/20"
                        : "border-slate-200 hover:border-[#16B8B1]/60 dark:border-white/10"}`}>
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${on ? "bg-[#16B8B1] text-[#0B2235]" : "bg-slate-100 text-slate-400 dark:bg-white/10"}`}>
                        <Icon size={15} />
                      </span>
                      <p className="mt-2.5 text-xs font-bold text-slate-900 dark:text-white">{v.label}</p>
                      <p className="mt-0.5 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{v.hint}</p>
                    </button>
                  );
                })}
              </div>
            </Block>
          </div>

          {/* Aperçu en direct */}
          <aside className="lg:sticky lg:top-5 lg:self-start">
            <div className={`${surface} overflow-hidden shadow-lg shadow-[#0B2235]/5`}>
              <div className="bg-gradient-to-br from-[#0B2235] to-[#163650] px-5 py-4 text-white">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#5EE0DA]">
                  <Sparkles size={11} /> Aperçu en direct
                </p>
                <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-5">{form.title || "Titre de l'offre"}</p>
              </div>

              <div className="space-y-4 p-5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-3">
                  <Avatar name={selected?.name} path={selected?.avatar_path} size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{selected?.name || "Aucun salarié choisi"}</p>
                    {selected?.headline && <p className="truncate text-[11px] text-slate-400">{selected.headline}</p>}
                  </div>
                </div>

                {skillChosen.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {skillChosen.slice(0, 5).map((s) => (
                      <span key={s.id} className="rounded-md bg-[#16B8B1]/10 px-2 py-0.5 text-[11px] font-semibold text-[#0E8F8A] dark:text-[#5EE0DA]">{s.name}</span>
                    ))}
                    {skillChosen.length > 5 && <span className="px-1 text-[11px] font-semibold text-slate-400">+{skillChosen.length - 5}</span>}
                  </div>
                )}

                <dl className="space-y-2 rounded-xl bg-slate-50 p-3.5 dark:bg-[#0B2235]">
                  {[
                    ["Type", MISSION_TYPES[form.mission_type]],
                    ["Période", form.start_at ? `${fmtDate(form.start_at)} → ${form.end_at ? fmtDate(form.end_at) : "…"}` : "—"],
                    ["Charge", workloadLabel(form.workload_value, form.workload_unit)],
                    ["Lieu", `${LOCATION_LABELS[form.location_type]}${form.location_city ? ` · ${form.location_city}` : ""}`],
                    ["Tarif", form.daily_rate ? `${form.daily_rate} € / j` : "À discuter"],
                    ["Visibilité", VISIBILITY[form.visibility].label],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="text-slate-400">{k}</dt>
                      <dd className="text-right font-semibold text-slate-800 dark:text-slate-100">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Prêt à publier</p>
                  <ul className="space-y-1.5">
                    {checks.map((c) => (
                      <li key={c.k} className={`flex items-center gap-2 text-[11px] font-medium ${c.ok ? "text-slate-700 dark:text-slate-200" : "text-slate-400"}`}>
                        <span className={`flex h-4 w-4 items-center justify-center rounded-full ${c.ok ? "bg-[#16B8B1] text-[#0B2235]" : "border border-slate-300 dark:border-white/20"}`}>
                          {c.ok && <Check size={10} />}
                        </span>
                        {c.label}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-100 p-4 dark:border-white/10">
                <button onClick={() => submit("published")} disabled={!!saving || !canSubmit}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#16B8B1] px-4 py-2.5 text-xs font-bold text-[#0B2235] transition hover:bg-[#2BD0C9] disabled:cursor-not-allowed disabled:opacity-50">
                  {saving === "published" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {isEdit && offerStatus === "published" ? "Enregistrer et garder publiée" : "Publier l'offre"}
                </button>
                <button onClick={() => submit("draft")} disabled={!!saving || !canSubmit}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-[#16B8B1] hover:text-[#0E8F8A] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-300">
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