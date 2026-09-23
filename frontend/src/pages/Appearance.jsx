import React from "react";
import { Link } from "react-router-dom";
import {
  Moon, Sun, Type, Contrast, Zap, ArrowLeft, Check,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import { useTheme } from "../context/ThemeContext";

export default function Appearance() {
  const {
    theme, fontSize, highContrast, reduceMotion, updatePreference,
  } = useTheme();

  return (
    <AppShell>
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-emerald-400"
        >
          
        </Link>
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
          Préférences
        </p>
        <h1 className="mt-1 text-3xl font-bold text-[var(--text-app)]">Affichage et accessibilité</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Personnalisez votre expérience sur TalentShare. Ces réglages sont propres à votre compte.
        </p>
      </div>

      <div className="space-y-6">
        {/* Thème */}
        <Card icon={theme === "dark" ? Moon : Sun} title="Thème" subtitle="Choisissez l'apparence de l'interface.">
          <div className="grid gap-3 sm:grid-cols-2">
            <ThemeOption
              icon={Sun}
              label="Clair"
              desc="Fond blanc, texte foncé"
              active={theme === "light"}
              onClick={() => updatePreference("theme_preference", "light")}
            />
            <ThemeOption
              icon={Moon}
              label="Sombre"
              desc="Fond navy, texte clair"
              active={theme === "dark"}
              onClick={() => updatePreference("theme_preference", "dark")}
            />
          </div>
        </Card>

        {/* Taille du texte */}
        <Card icon={Type} title="Taille du texte" subtitle="Ajustez la lisibilité selon votre confort.">
          <div className="grid gap-3 sm:grid-cols-3">
            <SizeOption
              label="Petit" size="14px" preview="Aa"
              active={fontSize === "small"}
              onClick={() => updatePreference("font_size", "small")}
            />
            <SizeOption
              label="Normal" size="16px" preview="Aa"
              active={fontSize === "normal"}
              onClick={() => updatePreference("font_size", "normal")}
            />
            <SizeOption
              label="Grand" size="18px" preview="Aa"
              active={fontSize === "large"}
              onClick={() => updatePreference("font_size", "large")}
            />
          </div>
        </Card>

        {/* Contraste */}
        <Card icon={Contrast} title="Contraste élevé" subtitle="Améliore la lisibilité pour les malvoyants.">
          <Toggle
            label="Activer le contraste élevé"
            hint="Renforce les bordures et les contrastes de texte."
            checked={highContrast}
            onChange={() => updatePreference("high_contrast", !highContrast)}
          />
        </Card>

        {/* Animations */}
        <Card icon={Zap} title="Animations" subtitle="Réduisez les mouvements si nécessaire.">
          <Toggle
            label="Réduire les animations"
            hint="Désactive les transitions et animations décoratives."
            checked={reduceMotion}
            onChange={() => updatePreference("reduce_motion", !reduceMotion)}
          />
        </Card>
      </div>
    </AppShell>
  );
}

function Card({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-6 backdrop-blur-xl">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
          <Icon size={18} />
        </span>
        <div>
          <h2 className="text-lg font-bold text-[var(--text-app)]">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-[var(--text-muted)]">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function ThemeOption({ icon: Icon, label, desc, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-4 rounded-2xl border-2 p-4 text-left transition ${
        active
          ? "border-emerald-500 bg-emerald-500/10"
          : "border-[var(--border-app)] bg-[var(--bg-surface)] hover:border-emerald-500/30"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          active ? "bg-emerald-500/20 text-emerald-300" : "bg-[var(--bg-surface-hover)] text-[var(--text-muted)]"
        }`}
      >
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[var(--text-app)]">{label}</p>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">{desc}</p>
      </div>
      {active && <Check size={18} className="shrink-0 text-emerald-400" />}
    </button>
  );
}

function SizeOption({ label, size, preview, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border-2 p-4 text-center transition ${
        active
          ? "border-emerald-500 bg-emerald-500/10"
          : "border-[var(--border-app)] bg-[var(--bg-surface)] hover:border-emerald-500/30"
      }`}
    >
      <p className="font-bold text-[var(--text-app)]" style={{ fontSize: size }}>
        {preview}
      </p>
      <p className="mt-2 text-xs font-semibold text-[var(--text-app)]">{label}</p>
      <p className="text-[10px] text-[var(--text-faint)]">{size}</p>
    </button>
  );
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-[var(--border-app)] bg-[var(--bg-surface)] p-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--text-app)]">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-emerald-500" : "bg-[var(--border-app)]"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}