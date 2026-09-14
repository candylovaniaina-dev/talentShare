import React, { useState } from "react";
import { Plus, Trash2, Edit, Calendar as CalendarIcon, List, MapPin, Clock, LayoutGrid } from "lucide-react";
import AvailabilityCalendar from "./AvailabilityCalendar";

const STATUS_CONFIG = {
  available:           { label: "Disponible",               color: "emerald", emoji: "🟢" },
  partially_available: { label: "Partiellement disponible", color: "amber",   emoji: "🟡" },
  unavailable:         { label: "Non disponible",           color: "rose",    emoji: "🔴" },
  on_mission:          { label: "En mission",               color: "blue",    emoji: "🔵" },
};

const TYPE_LABELS = {
  full_time: "Temps plein", part_time: "Temps partiel", freelance: "Freelance",
  internship: "Stage", mission: "Mission",
};

const LOCATION_LABELS = { onsite: "🏢 Sur site", remote: "🏠 Télétravail", hybrid: "🔄 Hybride" };
const UNIT_LABELS = { percentage: "%", hours_per_week: "h/sem", days_per_week: "j/sem" };

export default function AvailabilitySection({ profile, onOpenModal, onDelete }) {
  const [view, setView] = useState("list"); // "list" | "calendar"
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
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold">Disponibilités</h3>
          <p className="text-sm text-slate-400">
            Périodes déclarées. Les chevauchements sont détectés automatiquement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Onglets vue */}
          <div className="flex rounded-full border border-slate-200 p-0.5">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                view === "list" ? "bg-navy text-white" : "text-slate-500 hover:text-navy"
              }`}
            >
              <List size={12} /> Liste
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                view === "calendar" ? "bg-navy text-white" : "text-slate-500 hover:text-navy"
              }`}
            >
              <LayoutGrid size={12} /> Calendrier
            </button>
          </div>
          <button
            onClick={() => onOpenModal("availability")}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:border-navy"
          >
            <Plus size={13} /> Ajouter
          </button>
        </div>
      </div>

      {windows.length === 0 ? (
        <p className="text-sm text-slate-400">
          Aucune disponibilité renseignée.{" "}
          <button onClick={() => onOpenModal("availability")} className="font-semibold text-navy hover:underline">
            Ajoutez une période
          </button>
        </p>
      ) : view === "calendar" ? (
        <AvailabilityCalendar
          windows={windows}
          onDayClick={(w) => onOpenModal("availability", w)}
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
                À venir ({upcoming.length})
              </p>
              <div className="space-y-2">
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
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
                Historique ({past.length})
              </p>
              <div className="space-y-2 opacity-60">
                {past.slice(0, 3).map((w) => (
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
        </>
      )}
    </div>
  );
}

function WindowCard({ w, onEdit, onDelete }) {
  const cfg = STATUS_CONFIG[w.status] || STATUS_CONFIG.available;

  const colorClasses = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber:   "bg-amber-50 text-amber-700 border-amber-200",
    rose:    "bg-rose-50 text-rose-700 border-rose-200",
    blue:    "bg-blue-50 text-blue-700 border-blue-200",
  }[cfg.color];

  return (
    <div className={`group relative rounded-2xl border p-4 ${colorClasses}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg">{cfg.emoji}</span>
            <span className="font-semibold text-sm">{cfg.label}</span>
            <span className="text-xs opacity-70">· {TYPE_LABELS[w.type] || w.type}</span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <CalendarIcon size={12} />
              {new Date(w.start_at).toLocaleDateString("fr-FR")} → {new Date(w.end_at).toLocaleDateString("fr-FR")}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {w.workload_value}{UNIT_LABELS[w.workload_unit] || "%"}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {LOCATION_LABELS[w.location_type] || w.location_type}
              {w.location_city && ` · ${w.location_city}`}
            </span>
          </div>

          {w.notes && <p className="mt-2 text-xs italic opacity-80">"{w.notes}"</p>}
          {w.is_recurring && <p className="mt-1 text-xs opacity-70">🔁 Récurrent : {w.recurrence_pattern}</p>}
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
          <button onClick={onEdit} className="p-1.5 rounded-lg bg-white/70 hover:bg-white" title="Modifier">
            <Edit size={14} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg bg-white/70 hover:bg-white" title="Supprimer">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}