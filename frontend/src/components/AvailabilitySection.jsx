import React, { useState } from "react";
import {
  Plus, Trash2, Edit, Calendar as CalendarIcon, List,
  MapPin, Clock, LayoutGrid,
} from "lucide-react";
import AvailabilityCalendar from "./AvailabilityCalendar";
import { Card, SectionTitle, EmptyState, GhostButton } from "./ui/Card";

const STATUS_CONFIG = {
  available:           { label: "Disponible",               tone: "emerald", emoji: "🟢" },
  partially_available: { label: "Partiellement disponible", tone: "amber",   emoji: "🟡" },
  unavailable:         { label: "Non disponible",           tone: "rose",    emoji: "🔴" },
  on_mission:          { label: "En mission",               tone: "blue",    emoji: "🔵" },
};

const TYPE_LABELS = {
  full_time: "Temps plein", part_time: "Temps partiel", freelance: "Freelance",
  internship: "Stage", mission: "Mission",
};
const LOCATION_LABELS = { onsite: "Sur site", remote: "Télétravail", hybrid: "Hybride" };
const UNIT_LABELS = { percentage: "%", hours_per_week: "h/sem", days_per_week: "j/sem" };

export default function AvailabilitySection({ profile, onOpenModal, onDelete }) {
  const [view, setView] = useState("list");
  const windows = profile?.availability_windows || [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = windows
    .filter((w) => new Date(w.end_at) >= today)
    .sort((a, b) => new Date(a.start_at) - new Date(b.start_at));

  const past = windows
    .filter((w) => new Date(w.end_at) < today)
    .sort((a, b) => new Date(b.start_at) - new Date(a.start_at));

  return (
    <Card>
      <SectionTitle
        title="Disponibilités"
        action={
          <div className="flex items-center gap-2">
            <div className="flex rounded-full border border-[var(--border-app)] p-0.5">
              <button
                onClick={() => setView("list")}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                  view === "list"
                    ? "bg-emerald-500 text-[#0A1229]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-app)]"
                }`}
              >
                <List size={11} /> Liste
              </button>
              <button
                onClick={() => setView("calendar")}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                  view === "calendar"
                    ? "bg-emerald-500 text-[#0A1229]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-app)]"
                }`}
              >
                <LayoutGrid size={11} /> Calendrier
              </button>
            </div>
            <GhostButton icon={Plus} onClick={() => onOpenModal("availability")}>
              Ajouter
            </GhostButton>
          </div>
        }
      />

      {windows.length === 0 ? (
        <EmptyState
          emoji="🕐"
          text="Aucune disponibilité renseignée. Ajoutez une période pour indiquer quand vous êtes disponible."
          action={
            <button
              onClick={() => onOpenModal("availability")}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
            >
              + Ajouter une période
            </button>
          }
        />
      ) : view === "calendar" ? (
        <AvailabilityCalendar
          windows={windows}
          onDayClick={(w) => onOpenModal("availability", w)}
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-faint)]">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                À venir ({upcoming.length})
              </p>
              <div className="space-y-3">
                {upcoming.map((w) => (
                  <WindowCard
                    key={w.id}
                    w={w}
                    onEdit={() => onOpenModal("availability", w)}
                    onDelete={() => onDelete(w.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div className="mt-6 border-t border-[var(--border-app)] pt-5">
              <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-faint)]">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--text-faint)]" />
                Historique ({past.length})
              </p>
              <div className="space-y-2 opacity-60">
                {past.slice(0, 3).map((w) => (
                  <WindowCard
                    key={w.id}
                    w={w}
                    onEdit={() => onOpenModal("availability", w)}
                    onDelete={() => onDelete(w.id)}
                    compact
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function WindowCard({ w, onEdit, onDelete, compact = false }) {
  const cfg = STATUS_CONFIG[w.status] || STATUS_CONFIG.available;

  // Couleurs subtiles par statut
  const statusColors = {
    emerald: {
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/[0.06]",
      dot: "bg-emerald-400",
      text: "text-emerald-400",
      badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    },
    amber: {
      border: "border-amber-500/30",
      bg: "bg-amber-500/[0.06]",
      dot: "bg-amber-400",
      text: "text-amber-400",
      badge: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    },
    rose: {
      border: "border-rose-500/30",
      bg: "bg-rose-500/[0.06]",
      dot: "bg-rose-400",
      text: "text-rose-400",
      badge: "border-rose-500/30 bg-rose-500/10 text-rose-400",
    },
    blue: {
      border: "border-blue-500/30",
      bg: "bg-blue-500/[0.06]",
      dot: "bg-blue-400",
      text: "text-blue-400",
      badge: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    },
  }[cfg.tone];

  const startDate = new Date(w.start_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const endDate = new Date(w.end_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      className={`group relative rounded-xl border ${statusColors.border} ${statusColors.bg} transition hover:bg-opacity-100`}
    >
      {/* Barre supérieure avec statut */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border-app)] px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${statusColors.dot} animate-pulse`} />
          <span className={`text-sm font-semibold ${statusColors.text} truncate`}>
            {cfg.label}
          </span>
          <span className="hidden text-[11px] text-[var(--text-faint)] sm:inline">
            · {TYPE_LABELS[w.type] || w.type}
          </span>
        </div>

        {/* Actions hover */}
        <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={onEdit}
            className="rounded-md bg-[var(--bg-surface-hover)] p-1.5 text-[var(--text-muted)] transition hover:bg-[var(--bg-surface)] hover:text-emerald-400"
            title="Modifier"
          >
            <Edit size={12} />
          </button>
          <button
            onClick={onDelete}
            className="rounded-md bg-[var(--bg-surface-hover)] p-1.5 text-[var(--text-muted)] transition hover:bg-[var(--bg-surface)] hover:text-rose-400"
            title="Supprimer"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Corps : grille d'infos alignées */}
      <div className="grid gap-3 px-4 py-3 sm:grid-cols-3">
        {/* Période */}
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-surface-hover)] text-[var(--text-muted)]">
            <CalendarIcon size={13} />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
              Période
            </p>
            <p className="truncate text-xs font-medium text-[var(--text-app)]">
              {startDate} <span className="text-[var(--text-faint)]">→</span> {endDate}
            </p>
          </div>
        </div>

        {/* Charge */}
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-surface-hover)] text-[var(--text-muted)]">
            <Clock size={13} />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
              Charge
            </p>
            <p className="truncate text-xs font-medium text-[var(--text-app)]">
              {w.workload_value}{UNIT_LABELS[w.workload_unit] || "%"}
            </p>
          </div>
        </div>

        {/* Localisation */}
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-surface-hover)] text-[var(--text-muted)]">
            <MapPin size={13} />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
              Localisation
            </p>
            <p className="truncate text-xs font-medium text-[var(--text-app)]">
              {LOCATION_LABELS[w.location_type] || w.location_type}
              {w.location_city && ` · ${w.location_city}`}
            </p>
          </div>
        </div>
      </div>

      {/* Notes (optionnel) */}
      {!compact && w.notes && (
        <div className="border-t border-[var(--border-app)] px-4 py-2.5">
          <p className="text-xs leading-relaxed text-[var(--text-muted)]">
            <span className="text-[var(--text-faint)]">Notes : </span>
            {w.notes}
          </p>
        </div>
      )}

      {/* Récurrence (optionnel) */}
      {!compact && w.is_recurring && (
        <div className="border-t border-[var(--border-app)] px-4 py-2">
          <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-semibold ${statusColors.badge}`}>
            🔁 Récurrent · {w.recurrence_pattern}
          </span>
        </div>
      )}
    </div>
  );
}