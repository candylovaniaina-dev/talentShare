import React from "react";
import {
  Moon, Sun, Type, Contrast, Zap, Check, Eye,
  Palette, Accessibility, Sparkles, ChevronRight,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function Appearance() {
  const {
    theme, fontSize, highContrast, reduceMotion, updatePreference,
  } = useTheme();

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10 text-[#0B1F33] transition-colors duration-300 dark:text-slate-200 font-['Plus_Jakarta_Sans',sans-serif] sm:space-y-7">
      {/* En-tête */}
      <header className="relative isolate overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-[#16B8B1]/5 p-6 shadow-sm dark:border-white/10 dark:from-[#112A3A] dark:via-[#112A3A] dark:to-[#16B8B1]/10 dark:shadow-none sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 -z-10 h-56 w-56 rounded-full bg-[#16B8B1]/20 blur-3xl dark:bg-[#16B8B1]/10" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 -z-10 h-40 w-40 rounded-full bg-[#0B1F33]/10 blur-3xl dark:bg-[#16B8B1]/10" />

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#16B8B1]/20 bg-[#16B8B1]/10 text-[#0F9691] shadow-sm dark:border-[#16B8B1]/20 dark:bg-[#16B8B1]/15 dark:text-[#16B8B1]">
            <Palette size={26} strokeWidth={1.8} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#16B8B1]">
              Préférences
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0B1F33] dark:text-white sm:text-3xl">
              Apparence et accessibilité
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
              Personnalisez votre expérience TalentShare selon vos préférences visuelles et votre confort de lecture.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5 dark:border-white/10">
          <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <span className="h-2 w-2 rounded-full bg-[#16B8B1]" />
            Préférences d'affichage
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <Accessibility size={14} className="text-[#0F9691] dark:text-[#16B8B1]" />
            Accessibilité
          </span>
        </div>
      </header>

      {/* Résumé des préférences */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#112A3A] dark:shadow-none">
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-5 dark:border-white/10 sm:px-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#16B8B1]/10 text-[#0F9691] dark:bg-[#16B8B1]/15 dark:text-[#16B8B1]">
            <Eye size={19} />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-[#0B1F33] dark:text-white">
              Votre configuration actuelle
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
              Retrouvez ici un aperçu de vos préférences.
            </p>
          </div>

          <span className="hidden rounded-full bg-[#16B8B1]/10 px-3 py-1 text-xs font-semibold text-[#0F9691] dark:text-[#16B8B1] sm:inline-flex">
            En cours
          </span>
        </div>

        <div className="grid gap-3 bg-slate-50/70 p-4 dark:bg-white/[0.03] sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
          <PreferenceTag icon={theme === "dark" ? Moon : Sun} label="Thème"
            value={theme === "dark" ? "Sombre" : "Clair"} />
          <PreferenceTag icon={Type} label="Taille du texte"
            value={fontSize === "small" ? "Petite" : fontSize === "large" ? "Grande" : "Normale"} />
          <PreferenceTag icon={Contrast} label="Contraste"
            value={highContrast ? "Renforcé" : "Standard"} />
          <PreferenceTag icon={Zap} label="Animations"
            value={reduceMotion ? "Réduites" : "Activées"} />
        </div>
      </section>

      <div className="space-y-5">
        {/* Thème */}
        <SettingsCard
          icon={theme === "dark" ? Moon : Sun}
          eyebrow="PERSONNALISATION"
          title="Thème de l'interface"
          subtitle="Choisissez l'apparence générale de la plateforme."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <ThemeOption
              icon={Sun} label="Mode clair"
              description="Un environnement lumineux, net et professionnel."
              active={theme === "light"}
              onClick={() => updatePreference("theme_preference", "light")}
              variant="light"
            />
            <ThemeOption
              icon={Moon} label="Mode sombre"
              description="Une interface sombre, adaptée aux environnements peu éclairés."
              active={theme === "dark"}
              onClick={() => updatePreference("theme_preference", "dark")}
              variant="dark"
            />
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#16B8B1]/20 bg-[#16B8B1]/5 p-4 dark:border-[#16B8B1]/20 dark:bg-[#16B8B1]/10">
            <Sparkles size={17} className="mt-0.5 shrink-0 text-[#0F9691] dark:text-[#16B8B1]" />
            <p className="text-xs leading-5 text-[#0B1F33]/80 dark:text-[#16B8B1]/90">
              Le mode clair est présenté avec un fond blanc et des accents turquoise.
              Le rendu effectif du mode sombre dépend des styles globaux et des composants de l'application.
            </p>
          </div>
        </SettingsCard>

        {/* Taille du texte */}
        <SettingsCard
          icon={Type} eyebrow="CONFORT DE LECTURE"
          title="Taille du texte"
          subtitle="Adaptez la taille des caractères à vos besoins."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <SizeOption label="Petit" size="14px" preview="Aa" description="Affichage compact"
              active={fontSize === "small"} onClick={() => updatePreference("font_size", "small")} />
            <SizeOption label="Normal" size="17px" preview="Aa" description="Taille standard"
              active={fontSize === "normal"} onClick={() => updatePreference("font_size", "normal")} />
            <SizeOption label="Grand" size="21px" preview="Aa" description="Lecture facilitée"
              active={fontSize === "large"} onClick={() => updatePreference("font_size", "large")} />
          </div>
        </SettingsCard>

        {/* Contraste */}
        <SettingsCard
          icon={Contrast} eyebrow="LISIBILITÉ"
          title="Contraste de l'interface"
          subtitle="Améliorez la distinction entre les textes, les bordures et les arrière-plans."
        >
          <Toggle
            label="Contraste élevé"
            description="Renforce les contrastes pour faciliter la lecture des contenus."
            checked={highContrast}
            onChange={() => updatePreference("high_contrast", !highContrast)}
            icon={Eye}
          />
        </SettingsCard>

        {/* Animations */}
        <SettingsCard
          icon={Zap} eyebrow="CONFORT VISUEL"
          title="Animations et mouvements"
          subtitle="Adaptez les effets de transition à votre confort."
        >
          <Toggle
            label="Réduire les animations"
            description="Limite les animations et les mouvements décoratifs lorsqu'ils sont pris en charge par l'interface."
            checked={reduceMotion}
            onChange={() => updatePreference("reduce_motion", !reduceMotion)}
            icon={Zap}
          />
        </SettingsCard>

        {/* Accessibilité */}
        <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-[#16B8B1]/5 p-5 shadow-sm dark:border-white/10 dark:from-[#112A3A] dark:to-[#16B8B1]/10 dark:shadow-none sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0F9691] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-[#16B8B1] dark:shadow-none">
              <Accessibility size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[#0B1F33] dark:text-white">
                Accessibilité et confort
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Choisissez les options qui vous permettent d'utiliser TalentShare plus confortablement,
                sur ordinateur comme sur mobile.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
              <Check size={16} className="mt-0.5 shrink-0 text-[#16B8B1]" />
              <div>
                <p className="text-xs font-semibold text-[#0B1F33] dark:text-slate-200">Lecture personnalisée</p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Ajustez la taille du texte à votre convenance.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
              <Check size={16} className="mt-0.5 shrink-0 text-[#16B8B1]" />
              <div>
                <p className="text-xs font-semibold text-[#0B1F33] dark:text-slate-200">Affichage adaptable</p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Sélectionnez le thème qui correspond à votre environnement.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500 dark:border-white/10 dark:text-slate-400">
            Remarque : le changement de thème, le contraste et les animations ne s'appliquent à tous les
            composants que si les styles globaux de TalentShare prennent ces préférences en charge.
          </p>
        </section>
      </div>
    </div>
  );
}

/* ============================================================
   COMPOSANTS
============================================================ */

function SettingsCard({ icon: Icon, eyebrow, title, subtitle, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-white/10 dark:bg-[#112A3A] dark:shadow-none dark:hover:shadow-none">
      <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-5 dark:border-white/10 sm:px-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#16B8B1]/20 bg-[#16B8B1]/10 text-[#0F9691] dark:border-[#16B8B1]/20 dark:bg-[#16B8B1]/15 dark:text-[#16B8B1]">
          <Icon size={20} strokeWidth={1.8} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#16B8B1]">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-base font-extrabold text-[#0B1F33] dark:text-white sm:text-lg">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        <ChevronRight size={17} className="mt-1 hidden shrink-0 text-slate-300 dark:text-slate-600 sm:block" />
      </div>

      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}

function ThemeOption({ icon: Icon, label, description, active, onClick, variant }) {
  const previewClass =
    variant === "light"
      ? "border-slate-200 bg-white text-[#0B1F33] dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
      : "border-slate-700 bg-[#0B1F33] text-slate-100 dark:border-white/20 dark:bg-[#071521]";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group rounded-2xl border-2 p-3.5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#16B8B1]/20 sm:p-4 ${
        active
          ? "border-[#16B8B1] bg-[#16B8B1]/5 shadow-[0_0_0_3px_rgba(22,184,177,0.10)] dark:border-[#16B8B1] dark:bg-[#16B8B1]/10 dark:shadow-none"
          : "border-slate-200 bg-white hover:border-[#16B8B1]/50 hover:bg-[#16B8B1]/5 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-[#16B8B1]/40 dark:hover:bg-[#16B8B1]/10"
      }`}
    >
      <div className={`mb-4 flex h-28 flex-col justify-between rounded-xl border p-3 ${previewClass}`}>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#16B8B1]" />
          <span className="h-2 w-16 rounded-full bg-current opacity-25" />
          <span className="ml-auto opacity-70"><Icon size={15} /></span>
        </div>

        <div className="flex gap-2">
          <div className="w-1/3 rounded-lg border border-current/10 bg-current/[0.04] p-2">
            <span className="mb-2 block h-2 w-full rounded-full bg-current opacity-20" />
            <span className="block h-2 w-2/3 rounded-full bg-[#16B8B1]/80" />
          </div>
          <div className="flex-1 rounded-lg border border-current/10 bg-current/[0.03] p-2">
            <span className="mb-2 block h-2 w-3/4 rounded-full bg-current opacity-35" />
            <span className="mb-2 block h-2 w-full rounded-full bg-current opacity-15" />
            <span className="block h-2 w-1/2 rounded-full bg-[#16B8B1]/80" />
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
            active
              ? "border-[#16B8B1]/40 bg-[#16B8B1]/15 text-[#0F9691] dark:text-[#16B8B1]"
              : "border-slate-200 bg-slate-50 text-slate-500 group-hover:border-[#16B8B1]/30 group-hover:text-[#0F9691] dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:group-hover:text-[#16B8B1]"
          }`}
        >
          <Icon size={18} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#0B1F33] dark:text-white">{label}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>
        </div>

        {active && (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#16B8B1] text-white shadow-sm">
            <Check size={14} strokeWidth={2.5} />
          </span>
        )}
      </div>
    </button>
  );
}

function SizeOption({ label, size, preview, description, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border-2 p-4 text-center transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#16B8B1]/20 ${
        active
          ? "border-[#16B8B1] bg-[#16B8B1]/5 shadow-sm dark:border-[#16B8B1] dark:bg-[#16B8B1]/10 dark:shadow-none"
          : "border-slate-200 bg-white hover:border-[#16B8B1]/50 hover:bg-[#16B8B1]/5 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-[#16B8B1]/40 dark:hover:bg-[#16B8B1]/10"
      }`}
    >
      <div
        className={`flex h-20 items-center justify-center rounded-xl border ${
          active
            ? "border-[#16B8B1]/20 bg-white dark:border-[#16B8B1]/20 dark:bg-white/5"
            : "border-slate-100 bg-slate-50 dark:border-white/10 dark:bg-white/5"
        }`}
      >
        <span className="font-bold tracking-tight text-[#0B1F33] dark:text-slate-200" style={{ fontSize: size }}>
          {preview}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        <span className="text-sm font-bold text-[#0B1F33] dark:text-white">{label}</span>
        {active && <Check size={15} className="text-[#0F9691] dark:text-[#16B8B1]" />}
      </div>

      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
    </button>
  );
}

function Toggle({ label, description, checked, onChange, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-[#16B8B1]/40 hover:bg-[#16B8B1]/5 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-[#16B8B1]/40 dark:hover:bg-[#16B8B1]/10 sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0F9691] dark:border-white/10 dark:bg-white/5 dark:text-[#16B8B1]">
            <Icon size={17} />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#0B1F33] dark:text-slate-100">{label}</p>
          {description && (
            <p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>
          )}
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-[#16B8B1]/20 ${
          checked
            ? "border-[#16B8B1] bg-[#16B8B1]"
            : "border-slate-300 bg-slate-200 dark:border-white/10 dark:bg-white/10"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function PreferenceTag({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#16B8B1]/10 text-[#0F9691] dark:bg-[#16B8B1]/15 dark:text-[#16B8B1]">
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-0.5 truncate text-sm font-bold text-[#0B1F33] dark:text-slate-200">{value}</p>
      </div>
    </div>
  );
}