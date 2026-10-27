
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  BriefcaseBusiness,
  MapPin,
  Globe,
  Phone,
  Users,
  Camera,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
 CircleDashed,
  FileText,
  Check,
  ShieldCheck,
  Link2,
  Plus,
  ExternalLink,
  ImagePlus,
} from "lucide-react";

import api from "../services/api";
import { useToast } from "../context/ToastContext";
import { countries } from "../utils/countries";
import { cities } from "../utils/cities";

const SECTORS = [
  "Tech",
  "Finance",
  "Santé",
  "Éducation",
  "Commerce",
  "Industrie",
  "Autre",
];

const COMPANY_SIZES = [
  { value: "1-10", label: "1–10", description: "Petite équipe" },
  { value: "11-50", label: "11–50", description: "Petite entreprise" },
  { value: "51-200", label: "51–200", description: "Entreprise moyenne" },
  { value: "201-500", label: "201–500", description: "Grande équipe" },
  { value: "501-1000", label: "501–1 000", description: "Grande entreprise" },
  { value: "1000+", label: "1 000+", description: "Grande organisation" },
];

const inputCls =
  "block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-[#18352E] outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-[#0C947C] focus:ring-4 focus:ring-emerald-500/[0.09] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[#10251E] dark:text-white dark:placeholder:text-slate-500 dark:hover:border-white/20 dark:focus:border-emerald-400";

const labelCls =
  "mb-2 block text-[13px] font-semibold text-[#29473D] dark:text-slate-200";

const cardCls =
  "rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_24px_-16px_rgba(15,45,35,0.16)] dark:border-white/[0.09] dark:bg-[#0D1F18]";

function Field({
  label,
  icon: Icon,
  required = false,
  error,
  hint,
  children,
}) {
  return (
    <div className="min-w-0">
      <label className={labelCls}>
        {label}
        {required && (
          <span className="ml-1 text-emerald-600 dark:text-emerald-400">
            *
          </span>
        )}
      </label>

      {children}

      {error ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-500">
          <AlertCircle size={13} />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function SectionHeader({
  number,
  icon: Icon,
  title,
  description,
  completed,
}) {
  return (
    <div className="mb-5 flex items-start gap-3.5">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
          completed
            ? "bg-emerald-500 text-white"
            : "border border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-400/15 dark:bg-emerald-400/[0.08] dark:text-emerald-300"
        }`}
      >
        {completed ? (
          <Check size={20} strokeWidth={2.5} />
        ) : (
          <Icon size={20} strokeWidth={1.8} />
        )}
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[15px] font-bold tracking-tight text-[#17382D] dark:text-white">
            {title}
          </h2>

          {completed && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
              Complété
            </span>
          )}
        </div>

        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>

      <span className="pt-1 text-[11px] font-semibold tabular-nums text-slate-400">
        0{number}
      </span>
    </div>
  );
}

function SectorButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-[13px] font-medium transition duration-200 ${
        active
          ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm dark:border-emerald-400/50 dark:bg-emerald-400/10 dark:text-emerald-300"
          : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-300 dark:hover:border-emerald-400/30 dark:hover:bg-emerald-400/[0.04]"
      }`}
    >
      {active && (
        <Check size={14} strokeWidth={2.5} />
      )}
      {children}
    </button>
  );
}

function SizeOption({ active, onClick, option }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`group flex min-h-[77px] items-center gap-3 rounded-xl border p-3 text-left transition duration-200 ${
        active
          ? "border-emerald-500 bg-emerald-50/80 ring-1 ring-emerald-500/20 dark:border-emerald-400/50 dark:bg-emerald-400/[0.08]"
          : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50/70 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-emerald-400/30"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
          active
            ? "bg-emerald-600 text-white dark:bg-emerald-400 dark:text-[#10251E]"
            : "bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:bg-white/[0.06] dark:text-slate-400"
        }`}
      >
        <Users size={17} />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`block text-sm font-bold ${
            active
              ? "text-emerald-800 dark:text-emerald-300"
              : "text-[#244237] dark:text-slate-200"
          }`}
        >
          {option.label}
        </span>

        <span className="mt-0.5 block text-[10px] leading-4 text-slate-500 dark:text-slate-400">
          {option.description}
        </span>
      </span>

      <span
        className={`flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full border transition ${
          active
            ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-[#10251E]"
            : "border-slate-300 dark:border-white/20"
        }`}
      >
        {active && <Check size={11} strokeWidth={3} />}
      </span>
    </button>
  );
}

function CompletionRow({ label, completed }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition ${
          completed
            ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-[#10251E]"
            : "border-slate-300 text-transparent dark:border-white/20"
        }`}
      >
        <Check size={11} strokeWidth={3} />
      </span>

      <span
        className={`text-xs ${
          completed
            ? "font-medium text-[#29473D] dark:text-slate-200"
            : "text-slate-500 dark:text-slate-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export default function CompanyOnboarding({ onCreated }) {
  const { showToast } = useToast();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    industry: "",
    size: "",
    country: "Madagascar",
    city: "",
    address: "",
    website: "",
    phone: "",
  });

  const [sectorChoice, setSectorChoice] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const update = (key) => (event) => {
    const value = event.target.value;

    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const chooseSector = (sector) => {
    setSectorChoice(sector);

    setForm((current) => ({
      ...current,
      industry: sector === "Autre" ? "" : sector,
    }));
  };

  const handleLogo = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const supportedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!supportedTypes.includes(file.type)) {
      showToast(
        "Format non supporté. Utilisez JPG, PNG ou WEBP.",
        "error"
      );

      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast("Image trop lourde : 2 Mo maximum.", "error");
      event.target.value = "";
      return;
    }

    const preview = URL.createObjectURL(file);

    setLogoFile(file);
    setLogoPreview(preview);

    event.target.value = "";
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const errors = {
    name: !form.name.trim()
      ? "Le nom de l'entreprise est requis."
      : null,

    industry: !form.industry.trim()
      ? "Choisissez ou saisissez un secteur."
      : null,

    size: !form.size
      ? "Sélectionnez la taille de votre équipe."
      : null,
  };

  const hasErrors = Object.values(errors).some(Boolean);

  const steps = useMemo(
    () => ({
      identity: !!form.name.trim(),
      activity: !!form.industry.trim() && !!form.size,
      location: !!form.city.trim(),
      contact: !!(
        form.website.trim() || form.phone.trim()
      ),
    }),
    [form]
  );

  const progress = useMemo(() => {
    const checks = [
      !!form.name.trim(),
      !!form.description.trim(),
      !!form.industry.trim(),
      !!form.size,
      !!form.city.trim(),
      !!form.address.trim(),
      !!form.website.trim(),
      !!form.phone.trim(),
      !!logoFile,
    ];

    return Math.round(
      (checks.filter(Boolean).length / checks.length) * 100
    );
  }, [form, logoFile]);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitted(true);

    if (hasErrors) {
      showToast(
        "Veuillez compléter les champs obligatoires.",
        "error"
      );
      return;
    }

    const payload = { ...form };

    if (
      payload.website &&
      !/^https?:\/\//i.test(payload.website.trim())
    ) {
      payload.website = `https://${payload.website.trim()}`;
    }

    Object.keys(payload).forEach((key) => {
      if (typeof payload[key] === "string") {
        payload[key] = payload[key].trim();
      }

      if (payload[key] === "") {
        payload[key] = null;
      }
    });

    payload.name = form.name.trim();

    setSaving(true);

    try {
      const response = await api.post("/companies", payload);

      const created =
        response.data?.data || response.data;

      if (logoFile && created?.id) {
        try {
          const data = new FormData();

          data.append("logo", logoFile);

          await api.post(
            `/companies/${created.id}/logo`,
            data,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
        } catch (logoError) {
          console.warn(
            "Logo non uploadé :",
            logoError.response?.data || logoError.message
          );

          showToast(
            "Entreprise créée, mais le logo n'a pas pu être envoyé.",
            "error"
          );
        }
      }

      showToast(
        "Votre entreprise a été créée avec succès !",
        "success"
      );

      onCreated?.(created);
    } catch (error) {
      const validationErrors =
        error.response?.data?.errors || {};

      const message =
        error.response?.data?.message ||
        Object.values(validationErrors)[0]?.[0] ||
        "Impossible de créer l'entreprise.";

      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const showError = (key) =>
    submitted ? errors[key] : null;

  const initial = form.name.trim().charAt(0).toUpperCase();

  const location = [
    form.city.trim(),
    form.country,
  ]
    .filter(Boolean)
    .join(", ");

  const checklist = [
    {
      label: "Nom de l'entreprise",
      completed: steps.identity,
    },
    {
      label: "Secteur d'activité",
      completed: !!form.industry.trim(),
    },
    {
      label: "Taille de l'équipe",
      completed: !!form.size,
    },
  ];

  return (
    <div className="relative min-h-full overflow-hidden bg-[#F5F8F6] px-4 py-5 transition-colors duration-300 dark:bg-[#091710] sm:px-6 sm:py-7 lg:px-8">
      <style>{`
        @keyframes companyFadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes companyGlow {
          0%, 100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(10px, -10px, 0);
          }
        }

        .company-enter {
          animation: companyFadeUp 0.45s ease-out both;
        }

        .company-glow {
          animation: companyGlow 12s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .company-enter,
          .company-glow {
            animation: none !important;
          }
        }
      `}</style>

      {/* Fond subtil */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="company-glow absolute -right-40 -top-40 h-[420px] w-[420px] rounded-full bg-emerald-300/15 blur-[110px] dark:bg-emerald-500/[0.06]" />

        <div className="absolute -bottom-48 -left-32 h-[400px] w-[400px] rounded-full bg-teal-300/10 blur-[110px] dark:bg-teal-500/[0.04]" />
      </div>

      <div className="company-enter relative mx-auto max-w-[1240px]">
        {/* En-tête */}
        <header className="mb-6 flex flex-col justify-between gap-5 sm:mb-7 sm:flex-row sm:items-end">
          <div className="min-w-0">
           

            <h1 className="max-w-3xl text-[27px] font-extrabold leading-tight tracking-[-0.04em] text-[#17382D] dark:text-white sm:text-3xl lg:text-[38px]">
              Donnez vie à votre
              <span className="text-emerald-700 dark:text-emerald-400">
                {" "}espace professionnel.
              </span>
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Présentez votre organisation, valorisez votre activité
              et créez de nouvelles opportunités sur TalentShare.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03] sm:min-w-[205px]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
              <ShieldCheck size={21} />
            </div>

            <div>
              <p className="text-xs font-bold text-[#234438] dark:text-white">
                Configuration guidée
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Simple et rapide
              </p>
            </div>
          </div>
        </header>

        {/* Barre de progression */}
        <div className={`${cardCls} mb-5 p-4 sm:p-5`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
             <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
  <CircleDashed size={19} />
</div>

              <div>
                <p className="text-sm font-bold text-[#203E33] dark:text-white">
                  Complétez votre profil
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Chaque information améliore votre présentation.
                </p>
              </div>
            </div>

            <div className="w-full sm:max-w-[280px]">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Progression du profil
                </span>

                <span className="text-sm font-extrabold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {progress}%
                </span>
              </div>

              <div
                className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"
                role="progressbar"
                aria-label="Progression du profil"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mise en page principale */}
        <form onSubmit={submit} noValidate>
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
            {/* FORMULAIRE */}
            <div className="min-w-0 space-y-5">
              {/* Identité */}
              <section className={`${cardCls} p-5 sm:p-6`}>
                <SectionHeader
                  number={1}
                  icon={Building2}
                  title="Identité de l'entreprise"
                  description="Les informations essentielles de votre organisation."
                  completed={steps.identity}
                />

                <div className="space-y-5">
                  {/* Logo */}
                  <div className="flex flex-col gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.02] sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      aria-label="Choisir le logo de l'entreprise"
                      className="group relative flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-emerald-400 dark:border-white/10 dark:bg-[#10251E]"
                    >
                      {logoPreview ? (
                        <>
                          <img
                            src={logoPreview}
                            alt="Aperçu du logo"
                            className="h-full w-full object-contain p-1.5"
                          />

                          <span className="absolute inset-0 flex items-center justify-center bg-[#10251E]/60 text-white opacity-0 transition group-hover:opacity-100">
                            <Camera size={22} />
                          </span>
                        </>
                      ) : (
                        <span className="flex flex-col items-center gap-1.5 text-slate-400 transition group-hover:text-emerald-600 dark:text-slate-500 dark:group-hover:text-emerald-300">
                          <ImagePlus size={25} strokeWidth={1.5} />
                          <span className="text-[9px] font-semibold">
                            Ajouter
                          </span>
                        </span>
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#244237] dark:text-white">
                        Logo de votre entreprise
                        <span className="ml-1.5 text-[10px] font-medium text-slate-400">
                          Facultatif
                        </span>
                      </p>

                      <p className="mt-1.5 max-w-md text-xs leading-5 text-slate-500 dark:text-slate-400">
                        Ajoutez votre identité visuelle pour rendre
                        votre profil plus reconnaissable.
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 dark:bg-emerald-500 dark:text-[#10251E] dark:hover:bg-emerald-400"
                        >
                          <Camera size={14} />
                          {logoPreview ? "Changer le logo" : "Importer un logo"}
                        </button>

                        {logoPreview && (
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-400/10"
                          >
                            <X size={14} />
                            Supprimer
                          </button>
                        )}
                      </div>

                      <p className="mt-2 text-[10px] text-slate-400">
                        JPG, PNG ou WEBP · 2 Mo maximum
                      </p>

                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleLogo}
                      />
                    </div>
                  </div>

                  <Field
                    label="Nom de l'entreprise"
                    required
                    error={showError("name")}
                  >
                    <input
                      autoFocus
                      value={form.name}
                      onChange={update("name")}
                      placeholder="Ex. : TalentShare Madagascar"
                      autoComplete="organization"
                      maxLength={255}
                      aria-invalid={!!showError("name")}
                      className={`${inputCls} ${
                        showError("name")
                          ? "!border-rose-400 focus:!ring-rose-500/10"
                          : ""
                      }`}
                    />
                  </Field>

                  <Field
                    label="Présentation"
                    hint="Présentez votre activité, votre mission et vos domaines d'expertise."
                  >
                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={update("description")}
                      placeholder="Quelques mots sur votre entreprise et ce qui la rend unique..."
                      className={`${inputCls} min-h-[105px] resize-y leading-6`}
                    />

                    <div className="mt-1.5 flex justify-end">
                      <span className="text-[10px] tabular-nums text-slate-400">
                        {form.description.length} caractères
                      </span>
                    </div>
                  </Field>
                </div>
              </section>

              {/* Activité */}
              <section className={`${cardCls} p-5 sm:p-6`}>
                <SectionHeader
                  number={2}
                  icon={BriefcaseBusiness}
                  title="Activité & équipe"
                  description="Définissez votre secteur et la taille de votre organisation."
                  completed={steps.activity}
                />

                <div className="space-y-6">
                  <Field
                    label="Secteur d'activité"
                    required
                    error={showError("industry")}
                  >
                    <div className="flex flex-wrap gap-2">
                      {SECTORS.map((sector) => (
                        <SectorButton
                          key={sector}
                          active={sectorChoice === sector}
                          onClick={() => chooseSector(sector)}
                        >
                          {sector}
                        </SectorButton>
                      ))}
                    </div>

                    {sectorChoice === "Autre" && (
                      <div className="mt-3">
                        <input
                          value={form.industry}
                          onChange={update("industry")}
                          placeholder="Précisez votre secteur d'activité"
                          maxLength={255}
                          aria-label="Autre secteur d'activité"
                          aria-invalid={!!showError("industry")}
                          className={`${inputCls} ${
                            showError("industry")
                              ? "!border-rose-400"
                              : ""
                          }`}
                        />
                      </div>
                    )}
                  </Field>

                  <div>
                    <Field
                      label="Taille de l'équipe"
                      required
                      error={showError("size")}
                    >
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                        {COMPANY_SIZES.map((option) => (
                          <SizeOption
                            key={option.value}
                            option={option}
                            active={form.size === option.value}
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                size: option.value,
                              }))
                            }
                          />
                        ))}
                      </div>
                    </Field>
                  </div>
                </div>
              </section>

              {/* Localisation */}
              <section className={`${cardCls} p-5 sm:p-6`}>
                <SectionHeader
                  number={3}
                  icon={MapPin}
                  title="Localisation"
                  description="Indiquez où se trouve votre organisation."
                  completed={steps.location}
                />

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Pays">
                      <div className="relative">
                        <Globe
                          size={16}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <select
                          value={form.country}
                          onChange={update("country")}
                          className={`${inputCls} appearance-none pl-10 pr-8`}
                        >
                          {countries.map((country) => (
                            <option
                              key={country.code}
                              value={country.name}
                            >
                              {country.name}
                            </option>
                          ))}
                        </select>

                        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                          <ArrowRight
                            size={13}
                            className="rotate-90"
                          />
                        </span>
                      </div>
                    </Field>

                    <Field label="Ville">
                      <div className="relative">
                        <MapPin
                          size={16}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          list="company-onboarding-cities"
                          value={form.city}
                          onChange={update("city")}
                          placeholder="Ex. : Antananarivo"
                          autoComplete="address-level2"
                          className={`${inputCls} pl-10`}
                        />

                        <datalist id="company-onboarding-cities">
                          {cities.map((city) => (
                            <option key={city} value={city} />
                          ))}
                        </datalist>
                      </div>
                    </Field>
                  </div>

                  <Field label="Adresse du siège">
                    <input
                      value={form.address}
                      onChange={update("address")}
                      placeholder="Rue, quartier, adresse..."
                      autoComplete="street-address"
                      className={inputCls}
                    />
                  </Field>
                </div>
              </section>

              {/* Contact */}
              <section className={`${cardCls} p-5 sm:p-6`}>
                <SectionHeader
                  number={4}
                  icon={Phone}
                  title="Coordonnées"
                  description="Facilitez les échanges avec votre organisation."
                  completed={steps.contact}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Site web">
                    <div className="relative">
                      <Link2
                        size={16}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="text"
                        inputMode="url"
                        value={form.website}
                        onChange={update("website")}
                        placeholder="www.votreentreprise.com"
                        autoComplete="url"
                        className={`${inputCls} pl-10`}
                      />
                    </div>
                  </Field>

                  <Field label="Téléphone professionnel">
                    <div className="relative">
                      <Phone
                        size={16}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="tel"
                        value={form.phone}
                        onChange={update("phone")}
                        placeholder="+261 ..."
                        autoComplete="tel"
                        className={`${inputCls} pl-10`}
                      />
                    </div>
                  </Field>
                </div>
              </section>

              {/* Bouton de création pour les petits écrans */}
              <div className="lg:hidden">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-emerald-700 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:text-[#10251E] dark:hover:bg-emerald-400"
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      Créer mon entreprise
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>

                <p className="mt-3 text-center text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                  Vérifiez les informations avant de confirmer.
                </p>
              </div>
            </div>

            {/* APERÇU LATÉRAL */}
            <aside className="space-y-4 lg:sticky lg:top-5">
              {/* Carte de profil */}
              <section className={`${cardCls} overflow-hidden`}>
                <div className="flex items-center justify-between px-4 py-4">
                  <div>
                    <p className="text-sm font-bold text-[#203E33] dark:text-white">
                      Aperçu du profil
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Actualisé en direct
                    </p>
                  </div>

                  <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:border-emerald-400/15 dark:bg-emerald-400/[0.08] dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Aperçu
                  </span>
                </div>

                {/* Bannière */}
                <div className="relative h-[100px] overflow-hidden bg-gradient-to-br from-[#124D3D] via-[#087F70] to-[#41B99A]">
                  <div
                    aria-hidden="true"
                    className="absolute -right-8 -top-16 h-44 w-44 rounded-full border border-white/15"
                  />

                  <div
                    aria-hidden="true"
                    className="absolute -right-2 -top-10 h-28 w-28 rounded-full border border-white/15"
                  />

                  <div
                    aria-hidden="true"
                    className="absolute -bottom-14 left-10 h-32 w-32 rounded-full bg-white/[0.07] blur-xl"
                  />

                  <div className="absolute bottom-3 left-4 flex items-center gap-2 text-white/80">
                    <Building2 size={15} />
                    <span className="text-[10px] font-semibold tracking-wide">
                      TALENTSHARE
                    </span>
                  </div>
                </div>

     <div className="px-4 pb-5">
                  {/* ✅ LOGO CORRIGÉ : z-10 pour passer au-dessus de la bannière */}
                  <div className="relative z-10 -mt-9 flex items-end justify-between">
                    {logoPreview ? (
                      <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md dark:border-[#0D1F18] dark:bg-[#10251E]">
                        <img
                          src={logoPreview}
                          alt="Logo de l'entreprise"
                          className="h-full w-full object-contain p-1"
                        />
                      </div>
                    ) : (
                      <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-emerald-500 to-teal-700 text-2xl font-extrabold text-white shadow-md dark:border-[#0D1F18]">
                        {initial || <Building2 size={27} />}
                      </div>
                    )}

                    {form.size && (
                      <span className="mb-1 shrink-0 rounded-lg border border-slate-200 bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-600 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-[#10251E]/90 dark:text-slate-300">
                        <Users size={11} className="mr-1 inline" />
                        {form.size} employés
                      </span>
                    )}
                  </div>

                  {/* ✅ NOM ET SECTEUR : Bien en dessous du logo */}
                  <div className="mt-4">
                    <h2
                      className={`break-words text-lg font-extrabold leading-snug tracking-tight ${
                        form.name
                          ? "text-[#18382D] dark:text-white"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {form.name || "Nom de votre entreprise"}
                    </h2>

                    <p className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      {form.industry || "Secteur d'activité"}
                    </p>
                  </div>

                  <div className="my-4 h-px bg-slate-100 dark:bg-white/[0.08]" />

                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    À propos
                  </p>

                  <p
                    className={`mt-2 whitespace-pre-wrap break-words text-xs leading-5 ${
                      form.description
                        ? "text-slate-600 dark:text-slate-300"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {form.description ||
                      "La présentation de votre entreprise apparaîtra ici."}
                  </p>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 dark:bg-white/[0.05] dark:text-slate-400">
                        <MapPin size={14} />
                      </span>

                      <div className="min-w-0 flex-1 pt-1">
                        <p className="text-[10px] text-slate-400">
                          Localisation
                        </p>
                        <p className="mt-0.5 break-words text-xs font-medium text-[#29473D] dark:text-slate-200">
                          {location || "Ville et pays"}
                        </p>
                      </div>
                    </div>

                    {form.address && (
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 dark:bg-white/[0.05] dark:text-slate-400">
                          <Building2 size={14} />
                        </span>

                        <div className="min-w-0 flex-1 pt-1">
                          <p className="text-[10px] text-slate-400">
                            Adresse
                          </p>
                          <p className="mt-0.5 break-words text-xs text-slate-600 dark:text-slate-300">
                            {form.address}
                          </p>
                        </div>
                      </div>
                    )}

                    {form.website && (
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 dark:bg-white/[0.05] dark:text-slate-400">
                          <Globe size={14} />
                        </span>

                        <div className="min-w-0 flex-1 pt-1">
                          <p className="text-[10px] text-slate-400">
                            Site web
                          </p>
                          <p className="mt-0.5 break-all text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            {form.website}
                          </p>
                        </div>
                      </div>
                    )}

                    {form.phone && (
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 dark:bg-white/[0.05] dark:text-slate-400">
                          <Phone size={14} />
                        </span>

                        <div className="min-w-0 flex-1 pt-1">
                          <p className="text-[10px] text-slate-400">
                            Téléphone
                          </p>
                          <p className="mt-0.5 break-words text-xs font-medium text-[#29473D] dark:text-slate-200">
                            {form.phone}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 dark:border-emerald-400/10 dark:bg-emerald-400/[0.05]">
                    <ShieldCheck
                      size={16}
                      className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-300"
                    />

                    <p className="text-[11px] leading-5 text-emerald-900/80 dark:text-emerald-200/80">
                      Votre profil pourra être enrichi après sa création.
                    </p>
                  </div>
                </div>
              </section>

              {/* Checklist */}
              <section className={`${cardCls} p-4`}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-[#203E33] dark:text-white">
                    Informations essentielles
                  </h3>

                  <span className="text-xs font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {checklist.filter((item) => item.completed).length}/3
                  </span>
                </div>

                <div className="space-y-3.5">
                  {checklist.map((item) => (
                    <CompletionRow
                      key={item.label}
                      label={item.label}
                      completed={item.completed}
                    />
                  ))}
                </div>

                {submitted && hasErrors && (
                  <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-400/15 dark:bg-rose-400/[0.06]">
                    <p className="flex items-start gap-2 text-xs leading-5 text-rose-600 dark:text-rose-300">
                      <AlertCircle
                        size={15}
                        className="mt-0.5 shrink-0"
                      />
                      Complétez les champs obligatoires signalés dans le formulaire.
                    </p>
                  </div>
                )}
              </section>

              {/* Action principale desktop */}
              <div className="hidden lg:block">
                <button
                  type="submit"
                  disabled={saving}
                  className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-emerald-700 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/[0.10] transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:bg-emerald-500 dark:text-[#10251E] dark:hover:bg-emerald-400"
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      Créer mon entreprise
                      <ArrowRight
                        size={17}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>

                <p className="mt-3 text-center text-[10px] leading-5 text-slate-500 dark:text-slate-400">
                  Vérifiez les informations avant de confirmer.
                </p>
              </div>
            </aside>
          </div>
        </form>

        {/* Pied de page */}
        <footer className="mt-7 flex flex-col items-center justify-between gap-2 border-t border-slate-200/70 py-5 text-center dark:border-white/[0.08] sm:flex-row sm:text-left">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            TalentShare · Le talent crée les opportunités.
          </p>

          <p className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
            Espace professionnel
          </p>
        </footer>
      </div>
    </div>
  );
}
