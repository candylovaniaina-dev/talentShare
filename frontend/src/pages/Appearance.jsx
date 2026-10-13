import React from "react";
import { Link } from "react-router-dom";
import {
  Moon,
  Sun,
  Type,
  Contrast,
  Zap,
  ArrowLeft,
  Check,
  Eye,
  Palette,
  Accessibility,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import { useTheme } from "../context/ThemeContext";

export default function Appearance() {
  const {
    theme,
    fontSize,
    highContrast,
    reduceMotion,
    updatePreference,
  } = useTheme();

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6 pb-8">
        {/* Header */}
        <header>
          <Link
            to="/dashboard"
            className="mb-5 inline-flex items-center gap-2 rounded-lg text-sm text-[var(--text-muted)] transition hover:text-emerald-400"
          >
            <ArrowLeft size={16} />
            Retour au tableau de bord
          </Link>

          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              <Palette size={26} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                Préférences personnelles
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text-app)] sm:text-3xl">
                Affichage et accessibilité
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
                Personnalisez l'apparence de TalentShare et adaptez
                l'interface à vos préférences de lecture.
              </p>
            </div>
          </div>
        </header>

        {/* Current preferences overview */}
        <section className="rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Eye size={19} />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-[var(--text-app)]">
                Votre expérience actuelle
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Les préférences ci-dessous sont appliquées via votre
                configuration de thème.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <PreferenceTag>
              {theme === "dark" ? "Thème sombre" : "Thème clair"}
            </PreferenceTag>
            <PreferenceTag>
              Texte {fontSize === "small" ? "petit" : fontSize === "large" ? "grand" : "normal"}
            </PreferenceTag>
            {highContrast && <PreferenceTag>Contraste élevé</PreferenceTag>}
            {reduceMotion && <PreferenceTag>Animations réduites</PreferenceTag>}
          </div>
        </section>

        <div className="space-y-5">
          {/* Theme */}
          <SettingsCard
            icon={theme === "dark" ? Moon : Sun}
            title="Thème de l'interface"
            subtitle="Choisissez le style visuel qui vous convient."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <ThemeOption
                icon={Sun}
                label="Clair"
                description="Interface lumineuse et fonds clairs."
                active={theme === "light"}
                onClick={() =>
                  updatePreference("theme_preference", "light")
                }
                variant="light"
              />

              <ThemeOption
                icon={Moon}
                label="Sombre"
                description="Interface sombre et reposante."
                active={theme === "dark"}
                onClick={() =>
                  updatePreference("theme_preference", "dark")
                }
                variant="dark"
              />
            </div>
          </SettingsCard>

          {/* Font size */}
          <SettingsCard
            icon={Type}
            title="Taille du texte"
            subtitle="Choisissez une taille adaptée à votre confort de lecture."
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <SizeOption
                label="Petit"
                size="14px"
                preview="Aa"
                description="Plus compact"
                active={fontSize === "small"}
                onClick={() =>
                  updatePreference("font_size", "small")
                }
              />

              <SizeOption
                label="Normal"
                size="16px"
                preview="Aa"
                description="Taille standard"
                active={fontSize === "normal"}
                onClick={() =>
                  updatePreference("font_size", "normal")
                }
              />

              <SizeOption
                label="Grand"
                size="20px"
                preview="Aa"
                description="Plus lisible"
                active={fontSize === "large"}
                onClick={() =>
                  updatePreference("font_size", "large")
                }
              />
            </div>
          </SettingsCard>

          {/* High contrast */}
          <SettingsCard
            icon={Contrast}
            title="Contraste"
            subtitle="Améliorez la distinction entre le texte et l'arrière-plan."
          >
            <Toggle
              label="Contraste élevé"
              description="Renforce les contrastes et les bordures de l'interface."
              checked={highContrast}
              onChange={() =>
                updatePreference("high_contrast", !highContrast)
              }
            />
          </SettingsCard>

          {/* Motion */}
          <SettingsCard
            icon={Zap}
            title="Animations et mouvements"
            subtitle="Adaptez les effets de transition selon vos préférences."
          >
            <Toggle
              label="Réduire les animations"
              description="Limite les animations et les mouvements décoratifs de l'interface."
              checked={reduceMotion}
              onChange={() =>
                updatePreference("reduce_motion", !reduceMotion)
              }
            />
          </SettingsCard>

          {/* Accessibility note */}
          <div className="flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
            <Accessibility
              size={19}
              className="mt-0.5 shrink-0 text-blue-400"
            />
            <div>
              <p className="text-sm font-semibold text-[var(--text-app)]">
                Accessibilité
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                Choisissez les paramètres qui rendent votre navigation
                plus confortable. L'effet réel de chaque option dépend
                également de son application dans les styles globaux
                de l'interface.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function SettingsCard({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
          <Icon size={19} />
        </span>

        <div>
          <h2 className="text-base font-bold text-[var(--text-app)]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm leading-5 text-[var(--text-muted)]">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {children}
    </section>
  );
}

function ThemeOption({
  icon: Icon,
  label,
  description,
  active,
  onClick,
  variant,
}) {
  const previewClass =
    variant === "light"
      ? "border-slate-200 bg-white text-slate-800"
      : "border-slate-700 bg-[#0A1229] text-slate-100";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border-2 p-4 text-left transition ${
        active
          ? "border-emerald-500 bg-emerald-500/5"
          : "border-[var(--border-app)] hover:border-emerald-500/30"
      }`}
    >
      <div
        className={`mb-4 flex h-24 flex-col justify-between rounded-xl border p-3 ${previewClass}`}
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="h-2 w-14 rounded-full bg-current opacity-30" />
          <span className="ml-auto">
            <Icon size={14} />
          </span>
        </div>

        <div className="space-y-2">
          <span className="block h-2 w-2/3 rounded-full bg-current opacity-60" />
          <span className="block h-2 w-1/2 rounded-full bg-current opacity-20" />
          <span className="block h-2 w-4/5 rounded-full bg-emerald-500/70" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            active
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-[var(--bg-surface-hover)] text-[var(--text-muted)]"
          }`}
        >
          <Icon size={17} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[var(--text-app)]">
            {label}
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {description}
          </p>
        </div>

        {active && <Check size={18} className="shrink-0 text-emerald-400" />}
      </div>
    </button>
  );
}

function SizeOption({
  label,
  size,
  preview,
  description,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border-2 p-4 text-center transition ${
        active
          ? "border-emerald-500 bg-emerald-500/5"
          : "border-[var(--border-app)] hover:border-emerald-500/30"
      }`}
    >
      <div className="flex h-16 items-center justify-center rounded-xl bg-[var(--bg-surface-hover)]">
        <span
          className="font-bold text-[var(--text-app)]"
          style={{ fontSize: size }}
        >
          {preview}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        <span className="text-sm font-bold text-[var(--text-app)]">
          {label}
        </span>
        {active && <Check size={15} className="text-emerald-400" />}
      </div>

      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {description}
      </p>
    </button>
  );
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface-hover)] p-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--text-app)]">
          {label}
        </p>
        {description && (
          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
            {description}
          </p>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-2 focus:ring-offset-[var(--bg-surface)] ${
          checked ? "bg-emerald-500" : "bg-[var(--border-app)]"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function PreferenceTag({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--border-app)] bg-[var(--bg-surface-hover)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)]">
      {children}
    </span>
  );
}