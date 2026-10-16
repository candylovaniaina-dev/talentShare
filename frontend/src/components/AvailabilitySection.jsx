
import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Edit,
  Calendar as CalendarIcon,
  List,
  MapPin,
  Clock,
  LayoutGrid,
  CheckCircle2,
  History,
  Repeat2,
  ChevronRight,
} from "lucide-react";
import AvailabilityCalendar from "./AvailabilityCalendar";
import { Card, SectionTitle, EmptyState, GhostButton } from "./ui/Card";

const STATUS_CONFIG = {
  available: { label: "Disponible", tone: "teal" },
  partially_available: { label: "Partiellement disponible", tone: "amber" },
  unavailable: { label: "Non disponible", tone: "rose" },
  on_mission: { label: "En mission", tone: "blue" },
};

const TYPE_LABELS = {
  full_time: "Temps plein",
  part_time: "Temps partiel",
  freelance: "Freelance",
  internship: "Stage",
  mission: "Mission",
};

const LOCATION_LABELS = {
  onsite: "Sur site",
  remote: "Télétravail",
  hybrid: "Hybride",
};

const UNIT_LABELS = {
  percentage: "%",
  hours_per_week: "h/sem",
  days_per_week: "j/sem",
};

const TONE_STYLES = {
  teal: {
    border: "border-[#B8F0DF]",
    background: "bg-[#F0FCF8]",
    dot: "bg-[#0F9F87]",
    text: "text-[#087F70]",
    badge: "border-[#B8F0DF] bg-[#E7FAF4] text-[#087F70]",
    icon: "bg-[#E7FAF4] text-[#087F70]",
  },
  amber: {
    border: "border-amber-200",
    background: "bg-amber-50/70",
    dot: "bg-amber-400",
    text: "text-amber-700",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    icon: "bg-amber-50 text-amber-700",
  },
  rose: {
    border: "border-rose-200",
    background: "bg-rose-50/60",
    dot: "bg-rose-400",
    text: "text-rose-700",
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    icon: "bg-rose-50 text-rose-700",
  },
  blue: {
    border: "border-blue-200",
    background: "bg-blue-50/60",
    dot: "bg-blue-600",
    text: "text-blue-700",
    badge: "border-blue-200 bg-blue-50 text-blue-700",
    icon: "bg-blue-50 text-blue-700",
  },
};

export default function AvailabilitySection({
  profile,
  onOpenModal,
  onDelete,
}) {
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

  const viewButtonClass = (active) =>
    `inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-xs font-semibold transition ${
      active
        ? "bg-[#12364D] text-white shadow-sm"
        : "text-slate-500 hover:bg-white hover:text-[#12364D]"
    }`;

  return (
    <Card>
      <div className="space-y-5">
        <SectionTitle
          title="Disponibilités"
          action={
            <GhostButton
              icon={Plus}
              onClick={() => onOpenModal("availability")}
            >
              Ajouter
            </GhostButton>
          }
        />

        {/* Résumé et changement de vue */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#087F70] shadow-sm ring-1 ring-slate-100">
              <CalendarIcon size={20} />
            </div>

            <div>
              <p className="text-sm font-bold text-[#12364D]">
                Votre planning
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {windows.length} période{windows.length !== 1 ? "s" : ""} renseignée
                {windows.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              className={viewButtonClass(view === "list")}
            >
              <List size={15} />
              Liste
            </button>

            <button
              type="button"
              onClick={() => setView("calendar")}
              aria-pressed={view === "calendar"}
              className={viewButtonClass(view === "calendar")}
            >
              <LayoutGrid size={15} />
              Calendrier
            </button>
          </div>
        </div>

        {windows.length === 0 ? (
          <EmptyState
            emoji="🗓️"
            text="Aucune disponibilité renseignée. Ajoutez une période pour indiquer aux recruteurs quand vous êtes disponible."
            action={
              <button
                type="button"
                onClick={() => onOpenModal("availability")}
                className="inline-flex items-center gap-2 rounded-xl bg-[#12364D] px-4 py-3 text-xs font-semibold text-white transition hover:bg-[#1A3266]"
              >
                <Plus size={15} className="text-[#6EE7C8]" />
                Ajouter une période
              </button>
            }
          />
        ) : view === "calendar" ? (
          <AvailabilityCalendar
            windows={windows}
            onDayClick={(window) => onOpenModal("availability", window)}
          />
        ) : (
          <div className="space-y-7">
            {upcoming.length > 0 && (
              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E7FAF4] text-[#087F70]">
                      <CheckCircle2 size={17} />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-[#12364D]">
                        À venir
                      </h3>
                      <p className="text-xs text-slate-500">
                        Vos périodes actuelles et futures
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full border border-[#B8F0DF] bg-[#E7FAF4] px-2.5 py-1 text-xs font-semibold text-[#087F70]">
                    {upcoming.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {upcoming.map((window) => (
                    <WindowCard
                      key={window.id}
                      w={window}
                      onEdit={() => onOpenModal("availability", window)}
                      onDelete={() => onDelete(window.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section className="border-t border-slate-100 pt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <History size={17} />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-[#12364D]">
                        Historique
                      </h3>
                      <p className="text-xs text-slate-500">
                        Vos disponibilités précédentes
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
                    {past.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {past.slice(0, 3).map((window) => (
                    <WindowCard
                      key={window.id}
                      w={window}
                      onEdit={() => onOpenModal("availability", window)}
                      onDelete={() => onDelete(window.id)}
                      compact
                    />
                  ))}
                </div>

                {past.length > 3 && (
                  <p className="mt-3 text-center text-xs text-slate-400">
                    {past.length - 3} autre
                    {past.length - 3 > 1 ? "s" : ""} période
                    {past.length - 3 > 1 ? "s" : ""} dans l'historique
                  </p>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function WindowCard({ w, onEdit, onDelete, compact = false }) {
  const config = STATUS_CONFIG[w.status] || STATUS_CONFIG.available;
  const colors = TONE_STYLES[config.tone];

  const formatDate = (value) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Date non définie";
    }

    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const startDate = formatDate(w.start_at);
  const endDate = formatDate(w.end_at);
  const workloadUnit = UNIT_LABELS[w.workload_unit] || "%";
  const location =
    LOCATION_LABELS[w.location_type] || w.location_type || "Non précisée";

  return (
    <article
      className={`group overflow-hidden rounded-2xl border ${colors.border} bg-white transition duration-200 hover:shadow-[0_10px_30px_rgba(15,30,69,0.08)]`}
    >
      {/* En-tête de la carte */}
      <div
        className={`flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${
          compact ? "bg-slate-50/70" : colors.background
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colors.icon}`}
          >
            <CalendarIcon size={19} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${colors.badge}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                {config.label}
              </span>

              {w.is_recurring && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-500">
                  <Repeat2 size={11} />
                  Récurrent
                </span>
              )}
            </div>

            <p className="mt-1.5 truncate text-xs text-slate-500">
              {TYPE_LABELS[w.type] || w.type || "Type non précisé"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={onEdit}
            aria-label="Modifier cette disponibilité"
            title="Modifier"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-[#6EE7C8] hover:bg-[#F0FCF8] hover:text-[#087F70]"
          >
            <Edit size={14} />
            Modifier
          </button>

          <button
            type="button"
            onClick={onDelete}
            aria-label="Supprimer cette disponibilité"
            title="Supprimer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Informations */}
      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
        <InfoItem
          icon={CalendarIcon}
          label="Période"
          value={
            <span className="leading-relaxed">
              {startDate}
              <span className="mx-1 text-slate-400">→</span>
              {endDate}
            </span>
          }
        />

        <InfoItem
          icon={Clock}
          label="Charge de travail"
          value={
            w.workload_value != null && w.workload_value !== ""
              ? `${w.workload_value} ${workloadUnit}`
              : "Non précisée"
          }
        />

        <InfoItem
          icon={MapPin}
          label="Localisation"
          value={
            <span className="leading-relaxed">
              {location}
              {w.location_city ? ` · ${w.location_city}` : ""}
            </span>
          }
        />
      </div>

      {!compact && w.notes && (
        <div className="border-t border-slate-100 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Notes
          </p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
            {w.notes}
          </p>
        </div>
      )}

      {!compact && w.is_recurring && w.recurrence_pattern && (
        <div className="border-t border-slate-100 px-4 py-3">
          <span className="inline-flex items-center gap-2 text-xs text-slate-500">
            <Repeat2 size={14} className="text-[#087F70]" />
            Récurrence : {w.recurrence_pattern}
          </span>
        </div>
      )}

      {/* Pied de carte */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-3">
        <span className="text-[10px] text-slate-400">
          {compact ? "Période passée" : "Disponibilité enregistrée"}
        </span>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#087F70] transition hover:text-[#12364D]"
        >
          Voir les détails
          <ChevronRight size={14} />
        </button>
      </div>
    </article>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-100">
        <Icon size={16} />
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <div className="mt-1 break-words text-xs font-semibold text-[#12364D]">
          {value}
        </div>
      </div>
    </div>
  );
}
