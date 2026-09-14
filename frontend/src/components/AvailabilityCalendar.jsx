import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

const STATUS_COLORS = {
  available:           "bg-emerald-400 hover:bg-emerald-500",
  partially_available: "bg-amber-400 hover:bg-amber-500",
  unavailable:         "bg-rose-400 hover:bg-rose-500",
  on_mission:          "bg-blue-400 hover:bg-blue-500",
};

const STATUS_LABELS = {
  available:           "Disponible",
  partially_available: "Partiel",
  unavailable:         "Non dispo",
  on_mission:          "En mission",
};

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

/**
 * Calendrier mensuel affichant les disponibilités.
 * Props:
 *   - windows : tableau de availability_windows
 *   - onDayClick : callback (optionnel) pour ouvrir une dispo
 */
export default function AvailabilityCalendar({ windows = [], onDayClick }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear]   = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);

  // Génère les 42 jours du mois (grille 6×7)
  const days = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startWeekday = (firstDay.getDay() + 6) % 7; // Lundi = 0
    const totalDays = lastDay.getDate();

    const arr = [];
    // Jours du mois précédent
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth, -i);
      arr.push({ date: d, isCurrentMonth: false });
    }
    // Jours du mois
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(currentYear, currentMonth, i);
      arr.push({ date: d, isCurrentMonth: true });
    }
    // Compléter à 42
    while (arr.length < 42) {
      const last = arr[arr.length - 1].date;
      const d = new Date(last);
      d.setDate(d.getDate() + 1);
      arr.push({ date: d, isCurrentMonth: false });
    }
    return arr;
  }, [currentMonth, currentYear]);

  // Pour chaque jour, trouver la disponibilité correspondante
  const getWindowForDay = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return windows.find((w) => {
      const start = new Date(w.start_at);
      start.setHours(0, 0, 0, 0);
      const end = new Date(w.end_at);
      end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    });
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else setCurrentMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else setCurrentMonth((m) => m + 1);
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const isToday = (date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const selectedWindow = selectedDate ? getWindowForDay(selectedDate) : null;

  return (
    <div className="space-y-4">
      {/* Header navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon size={18} className="text-navy" />
          <h4 className="font-semibold text-navy">
            {MONTHS_FR[currentMonth]} {currentYear}
          </h4>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={goToToday}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:border-navy"
          >
            Aujourd'hui
          </button>
          <button
            onClick={prevMonth}
            className="rounded-lg border border-slate-200 p-2 hover:border-navy"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={nextMonth}
            className="rounded-lg border border-slate-200 p-2 hover:border-navy"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Jours de la semaine */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS_FR.map((d) => (
          <div key={d} className="py-1 text-center text-[11px] font-bold uppercase text-slate-400">
            {d}
          </div>
        ))}
      </div>

      {/* Grille des jours */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(({ date, isCurrentMonth }, i) => {
          const w = getWindowForDay(date);
          const statusColor = w ? STATUS_COLORS[w.status] : null;

          return (
            <button
              key={i}
              onClick={() => setSelectedDate(date)}
              className={`relative aspect-square rounded-lg text-xs font-medium transition ${
                isSelected(date)
                  ? "ring-2 ring-navy ring-offset-1"
                  : ""
              } ${
                !isCurrentMonth
                  ? "text-slate-300"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className={`flex h-full w-full items-center justify-center rounded-lg ${
                statusColor && isCurrentMonth ? `${statusColor} text-white` : ""
              } ${isToday(date) ? "ring-2 ring-navy ring-inset" : ""}`}>
                {date.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <div key={status} className="flex items-center gap-1.5 text-[11px]">
            <span className={`h-3 w-3 rounded ${STATUS_COLORS[status]}`} />
            <span className="text-slate-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Détail du jour sélectionné */}
      {selectedDate && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase text-slate-400 mb-1">
            {selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          {selectedWindow ? (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-navy">
                {STATUS_LABELS[selectedWindow.status]}
                {selectedWindow.type && ` · ${selectedWindow.type}`}
              </p>
              {selectedWindow.workload_value && (
                <p className="text-xs text-slate-500">
                  Charge : {selectedWindow.workload_value}
                  {selectedWindow.workload_unit === "percentage" ? "%" :
                   selectedWindow.workload_unit === "hours_per_week" ? "h/sem" : "j/sem"}
                </p>
              )}
              {selectedWindow.location_city && (
                <p className="text-xs text-slate-500">📍 {selectedWindow.location_city}</p>
              )}
              {selectedWindow.notes && (
                <p className="text-xs italic text-slate-500 mt-1">"{selectedWindow.notes}"</p>
              )}
              {onDayClick && (
                <button
                  onClick={() => onDayClick(selectedWindow)}
                  className="mt-2 text-xs font-semibold text-navy hover:underline"
                >
                  Modifier cette disponibilité →
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Aucune disponibilité déclarée ce jour.</p>
          )}
        </div>
      )}
    </div>
  );
}