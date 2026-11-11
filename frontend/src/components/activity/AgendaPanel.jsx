import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, Video, CalendarDays } from "lucide-react";
import { card, Empty } from "./shared";
import {
  EVENT_META, eventsOnDay, upcomingEvents, canJoin, joinInterview, countdown, sameDay, startOfDay, MIN,
} from "./insights";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

function monthGrid(cursor) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(1 - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

const timeLabel = (e) =>
  e.allDay ? "Journée" : e.start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

/* ---------- Bouton « Rejoindre » ---------- */
export function JoinButton({ ev, now }) {
  const navigate = useNavigate();
  if (ev.type !== "interview" || ev.mode !== "visio" || !ev.link) return null;
  if (now.getTime() > ev.start.getTime() + 3 * 3600000) return null;
  const open = canJoin(ev, now);
  return (
    <button
      type="button"
      disabled={!open}
      onClick={() => joinInterview(ev.link, navigate)}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition ${
        open
          ? "bg-[#16B8B1] text-[#0B1F33] hover:bg-[#0F9691]"
          : "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-slate-500"
      }`}
    >
      <Video size={13} /> {open ? "Rejoindre" : `Dans ${countdown(ev.start - now)}`}
    </button>
  );
}

function EventRow({ ev, now }) {
  const meta = EVENT_META[ev.type];
  return (
    <li className="flex items-start gap-3 rounded-2xl bg-slate-50/70 p-3.5 dark:bg-white/5">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.chip}`}>{meta.label}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{timeLabel(ev)}</span>
        </div>
        <Link to={ev.to} className="mt-1 block truncate text-[13px] font-medium text-slate-800 hover:text-teal-600 dark:text-white dark:hover:text-teal-400">
          {ev.title}
        </Link>
        {ev.subtitle && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{ev.subtitle}</p>}
        {ev.location && (
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400"><MapPin size={11} />{ev.location}</p>
        )}
      </div>
      <JoinButton ev={ev} now={now} />
    </li>
  );
}

/* ---------- Bandeau de rappel (24 h avant) ---------- */
export function ReminderBanner({ ev, now }) {
  if (!ev) return null;
  const diff = ev.start.getTime() - now.getTime();
  if (diff > 24 * 3600000) return null;
  const live = canJoin(ev, now);
  const started = diff <= 0;
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-rose-50 to-amber-50 p-4 ring-1 ring-rose-100 dark:from-rose-500/10 dark:to-amber-500/10 dark:ring-rose-500/20 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-white">
          {started ? "Votre entretien est en cours" : live ? "Votre entretien commence bientôt" : `Entretien dans ${countdown(diff)}`}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-600 dark:text-slate-300">
          {ev.title}{ev.subtitle ? ` · ${ev.subtitle}` : ""} · {ev.start.toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
      <JoinButton ev={ev} now={now} />
    </div>
  );
}

/* ---------- Carte « prochain entretien » ---------- */
export function NextEvent({ ev, now }) {
  if (!ev) return null;
  const diff = ev.start.getTime() - now.getTime();
  return (
    <section className={`${card} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between`}>
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-500/10">
          <CalendarDays size={21} />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-rose-500 dark:text-rose-300">
            Prochain entretien · {diff > 0 ? `dans ${countdown(diff)}` : "en cours"}
          </p>
          <Link to={ev.to} className="block truncate text-[15px] font-semibold text-slate-800 hover:text-teal-600 dark:text-white">{ev.title}</Link>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {ev.subtitle}{ev.subtitle ? " · " : ""}
            {ev.start.toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
      <JoinButton ev={ev} now={now} />
    </section>
  );
}

/* ---------- Mini agenda (colonne droite de l'accueil) ---------- */
export function AgendaMini({ events, now, onSeeAll }) {
  const items = useMemo(() => upcomingEvents(events, now, 30).slice(0, 3), [events, now]);
  return (
    <section className={`${card} p-4`}>
      <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-white">Prochains rendez-vous</h3>
      {items.length === 0 ? (
        <p className="rounded-2xl bg-slate-50/80 py-5 text-center text-xs text-slate-500 dark:bg-white/5 dark:text-slate-400">Rien de prévu dans les 30 prochains jours.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((e) => (
            <li key={e.id} className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-50 text-center dark:bg-white/5">
                <span className="text-[9px] font-medium uppercase text-slate-400">{e.start.toLocaleDateString("fr-FR", { month: "short" })}</span>
                <span className="text-sm font-semibold leading-none text-slate-800 dark:text-white">{e.start.getDate()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">{e.title}</p>
                <p className="text-[10px] text-slate-400">{EVENT_META[e.type].label} · {timeLabel(e)}</p>
              </div>
              <JoinButton ev={e} now={now} />
            </li>
          ))}
        </ul>
      )}
      <button onClick={onSeeAll} className="mt-3 w-full rounded-xl py-2 text-xs font-medium text-teal-600 transition hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-500/10">
        Ouvrir l'agenda →
      </button>
    </section>
  );
}

/* ---------- Agenda complet ---------- */
export default function AgendaPanel({ events, now }) {
  const [cursor, setCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selected, setSelected] = useState(() => startOfDay(now));

  const days = useMemo(() => monthGrid(cursor), [cursor]);
  const dayEvents = useMemo(() => eventsOnDay(events, selected), [events, selected]);
  const soon = useMemo(() => upcomingEvents(events, now, 30), [events, now]);

  const monthLabel = cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const move = (n) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1));
  const today = () => { setCursor(new Date(now.getFullYear(), now.getMonth(), 1)); setSelected(startOfDay(now)); };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <section className={`${card} p-5`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold capitalize text-slate-800 dark:text-white">{monthLabel}</h3>
          <div className="flex items-center gap-1">
            <button onClick={() => move(-1)} aria-label="Mois précédent" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><ChevronLeft size={16} /></button>
            <button onClick={today} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10">Aujourd'hui</button>
            <button onClick={() => move(1)} aria-label="Mois suivant" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><ChevronRight size={16} /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((w, i) => <span key={i} className="pb-1 text-[10px] font-medium text-slate-400">{w}</span>)}
          {days.map((d) => {
            const inMonth = d.getMonth() === cursor.getMonth();
            const evs = eventsOnDay(events, d);
            const points = evs.filter((e) => e.type !== "availability");
            const avail = evs.some((e) => e.type === "availability");
            const isToday = sameDay(d, now);
            const isSel = sameDay(d, selected);
            return (
              <button
                key={d.toISOString()}
                type="button"
                onClick={() => setSelected(startOfDay(d))}
                className={`flex h-14 flex-col items-center justify-start gap-1 rounded-xl pt-1.5 text-xs transition ${
                  isSel
                    ? "bg-[#0B1F33] text-white dark:bg-[#16B8B1] dark:text-[#0B1F33]"
                    : `${inMonth ? "text-slate-700 dark:text-slate-200" : "text-slate-300 dark:text-slate-600"} ${avail ? "bg-sky-50/80 dark:bg-sky-500/5" : ""} hover:bg-slate-50 dark:hover:bg-white/5`
                }`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full ${isToday && !isSel ? "bg-teal-100 font-semibold text-teal-700 dark:bg-teal-500/20 dark:text-teal-300" : ""}`}>
                  {d.getDate()}
                </span>
                <span className="flex gap-0.5">
                  {points.slice(0, 3).map((e) => (
                    <i key={e.id} className={`h-1.5 w-1.5 rounded-full ${isSel ? "bg-white/80 dark:bg-[#0B1F33]" : EVENT_META[e.type].dot}`} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          {Object.entries(EVENT_META).map(([k, m]) => (
            <li key={k} className="inline-flex items-center gap-1.5"><i className={`h-2 w-2 rounded-full ${m.dot}`} />{m.label}</li>
          ))}
        </ul>
      </section>

      <div className="space-y-5">
        <section className={`${card} p-5`}>
          <h3 className="mb-3 text-sm font-semibold capitalize text-slate-800 dark:text-white">
            {selected.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </h3>
          {dayEvents.length === 0 ? (
            <Empty compact icon={CalendarDays} text="Rien de prévu ce jour-là." />
          ) : (
            <ul className="space-y-2.5">{dayEvents.map((e) => <EventRow key={e.id} ev={e} now={now} />)}</ul>
          )}
        </section>

        <section className={`${card} p-5`}>
          <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-white">À venir · 30 jours</h3>
          {soon.length === 0 ? (
            <Empty compact text="Aucun entretien ni début de mission prochainement." />
          ) : (
            <ul className="space-y-2.5">
              {soon.slice(0, 6).map((e) => (
                <li key={e.id}>
                  <p className="mb-1 text-[10px] font-medium capitalize text-slate-400">
                    {e.start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                  <ul><EventRow ev={e} now={now} /></ul>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}