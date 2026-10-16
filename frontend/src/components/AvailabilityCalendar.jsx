
import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  CheckCircle2,
} from "lucide-react";

const STATUS_COLORS = {
  available: "bg-[#0F9F87] text-white hover:bg-[#087F70]",
  partially_available: "bg-amber-300 text-[#26334B] hover:bg-amber-400",
  unavailable: "bg-rose-400 text-white hover:bg-rose-500",
  on_mission: "bg-blue-600 text-white hover:bg-blue-700",
};

const STATUS_LABELS = {
  available: "Disponible",
  partially_available: "Partiellement disponible",
  unavailable: "Non disponible",
  on_mission: "En mission",
};

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export default function AvailabilityCalendar({ windows = [], onDayClick }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);

  const days = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startWeekday = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();
    const arr = [];

    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth, -i);
      arr.push({ date: d, isCurrentMonth: false });
    }

    for (let i = 1; i <= totalDays; i++) {
      arr.push({
        date: new Date(currentYear, currentMonth, i),
        isCurrentMonth: true,
      });
    }

    while (arr.length < 42) {
      const last = arr[arr.length - 1].date;
      const d = new Date(last);
      d.setDate(d.getDate() + 1);
      arr.push({ date: d, isCurrentMonth: false });
    }

    return arr;
  }, [currentMonth, currentYear]);

  const getWindowForDay = (date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    return windows.find((w) => {
      const start = new Date(w.start_at);
      start.setHours(0, 0, 0, 0);

      const end = new Date(w.end_at);
      end.setHours(23, 59, 59, 999);

      return dayStart >= start && dayStart <= end;
    });
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((year) => year - 1);
    } else {
      setCurrentMonth((month) => month - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((year) => year + 1);
    } else {
      setCurrentMonth((month) => month + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(new Date());
  };

  const isToday = (date) =>
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const isSelected = (date) =>
    !!selectedDate &&
    date.getDate() === selectedDate.getDate() &&
    date.getMonth() === selectedDate.getMonth() &&
    date.getFullYear() === selectedDate.getFullYear();

  const selectedWindow = selectedDate
    ? getWindowForDay(selectedDate)
    : null;

  return (
    <div className="space-y-5 text-[#12364D]">
      {/* En-tête du calendrier */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E7FAF4] text-[#087F70]">
            <CalendarIcon size={21} />
          </div>

          <div>
            <h4 className="text-lg font-bold tracking-tight text-[#12364D]">
              {MONTHS_FR[currentMonth]} {currentYear}
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              Consultez vos périodes de disponibilité
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToToday}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#12364D] transition hover:border-[#6EE7C8] hover:bg-[#F0FCF8]"
          >
            Aujourd'hui
          </button>

          <button
            type="button"
            onClick={prevMonth}
            aria-label="Mois précédent"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-[#6EE7C8] hover:bg-[#F0FCF8] hover:text-[#087F70]"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            onClick={nextMonth}
            aria-label="Mois suivant"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-[#6EE7C8] hover:bg-[#F0FCF8] hover:text-[#087F70]"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Grille */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm sm:p-4">
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {DAYS_FR.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:text-xs"
            >
              {day}
            </div>
          ))}

          {days.map(({ date, isCurrentMonth }, index) => {
            const window = getWindowForDay(date);
            const statusClass = window
              ? STATUS_COLORS[window.status]
              : "";

            const selected = isSelected(date);
            const currentDay = isToday(date);

            return (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setSelectedDate(date);
                  if (window && onDayClick) {
                    // La sélection reste visuelle ; l'action de modification
                    // est proposée dans le panneau de détails.
                  }
                }}
                aria-pressed={selected}
                aria-label={`${date.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}${window ? `, ${STATUS_LABELS[window.status] || window.status}` : ""}`}
                className={`group relative flex aspect-square min-h-0 items-center justify-center rounded-xl text-xs font-semibold transition sm:rounded-2xl sm:text-sm ${
                  !isCurrentMonth
                    ? "text-slate-300"
                    : "text-slate-700 hover:bg-slate-50"
                } ${
                  selected
                    ? "z-10 ring-2 ring-[#12364D] ring-offset-2"
                    : ""
                } ${
                  currentDay && !window
                    ? "border border-[#6EE7C8] bg-[#F0FCF8] text-[#087F70]"
                    : ""
                }`}
              >
                <span
                  className={`relative flex h-full w-full items-center justify-center rounded-xl transition sm:rounded-2xl ${
                    statusClass && isCurrentMonth ? statusClass : ""
                  } ${
                    !isCurrentMonth && statusClass ? "opacity-30" : ""
                  }`}
                >
                  {date.getDate()}

                  {currentDay && window && (
                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-white sm:bottom-1.5 sm:h-1.5 sm:w-1.5" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-x-4 gap-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <div key={status} className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                status === "available"
                  ? "bg-[#0F9F87]"
                  : status === "partially_available"
                    ? "bg-amber-400"
                    : status === "unavailable"
                      ? "bg-rose-400"
                      : "bg-blue-600"
              }`}
            />
            <span className="text-[11px] font-medium text-slate-600">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Détails de la date sélectionnée */}
      {selectedDate && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-slate-100 bg-gradient-to-r from-[#F0FCF8] to-white p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#087F70] shadow-sm ring-1 ring-slate-100">
              <CalendarIcon size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Jour sélectionné
              </p>
              <p className="mt-1 text-sm font-bold capitalize text-[#12364D]">
                {selectedDate.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            {isToday(selectedDate) && (
              <span className="rounded-full border border-[#6EE7C8] bg-[#E7FAF4] px-2.5 py-1 text-[10px] font-semibold text-[#087F70]">
                Aujourd'hui
              </span>
            )}
          </div>

          <div className="p-4 sm:p-5">
            {selectedWindow ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    size={19}
                    className="mt-0.5 shrink-0 text-[#0F9F87]"
                  />
                  <div>
                    <p className="text-sm font-bold text-[#12364D]">
                      {STATUS_LABELS[selectedWindow.status] ||
                        selectedWindow.status}
                    </p>
                    {selectedWindow.type && (
                      <p className="mt-1 text-xs text-slate-500">
                        Type : {selectedWindow.type}
                      </p>
                    )}
                  </div>
                </div>

                {selectedWindow.workload_value != null && (
                  <div className="flex items-start gap-3">
                    <Clock
                      size={17}
                      className="mt-0.5 shrink-0 text-slate-400"
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        Charge de travail
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {selectedWindow.workload_value}
                        {selectedWindow.workload_unit === "percentage"
                          ? "%"
                          : selectedWindow.workload_unit === "hours_per_week"
                            ? " h/sem"
                            : " j/sem"}
                      </p>
                    </div>
                  </div>
                )}

                {selectedWindow.location_city && (
                  <div className="flex items-start gap-3">
                    <MapPin
                      size={17}
                      className="mt-0.5 shrink-0 text-slate-400"
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        Localisation
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {selectedWindow.location_city}
                      </p>
                    </div>
                  </div>
                )}

                {selectedWindow.notes && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-600">
                      {selectedWindow.notes}
                    </p>
                  </div>
                )}

                {onDayClick && (
                  <button
                    type="button"
                    onClick={() => onDayClick(selectedWindow)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#12364D] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1A3266] sm:w-auto"
                  >
                    Modifier cette disponibilité
                    <ChevronRight size={16} className="text-[#6EE7C8]" />
                  </button>
                )}
              </div>
            ) : (
              <div className="py-4 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <CalendarIcon size={19} />
                </div>
                <p className="mt-3 text-sm font-semibold text-[#12364D]">
                  Aucune disponibilité
                </p>
                <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                  Aucune période n'est déclarée pour cette date.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
