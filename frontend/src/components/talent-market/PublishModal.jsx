
import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  UserPlus,
  CalendarDays,
  Clock3,
  Target,
  Zap,
  MapPin,
  Wrench,
  FileText,
  Euro,
  ScrollText,
  Eye,
  Check,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  BriefcaseBusiness,
  Laptop,
  Building2,
  Coins,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  Info,
} from "lucide-react";

import api from "../../services/api";
import {
  Avatar,
  StateBadge,
  ModalFrame,
  Meter,
  SuccessScreen,
  fmtDate,
  money,
  workingDays,
  workloadFactor,
  btnPrimary,
  btnGhost,
  inputCls,
} from "./ui";

import SkillPicker from "./SkillPicker";

/* ==========================================================================
   DATES
========================================================================== */

const pad = (n) => String(n).padStart(2, "0");

const parse = (s) => {
  if (!s) return new Date();
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const iso = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const addMonths = (s, n) => {
  const d = parse(s);
  const day = d.getDate();

  d.setMonth(d.getMonth() + n);

  if (d.getDate() !== day) d.setDate(0);

  d.setDate(d.getDate() - 1);

  return iso(d);
};

const startFor = (mode) => {
  const t = new Date();

  if (mode === "week") {
    t.setDate(t.getDate() + 7);
  }

  if (mode === "month") {
    return iso(new Date(t.getFullYear(), t.getMonth() + 1, 1));
  }

  return iso(t);
};

/* ==========================================================================
   OPTIONS
========================================================================== */

const STEPS = [
  {
    label: "Disponibilité",
    description: "Période et conditions",
    icon: CalendarDays,
  },
  {
    label: "Compétences",
    description: "Profil et savoir-faire",
    icon: Wrench,
  },
  {
    label: "Publication",
    description: "Annonce et tarif",
    icon: FileText,
  },
];

const START_OPTS = [
  ["now", "Maintenant"],
  ["week", "Dans 1 semaine"],
  ["month", "Mois prochain"],
  ["custom", "Date précise"],
];

const DURATIONS = [
  ["1m", "1 mois", 1],
  ["3m", "3 mois", 3],
  ["6m", "6 mois", 6],
  ["12m", "1 an", 12],
  ["custom", "Personnalisée", null],
];

const MISSION_OPTS = [
  {
    v: "loan",
    label: "Mise à disposition",
    hint: "Prêt d'un salarié",
    icon: Building2,
  },
  {
    v: "mission",
    label: "Mission",
    hint: "Projet ponctuel",
    icon: Target,
  },
  {
    v: "freelance",
    label: "Freelance",
    hint: "Prestation",
    icon: Laptop,
  },
  {
    v: "part_time",
    label: "Temps partiel",
    hint: "Charge réduite",
    icon: Clock3,
  },
  {
    v: "full_time",
    label: "Temps plein",
    hint: "Disponibilité complète",
    icon: BriefcaseBusiness,
  },
];

const LOC_OPTS = [
  { v: "onsite", label: "Sur site", icon: Building2 },
  { v: "hybrid", label: "Hybride", icon: Laptop },
  { v: "remote", label: "Télétravail", icon: Laptop },
];

const WORKLOADS = [
  {
    id: "full",
    label: "Temps plein",
    sub: "100 %",
    unit: "percentage",
    value: 100,
  },
  {
    id: "p80",
    label: "80 %",
    sub: "4 j / sem.",
    unit: "percentage",
    value: 80,
  },
  {
    id: "half",
    label: "Mi-temps",
    sub: "50 %",
    unit: "percentage",
    value: 50,
  },
  {
    id: "p20",
    label: "20 %",
    sub: "1 j / sem.",
    unit: "percentage",
    value: 20,
  },
  {
    id: "custom",
    label: "Autre",
    sub: "À définir",
  },
];

const COND_TAGS = [
  "NDA requis",
  "Préavis de 15 jours",
  "Durée minimale d'un mois",
  "Retour anticipé possible",
  "Déplacements à la charge du client",
  "Matériel fourni par le client",
];

const TEMPLATES = [
  {
    id: "express",
    label: "Express",
    sub: "1 mois · Temps plein",
    patch: {
      duration: "1m",
      mission_type: "mission",
      workload_preset: "full",
      workload_unit: "percentage",
      workload_value: 100,
    },
  },
  {
    id: "saison",
    label: "Saison",
    sub: "3 mois · Mi-temps",
    patch: {
      duration: "3m",
      mission_type: "part_time",
      workload_preset: "half",
      workload_unit: "percentage",
      workload_value: 50,
    },
  },
  {
    id: "long",
    label: "Long terme",
    sub: "6 mois · Mise à disposition",
    patch: {
      duration: "6m",
      mission_type: "loan",
      workload_preset: "full",
      workload_unit: "percentage",
      workload_value: 100,
    },
  },
];

const makeDefaults = () => ({
  start_mode: "now",
  start_at: startFor("now"),
  duration: "6m",
  end_at: "",
  mission_type: "loan",
  workload_preset: "full",
  workload_unit: "percentage",
  workload_value: 100,
  location_type: "hybrid",
  location_city: "",
  rate_open: false,
  daily_rate: "",
  currency: "EUR",
  cond_tags: [],
  cond_extra: "",
  visibility: "public",
});

const EXCHANGE_RATE_EUR_TO_MGA = 4800;

/* ==========================================================================
   DESIGN SYSTEM
========================================================================== */

const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:bg-[#101B35] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-teal-400";

const labelClass =
  "mb-2 block text-xs font-bold uppercase tracking-[0.07em] text-slate-500 dark:text-slate-400";

const surfaceClass =
  "rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-[#111D38]";

function SectionHeading({ icon: Icon, title, description, right }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
            <Icon size={17} />
          </div>
        )}

        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {title}
          </h3>

          {description && (
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
      </div>

      {right}
    </div>
  );
}

function Section({ icon, title, description, children, className = "" }) {
  return (
    <section className={`${surfaceClass} p-5 sm:p-6 ${className}`}>
      <SectionHeading
        icon={icon}
        title={title}
        description={description}
      />

      {children}
    </section>
  );
}

function Choice({
  active,
  onClick,
  label,
  sub,
  icon: Icon,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex min-w-0 flex-col rounded-xl border p-3.5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/15 ${
        active
          ? "border-teal-500 bg-teal-50/70 shadow-[0_0_0_2px_rgba(20,184,166,0.08)] dark:border-teal-400/60 dark:bg-teal-500/10"
          : "border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50 dark:border-white/10 dark:bg-[#101B35] dark:hover:border-teal-500/40 dark:hover:bg-white/[0.03]"
      } ${className}`}
    >
      {Icon && (
        <div
          className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg transition ${
            active
              ? "bg-teal-600 text-white"
              : "bg-slate-100 text-slate-500 group-hover:bg-teal-50 group-hover:text-teal-700 dark:bg-white/5 dark:text-slate-400"
          }`}
        >
          <Icon size={16} />
        </div>
      )}

      <span
        className={`block text-[13px] font-bold ${
          active
            ? "text-teal-900 dark:text-teal-100"
            : "text-slate-700 dark:text-slate-200"
        }`}
      >
        {label}
      </span>

      {sub && (
        <span className="mt-1 block text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          {sub}
        </span>
      )}

      {active && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-white shadow-sm">
          <Check size={12} strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

function AutoBadge({ auto }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
        auto
          ? "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300"
          : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"
      }`}
    >
      
      {auto ? "Généré automatiquement" : "Personnalisé"}
    </span>
  );
}

function RateGauge({ rate, value }) {
  if (!rate) return null;

  const { min, max, median } = rate;
  const span = Math.max(1, max - min);

  const pos = (v) =>
    Math.max(0, Math.min(100, ((v - min) / span) * 100));

  const v = value === "" || value == null ? null : Number(value);

  return (
    <div>
      <div className="relative h-2 overflow-visible rounded-full bg-gradient-to-r from-teal-100 via-teal-300 to-teal-100 dark:from-teal-900/50 dark:via-teal-500/40 dark:to-teal-900/50">
        <span
          className="absolute top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-teal-700 dark:bg-teal-300"
          style={{ left: `${pos(median)}%` }}
        />

        {v !== null && (
          <span
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-slate-900 shadow-md dark:border-[#111D38] dark:bg-white"
            style={{ left: `${pos(v)}%` }}
          />
        )}
      </div>

      <div className="mt-3 flex justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400">
        <span>{min} €</span>
        <span className="font-bold text-teal-700 dark:text-teal-300">
          Médiane : {median} €
        </span>
        <span>{max} €</span>
      </div>
    </div>
  );
}

function ProgressSteps({ step, onGoTo }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {STEPS.map((item, index) => {
        const Icon = item.icon;
        const active = index === step;
        const done = index < step;

        return (
          <button
            key={item.label}
            type="button"
            onClick={() => onGoTo(index)}
            className="group min-w-0 text-left"
          >
            <div
              className={`mb-3 h-1 rounded-full transition-all duration-300 ${
                done || active
                  ? "bg-teal-500"
                  : "bg-slate-200 dark:bg-white/10"
              }`}
            />

            <div className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${
                  active
                    ? "bg-slate-900 text-white shadow-sm dark:bg-teal-400 dark:text-slate-950"
                    : done
                      ? "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300"
                      : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500"
                }`}
              >
                {done ? <Check size={15} strokeWidth={3} /> : <Icon size={15} />}
              </span>

              <span className="min-w-0">
                <span
                  className={`block truncate text-xs font-bold ${
                    active
                      ? "text-slate-900 dark:text-white"
                      : done
                        ? "text-teal-700 dark:text-teal-300"
                        : "text-slate-400"
                  }`}
                >
                  {item.label}
                </span>

                <span className="hidden truncate text-[10px] text-slate-400 sm:block">
                  {item.description}
                </span>
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function TalentSelector({ employees, activeId, onChange }) {
  if (employees.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {employees.map((employee) => {
        const active = employee.employee_id === activeId;

        return (
          <button
            key={employee.employee_id}
            type="button"
            onClick={() => onChange(employee.employee_id)}
            className={`inline-flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 text-xs font-semibold transition ${
              active
                ? "border-teal-400 bg-teal-50 text-teal-800 dark:border-teal-400/50 dark:bg-teal-500/10 dark:text-teal-200"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-[#101B35] dark:text-slate-300"
            }`}
          >
            <Avatar
              name={employee.name}
              src={employee.photo_url}
              size={26}
            />
            <span className="max-w-[130px] truncate">{employee.name}</span>

            {active && <Check size={13} />}
          </button>
        );
      })}
    </div>
  );
}

/* ==========================================================================
   PUBLISH MODAL
========================================================================== */

export default function PublishModal({
  company,
  employees,
  onClose,
  onDone,
  startStep = 0,
}) {
  const storeKey = `talentshare_publish_defaults_${company.id}`;

  const [step, setStep] = useState(startStep);

  const [s, setS] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storeKey) || "null");

      if (saved) {
        return {
          ...makeDefaults(),
          ...saved,
          start_mode: "now",
          start_at: startFor("now"),
          end_at: "",
          duration: saved.duration === "custom" ? "6m" : saved.duration,
        };
      }
    } catch {
      // Valeurs par défaut
    }

    return makeDefaults();
  });

  const restored = (() => {
    try {
      return !!localStorage.getItem(storeKey);
    } catch {
      return false;
    }
  })();

  const [sg, setSg] = useState(null);
  const [cityTouched, setCityTouched] = useState(false);

  const [activeId, setActiveId] = useState(
    employees[0]?.employee_id
  );

  const [texts, setTexts] = useState(() =>
    Object.fromEntries(
      employees.map((e) => [
        e.employee_id,
        {
          title: "",
          description: "",
          tEdited: false,
          dEdited: false,
        },
      ])
    )
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const toSkill = (k) => ({
    name: typeof k === "string" ? k : k.name,
    level: k.level || "intermediate",
  });

  const [skillsBy, setSkillsBy] = useState(() =>
    Object.fromEntries(
      employees.map((e) => [
        e.employee_id,
        (e.skills || []).map(toSkill),
      ])
    )
  );

  useEffect(() => {
    if (!sg?.talents) return;

    setSkillsBy((previous) => {
      const next = { ...previous };

      sg.talents.forEach((talent) => {
        if (!(next[talent.employee_id] || []).length) {
          next[talent.employee_id] = (talent.skills || []).map(toSkill);
        }
      });

      return next;
    });
  }, [sg]);

  const set = (patch) => {
    setS((current) => ({ ...current, ...patch }));
  };

  /* ------------------------------------------------------------------------
     Calculs automatiques
  ------------------------------------------------------------------------ */

  const months = DURATIONS.find((d) => d[0] === s.duration)?.[2];

  const endAt =
    s.duration === "custom"
      ? s.end_at
      : s.start_at && months
        ? addMonths(s.start_at, months)
        : "";

  const durLabel = (() => {
    if (!s.start_at || !endAt) return "";

    const days =
      Math.round((parse(endAt) - parse(s.start_at)) / 86400000) + 1;

    if (days <= 0) return "";

    if (days >= 60) {
      const m = Math.round(days / 30.4);

      return m >= 12 && m % 12 === 0
        ? `${m / 12} an${m > 12 ? "s" : ""}`
        : `${m} mois`;
    }

    return `${days} jour${days > 1 ? "s" : ""}`;
  })();

  const skillsOf = (employee) =>
    (skillsBy[employee.employee_id] || []).map((skill) => skill.name);

  const buildTitle = (employee) =>
    `${employee.position || "Collaborateur"} disponible${
      durLabel ? ` pour ${durLabel}` : ""
    }`.slice(0, 150);

  const buildDescription = (employee) => {
    const skills = skillsOf(employee);

    const locationLabel = {
      onsite: "sur site",
      hybrid: "en mode hybride",
      remote: "en télétravail",
    }[s.location_type];

    const workload =
      s.workload_unit === "percentage"
        ? `${s.workload_value} % de son temps`
        : s.workload_unit === "hours_per_week"
          ? `${s.workload_value} h par semaine`
          : `${s.workload_value} j par semaine`;

    return [
      `${employee.name} (${employee.position || "collaborateur"}) est disponible pour une mission au sein d'une autre entreprise, avec l'accord de ${company.name}.`,
      skills.length
        ? `Compétences clés : ${skills.slice(0, 8).join(", ")}.`
        : null,
      `Disponibilité : du ${fmtDate(s.start_at)} au ${fmtDate(endAt)}${
        durLabel ? ` (${durLabel})` : ""
      }, à raison de ${workload}.`,
      `Lieu : ${locationLabel}${
        s.location_type !== "remote" && s.location_city
          ? ` à ${s.location_city}`
          : ""
      }.`,
      "À la fin de la mission, le salarié retourne dans son entreprise d'origine.",
    ]
      .filter(Boolean)
      .join("\n\n");
  };

  /* ------------------------------------------------------------------------
     Suggestions API
  ------------------------------------------------------------------------ */

  useEffect(() => {
    api
      .get("/talent-market/suggest", {
        params: {
          company_id: company.id,
          employee_ids: employees.map((e) => e.employee_id),
        },
      })
      .then((response) => setSg(response.data))
      .catch(() => setSg(null));
  }, []); // eslint-disable-line

  useEffect(() => {
    if (
      sg?.company_city &&
      !cityTouched &&
      !s.location_city &&
      s.location_type !== "remote"
    ) {
      set({ location_city: sg.company_city });
    }
  }, [sg]); // eslint-disable-line

  useEffect(() => {
    setTexts((previous) => {
      const next = { ...previous };

      employees.forEach((employee) => {
        const current = previous[employee.employee_id] || {};

        next[employee.employee_id] = {
          ...current,
          title: current.tEdited
            ? current.title
            : buildTitle(employee),
          description: current.dEdited
            ? current.description
            : buildDescription(employee),
        };
      });

      return next;
    });
  }, [
    s.start_at,
    endAt,
    s.workload_unit,
    s.workload_value,
    s.location_type,
    s.location_city,
    sg,
    skillsBy,
  ]); // eslint-disable-line

  const active =
    employees.find((e) => e.employee_id === activeId) || employees[0];

  const activeText = texts[active.employee_id] || {};
  const activeSkills = skillsOf(active);

  const editText = (id, field, value) => {
    setTexts((previous) => ({
      ...previous,
      [id]: {
        ...previous[id],
        [field]: value,
        [field === "title" ? "tEdited" : "dEdited"]: true,
      },
    }));
  };

  const regenerate = (employee) => {
    setTexts((previous) => ({
      ...previous,
      [employee.employee_id]: {
        title: buildTitle(employee),
        description: buildDescription(employee),
        tEdited: false,
        dEdited: false,
      },
    }));
  };

  const conditions = [
    ...s.cond_tags,
    s.cond_extra.trim(),
  ]
    .filter(Boolean)
    .join("\n");

  const toggleTag = (tag) => {
    set({
      cond_tags: s.cond_tags.includes(tag)
        ? s.cond_tags.filter((item) => item !== tag)
        : [...s.cond_tags, tag],
    });
  };

  const rateNum =
    s.rate_open || s.daily_rate === ""
      ? null
      : Number(s.daily_rate);

  /* ------------------------------------------------------------------------
     Automatismes
  ------------------------------------------------------------------------ */

  const lateFree = employees
    .filter((e) => e.state !== "available" && e.available_from)
    .map((e) => String(e.available_from).slice(0, 10))
    .sort()
    .pop();

  const startConflict =
    lateFree && s.start_at && s.start_at < lateFree
      ? lateFree
      : null;

  const days = workingDays(s.start_at, endAt);

  const potential =
    rateNum != null
      ? rateNum *
        days *
        workloadFactor(s.workload_value, s.workload_unit)
      : null;

  const checks = [
    ["Titre clair", (activeText.title || "").trim().length >= 10],
    [
      "Description détaillée",
      (activeText.description || "").trim().length >= 80,
    ],
    ["Au moins 3 compétences", activeSkills.length >= 3],
    ["Tarif indiqué", rateNum != null],
    [
      "Lieu précisé",
      s.location_type === "remote" || !!s.location_city,
    ],
  ];

  const quality = Math.round(
    (checks.filter((check) => check[1]).length / checks.length) * 100
  );

  const applyTemplate = (template) => set(template.patch);

  const isTemplate = (template) =>
    Object.entries(template.patch).every(
      ([key, value]) => s[key] === value
    );

  const goNext = () => {
    setError(null);
    setStep((current) => Math.min(STEPS.length - 1, current + 1));
  };

  const goTo = (target) => {
    setError(null);
    setStep(target);
  };

  const isLast = step === STEPS.length - 1;

  /* ------------------------------------------------------------------------
     Publication
  ------------------------------------------------------------------------ */

  const submit = async (status) => {
    setError(null);

    if (!s.start_at || !endAt) {
      return setError("Choisissez la période de disponibilité.");
    }

    if (endAt < s.start_at) {
      return setError(
        "La date de fin doit être postérieure au début."
      );
    }

    const missing = employees.find(
      (employee) =>
        !(texts[employee.employee_id]?.title || "").trim()
    );

    if (missing) {
      setActiveId(missing.employee_id);
      setStep(2);
      return setError(`Ajoutez un titre pour ${missing.name}.`);
    }

    setBusy(true);

    try {
      const { data } = await api.post("/talent-market/publish", {
        company_id: company.id,
        employee_ids: employees.map((e) => e.employee_id),
        mission_type: s.mission_type,
        start_at: s.start_at,
        end_at: endAt,
        workload_unit: s.workload_unit,
        workload_value: Number(s.workload_value) || 100,
        location_type: s.location_type,
        location_city:
          s.location_type === "remote"
            ? null
            : s.location_city || null,
        daily_rate: rateNum,
        currency: s.currency,
        conditions: conditions || null,
        visibility: s.visibility,
        status,
        overrides: employees.map((employee) => ({
          employee_id: employee.employee_id,
          title: texts[employee.employee_id].title || "",
          description:
            texts[employee.employee_id].description || "",
          skills: skillsBy[employee.employee_id] || [],
        })),
      });

      try {
        const {
          start_at,
          end_at,
          start_mode,
          ...keep
        } = s;

        localStorage.setItem(storeKey, JSON.stringify(keep));
      } catch {
        // Le stockage local reste facultatif
      }

      setSuccess({ data, status });
    } catch (e) {
      console.error("Détail de l'erreur :", e.response?.data);

      const msg = e.response?.data?.message;

      if (e.response?.status === 422 && e.response?.data?.errors) {
        setError(Object.values(e.response.data.errors)[0][0]);
      } else {
        setError(
          msg || "Une erreur est survenue lors de la publication."
        );
      }

      setBusy(false);
    }
  };

  /* ------------------------------------------------------------------------
     Succès
  ------------------------------------------------------------------------ */

  if (success) {
    const published = success.status === "published";

    return (
      <SuccessScreen
        title={
          published
            ? "Talent(s) publié(s)"
            : "Brouillon enregistré"
        }
        text={
          published
            ? "Vos talents sont maintenant visibles par toutes les entreprises du réseau."
            : "Vos modifications ont bien été sauvegardées."
        }
        onClose={() => onDone(success.data, success.status)}
      />
    );
  }

  /* ------------------------------------------------------------------------
     Header / Footer
  ------------------------------------------------------------------------ */

  const stepper = (
    <div className="px-1 pb-1 pt-3">
      <ProgressSteps step={step} onGoTo={goTo} />
    </div>
  );

  const footer = (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => goTo(Math.max(0, step - 1))}
        disabled={step === 0 || busy}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:invisible dark:hover:bg-white/5 dark:hover:text-white"
      >
        <ArrowLeft size={15} />
        Retour
      </button>

      <div className="flex flex-1 justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 sm:block dark:hover:bg-white/5 dark:hover:text-white"
        >
          Annuler
        </button>

        {!isLast ? (
          <button
            type="button"
            onClick={goNext}
            className={`${btnPrimary} inline-flex items-center gap-2 rounded-xl px-5`}
          >
            Continuer
            <ArrowRight size={15} />
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => submit("draft")}
              className={`${btnGhost} rounded-xl`}
            >
              Brouillon
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => submit("published")}
              className={`${btnPrimary} inline-flex items-center gap-2 rounded-xl px-5`}
            >
            

              Publier
            </button>
          </>
        )}
      </div>
    </div>
  );

  /* ==========================================================================
     RENDER
  ========================================================================== */

  return (
    <ModalFrame
      icon={UserPlus}
      title="Mettre sur le marché"
      size="max-w-6xl"
      subtitle={`${employees.length} talent${
        employees.length > 1 ? "s" : ""
      } · ${company.name}`}
      onClose={onClose}
      headerExtra={stepper}
      footer={footer}
    >
      <div className="flex h-full min-h-0 flex-col bg-[#F7F9FC] dark:bg-[#0B1429] lg:flex-row">
        {/* ================================================================
            FORMULAIRE
        ================================================================= */}

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
          <div className="mx-auto max-w-3xl space-y-5">
            {/* Introduction compacte */}

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-teal-700 dark:text-teal-300">
                  Étape {step + 1} sur 3
                </p>

                <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {[
                    "Définissez la disponibilité",
                    "Valorisez les compétences",
                    "Finalisez votre annonce",
                  ][step]}
                </h2>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {[
                    "Configurez les modalités de mise à disposition de vos talents.",
                    "Présentez les savoir-faire qui feront la différence.",
                    "Personnalisez votre annonce avant sa publication.",
                  ][step]}
                </p>
              </div>

              <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300 sm:flex">
                {React.createElement(STEPS[step].icon, { size: 22 })}
              </div>
            </div>

            {/* Erreur */}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
              >
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* ============================================================
                ÉTAPE 1 : DISPONIBILITÉ
            ============================================================ */}

            {step === 0 && (
              <>
                <Section
                
                  title="Démarrer avec un modèle"
                  description={
                    restored
                      ? "Vos derniers réglages sont disponibles. Choisissez un modèle pour les remplacer."
                      : "Gagnez du temps avec une configuration prédéfinie."
                  }
                >
                  <div className="grid gap-3 sm:grid-cols-3">
                    {TEMPLATES.map((template, index) => (
                      <Choice
                        key={template.id}
                        active={isTemplate(template)}
                        onClick={() => applyTemplate(template)}
                        label={template.label}
                        sub={template.sub}
                        icon={
                          index === 0
                            ? Zap
                            : index === 1
                              ? CalendarDays
                              : TrendingUp
                        }
                      />
                    ))}
                  </div>
                </Section>

                <Section
                  icon={CalendarDays}
                  title="Date de début"
                  description="Quand votre collaborateur pourra-t-il commencer ?"
                >
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {START_OPTS.map(([key, label]) => (
                      <Choice
                        key={key}
                        active={s.start_mode === key}
                        label={label}
                        onClick={() =>
                          set({
                            start_mode: key,
                            ...(key !== "custom"
                              ? { start_at: startFor(key) }
                              : {}),
                          })
                        }
                      />
                    ))}
                  </div>

                  {s.start_mode === "custom" && (
                    <div className="mt-4 max-w-xs">
                      <label className={labelClass}>
                        Choisir une date
                      </label>

                      <input
                        type="date"
                        value={s.start_at}
                        onChange={(e) =>
                          set({ start_at: e.target.value })
                        }
                        className={fieldClass}
                      />
                    </div>
                  )}

                  {startConflict && (
                    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-2.5">
                        <Info
                          size={17}
                          className="mt-0.5 shrink-0 text-amber-600"
                        />

                        <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                          Un talent est en mission jusqu'au{" "}
                          <strong>{fmtDate(startConflict)}</strong>.
                          La date choisie est antérieure à sa libération.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          set({
                            start_mode: "custom",
                            start_at: startConflict,
                          })
                        }
                        className="shrink-0 text-left text-xs font-bold text-amber-800 underline underline-offset-2 dark:text-amber-200"
                      >
                        Utiliser cette date
                      </button>
                    </div>
                  )}
                </Section>

                <Section
                  icon={Clock3}
                  title="Durée de disponibilité"
                  description="Définissez la période pendant laquelle le talent pourra être mobilisé."
                >
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {DURATIONS.map(([key, label]) => (
                      <Choice
                        key={key}
                        active={s.duration === key}
                        label={label}
                        onClick={() =>
                          set({
                            duration: key,
                            ...(key === "custom" && !s.end_at
                              ? { end_at: endAt }
                              : {}),
                          })
                        }
                      />
                    ))}
                  </div>

                  {s.duration === "custom" && (
                    <div className="mt-4 max-w-xs">
                      <label className={labelClass}>
                        Date de fin
                      </label>

                      <input
                        type="date"
                        min={s.start_at}
                        value={s.end_at}
                        onChange={(e) =>
                          set({ end_at: e.target.value })
                        }
                        className={fieldClass}
                      />
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3.5 dark:bg-white/[0.035]">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Période sélectionnée
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">
                        {fmtDate(s.start_at)}{" "}
                        <span className="font-normal text-slate-400">
                          →
                        </span>{" "}
                        {fmtDate(endAt)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-teal-50 px-3 py-2 text-right dark:bg-teal-500/10">
                      <p className="text-[10px] font-semibold text-teal-600 dark:text-teal-300">
                        Durée estimée
                      </p>

                      <p className="text-sm font-extrabold text-teal-800 dark:text-teal-200">
                        {durLabel || "—"}
                      </p>

                      <p className="text-[10px] text-teal-600/80 dark:text-teal-300/70">
                        {days} jours ouvrés
                      </p>
                    </div>
                  </div>
                </Section>

                <Section
                  icon={Target}
                  title="Type de mission"
                  description="Quel type de collaboration souhaitez-vous proposer ?"
                >
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {MISSION_OPTS.map((mission) => (
                      <Choice
                        key={mission.v}
                        active={s.mission_type === mission.v}
                        onClick={() =>
                          set({ mission_type: mission.v })
                        }
                        label={mission.label}
                        sub={mission.hint}
                        icon={mission.icon}
                      />
                    ))}
                  </div>
                </Section>

                <Section
                  icon={Zap}
                  title="Charge de travail"
                  description="Précisez le temps que le collaborateur pourra consacrer à cette mission."
                >
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {WORKLOADS.map((workload) => (
                      <Choice
                        key={workload.id}
                        active={s.workload_preset === workload.id}
                        label={workload.label}
                        sub={workload.sub}
                        onClick={() =>
                          set(
                            workload.id === "custom"
                              ? { workload_preset: "custom" }
                              : {
                                  workload_preset: workload.id,
                                  workload_unit: workload.unit,
                                  workload_value: workload.value,
                                }
                          )
                        }
                      />
                    ))}
                  </div>

                  {s.workload_preset === "custom" && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className={labelClass}>
                          Valeur
                        </label>

                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={s.workload_value}
                          onChange={(e) =>
                            set({ workload_value: e.target.value })
                          }
                          className={fieldClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          Unité
                        </label>

                        <select
                          value={s.workload_unit}
                          onChange={(e) =>
                            set({ workload_unit: e.target.value })
                          }
                          className={fieldClass}
                        >
                          <option value="percentage">% du temps</option>
                          <option value="hours_per_week">
                            Heures / semaine
                          </option>
                          <option value="days_per_week">
                            Jours / semaine
                          </option>
                        </select>
                      </div>
                    </div>
                  )}
                </Section>

                <Section
                  icon={MapPin}
                  title="Lieu de travail"
                  description="Où la mission sera-t-elle réalisée ?"
                >
                  <div className="grid grid-cols-3 gap-2">
                    {LOC_OPTS.map((location) => (
                      <Choice
                        key={location.v}
                        active={s.location_type === location.v}
                        onClick={() =>
                          set({ location_type: location.v })
                        }
                        label={location.label}
                        icon={location.icon}
                      />
                    ))}
                  </div>

                  {s.location_type !== "remote" && (
                    <div className="mt-4">
                      <label className={labelClass}>
                        Ville de la mission
                      </label>

                      <input
                        value={s.location_city}
                        onChange={(e) => {
                          setCityTouched(true);
                          set({ location_city: e.target.value });
                        }}
                        placeholder="Ex. Antananarivo"
                        className={fieldClass}
                      />

                      {sg?.company_city &&
                        s.location_city !== sg.company_city && (
                          <button
                            type="button"
                            onClick={() =>
                              set({
                                location_city: sg.company_city,
                              })
                            }
                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-100 dark:bg-teal-500/10 dark:text-teal-300"
                          >
                            <MapPin size={12} />
                            Utiliser {sg.company_city}
                          </button>
                        )}
                    </div>
                  )}
                </Section>
              </>
            )}

            {/* ============================================================
                ÉTAPE 2 : COMPÉTENCES
            ============================================================ */}

            {step === 1 && (
              <>
                <Section
                  icon={Wrench}
                  title="Compétences du talent"
                  description="Sélectionnez les compétences qui seront visibles par les entreprises du réseau."
                >
                  <TalentSelector
                    employees={employees}
                    activeId={active.employee_id}
                    onChange={setActiveId}
                  />

                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.025]">
                    <div className="mb-4 flex items-center gap-3">
                      <Avatar
                        name={active.name}
                        src={active.photo_url}
                        size={42}
                      />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                          {active.name}
                        </p>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {active.position || "Collaborateur"}
                        </p>
                      </div>

                      <div className="ml-auto rounded-lg bg-white px-3 py-2 text-center shadow-sm dark:bg-[#101B35]">
                        <p className="text-lg font-extrabold text-teal-700 dark:text-teal-300">
                          {activeSkills.length}
                        </p>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Compétences
                        </p>
                      </div>
                    </div>

                    <SkillPicker
                      value={skillsBy[active.employee_id] || []}
                      onChange={(value) =>
                        setSkillsBy((previous) => ({
                          ...previous,
                          [active.employee_id]: value,
                        }))
                      }
                      hint={`${active.position || ""} ${
                        activeText.title || ""
                      }`}
                    />
                  </div>

                  <div
                    className={`mt-4 flex items-start gap-3 rounded-xl p-4 ${
                      activeSkills.length >= 3
                        ? "bg-emerald-50 dark:bg-emerald-500/10"
                        : "bg-amber-50 dark:bg-amber-500/10"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        activeSkills.length >= 3
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                      }`}
                    >
                      {activeSkills.length >= 3 ? (
                        <Check size={15} />
                      ) : (
                        <Info size={15} />
                      )}
                    </div>

                    <div>
                      <p
                        className={`text-xs font-bold ${
                          activeSkills.length >= 3
                            ? "text-emerald-800 dark:text-emerald-200"
                            : "text-amber-800 dark:text-amber-200"
                        }`}
                      >
                        {activeSkills.length >= 3
                          ? "Profil bien renseigné"
                          : "Améliorez la visibilité du profil"}
                      </p>

                      <p
                        className={`mt-1 text-xs leading-relaxed ${
                          activeSkills.length >= 3
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {activeSkills.length >= 3
                          ? "Ce profil dispose d'une bonne couverture de compétences."
                          : `Ajoutez ${
                              3 - activeSkills.length
                            } compétence${
                              3 - activeSkills.length > 1 ? "s" : ""
                            } supplémentaire${
                              3 - activeSkills.length > 1 ? "s" : ""
                            } pour améliorer son référencement.`}
                      </p>
                    </div>
                  </div>
                </Section>

                {employees.length > 1 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#111D38]">
                    <div className="mb-3 flex items-center gap-2">
                      <ShieldCheck
                        size={17}
                        className="text-teal-600 dark:text-teal-300"
                      />

                      <p className="text-sm font-bold text-slate-800 dark:text-white">
                        Vos autres talents
                      </p>
                    </div>

                    <div className="space-y-2">
                      {employees.map((employee) => (
                        <button
                          key={employee.employee_id}
                          type="button"
                          onClick={() =>
                            setActiveId(employee.employee_id)
                          }
                          className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:border-teal-200 hover:bg-teal-50/50 dark:border-white/5 dark:hover:border-teal-500/30 dark:hover:bg-teal-500/5"
                        >
                          <Avatar
                            name={employee.name}
                            src={employee.photo_url}
                            size={34}
                          />

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                              {employee.name}
                            </p>

                            <p className="text-[11px] text-slate-500">
                              {employee.position || "Collaborateur"}
                            </p>
                          </div>

                          <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-white/5 dark:text-slate-300">
                            {(skillsBy[employee.employee_id] || []).length}{" "}
                            compétences
                          </span>

                          <ArrowRight
                            size={14}
                            className="text-slate-400"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ============================================================
                ÉTAPE 3 : ANNONCE ET TARIF
            ============================================================ */}

            {step === 2 && (
              <>
                <Section
                  icon={FileText}
                  title="Présentation de l'annonce"
                  description="Personnalisez le contenu qui sera présenté aux entreprises."
                >
                  <TalentSelector
                    employees={employees}
                    activeId={active.employee_id}
                    onChange={setActiveId}
                  />

                  <div className="mt-4 space-y-4">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          Titre de l'annonce
                        </label>

                        <AutoBadge auto={!activeText.tEdited} />
                      </div>

                      <input
                        value={activeText.title || ""}
                        onChange={(e) =>
                          editText(
                            active.employee_id,
                            "title",
                            e.target.value
                          )
                        }
                        className={fieldClass}
                        maxLength={150}
                        placeholder="Ex. Développeur web disponible pour une mission"
                      />

                      <div className="mt-1.5 flex justify-end">
                        <span className="text-[10px] text-slate-400">
                          {(activeText.title || "").length}/150
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          Description détaillée
                        </label>

                        <div className="flex items-center gap-2">
                          <AutoBadge auto={!activeText.dEdited} />

                          {(activeText.tEdited || activeText.dEdited) && (
                            <button
                              type="button"
                              onClick={() => regenerate(active)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold text-teal-700 transition hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-500/10"
                            >
                              <RotateCcw size={12} />
                              Régénérer
                            </button>
                          )}
                        </div>
                      </div>

                      <textarea
                        rows={7}
                        value={activeText.description || ""}
                        onChange={(e) =>
                          editText(
                            active.employee_id,
                            "description",
                            e.target.value
                          )
                        }
                        className={`${fieldClass} resize-y leading-6`}
                        placeholder="Présentez le profil, ses compétences et ses disponibilités..."
                      />

                      <p className="mt-1.5 text-[10px] text-slate-400">
                        Une description précise aide les entreprises à comprendre la valeur du profil.
                      </p>
                    </div>
                  </div>
                </Section>

                <Section
                  icon={Coins}
                  title="Tarif journalier"
                  description="Définissez un tarif indicatif ou laissez les entreprises vous faire une proposition."
                >
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="min-w-0 flex-1">
                        <label className={labelClass}>
                          Montant journalier
                        </label>

                        <div className="flex gap-2">
                          <div className="relative min-w-0 flex-1">
                            <input
                              type="number"
                              min="0"
                              disabled={s.rate_open}
                              value={s.daily_rate}
                              onChange={(e) =>
                                set({ daily_rate: e.target.value })
                              }
                              placeholder="Ex. 150"
                              className={`${fieldClass} pr-16`}
                            />

                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">
                              / jour
                            </span>
                          </div>

                          <select
                            value={s.currency}
                            onChange={(e) =>
                              set({ currency: e.target.value })
                            }
                            disabled={s.rate_open}
                            className="w-[112px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:opacity-50 dark:border-white/10 dark:bg-[#101B35] dark:text-white"
                          >
                            <option value="EUR">€ EUR</option>
                            <option value="MGA">Ar MGA</option>
                          </select>
                        </div>
                      </div>

                      <label className="flex min-h-[46px] cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-semibold text-slate-600 transition hover:border-teal-300 dark:border-white/10 dark:bg-white/[0.025] dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={s.rate_open}
                          onChange={(e) =>
                            set({ rate_open: e.target.checked })
                          }
                          className="h-4 w-4 rounded accent-teal-600"
                        />

                        Tarif à discuter
                      </label>
                    </div>

                    {rateNum != null && rateNum > 0 && (
                      <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 dark:bg-white/[0.035]">
                        <Coins
                          size={15}
                          className="shrink-0 text-teal-600 dark:text-teal-300"
                        />

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Équivalent estimé :
                        </p>

                        <strong className="text-xs text-slate-800 dark:text-white">
                          {s.currency === "EUR"
                            ? `${new Intl.NumberFormat("fr-FR").format(
                                Math.round(
                                  rateNum * EXCHANGE_RATE_EUR_TO_MGA
                                )
                              )} Ar`
                            : `${(rateNum / EXCHANGE_RATE_EUR_TO_MGA).toFixed(
                                2
                              )} €`}
                        </strong>

                        <span className="ml-auto text-[9px] text-slate-400">
                          Taux indicatif
                        </span>
                      </div>
                    )}

                    {sg?.rate && (
                      <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 dark:border-teal-500/15 dark:bg-teal-500/[0.045]">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-white">
                              Référence du marché
                            </p>

                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                              Basée sur {sg.rate.count} offre
                              {sg.rate.count > 1 ? "s" : ""} comparable
                              {sg.rate.count > 1 ? "s" : ""}.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              set({
                                daily_rate: sg.rate.median,
                                rate_open: false,
                              })
                            }
                            className="rounded-lg bg-teal-600 px-3 py-2 text-[11px] font-bold text-white shadow-sm transition hover:bg-teal-700"
                          >
                            Appliquer {sg.rate.median} €
                          </button>
                        </div>

                        <RateGauge
                          rate={sg.rate}
                          value={s.rate_open ? "" : s.daily_rate}
                        />

                        {rateNum != null && (
                          <div className="mt-4 flex items-start gap-2 border-t border-teal-100 pt-3 dark:border-teal-500/15">
                            <TrendingUp
                              size={14}
                              className="mt-0.5 shrink-0 text-teal-700 dark:text-teal-300"
                            />

                            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                              {rateNum < sg.rate.median * 0.85
                                ? "Votre tarif est sous la médiane du marché : votre annonce pourrait être particulièrement attractive."
                                : rateNum > sg.rate.median * 1.15
                                  ? "Votre tarif est supérieur à la médiane : pensez à valoriser les compétences et l'expérience du talent."
                                  : "Votre tarif est aligné avec les références actuelles du marché."}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {potential != null && potential > 0 && (
                      <div className="rounded-xl border border-teal-100 bg-gradient-to-r from-teal-50 to-emerald-50 p-4 dark:border-teal-500/15 dark:from-teal-500/10 dark:to-emerald-500/5">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm dark:bg-teal-500/10 dark:text-teal-300">
                            <TrendingUp size={17} />
                          </div>

                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                              Revenu potentiel estimé
                            </p>

                            <p className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                              {s.currency === "MGA"
                                ? `${new Intl.NumberFormat("fr-FR").format(
                                    potential
                                  )} Ar`
                                : `${money(potential)} €`}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                              Pour {days} jours ouvrés, à{" "}
                              {s.workload_unit === "percentage"
                                ? `${s.workload_value} %`
                                : "la charge choisie"}
                              , par talent.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Section>

                <Section
                  icon={ScrollText}
                  title="Conditions particulières"
                  description="Ajoutez des informations utiles pour encadrer la collaboration."
                >
                  <div className="flex flex-wrap gap-2">
                    {COND_TAGS.map((tag) => {
                      const selected = s.cond_tags.includes(tag);

                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-semibold transition ${
                            selected
                              ? "border-teal-400 bg-teal-50 text-teal-800 dark:border-teal-400/40 dark:bg-teal-500/10 dark:text-teal-200"
                              : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700 dark:border-white/10 dark:bg-[#101B35] dark:text-slate-300"
                          }`}
                        >
                          {selected && <Check size={11} />}
                          {tag}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4">
                    <label className={labelClass}>
                      Autres conditions
                    </label>

                    <textarea
                      rows={3}
                      value={s.cond_extra}
                      onChange={(e) =>
                        set({ cond_extra: e.target.value })
                      }
                      className={`${fieldClass} resize-y`}
                      placeholder="Précisez d'autres conditions éventuelles..."
                    />
                  </div>
                </Section>

                <Section
                  icon={Eye}
                  title="Visibilité de l'annonce"
                  description="Choisissez les entreprises qui pourront consulter cette annonce."
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Choice
                      active={s.visibility === "public"}
                      onClick={() => set({ visibility: "public" })}
                      label="Public"
                      sub="Visible par toutes les entreprises du marché."
                      icon={Eye}
                    />

                    <Choice
                      active={s.visibility === "private"}
                      onClick={() => set({ visibility: "private" })}
                      label="Privé"
                      sub="Visible uniquement dans votre espace."
                      icon={ShieldCheck}
                    />
                  </div>
                </Section>
              </>
            )}
          </div>
        </main>

        {/* ================================================================
            APERÇU LATÉRAL
        ================================================================= */}

        <aside className="hidden w-[340px] shrink-0 flex-col overflow-y-auto border-l border-slate-200/80 bg-white p-5 dark:border-white/10 dark:bg-[#0E1931] xl:flex">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                Aperçu du marché
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                Rendu de votre annonce
              </p>
            </div>

            <span className="rounded-lg bg-teal-50 px-2.5 py-1.5 text-[10px] font-bold text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
              En direct
            </span>
          </div>

          {/* Carte du talent */}

          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#14213D]">
            <div className="h-1.5 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-300" />

            <div className="p-4">
              <div className="flex items-start gap-3">
                <Avatar
                  name={active.name}
                  src={active.photo_url}
                  size={46}
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">
                    {active.name}
                  </p>

                  <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {active.position || "Collaborateur"}
                  </p>

                  <p className="mt-1 truncate text-[10px] text-slate-400">
                    {company.name}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <StateBadge state="available" />

                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                  <MapPin size={11} />
                  {s.location_type === "remote"
                    ? "À distance"
                    : s.location_city || "Lieu à préciser"}
                </span>
              </div>

              <div className="mt-4">
                <p className="text-sm font-extrabold leading-snug text-slate-900 dark:text-white">
                  {activeText.title || "Titre de votre annonce"}
                </p>
              </div>

              {activeSkills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {activeSkills.slice(0, 5).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-lg bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300"
                    >
                      {skill}
                    </span>
                  ))}

                  {activeSkills.length > 5 && (
                    <span className="self-center text-[10px] font-bold text-slate-400">
                      +{activeSkills.length - 5}
                    </span>
                  )}
                </div>
              )}

              <div className="my-4 border-t border-slate-100 dark:border-white/10" />

              <dl className="space-y-3">
                {[
                  [
                    "Période",
                    `${fmtDate(s.start_at)} – ${fmtDate(endAt)}`,
                  ],
                  ["Durée", durLabel || "—"],
                  [
                    "Type",
                    MISSION_OPTS.find(
                      (mission) => mission.v === s.mission_type
                    )?.label,
                  ],
                  [
                    "Charge",
                    s.workload_unit === "percentage"
                      ? `${s.workload_value} %`
                      : s.workload_unit === "hours_per_week"
                        ? `${s.workload_value} h / sem.`
                        : `${s.workload_value} j / sem.`,
                  ],
                  [
                    "Lieu",
                    LOC_OPTS.find(
                      (location) => location.v === s.location_type
                    )?.label,
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-start justify-between gap-3 text-[10px]"
                  >
                    <dt className="shrink-0 text-slate-400">
                      {label}
                    </dt>

                    <dd className="text-right font-bold text-slate-700 dark:text-slate-200">
                      {value || "—"}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 rounded-xl bg-teal-50 px-3.5 py-3 dark:bg-teal-500/10">
                <p className="text-[9px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                  Tarif journalier
                </p>

                <p className="mt-1 text-base font-extrabold text-teal-800 dark:text-teal-200">
                  {rateNum == null
                    ? "À discuter"
                    : s.currency === "MGA"
                      ? `${new Intl.NumberFormat("fr-FR").format(
                          rateNum
                        )} Ar`
                      : `${rateNum} €`}
                  {rateNum != null && (
                    <span className="ml-1 text-[10px] font-semibold">
                      / jour
                    </span>
                  )}
                </p>
              </div>

              {conditions && (
                <div className="mt-4 border-t border-slate-100 pt-3 dark:border-white/10">
                  <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Conditions
                  </p>

                  <p className="whitespace-pre-line text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {conditions}
                  </p>
                </div>
              )}
            </div>
          </article>

          {/* Qualité de l'annonce */}

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#14213D]">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Qualité de l'annonce
                </p>

                <p className="mt-1 text-[10px] text-slate-400">
                  Complétion de votre profil
                </p>
              </div>

              <span className="text-xl font-extrabold tabular-nums text-teal-700 dark:text-teal-300">
                {quality}%
              </span>
            </div>

            <Meter
              value={quality}
              tone={
                quality >= 80
                  ? "emerald"
                  : quality >= 50
                    ? "teal"
                    : "amber"
              }
              className="mt-3"
            />

            <ul className="mt-4 space-y-2.5">
              {checks.map(([label, ok]) => (
                <li
                  key={label}
                  className="flex items-center gap-2.5"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                      ok
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500"
                    }`}
                  >
                    {ok && <Check size={10} strokeWidth={3} />}
                  </span>

                  <span
                    className={`text-[10px] ${
                      ok
                        ? "font-medium text-slate-500 dark:text-slate-400"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Conseil */}

          <div className="mt-4 rounded-xl bg-slate-50 p-3.5 dark:bg-white/[0.035]">
            <div className="flex items-start gap-2">
         

              <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                Une annonce complète avec des compétences précises et un tarif clair inspire davantage confiance aux entreprises.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </ModalFrame>
  );
}
