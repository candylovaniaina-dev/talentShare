import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { card } from "./shared";

const fmt = (d) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

function Delta({ delta }) {
  if (!delta) {
    return <span className="inline-flex items-center gap-1 text-[11px] text-slate-400"><Minus size={11} /> stable</span>;
  }
  const up = delta > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${up ? "text-teal-600 dark:text-teal-400" : "text-rose-500 dark:text-rose-400"}`}>
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {up ? "+" : ""}{delta} vs sem. dernière
    </span>
  );
}

function Goals({ goals }) {
  return (
    <ul className="space-y-3.5">
      {goals.map((g) => {
        const pct = Math.min(100, Math.round((g.value / g.target) * 100));
        const done = pct >= 100;
        return (
          <li key={g.key}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className={`font-medium ${done ? "text-teal-600 dark:text-teal-400" : "text-slate-700 dark:text-slate-200"}`}>{g.label}</span>
              <span className="tabular-nums text-slate-500 dark:text-slate-400">{g.value}{g.unit || ""} / {g.target}{g.unit || ""}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
              <div className={`h-full rounded-full transition-all duration-700 ${done ? "bg-teal-400" : "bg-[#3478E8]/70"}`} style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Funnel({ funnel }) {
  const max = Math.max(funnel[0].value, 1);
  return (
    <ul className="space-y-3">
      {funnel.map((f, i) => {
        const pct = Math.round((f.value / max) * 100);
        return (
          <li key={f.key}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">{f.label}</span>
              <span className="tabular-nums font-medium text-slate-800 dark:text-white">{f.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#16B8B1] to-[#3478E8]"
                style={{ width: `${f.value ? Math.max(pct, 4) : 0}%`, opacity: 1 - i * 0.12 }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function WeekBars({ series }) {
  const { labels, applications, interviews } = series;
  const max = Math.max(4, ...applications, ...interviews);
  const W = 480, H = 150, pad = 8, base = 124;
  const slot = (W - pad * 2) / labels.length;
  const bw = Math.min(14, slot / 3);
  const h = (v) => (v / max) * (base - 14);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Activité sur 8 semaines">
      <line x1={pad} x2={W - pad} y1={base} y2={base} stroke="currentColor" className="text-slate-200 dark:text-white/10" />
      {labels.map((d, i) => {
        const cx = pad + slot * i + slot / 2;
        return (
          <g key={i}>
            <rect x={cx - bw - 1} y={base - h(applications[i])} width={bw} height={h(applications[i])} rx="4" fill="#16B8B1" opacity="0.85">
              <title>{`Candidatures : ${applications[i]}`}</title>
            </rect>
            <rect x={cx + 1} y={base - h(interviews[i])} width={bw} height={h(interviews[i])} rx="4" fill="#3478E8" opacity="0.7">
              <title>{`Entretiens : ${interviews[i]}`}</title>
            </rect>
            <text x={cx} y={H - 8} textAnchor="middle" fontSize="10" className="fill-slate-400">
              {d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function WeeklyReport({ report, compact = false }) {
  const { metrics, goals, summary, funnel, series, responseRate } = report;

  return (
    <div className="space-y-5">
      <section className={`${card} p-5 sm:p-6`}>
        <p className="text-[11px] font-medium text-teal-600 dark:text-teal-400">
          Rapport de la semaine · {fmt(report.weekStart)} – {fmt(report.weekEnd)}
        </p>
        <p className="mt-2 max-w-2xl text-[15px] font-medium leading-7 text-slate-800 dark:text-white">{summary}</p>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
          {metrics.map((m) => (
            <div key={m.key} className="rounded-2xl bg-slate-50/80 p-4 dark:bg-white/5">
              <p className="text-2xl font-semibold tabular-nums text-slate-800 dark:text-white">{m.value}</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{m.label}</p>
              <div className="mt-1.5"><Delta delta={m.delta} /></div>
            </div>
          ))}
        </div>
      </section>

      <section className={`${card} p-5 sm:p-6`}>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Objectifs de la semaine</h3>
        <p className="mb-4 mt-0.5 text-xs text-slate-500 dark:text-slate-400">Ils se mettent à jour automatiquement.</p>
        <Goals goals={goals} />
      </section>

      {!compact && (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className={`${card} p-5 sm:p-6`}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Parcours de vos candidatures</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">De l'envoi à l'acceptation.</p>
              </div>
              {responseRate !== null && (
                <span className="rounded-full bg-teal-50 px-3 py-1 text-[11px] font-medium text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                  {responseRate} % de réponse
                </span>
              )}
            </div>
            {funnel[0].value === 0 ? (
              <p className="rounded-2xl bg-slate-50/80 p-5 text-center text-xs text-slate-500 dark:bg-white/5 dark:text-slate-400">
                Envoyez votre première candidature pour voir votre parcours.
              </p>
            ) : (
              <Funnel funnel={funnel} />
            )}
          </section>

          <section className={`${card} p-5 sm:p-6`}>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Activité sur 8 semaines</h3>
            <div className="mb-3 mt-1 flex gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#16B8B1]" /> Candidatures</span>
              <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#3478E8]" /> Entretiens</span>
            </div>
            <WeekBars series={series} />
          </section>
        </div>
      )}
    </div>
  );
}

export function GoalsMini({ goals }) {
  return <Goals goals={goals} />;
}